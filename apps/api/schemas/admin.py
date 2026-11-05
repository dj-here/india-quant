from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class PromptVersionCreate(BaseModel):
    agent_name: str
    version: str
    model_id: str
    system_prompt: str
    parameters: Optional[Dict[str, Any]] = None
    changelog: Optional[str] = None

class PromptVersionResponse(BaseModel):
    id: str
    agent_name: str
    version: str
    model_id: str
    system_prompt: str
    parameters: Dict[str, Any]
    is_active: bool
    changelog: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class FeatureFlagToggle(BaseModel):
    key: str
    is_enabled: bool

class ContentReviewAction(BaseModel):
    review_item_id: str
    action: str # APPROVE | REJECT
    reviewer_comments: Optional[str] = None
