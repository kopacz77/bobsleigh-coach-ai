"""Plan API endpoints with coach approval workflow.

Provides endpoints for plan generation, review queue, approval, rejection,
and athlete current-plan retrieval. Coach endpoints require coach role;
athlete endpoints use the authenticated user's athlete profile.

All data access goes through the repository layer (no direct Supabase calls).
"""

import logging
from datetime import date, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.db.repositories.athlete_repo import AthleteRepository
from app.db.repositories.coach_repo import CoachRepository
from app.db.repositories.plan_repo import PlanRepository
from app.services.injury_risk_service import InjuryRiskService
from app.services.morning_adaptation_service import MorningAdaptationService
from app.services.plan_generation_service import PlanGenerationService

logger = logging.getLogger(__name__)

router = APIRouter()

# Module-level repository singletons
plan_repo = PlanRepository()
athlete_repo = AthleteRepository()
coach_repo = CoachRepository()


# ---- Request body schemas ----


class GeneratePlanRequest(BaseModel):
    """Request body for single plan generation."""

    athlete_id: str
    week_start: str = Field(
        ...,
        description="Monday date in YYYY-MM-DD format",
    )


class GenerateBatchRequest(BaseModel):
    """Request body for batch plan generation."""

    week_start: str = Field(
        ...,
        description="Monday date in YYYY-MM-DD format",
    )


class RejectPlanRequest(BaseModel):
    """Request body for plan rejection."""

    rejection_notes: str = Field(
        ...,
        min_length=1,
        description="Reason for rejecting the plan (required, non-empty)",
    )


# ---- Helpers ----


def _get_user_role(user) -> str:
    """Extract role from user metadata (app_metadata preferred, user_metadata fallback)."""
    role = "athlete"
    if hasattr(user, "app_metadata") and user.app_metadata:
        role = user.app_metadata.get("role", "athlete")
    if role == "athlete" and hasattr(user, "user_metadata") and user.user_metadata:
        role = user.user_metadata.get("role", "athlete")
    return role


def _get_athlete_id_for_user(user) -> str:
    """Look up the athlete_id for the authenticated user.

    Args:
        user: Auth user object with .id attribute (UUID string).

    Returns:
        The athlete UUID string.

    Raises:
        HTTPException 404 if no athlete profile exists for this user.
    """
    athlete_id = athlete_repo.get_id_by_user_id(user.id)
    if not athlete_id:
        raise HTTPException(
            status_code=404,
            detail="No athlete profile found for this user",
        )
    return athlete_id


def _get_coach_id_for_user(user) -> str:
    """Look up the coach_id for the authenticated user.

    Args:
        user: Auth user object with .id attribute (UUID string).

    Returns:
        The coach UUID string.

    Raises:
        ValueError: If no coach record exists for this user.
    """
    coach_id = coach_repo.get_coach_id_by_user_id(user.id)
    if not coach_id:
        raise ValueError(f"No coach record found for user {user.id}")
    return coach_id


# ---- Coach-only endpoints ----


@router.get("/pending")
async def get_pending_plans(user=Depends(get_current_user)):
    """Get all plans with status 'pending_review' for the coach's athletes.

    Returns plans ordered by week_start ASC, created_at ASC, with athlete
    name joined from the athletes table. Requires coach role.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        coach_id = _get_coach_id_for_user(user)
        athlete_ids = coach_repo.get_athlete_ids(coach_id)

        if not athlete_ids:
            return []

        # Query pending plans for all coached athletes
        plans = plan_repo.get_pending_for_coach(athlete_ids)

        # Batch-fetch athlete names for the response
        if plans:
            unique_athlete_ids = list({p["athlete_id"] for p in plans})
            name_map = plan_repo.get_athlete_names(unique_athlete_ids)
            for plan in plans:
                plan["athlete_name"] = name_map.get(
                    plan["athlete_id"], "Unknown"
                )

        return plans
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch pending plans: {str(e)}"
        )


@router.post("/generate")
async def generate_plan(body: GeneratePlanRequest, user=Depends(get_current_user)):
    """Generate a training plan for a single athlete.

    Validates week_start is a Monday, generates the plan via
    PlanGenerationService, and attaches an InjuryRiskService assessment.
    Requires coach role.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        # Validate week_start is a Monday
        try:
            start_date = datetime.strptime(body.week_start, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="week_start must be in YYYY-MM-DD format",
            )

        if start_date.weekday() != 0:
            raise HTTPException(
                status_code=400,
                detail=f"week_start must be a Monday, got {start_date.strftime('%A')}",
            )

        # Generate the plan
        plan_service = PlanGenerationService()
        plan = await plan_service.generate_plan(body.athlete_id, body.week_start)

        # Assess injury risk and attach to response
        injury_service = InjuryRiskService()
        injury_risk = await injury_service.assess_risk(body.athlete_id)
        plan["injury_risk"] = injury_risk

        return plan
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate plan: {str(e)}"
        )


@router.post("/generate-batch")
async def generate_batch(
    body: GenerateBatchRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    """Generate plans for all athletes on the coach's roster.

    Uses FastAPI BackgroundTasks to avoid HTTP timeout. Returns
    immediately with the number of athletes being processed.
    Requires coach role.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        # Validate week_start is a Monday
        try:
            start_date = datetime.strptime(body.week_start, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="week_start must be in YYYY-MM-DD format",
            )

        if start_date.weekday() != 0:
            raise HTTPException(
                status_code=400,
                detail=f"week_start must be a Monday, got {start_date.strftime('%A')}",
            )

        coach_id = _get_coach_id_for_user(user)
        athlete_ids = coach_repo.get_athlete_ids(coach_id)

        if not athlete_ids:
            return {
                "message": "No athletes on roster",
                "athlete_count": 0,
            }

        # Schedule batch generation as a background task
        plan_service = PlanGenerationService()
        background_tasks.add_task(
            plan_service.generate_plans_batch,
            coach_id,
            body.week_start,
        )

        return {
            "message": f"Generating plans for {len(athlete_ids)} athletes",
            "athlete_count": len(athlete_ids),
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start batch generation: {str(e)}",
        )


@router.post("/{plan_id}/approve")
async def approve_plan(plan_id: str, user=Depends(get_current_user)):
    """Approve a pending plan.

    Verifies the plan exists and has status 'pending_review', then
    transitions it to 'approved'. Requires coach role.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        # Fetch the plan and verify status
        plan = plan_repo.get_by_id(plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        if plan["status"] != "pending_review":
            raise HTTPException(
                status_code=400,
                detail=f"Plan cannot be approved (current status: {plan['status']})",
            )

        # Get coach_id for approved_by field
        coach_id = _get_coach_id_for_user(user)

        # Update plan status
        result = plan_repo.update_status(plan_id, "approved", coach_id)
        return result if result else {}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to approve plan: {str(e)}"
        )


@router.post("/{plan_id}/reject")
async def reject_plan(
    plan_id: str,
    body: RejectPlanRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    """Reject a pending plan with feedback.

    Stores rejection_notes for the feedback learning loop. Triggers
    regeneration of a new plan version in the background with
    parent_plan_id set for lineage tracking. Requires coach role.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        # Fetch the plan and verify status
        plan = plan_repo.get_by_id(plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        if plan["status"] != "pending_review":
            raise HTTPException(
                status_code=400,
                detail=f"Plan cannot be rejected (current status: {plan['status']})",
            )

        # Get coach_id for rejected_by field
        coach_id = _get_coach_id_for_user(user)

        # Update plan status to rejected
        result = plan_repo.update_status(
            plan_id, "rejected", coach_id, notes=body.rejection_notes
        )

        # Trigger regeneration in background (new version with parent_plan_id)
        plan_service = PlanGenerationService()
        background_tasks.add_task(
            plan_service.generate_plan,
            plan["athlete_id"],
            plan["week_start"],
        )

        return result if result else {}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to reject plan: {str(e)}"
        )


# ---- Athlete endpoint ----
# NOTE: /current must be registered BEFORE /{plan_id} to prevent
# FastAPI from matching "current" as a plan_id path parameter.


@router.get("/current")
async def get_current_plan(user=Depends(get_current_user)):
    """Get the athlete's approved plan for the current week.

    Calculates the current week's Monday and returns the approved plan
    for that week. Returns 204 No Content if no approved plan exists.
    """
    try:
        athlete_id = _get_athlete_id_for_user(user)

        # Calculate current week's Monday
        today = date.today()
        days_since_monday = today.weekday()  # 0=Mon, 6=Sun
        current_monday = (today - timedelta(days=days_since_monday)).isoformat()

        plan = plan_repo.get_current_for_athlete(athlete_id, current_monday)

        if not plan:
            return Response(status_code=204)

        return plan
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch current plan: {str(e)}",
        )


@router.get("/today")
async def get_today_workout(user=Depends(get_current_user)):
    """Get today's workout from the approved plan with morning adaptation.

    Fetches the current week's approved plan, extracts today's day entry,
    and applies readiness-based load adaptation from the morning check-in.
    Returns 204 No Content if no approved plan exists for this week.
    This is an athlete endpoint (no coach role required).

    NOTE: /today must be registered BEFORE /{plan_id} to prevent
    FastAPI from matching "today" as a plan_id path parameter.
    """
    try:
        athlete_id = _get_athlete_id_for_user(user)

        # Calculate current week's Monday
        today = date.today()
        days_since_monday = today.weekday()  # 0=Mon, 6=Sun
        current_monday = (today - timedelta(days=days_since_monday)).isoformat()

        plan = plan_repo.get_today_for_athlete(athlete_id, current_monday)

        if not plan:
            return Response(status_code=204)

        plan_data = plan.get("plan_data", {})
        days = plan_data.get("days", [])

        # Find today's entry by matching day_number (Monday=1, Sunday=7)
        today_day_number = today.weekday() + 1  # weekday() is 0=Mon; we want 1=Mon
        today_date_str = today.isoformat()

        today_plan_day = None
        for day in days:
            # Match by date first (most precise), then by day_number
            if day.get("date") == today_date_str:
                today_plan_day = day
                break
            if day.get("day_number") == today_day_number:
                today_plan_day = day
                break

        if today_plan_day is None:
            return Response(status_code=204)

        # If today is a rest day, return with a message (no adaptation needed)
        if today_plan_day.get("is_rest_day"):
            return {
                **today_plan_day,
                "adaptation": {
                    "applied": False,
                    "readiness_score": None,
                    "multiplier": 1.0,
                    "message": "Rest day - recovery is training too",
                    "coach_alert": False,
                },
            }

        # Apply morning adaptation based on wellness check-in
        adaptation_service = MorningAdaptationService()
        adapted_day = await adaptation_service.adapt_workout(
            today_plan_day, user.id
        )

        return adapted_day
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch today's workout: {str(e)}",
        )


# ---- Coach single-plan endpoint (must be after /current and /today) ----


@router.get("/{plan_id}")
async def get_plan(plan_id: str, user=Depends(get_current_user)):
    """Get a single plan by ID with full plan_data.

    Requires coach role to view any plan.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        plan = plan_repo.get_by_id(plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        return plan
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch plan: {str(e)}"
        )
