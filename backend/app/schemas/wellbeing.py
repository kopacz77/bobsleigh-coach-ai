"""Pydantic schemas for wellbeing check-in and readiness scoring."""

from typing import Optional

from pydantic import BaseModel, Field


class CheckInBase(BaseModel):
    """Base schema for daily wellbeing check-in metrics.

    All score fields are integers from 1-10.
    """

    sleep_quality: int = Field(..., ge=1, le=10)
    stress_level: int = Field(..., ge=1, le=10)
    nutrition_quality: int = Field(..., ge=1, le=10)
    physical_readiness: int = Field(..., ge=1, le=10)
    mental_clarity: int = Field(..., ge=1, le=10)
    notes: Optional[str] = None
    flag_concern: Optional[bool] = False


class CheckInCreate(CheckInBase):
    """Schema for creating a daily wellbeing check-in.

    user_id and date are set server-side from the authenticated user
    and current date -- never from client input.
    """

    pass
