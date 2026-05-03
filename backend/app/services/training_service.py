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
        supabase = get_supabase()
        query = (
            supabase.table("workouts")
            .select("*, workout_exercises(*, exercises(name))")
            .eq("athlete_id", athlete_id)
        )

        if workout_type:
            query = query.eq("workout_type", workout_type)
        if date_from:
            query = query.gte("date", date_from)
        if date_to:
            query = query.lte("date", date_to)
        if search:
            query = query.ilike("name", f"*{search}*")

        result = (
            query
            .order("date", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return result.data

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
        supabase = get_supabase()
        # Calculate week end (Sunday = week_start + 6 days)
        start_date = datetime.strptime(week_start, "%Y-%m-%d").date()
        end_date = start_date + timedelta(days=6)

        result = (
            supabase.table("workouts")
            .select("*, workout_exercises(*, exercises(name))")
            .eq("athlete_id", athlete_id)
            .gte("date", week_start)
            .lte("date", end_date.isoformat())
            .order("date", desc=False)
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
