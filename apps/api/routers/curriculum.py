from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from apps.api.database import get_db
from apps.api.models.curriculum import Subject, Topic, Skill, Lesson, Activity, Attempt, MasteryState
from apps.api.models.user import ChildProfile
from apps.api.schemas.curriculum import (
    SubjectResponse,
    TopicResponse,
    SkillResponse,
    ActivityResponse,
    AttemptSubmission,
    AttemptResult
)
from apps.api.services.auth_service import get_current_child
from apps.api.services.sympy_service import SymPyService
from apps.api.services.mastery_service import MasteryService

router = APIRouter(prefix="/api/v1/curriculum", tags=["Curriculum & Mastery Engine"])

@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subject))
    return result.scalars().all()

@router.get("/subjects/{subject_code}/topics", response_model=List[TopicResponse])
async def get_topics(subject_code: str, grade: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(Topic).join(Subject).where(Subject.code == subject_code.upper())
    if grade:
        query = query.where(Topic.grade == grade)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/topics/{topic_id}/skills", response_model=List[SkillResponse])
async def get_skills(topic_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Skill).where(Skill.topic_id == topic_id))
    return result.scalars().all()

@router.get("/skills/{skill_id}/activities", response_model=List[ActivityResponse])
async def get_activities(skill_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Activity).join(Lesson).where(Lesson.skill_id == skill_id))
    return result.scalars().all()

@router.post("/activities/attempt", response_model=AttemptResult)
async def submit_attempt(
    req: AttemptSubmission,
    child: ChildProfile = Depends(get_current_child),
    db: AsyncSession = Depends(get_db)
):
    # Load activity
    result = await db.execute(select(Activity).where(Activity.id == req.activity_id))
    activity = result.scalars().first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    # 1. Deterministic Math & Science Verification via SymPy
    expected_solution = activity.solution_expression or ""
    verification = SymPyService.verify_equivalence(req.submitted_answer, expected_solution)
    is_correct = verification["is_correct"]

    # 2. Retrieve or initialize MasteryState for this child and skill
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == activity.lesson_id))
    lesson = lesson_result.scalars().first()
    
    mastery_result = await db.execute(
        select(MasteryState).where(
            MasteryState.child_id == child.id,
            MasteryState.skill_id == lesson.skill_id
        )
    )
    mastery = mastery_result.scalars().first()
    if not mastery:
        mastery = MasteryState(
            child_id=child.id,
            skill_id=lesson.skill_id,
            p_mastery=0.1
        )
        db.add(mastery)
        await db.flush()

    # 3. Update BKT Mastery & Spaced Repetition
    updated_p = MasteryService.update_bkt(
        p_mastery_prior=mastery.p_mastery,
        is_correct=is_correct,
        p_transit=mastery.p_transit,
        p_guess=mastery.p_guess,
        p_slip=mastery.p_slip
    )
    mastery.p_mastery = updated_p

    review_schedule = MasteryService.calculate_next_review(
        consecutive_correct=mastery.consecutive_correct,
        is_correct=is_correct,
        current_interval_days=mastery.review_interval_days
    )
    mastery.consecutive_correct = review_schedule["consecutive_correct"]
    mastery.review_interval_days = review_schedule["interval_days"]
    mastery.next_review_due = review_schedule["next_review_due"]
    mastery.last_practiced = review_schedule["next_review_due"]

    # 4. Compute Effort XP
    xp_awarded = MasteryService.calculate_effort_xp(
        is_correct=is_correct,
        hints_used=req.hints_used,
        time_taken_seconds=req.time_taken_seconds
    )

    # 5. Persist Attempt
    attempt = Attempt(
        activity_id=activity.id,
        child_id=child.id,
        session_id="stand-alone-activity",
        submitted_answer=req.submitted_answer,
        is_correct=is_correct,
        sympy_verified=True,
        hints_used=req.hints_used,
        time_taken_seconds=req.time_taken_seconds
    )
    db.add(attempt)
    await db.commit()

    # Feedback message
    if is_correct:
        feedback = "Brilliant effort! Your reasoning matches the exact mathematical solution! 🌟"
        next_hint = None
    else:
        feedback = "Good attempt! Let's examine how the pieces connect."
        hint_index = min(req.hints_used, len(activity.hint_ladder) - 1)
        next_hint = activity.hint_ladder[hint_index] if activity.hint_ladder else "Try breaking it into simpler steps."

    return AttemptResult(
        attempt_id=attempt.id,
        is_correct=is_correct,
        sympy_verified=True,
        feedback=feedback,
        misconception=None,
        next_hint=next_hint,
        p_mastery=updated_p,
        xp_awarded=xp_awarded
    )
