from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChildProfileCreate(BaseModel):
    nickname: str = Field(min_length=1, max_length=50, description="Child first name or nickname only. No surname.")
    age_band: str = Field(pattern="^(6-8|9-12|13-16)$", description="Age band determining tone and vocabulary")
    grade: int = Field(ge=1, le=10)
    board: str = Field(default="CBSE")
    language: str = Field(default="en", pattern="^(en|hi|te)$")
    interests: List[str] = Field(default_factory=list)
    avatar_id: str = Field(default="owl_avatar_1")
    pin: str = Field(min_length=4, max_length=6, description="4-digit PIN for child profile switch")
    daily_time_limit_mins: int = Field(default=30, ge=10, le=120)
    ai_settings: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ChildProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    age_band: Optional[str] = None
    grade: Optional[int] = None
    board: Optional[str] = None
    language: Optional[str] = None
    interests: Optional[List[str]] = None
    avatar_id: Optional[str] = None
    pin: Optional[str] = None
    daily_time_limit_mins: Optional[int] = None
    ai_settings: Optional[Dict[str, Any]] = None

class ChildProfileResponse(BaseModel):
    id: str
    nickname: str
    age_band: str
    grade: int
    board: str
    language: str
    interests: List[str]
    avatar_id: str
    daily_time_limit_mins: int
    ai_settings: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class ChildMemoryItem(BaseModel):
    id: str
    category: str
    key: str
    value: str
    confidence: float
    created_at: datetime

    class Config:
        from_attributes = True
