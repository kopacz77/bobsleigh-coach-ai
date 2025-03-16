from typing import List

from fastapi import APIRouter, HTTPException

from app.schemas.training import Workout, WorkoutCreate, WorkoutExercise

router = APIRouter()


@router.get("/workouts", response_model=List[Workout])
async def get_workouts():
    """Get all workouts"""
    # Placeholder data
    workouts = [
        Workout(
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
                WorkoutExercise(
                    id=2,
                    workout_id=1,
                    exercise_id=2,
                    sets=3,
                    reps=8,
                    weight=100,
                    notes="Increased weight",
                ),
            ],
        ),
        Workout(
            id=2,
            athlete_id=1,
            name="Wednesday Sprint",
            date="2025-03-17",
            duration=60,
            type="Sprint",
            notes="Track session",
            exercises=[
                WorkoutExercise(
                    id=3,
                    workout_id=2,
                    exercise_id=3,
                    sets=6,
                    distance=30,
                    time=4.2,
                    notes="Good acceleration",
                ),
            ],
        ),
    ]
    return workouts


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
    # This would save the workout to the database
    return Workout(
        id=3,
        athlete_id=workout.athlete_id,
        name=workout.name,
        date=workout.date,
        duration=workout.duration,
        type=workout.type,
        notes=workout.notes,
        exercises=[],  # Would be populated with actual exercises
    )


@router.get("/recommendations", response_model=List[dict])
async def get_training_recommendations(athlete_id: int):
    """Get AI-generated training recommendations for an athlete"""
    # This would call the AI model to generate personalized recommendations
    if athlete_id != 1:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Placeholder recommendations
    recommendations = [
        {
            "date": "2025-03-18",
            "workout_type": "Strength",
            "focus": "Lower body power",
            "duration": 75,
            "intensity": "High",
            "exercises": [
                {"name": "Back Squat", "sets": 5, "reps": 5, "weight": 130},
                {"name": "Split Squat", "sets": 3, "reps": 6, "weight": 80},
                {"name": "Box Jumps", "sets": 4, "reps": 8, "height": 30},
            ],
        },
        {
            "date": "2025-03-20",
            "workout_type": "Sprint",
            "focus": "Acceleration",
            "duration": 60,
            "intensity": "Medium-High",
            "exercises": [
                {"name": "Resisted Sprints", "sets": 6, "distance": 20, "rest": 90},
                {"name": "Flying Sprints", "sets": 5, "distance": 30, "rest": 120},
                {"name": "Hill Sprints", "sets": 4, "duration": 12, "rest": 180},
            ],
        },
    ]
    return recommendations
