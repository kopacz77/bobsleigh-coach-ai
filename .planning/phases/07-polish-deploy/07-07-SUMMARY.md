---
phase: 07-polish-deploy
plan: 07
subsystem: infra
tags: [apscheduler, cron, fastapi, lifespan, background-jobs, python]

# Dependency graph
requires:
  - phase: 06-ai-training-engine
    provides: PlanGenerationService.generate_plans_batch -- batch plan generation for a coach
  - phase: 07-polish-deploy
    provides: 07-03b CoachRepository.get_all_active and PlanRepository.get_pending_for_coach
provides:
  - Automated Saturday-night weekly plan generation for every active coach roster
  - Monday-morning unreviewed-plans logging hook
  - FastAPI lifespan-managed AsyncIOScheduler (replaces deprecated on_event startup)
  - ENABLE_SCHEDULER env toggle so tests and scripts can run without background jobs
affects: [07-08 (Cloud Run deploy), future notification/push work]

# Tech tracking
tech-stack:
  added: [apscheduler==3.10.4]
  patterns: [FastAPI lifespan, AsyncIOScheduler cron jobs, lazy service imports inside job bodies]

key-files:
  created:
    - backend/app/scheduler.py
  modified:
    - backend/app/main.py
    - backend/app/core/config.py
    - backend/requirements.txt
    - docker-compose.yml

key-decisions:
  - "Use AsyncIOScheduler so jobs share the FastAPI event loop -- no separate worker process required"
  - "Lazy import CoachRepository / PlanGenerationService / PlanRepository inside job bodies to avoid circular imports and keep app.scheduler cheap to import"
  - "Per-coach try/except so one coach's failure does not block others"
  - "ENABLE_SCHEDULER default True; tests/scripts opt out with ENABLE_SCHEDULER=false"
  - "scheduler.shutdown(wait=False) on app shutdown so long jobs do not block exit"
  - "Sat 22:00 + Mon 08:00 cron schedule matches plan: coaches review Sun/Mon before training week"

patterns-established:
  - "Scheduler module exposes start_scheduler()/shutdown_scheduler() helpers; lifecycle owned by app.main lifespan"
  - "Cron jobs use replace_existing=True so reload during dev does not duplicate jobs"
  - "Generation job computes next_monday and calls PlanGenerationService.generate_plans_batch per coach"

# Metrics
duration: ~3min
completed: 2026-05-28
---

# Phase 7 Plan 7: Automated Weekly Plan Generation Summary

**APScheduler-driven Saturday-night weekly plan generation for all coach rosters, wired into FastAPI via lifespan; Monday 08:00 hook logs unreviewed plans.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-28T04:12:03Z
- **Completed:** 2026-05-28T04:14:57Z
- **Tasks:** 1/1
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- New `backend/app/scheduler.py` module owns `AsyncIOScheduler` plus two cron-triggered async jobs:
  - `generate_weekly_plans_job` -- Saturday 22:00; iterates every active coach and calls `PlanGenerationService.generate_plans_batch(coach_id, next_monday)`. Per-coach try/except so one failure doesn't block the rest.
  - `check_unreviewed_plans_job` -- Monday 08:00; queries pending plans for current week and emits `logger.warning(...)` per coach with unreviewed plans (informational; existing alerts system already surfaces this on read).
- `app.main` now uses an `@asynccontextmanager` lifespan handler that calls `start_scheduler()` on boot and `shutdown_scheduler()` on exit. Replaces the deprecated `@app.on_event("startup")` pattern.
- New `Settings.ENABLE_SCHEDULER` (default True) so pytest runs and ad-hoc scripts can disable background jobs cleanly.
- `docker-compose.yml` backend service explicitly sets `ENABLE_SCHEDULER: "True"`.
- `apscheduler==3.10.4` pinned in `backend/requirements.txt`.

## Task Commits

1. **Task 1: APScheduler integration with Saturday night plan generation** -- `2e38231` (feat)

## Files Created/Modified

- `backend/app/scheduler.py` (created) -- `scheduler` instance, `generate_weekly_plans_job`, `check_unreviewed_plans_job`, `_next_monday`, `_register_jobs`, `start_scheduler`, `shutdown_scheduler`.
- `backend/app/main.py` (modified) -- added `lifespan` async context manager; passed `lifespan=lifespan` to `FastAPI(...)`.
- `backend/app/core/config.py` (modified) -- added `ENABLE_SCHEDULER: bool = True` to `Settings`.
- `backend/requirements.txt` (modified) -- added `apscheduler==3.10.4` under a new "Scheduling" section.
- `docker-compose.yml` (modified) -- backend `environment:` adds `ENABLE_SCHEDULER: "True"`.

## Decisions Made

- **AsyncIOScheduler over BackgroundScheduler**: Shares the FastAPI event loop instead of running its own thread pool -- jobs can naturally `await` async services like `PlanGenerationService.generate_plans_batch`. No separate worker process needed.
- **Lazy imports inside job bodies**: `CoachRepository`, `PlanRepository`, and `PlanGenerationService` are imported inside the job functions, not at module top. This keeps `app.scheduler` cheap to import (lifespan can call `start_scheduler()` without pulling the full service graph) and avoids any future circular-import surface.
- **Per-coach try/except in batch job**: A single coach with an empty roster or repo error must not abort generation for the other 50 coaches. Failures are `logger.exception(...)`'d with the coach id; success/failure counts are emitted at job end.
- **Next-Monday helper rule**: `_next_monday()` always returns the *strict* next Monday. Even on Monday itself it returns the following Monday -- the Saturday-night job is preparing the *upcoming* week, not the in-progress one.
- **`scheduler.shutdown(wait=False)`**: App shutdown should not block on long-running plan generation; if a job is mid-flight it's cancelled cleanly rather than holding the process open.
- **ENABLE_SCHEDULER env toggle**: Production/dev default is True; pytest and one-off scripts (e.g., `scripts/test_weekly_plan.py`) set False so importing `app.main` doesn't spin up a background loop.

## Deviations from Plan

None -- plan executed exactly as written. Minor structural additions for ergonomics:
- Added `_next_monday(today=None)` helper instead of inlining the date math (testable in isolation, matches the plan's formula `today + timedelta(days=(7 - today.weekday()) % 7 or 7)`).
- Factored `_register_jobs()`, `start_scheduler()`, `shutdown_scheduler()` so the lifespan handler in `app.main` stays a clean two-call site (`start_scheduler()` / `shutdown_scheduler()`).

## Issues Encountered

- **Pre-existing test failure on `tests/test_performance_api.py::test_get_performance_metrics`** (401 vs 200): Confirmed via `git stash` that this failure exists on `main` unrelated to this plan -- the performance API requires auth and the legacy test predates that. Not in scope for this plan.
- **Pre-existing test path issue**: `pytest` from `backend/` requires `PYTHONPATH=.` because there's no `pyproject.toml`/`pytest.ini` setting `pythonpath`. Pre-existing; not addressed here.

## Verification

- `python -c "from app.scheduler import scheduler; print('Scheduler imports OK')"` -> ok
- `python -c "from app.main import app; print('App with lifespan imports OK')"` -> ok
- `grep apscheduler backend/requirements.txt` -> `apscheduler==3.10.4`
- Live smoke: `start_scheduler()` registers two jobs with correct cron triggers:
  - `weekly_plan_generation | cron[day_of_week='sat', hour='22', minute='0']`
  - `unreviewed_plans_check | cron[day_of_week='mon', hour='8', minute='0']`
- Live smoke: `ENABLE_SCHEDULER=False` causes `start_scheduler()` to no-op (scheduler.running == False).
- `_next_monday` returns 2026-06-01 from any of {Fri 2026-05-29, Sat 2026-05-30, Sun 2026-05-31} and 2026-06-08 from Mon 2026-06-01 -- correct strict-next-Monday semantics.

## User Setup Required

None -- no external service configuration required. The scheduler runs in-process with the FastAPI worker. Local Docker compose already exports `ENABLE_SCHEDULER=True`. For Cloud Run (see 07-08), the same env var should be set to True on the backend service.

## Next Phase Readiness

Phase 7 is complete. Final wave's automated plan-generation hook is now live alongside the local Docker stack (07-04) and repository migrations (07-03a/07-03b). Coaches will receive auto-generated pending plans on Saturday nights and a Monday-morning log signal for any that remain unreviewed.

Operational note for deploy: If the backend is horizontally scaled (multiple Cloud Run instances), the current in-process scheduler will fire the Saturday job on every instance. Recommended follow-up (not in scope for 07-07): gate the cron jobs to a single-instance "leader" or set `min-instances/max-instances=1` on the backend service.

---
*Phase: 07-polish-deploy*
*Completed: 2026-05-28*
