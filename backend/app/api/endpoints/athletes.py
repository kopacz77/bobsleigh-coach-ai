from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.db.session import get_supabase
from app.schemas.athlete import AthleteCreate, AthleteUpdate

router = APIRouter()


@router.get("/")
async def get_athletes(user=Depends(get_current_user)):
    """Get all active athletes from the database."""
    try:
        supabase = get_supabase()
        result = supabase.table("athletes").select("*").eq("is_active", True).execute()
        return result.data
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch athletes: {str(e)}")


@router.get("/{athlete_id}")
async def get_athlete(athlete_id: str, user=Depends(get_current_user)):
    """Get a specific athlete by UUID."""
    try:
        supabase = get_supabase()
        result = supabase.table("athletes").select("*").eq("id", athlete_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Athlete not found")
        return result.data[0]
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch athlete: {str(e)}")


@router.post("/")
async def create_athlete(athlete: AthleteCreate, user=Depends(get_current_user)):
    """Create a new athlete in the database."""
    try:
        supabase = get_supabase()
        data = athlete.model_dump(exclude_none=True)
        result = supabase.table("athletes").insert(data).execute()
        return result.data[0]
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create athlete: {str(e)}")


@router.put("/{athlete_id}")
async def update_athlete(athlete_id: str, athlete: AthleteUpdate, user=Depends(get_current_user)):
    """Update an existing athlete in the database."""
    try:
        supabase = get_supabase()
        data = athlete.model_dump(exclude_none=True)
        if not data:
            raise HTTPException(status_code=400, detail="No fields to update")
        result = supabase.table("athletes").update(data).eq("id", athlete_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Athlete not found")
        return result.data[0]
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update athlete: {str(e)}")


@router.delete("/{athlete_id}")
async def delete_athlete(athlete_id: str, user=Depends(get_current_user)):
    """Soft-delete an athlete by setting is_active to False."""
    try:
        supabase = get_supabase()
        result = supabase.table("athletes").update({"is_active": False}).eq("id", athlete_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Athlete not found")
        return {"message": "Athlete deleted successfully"}
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete athlete: {str(e)}")
