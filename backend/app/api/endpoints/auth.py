from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.security import create_access_token
from app.models.user import User
from app.schemas.token import Token

router = APIRouter()


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Get an access token for future requests"""
    # This is a placeholder - we'll implement the actual Supabase auth later
    if form_data.username != "test@example.com" or form_data.password != "password":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Mock user data
    user = User(
        id=1,
        email=form_data.username,
        full_name="Test User",
        disabled=False,
    )

    # Create an access token with the user data
    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/google")
async def login_with_google():
    """Google OAuth login"""
    # This will be implemented later using Supabase Auth
    return {"message": "Google auth will be implemented"}
