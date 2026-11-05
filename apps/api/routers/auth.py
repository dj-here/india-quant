from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime

from apps.api.database import get_db
from apps.api.models.user import User, Consent, ChildProfile, AuditLog
from apps.api.schemas.auth import (
    ParentSignupRequest,
    ParentLoginRequest,
    ChildPinLoginRequest,
    TokenResponse,
    ParentProfileResponse,
    ConsentRecord
)
from apps.api.services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_parent
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & Consent"])

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup_parent(req: ParentSignupRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # Check if parent email already exists
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    if not req.consent_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parental consent is required under India DPDP Act 2023 and COPPA"
        )
    
    # Create parent user
    new_user = User(
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role="PARENT",
        email_verified=True
    )
    db.add(new_user)
    await db.flush()
    
    # Record Verifiable Parental Consent
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "unknown")
    
    consent = Consent(
        user_id=new_user.id,
        consent_type="DPDP_ACT_2023",
        verification_method=req.verification_method,
        ip_address=client_ip,
        user_agent=user_agent[:250],
        terms_version="2026.1"
    )
    db.add(consent)
    
    # Audit log entry
    audit = AuditLog(
        user_id=new_user.id,
        action="PARENT_SIGNUP_AND_CONSENT_GRANTED",
        entity_type="CONSENT",
        entity_id=consent.id,
        details={"email": req.email, "method": req.verification_method},
        ip_address=client_ip
    )
    db.add(audit)
    await db.commit()
    
    token = create_access_token({"sub": new_user.id, "role": new_user.role, "email": new_user.email})
    return TokenResponse(
        access_token=token,
        role=new_user.role,
        user_id=new_user.id
    )

@router.post("/login", response_model=TokenResponse)
async def login_parent(req: ParentLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id
    )

@router.post("/child-login", response_model=TokenResponse)
async def login_child(req: ChildPinLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChildProfile).where(ChildProfile.id == req.child_id))
    child = result.scalars().first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")
    
    if not verify_password(req.pin, child.hashed_pin):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect PIN")
    
    token = create_access_token({
        "sub": child.parent_id,
        "child_id": child.id,
        "role": "CHILD",
        "nickname": child.nickname,
        "age_band": child.age_band
    })
    
    return TokenResponse(
        access_token=token,
        role="CHILD",
        user_id=child.parent_id,
        child_id=child.id,
        nickname=child.nickname
    )

@router.get("/me", response_model=ParentProfileResponse)
async def get_me(parent: User = Depends(get_current_parent)):
    return parent

@router.get("/consents", response_model=list[ConsentRecord])
async def get_consents(parent: User = Depends(get_current_parent), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Consent).where(Consent.user_id == parent.id))
    return result.scalars().all()
