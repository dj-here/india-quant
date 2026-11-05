from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime

from apps.api.database import get_db
from apps.api.models.values import (
    ValueModule,
    Story,
    Dilemma,
    MissionTemplate,
    Mission,
    MissionReflection,
    CharacterGardenItem,
    Streak
)
from apps.api.models.user import ChildProfile
from apps.api.schemas.values import (
    ValueModuleResponse,
    StoryResponse,
    DilemmaResponse,
    MissionTemplateResponse,
    MissionResponse,
    ReflectionSubmit,
    CharacterGardenItemResponse
)
from apps.api.services.auth_service import get_current_child

router = APIRouter(prefix="/api/v1/values", tags=["Life Values & Character Garden"])

@router.get("/modules", response_model=List[ValueModuleResponse])
async def list_modules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ValueModule).order_by(ValueModule.display_order.asc()))
    return result.scalars().all()

@router.get("/modules/{key}/stories", response_model=List[StoryResponse])
async def get_stories(key: str, language: Optional[str] = "en", db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Story)
        .join(ValueModule)
        .where(ValueModule.key == key, Story.language == language)
    )
    return result.scalars().all()

@router.get("/modules/{key}/dilemmas", response_model=List[DilemmaResponse])
async def get_dilemmas(key: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dilemma).join(ValueModule).where(ValueModule.key == key))
    return result.scalars().all()

@router.post("/missions/assign", response_model=MissionResponse, status_code=status.HTTP_201_CREATED)
async def assign_mission(
    module_key: str,
    child: ChildProfile = Depends(get_current_child),
    db: AsyncSession = Depends(get_db)
):
    # Find module
    mod_result = await db.execute(select(ValueModule).where(ValueModule.key == module_key))
    module = mod_result.scalars().first()
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    # Find unassigned mission template
    templates_result = await db.execute(
        select(MissionTemplate).where(MissionTemplate.module_id == module.id)
    )
    templates = templates_result.scalars().all()
    if not templates:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No mission templates available")

    chosen_template = templates[0]
    mission = Mission(
        child_id=child.id,
        template_id=chosen_template.id,
        status="ASSIGNED"
    )
    db.add(mission)
    await db.commit()
    await db.refresh(mission)

    return MissionResponse(
        id=mission.id,
        module_key=module.key,
        title=chosen_template.title,
        description=chosen_template.instructions,
        status=mission.status,
        assigned_at=mission.assigned_at
    )

@router.post("/missions/{mission_id}/reflect")
async def submit_reflection(
    mission_id: str,
    req: ReflectionSubmit,
    child: ChildProfile = Depends(get_current_child),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Mission).where(Mission.id == mission_id, Mission.child_id == child.id)
    )
    mission = result.scalars().first()
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")

    mission.status = "COMPLETED"
    mission.completed_at = datetime.utcnow()

    # Load template and module
    tmpl_result = await db.execute(select(MissionTemplate).where(MissionTemplate.id == mission.template_id))
    template = tmpl_result.scalars().first()
    mod_result = await db.execute(select(ValueModule).where(ValueModule.id == template.module_id))
    module = mod_result.scalars().first()

    # Create reflection record
    tutor_feedback = (
        f"You did something truly thoughtful, {child.nickname}! Acting with real care for people around you "
        "is what makes our world kinder. Your effort just helped a new blossom sprout in your Character Garden!"
    )
    parent_starter = (
        f"Ask {child.nickname} about the {module.name} mission they completed today: '{template.title}'. "
        "A great dinner table question is: 'Who was someone you surprised with kindness today?'"
    )

    reflection = MissionReflection(
        mission_id=mission.id,
        child_id=child.id,
        reflection_text=req.reflection_text,
        drawing_data=req.drawing_data,
        tutor_feedback=tutor_feedback,
        parent_conversation_starter=parent_starter
    )
    db.add(reflection)

    # Grow Character Garden Item
    garden_item = CharacterGardenItem(
        child_id=child.id,
        module_key=module.key,
        plant_type=module.garden_plant_type,
        growth_stage=3, # Full Bloom!
        position_x=len(template.title) % 5,
        position_y=(len(template.instructions) // 10) % 5,
        earned_via_action=f"Completed Mission: {template.title}"
    )
    db.add(garden_item)

    # Update streak
    streak_res = await db.execute(select(Streak).where(Streak.child_id == child.id))
    streak = streak_res.scalars().first()
    if streak:
        streak.current_streak_days += 1
        streak.longest_streak_days = max(streak.longest_streak_days, streak.current_streak_days)
        streak.last_active_date = datetime.utcnow()

    await db.commit()

    return {
        "status": "completed",
        "xp_awarded": template.xp_reward,
        "tutor_feedback": tutor_feedback,
        "plant_grown": module.garden_plant_type,
        "garden_stage": 3
    }

@router.get("/garden", response_model=List[CharacterGardenItemResponse])
async def get_garden(
    child: ChildProfile = Depends(get_current_child),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CharacterGardenItem).where(CharacterGardenItem.child_id == child.id)
    )
    return result.scalars().all()
