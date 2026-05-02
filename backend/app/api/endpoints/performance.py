from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.services.performance_service import PerformanceService

router = APIRouter()


@router.get("/metrics/{athlete_id}")
async def get_performance_metrics(athlete_id: str):
    """Get performance metrics for an athlete from the database."""
    try:
        performance_service = PerformanceService()
        return await performance_service.get_performance_metrics(athlete_id)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch metrics: {str(e)}"
        )


@router.get("/trends/{athlete_id}")
async def get_performance_trends(
    athlete_id: str, metric: str = Query(...), days: int = Query(90)
):
    """Get performance trends over time for a specific metric."""
    try:
        performance_service = PerformanceService()
        return await performance_service.get_performance_trends(
            athlete_id, metric, days
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch trends: {str(e)}"
        )


@router.get("/load/{athlete_id}")
async def get_training_load(athlete_id: str, days: int = Query(90)):
    """Get training load metrics for an athlete using the PMC model."""
    try:
        performance_service = PerformanceService()
        return await performance_service.get_training_load(athlete_id, days)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch training load: {str(e)}"
        )


@router.get("/comparison/{athlete_id}")
async def get_peer_comparison(athlete_id: str):
    """Get performance comparison against peers."""
    try:
        performance_service = PerformanceService()
        return await performance_service.get_peer_comparison(athlete_id)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch comparison: {str(e)}"
        )
