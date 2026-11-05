from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SessionStartRequest(BaseModel):
    session_type: str = Field(default="ACADEMIC", pattern="^(ACADEMIC|VALUES|DIAGNOSTIC)$")
    subject_code: Optional[str] = "MATHS"
    skill_id: Optional[str] = None

class MessageSchema(BaseModel):
    id: str
    sender: str
    content: str
    agent_name: Optional[str] = None
    prompt_version: Optional[str] = None
    model_version: Optional[str] = None
    safety_verdict: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: str
    child_id: str
    session_type: str
    subject_code: Optional[str] = None
    current_skill_id: Optional[str] = None
    status: str
    started_at: datetime
    xp_earned: int = 0
    turn_count: int = 0

    class Config:
        from_attributes = True

class SessionDetailResponse(SessionResponse):
    messages: List[MessageSchema] = []

class TurnRequest(BaseModel):
    message: str = Field(..., max_length=1000)
    audio_base64: Optional[str] = None
    image_base64: Optional[str] = None
    request_voice_response: bool = False

class TurnResponse(BaseModel):
    session_id: str
    message_id: str
    reply: str
    agent_name: str
    audio_url: Optional[str] = None
    safety_verdict: Dict[str, Any]
    tools_called: List[Dict[str, Any]] = []
    is_session_ended: bool = False
    xp_earned: int = 0

class ProblemReportRequest(BaseModel):
    message_id: str
    reason: str = Field(..., pattern="^(INCORRECT_MATH|UNKIND_TONE|CONFUSING|INAPPROPRIATE|OTHER)$")
    details: Optional[str] = None
