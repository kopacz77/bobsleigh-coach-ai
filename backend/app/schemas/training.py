from typing import List, Optional

from pydantic import BaseModel


class WorkoutExerciseBase(BaseModel):
    """Base schema for workout exercises"""

    exercise_id: str
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

    id: str
    workout_id: str

    class Config:
        from_attributes = True


class WorkoutBase(BaseModel):
    """Base schema for workouts"""

    athlete_id: str
    name: str
    date: str  # YYYY-MM-DD
    duration: Optional[int] = None  # in minutes
    workout_type: str  # 'strength', 'power', 'speed', 'endurance', 'recovery'
    notes: Optional[str] = None


class WorkoutCreate(BaseModel):
    """Schema for creating a workout.

    Note: Does NOT extend WorkoutBase because athlete_id is set server-side
    from the authenticated user, never from the client payload.
    """

    name: str
    date: str  # YYYY-MM-DD
    duration: Optional[int] = None  # in minutes
    workout_type: str  # 'strength', 'power', 'speed', 'endurance', 'recovery'
    notes: Optional[str] = None
    rpe: Optional[int] = None
    is_completed: Optional[bool] = False
    training_phase: Optional[str] = None
    exercises: Optional[List[WorkoutExerciseCreate]] = None


class Workout(WorkoutBase):
    """Schema for a complete workout"""

    id: str
    rpe: Optional[int] = None
    is_completed: Optional[bool] = False
    training_phase: Optional[str] = None
    exercises: List[WorkoutExercise] = []

    class Config:
        from_attributes = True
