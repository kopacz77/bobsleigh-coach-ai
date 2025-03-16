"""Tests for the performance API endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)


def test_get_performance_metrics(client, monkeypatch):
    """Test the get_performance_metrics endpoint."""
    # Mock the authentication (in a real test, you would use proper authentication)
    # This is a simplified example
    
    # Make the request
    response = client.get("/api/performance/metrics/1")
    
    # Check response
    assert response.status_code == 200
    
    # Check response structure
    data = response.json()
    assert "athlete_id" in data
    assert "strength_metrics" in data
    assert "speed_metrics" in data
    assert "power_metrics" in data
    
    # Check specific metrics
    assert "squat_1rm" in data["strength_metrics"]
    assert "30m_best" in data["speed_metrics"]
    assert "vertical_jump" in data["power_metrics"]


def test_get_training_load(client):
    """Test the get_training_load endpoint."""
    # Make the request
    response = client.get("/api/performance/load/1")
    
    # Check response
    assert response.status_code == 200
    
    # Check response structure
    data = response.json()
    assert "athlete_id" in data
    assert "date" in data
    assert "ctl" in data
    assert "atl" in data
    assert "tsb" in data
    assert "daily_load" in data
    assert "recommendations" in data
    
    # Check daily load structure
    assert len(data["daily_load"]) > 0
    first_day = data["daily_load"][0]
    assert "date" in first_day
    assert "load" in first_day
    assert "ctl" in first_day
    assert "atl" in first_day
    assert "tsb" in first_day
    
    # Check recommendations
    assert "status" in data["recommendations"]
    assert "message" in data["recommendations"]


def test_get_performance_trends(client):
    """Test the get_performance_trends endpoint."""
    # Make the request with a specific metric
    response = client.get("/api/performance/trends/1?metric=squat_1rm&days=90")
    
    # Check response
    assert response.status_code == 200
    
    # Check response structure
    data = response.json()
    assert "athlete_id" in data
    assert "metric" in data
    assert "trend_data" in data
    
    # Check that the requested metric is returned
    assert data["metric"] == "squat_1rm"
    
    # Check trend data structure
    assert len(data["trend_data"]) > 0
    first_point = data["trend_data"][0]
    assert "date" in first_point
    assert "value" in first_point


def test_get_peer_comparison(client):
    """Test the get_peer_comparison endpoint."""
    # Make the request
    response = client.get("/api/performance/comparison/1")
    
    # Check response
    assert response.status_code == 200
    
    # Check response structure
    data = response.json()
    assert "athlete_id" in data
    assert "percentiles" in data
    assert "ranking" in data
    
    # Check percentiles
    assert "strength" in data["percentiles"]
    assert "speed" in data["percentiles"]
    assert "power" in data["percentiles"]
    assert "overall" in data["percentiles"]
    
    # Check ranking
    assert "team_rank" in data["ranking"]
    assert "total_athletes" in data["ranking"]
    
    # Basic validation
    assert 0 <= data["percentiles"]["overall"] <= 100
    assert 1 <= data["ranking"]["team_rank"] <= data["ranking"]["total_athletes"]
