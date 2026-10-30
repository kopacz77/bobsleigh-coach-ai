"""Training service for handling workout data and recommendations.

This module provides services for managing workout data and generating
recommendations using the repository layer (SQLAlchemy-backed).
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import text

from app.db.repositories.workout_repo import WorkoutRepository
from app.db.session import engine
from app.services.pmc_service import PMCService


class TrainingService:
    """Service for training-related functionality."""

    def __init__(self):
        """Initialize the training service."""
        self.pmc_service = PMCService()
        self.workout_repo = WorkoutRepository()

    async def get_recent_workouts(
        self,
        athlete_id: str,
        limit: int = 10,
        offset: int = 0,
        workout_type: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Dict]:
        """Get workouts for an athlete from the database with optional filters.

        Args:
            athlete_id: UUID of the athlete
            limit: Maximum number of workouts to return
            offset: Number of workouts to skip (for pagination)
            workout_type: Filter by workout type (strength, power, speed, etc.)
            date_from: Filter workouts on or after this date (YYYY-MM-DD)
            date_to: Filter workouts on or before this date (YYYY-MM-DD)
            search: Search workout name (case-insensitive)

        Returns:
            List of workouts with their exercises
        """
        workouts = self.workout_repo.get_by_athlete(
            athlete_id,
            offset=offset,
            limit=limit,
            workout_type=workout_type,
            date_from=date_from,
            date_to=date_to,
            search=search,
        )
        return self.workout_repo.get_workouts_with_exercises(workouts)

    async def get_weekly_workouts(
        self,
        athlete_id: str,
        week_start: str,
    ) -> List[Dict]:
        """Get workouts for a specific week.

        Args:
            athlete_id: UUID of the athlete
            week_start: Monday date (YYYY-MM-DD)

        Returns:
            List of workouts for the week, ordered by date ascending
        """
        # Calculate week end (Sunday = week_start + 6 days)
        start_date = datetime.strptime(week_start, "%Y-%m-%d").date()
        end_date = start_date + timedelta(days=6)

        workouts = self.workout_repo.get_by_athlete_date_range(
            athlete_id, week_start, end_date.isoformat()
        )
        return self.workout_repo.get_workouts_with_exercises(workouts)

    async def create_workout(self, workout_data: Dict) -> Dict:
        """Create a new workout in the database.

        Args:
            workout_data: Workout data to insert

        Returns:
            Created workout data with generated UUID
        """
        # Separate exercises from workout data if present
        exercises = workout_data.pop("exercises", None)

        created_workout = self.workout_repo.create(workout_data)

        # If exercises were provided, insert them linked to the workout
        if exercises:
            workout_id = created_workout["id"]
            for i, exercise in enumerate(exercises):
                exercise["workout_id"] = workout_id
                exercise["exercise_order"] = i + 1
            self.workout_repo.create_exercises_batch(exercises)

        return created_workout

    async def get_training_recommendations(self, athlete_id: str) -> Dict:
        """Get training recommendations for an athlete from the database.

        Args:
            athlete_id: UUID of the athlete

        Returns:
            Training recommendations dict with status and recommended workouts
        """
        # Query stored recommendations via SQLAlchemy (no dedicated repo yet)
        stored_recommendations: List[Dict] = []
        try:
            with engine.connect() as conn:
                result = conn.execute(
                    text(
                        "SELECT * FROM training_recommendations "
                        "WHERE athlete_id = :athlete_id "
                        "ORDER BY recommendation_date DESC LIMIT 5"
                    ),
                    {"athlete_id": athlete_id},
                )
                stored_recommendations = [
                    dict(row._mapping) for row in result
                ]
        except Exception:
            # Table may not exist in all environments -- treat as empty
            stored_recommendations = []

        # Also get current PMC status for context
        status = await self.pmc_service.get_training_recommendations(athlete_id)

        # Generate workout recommendations based on PMC status
        workouts = await self.pmc_service.generate_workout_recommendations(athlete_id)

        return {
            "status": status,
            "stored_recommendations": stored_recommendations,
            "recommended_workouts": workouts,
        }
