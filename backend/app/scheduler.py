"""APScheduler integration for automated weekly plan generation.

Two recurring jobs are registered:

1. ``weekly_plan_generation`` -- Saturday 22:00 (10 PM). Generates training
   plans for the upcoming week (Mon-Sun) for every active coach's roster.
   Coaches review/approve on Sunday or Monday before the training week starts.

2. ``unreviewed_plans_check`` -- Monday 08:00. Logs a warning for each coach
   that still has plans in ``pending_review`` status for the current week.
   Informational logging only -- in-app alerts are already computed on read
   (Phase 5/6 alerts system); push notifications are deferred.

The scheduler is gated by ``settings.ENABLE_SCHEDULER`` so test runs and
one-off scripts can disable it without changing application code.

Lifecycle is owned by ``app.main`` via a FastAPI lifespan context manager.
``start_scheduler()`` and ``shutdown_scheduler()`` are no-ops when the
scheduler is disabled or already in the desired state, making them safe to
call from tests.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings

logger = logging.getLogger(__name__)

# Module-level scheduler. AsyncIOScheduler is safe to instantiate at import
# time because it does not start an event loop until .start() is called.
scheduler = AsyncIOScheduler()


def _next_monday(today: date | None = None) -> date:
    """Return the date of the next Monday strictly after ``today``.

    If today is already Monday, returns Monday one week from now (the
    Saturday-night job is preparing the *upcoming* week, not today's week).
    """
    today = today or date.today()
    # weekday(): Mon=0..Sun=6. days_until_monday is 1..7 (never 0).
    days_until_monday = (7 - today.weekday()) % 7 or 7
    return today + timedelta(days=days_until_monday)


async def generate_weekly_plans_job() -> None:
    """Generate next-week training plans for every active coach's roster.

    Runs every Saturday at 22:00. Per-coach failures are caught and logged
    so one bad coach (e.g., empty roster, repo error) does not prevent the
    rest of the coaches from getting their plans generated.
    """
    # Lazy imports keep this module importable without pulling the full
    # service graph at startup, and avoid circular imports with services
    # that may transitively import config.
    from app.db.repositories.coach_repo import CoachRepository
    from app.services.plan_generation_service import PlanGenerationService

    week_start = _next_monday().isoformat()
    logger.info(
        "Starting weekly plan generation job for week_start=%s", week_start
    )

    try:
        coaches = CoachRepository().get_all_active()
    except Exception as exc:
        logger.exception("Failed to load coaches for plan generation: %s", exc)
        return

    if not coaches:
        logger.info("No active coaches found; nothing to generate")
        return

    service = PlanGenerationService()
    success_count = 0
    failure_count = 0

    for coach in coaches:
        coach_id = coach.get("id")
        if not coach_id:
            continue
        try:
            results = await service.generate_plans_batch(coach_id, week_start)
            success_count += 1
            logger.info(
                "Generated %d plan(s) for coach %s (week_start=%s)",
                len(results),
                coach_id,
                week_start,
            )
        except Exception as exc:
            failure_count += 1
            logger.exception(
                "Plan generation failed for coach %s: %s", coach_id, exc
            )

    logger.info(
        "Weekly plan generation complete: %d coach(es) succeeded, %d failed",
        success_count,
        failure_count,
    )


async def check_unreviewed_plans_job() -> None:
    """Log a warning for each coach with unreviewed plans for this week.

    Runs every Monday at 08:00. This is informational only -- the coach
    dashboard already surfaces unreviewed plans via the alerts system.
    """
    from app.db.repositories.coach_repo import CoachRepository
    from app.db.repositories.plan_repo import PlanRepository

    today = date.today()
    # Current week's Monday: weekday() is 0 on Monday, so subtracting it
    # gives the most recent Monday.
    current_monday = today - timedelta(days=today.weekday())
    week_start = current_monday.isoformat()

    logger.info(
        "Checking for unreviewed plans for week_start=%s", week_start
    )

    try:
        coach_repo = CoachRepository()
        plan_repo = PlanRepository()
        coaches = coach_repo.get_all_active()
    except Exception as exc:
        logger.exception("Failed to load coaches for unreviewed check: %s", exc)
        return

    for coach in coaches:
        coach_id = coach.get("id")
        if not coach_id:
            continue
        try:
            athlete_ids = coach_repo.get_athlete_ids(coach_id)
            if not athlete_ids:
                continue
            pending = plan_repo.get_pending_for_coach(athlete_ids)
            week_pending = [
                p for p in pending if p.get("week_start") == week_start
            ]
            if week_pending:
                logger.warning(
                    "Coach %s has %d unreviewed plan(s) for week_start=%s",
                    coach_id,
                    len(week_pending),
                    week_start,
                )
        except Exception as exc:
            logger.exception(
                "Unreviewed check failed for coach %s: %s", coach_id, exc
            )


def _register_jobs() -> None:
    """Register cron jobs on the module-level scheduler.

    Idempotent: uses ``replace_existing=True`` so re-registering on app
    reload does not duplicate jobs.
    """
    scheduler.add_job(
        generate_weekly_plans_job,
        trigger=CronTrigger(day_of_week="sat", hour=22, minute=0),
        id="weekly_plan_generation",
        replace_existing=True,
    )
    scheduler.add_job(
        check_unreviewed_plans_job,
        trigger=CronTrigger(day_of_week="mon", hour=8, minute=0),
        id="unreviewed_plans_check",
        replace_existing=True,
    )


def start_scheduler() -> None:
    """Start the background scheduler if enabled.

    No-op when ``settings.ENABLE_SCHEDULER`` is False or the scheduler is
    already running. Safe to call multiple times.
    """
    if not settings.ENABLE_SCHEDULER:
        logger.info("Scheduler disabled via ENABLE_SCHEDULER=False")
        return
    if scheduler.running:
        return
    _register_jobs()
    scheduler.start()
    logger.info(
        "Scheduler started: weekly_plan_generation (Sat 22:00), "
        "unreviewed_plans_check (Mon 08:00)"
    )


def shutdown_scheduler() -> None:
    """Stop the background scheduler if it is running.

    Safe to call when the scheduler was never started (e.g., when disabled
    in tests). ``wait=False`` so shutdown does not block app exit on
    long-running jobs.
    """
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler shutdown complete")
