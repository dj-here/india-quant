import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, JSON, Text
from apps.api.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class PromptVersion(Base):
    __tablename__ = "prompt_versions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_name = Column(String(50), nullable=False, index=True) # TutorAgent | PlannerAgent | AssessorAgent | ValuesCoachAgent | SafetyAgent
    version = Column(String(20), nullable=False)                # e.g. v1.0.0
    model_id = Column(String(100), nullable=False)              # e.g. claude-3-5-sonnet-20241022
    system_prompt = Column(Text, nullable=False)
    parameters = Column(JSON, default=dict)                     # { "temperature": 0.2, "max_tokens": 400 }
    is_active = Column(Boolean, default=False)
    created_by = Column(String(100), default="SYSTEM")
    changelog = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class EvalRun(Base):
    __tablename__ = "eval_runs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    eval_suite = Column(String(100), nullable=False) # RED_TEAM_SAFETY | MATHS_CORRECTNESS | SOCRATIC_QUALITY | ANTI_DEPENDENCY
    model_id = Column(String(100), nullable=False)
    prompt_version = Column(String(20), nullable=False)
    total_cases = Column(Integer, nullable=False)
    passed_cases = Column(Integer, nullable=False)
    accuracy_percentage = Column(Float, nullable=False)
    is_passing = Column(Boolean, nullable=False)
    detailed_metrics = Column(JSON, default=dict)
    failure_cases = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class FeatureFlag(Base):
    __tablename__ = "feature_flags"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), unique=True, nullable=False, index=True) # KILL_SWITCH_AI_ALL | VOICE_ENABLED | VISION_ENABLED
    is_enabled = Column(Boolean, default=True)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ContentReviewItem(Base):
    __tablename__ = "content_review_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    content_type = Column(String(50), nullable=False) # STORY | DILEMMA | MISSION_TEMPLATE | LESSON
    target_id = Column(String(36), nullable=False)
    title = Column(String(200), nullable=False)
    draft_content = Column(JSON, default=dict)
    drafted_by_ai = Column(Boolean, default=True)
    status = Column(String(50), default="PENDING_REVIEW") # PENDING_REVIEW | APPROVED | REJECTED
    reviewed_by = Column(String(100), nullable=True)
    reviewer_comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
