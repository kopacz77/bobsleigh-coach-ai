from pydantic import BaseModel, EmailStr


class User(BaseModel):
    """User model"""

    id: int
    email: EmailStr
    full_name: str
    disabled: bool = False
