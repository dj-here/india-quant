from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ValueModuleResponse(BaseModel):
    id: str
    key: str
    name: str
    description: str
    garden_plant_type: str
    color_theme: str
    display_order: int

    class Config:
        from_attributes = True

class StoryResponse(BaseModel):
    id: str
    module_id: str
    title: str
    age_band: str
    language: str
    cultural_context: str
    body_markdown: str
    reflection_prompts: List[str]

    class Config:
        from_attributes = True

class DilemmaResponse(BaseModel):
    id: str
    module_id: str
    title: str
    age_band: str
    scenario_text: str
    perspective_questions: List[str]

    class Config:
        from_attributes = True

class MissionTemplateResponse(BaseModel):
    id: str
    module_id: str
    title: str
    age_band: str
    instructions: str
    target_person_type: str
    xp_reward: int

    class Config:
        from_attributes = True

class MissionResponse(BaseModel):
    id: str
    module_key: str
    title: str
    description: str
    status: str
    assigned_at: datetime
    completed_at: Optional[datetime] = None

class ReflectionSubmit(BaseModel):
    reflection_text: Optional[str] = None
    drawing_data: Optional[str] = None
    audio_base64: Optional[str] = None

class CharacterGardenItemResponse(BaseModel):
    id: str
    module_key: str
    plant_type: str
    growth_stage: int
    position_x: int
    position_y: int
    earned_via_action: Optional[str]

    class Config:
        from_attributes = True
