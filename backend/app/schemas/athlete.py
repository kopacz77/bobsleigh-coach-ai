from typing import Optional

from pydantic import BaseModel, EmailStr


class AthleteBase(BaseModel):
    """Base athlete schema"""

    first_name: str
    last_name: str
    email: EmailStr
    sport: str
    height: Optional[float] = None  # in cm
    weight: Optional[float] = None  # in kg
    birth_date: Optional[str] = None  # YYYY-MM-DD


class AthleteCreate(AthleteBase):
    """Schema for creating a new athlete"""

    pass


class AthleteUpdate(BaseModel):
    """Schema for updating an athlete"""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    sport: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    birth_date: Optional[str] = None


class Athlete(AthleteBase):
    """Schema for a complete athlete"""

    id: int
    user_id: int

    class Config:
        from_attributes = True
