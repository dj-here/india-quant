from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class MasteryHeatmapItem(BaseModel):
    skill_id: str
    skill_name: str
    subject_code: str
    p_mastery: float
    status: str # NOT_STARTED | PRACTICING | MASTERED
    last_practiced: Optional[datetime]

class ValuesPracticeSummary(BaseModel):
    module_key: str
    module_name: str
    completed_missions: int
    reflections_count: int
    last_practiced: Optional[datetime]

class ParentDashboardSummary(BaseModel):
    child_id: str
    nickname: str
    total_time_spent_mins: int
    total_xp: int
    current_streak_days: int
    academic_mastery_average: float
    completed_missions_count: int
    heatmaps: List[MasteryHeatmapItem]
    values_summary: List[ValuesPracticeSummary]
    recent_sessions: List[Dict[str, Any]]

class WeeklyDigestResponse(BaseModel):
    child_id: str
    week_start: str
    week_end: str
    headline: str
    summary_text: str
    concepts_mastered: List[str]
    values_practiced: List[str]
    dinner_table_conversation_starters: List[str]
    created_at: datetime

class AISettingsUpdate(BaseModel):
    hint_strictness: Optional[str] = "socratic" # socratic | direct_after_3 | worked_examples
    tone: Optional[str] = "encouraging"
    quiet_hours_start: Optional[str] = "21:00"
    quiet_hours_end: Optional[str] = "07:00"
    daily_time_limit_mins: Optional[int] = 30
    allowed_subjects: Optional[List[str]] = None
