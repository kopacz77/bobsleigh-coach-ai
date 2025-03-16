"""Training service for handling workout data and recommendations.

This module provides services for managing workout data and generating recommendations.
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

from app.services.pmc_service import PMCService


class TrainingService:
    """Service for training-related functionality."""

    def __init__(self):
        """Initialize the training service."""
        self.pmc_service = PMCService()

    async def get_recent_workouts(self, athlete_id: int, limit: int = 5) -> List[Dict]:
        """Get recent workouts for an athlete.

        Args:
            athlete_id: ID of the athlete
            limit: Maximum number of workouts to return

        Returns:
            List of recent workouts
        """
        # In a real implementation, this would query the database
        # Here we're returning mock data for demonstration
        return [
            {
                "id": 1,
                "athlete_id": athlete_id,
                "name": "Monday Strength",
                "date": "2025-03-15",
                "duration": 90,
                "type": "Strength",
                "notes": "Focus on explosiveness",
                "exercises": [
                    {
                        "id": 1,
                        "workout_id": 1,
                        "exercise_id": 1,
                        "name": "Back Squat",
                        "sets": 4,
                        "reps": 6,
                        "weight": 120,
                        "notes": "Felt strong",
                    },
                    {
                        "id": 2,
                        "workout_id": 1,
                        "exercise_id": 2,
                        "name": "Bench Press",
                        "sets": 3,
                        "reps": 8,
                        "weight": 100,
                        "notes": "Increased weight",
                    },
                ],
            },
            {
                "id": 2,
                "athlete_id": athlete_id,
                "name": "Wednesday Sprint",
                "date": "2025-03-13",
                "duration": 60,
                "type": "Sprint",
                "notes": "Track session",
                "exercises": [
                    {
                        "id": 3,
                        "workout_id": 2,
                        "exercise_id": 3,
                        "name": "30m Sprint",
                        "sets": 6,
                        "distance": 30,
                        "time": 4.2,
                        "notes": "Good acceleration",
                    },
                ],
            },
            {
                "id": 3,
                "athlete_id": athlete_id,
                "name": "Friday Power",
                "date": "2025-03-11",
                "duration": 75,
                "type": "Power",
                "notes": "Explosive focus",
                "exercises": [
                    {
                        "id": 4,
                        "workout_id": 3,
                        "exercise_id": 4,
                        "name": "Power Clean",
                        "sets": 5,
                        "reps": 3,
                        "weight": 90,
                        "notes": "Technique improving",
                    },
                    {
                        "id": 5,
                        "workout_id": 3,
                        "exercise_id": 5,
                        "name": "Box Jump",
                        "sets": 4,
                        "reps": 8,
                        "height": 30,
                        "notes": "Focused on landing softness",
                    },
                ],
            },
        ]

    async def create_workout(self, workout_data: Dict) -> Dict:
        """Create a new workout.

        Args:
            workout_data: Workout data

        Returns:
            Created workout data
        """
        # In a real implementation, this would save to the database
        # Here we're just returning the data with a mock ID
        return {
            "id": 4,  # Mock ID
            **workout_data,
        }

    async def get_training_recommendations(self, athlete_id: int) -> Dict:
        """Get training recommendations for an athlete.

        Args:
            athlete_id: ID of the athlete

        Returns:
            Training recommendations
        """
        # Use the PMC service to get training status and recommendations
        status = await self.pmc_service.get_training_recommendations(athlete_id)
        
        # Get specific workout recommendations
        workouts = await self.pmc_service.generate_workout_recommendations(athlete_id)
        
        # Combine into a single response
        return {
            "status": status,
            "recommended_workouts": workouts,
        }
