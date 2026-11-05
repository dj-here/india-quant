import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import relationship
from apps.api.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="PARENT", nullable=False)  # PARENT | ADMIN | REVIEWER
    email_verified = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    consents = relationship("Consent", back_populates="user", cascade="all, delete-orphan")
    children = relationship("ChildProfile", back_populates="parent", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

class Consent(Base):
    __tablename__ = "consents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    consent_type = Column(String(50), nullable=False)  # DPDP_ACT_2023 | COPPA | GDPR_K
    verification_method = Column(String(50), nullable=False)  # EMAIL_VERIFIED | CARD_AUTH | SMS_OTP
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    terms_version = Column(String(20), default="2026.1", nullable=False)
    is_active = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="consents")

class ChildProfile(Base):
    __tablename__ = "child_profiles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    parent_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    nickname = Column(String(100), nullable=False)  # First name or nickname only, no surname per DPDP/COPPA
    age_band = Column(String(20), nullable=False)    # 6-8 | 9-12 | 13-16
    grade = Column(Integer, nullable=False)          # 1 to 10
    board = Column(String(50), default="CBSE", nullable=False)  # CBSE | ICSE | STATE | IB
    language = Column(String(10), default="en", nullable=False) # en | hi | te
    interests = Column(JSON, default=list)           # ["space", "cricket", "animals", "drawing"]
    avatar_id = Column(String(50), default="owl_avatar_1")
    hashed_pin = Column(String(255), nullable=False) # 4-digit PIN for child login
    daily_time_limit_mins = Column(Integer, default=30)
    ai_settings = Column(JSON, default=dict)        # { "hint_strictness": "socratic", "tone": "encouraging", "quiet_hours_start": "21:00" }
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    parent = relationship("User", back_populates="children")
    sessions = relationship("Session", back_populates="child", cascade="all, delete-orphan")
    mastery_states = relationship("MasteryState", back_populates="child", cascade="all, delete-orphan")
    memories = relationship("ChildMemory", back_populates="child", cascade="all, delete-orphan")
    missions = relationship("Mission", back_populates="child", cascade="all, delete-orphan")
    garden_items = relationship("CharacterGardenItem", back_populates="child", cascade="all, delete-orphan")
    streaks = relationship("Streak", back_populates="child", cascade="all, delete-orphan")
    badges = relationship("Badge", back_populates="child", cascade="all, delete-orphan")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # PARENT_DELETED_DATA | CONSENT_GRANTED | SETTINGS_UPDATED
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(36), nullable=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="audit_logs")
