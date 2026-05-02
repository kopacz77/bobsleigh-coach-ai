"""Training service for handling workout data and recommendations.

This module provides services for managing workout data and generating recommendations
using real Supabase database queries.
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

from app.db.session import get_supabase
from app.services.pmc_service import PMCService


class TrainingService:
    """Service for training-related functionality."""

    def __init__(self):
        """Initialize the training service."""
        self.pmc_service = PMCService()

    async def get_recent_workouts(self, athlete_id: str, limit: int = 5) -> List[Dict]:
        """Get recent workouts for an athlete from the database.

        Args:
            athlete_id: UUID of the athlete
            limit: Maximum number of workouts to return

        Returns:
            List of recent workouts with their exercises
        """
        supabase = get_supabase()
        result = (
            supabase.table("workouts")
            .select("*, workout_exercises(*, exercises(name))")
            .eq("athlete_id", athlete_id)
            .order("date", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data

    async def create_workout(self, workout_data: Dict) -> Dict:
        """Create a new workout in the database.

        Args:
            workout_data: Workout data to insert

        Returns:
            Created workout data with generated UUID
        """
        supabase = get_supabase()
        # Separate exercises from workout data if present
        exercises = workout_data.pop("exercises", None)

        result = supabase.table("workouts").insert(workout_data).execute()
        created_workout = result.data[0]

        # If exercises were provided, insert them linked to the workout
        if exercises:
            workout_id = created_workout["id"]
            for i, exercise in enumerate(exercises):
                exercise["workout_id"] = workout_id
                exercise["exercise_order"] = i + 1
            supabase.table("workout_exercises").insert(exercises).execute()

        return created_workout

    async def get_training_recommendations(self, athlete_id: str) -> Dict:
        """Get training recommendations for an athlete from the database.

        Args:
            athlete_id: UUID of the athlete

        Returns:
            Training recommendations dict with status and recommended workouts
        """
        supabase = get_supabase()

        # Query stored recommendations
        result = (
            supabase.table("training_recommendations")
            .select("*")
            .eq("athlete_id", athlete_id)
            .order("recommendation_date", desc=True)
            .limit(5)
            .execute()
        )

        stored_recommendations = result.data

        # Also get current PMC status for context
        status = await self.pmc_service.get_training_recommendations(athlete_id)

        # Generate workout recommendations based on PMC status
        workouts = await self.pmc_service.generate_workout_recommendations(athlete_id)

        return {
            "status": status,
            "stored_recommendations": stored_recommendations,
            "recommended_workouts": workouts,
        }
