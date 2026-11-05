import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Text
from sqlalchemy.orm import relationship
from apps.api.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ChildMemory(Base):
    __tablename__ = "child_memories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    child_id = Column(String(36), ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False) # INTEREST | MISCONCEPTION | LEARNING_STYLE | RECENT_WIN | VALUES_GOAL
    key = Column(String(100), nullable=False)     # e.g. favorite_sport, fraction_concept_gap
    value = Column(Text, nullable=False)          # Redacted, strictly non-PII, e.g. "Enjoys cricket analogies"
    confidence = Column(Float, default=1.0)
    source_session_id = Column(String(36), nullable=True)
    parent_visible = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    child = relationship("ChildProfile", back_populates="memories")
