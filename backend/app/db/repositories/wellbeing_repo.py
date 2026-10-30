"""Wellbeing repository for daily check-in and readiness operations.

The wellbeing_assessments table uses `assessment_date` and `athlete_id`
as defined in fresh_clean_schema.sql. Endpoints that receive a user_id
must first resolve to athlete_id via the athletes table.
"""

from app.db.repositories.base import BaseRepository


class WellbeingRepository(BaseRepository):
    """Repository for wellbeing_assessments data access."""

    def get_by_athlete_and_date(
        self, athlete_id: str, assessment_date: str
    ) -> dict | None:
        """Get a wellbeing assessment for an athlete on a specific date.

        Used for upsert check and today's check-in retrieval.

        Args:
            athlete_id: UUID of the athlete.
            assessment_date: Date string (YYYY-MM-DD).

        Returns:
            Assessment dict or None.
        """
        return self._execute_one(
            "SELECT * FROM wellbeing_assessments "
            "WHERE athlete_id = :athlete_id AND assessment_date = :date",
            {"athlete_id": athlete_id, "date": assessment_date},
        )

    def get_by_user_and_date(
        self, user_id: str, assessment_date: str
    ) -> dict | None:
        """Get a wellbeing assessment by user_id and date.

        Joins with athletes table to resolve user_id -> athlete_id.

        Args:
            user_id: UUID of the auth user.
            assessment_date: Date string (YYYY-MM-DD).

        Returns:
            Assessment dict or None.
        """
        return self._execute_one(
            "SELECT wa.* FROM wellbeing_assessments wa "
            "JOIN athletes a ON wa.athlete_id = a.id "
            "WHERE a.user_id = :user_id AND wa.assessment_date = :date",
            {"user_id": user_id, "date": assessment_date},
        )

    def get_latest(self, athlete_id: str) -> dict | None:
        """Get the most recent wellbeing assessment for an athlete.

        Args:
            athlete_id: UUID of the athlete.

        Returns:
            Most recent assessment dict or None.
        """
        return self._execute_one(
            "SELECT * FROM wellbeing_assessments "
            "WHERE athlete_id = :athlete_id "
            "ORDER BY assessment_date DESC LIMIT 1",
            {"athlete_id": athlete_id},
        )

    def get_latest_by_user(self, user_id: str) -> dict | None:
        """Get the most recent wellbeing assessment by user_id.

        Joins with athletes table.

        Args:
            user_id: UUID of the auth user.

        Returns:
            Most recent assessment dict or None.
        """
        return self._execute_one(
            "SELECT wa.* FROM wellbeing_assessments wa "
            "JOIN athletes a ON wa.athlete_id = a.id "
            "WHERE a.user_id = :user_id "
            "ORDER BY wa.assessment_date DESC LIMIT 1",
            {"user_id": user_id},
        )

    def get_range(
        self, athlete_id: str, date_from: str, date_to: str = None
    ) -> list[dict]:
        """Get wellbeing assessments within a date range.

        Args:
            athlete_id: UUID of the athlete.
            date_from: Start date (YYYY-MM-DD).
            date_to: End date (YYYY-MM-DD), optional.

        Returns:
            List of assessment dicts ordered by date ascending.
        """
        if date_to:
            return self._execute(
                "SELECT * FROM wellbeing_assessments "
                "WHERE athlete_id = :athlete_id "
                "AND assessment_date >= :date_from AND assessment_date <= :date_to "
                "ORDER BY assessment_date ASC",
                {
                    "athlete_id": athlete_id,
                    "date_from": date_from,
                    "date_to": date_to,
                },
            )
        return self._execute(
            "SELECT * FROM wellbeing_assessments "
            "WHERE athlete_id = :athlete_id AND assessment_date >= :date_from "
            "ORDER BY assessment_date ASC",
            {"athlete_id": athlete_id, "date_from": date_from},
        )

    def get_range_by_user(
        self, user_id: str, date_from: str
    ) -> list[dict]:
        """Get wellbeing assessments for a user within a date range.

        Joins with athletes table to resolve user_id.

        Args:
            user_id: UUID of the auth user.
            date_from: Start date (YYYY-MM-DD).

        Returns:
            List of assessment dicts ordered by date ascending.
        """
        return self._execute(
            "SELECT wa.* FROM wellbeing_assessments wa "
            "JOIN athletes a ON wa.athlete_id = a.id "
            "WHERE a.user_id = :user_id AND wa.assessment_date >= :date_from "
            "ORDER BY wa.assessment_date ASC",
            {"user_id": user_id, "date_from": date_from},
        )

    def upsert(self, athlete_id: str, assessment_date: str, data: dict) -> dict:
        """Upsert a wellbeing assessment.

        Checks for existing record by athlete_id + date, then updates or inserts.

        Args:
            athlete_id: UUID of the athlete.
            assessment_date: Date string (YYYY-MM-DD).
            data: Dict of column values (excluding athlete_id and assessment_date).

        Returns:
            The upserted assessment dict.
        """
        existing = self.get_by_athlete_and_date(athlete_id, assessment_date)

        if existing:
            # Update existing record
            set_clauses = ", ".join(f"{k} = :{k}" for k in data.keys())
            params = {**data, "id": existing["id"]}
            result = self._execute_update(
                f"UPDATE wellbeing_assessments SET {set_clauses} "
                f"WHERE id = :id RETURNING *",
                params,
            )
            return result if result else existing
        else:
            # Insert new record
            full_data = {
                "athlete_id": athlete_id,
                "assessment_date": assessment_date,
                **data,
            }
            columns = ", ".join(full_data.keys())
            placeholders = ", ".join(f":{k}" for k in full_data.keys())
            return self._execute_insert(
                f"INSERT INTO wellbeing_assessments ({columns}) "
                f"VALUES ({placeholders}) RETURNING *",
                full_data,
            )

    def create(self, data: dict) -> dict:
        """Create a new wellbeing assessment.

        Args:
            data: Dict with athlete_id, assessment_date, and metric columns.

        Returns:
            Created assessment dict.
        """
        columns = ", ".join(data.keys())
        placeholders = ", ".join(f":{k}" for k in data.keys())
        return self._execute_insert(
            f"INSERT INTO wellbeing_assessments ({columns}) "
            f"VALUES ({placeholders}) RETURNING *",
            data,
        )

    def update(self, assessment_id: str, data: dict) -> dict | None:
        """Update a wellbeing assessment.

        Args:
            assessment_id: UUID of the assessment.
            data: Dict of column-value pairs to update.

        Returns:
            Updated assessment dict, or None.
        """
        set_clauses = ", ".join(f"{k} = :{k}" for k in data.keys())
        params = {**data, "id": assessment_id}
        return self._execute_update(
            f"UPDATE wellbeing_assessments SET {set_clauses} "
            f"WHERE id = :id RETURNING *",
            params,
        )

    def get_batch_latest_by_athlete_ids(
        self, athlete_ids: list[str]
    ) -> list[dict]:
        """Get the latest wellbeing assessment for each of multiple athletes.

        Uses DISTINCT ON for efficient per-athlete latest record.

        Args:
            athlete_ids: List of athlete UUIDs.

        Returns:
            List of assessment dicts (one per athlete, most recent).
        """
        if not athlete_ids:
            return []

        placeholders = ", ".join(f":aid_{i}" for i in range(len(athlete_ids)))
        params = {f"aid_{i}": aid for i, aid in enumerate(athlete_ids)}

        return self._execute(
            f"SELECT DISTINCT ON (athlete_id) * FROM wellbeing_assessments "
            f"WHERE athlete_id IN ({placeholders}) "
            f"ORDER BY athlete_id, assessment_date DESC",
            params,
        )
