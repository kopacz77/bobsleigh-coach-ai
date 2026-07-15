"""Performance Management Chart (PMC) service.

This module provides services for calculating and analyzing PMC metrics
using real training load data via the repository layer.
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from app.db.repositories.training_load_repo import TrainingLoadRepository


class PMCService:
    """Service for Performance Management Chart calculations."""

    def __init__(
        self,
        ctl_days: int = 42,
        atl_days: int = 7,
    ):
        """Initialize PMC service.

        Args:
            ctl_days: Days constant for CTL/fitness (default: 42)
            atl_days: Days constant for ATL/fatigue (default: 7)
        """
        self.ctl_days = ctl_days
        self.atl_days = atl_days

        # Calculate decay constants
        self.ctl_decay = np.exp(-1 / ctl_days)
        self.atl_decay = np.exp(-1 / atl_days)

        self.training_load_repo = TrainingLoadRepository()

    async def calculate_pmc_for_athlete(
        self, athlete_id: str, days: int = 90
    ) -> Dict[str, List]:
        """Calculate PMC metrics for an athlete using real database data.

        Args:
            athlete_id: UUID of the athlete
            days: Number of days of history to include

        Returns:
            Dictionary with dates, loads, CTL, ATL, and TSB values.
            Returns empty lists if no training data exists.
        """
        # Query real training loads via repository
        from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        db_loads = self.training_load_repo.get_date_and_load(athlete_id, from_date)

        # If no training data exists, return empty response
        if not db_loads:
            return {
                "dates": [],
                "loads": [],
                "ctl": [],
                "atl": [],
                "tsb": [],
            }

        # Build a complete date series filling gaps with 0 load (rest days)
        # Repository returns 'date' as a date object from SQLAlchemy; normalize to string.
        def _date_str(value) -> str:
            if isinstance(value, str):
                return value
            return value.strftime("%Y-%m-%d")

        start_date = datetime.strptime(_date_str(db_loads[0]["date"]), "%Y-%m-%d")
        end_date = datetime.strptime(_date_str(db_loads[-1]["date"]), "%Y-%m-%d")
        total_days = (end_date - start_date).days + 1

        # Create a lookup for loads by date
        load_by_date = {
            _date_str(row["date"]): float(row["training_load"]) for row in db_loads
        }

        # Build continuous date series
        dates = []
        loads = []
        for i in range(total_days):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.strftime("%Y-%m-%d")
            dates.append(date_str)
            loads.append(load_by_date.get(date_str, 0.0))

        # Calculate PMC metrics using exponential decay formulas
        ctl = [0.0] * len(loads)  # Chronic Training Load (fitness)
        atl = [0.0] * len(loads)  # Acute Training Load (fatigue)
        tsb = [0.0] * len(loads)  # Training Stress Balance (form)

        # Set initial values
        if len(loads) > 0:
            ctl[0] = loads[0]
            atl[0] = loads[0]
            tsb[0] = 0.0

        # Calculate CTL, ATL, and TSB for each day
        for i in range(1, len(loads)):
            ctl[i] = ctl[i - 1] * self.ctl_decay + loads[i] * (1 - self.ctl_decay)
            atl[i] = atl[i - 1] * self.atl_decay + loads[i] * (1 - self.atl_decay)
            tsb[i] = ctl[i] - atl[i]

        return {
            "dates": dates,
            "loads": loads,
            "ctl": ctl,
            "atl": atl,
            "tsb": tsb,
        }

    async def get_training_recommendations(self, athlete_id: str) -> Dict:
        """Generate training recommendations based on current PMC metrics.

        Args:
            athlete_id: UUID of the athlete

        Returns:
            Dictionary with training recommendations based on TSB analysis
        """
        # Get current PMC metrics from real data
        pmc_data = await self.calculate_pmc_for_athlete(athlete_id, days=90)

        # If no data, return a default recommendation
        if not pmc_data["dates"]:
            return {
                "status": "No Data",
                "message": "No training load data available. Start logging workouts to see PMC-based recommendations.",
                "load_adjustment": 0,
                "focus_areas": [],
                "current_metrics": {"ctl": 0.0, "atl": 0.0, "tsb": 0.0},
            }

        # Get the most recent values
        current_ctl = pmc_data["ctl"][-1]
        current_atl = pmc_data["atl"][-1]
        current_tsb = pmc_data["tsb"][-1]

        # Define recommendation thresholds
        tsb_high_threshold = 20
        tsb_low_threshold = -10
        tsb_very_low_threshold = -30

        # Initialize recommendations
        recommendations = {
            "status": "",
            "message": "",
            "load_adjustment": 0,
            "focus_areas": [],
            "current_metrics": {
                "ctl": current_ctl,
                "atl": current_atl,
                "tsb": current_tsb,
            },
        }

        # Generate recommendations based on TSB
        if current_tsb > tsb_high_threshold:
            recommendations["status"] = "Peak Form"
            recommendations["message"] = (
                "You are well-recovered and in peak form. "
                "Ideal time for high-intensity training or competition."
            )
            recommendations["load_adjustment"] = 10
            recommendations["focus_areas"] = [
                "High intensity",
                "Race-specific",
                "Technical skills",
            ]

        elif current_tsb > 0:
            recommendations["status"] = "Good Form"
            recommendations["message"] = (
                "You have good form with balanced fitness and fatigue. "
                "Suitable for moderate to high training loads."
            )
            recommendations["load_adjustment"] = 0
            recommendations["focus_areas"] = [
                "Mixed intensity",
                "Strength",
                "Technical work",
            ]

        elif current_tsb > tsb_low_threshold:
            recommendations["status"] = "Slight Fatigue"
            recommendations["message"] = (
                "You are showing signs of fatigue. "
                "Consider moderate training with recovery emphasis."
            )
            recommendations["load_adjustment"] = -15
            recommendations["focus_areas"] = [
                "Technique",
                "Recovery",
                "Moderate volume",
            ]

        elif current_tsb > tsb_very_low_threshold:
            recommendations["status"] = "Significant Fatigue"
            recommendations["message"] = (
                "You have accumulated significant fatigue. "
                "Focus on recovery with reduced training load."
            )
            recommendations["load_adjustment"] = -30
            recommendations["focus_areas"] = [
                "Active recovery",
                "Mobility",
                "Low intensity",
            ]

        else:
            recommendations["status"] = "Extreme Fatigue"
            recommendations["message"] = (
                "Warning: You are at risk of overtraining. "
                "Prioritize recovery and significantly reduce training load."
            )
            recommendations["load_adjustment"] = -50
            recommendations["focus_areas"] = ["Rest", "Recovery", "Rehabilitation"]

        return recommendations

    async def generate_workout_recommendations(
        self, athlete_id: str, days_ahead: int = 7
    ) -> List[Dict]:
        """Generate specific workout recommendations for upcoming days.

        Args:
            athlete_id: UUID of the athlete
            days_ahead: Number of days to generate recommendations for

        Returns:
            List of workout recommendations
        """
        # Get current training status from real data
        training_status = await self.get_training_recommendations(athlete_id)

        # If no data, return empty recommendations
        if training_status["status"] == "No Data":
            return []

        # Create a workout schedule based on PMC status
        workout_schedule = []
        today = datetime.now().date()

        for i in range(days_ahead):
            day = today + timedelta(days=i)
            day_of_week = day.weekday()

            if day_of_week == 6:  # Sunday is always rest
                continue

            if (
                training_status["status"]
                in ["Significant Fatigue", "Extreme Fatigue"]
                and i < 3
            ):
                workout_type = "Recovery"
                focus = "Active Recovery"
                intensity = "Low"
            elif day_of_week == 3:  # Wednesday is lighter
                workout_type = (
                    "Technique"
                    if training_status["status"] != "Extreme Fatigue"
                    else "Recovery"
                )
                focus = (
                    "Technical Skills"
                    if training_status["status"] != "Extreme Fatigue"
                    else "Active Recovery"
                )
                intensity = "Medium-Low"
            else:
                if day_of_week in (0, 3):  # Monday, Thursday
                    workout_type = (
                        "Strength"
                        if training_status["status"] in ["Peak Form", "Good Form"]
                        else "Light Strength"
                    )
                    focus = "Lower Body" if day_of_week == 0 else "Upper Body"
                elif day_of_week in (1, 4):  # Tuesday, Friday
                    workout_type = (
                        "Speed"
                        if training_status["status"] in ["Peak Form", "Good Form"]
                        else "Technique"
                    )
                    focus = "Acceleration" if day_of_week == 1 else "Top Speed"
                else:  # Saturday
                    workout_type = (
                        "Power"
                        if training_status["status"] in ["Peak Form", "Good Form"]
                        else "Mobility"
                    )
                    focus = (
                        "Explosive Power"
                        if training_status["status"] in ["Peak Form", "Good Form"]
                        else "Recovery"
                    )

                if training_status["status"] == "Peak Form":
                    intensity = "High"
                elif training_status["status"] == "Good Form":
                    intensity = "Medium-High"
                elif training_status["status"] == "Slight Fatigue":
                    intensity = "Medium"
                else:
                    intensity = "Low"

            workout = {
                "date": day.strftime("%Y-%m-%d"),
                "workout_type": workout_type,
                "focus": focus,
                "duration": (
                    60 if intensity == "Low" else 75 if intensity == "Medium" else 90
                ),
                "intensity": intensity,
                "exercises": self._generate_exercises_for_workout(
                    workout_type, focus, intensity
                ),
            }

            workout_schedule.append(workout)

        return workout_schedule

    def _generate_exercises_for_workout(
        self, workout_type: str, focus: str, intensity: str
    ) -> List[Dict]:
        """Generate exercises for a workout based on type and focus.

        Args:
            workout_type: Type of workout (Strength, Speed, etc.)
            focus: Focus area of the workout
            intensity: Intensity level (Low, Medium, High)

        Returns:
            List of exercises for the workout
        """
        exercises = []

        intensity_multiplier = 1.0
        if intensity == "High":
            intensity_multiplier = 1.2
        elif intensity == "Medium-High":
            intensity_multiplier = 1.1
        elif intensity == "Medium":
            intensity_multiplier = 1.0
        elif intensity == "Medium-Low":
            intensity_multiplier = 0.9
        else:
            intensity_multiplier = 0.8

        if workout_type == "Strength":
            if focus == "Lower Body":
                exercises = [
                    {
                        "name": "Back Squat",
                        "sets": 5,
                        "reps": 5,
                        "weight": int(130 * intensity_multiplier),
                    },
                    {
                        "name": "Romanian Deadlift",
                        "sets": 4,
                        "reps": 6,
                        "weight": int(100 * intensity_multiplier),
                    },
                    {
                        "name": "Split Squat",
                        "sets": 3,
                        "reps": 8,
                        "weight": int(80 * intensity_multiplier),
                    },
                    {
                        "name": "Leg Press",
                        "sets": 3,
                        "reps": 10,
                        "weight": int(200 * intensity_multiplier),
                    },
                ]
            else:
                exercises = [
                    {
                        "name": "Bench Press",
                        "sets": 5,
                        "reps": 5,
                        "weight": int(100 * intensity_multiplier),
                    },
                    {"name": "Pull-ups", "sets": 4, "reps": 8},
                    {
                        "name": "Military Press",
                        "sets": 3,
                        "reps": 8,
                        "weight": int(60 * intensity_multiplier),
                    },
                    {
                        "name": "Barbell Row",
                        "sets": 3,
                        "reps": 10,
                        "weight": int(80 * intensity_multiplier),
                    },
                ]

        elif workout_type == "Speed":
            if focus == "Acceleration":
                exercises = [
                    {"name": "Resisted Sprints", "sets": 6, "distance": 20, "rest": 90},
                    {"name": "Block Starts", "sets": 8, "distance": 15, "rest": 120},
                    {"name": "Hill Sprints", "sets": 4, "duration": 12, "rest": 180},
                ]
            else:
                exercises = [
                    {"name": "Flying Sprints", "sets": 5, "distance": 30, "rest": 120},
                    {"name": "Tempo Runs", "sets": 3, "distance": 80, "rest": 180},
                    {
                        "name": "Sprint-Float-Sprint",
                        "sets": 4,
                        "distance": 60,
                        "rest": 240,
                    },
                ]

        elif workout_type == "Power":
            exercises = [
                {
                    "name": "Power Clean",
                    "sets": 5,
                    "reps": 3,
                    "weight": int(80 * intensity_multiplier),
                },
                {
                    "name": "Box Jumps",
                    "sets": 4,
                    "reps": 8,
                    "height": int(30 * intensity_multiplier),
                },
                {"name": "Medicine Ball Throws", "sets": 4, "reps": 10},
                {"name": "Plyometric Lunges", "sets": 3, "reps": 12},
            ]

        elif workout_type == "Technique":
            exercises = [
                {
                    "name": "Sprint Technique Drills",
                    "sets": 4,
                    "duration": 10,
                    "rest": 60,
                },
                {
                    "name": "Technical Bobsleigh Drills",
                    "sets": 6,
                    "duration": 5,
                    "rest": 90,
                },
                {"name": "Video Analysis Session", "duration": 30},
            ]

        elif workout_type in ("Recovery", "Light Strength"):
            exercises = [
                {"name": "Mobility Circuit", "sets": 3, "duration": 10, "rest": 60},
                {
                    "name": "Light Bodyweight Circuit",
                    "sets": 2,
                    "reps": 15,
                    "rest": 60,
                },
                {"name": "Foam Rolling", "duration": 15},
                {"name": "Static Stretching", "duration": 15},
            ]

        elif workout_type == "Mobility":
            exercises = [
                {
                    "name": "Dynamic Mobility Routine",
                    "sets": 3,
                    "duration": 10,
                    "rest": 30,
                },
                {"name": "Yoga Flow", "duration": 30},
                {"name": "Foam Rolling", "duration": 20},
            ]

        return exercises
