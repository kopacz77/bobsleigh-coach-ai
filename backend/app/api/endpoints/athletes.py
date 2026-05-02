from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.athlete import Athlete, AthleteCreate, AthleteUpdate

router = APIRouter()


@router.get("/", response_model=List[Athlete])
async def get_athletes():
    """Get all athletes"""
    # Placeholder data
    athletes = [
        Athlete(
            id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            user_id="u1b2c3d4-e5f6-7890-abcd-ef1234567890",
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            sport="Bobsleigh",
            height=185,
            weight=85,
            birth_date="1995-05-15",
        ),
        Athlete(
            id="b2c3d4e5-f6a7-8901-bcde-f12345678901",
            user_id="u2c3d4e5-f6a7-8901-bcde-f12345678901",
            first_name="Jane",
            last_name="Smith",
            email="jane@example.com",
            sport="Bobsleigh",
            height=170,
            weight=65,
            birth_date="1997-08-22",
        ),
    ]
    return athletes


@router.get("/{athlete_id}", response_model=Athlete)
async def get_athlete(athlete_id: str):
    """Get a specific athlete by ID"""
    # Placeholder data
    if athlete_id == "a1b2c3d4-e5f6-7890-abcd-ef1234567890":
        return Athlete(
            id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            user_id="u1b2c3d4-e5f6-7890-abcd-ef1234567890",
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            sport="Bobsleigh",
            height=185,
            weight=85,
            birth_date="1995-05-15",
        )
    raise HTTPException(status_code=404, detail="Athlete not found")


@router.post("/", response_model=Athlete)
async def create_athlete(athlete: AthleteCreate):
    """Create a new athlete"""
    # This would save the athlete to the database
    return Athlete(
        id="c3d4e5f6-a7b8-9012-cdef-123456789012",
        first_name=athlete.first_name,
        last_name=athlete.last_name,
        email=athlete.email,
        sport=athlete.sport,
        height=athlete.height,
        weight=athlete.weight,
        birth_date=athlete.birth_date,
        training_level=athlete.training_level,
        is_active=athlete.is_active,
    )


@router.put("/{athlete_id}", response_model=Athlete)
async def update_athlete(athlete_id: str, athlete: AthleteUpdate):
    """Update an existing athlete"""
    # This would update the athlete in the database
    if athlete_id != "a1b2c3d4-e5f6-7890-abcd-ef1234567890":
        raise HTTPException(status_code=404, detail="Athlete not found")

    return Athlete(
        id=athlete_id,
        user_id="u1b2c3d4-e5f6-7890-abcd-ef1234567890",
        first_name=athlete.first_name or "John",
        last_name=athlete.last_name or "Doe",
        email="john@example.com",
        sport=athlete.sport or "Bobsleigh",
        height=athlete.height or 185,
        weight=athlete.weight or 85,
        birth_date=athlete.birth_date or "1995-05-15",
    )


@router.delete("/{athlete_id}")
async def delete_athlete(athlete_id: str):
    """Delete an athlete"""
    # This would delete the athlete from the database
    if athlete_id != "a1b2c3d4-e5f6-7890-abcd-ef1234567890":
        raise HTTPException(status_code=404, detail="Athlete not found")

    return {"message": "Athlete deleted successfully"}
