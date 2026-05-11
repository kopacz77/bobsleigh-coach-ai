"""Workout repository for CRUD operations on workouts and workout_exercises.

Handles workout listing with filters, nested exercise data via separate
queries (not JOINs), and training load upsert.
"""

import logging

from app.db.repositories.base import BaseRepository

logger = logging.getLogger(__name__)


class WorkoutRepository(BaseRepository):
    """Repository for workout data access."""

    def get_by_athlete(
        self,
        athlete_id: str,
        offset: int = 0,
        limit: int = 20,
        workout_type: str = None,
        date_from: str = None,
        date_to: str = None,
        search: str = None,
    ) -> list[dict]:
        """Get workouts for an athlete with optional filters.

        Args:
            athlete_id: UUID of the athlete.
            offset: Pagination offset.
            limit: Maximum results.
            workout_type: Filter by workout type.
            date_from: Filter workouts on or after this date.
            date_to: Filter workouts on or before this date.
            search: Case-insensitive name search.

        Returns:
            List of workout dicts ordered by date DESC.
        """
        conditions = ["athlete_id = :athlete_id"]
        params: dict = {
            "athlete_id": athlete_id,
            "offset": offset,
            "limit": limit,
        }

        if workout_type:
            conditions.append("workout_type = :workout_type")
            params["workout_type"] = workout_type
        if date_from:
            conditions.append("date >= :date_from")
            params["date_from"] = date_from
        if date_to:
            conditions.append("date <= :date_to")
            params["date_to"] = date_to
        if search:
            conditions.append("name ILIKE '%' || :search || '%'")
            params["search"] = search

        where = " AND ".join(conditions)
        return self._execute(
            f"SELECT * FROM workouts WHERE {where} "
            f"ORDER BY date DESC OFFSET :offset LIMIT :limit",
            params,
        )

    def get_by_athlete_date_range(
        self,
        athlete_id: str,
        date_from: str,
        date_to: str,
    ) -> list[dict]:
        """Get workouts for an athlete within a date range, ordered ascending.

        Used for weekly workout views.

        Args:
            athlete_id: UUID of the athlete.
            date_from: Start date (YYYY-MM-DD).
            date_to: End date (YYYY-MM-DD).

        Returns:
            List of workout dicts ordered by date ASC.
        """
        return self._execute(
            "SELECT * FROM workouts "
            "WHERE athlete_id = :athlete_id AND date >= :date_from AND date <= :date_to "
            "ORDER BY date ASC",
            {"athlete_id": athlete_id, "date_from": date_from, "date_to": date_to},
        )

    def get_by_id(self, workout_id: str) -> dict | None:
        """Get a single workout by primary key.

        Args:
            workout_id: UUID of the workout.

        Returns:
            Workout dict or None.
        """
        return self._execute_one(
            "SELECT * FROM workouts WHERE id = :id",
            {"id": workout_id},
        )

    def get_with_exercises(self, workout_id: str) -> dict | None:
        """Get a workout with its nested exercise data.

        Uses separate queries (not JOINs) per research guidance.

        Args:
            workout_id: UUID of the workout.

        Returns:
            Workout dict with an `exercises` key containing exercise list,
            or None if workout not found.
        """
        workout = self.get_by_id(workout_id)
        if not workout:
            return None
        workout["workout_exercises"] = self.get_exercises_for_workout(workout_id)
        return workout

    def get_workouts_with_exercises(self, workouts: list[dict]) -> list[dict]:
        """Attach exercise data to a list of workouts.

        Batch-fetches exercises for all workouts to avoid N+1 queries.

        Args:
            workouts: List of workout dicts.

        Returns:
            Same workout dicts with `workout_exercises` key added.
        """
        if not workouts:
            return workouts

        workout_ids = [w["id"] for w in workouts]
        # Batch fetch all workout_exercises for these workouts
        placeholders = ", ".join(f":wid_{i}" for i in range(len(workout_ids)))
        params = {f"wid_{i}": wid for i, wid in enumerate(workout_ids)}

        exercises = self._execute(
            f"SELECT we.*, e.name AS exercise_name, e.category AS exercise_category "
            f"FROM workout_exercises we "
            f"LEFT JOIN exercises e ON we.exercise_id = e.id "
            f"WHERE we.workout_id IN ({placeholders}) "
            f"ORDER BY we.exercise_order",
            params,
        )

        # Group by workout_id
        exercises_by_workout: dict[str, list[dict]] = {}
        for ex in exercises:
            wid = str(ex["workout_id"])
            exercises_by_workout.setdefault(wid, []).append(ex)

        for workout in workouts:
            workout["workout_exercises"] = exercises_by_workout.get(
                str(workout["id"]), []
            )

        return workouts

    def create(self, data: dict) -> dict:
        """Create a new workout.

        Args:
            data: Dict of column values to insert.

        Returns:
            The created workout dict.
        """
        columns = ", ".join(data.keys())
        placeholders = ", ".join(f":{k}" for k in data.keys())
        return self._execute_insert(
            f"INSERT INTO workouts ({columns}) VALUES ({placeholders}) RETURNING *",
            data,
        )

    def update(self, workout_id: str, data: dict) -> dict | None:
        """Update a workout record.

        Dynamically builds the SET clause from data dict keys.

        Args:
            workout_id: UUID of the workout.
            data: Dict of column-value pairs to update.

        Returns:
            Updated workout dict, or None if not found.
        """
        set_clauses = ", ".join(f"{k} = :{k}" for k in data.keys())
        params = {**data, "id": workout_id}
        return self._execute_update(
            f"UPDATE workouts SET {set_clauses}, updated_at = NOW() "
            f"WHERE id = :id RETURNING *",
            params,
        )

    def delete(self, workout_id: str) -> bool:
        """Delete a workout.

        Args:
            workout_id: UUID of the workout.

        Returns:
            True if the workout was deleted.
        """
        return self._execute_delete(
            "DELETE FROM workouts WHERE id = :id",
            {"id": workout_id},
        )

    def get_field(self, workout_id: str, field: str) -> dict | None:
        """Get a specific field from a workout.

        Args:
            workout_id: UUID of the workout.
            field: Column name to select.

        Returns:
            Dict with the requested field, or None.
        """
        return self._execute_one(
            f"SELECT {field} FROM workouts WHERE id = :id",
            {"id": workout_id},
        )

    def get_exercises_for_workout(self, workout_id: str) -> list[dict]:
        """Get workout_exercises with exercise name for a workout.

        Args:
            workout_id: UUID of the workout.

        Returns:
            List of workout_exercise dicts with exercise name joined.
        """
        return self._execute(
            "SELECT we.*, e.name AS exercise_name, e.category AS exercise_category "
            "FROM workout_exercises we "
            "LEFT JOIN exercises e ON we.exercise_id = e.id "
            "WHERE we.workout_id = :wid "
            "ORDER BY we.exercise_order",
            {"wid": workout_id},
        )

    def create_exercise(self, data: dict) -> dict:
        """Insert a workout_exercise row.

        Args:
            data: Dict with workout_id, exercise_id, exercise_order, etc.

        Returns:
            The created workout_exercise dict.
        """
        columns = ", ".join(data.keys())
        placeholders = ", ".join(f":{k}" for k in data.keys())
        return self._execute_insert(
            f"INSERT INTO workout_exercises ({columns}) VALUES ({placeholders}) RETURNING *",
            data,
        )

    def create_exercises_batch(self, exercises: list[dict]) -> None:
        """Insert multiple workout_exercise rows.

        Args:
            exercises: List of dicts with workout_id, exercise_id, etc.
        """
        for ex in exercises:
            self.create_exercise(ex)

    def update_exercise(self, exercise_id: str, data: dict) -> dict | None:
        """Update a workout_exercise row.

        Args:
            exercise_id: UUID of the workout_exercise record.
            data: Dict of column-value pairs to update.

        Returns:
            Updated workout_exercise dict, or None.
        """
        set_clauses = ", ".join(f"{k} = :{k}" for k in data.keys())
        params = {**data, "id": exercise_id}
        return self._execute_update(
            f"UPDATE workout_exercises SET {set_clauses} WHERE id = :id RETURNING *",
            params,
        )

    def delete_exercise(self, exercise_id: str) -> bool:
        """Delete a workout_exercise row.

        Args:
            exercise_id: UUID of the workout_exercise record.

        Returns:
            True if deleted.
        """
        return self._execute_delete(
            "DELETE FROM workout_exercises WHERE id = :id",
            {"id": exercise_id},
        )


class TrainingLoadRepository(BaseRepository):
    """Repository for training_loads table operations."""

    def get_by_athlete_date(self, athlete_id: str, workout_date: str) -> dict | None:
        """Get the training load for an athlete on a specific date.

        Args:
            athlete_id: UUID of the athlete.
            workout_date: Date string (YYYY-MM-DD).

        Returns:
            Training load dict or None.
        """
        return self._execute_one(
            "SELECT * FROM training_loads "
            "WHERE athlete_id = :athlete_id AND date = :date",
            {"athlete_id": athlete_id, "date": workout_date},
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
        existing = self.get_by_athlete_date(athlete_id, workout_date)

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
