import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, JSON, Text
from sqlalchemy.orm import relationship
from apps.api.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)  # MATHS | SCIENCE | PHYSICS | CHEMISTRY | BIOLOGY
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    grade_levels = Column(JSON, default=list)  # [4, 5, 6, 7, 8, 9, 10]
    icon = Column(String(50), default="book")
    
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    grade = Column(Integer, nullable=False, index=True)
    board = Column(String(50), default="CBSE", nullable=False)
    ncert_chapter = Column(String(100), nullable=True)  # e.g. "Class 6 Chapter 7: Fractions"
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=1)
    
    subject = relationship("Subject", back_populates="topics")
    skills = relationship("Skill", back_populates="topic", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(100), unique=True, nullable=False, index=True)  # e.g. MATH_6_FRAC_ADD_LIKE
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    learning_objectives = Column(JSON, default=list)
    common_misconceptions = Column(JSON, default=list)  # [{"id": "m1", "description": "Adds denominators directly", "remediation": "Use pizza visual slice model"}]
    display_order = Column(Integer, default=1)
    
    topic = relationship("Topic", back_populates="skills")
    lessons = relationship("Lesson", back_populates="skill", cascade="all, delete-orphan")
    mastery_states = relationship("MasteryState", back_populates="skill", cascade="all, delete-orphan")

class SkillPrerequisite(Base):
    __tablename__ = "skill_prerequisites"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    prerequisite_skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    is_strict = Column(Boolean, default=True)

class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content_markdown = Column(Text, nullable=False)
    real_world_context = Column(Text, nullable=True)  # e.g. Sharing rotis/dosas for fractions
    review_status = Column(String(50), default="APPROVED")  # DRAFT | NEEDS_REVIEW | APPROVED
    
    skill = relationship("Skill", back_populates="lessons")
    activities = relationship("Activity", back_populates="lesson", cascade="all, delete-orphan")

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    lesson_id = Column(String(36), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(String(50), nullable=False)  # EXPLAINER | GUIDED_PRACTICE | QUIZ | MINI_CHALLENGE | REVISION_CARD
    prompt_text = Column(Text, nullable=False)
    solution_expression = Column(String(255), nullable=True)  # SymPy parsable for numeric/math
    rubric = Column(JSON, default=dict)                       # Evaluation criteria for assessor
    hint_ladder = Column(JSON, default=list)                  # [Nudge, Bigger Hint, Worked Example]
    display_order = Column(Integer, default=1)
    
    lesson = relationship("Lesson", back_populates="activities")
    attempts = relationship("Attempt", back_populates="activity", cascade="all, delete-orphan")

class Attempt(Base):
    __tablename__ = "attempts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    activity_id = Column(String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(String(36), ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    sympy_verified = Column(Boolean, default=False)
    hints_used = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, default=0)
    misconception_identified = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    activity = relationship("Activity", back_populates="attempts")

class MasteryState(Base):
    __tablename__ = "mastery_states"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    child_id = Column(String(36), ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Bayesian Knowledge Tracing (BKT) Parameters
    p_mastery = Column(Float, default=0.1, nullable=False)  # Prior/Posterior P(L)
    p_transit = Column(Float, default=0.2, nullable=False)  # P(T)
    p_guess = Column(Float, default=0.2, nullable=False)    # P(G)
    p_slip = Column(Float, default=0.1, nullable=False)     # P(S)
    
    # Spaced Repetition (SM-2 variant)
    stability_factor = Column(Float, default=1.0)
    consecutive_correct = Column(Integer, default=0)
    last_practiced = Column(DateTime, default=datetime.utcnow)
    next_review_due = Column(DateTime, default=datetime.utcnow)
    review_interval_days = Column(Integer, default=1)
    
    child = relationship("ChildProfile", back_populates="mastery_states")
    skill = relationship("Skill", back_populates="mastery_states")
