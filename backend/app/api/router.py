from fastapi import APIRouter

from app.api.endpoints import auth, athletes, exercises, training, performance, wellbeing, coach

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(athletes.router, prefix="/athletes", tags=["Athletes"])
api_router.include_router(exercises.router, prefix="/exercises", tags=["Exercises"])
api_router.include_router(training.router, prefix="/training", tags=["Training"])
api_router.include_router(performance.router, prefix="/performance", tags=["Performance"])
api_router.include_router(wellbeing.router, prefix="/wellbeing", tags=["Wellbeing"])
api_router.include_router(coach.router, prefix="/coach", tags=["Coach"])
