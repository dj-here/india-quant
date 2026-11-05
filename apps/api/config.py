from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os

class Settings(BaseSettings):
    APP_NAME: str = "KidsMentor API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security & Auth
    SECRET_KEY: str = "kidsmentor-super-secret-key-change-in-production-2026-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./kidsmentor.db",
        description="Async database connection string. e.g. postgresql+asyncpg://user:pass@localhost:5432/kidsmentor"
    )
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # AI Providers & Model Pinning
    PRIMARY_LLM_PROVIDER: str = "anthropic"  # anthropic | openai | gemini | mock
    FALLBACK_LLM_PROVIDER: str = "mock"
    
    # Pinned Model IDs (per ADR-002, ADR-010)
    TUTOR_MODEL_ID: str = "claude-3-5-sonnet-20241022"
    CLASSIFIER_MODEL_ID: str = "claude-3-5-haiku-20241022"
    VALUES_MODEL_ID: str = "claude-3-5-sonnet-20241022"
    ASSESSOR_MODEL_ID: str = "claude-3-5-haiku-20241022"
    
    # API Keys
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    # Global AI Kill Switch & Feature Flags
    KILL_SWITCH_AI_ALL: bool = False
    KILL_SWITCH_VOICE: bool = False
    KILL_SWITCH_VISION: bool = False
    
    # Child Safety Defaults
    MAX_SESSION_MINUTES_6_8: int = 20
    MAX_SESSION_MINUTES_9_12: int = 30
    MAX_SESSION_MINUTES_13_16: int = 45
    EMERGENCY_HELPLINE_INDIA: str = "1098"
    
    # Cost & Token Control
    MAX_TOKENS_PER_TURN_6_8: int = 250
    MAX_TOKENS_PER_TURN_9_12: int = 350
    MAX_TOKENS_PER_TURN_13_16: int = 500

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
