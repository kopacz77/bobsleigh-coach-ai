# API Documentation

## Overview

The Bobsleigh Coach AI backend provides a RESTful API for interacting with the application. This document outlines the available endpoints, request/response formats, and authentication requirements.

## Base URL

All API endpoints are relative to the base URL:

```
https://api.bobsleigh-coach-ai.example.com/api
```

Replace `api.bobsleigh-coach-ai.example.com` with your actual API domain.

## Authentication

The API uses JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

To obtain a token, use the authentication endpoints described below.

## Endpoints

### Authentication

#### Login

```
POST /auth/token
```

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Google OAuth

```
POST /auth/google
```

No request body needed - the frontend should handle the OAuth flow using Supabase client library.

### Athletes

#### Get Athletes

```
GET /athletes
```

Response:
```json
[
  {
    "id": 1,
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "sport": "Bobsleigh",
    "height": 185,
    "weight": 85,
    "birth_date": "1995-05-15"
  }
]
```

#### Get Athlete

```
GET /athletes/{athlete_id}
```

Response:
```json
{
  "id": 1,
  "user_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "sport": "Bobsleigh",
  "height": 185,
  "weight": 85,
  "birth_date": "1995-05-15"
}
```

#### Create Athlete

```
POST /athletes
```

Request:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "sport": "Bobsleigh",
  "height": 185,
  "weight": 85,
  "birth_date": "1995-05-15"
}
```

Response: Same as the Get Athlete endpoint, with the created athlete.

#### Update Athlete

```
PUT /athletes/{athlete_id}
```

Request:
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "sport": "Bobsleigh",
  "height": 185,
  "weight": 83,
  "birth_date": "1995-05-15"
}
```

Response: Same as the Get Athlete endpoint, with the updated athlete.

### Training

#### Get Workouts

```
GET /training/workouts?athlete_id={athlete_id}&limit={limit}
```

Parameters:
- `athlete_id`: ID of the athlete (required)
- `limit`: Maximum number of workouts to return (default: 10)

Response:
```json
[
  {
    "id": 1,
    "athlete_id": 1,
    "name": "Monday Strength",
    "date": "2025-03-15",
    "duration": 90,
    "type": "Strength",
    "notes": "Focus on explosiveness",
    "exercises": [
      {
        "id": 1,
        "workout_id": 1,
        "exercise_id": 1,
        "sets": 4,
        "reps": 6,
        "weight": 120,
        "notes": "Felt strong"
      }
    ]
  }
]
```

#### Get Workout

```
GET /training/workouts/{workout_id}
```

Response: Same as a single workout from the Get Workouts endpoint.

#### Create Workout

```
POST /training/workouts
```

Request:
```json
{
  "athlete_id": 1,
  "name": "Monday Strength",
  "date": "2025-03-15",
  "duration": 90,
  "type": "Strength",
  "notes": "Focus on explosiveness",
  "exercises": [
    {
      "exercise_id": 1,
      "sets": 4,
      "reps": 6,
      "weight": 120,
      "notes": "Felt strong"
    }
  ]
}
```

Response: Same as the Get Workout endpoint, with the created workout.

#### Get Training Recommendations

```
GET /training/recommendations?athlete_id={athlete_id}
```

Parameters:
- `athlete_id`: ID of the athlete (required)

Response:
```json
{
  "status": {
    "status": "Good Form",
    "message": "You have good form with balanced fitness and fatigue. Suitable for moderate to high training loads.",
    "load_adjustment": 0,
    "focus_areas": ["Mixed intensity", "Strength", "Technical work"],
    "current_metrics": {
      "ctl": 85.7,
      "atl": 80.2,
      "tsb": 5.5
    }
  },
  "recommended_workouts": [
    {
      "date": "2025-03-18",
      "workout_type": "Strength",
      "focus": "Lower body power",
      "duration": 75,
      "intensity": "High",
      "exercises": [
        {"name": "Back Squat", "sets": 5, "reps": 5, "weight": 130},
        {"name": "Split Squat", "sets": 3, "reps": 6, "weight": 80},
        {"name": "Box Jumps", "sets": 4, "reps": 8, "height": 30}
      ]
    }
  ]
}
```

### Performance

#### Get Performance Metrics

```
GET /performance/metrics/{athlete_id}
```

Response:
```json
{
  "athlete_id": 1,
  "strength_metrics": {
    "squat_1rm": 150,
    "bench_1rm": 100,
    "deadlift_1rm": 180,
    "power_clean_1rm": 90,
    "strength_score": 85
  },
  "speed_metrics": {
    "30m_best": 4.1,
    "60m_best": 7.3,
    "speed_score": 78
  },
  "power_metrics": {
    "vertical_jump": 65,
    "broad_jump": 280,
    "med_ball_throw": 850,
    "power_score": 82
  }
}
```

#### Get Performance Trends

```
GET /performance/trends/{athlete_id}?metric={metric}&days={days}
```

Parameters:
- `metric`: The performance metric to get trends for (e.g., `squat_1rm`, `30m_best`)
- `days`: Number of days of history to include (default: 90)

Response:
```json
{
  "athlete_id": 1,
  "metric": "squat_1rm",
  "trend_data": [
    {"date": "2025-01-15", "value": 140},
    {"date": "2025-02-15", "value": 145},
    {"date": "2025-03-15", "value": 150}
  ]
}
```

#### Get Training Load

```
GET /performance/load/{athlete_id}?days={days}
```

Parameters:
- `days`: Number of days of history to include (default: 90)

Response:
```json
{
  "athlete_id": 1,
  "date": "2025-03-15",
  "ctl": 85.7,
  "atl": 95.2,
  "tsb": -9.5,
  "daily_load": [
    {"date": "2025-03-08", "load": 85, "ctl": 80.0, "atl": 75.5, "tsb": 4.5},
    {"date": "2025-03-09", "load": 55, "ctl": 80.5, "atl": 76.8, "tsb": 3.7},
    {"date": "2025-03-10", "load": 95, "ctl": 81.2, "atl": 80.5, "tsb": 0.7},
    {"date": "2025-03-11", "load": 110, "ctl": 82.3, "atl": 85.7, "tsb": -3.4},
    {"date": "2025-03-12", "load": 40, "ctl": 82.5, "atl": 83.4, "tsb": -0.9},
    {"date": "2025-03-13", "load": 100, "ctl": 83.7, "atl": 88.2, "tsb": -4.5},
    {"date": "2025-03-14", "load": 120, "ctl": 85.0, "atl": 93.4, "tsb": -8.4},
    {"date": "2025-03-15", "load": 105, "ctl": 85.7, "atl": 95.2, "tsb": -9.5}
  ],
  "recommendations": {
    "status": "Caution",
    "message": "Training stress balance is negative, indicating accumulated fatigue. Consider reducing intensity in next 2 sessions to improve recovery.",
    "suggested_adjustment": -15
  }
}
```

#### Get Peer Comparison

```
GET /performance/comparison/{athlete_id}
```

Response:
```json
{
  "athlete_id": 1,
  "percentiles": {
    "strength": 85,
    "speed": 75,
    "power": 82,
    "overall": 80
  },
  "ranking": {
    "team_rank": 3,
    "total_athletes": 12
  },
  "top_performers": [
    {
      "athlete_id": 2,
      "name": "Jane Smith",
      "overall_score": 92
    },
    {
      "athlete_id": 5,
      "name": "Alex Johnson",
      "overall_score": 88
    },
    {
      "athlete_id": 1,
      "name": "John Doe",
      "overall_score": 80
    }
  ]
}
```

## Error Responses

The API uses standard HTTP status codes to indicate success or failure of a request. Error responses have the following format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common error codes:

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication missing or invalid
- `403 Forbidden`: Authenticated user doesn't have permission
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server-side error

## Rate Limiting

API requests are limited to 100 requests per minute per user. If exceeded, the API will return a `429 Too Many Requests` status code.

## Versioning

API versioning is handled through the URL path. The current version is implied (v1). Future versions will be explicitly specified:

```
/api/v2/...
```

## Pagination

Endpoints that return multiple items support pagination through query parameters:

```
?limit=10&offset=0
```

Paginated responses include metadata:

```json
{
  "items": [...],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

## CORS

Cross-Origin Resource Sharing (CORS) is enabled for the frontend domain. If you need to access the API from other domains, please contact the API administrator.
