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

    training_level: Optional[str] = "intermediate"
    is_active: Optional[bool] = True


class AthleteUpdate(BaseModel):
    """Schema for updating an athlete"""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    sport: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    birth_date: Optional[str] = None
    training_level: Optional[str] = None
    is_active: Optional[bool] = None


class Athlete(AthleteBase):
    """Schema for a complete athlete"""

    id: str
    user_id: Optional[str] = None
    training_level: Optional[str] = "intermediate"
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True
