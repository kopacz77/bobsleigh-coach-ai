"""Repository layer for database-agnostic data access.

Replaces direct Supabase PostgREST calls with SQLAlchemy Core queries
executed against the DATABASE_URL connection.
"""

from app.db.repositories.base import BaseRepository
from app.db.repositories.athlete_repo import AthleteRepository
from app.db.repositories.coach_repo import CoachRepository
from app.db.repositories.exercise_repo import ExerciseRepository
from app.db.repositories.performance_repo import PerformanceRepository
from app.db.repositories.plan_repo import PlanRepository
from app.db.repositories.training_load_repo import TrainingLoadRepository
from app.db.repositories.wellbeing_repo import WellbeingRepository
from app.db.repositories.workout_repo import WorkoutRepository

__all__ = [
    "BaseRepository",
    "AthleteRepository",
    "CoachRepository",
    "ExerciseRepository",
    "PerformanceRepository",
    "PlanRepository",
    "TrainingLoadRepository",
    "WellbeingRepository",
    "WorkoutRepository",
]
