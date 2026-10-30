"""Authentication dependency for FastAPI endpoints.

Uses the pluggable auth-provider abstraction so that the backend can run in
*dev* mode (no Supabase credentials) or *supabase* mode (real JWT validation).

The provider is selected via the ``AUTH_PROVIDER`` setting -- see
``auth_provider.py`` for details.
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.auth_provider import get_auth_provider

# Use HTTPBearer scheme to extract Bearer token from Authorization header
_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
):
    """FastAPI dependency that validates a Bearer token and returns the user.

    Usage:
        @router.get("/protected")
        async def protected_route(user=Depends(get_current_user)):
            ...

    Raises HTTPException 401 if no token is provided or token is invalid.
    Returns an AuthUser object (has .id, .email, .user_metadata, .app_metadata).
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        auth_provider = get_auth_provider()
        user = auth_provider.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
):
    """FastAPI dependency that returns the user if authenticated, or None.

    Use for endpoints that work with or without authentication.
    """
    if credentials is None:
        return None

    token = credentials.credentials

    try:
        auth_provider = get_auth_provider()
        user = auth_provider.get_user(token)
    except Exception:
        return None

    return user
