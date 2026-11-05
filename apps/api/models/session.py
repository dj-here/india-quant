import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, JSON, Text
from sqlalchemy.orm import relationship
from apps.api.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    child_id = Column(String(36), ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    session_type = Column(String(50), default="ACADEMIC", nullable=False)  # ACADEMIC | VALUES | DIAGNOSTIC
    subject_code = Column(String(50), nullable=True)                      # MATHS | SCIENCE | VALUES
    current_skill_id = Column(String(36), nullable=True)
    status = Column(String(50), default="ACTIVE", nullable=False)          # ACTIVE | COMPLETED | TIMED_OUT | ESCALATED
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    xp_earned = Column(Integer, default=0)
    turn_count = Column(Integer, default=0)
    
    child = relationship("ChildProfile", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    safety_events = relationship("SafetyEvent", back_populates="session", cascade="all, delete-orphan")
    problem_reports = relationship("ProblemReport", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(50), nullable=False)  # CHILD | TUTOR | SAFETY | SYSTEM
    content = Column(Text, nullable=False)
    
    # AI Metadata & Auditing
    agent_name = Column(String(50), nullable=True)         # TutorAgent | ValuesCoachAgent | SafetyAgent
    prompt_version = Column(String(50), nullable=True)     # v1.0.0
    model_version = Column(String(100), nullable=True)     # claude-3-5-sonnet-20241022
    safety_verdict = Column(JSON, default=dict)            # { "is_safe": true, "category": "SAFE", "confidence": 0.99 }
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("Session", back_populates="messages")
    tool_calls = relationship("ToolCall", back_populates="message", cascade="all, delete-orphan")
    problem_reports = relationship("ProblemReport", back_populates="message", cascade="all, delete-orphan")

class ToolCall(Base):
    __tablename__ = "tool_calls"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    tool_name = Column(String(100), nullable=False)        # verify_math | grade_answer | award_xp | create_mission
    input_args = Column(JSON, default=dict)
    output_result = Column(JSON, default=dict)
    execution_time_ms = Column(Integer, default=0)
    verified_by_engine = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    message = relationship("Message", back_populates="tool_calls")

class SafetyEvent(Base):
    __tablename__ = "safety_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(String(36), ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    severity = Column(String(50), nullable=False)          # LOW | MEDIUM | HIGH | CRISIS
    category = Column(String(50), nullable=False)          # DISTRESS | ABUSE | BULLYING | PII | JAILBREAK | ANTHROPOMORPHISM
    raw_trigger = Column(Text, nullable=False)             # Redacted for PII before storing
    sanitized_context = Column(Text, nullable=False)
    parent_notified = Column(Boolean, default=False)
    admin_reviewed = Column(Boolean, default=False)
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("Session", back_populates="safety_events")

class ProblemReport(Base):
    __tablename__ = "problem_reports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    reported_by = Column(String(20), nullable=False)       # PARENT | CHILD
    reason = Column(String(100), nullable=False)           # INCORRECT_MATH | UNKIND_TONE | CONFUSING | INAPPROPRIATE
    details = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING")         # PENDING | RESOLVED | DISMISSED
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("Session", back_populates="problem_reports")
    message = relationship("Message", back_populates="problem_reports")
