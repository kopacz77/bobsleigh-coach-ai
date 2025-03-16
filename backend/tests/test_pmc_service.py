"""Tests for the PMC service."""

import pytest
from fastapi.testclient import TestClient
from app.services.pmc_service import PMCService


@pytest.fixture
def pmc_service():
    """Create a PMC service instance for testing."""
    return PMCService()


async def test_calculate_pmc_for_athlete(pmc_service):
    """Test PMC calculation for an athlete."""
    athlete_id = 1
    days = 30
    
    pmc_data = await pmc_service.calculate_pmc_for_athlete(athlete_id, days)
    
    # Check that we have the expected keys
    assert "dates" in pmc_data
    assert "loads" in pmc_data
    assert "ctl" in pmc_data
    assert "atl" in pmc_data
    assert "tsb" in pmc_data
    
    # Check that all arrays have the correct length
    assert len(pmc_data["dates"]) == days
    assert len(pmc_data["loads"]) == days
    assert len(pmc_data["ctl"]) == days
    assert len(pmc_data["atl"]) == days
    assert len(pmc_data["tsb"]) == days
    
    # Check that ATL has a faster response than CTL
    # For a consistent training load increase, ATL should rise faster than CTL
    high_load_period = 7
    ctl_diff = pmc_data["ctl"][high_load_period] - pmc_data["ctl"][0]
    atl_diff = pmc_data["atl"][high_load_period] - pmc_data["atl"][0]
    
    assert atl_diff > ctl_diff, "ATL should respond faster than CTL to load changes"


async def test_get_training_recommendations(pmc_service):
    """Test training recommendations generation."""
    athlete_id = 1
    
    recommendations = await pmc_service.get_training_recommendations(athlete_id)
    
    # Check for required fields
    assert "status" in recommendations
    assert "message" in recommendations
    assert "load_adjustment" in recommendations
    assert "focus_areas" in recommendations
    assert "current_metrics" in recommendations
    
    # Check current metrics
    assert "ctl" in recommendations["current_metrics"]
    assert "atl" in recommendations["current_metrics"]
    assert "tsb" in recommendations["current_metrics"]
    
    # Check that recommendations make sense based on TSB
    tsb = recommendations["current_metrics"]["tsb"]
    
    if tsb > 20:
        assert recommendations["status"] == "Peak Form"
        assert recommendations["load_adjustment"] > 0
    elif tsb > 0:
        assert recommendations["status"] == "Good Form"
    elif tsb > -10:
        assert recommendations["status"] == "Slight Fatigue"
        assert recommendations["load_adjustment"] < 0
    elif tsb > -30:
        assert recommendations["status"] == "Significant Fatigue"
        assert recommendations["load_adjustment"] < -20
    else:
        assert recommendations["status"] == "Extreme Fatigue"
        assert recommendations["load_adjustment"] < -40


async def test_generate_workout_recommendations(pmc_service):
    """Test workout recommendation generation."""
    athlete_id = 1
    days_ahead = 5
    
    workout_schedule = await pmc_service.generate_workout_recommendations(athlete_id, days_ahead)
    
    # Check that we get the expected number of workouts
    assert 0 < len(workout_schedule) <= days_ahead
    
    # Check workout structure
    for workout in workout_schedule:
        assert "date" in workout
        assert "workout_type" in workout
        assert "focus" in workout
        assert "duration" in workout
        assert "intensity" in workout
        assert "exercises" in workout
        
        # Check exercises structure
        for exercise in workout["exercises"]:
            assert "name" in exercise
            assert "sets" in exercise
            
            # Check for specific exercise properties based on workout type
            if workout["workout_type"] == "Strength":
                if "Back Squat" in exercise["name"]:
                    assert "weight" in exercise
                    assert "reps" in exercise
            elif workout["workout_type"] == "Speed":
                if "Sprint" in exercise["name"]:
                    assert "distance" in exercise or "duration" in exercise
                    assert "rest" in exercise
