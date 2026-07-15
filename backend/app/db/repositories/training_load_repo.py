"""Training load repository for PMC data and sRPE upsert.

Provides date-range queries for PMC chart calculation and additive
upsert for training load accumulation (multiple workouts per day).

Note: The TrainingLoadRepository in workout_repo.py (Plan 07-02) is the
original implementation. This module provides the same class with
additional methods required by service-layer migration. The workout_repo
version remains for backward compatibility.
"""

import logging

from app.db.repositories.base import BaseRepository

logger = logging.getLogger(__name__)


class TrainingLoadRepository(BaseRepository):
    """Repository for training_loads table operations."""

    def get_by_athlete_and_date(self, athlete_id: str, date: str) -> dict | None:
        """Get the training load for an athlete on a specific date.

        Args:
            athlete_id: UUID of the athlete.
            date: Date string (YYYY-MM-DD).

        Returns:
            Training load dict or None.
        """
        return self._execute_one(
            "SELECT * FROM training_loads "
            "WHERE athlete_id = :athlete_id AND date = :date",
            {"athlete_id": athlete_id, "date": date},
        )

    def get_range(self, athlete_id: str, date_from: str, date_to: str = None) -> list[dict]:
        """Get training loads within a date range, ordered by date ASC.

        Args:
            athlete_id: UUID of the athlete.
            date_from: Start date (YYYY-MM-DD).
            date_to: End date (YYYY-MM-DD), optional.

        Returns:
            List of training load dicts ordered by date ascending.
        """
        if date_to:
            return self._execute(
                "SELECT * FROM training_loads "
                "WHERE athlete_id = :athlete_id "
                "AND date >= :date_from AND date <= :date_to "
                "ORDER BY date ASC",
                {
                    "athlete_id": athlete_id,
                    "date_from": date_from,
                    "date_to": date_to,
                },
            )
        return self._execute(
            "SELECT * FROM training_loads "
            "WHERE athlete_id = :athlete_id AND date >= :date_from "
            "ORDER BY date ASC",
            {"athlete_id": athlete_id, "date_from": date_from},
        )

    def upsert(
        self,
        athlete_id: str,
        workout_date: str,
        training_load: float,
        rpe: float,
    ) -> None:
        """Upsert a training load record.

        If a record exists for this athlete+date, adds the new load to the
        existing total (multiple workouts on same day sum their loads).

        Args:
            athlete_id: UUID of the athlete.
            workout_date: Date string (YYYY-MM-DD).
            training_load: sRPE value (RPE x duration).
            rpe: Rate of perceived exertion.
        """
        existing = self.get_by_athlete_and_date(athlete_id, workout_date)

        if existing:
            existing_load = float(existing["training_load"])
            new_total = existing_load + training_load
            self._execute_update(
                "UPDATE training_loads SET training_load = :load, rpe = :rpe, "
                "updated_at = NOW() WHERE id = :id RETURNING *",
                {"load": new_total, "rpe": rpe, "id": existing["id"]},
            )
            logger.info(
                "Updated training_loads for athlete %s on %s: %.1f -> %.1f",
                athlete_id, workout_date, existing_load, new_total,
            )
        else:
            self._execute_insert(
                "INSERT INTO training_loads (athlete_id, date, training_load, rpe) "
                "VALUES (:athlete_id, :date, :load, :rpe) RETURNING *",
                {
                    "athlete_id": athlete_id,
                    "date": workout_date,
                    "load": training_load,
                    "rpe": rpe,
                },
            )
            logger.info(
                "Inserted training_loads for athlete %s on %s: %.1f",
                athlete_id, workout_date, training_load,
            )

    def get_latest(self, athlete_id: str, limit: int = 42) -> list[dict]:
        """Get the most recent training loads for an athlete.

        Used for PMC chart display. Returns in descending date order.

        Args:
            athlete_id: UUID of the athlete.
            limit: Maximum number of records (default 42 = 6 weeks).

        Returns:
            List of training load dicts ordered by date DESC.
        """
        return self._execute(
            "SELECT * FROM training_loads "
            "WHERE athlete_id = :athlete_id "
            "ORDER BY date DESC LIMIT :limit",
            {"athlete_id": athlete_id, "limit": limit},
        )

    def get_date_and_load(self, athlete_id: str, date_from: str) -> list[dict]:
        """Get date and training_load columns for PMC calculation.

        Lightweight query that fetches only the columns needed for
        exponential decay math.

        Args:
            athlete_id: UUID of the athlete.
            date_from: Start date (YYYY-MM-DD).

        Returns:
            List of dicts with 'date' and 'training_load' keys, ordered ASC.
        """
        return self._execute(
            "SELECT date, training_load FROM training_loads "
            "WHERE athlete_id = :athlete_id AND date >= :date_from "
            "ORDER BY date ASC",
            {"athlete_id": athlete_id, "date_from": date_from},
        )
