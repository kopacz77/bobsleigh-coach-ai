from fastapi import APIRouter, Depends

from app.core.security import get_current_user

router = APIRouter()


@router.get("/me")
async def get_current_user_profile(user=Depends(get_current_user)):
    """Return the authenticated user's profile from the Supabase JWT."""
    return {
        "id": str(user.id),
        "email": user.email,
        "user_metadata": user.user_metadata,
        "app_metadata": user.app_metadata,
    }
