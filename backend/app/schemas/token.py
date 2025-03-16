from pydantic import BaseModel


class Token(BaseModel):
    """Token schema"""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token data schema"""

    user_id: str | None = None
