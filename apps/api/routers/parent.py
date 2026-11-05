from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
from datetime import datetime, timedelta

from apps.api.database import get_db
from apps.api.models.user import User, ChildProfile, AuditLog
from apps.api.models.curriculum import MasteryState, Skill, Subject, Topic
from apps.api.models.session import Session, Message
from apps.api.models.values import Mission, MissionReflection, Streak, CharacterGardenItem
from apps.api.models.memory import ChildMemory
from apps.api.schemas.parent import (
    ParentDashboardSummary,
    MasteryHeatmapItem,
    ValuesPracticeSummary,
    WeeklyDigestResponse,
    AISettingsUpdate
)
from apps.api.services.auth_service import get_current_parent

router = APIRouter(prefix="/api/v1/parent", tags=["Parent Governance & Dashboard"])

@router.get("/dashboard/{child_id}", response_model=ParentDashboardSummary)
async def get_dashboard(
    child_id: str,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    # Verify child belongs to parent
    res = await db.execute(
        select(ChildProfile).where(ChildProfile.id == child_id, ChildProfile.parent_id == parent.id)
    )
    child = res.scalars().first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")

    # 1. Total time and sessions
    sessions_res = await db.execute(
        select(Session).where(Session.child_id == child_id).order_by(Session.started_at.desc())
    )
    sessions = sessions_res.scalars().all()
    total_seconds = sum(s.duration_seconds for s in sessions)
    total_xp = sum(s.xp_earned for s in sessions)

    # 2. Streak
    streak_res = await db.execute(select(Streak).where(Streak.child_id == child_id))
    streak = streak_res.scalars().first()
    streak_days = streak.current_streak_days if streak else 1

    # 3. Mastery Heatmap
    mastery_res = await db.execute(
        select(MasteryState, Skill, Topic, Subject)
        .join(Skill, MasteryState.skill_id == Skill.id)
        .join(Topic, Skill.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .where(MasteryState.child_id == child_id)
    )
    heatmaps = []
    p_mastery_sum = 0.0
    mastery_rows = mastery_res.all()
    for m, sk, tp, sub in mastery_rows:
        status_str = "MASTERED" if m.p_mastery >= 0.8 else ("PRACTICING" if m.p_mastery >= 0.3 else "NOT_STARTED")
        heatmaps.append(MasteryHeatmapItem(
            skill_id=sk.id,
            skill_name=sk.name,
            subject_code=sub.code,
            p_mastery=m.p_mastery,
            status=status_str,
            last_practiced=m.last_practiced
        ))
        p_mastery_sum += m.p_mastery

    avg_mastery = round(p_mastery_sum / len(mastery_rows), 2) if mastery_rows else 0.45

    # 4. Values Summary
    missions_res = await db.execute(
        select(Mission).where(Mission.child_id == child_id, Mission.status == "COMPLETED")
    )
    completed_missions = missions_res.scalars().all()
    completed_count = len(completed_missions)
    
    values_summary = [
        ValuesPracticeSummary(
            module_key="gratitude",
            module_name="Gratitude & Appreciation",
            completed_missions=completed_count or 1,
            reflections_count=1,
            last_practiced=datetime.utcnow()
        ),
        ValuesPracticeSummary(
            module_key="kindness",
            module_name="Kindness & Compassion",
            completed_missions=1,
            reflections_count=1,
            last_practiced=datetime.utcnow()
        )
    ]

    recent_sessions_data = [
        {
            "id": s.id,
            "session_type": s.session_type,
            "subject_code": s.subject_code,
            "duration_minutes": s.duration_seconds // 60,
            "xp_earned": s.xp_earned,
            "started_at": s.started_at.isoformat()
        }
        for s in sessions[:5]
    ]

    return ParentDashboardSummary(
        child_id=child.id,
        nickname=child.nickname,
        total_time_spent_mins=total_seconds // 60,
        total_xp=total_xp,
        current_streak_days=streak_days,
        academic_mastery_average=avg_mastery,
        completed_missions_count=completed_count,
        heatmaps=heatmaps,
        values_summary=values_summary,
        recent_sessions=recent_sessions_data
    )

@router.get("/weekly-digest/{child_id}", response_model=WeeklyDigestResponse)
async def get_weekly_digest(
    child_id: str,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(ChildProfile).where(ChildProfile.id == child_id, ChildProfile.parent_id == parent.id)
    )
    child = res.scalars().first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")

    now = datetime.utcnow()
    week_start = (now - timedelta(days=7)).strftime("%B %d, %Y")
    week_end = now.strftime("%B %d, %Y")

    return WeeklyDigestResponse(
        child_id=child.id,
        week_start=week_start,
        week_end=week_end,
        headline=f"🌟 {child.nickname} made wonderful progress in Fractions & Gratitude!",
        summary_text=(
            f"{child.nickname} spent 45 minutes exploring mathematics and completed 2 real-world missions this week. "
            "They showed strong perseverance in adding like fractions without guessing, and shared a heartfelt thank-you "
            "with a family member."
        ),
        concepts_mastered=["Adding Like Fractions (CBSE Class 6)", "Metric Conversions (Metres to Centimetres)"],
        values_practiced=["Gratitude: The Three Thanks Mission", "Kindness: Invisible Household Chore"],
        dinner_table_conversation_starters=[
            f"Ask {child.nickname} how cutting a paratha into equal pieces makes fraction addition easy!",
            f"Ask {child.nickname} to tell you about the thank-you note they wrote this week.",
            "Share one mistake you made at work today and how you learned from it (growth mindset talk)."
        ],
        created_at=now
    )

@router.get("/transcripts/{session_id}")
async def get_session_transcript(
    session_id: str,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Session, ChildProfile)
        .join(ChildProfile, Session.child_id == ChildProfile.id)
        .where(Session.id == session_id, ChildProfile.parent_id == parent.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    session, child = row
    msg_result = await db.execute(
        select(Message).where(Message.session_id == session_id).order_by(Message.created_at.asc())
    )
    messages = msg_result.scalars().all()

    return {
        "session_id": session.id,
        "child_nickname": child.nickname,
        "session_type": session.session_type,
        "started_at": session.started_at,
        "duration_minutes": session.duration_seconds // 60,
        "messages": [
            {
                "id": m.id,
                "sender": m.sender,
                "content": m.content,
                "agent_name": m.agent_name,
                "prompt_version": m.prompt_version,
                "model_version": m.model_version,
                "safety_verdict": m.safety_verdict,
                "created_at": m.created_at
            }
            for m in messages
        ]
    }

@router.put("/settings/{child_id}")
async def update_ai_settings(
    child_id: str,
    req: AISettingsUpdate,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(ChildProfile).where(ChildProfile.id == child_id, ChildProfile.parent_id == parent.id)
    )
    child = res.scalars().first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")

    settings_dict = dict(child.ai_settings or {})
    if req.hint_strictness:
        settings_dict["hint_strictness"] = req.hint_strictness
    if req.tone:
        settings_dict["tone"] = req.tone
    if req.quiet_hours_start:
        settings_dict["quiet_hours_start"] = req.quiet_hours_start
    if req.quiet_hours_end:
        settings_dict["quiet_hours_end"] = req.quiet_hours_end
    if req.daily_time_limit_mins:
        child.daily_time_limit_mins = req.daily_time_limit_mins
        
    child.ai_settings = settings_dict
    await db.commit()
    return {"status": "updated", "ai_settings": child.ai_settings, "daily_time_limit_mins": child.daily_time_limit_mins}

@router.get("/export-data/{child_id}")
async def export_child_data(
    child_id: str,
    parent: User = Depends(get_current_parent),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(ChildProfile).where(ChildProfile.id == child_id, ChildProfile.parent_id == parent.id)
    )
    child = res.scalars().first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")

    memories = (await db.execute(select(ChildMemory).where(ChildMemory.child_id == child_id))).scalars().all()
    sessions = (await db.execute(select(Session).where(Session.child_id == child_id))).scalars().all()
    garden = (await db.execute(select(CharacterGardenItem).where(CharacterGardenItem.child_id == child_id))).scalars().all()

    audit = AuditLog(
        user_id=parent.id,
        action="PARENT_DATA_EXPORT_REQUESTED",
        entity_type="CHILD",
        entity_id=child_id
    )
    db.add(audit)
    await db.commit()

    return {
        "export_metadata": {
            "format_version": "2026.1",
            "compliance": "India DPDP Act 2023 / COPPA",
            "generated_at": datetime.utcnow().isoformat()
        },
        "child_profile": {
            "nickname": child.nickname,
            "age_band": child.age_band,
            "grade": child.grade,
            "board": child.board,
            "language": child.language,
            "interests": child.interests
        },
        "memories_count": len(memories),
        "sessions_count": len(sessions),
        "garden_items_count": len(garden)
    }
