"""Plan repository for weekly training plans CRUD and approval workflow.

Handles plan creation, status transitions (pending -> approved/rejected),
versioning for rejection-regeneration lineage, and athlete/coach scoped queries.
"""

from app.db.repositories.base import BaseRepository


class PlanRepository(BaseRepository):
    """Repository for weekly_plans data access."""

    def get_by_id(self, plan_id: str) -> dict | None:
        """Get a plan by primary key.

        Args:
            plan_id: UUID of the plan.

        Returns:
            Plan dict or None.
        """
        return self._execute_one(
            "SELECT * FROM weekly_plans WHERE id = :id",
            {"id": plan_id},
        )

    def get_current_for_athlete(self, athlete_id: str, current_monday: str) -> dict | None:
        """Get the latest approved plan for the current/upcoming week.

        Args:
            athlete_id: UUID of the athlete.
            current_monday: Monday date string (YYYY-MM-DD) for the target week.

        Returns:
            Plan dict or None.
        """
        return self._execute_one(
            "SELECT * FROM weekly_plans "
            "WHERE athlete_id = :athlete_id "
            "AND status = 'approved' "
            "AND week_start = :week_start "
            "ORDER BY created_at DESC LIMIT 1",
            {"athlete_id": athlete_id, "week_start": current_monday},
        )

    def get_today_for_athlete(self, athlete_id: str, current_monday: str) -> dict | None:
        """Get the approved plan covering today's date.

        Args:
            athlete_id: UUID of the athlete.
            current_monday: Monday of the current week (YYYY-MM-DD).

        Returns:
            Plan dict or None.
        """
        return self._execute_one(
            "SELECT * FROM weekly_plans "
            "WHERE athlete_id = :athlete_id "
            "AND status = 'approved' "
            "AND week_start = :week_start "
            "ORDER BY created_at DESC LIMIT 1",
            {"athlete_id": athlete_id, "week_start": current_monday},
        )

    def get_pending_for_coach(self, athlete_ids: list[str]) -> list[dict]:
        """Get pending plans for a list of athlete IDs, ordered by week_start.

        Args:
            athlete_ids: List of athlete UUIDs (from coach roster).

        Returns:
            List of pending plan dicts.
        """
        if not athlete_ids:
            return []

        placeholders = ", ".join(f":aid_{i}" for i in range(len(athlete_ids)))
        params = {f"aid_{i}": aid for i, aid in enumerate(athlete_ids)}

        return self._execute(
            f"SELECT id, athlete_id, week_start, week_end, training_phase, "
            f"status, version, injury_risk_score, injury_risk_factors, "
            f"generation_metadata, created_at "
            f"FROM weekly_plans "
            f"WHERE athlete_id IN ({placeholders}) "
            f"AND status = 'pending_review' "
            f"ORDER BY week_start, created_at",
            params,
        )

    def get_for_athlete(
        self,
        athlete_id: str,
        status: str = None,
        limit: int = 10,
    ) -> list[dict]:
        """Get plans for an athlete with optional status filter.

        Args:
            athlete_id: UUID of the athlete.
            status: Optional status filter (pending_review, approved, rejected).
            limit: Maximum results.

        Returns:
            List of plan dicts ordered by week_start DESC.
        """
        conditions = ["athlete_id = :athlete_id"]
        params: dict = {"athlete_id": athlete_id, "limit": limit}

        if status:
            conditions.append("status = :status")
            params["status"] = status

        where = " AND ".join(conditions)
        return self._execute(
            f"SELECT * FROM weekly_plans WHERE {where} "
            f"ORDER BY week_start DESC LIMIT :limit",
            params,
        )

    def create(self, data: dict) -> dict:
        """Create a new plan.

        Args:
            data: Dict of column values to insert.

        Returns:
            The created plan dict.
        """
        columns = ", ".join(data.keys())
        placeholders = ", ".join(f":{k}" for k in data.keys())
        return self._execute_insert(
            f"INSERT INTO weekly_plans ({columns}) VALUES ({placeholders}) RETURNING *",
            data,
        )

    def update_status(
        self,
        plan_id: str,
        status: str,
        user_id: str,
        notes: str = None,
    ) -> dict | None:
        """Update plan status with approval/rejection metadata.

        Sets the appropriate timestamp and user fields based on the
        target status (approved or rejected).

        Args:
            plan_id: UUID of the plan.
            status: New status (approved or rejected).
            user_id: UUID of the coach performing the action.
            notes: Optional rejection notes.

        Returns:
            Updated plan dict, or None if not found.
        """
        if status == "approved":
            return self._execute_update(
                "UPDATE weekly_plans SET "
                "status = :status, "
                "approved_at = NOW(), "
                "approved_by = :user_id "
                "WHERE id = :id RETURNING *",
                {"status": status, "user_id": user_id, "id": plan_id},
            )
        elif status == "rejected":
            return self._execute_update(
                "UPDATE weekly_plans SET "
                "status = :status, "
                "rejected_at = NOW(), "
                "rejected_by = :user_id, "
                "rejection_notes = :notes "
                "WHERE id = :id RETURNING *",
                {
                    "status": status,
                    "user_id": user_id,
                    "notes": notes,
                    "id": plan_id,
                },
            )
        else:
            return self._execute_update(
                "UPDATE weekly_plans SET status = :status "
                "WHERE id = :id RETURNING *",
                {"status": status, "id": plan_id},
            )

    def get_latest_version(self, athlete_id: str, week_start: str) -> dict | None:
        """Get the latest version of a plan for a given athlete and week.

        Args:
            athlete_id: UUID of the athlete.
            week_start: Monday date string (YYYY-MM-DD).

        Returns:
            Most recent plan version dict, or None.
        """
        return self._execute_one(
            "SELECT * FROM weekly_plans "
            "WHERE athlete_id = :athlete_id AND week_start = :week_start "
            "ORDER BY version DESC, created_at DESC LIMIT 1",
            {"athlete_id": athlete_id, "week_start": week_start},
        )

    def create_new_version(self, data: dict) -> dict:
        """Create a new plan version (for regeneration after rejection).

        Same as create but semantically distinct for clarity.

        Args:
            data: Dict with parent_plan_id and incremented version.

        Returns:
            The created plan dict.
        """
        return self.create(data)

    def get_athlete_names(self, athlete_ids: list[str]) -> dict[str, str]:
        """Batch-fetch athlete names for a list of IDs.

        Args:
            athlete_ids: List of athlete UUIDs.

        Returns:
            Dict mapping athlete_id -> "first_name last_name".
        """
        if not athlete_ids:
            return {}

        placeholders = ", ".join(f":aid_{i}" for i in range(len(athlete_ids)))
        params = {f"aid_{i}": aid for i, aid in enumerate(athlete_ids)}

        rows = self._execute(
            f"SELECT id, first_name, last_name FROM athletes "
            f"WHERE id IN ({placeholders})",
            params,
        )
        return {
            row["id"]: f"{row['first_name']} {row['last_name']}"
            for row in rows
        }
