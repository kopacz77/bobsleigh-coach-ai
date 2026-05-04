"""Plan API endpoints with coach approval workflow.

Provides endpoints for plan generation, review queue, approval, rejection,
and athlete current-plan retrieval. Coach endpoints require coach role;
athlete endpoints use the authenticated user's athlete profile.

Follows patterns from coach.py and training.py: raw dicts from Supabase,
no response_model, _get_user_role helper, try/except blocks,
Depends(get_current_user).
"""

import logging
from datetime import date, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.db.session import get_supabase
from app.services.coach_service import CoachService
from app.services.injury_risk_service import InjuryRiskService
from app.services.plan_generation_service import PlanGenerationService

logger = logging.getLogger(__name__)

router = APIRouter()


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


async def _get_athlete_id_for_user(user) -> str:
    """Look up the athlete_id for the authenticated user.

    Args:
        user: Supabase User object with .id attribute (UUID string).

    Returns:
        The athlete UUID string.

    Raises:
        HTTPException 404 if no athlete profile exists for this user.
    """
    sb = get_supabase()
    result = (
        sb.table("athletes")
        .select("id")
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="No athlete profile found for this user",
        )
    return result.data[0]["id"]


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

        coach_service = CoachService()
        coach_id = await coach_service.get_coach_id(user.id)
        athlete_ids = await coach_service.get_athlete_ids(coach_id)

        if not athlete_ids:
            return []

        sb = get_supabase()

        # Query pending plans for all coached athletes
        result = (
            sb.table("weekly_plans")
            .select(
                "id, athlete_id, week_start, week_end, training_phase, "
                "status, version, injury_risk_score, injury_risk_factors, "
                "generation_metadata, created_at"
            )
            .in_("athlete_id", athlete_ids)
            .eq("status", "pending_review")
            .order("week_start")
            .order("created_at")
            .execute()
        )

        plans = result.data

        # Batch-fetch athlete names for the response
        if plans:
            unique_athlete_ids = list({p["athlete_id"] for p in plans})
            athletes_result = (
                sb.table("athletes")
                .select("id, first_name, last_name")
                .in_("id", unique_athlete_ids)
                .execute()
            )
            name_map = {
                a["id"]: f"{a['first_name']} {a['last_name']}"
                for a in athletes_result.data
            }
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

        coach_service = CoachService()
        coach_id = await coach_service.get_coach_id(user.id)
        athlete_ids = await coach_service.get_athlete_ids(coach_id)

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

        sb = get_supabase()

        # Fetch the plan and verify status
        plan_result = (
            sb.table("weekly_plans")
            .select("id, status, athlete_id")
            .eq("id", plan_id)
            .execute()
        )
        if not plan_result.data:
            raise HTTPException(status_code=404, detail="Plan not found")

        plan = plan_result.data[0]
        if plan["status"] != "pending_review":
            raise HTTPException(
                status_code=400,
                detail=f"Plan cannot be approved (current status: {plan['status']})",
            )

        # Get coach_id for approved_by field
        coach_service = CoachService()
        coach_id = await coach_service.get_coach_id(user.id)

        # Update plan status
        update_result = (
            sb.table("weekly_plans")
            .update(
                {
                    "status": "approved",
                    "approved_at": datetime.utcnow().isoformat(),
                    "approved_by": coach_id,
                }
            )
            .eq("id", plan_id)
            .execute()
        )

        return update_result.data[0] if update_result.data else {}
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

        sb = get_supabase()

        # Fetch the plan and verify status
        plan_result = (
            sb.table("weekly_plans")
            .select("id, status, athlete_id, week_start")
            .eq("id", plan_id)
            .execute()
        )
        if not plan_result.data:
            raise HTTPException(status_code=404, detail="Plan not found")

        plan = plan_result.data[0]
        if plan["status"] != "pending_review":
            raise HTTPException(
                status_code=400,
                detail=f"Plan cannot be rejected (current status: {plan['status']})",
            )

        # Get coach_id for rejected_by field
        coach_service = CoachService()
        coach_id = await coach_service.get_coach_id(user.id)

        # Update plan status to rejected
        update_result = (
            sb.table("weekly_plans")
            .update(
                {
                    "status": "rejected",
                    "rejected_at": datetime.utcnow().isoformat(),
                    "rejected_by": coach_id,
                    "rejection_notes": body.rejection_notes,
                }
            )
            .eq("id", plan_id)
            .execute()
        )

        # Trigger regeneration in background (new version with parent_plan_id)
        plan_service = PlanGenerationService()
        background_tasks.add_task(
            plan_service.generate_plan,
            plan["athlete_id"],
            plan["week_start"],
        )

        return update_result.data[0] if update_result.data else {}
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
        athlete_id = await _get_athlete_id_for_user(user)

        # Calculate current week's Monday
        today = date.today()
        days_since_monday = today.weekday()  # 0=Mon, 6=Sun
        current_monday = (today - timedelta(days=days_since_monday)).isoformat()

        sb = get_supabase()
        result = (
            sb.table("weekly_plans")
            .select("*")
            .eq("athlete_id", athlete_id)
            .eq("status", "approved")
            .eq("week_start", current_monday)
            .execute()
        )

        if not result.data:
            from fastapi.responses import Response

            return Response(status_code=204)

        return result.data[0]
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch current plan: {str(e)}",
        )


# ---- Coach single-plan endpoint (must be after /current) ----


@router.get("/{plan_id}")
async def get_plan(plan_id: str, user=Depends(get_current_user)):
    """Get a single plan by ID with full plan_data.

    Requires coach role to view any plan.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        sb = get_supabase()
        result = (
            sb.table("weekly_plans")
            .select("*")
            .eq("id", plan_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Plan not found")

        return result.data[0]
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch plan: {str(e)}"
        )
