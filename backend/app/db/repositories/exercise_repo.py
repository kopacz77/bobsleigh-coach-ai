"""Exercise repository for search, browse, and filter operations.

Exercises are public reference data -- any authenticated user can browse.
Supports text search, category match, array contains for muscle groups
and equipment, and measurement type filtering.
"""

from app.db.repositories.base import BaseRepository


class ExerciseRepository(BaseRepository):
    """Repository for exercise library data access."""

    def search(
        self,
        query: str = None,
        category: str = None,
        muscle_group: str = None,
        equipment: str = None,
        measurement_type: str = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[dict]:
        """Search exercises with optional filters.

        Builds WHERE clause dynamically based on provided filters.

        Args:
            query: Case-insensitive name search text.
            category: Exact category match.
            muscle_group: Filter by muscle group (array contains).
            equipment: Filter by equipment (array contains).
            measurement_type: Exact measurement type match.
            offset: Pagination offset.
            limit: Maximum results.

        Returns:
            List of exercise dicts matching filters.
        """
        conditions = ["is_active = true"]
        params: dict = {"offset": offset, "limit": limit}

        if query:
            conditions.append("name ILIKE '%' || :q || '%'")
            params["q"] = query
        if category:
            conditions.append("category = :cat")
            params["cat"] = category
        if muscle_group:
            conditions.append("muscle_groups @> ARRAY[:mg]::text[]")
            params["mg"] = muscle_group
        if equipment:
            conditions.append("equipment_needed @> ARRAY[:eq]::text[]")
            params["eq"] = equipment
        if measurement_type:
            conditions.append("measurement_type = :mt")
            params["mt"] = measurement_type

        where = " AND ".join(conditions)
        return self._execute(
            f"SELECT * FROM exercises WHERE {where} "
            f"ORDER BY name OFFSET :offset LIMIT :limit",
            params,
        )

    def get_by_id(self, exercise_id: str) -> dict | None:
        """Get a single exercise by primary key.

        Args:
            exercise_id: UUID of the exercise.

        Returns:
            Exercise dict or None.
        """
        return self._execute_one(
            "SELECT * FROM exercises WHERE id = :id",
            {"id": exercise_id},
        )

    def get_all_active(self, offset: int = 0, limit: int = 50) -> list[dict]:
        """Get all active exercises with pagination.

        Args:
            offset: Pagination offset.
            limit: Maximum results.

        Returns:
            List of active exercise dicts.
        """
        return self._execute(
            "SELECT * FROM exercises WHERE is_active = true "
            "ORDER BY name OFFSET :offset LIMIT :limit",
            {"offset": offset, "limit": limit},
        )

    def get_categories(self) -> list[dict]:
        """Get all active exercises with category/filter columns only.

        Returns raw rows for the endpoint to extract unique values from.

        Returns:
            List of dicts with category, muscle_groups, equipment_needed,
            measurement_type fields.
        """
        return self._execute(
            "SELECT category, muscle_groups, equipment_needed, measurement_type "
            "FROM exercises WHERE is_active = true"
        )
