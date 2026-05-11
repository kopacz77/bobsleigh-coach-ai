"""Performance repository for metrics CRUD and test results.

Handles performance_metrics queries with optional filtering by metric type
and date range, and provides distinct metric type listing for dynamic UI.
"""

from app.db.repositories.base import BaseRepository


class PerformanceRepository(BaseRepository):
    """Repository for performance_metrics data access."""

    def get_by_athlete(
        self,
        athlete_id: str,
        metric_type: str = None,
        date_from: str = None,
        date_to: str = None,
        limit: int = 50,
    ) -> list[dict]:
        """Get performance metrics for an athlete with optional filters.

        Args:
            athlete_id: UUID of the athlete.
            metric_type: Optional metric type filter (e.g. '1rm_squat').
            date_from: Optional start date (YYYY-MM-DD).
            date_to: Optional end date (YYYY-MM-DD).
            limit: Maximum results (default 50).

        Returns:
            List of metric dicts ordered by date DESC.
        """
        conditions = ["athlete_id = :athlete_id"]
        params: dict = {"athlete_id": athlete_id, "limit": limit}

        if metric_type:
            conditions.append("metric_name = :metric_type")
            params["metric_type"] = metric_type
        if date_from:
            conditions.append("date >= :date_from")
            params["date_from"] = date_from
        if date_to:
            conditions.append("date <= :date_to")
            params["date_to"] = date_to

        where = " AND ".join(conditions)
        return self._execute(
            f"SELECT * FROM performance_metrics WHERE {where} "
            f"ORDER BY date DESC LIMIT :limit",
            params,
        )

    def get_by_id(self, metric_id: str) -> dict | None:
        """Get a performance metric by primary key.

        Args:
            metric_id: UUID of the metric record.

        Returns:
            Metric dict or None.
        """
        return self._execute_one(
            "SELECT * FROM performance_metrics WHERE id = :id",
            {"id": metric_id},
        )

    def create(self, data: dict) -> dict:
        """Create a new performance metric record.

        Args:
            data: Dict of column values to insert.

        Returns:
            The created metric dict.
        """
        columns = ", ".join(data.keys())
        placeholders = ", ".join(f":{k}" for k in data.keys())
        return self._execute_insert(
            f"INSERT INTO performance_metrics ({columns}) VALUES ({placeholders}) RETURNING *",
            data,
        )

    def get_metric_types(self, athlete_id: str) -> list[str]:
        """Get distinct metric types for an athlete.

        Used for dynamic metric grouping in the UI.

        Args:
            athlete_id: UUID of the athlete.

        Returns:
            List of distinct metric_name strings.
        """
        rows = self._execute(
            "SELECT DISTINCT metric_name FROM performance_metrics "
            "WHERE athlete_id = :athlete_id "
            "ORDER BY metric_name",
            {"athlete_id": athlete_id},
        )
        return [row["metric_name"] for row in rows]

    def get_trends(
        self,
        athlete_id: str,
        metric: str,
        date_from: str,
    ) -> list[dict]:
        """Get performance trend data for a specific metric.

        Args:
            athlete_id: UUID of the athlete.
            metric: Metric name to filter by (e.g. '1rm_squat', '30m_sprint').
            date_from: Start date (YYYY-MM-DD).

        Returns:
            List of metric dicts ordered by date ASC.
        """
        return self._execute(
            "SELECT * FROM performance_metrics "
            "WHERE athlete_id = :athlete_id "
            "AND metric_name = :metric "
            "AND date >= :date_from "
            "ORDER BY date ASC",
            {"athlete_id": athlete_id, "metric": metric, "date_from": date_from},
        )
