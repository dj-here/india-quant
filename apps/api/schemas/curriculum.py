from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class SubjectResponse(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str]
    icon: str
    grade_levels: List[int]

    class Config:
        from_attributes = True

class TopicResponse(BaseModel):
    id: str
    subject_id: str
    title: str
    grade: int
    board: str
    ncert_chapter: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True

class SkillResponse(BaseModel):
    id: str
    topic_id: str
    code: str
    name: str
    description: Optional[str]
    learning_objectives: List[str]
    p_mastery: Optional[float] = 0.1

    class Config:
        from_attributes = True

class ActivityResponse(BaseModel):
    id: str
    lesson_id: str
    activity_type: str
    prompt_text: str
    hint_ladder: List[str]

    class Config:
        from_attributes = True

class AttemptSubmission(BaseModel):
    activity_id: str
    submitted_answer: str
    time_taken_seconds: int = 0
    hints_used: int = 0

class AttemptResult(BaseModel):
    attempt_id: str
    is_correct: bool
    sympy_verified: bool
    feedback: str
    misconception: Optional[str]
    next_hint: Optional[str]
    p_mastery: float
    xp_awarded: int
