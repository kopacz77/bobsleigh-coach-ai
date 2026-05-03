from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.db.session import get_supabase
from app.schemas.training import WorkoutCreate
from app.services.training_service import TrainingService

router = APIRouter()


@router.get("/workouts")
async def get_workouts(athlete_id: str = Query(...), limit: int = Query(10), user=Depends(get_current_user)):
    """Get workouts for an athlete from the database."""
    try:
        training_service = TrainingService()
        return await training_service.get_recent_workouts(athlete_id, limit)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch workouts: {str(e)}"
        )


@router.get("/workouts/{workout_id}")
async def get_workout(workout_id: str, user=Depends(get_current_user)):
    """Get a specific workout by UUID from the database."""
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
        return result.data[0]
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
    """Create a new workout in the database."""
    try:
        training_service = TrainingService()
        data = workout.model_dump(exclude_none=True)
        return await training_service.create_workout(data)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create workout: {str(e)}"
        )


@router.get("/recommendations")
async def get_training_recommendations(athlete_id: str = Query(...), user=Depends(get_current_user)):
    """Get AI-generated training recommendations for an athlete."""
    try:
        training_service = TrainingService()
        return await training_service.get_training_recommendations(athlete_id)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recommendations: {str(e)}",
        )
