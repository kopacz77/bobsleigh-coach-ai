"""Performance service for handling athlete performance data and analysis.

This module provides services for analyzing and visualizing athlete performance.
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

from app.services.pmc_service import PMCService


class PerformanceService:
    """Service for performance-related functionality."""

    def __init__(self):
        """Initialize the performance service."""
        self.pmc_service = PMCService()

    async def get_performance_metrics(self, athlete_id: int) -> Dict:
        """Get current performance metrics for an athlete.

        Args:
            athlete_id: ID of the athlete

        Returns:
            Dictionary of performance metrics
        """
        # In a real implementation, this would query the database
        # Here we're returning mock data for demonstration
        return {
            "athlete_id": athlete_id,
            "strength_metrics": {
                "squat_1rm": 150,
                "bench_1rm": 100,
                "deadlift_1rm": 180,
                "power_clean_1rm": 90,
                "strength_score": 85,
            },
            "speed_metrics": {
                "30m_best": 4.1,
                "60m_best": 7.3,
                "speed_score": 78,
            },
            "power_metrics": {
                "vertical_jump": 65,
                "broad_jump": 280,
                "med_ball_throw": 850,
                "power_score": 82,
            },
        }

    async def get_performance_trends(self, athlete_id: int, metric: str, days: int = 90) -> Dict:
        """Get performance trend data for a specific metric.

        Args:
            athlete_id: ID of the athlete
            metric: Metric to get trends for (e.g., "squat_1rm", "30m_best")
            days: Number of days of history to include

        Returns:
            Dictionary with dates and values
        """
        # In a real implementation, this would query the database
        # Here we're generating mock trend data
        start_date = datetime.now() - timedelta(days=days)
        dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(0, days, 14)]
        
        # Generate different trend data based on the metric
        values = []
        if metric == "squat_1rm":
            base_value = 140
            for i in range(len(dates)):
                # Gradual improvement with occasional plateaus
                if i % 3 == 0 and i > 0:
                    values.append(values[-1])  # Plateau
                else:
                    values.append(base_value + i * 2.5)  # Improvement
        
        elif metric == "30m_best":
            base_value = 4.3
            for i in range(len(dates)):
                # Times decrease (improve) with occasional setbacks
                if i % 4 == 0 and i > 0:
                    values.append(values[-1] + 0.05)  # Slight setback
                else:
                    values.append(base_value - i * 0.03)  # Improvement
        
        elif metric == "vertical_jump":
            base_value = 60
            for i in range(len(dates)):
                # Gradual improvement
                values.append(base_value + i * 0.8)
        
        else:
            # Generic upward trend for other metrics
            base_value = 100
            for i in range(len(dates)):
                values.append(base_value + i * 5)
        
        return {
            "athlete_id": athlete_id,
            "metric": metric,
            "trend_data": [
                {"date": date, "value": value} for date, value in zip(dates, values)
            ]
        }

    async def get_training_load(self, athlete_id: int, days: int = 90) -> Dict:
        """Get training load data using the PMC model.

        Args:
            athlete_id: ID of the athlete
            days: Number of days of history to include

        Returns:
            Dictionary with PMC data
        """
        # Use the PMC service to calculate the metrics
        pmc_data = await self.pmc_service.calculate_pmc_for_athlete(athlete_id, days)
        
        # Get training recommendations
        recommendations = await self.pmc_service.get_training_recommendations(athlete_id)
        
        # Combine into a single response
        return {
            "athlete_id": athlete_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "ctl": pmc_data["ctl"][-1],  # Current CTL (fitness)
            "atl": pmc_data["atl"][-1],  # Current ATL (fatigue)
            "tsb": pmc_data["tsb"][-1],  # Current TSB (form)
            "daily_load": [
                {
                    "date": date,
                    "load": load,
                    "ctl": ctl,
                    "atl": atl,
                    "tsb": tsb
                } for date, load, ctl, atl, tsb in zip(
                    pmc_data["dates"][-8:],  # Last 8 days
                    pmc_data["loads"][-8:],
                    pmc_data["ctl"][-8:],
                    pmc_data["atl"][-8:],
                    pmc_data["tsb"][-8:]
                )
            ],
            "recommendations": recommendations
        }

    async def get_peer_comparison(self, athlete_id: int) -> Dict:
        """Get performance comparison against peers.

        Args:
            athlete_id: ID of the athlete

        Returns:
            Dictionary with comparison data
        """
        # In a real implementation, this would query the database
        # Here we're returning mock data for demonstration
        return {
            "athlete_id": athlete_id,
            "percentiles": {
                "strength": 85,  # 85th percentile among peers
                "speed": 75,
                "power": 82,
                "overall": 80,
            },
            "ranking": {
                "team_rank": 3,
                "total_athletes": 12,
            },
            "top_performers": [
                {
                    "athlete_id": 2,
                    "name": "Jane Smith",
                    "overall_score": 92,
                },
                {
                    "athlete_id": 5,
                    "name": "Alex Johnson",
                    "overall_score": 88,
                },
                {
                    "athlete_id": athlete_id,
                    "name": "John Doe",
                    "overall_score": 80,
                },
            ]
        }
