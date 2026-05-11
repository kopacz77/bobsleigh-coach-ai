"""Repository layer for database-agnostic data access.

Replaces direct Supabase PostgREST calls with SQLAlchemy Core queries
executed against the DATABASE_URL connection.
"""

from app.db.repositories.base import BaseRepository

__all__ = ["BaseRepository"]
