"""Training endpoints with user-based data filtering.

Defense-in-depth: all endpoints verify that the requested data belongs
to the authenticated user's athlete profile before returning results.
Coach-specific endpoints check for coach role in app_metadata/user_metadata.
"""

import logging
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.db.repositories.athlete_repo import AthleteRepository
from app.db.repositories.workout_repo import TrainingLoadRepository, WorkoutRepository
from app.schemas.training import WorkoutCreate
from app.services.training_service import TrainingService

logger = logging.getLogger(__name__)

router = APIRouter()

athlete_repo = AthleteRepository()
workout_repo = WorkoutRepository()
training_load_repo = TrainingLoadRepository()


async def _get_athlete_id_for_user(user) -> str:
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


async def _verify_athlete_ownership(athlete_id: str, user) -> None:
    """Verify that the given athlete_id belongs to the authenticated user.

    Args:
        athlete_id: UUID of the athlete to check.
        user: Auth user object with .id attribute.

    Raises:
        HTTPException 403 if the athlete does not belong to this user.
    """
    if not athlete_repo.verify_ownership(athlete_id, user.id):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this athlete's data",
        )


@router.get("/workouts")
async def get_workouts(
    athlete_id: Optional[str] = Query(None),
    limit: int = Query(10),
    offset: int = Query(0),
    workout_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    """Get workouts for the authenticated user's athlete profile.

    If athlete_id is provided, verifies it belongs to the authenticated user.
    If not provided, uses the authenticated user's own athlete_id.

    Supports optional filters:
    - workout_type: filter by workout type (strength, power, speed, etc.)
    - date_from: filter workouts on or after this date (YYYY-MM-DD)
    - date_to: filter workouts on or before this date (YYYY-MM-DD)
    - search: search workout name (case-insensitive)
    - offset: pagination offset
    """
    try:
        if athlete_id:
            await _verify_athlete_ownership(athlete_id, user)
        else:
            athlete_id = await _get_athlete_id_for_user(user)

        workouts = workout_repo.get_by_athlete(
            athlete_id,
            offset=offset,
            limit=limit,
            workout_type=workout_type,
            date_from=date_from,
            date_to=date_to,
            search=search,
        )
        # Attach exercise data to each workout
        return workout_repo.get_workouts_with_exercises(workouts)
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch workouts: {str(e)}"
        )


@router.get("/workouts/week")
async def get_weekly_workouts(
    week_start: str = Query(..., description="Monday date (YYYY-MM-DD)"),
    athlete_id: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    """Get workouts for a specific week.

    Returns workouts where date is between week_start and week_start + 6 days,
    ordered by date ascending, with workout_exercises joined.
    """
    try:
        if athlete_id:
            await _verify_athlete_ownership(athlete_id, user)
        else:
            athlete_id = await _get_athlete_id_for_user(user)

        start_date = datetime.strptime(week_start, "%Y-%m-%d").date()
        end_date = start_date + timedelta(days=6)

        workouts = workout_repo.get_by_athlete_date_range(
            athlete_id, week_start, end_date.isoformat()
        )
        return workout_repo.get_workouts_with_exercises(workouts)
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch weekly workouts: {str(e)}"
        )


@router.get("/workouts/{workout_id}")
async def get_workout(workout_id: str, user=Depends(get_current_user)):
    """Get a specific workout by UUID. Verifies ownership."""
    try:
        workout = workout_repo.get_with_exercises(workout_id)
        if not workout:
            raise HTTPException(status_code=404, detail="Workout not found")

        # Verify the workout belongs to the authenticated user's athlete
        await _verify_athlete_ownership(workout["athlete_id"], user)

        return workout
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch workout: {str(e)}"
        )


@router.post("/workouts")
async def create_workout(workout: WorkoutCreate, user=Depends(get_current_user)):
    """Create a new workout. Sets athlete_id from the authenticated user."""
    try:
        # Get the authenticated user's athlete_id
        athlete_id = await _get_athlete_id_for_user(user)

        data = workout.model_dump(exclude_none=True)
        # Always set athlete_id from the authenticated user (don't trust client)
        data["athlete_id"] = athlete_id

        # Separate exercises from workout data if present
        exercises = data.pop("exercises", None)

        created_workout = workout_repo.create(data)

        # If exercises were provided, insert them linked to the workout
        if exercises:
            workout_id = created_workout["id"]
            for i, exercise in enumerate(exercises):
                exercise_data = exercise if isinstance(exercise, dict) else exercise.model_dump(exclude_none=True)
                exercise_data["workout_id"] = workout_id
                exercise_data["exercise_order"] = i + 1
            workout_repo.create_exercises_batch(
                [
                    (ex if isinstance(ex, dict) else ex.model_dump(exclude_none=True))
                    | {"workout_id": created_workout["id"], "exercise_order": i + 1}
                    for i, ex in enumerate(exercises)
                ]
            )

        return created_workout
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create workout: {str(e)}"
        )


def _upsert_training_load(workout: dict) -> None:
    """Calculate sRPE and upsert a training_loads row for the workout.

    sRPE = RPE x duration (minutes). If multiple workouts exist on the same day
    for the same athlete, their training loads are summed.

    Args:
        workout: Dict with athlete_id, date, rpe, and duration keys.
    """
    athlete_id = workout.get("athlete_id")
    workout_date = workout.get("date")
    rpe = workout.get("rpe")
    duration = workout.get("duration")

    if not all([athlete_id, workout_date, rpe, duration]):
        logger.warning(
            "Cannot calculate training load: missing required fields "
            "(athlete_id=%s, date=%s, rpe=%s, duration=%s)",
            athlete_id, workout_date, rpe, duration,
        )
        return

    srpe = float(rpe) * float(duration)
    training_load_repo.upsert(athlete_id, str(workout_date), srpe, float(rpe))


@router.patch("/workouts/{workout_id}")
async def update_workout(workout_id: str, updates: dict, user=Depends(get_current_user)):
    """Update a workout (completion status, RPE, notes). Verifies ownership."""
    try:
        # Fetch workout to verify ownership
        existing = workout_repo.get_by_id(workout_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Workout not found")
        await _verify_athlete_ownership(existing["athlete_id"], user)

        # Only allow updating safe fields
        allowed_fields = {"is_completed", "rpe", "notes", "actual_load"}
        safe_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        if not safe_updates:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        updated_workout = workout_repo.update(workout_id, safe_updates)
        if not updated_workout:
            updated_workout = {}

        # After successful update, upsert training load if workout is completed
        # with both RPE and duration values
        try:
            if updated_workout:
                full_workout = workout_repo.get_by_id(workout_id)
                if full_workout and (
                    full_workout.get("is_completed")
                    and full_workout.get("rpe")
                    and full_workout.get("duration_minutes")
                ):
                    _upsert_training_load({
                        "athlete_id": full_workout["athlete_id"],
                        "date": full_workout["date"],
                        "rpe": full_workout["rpe"],
                        "duration": full_workout["duration_minutes"],
                    })
        except Exception as e:
            # Training load upsert failure should not break the workout update
            logger.error(
                "Failed to upsert training load for workout %s: %s",
                workout_id, str(e),
            )

        return updated_workout
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update workout: {str(e)}")


def _get_user_role(user) -> str:
    """Extract role from user metadata (app_metadata preferred, user_metadata fallback)."""
    role = "athlete"
    if hasattr(user, "app_metadata") and user.app_metadata:
        role = user.app_metadata.get("role", "athlete")
    if role == "athlete" and hasattr(user, "user_metadata") and user.user_metadata:
        role = user.user_metadata.get("role", "athlete")
    return role


@router.get("/coach/athletes/workout-status")
async def get_athletes_workout_status(
    days: int = Query(7),
    user=Depends(get_current_user),
):
    """Get workout completion status for all athletes (coach only).

    Returns each athlete's name, total workouts, completed count for the period.
    """
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        date_from = (date.today() - timedelta(days=days)).isoformat()

        # Get all active athletes
        athletes = athlete_repo.get_all_active_with_fields("id, first_name, last_name")

        statuses = []
        for athlete in athletes:
            workouts = workout_repo.get_by_athlete(
                athlete["id"],
                date_from=date_from,
                limit=100,
            )
            statuses.append(
                {
                    "athlete_id": athlete["id"],
                    "athlete_name": f"{athlete['first_name']} {athlete['last_name']}",
                    "total_workouts": len(workouts),
                    "completed": sum(1 for w in workouts if w.get("is_completed")),
                    "recent_workouts": workouts[:5],
                }
            )

        return statuses
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch workout status: {str(e)}"
        )


@router.get("/coach/athletes/{athlete_id}/workouts")
async def get_athlete_workouts_for_coach(
    athlete_id: str,
    limit: int = Query(20),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    """Get an athlete's workouts for coach review. Requires coach role."""
    try:
        role = _get_user_role(user)
        if role != "coach":
            raise HTTPException(status_code=403, detail="Coach role required")

        workouts = workout_repo.get_by_athlete(
            athlete_id,
            limit=limit,
            date_from=date_from,
            date_to=date_to,
        )
        return workout_repo.get_workouts_with_exercises(workouts)
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch athlete workouts: {str(e)}"
        )


@router.get("/recommendations")
async def get_training_recommendations(
    athlete_id: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    """Get AI-generated training recommendations for the authenticated user.

    If athlete_id is provided, verifies it belongs to the authenticated user.
    If not provided, uses the authenticated user's own athlete_id.
    """
    try:
        if athlete_id:
            await _verify_athlete_ownership(athlete_id, user)
        else:
            athlete_id = await _get_athlete_id_for_user(user)

        training_service = TrainingService()
        return await training_service.get_training_recommendations(athlete_id)
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recommendations: {str(e)}",
        )
