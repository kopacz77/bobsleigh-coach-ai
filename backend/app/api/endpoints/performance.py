from typing import List

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/metrics/{athlete_id}")
async def get_performance_metrics(athlete_id: int):
    """Get performance metrics for an athlete"""
    if athlete_id != 1:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Placeholder performance data
    return {
        "athlete_id": athlete_id,
        "strength_metrics": {
            "squat_1rm": 150,
            "bench_1rm": 100,
            "deadlift_1rm": 180,
            "power_clean_1rm": 90,
            "strength_score": 85,
        },
        "speed_metrics": {
            "30m_best": 4.1,
            "60m_best": 7.3,
            "speed_score": 78,
        },
        "power_metrics": {
            "vertical_jump": 65,
            "broad_jump": 280,
            "med_ball_throw": 850,
            "power_score": 82,
        },
    }


@router.get("/trends/{athlete_id}")
async def get_performance_trends(athlete_id: int):
    """Get performance trends over time for an athlete"""
    if athlete_id != 1:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Placeholder trend data
    return {
        "athlete_id": athlete_id,
        "strength_trends": [
            {"date": "2025-01-15", "squat_1rm": 140},
            {"date": "2025-02-15", "squat_1rm": 145},
            {"date": "2025-03-15", "squat_1rm": 150},
        ],
        "speed_trends": [
            {"date": "2025-01-15", "30m_time": 4.3},
            {"date": "2025-02-15", "30m_time": 4.2},
            {"date": "2025-03-15", "30m_time": 4.1},
        ],
        "power_trends": [
            {"date": "2025-01-15", "vertical_jump": 60},
            {"date": "2025-02-15", "vertical_jump": 63},
            {"date": "2025-03-15", "vertical_jump": 65},
        ],
    }


@router.get("/load/{athlete_id}")
async def get_training_load(athlete_id: int):
    """Get training load metrics for an athlete using the PMC model"""
    if athlete_id != 1:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Placeholder PMC data
    # In a real implementation, this would calculate:
    # - CTL (Chronic Training Load) - fitness
    # - ATL (Acute Training Load) - fatigue
    # - TSB (Training Stress Balance) - form
    return {
        "athlete_id": athlete_id,
        "date": "2025-03-15",
        "ctl": 85.7,  # Chronic Training Load (fitness)
        "atl": 95.2,  # Acute Training Load (fatigue)
        "tsb": -9.5,  # Training Stress Balance (form)
        "daily_load": [
            {"date": "2025-03-08", "load": 85, "ctl": 80.0, "atl": 75.5, "tsb": 4.5},
            {"date": "2025-03-09", "load": 55, "ctl": 80.5, "atl": 76.8, "tsb": 3.7},
            {"date": "2025-03-10", "load": 95, "ctl": 81.2, "atl": 80.5, "tsb": 0.7},
            {"date": "2025-03-11", "load": 110, "ctl": 82.3, "atl": 85.7, "tsb": -3.4},
            {"date": "2025-03-12", "load": 40, "ctl": 82.5, "atl": 83.4, "tsb": -0.9},
            {"date": "2025-03-13", "load": 100, "ctl": 83.7, "atl": 88.2, "tsb": -4.5},
            {"date": "2025-03-14", "load": 120, "ctl": 85.0, "atl": 93.4, "tsb": -8.4},
            {"date": "2025-03-15", "load": 105, "ctl": 85.7, "atl": 95.2, "tsb": -9.5},
        ],
        "recommendations": {
            "status": "Caution",
            "message": "Training stress balance is negative, indicating accumulated fatigue. Consider reducing intensity in next 2 sessions to improve recovery.",
            "suggested_adjustment": -15,  # Percent reduction recommended
        },
    }


@router.get("/comparison/{athlete_id}")
async def get_peer_comparison(athlete_id: int):
    """Get performance comparison against peers"""
    if athlete_id != 1:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Placeholder comparison data
    return {
        "athlete_id": athlete_id,
        "percentiles": {
            "strength": 85,  # 85th percentile among peers
            "speed": 75,
            "power": 82,
            "overall": 80,
        },
        "ranking": {
            "team_rank": 3,
            "total_athletes": 12,
        },
    }
