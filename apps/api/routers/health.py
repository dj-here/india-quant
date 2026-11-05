from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from apps.api.database import get_db
from apps.api.config import settings

router = APIRouter(tags=["Health & Readiness"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }

@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    try:
        # Check DB
        await db.execute(text("SELECT 1"))
        
        # Check SymPy
        import sympy as sp
        _ = sp.simplify("x + x")

        return {
            "status": "ready",
            "database": "connected",
            "sympy_sandbox": "operational",
            "kill_switch_active": settings.KILL_SWITCH_AI_ALL
        }
    except Exception as ex:
        return {
            "status": "degraded",
            "error": str(ex)
        }
