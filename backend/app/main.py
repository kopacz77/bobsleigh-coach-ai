from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings

# Create FastAPI app
app = FastAPI(
    title="Bobsleigh Coach API",
    description="API for the Bobsleigh Coach AI application",
    version="0.1.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health_check():
    """Health check endpoint with database connectivity test"""
    db_status = "disconnected"
    try:
        from app.db.session import get_supabase

        sb = get_supabase()
        result = sb.table("sports").select("id").limit(1).execute()
        db_status = "connected" if result.data else "empty"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": db_status,
    }
