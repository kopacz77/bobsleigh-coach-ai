from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.training import Workout, WorkoutCreate, WorkoutExercise
from app.services.training_service import TrainingService

router = APIRouter()


@router.get("/workouts")
async def get_workouts(athlete_id: int = Query(...), limit: int = Query(10)):
    """Get workouts for an athlete"""
    training_service = TrainingService()
    return await training_service.get_recent_workouts(athlete_id, limit)


@router.get("/workouts/{workout_id}", response_model=Workout)
async def get_workout(workout_id: int):
    """Get a specific workout by ID"""
    # Placeholder logic
    if workout_id == 1:
        return Workout(
            id=1,
            athlete_id=1,
            name="Monday Strength",
            date="2025-03-15",
            duration=90,
            type="Strength",
            notes="Focus on explosiveness",
            exercises=[
                WorkoutExercise(
                    id=1,
                    workout_id=1,
                    exercise_id=1,
                    sets=4,
                    reps=6,
                    weight=120,
                    notes="Felt strong",
                ),
            ],
        )
    raise HTTPException(status_code=404, detail="Workout not found")


@router.post("/workouts", response_model=Workout)
async def create_workout(workout: WorkoutCreate):
    """Create a new workout"""
    training_service = TrainingService()
    return await training_service.create_workout(workout.dict())


@router.get("/recommendations")
async def get_training_recommendations(athlete_id: int = Query(...)):
    """Get AI-generated training recommendations for an athlete"""
    training_service = TrainingService()
    return await training_service.get_training_recommendations(athlete_id)
