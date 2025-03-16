"""Performance Management Chart (PMC) service.

This module provides services for calculating and analyzing PMC metrics.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional

from app.db.models.performance import TrainingLoad


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

    async def calculate_pmc_for_athlete(
        self, athlete_id: int, days: int = 90
    ) -> Dict[str, List]:
        """Calculate PMC metrics for an athlete.

        Args:
            athlete_id: ID of the athlete
            days: Number of days of history to include

        Returns:
            Dictionary with dates, loads, CTL, ATL, and TSB values
        """
        # In a real implementation, you would query the database
        # training_loads = await db.query(TrainingLoad).filter(
        #     TrainingLoad.athlete_id == athlete_id,
        #     TrainingLoad.date >= (datetime.now() - timedelta(days=days))
        # ).order_by(TrainingLoad.date).all()
        
        # For now, we'll use mock data
        start_date = datetime.now() - timedelta(days=days)
        mock_dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)]
        
        # Generate some realistic training load values with rest days
        np.random.seed(42)  # For reproducible results
        mock_loads = []
        for i in range(days):
            # Create a weekly pattern with rest days
            day_of_week = (start_date + timedelta(days=i)).weekday()
            if day_of_week == 6:  # Sunday
                load = 0  # Rest day
            elif day_of_week == 3:  # Wednesday
                load = np.random.randint(30, 60)  # Light day
            else:
                load = np.random.randint(60, 120)  # Normal training day
            mock_loads.append(load)
        
        # Calculate PMC metrics
        ctl = [0.0] * len(mock_loads)  # Chronic Training Load (fitness)
        atl = [0.0] * len(mock_loads)  # Acute Training Load (fatigue)
        tsb = [0.0] * len(mock_loads)  # Training Stress Balance (form)

        # Set initial values
        if len(mock_loads) > 0:
            ctl[0] = mock_loads[0]
            atl[0] = mock_loads[0]
            tsb[0] = 0.0

        # Calculate CTL, ATL, and TSB for each day
        for i in range(1, len(mock_loads)):
            ctl[i] = ctl[i-1] * self.ctl_decay + mock_loads[i] * (1 - self.ctl_decay)
            atl[i] = atl[i-1] * self.atl_decay + mock_loads[i] * (1 - self.atl_decay)
            tsb[i] = ctl[i] - atl[i]

        return {
            "dates": mock_dates,
            "loads": mock_loads,
            "ctl": ctl,
            "atl": atl,
            "tsb": tsb
        }

    async def get_training_recommendations(
        self, athlete_id: int
    ) -> Dict:
        """Generate training recommendations based on current PMC metrics.

        Args:
            athlete_id: ID of the athlete

        Returns:
            Dictionary with training recommendations
        """
        # Get current PMC metrics
        pmc_data = await self.calculate_pmc_for_athlete(athlete_id, days=90)
        
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
            }
        }
        
        # Generate recommendations based on TSB
        if current_tsb > tsb_high_threshold:
            # High form (well-recovered)
            recommendations["status"] = "Peak Form"
            recommendations["message"] = "You are well-recovered and in peak form. Ideal time for high-intensity training or competition."
            recommendations["load_adjustment"] = 10
            recommendations["focus_areas"] = ["High intensity", "Race-specific", "Technical skills"]
            
        elif current_tsb <= tsb_high_threshold and current_tsb > 0:
            # Moderate form (balanced fitness/fatigue)
            recommendations["status"] = "Good Form"
            recommendations["message"] = "You have good form with balanced fitness and fatigue. Suitable for moderate to high training loads."
            recommendations["load_adjustment"] = 0
            recommendations["focus_areas"] = ["Mixed intensity", "Strength", "Technical work"]
            
        elif current_tsb <= 0 and current_tsb > tsb_low_threshold:
            # Slight fatigue
            recommendations["status"] = "Slight Fatigue"
            recommendations["message"] = "You are showing signs of fatigue. Consider moderate training with recovery emphasis."
            recommendations["load_adjustment"] = -15
            recommendations["focus_areas"] = ["Technique", "Recovery", "Moderate volume"]
            
        elif current_tsb <= tsb_low_threshold and current_tsb > tsb_very_low_threshold:
            # Significant fatigue
            recommendations["status"] = "Significant Fatigue"
            recommendations["message"] = "You have accumulated significant fatigue. Focus on recovery with reduced training load."
            recommendations["load_adjustment"] = -30
            recommendations["focus_areas"] = ["Active recovery", "Mobility", "Low intensity"]
            
        else:  # current_tsb <= tsb_very_low_threshold
            # Extreme fatigue (overtraining risk)
            recommendations["status"] = "Extreme Fatigue"
            recommendations["message"] = "Warning: You are at risk of overtraining. Prioritize recovery and significantly reduce training load."
            recommendations["load_adjustment"] = -50
            recommendations["focus_areas"] = ["Rest", "Recovery", "Rehabilitation"]
            
        return recommendations

    async def generate_workout_recommendations(
        self, athlete_id: int, days_ahead: int = 7
    ) -> List[Dict]:
        """Generate specific workout recommendations for upcoming days.

        Args:
            athlete_id: ID of the athlete
            days_ahead: Number of days to generate recommendations for

        Returns:
            List of workout recommendations
        """
        # Get current training status
        training_status = await self.get_training_recommendations(athlete_id)
        
        # Determine appropriate workout types based on fatigue level
        if training_status["status"] == "Peak Form":
            workout_types = ["Strength", "Speed", "Power", "Technique"]
            intensity_range = "High"
        elif training_status["status"] == "Good Form":
            workout_types = ["Strength", "Speed", "Endurance", "Technique"]
            intensity_range = "Medium-High"
        elif training_status["status"] == "Slight Fatigue":
            workout_types = ["Technique", "Light Strength", "Mobility", "Recovery"]
            intensity_range = "Medium"
        else:  # Significant or Extreme Fatigue
            workout_types = ["Recovery", "Mobility", "Technique", "Rest"]
            intensity_range = "Low"
            
        # Create a simple workout schedule template (can be more sophisticated)
        workout_schedule = []
        today = datetime.now().date()
        
        # For bobsleigh, a typical weekly schedule might look like:
        # Mon: Strength, Tue: Sprint, Wed: Recovery, Thu: Strength, Fri: Speed, Sat: Power, Sun: Rest
        for i in range(days_ahead):
            day = today + timedelta(days=i)
            day_of_week = day.weekday()
            
            if day_of_week == 6:  # Sunday is always rest
                continue
                
            if training_status["status"] in ["Significant Fatigue", "Extreme Fatigue"] and i < 3:
                # Force recovery days at the beginning if fatigue is high
                workout_type = "Recovery"
                focus = "Active Recovery"
                intensity = "Low"
            elif day_of_week == 3:  # Wednesday is lighter
                workout_type = "Technique" if training_status["status"] != "Extreme Fatigue" else "Recovery"
                focus = "Technical Skills" if training_status["status"] != "Extreme Fatigue" else "Active Recovery"
                intensity = "Medium-Low"
            else:
                # Choose workout type based on day of week and current status
                if day_of_week == 0 or day_of_week == 3:  # Monday, Thursday
                    workout_type = "Strength" if training_status["status"] in ["Peak Form", "Good Form"] else "Light Strength"
                    focus = "Lower Body" if day_of_week == 0 else "Upper Body"
                elif day_of_week == 1 or day_of_week == 4:  # Tuesday, Friday
                    workout_type = "Speed" if training_status["status"] in ["Peak Form", "Good Form"] else "Technique"
                    focus = "Acceleration" if day_of_week == 1 else "Top Speed"
                else:  # Saturday
                    workout_type = "Power" if training_status["status"] in ["Peak Form", "Good Form"] else "Mobility"
                    focus = "Explosive Power" if training_status["status"] in ["Peak Form", "Good Form"] else "Recovery"
                
                # Set intensity based on training status
                if training_status["status"] == "Peak Form":
                    intensity = "High"
                elif training_status["status"] == "Good Form":
                    intensity = "Medium-High"
                elif training_status["status"] == "Slight Fatigue":
                    intensity = "Medium"
                else:
                    intensity = "Low"
            
            # Create a sample workout (in a real app, this would be more sophisticated)
            workout = {
                "date": day.strftime("%Y-%m-%d"),
                "workout_type": workout_type,
                "focus": focus,
                "duration": 60 if intensity == "Low" else 75 if intensity == "Medium" else 90,
                "intensity": intensity,
                "exercises": self._generate_exercises_for_workout(workout_type, focus, intensity)
            }
            
            workout_schedule.append(workout)
            
        return workout_schedule
    
    def _generate_exercises_for_workout(self, workout_type: str, focus: str, intensity: str) -> List[Dict]:
        """Generate exercises for a workout based on type and focus.

        Args:
            workout_type: Type of workout (Strength, Speed, etc.)
            focus: Focus area of the workout
            intensity: Intensity level (Low, Medium, High)

        Returns:
            List of exercises for the workout
        """
        # This is a simplified version - in a real app, this would be more sophisticated
        # and would take into account the athlete's level, previous workouts, etc.
        exercises = []
        
        # Define intensity multipliers
        intensity_multiplier = 1.0
        if intensity == "High":
            intensity_multiplier = 1.2
        elif intensity == "Medium-High":
            intensity_multiplier = 1.1
        elif intensity == "Medium":
            intensity_multiplier = 1.0
        elif intensity == "Medium-Low":
            intensity_multiplier = 0.9
        else:  # Low
            intensity_multiplier = 0.8
        
        if workout_type == "Strength":
            if focus == "Lower Body":
                exercises = [
                    {
                        "name": "Back Squat",
                        "sets": 5,
                        "reps": 5,
                        "weight": int(130 * intensity_multiplier)
                    },
                    {
                        "name": "Romanian Deadlift",
                        "sets": 4,
                        "reps": 6,
                        "weight": int(100 * intensity_multiplier)
                    },
                    {
                        "name": "Split Squat",
                        "sets": 3,
                        "reps": 8,
                        "weight": int(80 * intensity_multiplier)
                    },
                    {
                        "name": "Leg Press",
                        "sets": 3,
                        "reps": 10,
                        "weight": int(200 * intensity_multiplier)
                    }
                ]
            else:  # Upper Body
                exercises = [
                    {
                        "name": "Bench Press",
                        "sets": 5,
                        "reps": 5,
                        "weight": int(100 * intensity_multiplier)
                    },
                    {
                        "name": "Pull-ups",
                        "sets": 4,
                        "reps": 8
                    },
                    {
                        "name": "Military Press",
                        "sets": 3,
                        "reps": 8,
                        "weight": int(60 * intensity_multiplier)
                    },
                    {
                        "name": "Barbell Row",
                        "sets": 3,
                        "reps": 10,
                        "weight": int(80 * intensity_multiplier)
                    }
                ]
        
        elif workout_type == "Speed":
            if focus == "Acceleration":
                exercises = [
                    {
                        "name": "Resisted Sprints",
                        "sets": 6,
                        "distance": 20,
                        "rest": 90
                    },
                    {
                        "name": "Block Starts",
                        "sets": 8,
                        "distance": 15,
                        "rest": 120
                    },
                    {
                        "name": "Hill Sprints",
                        "sets": 4,
                        "duration": 12,
                        "rest": 180
                    }
                ]
            else:  # Top Speed
                exercises = [
                    {
                        "name": "Flying Sprints",
                        "sets": 5,
                        "distance": 30,
                        "rest": 120
                    },
                    {
                        "name": "Tempo Runs",
                        "sets": 3,
                        "distance": 80,
                        "rest": 180
                    },
                    {
                        "name": "Sprint-Float-Sprint",
                        "sets": 4,
                        "distance": 60,
                        "rest": 240
                    }
                ]
        
        elif workout_type == "Power":
            exercises = [
                {
                    "name": "Power Clean",
                    "sets": 5,
                    "reps": 3,
                    "weight": int(80 * intensity_multiplier)
                },
                {
                    "name": "Box Jumps",
                    "sets": 4,
                    "reps": 8,
                    "height": int(30 * intensity_multiplier)
                },
                {
                    "name": "Medicine Ball Throws",
                    "sets": 4,
                    "reps": 10
                },
                {
                    "name": "Plyometric Lunges",
                    "sets": 3,
                    "reps": 12
                }
            ]
        
        elif workout_type == "Technique":
            exercises = [
                {
                    "name": "Sprint Technique Drills",
                    "sets": 4,
                    "duration": 10,
                    "rest": 60
                },
                {
                    "name": "Technical Bobsleigh Drills",
                    "sets": 6,
                    "duration": 5,
                    "rest": 90
                },
                {
                    "name": "Video Analysis Session",
                    "duration": 30
                }
            ]
        
        elif workout_type == "Recovery" or workout_type == "Light Strength":
            exercises = [
                {
                    "name": "Mobility Circuit",
                    "sets": 3,
                    "duration": 10,
                    "rest": 60
                },
                {
                    "name": "Light Bodyweight Circuit",
                    "sets": 2,
                    "reps": 15,
                    "rest": 60
                },
                {
                    "name": "Foam Rolling",
                    "duration": 15
                },
                {
                    "name": "Static Stretching",
                    "duration": 15
                }
            ]
        
        elif workout_type == "Mobility":
            exercises = [
                {
                    "name": "Dynamic Mobility Routine",
                    "sets": 3,
                    "duration": 10,
                    "rest": 30
                },
                {
                    "name": "Yoga Flow",
                    "duration": 30
                },
                {
                    "name": "Foam Rolling",
                    "duration": 20
                }
            ]
        
        return exercises
