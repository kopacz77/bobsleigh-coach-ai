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
            id=1,
            user_id=1,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            sport="Bobsleigh",
            height=185,
            weight=85,
            birth_date="1995-05-15",
        ),
        Athlete(
            id=2,
            user_id=2,
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
async def get_athlete(athlete_id: int):
    """Get a specific athlete by ID"""
    # Placeholder data
    if athlete_id == 1:
        return Athlete(
            id=1,
            user_id=1,
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
        id=3,
        user_id=3,
        first_name=athlete.first_name,
        last_name=athlete.last_name,
        email=athlete.email,
        sport=athlete.sport,
        height=athlete.height,
        weight=athlete.weight,
        birth_date=athlete.birth_date,
    )


@router.put("/{athlete_id}", response_model=Athlete)
async def update_athlete(athlete_id: int, athlete: AthleteUpdate):
    """Update an existing athlete"""
    # This would update the athlete in the database
    if athlete_id != 1:
        raise HTTPException(status_code=404, detail="Athlete not found")

    return Athlete(
        id=athlete_id,
        user_id=1,
        first_name=athlete.first_name or "John",
        last_name=athlete.last_name or "Doe",
        email="john@example.com",
        sport=athlete.sport or "Bobsleigh",
        height=athlete.height or 185,
        weight=athlete.weight or 85,
        birth_date=athlete.birth_date or "1995-05-15",
    )


@router.delete("/{athlete_id}")
async def delete_athlete(athlete_id: int):
    """Delete an athlete"""
    # This would delete the athlete from the database
    if athlete_id != 1:
        raise HTTPException(status_code=404, detail="Athlete not found")

    return {"message": "Athlete deleted successfully"}
