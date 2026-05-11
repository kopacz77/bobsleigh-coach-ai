"""Base repository with common query execution helpers using SQLAlchemy Core.

All repositories inherit from BaseRepository and use parameterized queries
(:param syntax) to prevent SQL injection. Connection management uses the
`with engine.connect()` pattern for proper resource cleanup.
"""

from sqlalchemy import text

from app.db.session import engine


class BaseRepository:
    """Base repository using SQLAlchemy Core for database-agnostic queries."""

    def _execute(self, query: str, params: dict = None) -> list[dict]:
        """Execute a SELECT query and return all rows as dicts.

        Args:
            query: SQL query string with :param placeholders.
            params: Dict of parameter values.

        Returns:
            List of dicts, one per row.
        """
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            return [dict(row._mapping) for row in result]

    def _execute_one(self, query: str, params: dict = None) -> dict | None:
        """Execute a SELECT query and return the first row or None.

        Args:
            query: SQL query string with :param placeholders.
            params: Dict of parameter values.

        Returns:
            Dict of the first row, or None if no rows.
        """
        rows = self._execute(query, params)
        return rows[0] if rows else None

    def _execute_insert(self, query: str, params: dict = None) -> dict:
        """Execute an INSERT ... RETURNING query, commit, and return the row.

        Args:
            query: INSERT SQL with RETURNING clause.
            params: Dict of parameter values.

        Returns:
            Dict of the inserted row.
        """
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            conn.commit()
            row = result.mappings().first()
            return dict(row) if row else {}

    def _execute_update(self, query: str, params: dict = None) -> dict | None:
        """Execute an UPDATE ... RETURNING query, commit, and return the row.

        Args:
            query: UPDATE SQL with RETURNING clause.
            params: Dict of parameter values.

        Returns:
            Dict of the updated row, or None if no rows matched.
        """
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            conn.commit()
            row = result.mappings().first()
            return dict(row) if row else None

    def _execute_delete(self, query: str, params: dict = None) -> bool:
        """Execute a DELETE query and commit.

        Args:
            query: DELETE SQL.
            params: Dict of parameter values.

        Returns:
            True if at least one row was deleted.
        """
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            conn.commit()
            return result.rowcount > 0
