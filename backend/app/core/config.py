from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""

    # Application settings
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"

    # CORS settings -- accepts either a JSON array or a comma-separated string
    # so docker-compose env vars like `CORS_ORIGINS=http://localhost:3000` work.
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            stripped = v.strip()
            # JSON list form: ["http://a", "http://b"]
            if stripped.startswith("["):
                import json

                return json.loads(stripped)
            # Comma-separated form: http://a,http://b
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return v

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

    # Scheduler settings
    # When False, the APScheduler background job runner does not start.
    # Tests and one-off scripts should set ENABLE_SCHEDULER=false.
    ENABLE_SCHEDULER: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
