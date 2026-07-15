import warnings

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from supabase import create_client, Client

from app.core.config import settings

# Create SQLAlchemy engine
engine = create_engine(settings.DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db():
    """Get a database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_supabase() -> Client:
    """Get a Supabase client with service role key for backend operations.

    .. deprecated::
        This function has been replaced by the repository layer
        (app.db.repositories). Remaining usages are limited to
        SupabaseAuthProvider in app/auth/auth_provider.py. Emits a
        DeprecationWarning when called from any other module.
    """
    warnings.warn(
        "get_supabase() is deprecated. Use repository classes from "
        "app.db.repositories instead.",
        DeprecationWarning,
        stacklevel=2,
    )
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "Supabase credentials not configured. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
        )
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
