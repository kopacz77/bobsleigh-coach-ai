"""Exercise library endpoints for browsing, searching, and filtering exercises.

Provides read-only access to the exercise catalog. Any authenticated user
can browse exercises -- no athlete profile required.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.db.session import get_supabase

router = APIRouter()


@router.get("")
async def list_exercises(
    search: Optional[str] = Query(None, description="Case-insensitive name search"),
    category: Optional[str] = Query(None, description="Exact category match"),
    muscle_group: Optional[str] = Query(
        None, description="Filter by muscle group (contained in muscle_groups array)"
    ),
    equipment: Optional[str] = Query(
        None,
        description="Filter by equipment (contained in equipment_needed array)",
    ),
    measurement_type: Optional[str] = Query(
        None, description="Filter by measurement type (weight, time, distance, reps)"
    ),
    limit: int = Query(50, ge=1, le=200, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    user=Depends(get_current_user),
):
    """List exercises with optional search and filters.

    Returns active exercises from the library. Supports text search on name,
    and exact/contains filters on category, muscle_group, equipment, and
    measurement_type.
    """
    try:
        sb = get_supabase()
        query = sb.table("exercises").select("*").eq("is_active", True)

        if search:
            query = query.ilike("name", f"*{search}*")
        if category:
            query = query.eq("category", category)
        if muscle_group:
            query = query.contains("muscle_groups", [muscle_group])
        if equipment:
            query = query.contains("equipment_needed", [equipment])
        if measurement_type:
            query = query.eq("measurement_type", measurement_type)

        query = query.order("name").range(offset, offset + limit - 1)
        result = query.execute()
        return result.data
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch exercises: {str(e)}"
        )


@router.get("/categories")
async def get_exercise_categories(user=Depends(get_current_user)):
    """Return distinct filter values for exercise library dropdowns.

    Queries all active exercises and extracts unique values for:
    - categories (from category column)
    - muscle_groups (from muscle_groups array column, flattened)
    - equipment (from equipment_needed array column, flattened)
    - measurement_types (from measurement_type column)
    """
    try:
        sb = get_supabase()
        result = (
            sb.table("exercises")
            .select("category, muscle_groups, equipment_needed, measurement_type")
            .eq("is_active", True)
            .execute()
        )

        categories: set[str] = set()
        muscle_groups: set[str] = set()
        equipment: set[str] = set()
        measurement_types: set[str] = set()

        for row in result.data:
            if row.get("category"):
                categories.add(row["category"])
            if row.get("muscle_groups"):
                for mg in row["muscle_groups"]:
                    muscle_groups.add(mg)
            if row.get("equipment_needed"):
                for eq in row["equipment_needed"]:
                    equipment.add(eq)
            if row.get("measurement_type"):
                measurement_types.add(row["measurement_type"])

        return {
            "categories": sorted(categories),
            "muscle_groups": sorted(muscle_groups),
            "equipment": sorted(equipment),
            "measurement_types": sorted(measurement_types),
        }
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch exercise categories: {str(e)}",
        )
