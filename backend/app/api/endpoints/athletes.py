"""Athlete endpoints with user-based data filtering.

Defense-in-depth: even though the backend uses the service role key
(which bypasses RLS), we filter data at the application level to ensure
athletes can only access their own data.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.db.session import get_supabase
from app.schemas.athlete import AthleteCreate, AthleteUpdate

router = APIRouter()


async def get_athlete_for_user(user) -> dict:
    """Look up the athlete record for the authenticated user.

    Args:
        user: Supabase User object with .id attribute (UUID string).

    Returns:
        The athlete record dict.

    Raises:
        HTTPException 404 if no athlete profile exists for this user.
    """
    sb = get_supabase()
    result = sb.table("athletes").select("*").eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="No athlete profile found for this user",
        )
    return result.data[0]


def _verify_ownership(athlete: dict, user) -> None:
    """Verify the athlete record belongs to the authenticated user.

    Args:
        athlete: Athlete record dict with user_id field.
        user: Supabase User object with .id attribute.

    Raises:
        HTTPException 403 if the user does not own this athlete record.
    """
    if athlete.get("user_id") != user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this athlete's data",
        )


@router.get("/")
async def get_athletes(user=Depends(get_current_user)):
    """Get the authenticated user's own athlete profile.

    Returns a list containing only the user's own athlete record.
    Coach access to multiple athletes will be added in Phase 5.
    """
    try:
        supabase = get_supabase()
        result = (
            supabase.table("athletes")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", True)
            .execute()
        )
        return result.data
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch athletes: {str(e)}"
        )


@router.get("/{athlete_id}")
async def get_athlete(athlete_id: str, user=Depends(get_current_user)):
    """Get a specific athlete by UUID. Only the owner can access."""
    try:
        supabase = get_supabase()
        result = supabase.table("athletes").select("*").eq("id", athlete_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Athlete not found")
        athlete = result.data[0]
        _verify_ownership(athlete, user)
        return athlete
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch athlete: {str(e)}"
        )


@router.post("/")
async def create_athlete(athlete: AthleteCreate, user=Depends(get_current_user)):
    """Create a new athlete profile linked to the authenticated user.

    The user_id is set automatically from the authenticated user's ID,
    ignoring any client-provided value for security.
    """
    try:
        supabase = get_supabase()
        data = athlete.model_dump(exclude_none=True)
        # Always set user_id from the authenticated user (don't trust client)
        data["user_id"] = user.id
        result = supabase.table("athletes").insert(data).execute()
        return result.data[0]
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create athlete: {str(e)}"
        )


@router.put("/{athlete_id}")
async def update_athlete(
    athlete_id: str, athlete: AthleteUpdate, user=Depends(get_current_user)
):
    """Update an existing athlete. Only the owner can update."""
    try:
        supabase = get_supabase()
        # Verify ownership first
        existing = (
            supabase.table("athletes").select("*").eq("id", athlete_id).execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Athlete not found")
        _verify_ownership(existing.data[0], user)

        data = athlete.model_dump(exclude_none=True)
        if not data:
            raise HTTPException(status_code=400, detail="No fields to update")
        result = (
            supabase.table("athletes").update(data).eq("id", athlete_id).execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Athlete not found")
        return result.data[0]
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update athlete: {str(e)}"
        )


@router.delete("/{athlete_id}")
async def delete_athlete(athlete_id: str, user=Depends(get_current_user)):
    """Soft-delete an athlete. Only the owner can delete."""
    try:
        supabase = get_supabase()
        # Verify ownership first
        existing = (
            supabase.table("athletes").select("*").eq("id", athlete_id).execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Athlete not found")
        _verify_ownership(existing.data[0], user)

        result = (
            supabase.table("athletes")
            .update({"is_active": False})
            .eq("id", athlete_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Athlete not found")
        return {"message": "Athlete deleted successfully"}
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete athlete: {str(e)}"
        )
