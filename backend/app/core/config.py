from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""

    # Application settings
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"

    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Authentication settings
    SECRET_KEY: str = "supersecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Auth provider: "dev" (no Supabase needed) or "supabase" (real auth)
    AUTH_PROVIDER: str = "dev"
    DEV_USER_ID: str = "00000000-0000-0000-0000-000000000001"
    DEV_USER_EMAIL: str = "coach@dev.local"
    DEV_USER_ROLE: str = "coach"

    # Database settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/bobsleigh"

    # Supabase settings
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
