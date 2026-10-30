"""Wellbeing endpoints for daily check-ins and readiness tracking.

Provides endpoints for athletes to submit daily wellness assessments,
view their wellbeing history, and for coaches to monitor athlete readiness.
Readiness score and recovery status are calculated on read (not stored).
"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.core.security import get_current_user
from app.db.repositories.athlete_repo import AthleteRepository
from app.db.repositories.wellbeing_repo import WellbeingRepository
from app.schemas.wellbeing import CheckInCreate

router = APIRouter()

athlete_repo = AthleteRepository()
wellbeing_repo = WellbeingRepository()


def _get_athlete_id_for_user_sync(user) -> str:
    """Look up the athlete_id for the authenticated user (sync).

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


def _calculate_readiness(row: dict) -> dict:
    """Calculate readiness score and recovery status from a wellbeing row.

    Readiness formula: average of sleep_quality, inverted stress,
    nutrition_quality, physical_readiness, and mental_clarity.

    Recovery status thresholds:
      >= 8 -> "green" (good to train hard)
      >= 5 -> "yellow" (moderate, adjust load)
       < 5 -> "red" (recovery day recommended)

    Also derives has_concern from [CONCERN] prefix in notes.
    """
    score = round(
        (
            row["sleep_quality"]
            + (10 - row["stress_level"])
            + row["nutrition_quality"]
            + row["physical_readiness"]
            + row["mental_clarity"]
        )
        / 5
    )
    status = "green" if score >= 8 else "yellow" if score >= 5 else "red"
    has_concern = bool(
        row.get("notes") and row["notes"].startswith("[CONCERN]")
    )
    return {
        **row,
        "readiness_score": score,
        "recovery_status": status,
        "has_concern": has_concern,
    }


def _get_user_role(user) -> str:
    """Extract role from user metadata (app_metadata preferred, user_metadata fallback)."""
    role = "athlete"
    if hasattr(user, "app_metadata") and user.app_metadata:
        role = user.app_metadata.get("role", "athlete")
    if role == "athlete" and hasattr(user, "user_metadata") and user.user_metadata:
        role = user.user_metadata.get("role", "athlete")
    return role


@router.post("/checkin")
async def submit_checkin(checkin: CheckInCreate, user=Depends(get_current_user)):
    """Submit a daily wellbeing check-in.

    Sets athlete_id from authenticated user and date to today (server-side).
    Upserts on (athlete_id, assessment_date) so re-submitting the same day
    updates the existing record. Calculates readiness_score on response
    (not stored).
    """
    try:
        athlete_id = _get_athlete_id_for_user_sync(user)
        today = date.today().isoformat()

        # Build the row data for the wellbeing_assessments table
        data = checkin.model_dump(exclude={"flag_concern"})

        # Encode concern flag into notes prefix
        if checkin.flag_concern:
            notes = data.get("notes") or ""
            if not notes.startswith("[CONCERN]"):
                data["notes"] = f"[CONCERN] {notes}".strip() if notes else "[CONCERN]"

        # Upsert via repository
        result = wellbeing_repo.upsert(athlete_id, today, data)
        if not result:
            raise HTTPException(
                status_code=500, detail="Failed to save check-in"
            )

        return _calculate_readiness(result)
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to submit check-in: {str(e)}"
        )


@router.get("/checkin/today")
async def get_today_checkin(
    response: Response, user=Depends(get_current_user)
):
    """Get today's wellbeing check-in for the authenticated user.

    Returns 204 No Content if no check-in exists for today.
    Includes has_concern derived from [CONCERN] prefix in notes.
    """
    try:
        athlete_id = _get_athlete_id_for_user_sync(user)
        today = date.today().isoformat()

        result = wellbeing_repo.get_by_athlete_and_date(athlete_id, today)

        if not result:
            response.status_code = 204
            return None

        return _calculate_readiness(result)
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch today's check-in: {str(e)}"
        )


@router.get("/history")
async def get_wellbeing_history(
    days: int = Query(30, ge=1, le=365),
    user=Depends(get_current_user),
):
    """Get wellbeing history for the authenticated user.

    Returns assessments within the specified number of days,
    ordered by date ascending. Each row includes calculated
    readiness_score and recovery_status.
    """
    try:
        athlete_id = _get_athlete_id_for_user_sync(user)
        date_from = (date.today() - timedelta(days=days)).isoformat()

        rows = wellbeing_repo.get_range(athlete_id, date_from)

        return [_calculate_readiness(row) for row in rows]
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch wellbeing history: {str(e)}"
        )


@router.get("/coach/readiness")
async def get_coach_readiness(user=Depends(get_current_user)):
    """Get readiness status for all athletes (coach only).

    Returns each athlete's latest wellbeing assessment with calculated
    readiness score and recovery status. Athletes with no check-in today
    show recovery_status = "gray".
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        today = date.today().isoformat()

        # Get all active athletes
        athletes = athlete_repo.get_all_active_with_fields(
            "id, user_id, first_name, last_name"
        )

        if not athletes:
            return []

        # Batch fetch latest assessments for all athletes
        athlete_ids = [a["id"] for a in athletes]
        assessments = wellbeing_repo.get_batch_latest_by_athlete_ids(athlete_ids)

        # Index assessments by athlete_id for quick lookup
        assessment_by_athlete: dict[str, dict] = {}
        for assessment in assessments:
            assessment_by_athlete[str(assessment["athlete_id"])] = assessment

        statuses = []
        for athlete in athletes:
            athlete_name = (
                f"{athlete['first_name']} {athlete['last_name']}"
            )
            assessment = assessment_by_athlete.get(str(athlete["id"]))

            if not assessment:
                statuses.append(
                    {
                        "athlete_id": athlete["id"],
                        "athlete_name": athlete_name,
                        "date": None,
                        "readiness_score": None,
                        "recovery_status": "gray",
                        "has_concern": False,
                    }
                )
                continue

            enriched = _calculate_readiness(assessment)
            assessment_date = str(assessment.get("assessment_date", ""))
            is_today = assessment_date == today

            statuses.append(
                {
                    "athlete_id": athlete["id"],
                    "athlete_name": athlete_name,
                    "date": assessment_date,
                    "readiness_score": enriched["readiness_score"],
                    "recovery_status": enriched["recovery_status"] if is_today else "gray",
                    "has_concern": enriched["has_concern"],
                }
            )

        return statuses
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch coach readiness: {str(e)}",
        )
