from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.performance_service import PerformanceService

router = APIRouter()


@router.get("/metrics/{athlete_id}")
async def get_performance_metrics(athlete_id: int):
    """Get performance metrics for an athlete"""
    performance_service = PerformanceService()
    return await performance_service.get_performance_metrics(athlete_id)


@router.get("/trends/{athlete_id}")
async def get_performance_trends(
    athlete_id: int, metric: str = Query(...), days: int = Query(90)
):
    """Get performance trends over time for a specific metric"""
    performance_service = PerformanceService()
    return await performance_service.get_performance_trends(athlete_id, metric, days)


@router.get("/load/{athlete_id}")
async def get_training_load(athlete_id: int, days: int = Query(90)):
    """Get training load metrics for an athlete using the PMC model"""
    performance_service = PerformanceService()
    return await performance_service.get_training_load(athlete_id, days)


@router.get("/comparison/{athlete_id}")
async def get_peer_comparison(athlete_id: int):
    """Get performance comparison against peers"""
    performance_service = PerformanceService()
    return await performance_service.get_peer_comparison(athlete_id)
