"""Athlete repository for CRUD operations on the athletes table.

Handles user-scoped queries, soft-delete, and dynamic update building.
"""

from app.db.repositories.base import BaseRepository


class AthleteRepository(BaseRepository):
    """Repository for athlete data access."""

    def get_by_user_id(self, user_id: str) -> dict | None:
        """Get the active athlete record for a user.

        Args:
            user_id: UUID of the auth user.

        Returns:
            Athlete dict or None if not found.
        """
        return self._execute_one(
            "SELECT * FROM athletes WHERE user_id = :uid AND is_active = true",
            {"uid": user_id},
        )

    def get_active_by_user_id(self, user_id: str) -> list[dict]:
        """Get all active athlete records for a user.

        Args:
            user_id: UUID of the auth user.

        Returns:
            List of athlete dicts (typically one per user).
        """
        return self._execute(
            "SELECT * FROM athletes WHERE user_id = :uid AND is_active = true",
            {"uid": user_id},
        )

    def get_by_id(self, athlete_id: str) -> dict | None:
        """Get an athlete by primary key.

        Args:
            athlete_id: UUID of the athlete.

        Returns:
            Athlete dict or None.
        """
        return self._execute_one(
            "SELECT * FROM athletes WHERE id = :id",
            {"id": athlete_id},
        )

    def get_all_active(self) -> list[dict]:
        """Get all active athletes.

        Returns:
            List of all active athlete dicts.
        """
        return self._execute(
            "SELECT * FROM athletes WHERE is_active = true"
        )

    def get_all_active_with_fields(self, fields: str = "*") -> list[dict]:
        """Get all active athletes with specific fields.

        Args:
            fields: Comma-separated column names to select.

        Returns:
            List of athlete dicts with requested fields.
        """
        return self._execute(
            f"SELECT {fields} FROM athletes WHERE is_active = true"
        )

    def get_id_by_user_id(self, user_id: str) -> str | None:
        """Get just the athlete_id for a user.

        Args:
            user_id: UUID of the auth user.

        Returns:
            Athlete UUID string or None.
        """
        row = self._execute_one(
            "SELECT id FROM athletes WHERE user_id = :uid AND is_active = true",
            {"uid": user_id},
        )
        return row["id"] if row else None

    def verify_ownership(self, athlete_id: str, user_id: str) -> bool:
        """Check that an athlete belongs to a user.

        Args:
            athlete_id: UUID of the athlete.
            user_id: UUID of the auth user.

        Returns:
            True if the athlete belongs to the user.
        """
        row = self._execute_one(
            "SELECT id FROM athletes WHERE id = :aid AND user_id = :uid",
            {"aid": athlete_id, "uid": user_id},
        )
        return row is not None

    def create(self, data: dict) -> dict:
        """Create a new athlete.

        Args:
            data: Dict of column values to insert.

        Returns:
            The created athlete dict with generated UUID.
        """
        columns = ", ".join(data.keys())
        placeholders = ", ".join(f":{k}" for k in data.keys())
        return self._execute_insert(
            f"INSERT INTO athletes ({columns}) VALUES ({placeholders}) RETURNING *",
            data,
        )

    def update(self, athlete_id: str, data: dict) -> dict | None:
        """Update an athlete record.

        Dynamically builds the SET clause from data dict keys.

        Args:
            athlete_id: UUID of the athlete.
            data: Dict of column-value pairs to update.

        Returns:
            Updated athlete dict, or None if not found.
        """
        set_clauses = ", ".join(f"{k} = :{k}" for k in data.keys())
        params = {**data, "id": athlete_id}
        return self._execute_update(
            f"UPDATE athletes SET {set_clauses}, updated_at = NOW() "
            f"WHERE id = :id RETURNING *",
            params,
        )

    def soft_delete(self, athlete_id: str) -> dict | None:
        """Soft-delete an athlete by setting is_active to false.

        Args:
            athlete_id: UUID of the athlete.

        Returns:
            Updated athlete dict, or None if not found.
        """
        return self._execute_update(
            "UPDATE athletes SET is_active = false, updated_at = NOW() "
            "WHERE id = :id RETURNING *",
            {"id": athlete_id},
        )
