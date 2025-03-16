from typing import List, Optional

from pydantic import BaseModel


class WorkoutExerciseBase(BaseModel):
    """Base schema for workout exercises"""

    exercise_id: int
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight: Optional[float] = None  # in kg
    distance: Optional[float] = None  # in meters
    time: Optional[float] = None  # in seconds
    notes: Optional[str] = None


class WorkoutExerciseCreate(WorkoutExerciseBase):
    """Schema for creating a workout exercise"""

    pass


class WorkoutExercise(WorkoutExerciseBase):
    """Schema for a complete workout exercise"""

    id: int
    workout_id: int

    class Config:
        from_attributes = True


class WorkoutBase(BaseModel):
    """Base schema for workouts"""

    athlete_id: int
    name: str
    date: str  # YYYY-MM-DD
    duration: Optional[int] = None  # in minutes
    type: str  # Strength, Speed, Endurance, etc.
    notes: Optional[str] = None


class WorkoutCreate(WorkoutBase):
    """Schema for creating a workout"""

    exercises: Optional[List[WorkoutExerciseCreate]] = None


class Workout(WorkoutBase):
    """Schema for a complete workout"""

    id: int
    exercises: List[WorkoutExercise] = []

    class Config:
        from_attributes = True
