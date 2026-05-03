"""Supabase JWT authentication for FastAPI endpoints.

Uses supabase.auth.get_user(token) to validate Supabase-issued JWTs.
This replaces the previous custom JWT system with bcrypt/jose.
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db.session import get_supabase

# Use HTTPBearer scheme to extract Bearer token from Authorization header
_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
):
    """FastAPI dependency that validates a Supabase JWT and returns the user.

    Usage:
        @router.get("/protected")
        async def protected_route(user=Depends(get_current_user)):
            ...

    Raises HTTPException 401 if no token is provided or token is invalid.
    Returns the Supabase User object (has .id, .email, .user_metadata, .app_metadata).
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        sb = get_supabase()
        user_response = sb.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user_response is None or user_response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_response.user


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
        sb = get_supabase()
        user_response = sb.auth.get_user(token)
    except Exception:
        return None

    if user_response is None or user_response.user is None:
        return None

    return user_response.user
