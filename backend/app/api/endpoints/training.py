"""Training endpoints with user-based data filtering.

Defense-in-depth: all endpoints verify that the requested data belongs
to the authenticated user's athlete profile before returning results.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.db.session import get_supabase
from app.schemas.training import WorkoutCreate
from app.services.training_service import TrainingService

router = APIRouter()


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


async def _verify_athlete_ownership(athlete_id: str, user) -> None:
    """Verify that the given athlete_id belongs to the authenticated user.

    Args:
        athlete_id: UUID of the athlete to check.
        user: Supabase User object with .id attribute.

    Raises:
        HTTPException 403 if the athlete does not belong to this user.
    """
    sb = get_supabase()
    result = (
        sb.table("athletes")
        .select("id")
        .eq("id", athlete_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this athlete's data",
        )


@router.get("/workouts")
async def get_workouts(
    athlete_id: Optional[str] = Query(None),
    limit: int = Query(10),
    user=Depends(get_current_user),
):
    """Get workouts for the authenticated user's athlete profile.

    If athlete_id is provided, verifies it belongs to the authenticated user.
    If not provided, uses the authenticated user's own athlete_id.
    """
    try:
        if athlete_id:
            await _verify_athlete_ownership(athlete_id, user)
        else:
            athlete_id = await _get_athlete_id_for_user(user)

        training_service = TrainingService()
        return await training_service.get_recent_workouts(athlete_id, limit)
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch workouts: {str(e)}"
        )


@router.get("/workouts/{workout_id}")
async def get_workout(workout_id: str, user=Depends(get_current_user)):
    """Get a specific workout by UUID. Verifies ownership."""
    try:
        supabase = get_supabase()
        result = (
            supabase.table("workouts")
            .select("*, workout_exercises(*, exercises(name))")
            .eq("id", workout_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Workout not found")

        workout = result.data[0]
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

        training_service = TrainingService()
        data = workout.model_dump(exclude_none=True)
        # Always set athlete_id from the authenticated user (don't trust client)
        data["athlete_id"] = athlete_id
        return await training_service.create_workout(data)
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create workout: {str(e)}"
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
