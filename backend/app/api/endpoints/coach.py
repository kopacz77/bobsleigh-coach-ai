"""Coach endpoints for roster management, PMC overview, and alerts.

Provides endpoints for coaches to manage their athlete roster, view
multi-athlete PMC summaries, and receive computed alerts for concerning
trends. All endpoints require coach role in app_metadata/user_metadata.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.db.session import get_supabase
from app.services.coach_service import CoachService

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_user_role(user) -> str:
    """Extract role from user metadata (app_metadata preferred, user_metadata fallback)."""
    role = "athlete"
    if hasattr(user, "app_metadata") and user.app_metadata:
        role = user.app_metadata.get("role", "athlete")
    if role == "athlete" and hasattr(user, "user_metadata") and user.user_metadata:
        role = user.user_metadata.get("role", "athlete")
    return role


@router.get("/roster")
async def get_coach_roster(user=Depends(get_current_user)):
    """Get the coach's athlete roster with joined athlete data.

    Returns list of active coaching relationships with athlete details
    (name, email, active status). Requires coach role.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        coach_service = CoachService()
        coach_id = await coach_service.get_coach_id(user.id)
        return await coach_service.get_roster(coach_id)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch roster: {str(e)}"
        )


@router.get("/athletes/pmc-summary")
async def get_athletes_pmc_summary(user=Depends(get_current_user)):
    """Get PMC summary (CTL/ATL/TSB) for all coached athletes.

    Returns current fitness, fatigue, and form metrics for each athlete
    in the coach's roster. Requires coach role.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        coach_service = CoachService()
        coach_id = await coach_service.get_coach_id(user.id)
        return await coach_service.get_athletes_pmc_summary(coach_id)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch PMC summary: {str(e)}",
        )


@router.get("/alerts")
async def get_coach_alerts(user=Depends(get_current_user)):
    """Get computed alerts for all coached athletes.

    Returns alerts for concerning trends: missed check-ins, low readiness,
    fatigue spikes, and overtraining risk. Alerts are calculated on read
    (not stored). Requires coach role.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        coach_service = CoachService()
        coach_id = await coach_service.get_coach_id(user.id)
        return await coach_service.generate_alerts(coach_id)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch alerts: {str(e)}",
        )


@router.post("/athletes/{athlete_id}", status_code=201)
async def add_athlete_to_roster(
    athlete_id: str,
    relationship_type: str = Query("primary"),
    user=Depends(get_current_user),
):
    """Add an athlete to the coach's roster.

    Verifies the athlete exists before creating the coaching relationship.
    Requires coach role.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        # Verify athlete exists
        sb = get_supabase()
        athlete_result = (
            sb.table("athletes")
            .select("id")
            .eq("id", athlete_id)
            .execute()
        )
        if not athlete_result.data:
            raise HTTPException(
                status_code=404, detail="Athlete not found"
            )

        coach_service = CoachService()
        coach_id = await coach_service.get_coach_id(user.id)
        return await coach_service.add_athlete(
            coach_id, athlete_id, relationship_type
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add athlete: {str(e)}",
        )


@router.delete("/athletes/{athlete_id}")
async def remove_athlete_from_roster(
    athlete_id: str,
    user=Depends(get_current_user),
):
    """Remove an athlete from the coach's roster (soft-delete).

    Sets ended_at to today rather than deleting the row, preserving
    the coaching relationship history. Requires coach role.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        coach_service = CoachService()
        coach_id = await coach_service.get_coach_id(user.id)
        return await coach_service.remove_athlete(coach_id, athlete_id)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to remove athlete: {str(e)}",
        )
