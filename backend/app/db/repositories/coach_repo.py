"""Coach repository for roster management, relationships, and dashboard queries.

Handles coach lookup, athlete roster JOIN queries, coach-athlete relationship
management with soft-delete via ended_at, and batch athlete data fetching.
"""

from app.db.repositories.base import BaseRepository


class CoachRepository(BaseRepository):
    """Repository for coach and coach_athletes data access."""

    def get_by_user_id(self, user_id: str) -> dict | None:
        """Get the coach record for an auth user.

        Args:
            user_id: UUID of the auth user.

        Returns:
            Coach dict or None if not found.
        """
        return self._execute_one(
            "SELECT * FROM coaches WHERE user_id = :uid",
            {"uid": user_id},
        )

    def get_by_id(self, coach_id: str) -> dict | None:
        """Get a coach by primary key.

        Args:
            coach_id: UUID of the coach.

        Returns:
            Coach dict or None.
        """
        return self._execute_one(
            "SELECT * FROM coaches WHERE id = :id",
            {"id": coach_id},
        )

    def get_coach_id_by_user_id(self, user_id: str) -> str | None:
        """Get just the coach UUID for a user.

        Args:
            user_id: UUID of the auth user.

        Returns:
            Coach UUID string or None.
        """
        row = self._execute_one(
            "SELECT id FROM coaches WHERE user_id = :uid",
            {"uid": user_id},
        )
        return row["id"] if row else None

    def get_athletes(self, coach_id: str) -> list[dict]:
        """Get the coach's athlete roster with joined athlete data.

        Returns active coaching relationships (ended_at IS NULL) with
        athlete details (name, email, active status).

        Args:
            coach_id: UUID of the coach.

        Returns:
            List of roster entries with athlete details.
        """
        return self._execute(
            "SELECT ca.athlete_id, ca.relationship_type, ca.access_level, "
            "ca.started_at, "
            "a.id, a.first_name, a.last_name, a.email, a.is_active "
            "FROM coach_athletes ca "
            "JOIN athletes a ON ca.athlete_id = a.id "
            "WHERE ca.coach_id = :coach_id AND ca.ended_at IS NULL",
            {"coach_id": coach_id},
        )

    def get_athlete_ids(self, coach_id: str) -> list[str]:
        """Get just the athlete IDs for a coach's active roster.

        Args:
            coach_id: UUID of the coach.

        Returns:
            List of athlete UUID strings.
        """
        rows = self._execute(
            "SELECT athlete_id FROM coach_athletes "
            "WHERE coach_id = :coach_id AND ended_at IS NULL",
            {"coach_id": coach_id},
        )
        return [row["athlete_id"] for row in rows]

    def add_athlete(self, coach_id: str, athlete_id: str, relationship_type: str = "primary") -> dict:
        """Add an athlete to the coach's roster.

        Args:
            coach_id: UUID of the coach.
            athlete_id: UUID of the athlete.
            relationship_type: Type of relationship (default: primary).

        Returns:
            The created coach_athletes row.
        """
        return self._execute_insert(
            "INSERT INTO coach_athletes "
            "(coach_id, athlete_id, relationship_type, access_level, started_at) "
            "VALUES (:coach_id, :athlete_id, :relationship_type, 'full', CURRENT_DATE) "
            "RETURNING *",
            {
                "coach_id": coach_id,
                "athlete_id": athlete_id,
                "relationship_type": relationship_type,
            },
        )

    def remove_athlete(self, coach_id: str, athlete_id: str) -> dict | None:
        """Soft-remove an athlete from the coach's roster.

        Sets ended_at to today rather than deleting the row,
        preserving the coaching relationship history.

        Args:
            coach_id: UUID of the coach.
            athlete_id: UUID of the athlete.

        Returns:
            Updated coach_athletes row, or None if not found.
        """
        return self._execute_update(
            "UPDATE coach_athletes SET ended_at = CURRENT_DATE "
            "WHERE coach_id = :coach_id AND athlete_id = :athlete_id "
            "AND ended_at IS NULL "
            "RETURNING *",
            {"coach_id": coach_id, "athlete_id": athlete_id},
        )

    def get_all_active(self) -> list[dict]:
        """Get all active coaches.

        Used for batch plan generation scheduler.

        Returns:
            List of all coach dicts.
        """
        return self._execute("SELECT * FROM coaches")

    def athlete_exists(self, athlete_id: str) -> bool:
        """Check if an athlete exists.

        Args:
            athlete_id: UUID of the athlete.

        Returns:
            True if athlete exists.
        """
        row = self._execute_one(
            "SELECT id FROM athletes WHERE id = :id",
            {"id": athlete_id},
        )
        return row is not None

    def get_athlete_names(self, athlete_ids: list[str]) -> dict[str, str]:
        """Batch-fetch athlete names.

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

    def get_athletes_with_user_ids(self, athlete_ids: list[str]) -> list[dict]:
        """Batch-fetch athlete records with user_id for a list of athlete IDs.

        Args:
            athlete_ids: List of athlete UUIDs.

        Returns:
            List of athlete dicts with id, user_id, first_name, last_name.
        """
        if not athlete_ids:
            return []

        placeholders = ", ".join(f":aid_{i}" for i in range(len(athlete_ids)))
        params = {f"aid_{i}": aid for i, aid in enumerate(athlete_ids)}

        return self._execute(
            f"SELECT id, user_id, first_name, last_name FROM athletes "
            f"WHERE id IN ({placeholders})",
            params,
        )
