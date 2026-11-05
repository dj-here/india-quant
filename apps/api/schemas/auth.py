from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class ParentSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    consent_confirmed: bool = Field(..., description="Parent agrees to Terms & India DPDP Act 2023 / COPPA Consent")
    verification_method: str = Field(default="EMAIL_VERIFIED")

class ParentLoginRequest(BaseModel):
    email: EmailStr
    password: str

class ChildPinLoginRequest(BaseModel):
    child_id: str
    pin: str = Field(min_length=4, max_length=6)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: Optional[str] = None
    child_id: Optional[str] = None
    nickname: Optional[str] = None

class ParentProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConsentRecord(BaseModel):
    id: str
    consent_type: str
    verification_method: str
    terms_version: str
    granted_at: datetime

    class Config:
        from_attributes = True
