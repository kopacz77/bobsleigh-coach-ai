"""Performance endpoints with user-based data filtering.

Defense-in-depth: all endpoints verify that the requested athlete_id
belongs to the authenticated user before returning results.

All data access goes through the repository layer (no direct Supabase calls).
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.db.repositories.athlete_repo import AthleteRepository
from app.services.performance_service import PerformanceService

router = APIRouter()

# Module-level repository singleton
athlete_repo = AthleteRepository()


async def _verify_athlete_ownership(athlete_id: str, user) -> None:
    """Verify that the given athlete_id belongs to the authenticated user.

    Args:
        athlete_id: UUID of the athlete to check.
        user: Auth user object with .id attribute.

    Raises:
        HTTPException 403 if the athlete does not belong to this user.
    """
    if not athlete_repo.verify_ownership(athlete_id, user.id):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this athlete's data",
        )


@router.get("/metrics/{athlete_id}")
async def get_performance_metrics(
    athlete_id: str, user=Depends(get_current_user)
):
    """Get performance metrics for an athlete. Verifies ownership."""
    try:
        await _verify_athlete_ownership(athlete_id, user)
        performance_service = PerformanceService()
        return await performance_service.get_performance_metrics(athlete_id)
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch metrics: {str(e)}"
        )


@router.get("/trends/{athlete_id}")
async def get_performance_trends(
    athlete_id: str,
    metric: str = Query(...),
    days: int = Query(90),
    user=Depends(get_current_user),
):
    """Get performance trends over time for a specific metric. Verifies ownership."""
    try:
        await _verify_athlete_ownership(athlete_id, user)
        performance_service = PerformanceService()
        return await performance_service.get_performance_trends(
            athlete_id, metric, days
        )
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch trends: {str(e)}"
        )


@router.get("/load/{athlete_id}")
async def get_training_load(
    athlete_id: str,
    days: int = Query(90),
    user=Depends(get_current_user),
):
    """Get training load metrics using the PMC model. Verifies ownership."""
    try:
        await _verify_athlete_ownership(athlete_id, user)
        performance_service = PerformanceService()
        return await performance_service.get_training_load(athlete_id, days)
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch training load: {str(e)}",
        )


@router.get("/comparison/{athlete_id}")
async def get_peer_comparison(
    athlete_id: str, user=Depends(get_current_user)
):
    """Get performance comparison against peers. Verifies ownership."""
    try:
        await _verify_athlete_ownership(athlete_id, user)
        performance_service = PerformanceService()
        return await performance_service.get_peer_comparison(athlete_id)
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch comparison: {str(e)}"
        )
