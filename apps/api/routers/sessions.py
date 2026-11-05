from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from typing import List

from apps.api.database import get_db
from apps.api.models.session import Session, Message, ProblemReport
from apps.api.models.user import ChildProfile
from apps.api.schemas.session import (
    SessionStartRequest,
    SessionResponse,
    SessionDetailResponse,
    MessageSchema,
    TurnRequest,
    TurnResponse,
    ProblemReportRequest
)
from apps.api.services.auth_service import get_current_child
from apps.api.services.orchestrator import MultiAgentOrchestrator

router = APIRouter(prefix="/api/v1/sessions", tags=["Tutoring Sessions & Chat"])

@router.post("/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    req: SessionStartRequest,
    child: ChildProfile = Depends(get_current_child),
    db: AsyncSession = Depends(get_db)
):
    session = Session(
        child_id=child.id,
        session_type=req.session_type,
        subject_code=req.subject_code,
        current_skill_id=req.skill_id,
        status="ACTIVE"
    )
    db.add(session)
    await db.flush()

    # Initial Ollie the Owl Greeting
    greetings = {
        "ACADEMIC": f"Hi {child.nickname}! I'm Ollie, your AI learning helper. 🦉 Ready to explore some fun {req.subject_code or 'Math'} problems together? Let me know what you'd like to work on!",
        "VALUES": f"Welcome back, {child.nickname}! I'm Ollie, your AI helper. Today we get to explore a thoughtful story and discover a mission you can practice in the real world with your family or friends!",
        "DIAGNOSTIC": f"Hello {child.nickname}! I'm Ollie, an AI tutor. We're going to try a few fun puzzles together to find out what you already know best. There are no grades or scores to worry about—just do your best!"
    }
    welcome_text = greetings.get(req.session_type, f"Hi {child.nickname}! I'm Ollie the Owl, your AI tutor. What shall we learn today?")

    welcome_msg = Message(
        session_id=session.id,
        sender="TUTOR",
        content=welcome_text,
        agent_name="TutorAgent",
        prompt_version="v1.0.0",
        model_version="kidsmentor-core",
        safety_verdict={"is_safe": True}
    )
    db.add(welcome_msg)
    await db.commit()
    await db.refresh(session)
    return session

@router.post("/{session_id}/turn", response_model=TurnResponse)
async def session_turn(
    session_id: str,
    req: TurnRequest,
    child: ChildProfile = Depends(get_current_child),
    db: AsyncSession = Depends(get_db)
):
    orchestrator = MultiAgentOrchestrator(db)
    result = await orchestrator.handle_turn(
        session_id=session_id,
        child=child,
        user_message=req.message,
        image_base64=req.image_base64
    )
    return TurnResponse(
        session_id=session_id,
        message_id=result.get("message_id", "msg-fallback"),
        reply=result["reply"],
        agent_name=result.get("agent_name", "TutorAgent"),
        safety_verdict=result.get("safety_verdict", {}),
        tools_called=result.get("tools_called", []),
        is_session_ended=result.get("is_session_ended", False),
        xp_earned=result.get("xp_earned", 0)
    )

@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: str,
    child: ChildProfile = Depends(get_current_child),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.child_id == child.id)
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    # Explicitly load messages
    msg_result = await db.execute(
        select(Message).where(Message.session_id == session_id).order_by(Message.created_at.asc())
    )
    msgs = [MessageSchema.model_validate(m) for m in msg_result.scalars().all()]
    
    return SessionDetailResponse(
        id=session.id,
        child_id=session.child_id,
        session_type=session.session_type,
        subject_code=session.subject_code,
        current_skill_id=session.current_skill_id,
        status=session.status,
        started_at=session.started_at,
        xp_earned=session.xp_earned,
        turn_count=session.turn_count,
        messages=msgs
    )

@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str,
    child: ChildProfile = Depends(get_current_child),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.child_id == child.id)
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    session.status = "COMPLETED"
    session.ended_at = datetime.utcnow()
    duration = int((session.ended_at - session.started_at).total_seconds())
    session.duration_seconds = duration
    
    # Session completion XP bonus
    completion_bonus = 25
    session.xp_earned += completion_bonus

    # Friendly closing message from Ollie
    goodbye_msg = Message(
        session_id=session.id,
        sender="TUTOR",
        content=(
            f"You did fantastic thinking today, {child.nickname}! 🌟 We practiced together for {duration // 60} minutes. "
            "Now make sure to give your eyes a rest, drink some water, and go share something fun with your family or friends!"
        ),
        agent_name="TutorAgent",
        prompt_version="v1.0.0",
        safety_verdict={"is_safe": True}
    )
    db.add(goodbye_msg)
    await db.commit()
    await db.refresh(session)
    return session

@router.post("/report-problem", status_code=status.HTTP_201_CREATED)
async def report_problem(
    req: ProblemReportRequest,
    child: ChildProfile = Depends(get_current_child),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Message).where(Message.id == req.message_id))
    msg = result.scalars().first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    
    report = ProblemReport(
        session_id=msg.session_id,
        message_id=msg.id,
        reported_by="CHILD",
        reason=req.reason,
        details=req.details
    )
    db.add(report)
    await db.commit()
    return {"status": "reported", "message": "Thank you! Our safety and education team will review this message."}
