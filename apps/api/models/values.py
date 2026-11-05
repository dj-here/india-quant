import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import relationship
from apps.api.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ValueModule(Base):
    __tablename__ = "value_modules"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(50), unique=True, nullable=False, index=True) # gratitude | kindness | honesty | empathy | responsibility | respect | perseverance | courage | sharing | environment | digital_citizenship | anger_peer_pressure
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    garden_plant_type = Column(String(50), default="sunflower")  # Type of flower/tree this module sprouts in Character Garden
    color_theme = Column(String(50), default="#4CAF50")
    display_order = Column(Integer, default=1)
    
    stories = relationship("Story", back_populates="module", cascade="all, delete-orphan")
    dilemmas = relationship("Dilemma", back_populates="module", cascade="all, delete-orphan")
    mission_templates = relationship("MissionTemplate", back_populates="module", cascade="all, delete-orphan")

class Story(Base):
    __tablename__ = "stories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    module_id = Column(String(36), ForeignKey("value_modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    age_band = Column(String(20), nullable=False)        # 6-8 | 9-12 | 13-16
    language = Column(String(10), default="en")          # en | hi | te
    cultural_context = Column(String(100), default="universal") # indian | universal | panchatantra | folk
    body_markdown = Column(Text, nullable=False)
    reflection_prompts = Column(JSON, default=list)      # Socratic reflection questions
    review_status = Column(String(50), default="APPROVED") # DRAFT | NEEDS_REVIEW | APPROVED
    
    module = relationship("ValueModule", back_populates="stories")

class Dilemma(Base):
    __tablename__ = "dilemmas"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    module_id = Column(String(36), ForeignKey("value_modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    age_band = Column(String(20), nullable=False)
    scenario_text = Column(Text, nullable=False)
    perspective_questions = Column(JSON, default=list)   # Open questions exploring different viewpoints without moralizing
    real_world_connection = Column(Text, nullable=True)  # "How would you feel if someone did this to your friend?"
    
    module = relationship("ValueModule", back_populates="dilemmas")

class MissionTemplate(Base):
    __tablename__ = "mission_templates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    module_id = Column(String(36), ForeignKey("value_modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    age_band = Column(String(20), nullable=False)
    language = Column(String(10), default="en")
    instructions = Column(Text, nullable=False)          # Action involving REAL people in the child's life
    target_person_type = Column(String(50), default="FAMILY") # FAMILY | SIBLING | CLASSMATE | NEIGHBOR | PET | NATURE
    xp_reward = Column(Integer, default=50)
    
    module = relationship("ValueModule", back_populates="mission_templates")
    missions = relationship("Mission", back_populates="template", cascade="all, delete-orphan")

class Mission(Base):
    __tablename__ = "missions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    child_id = Column(String(36), ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(String(36), ForeignKey("mission_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="ASSIGNED")      # ASSIGNED | COMPLETED | SKIPPED
    assigned_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    child = relationship("ChildProfile", back_populates="missions")
    template = relationship("MissionTemplate", back_populates="missions")
    reflection = relationship("MissionReflection", back_populates="mission", uselist=False, cascade="all, delete-orphan")

class MissionReflection(Base):
    __tablename__ = "mission_reflections"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    mission_id = Column(String(36), ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(String(36), ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    reflection_text = Column(Text, nullable=True)
    audio_url = Column(String(255), nullable=True)
    drawing_data = Column(Text, nullable=True)           # Data URI or path to sketch
    tutor_feedback = Column(Text, nullable=True)         # Warm acknowledgment of effort from Ollie
    parent_conversation_starter = Column(Text, nullable=True) # Dinner table starter for parent digest
    created_at = Column(DateTime, default=datetime.utcnow)
    
    mission = relationship("Mission", back_populates="reflection")

class CharacterGardenItem(Base):
    __tablename__ = "character_garden_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    child_id = Column(String(36), ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    module_key = Column(String(50), nullable=False)      # e.g. gratitude
    plant_type = Column(String(50), nullable=False)      # sunflower | lotus | jasmine | banyan | rose
    growth_stage = Column(Integer, default=1)            # 1: Sprout, 2: Bud, 3: Full Bloom
    position_x = Column(Integer, default=0)              # Grid coordinates in Garden UI
    position_y = Column(Integer, default=0)
    earned_via_action = Column(String(255), nullable=True)
    planted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    child = relationship("ChildProfile", back_populates="garden_items")

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    child_id = Column(String(36), ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_key = Column(String(50), nullable=False)       # KINDNESS_SPARK | PERSISTENCE_STAR | MATH_EXPLORER
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(50), default="award")
    earned_at = Column(DateTime, default=datetime.utcnow)
    
    child = relationship("ChildProfile", back_populates="badges")

class Streak(Base):
    __tablename__ = "streaks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    child_id = Column(String(36), ForeignKey("child_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    current_streak_days = Column(Integer, default=0)
    longest_streak_days = Column(Integer, default=0)
    streak_freezes_available = Column(Integer, default=2)
    last_active_date = Column(DateTime, default=datetime.utcnow)
    
    child = relationship("ChildProfile", back_populates="streaks")
