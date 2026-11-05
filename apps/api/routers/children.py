from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from apps.api.database import get_db
from apps.api.models.user import User, ChildProfile, AuditLog
from apps.api.models.memory import ChildMemory
from apps.api.models.values import Streak, CharacterGardenItem
from apps.api.schemas.child import (
    ChildProfileCreate,
    ChildProfileUpdate,
    ChildProfileResponse,
    ChildMemoryItem
)
from apps.api.services.auth_service import get_current_parent, get_password_hash

router = APIRouter(prefix="/api/v1/children", tags=["Child Profiles & Memory"])

@router.post("", response_model=ChildProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_child(
    req: ChildProfileCreate,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    child = ChildProfile(
        parent_id=parent.id,
        nickname=req.nickname,
        age_band=req.age_band,
        grade=req.grade,
        board=req.board,
        language=req.language,
        interests=req.interests,
        avatar_id=req.avatar_id,
        hashed_pin=get_password_hash(req.pin),
        daily_time_limit_mins=req.daily_time_limit_mins,
        ai_settings=req.ai_settings or {
            "hint_strictness": "socratic",
            "tone": "encouraging",
            "quiet_hours_start": "21:00",
            "quiet_hours_end": "07:00"
        }
    )
    db.add(child)
    await db.flush()
    
    # Initialize basic streak
    streak = Streak(child_id=child.id, current_streak_days=1, longest_streak_days=1)
    db.add(streak)
    
    # Initialize initial sprout in Character Garden
    sprout = CharacterGardenItem(
        child_id=child.id,
        module_key="gratitude",
        plant_type="sunflower",
        growth_stage=1,
        position_x=2,
        position_y=2,
        earned_via_action="Welcome Sprout! Started your learning journey."
    )
    db.add(sprout)
    
    # Audit log
    audit = AuditLog(
        user_id=parent.id,
        action="CHILD_PROFILE_CREATED",
        entity_type="CHILD",
        entity_id=child.id,
        details={"nickname": child.nickname, "age_band": child.age_band}
    )
    db.add(audit)
    await db.commit()
    return child

@router.get("", response_model=List[ChildProfileResponse])
async def list_children(
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).where(ChildProfile.parent_id == parent.id))
    return result.scalars().all()

@router.get("/{child_id}", response_model=ChildProfileResponse)
async def get_child(
    child_id: str,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).where(ChildProfile.id == child_id, ChildProfile.parent_id == parent.id))
    child = result.scalars().first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")
    return child

@router.put("/{child_id}", response_model=ChildProfileResponse)
async def update_child(
    child_id: str,
    req: ChildProfileUpdate,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).where(ChildProfile.id == child_id, ChildProfile.parent_id == parent.id))
    child = result.scalars().first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")
    
    if req.nickname is not None:
        child.nickname = req.nickname
    if req.age_band is not None:
        child.age_band = req.age_band
    if req.grade is not None:
        child.grade = req.grade
    if req.board is not None:
        child.board = req.board
    if req.language is not None:
        child.language = req.language
    if req.interests is not None:
        child.interests = req.interests
    if req.avatar_id is not None:
        child.avatar_id = req.avatar_id
    if req.pin is not None:
        child.hashed_pin = get_password_hash(req.pin)
    if req.daily_time_limit_mins is not None:
        child.daily_time_limit_mins = req.daily_time_limit_mins
    if req.ai_settings is not None:
        child.ai_settings = req.ai_settings
        
    await db.commit()
    return child

@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_child(
    child_id: str,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildProfile).where(ChildProfile.id == child_id, ChildProfile.parent_id == parent.id))
    child = result.scalars().first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")
    
    # Audit trail for India DPDP Act 2023 compliance
    audit = AuditLog(
        user_id=parent.id,
        action="CHILD_PROFILE_PERMANENTLY_DELETED",
        entity_type="CHILD",
        entity_id=child_id,
        details={"deleted_nickname": child.nickname}
    )
    db.add(audit)
    await db.delete(child)
    await db.commit()
    return None

@router.get("/{child_id}/memories", response_model=List[ChildMemoryItem])
async def get_child_memories(
    child_id: str,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ChildMemory)
        .where(ChildMemory.child_id == child_id, ChildMemory.is_active == True)
        .order_by(ChildMemory.created_at.desc())
    )
    return result.scalars().all()

@router.delete("/{child_id}/memories/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_child_memory(
    child_id: str,
    memory_id: str,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ChildMemory).where(ChildMemory.id == memory_id, ChildMemory.child_id == child_id)
    )
    memory = result.scalars().first()
    if not memory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory item not found")
    
    await db.delete(memory)
    await db.commit()
    return None

@router.delete("/{child_id}/memories", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_memories(
    child_id: str,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ChildMemory).where(ChildMemory.child_id == child_id))
    for mem in result.scalars().all():
        await db.delete(mem)
    await db.commit()
    return None
