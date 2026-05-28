"""Performance service for handling athlete performance data and analysis.

This module provides services for analyzing and visualizing athlete performance
using the repository layer (SQLAlchemy-backed).
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

from app.db.repositories.performance_repo import PerformanceRepository
from app.services.pmc_service import PMCService


class PerformanceService:
    """Service for performance-related functionality."""

    def __init__(self):
        """Initialize the performance service."""
        self.pmc_service = PMCService()
        self.performance_repo = PerformanceRepository()

    async def get_performance_metrics(self, athlete_id: str) -> List[Dict]:
        """Get performance metrics for an athlete from the database.

        Args:
            athlete_id: UUID of the athlete

        Returns:
            List of performance metric records
        """
        return self.performance_repo.get_by_athlete(athlete_id)

    async def get_performance_trends(
        self, athlete_id: str, metric: str, days: int = 90
    ) -> List[Dict]:
        """Get performance trend data for a specific metric from the database.

        Args:
            athlete_id: UUID of the athlete
            metric: Metric name to filter by (e.g., '1rm_squat', '30m_sprint')
            days: Number of days of history to include

        Returns:
            List of performance metric records filtered by metric and date range
        """
        from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        return self.performance_repo.get_trends(athlete_id, metric, from_date)

    async def get_training_load(self, athlete_id: str, days: int = 90) -> Dict:
        """Get training load data using the PMC model with real database data.

        Args:
            athlete_id: UUID of the athlete
            days: Number of days of history to include

        Returns:
            Dictionary with PMC data (CTL, ATL, TSB) and recommendations
        """
        # Use the PMC service to calculate metrics from real database data
        pmc_data = await self.pmc_service.calculate_pmc_for_athlete(athlete_id, days)

        # If no data exists, return empty/default response
        if not pmc_data["dates"]:
            return {
                "athlete_id": athlete_id,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "ctl": 0.0,
                "atl": 0.0,
                "tsb": 0.0,
                "daily_load": [],
                "recommendations": {
                    "status": "No Data",
                    "message": "No training load data available. Start logging workouts to see PMC metrics.",
                    "load_adjustment": 0,
                    "focus_areas": [],
                    "current_metrics": {"ctl": 0.0, "atl": 0.0, "tsb": 0.0},
                },
            }

        # Get training recommendations
        recommendations = await self.pmc_service.get_training_recommendations(
            athlete_id
        )

        return {
            "athlete_id": athlete_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "ctl": pmc_data["ctl"][-1],
            "atl": pmc_data["atl"][-1],
            "tsb": pmc_data["tsb"][-1],
            "daily_load": [
                {
                    "date": d,
                    "load": load,
                    "ctl": ctl,
                    "atl": atl,
                    "tsb": tsb,
                }
                for d, load, ctl, atl, tsb in zip(
                    pmc_data["dates"],
                    pmc_data["loads"],
                    pmc_data["ctl"],
                    pmc_data["atl"],
                    pmc_data["tsb"],
                )
            ],
            "recommendations": recommendations,
        }

    async def get_peer_comparison(self, athlete_id: str) -> Dict:
        """Get performance comparison against peers.

        Args:
            athlete_id: UUID of the athlete

        Returns:
            Placeholder response - peer comparison not yet implemented
        """
        return {
            "message": "Peer comparison not yet implemented",
            "data": [],
        }
