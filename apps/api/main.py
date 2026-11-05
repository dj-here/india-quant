from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from apps.api.config import settings
from apps.api.database import init_db, AsyncSessionLocal
from apps.api.seed.curriculum_seed import seed_curriculum
from apps.api.seed.values_seed import seed_values

# Routers
from apps.api.routers.auth import router as auth_router
from apps.api.routers.children import router as children_router
from apps.api.routers.curriculum import router as curriculum_router
from apps.api.routers.sessions import router as sessions_router
from apps.api.routers.values import router as values_router
from apps.api.routers.parent import router as parent_router
from apps.api.routers.admin import router as admin_router
from apps.api.routers.health import router as health_router

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        # Child safety & OWASP security headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https:; connect-src 'self' https:;"
        )
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables & Seed Content
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_curriculum(session)
        await seed_values(session)
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "KidsMentor is an AI-only 1-on-1 tutoring platform for children aged 6–16. "
        "Delivers NCERT-aligned Maths & Science Socratic tutoring, 12 flagship Life Values & Ethics modules, "
        "and verifiable parental oversight compliant with India DPDP Act 2023 and COPPA."
    ),
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)

# Include Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(children_router)
app.include_router(curriculum_router)
app.include_router(sessions_router)
app.include_router(values_router)
app.include_router(parent_router)
app.include_router(admin_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
