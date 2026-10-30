"""Pluggable authentication provider abstraction.

Supports two modes selected via ``AUTH_PROVIDER`` setting:

* ``"dev"``  -- DevAuthProvider: accepts any token, returns a configurable
  static user.  Suitable for local development without Supabase credentials.
* ``"supabase"`` -- SupabaseAuthProvider: validates the token against a live
  Supabase project using ``supabase.auth.get_user(token)``.

The factory function ``get_auth_provider()`` reads the active mode from
``settings.AUTH_PROVIDER`` and returns the appropriate implementation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, Protocol, runtime_checkable

from app.core.config import settings


@dataclass
class AuthUser:
    """Minimal user object compatible with the Supabase ``User`` attribute API.

    Every endpoint accesses ``user.id``, ``user.email`` and
    ``user.app_metadata`` -- this dataclass satisfies those attribute
    look-ups.
    """

    id: str
    email: str
    app_metadata: dict = field(default_factory=dict)
    user_metadata: dict = field(default_factory=dict)


@runtime_checkable
class AuthProvider(Protocol):
    """Protocol that any auth provider must implement."""

    def get_user(self, token: str) -> Optional[AuthUser]: ...


class DevAuthProvider:
    """Always returns a statically-configured user regardless of the token.

    Configuration comes from ``settings.DEV_USER_*`` values.
    """

    def get_user(self, token: str) -> Optional[AuthUser]:
        return AuthUser(
            id=settings.DEV_USER_ID,
            email=settings.DEV_USER_EMAIL,
            app_metadata={"role": settings.DEV_USER_ROLE},
            user_metadata={},
        )


class SupabaseAuthProvider:
    """Validates the Bearer token against a live Supabase project."""

    def get_user(self, token: str) -> Optional[AuthUser]:
        # Lazy import to avoid startup errors when Supabase is not configured.
        from app.db.session import get_supabase

        sb = get_supabase()
        user_response = sb.auth.get_user(token)

        if user_response is None or user_response.user is None:
            return None

        u = user_response.user
        return AuthUser(
            id=u.id,
            email=u.email or "",
            app_metadata=dict(u.app_metadata) if u.app_metadata else {},
            user_metadata=dict(u.user_metadata) if u.user_metadata else {},
        )


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

_provider_instance: Optional[AuthProvider] = None


def get_auth_provider() -> AuthProvider:
    """Return the configured auth provider (singleton)."""
    global _provider_instance
    if _provider_instance is None:
        mode = settings.AUTH_PROVIDER.lower()
        if mode == "dev":
            _provider_instance = DevAuthProvider()
        elif mode == "supabase":
            _provider_instance = SupabaseAuthProvider()
        else:
            raise ValueError(
                f"Unknown AUTH_PROVIDER '{settings.AUTH_PROVIDER}'. "
                "Expected 'dev' or 'supabase'."
            )
    return _provider_instance
