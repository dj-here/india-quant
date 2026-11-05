from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
from datetime import datetime

from apps.api.database import get_db
from apps.api.models.user import User
from apps.api.models.session import SafetyEvent, ProblemReport
from apps.api.models.admin import PromptVersion, EvalRun, FeatureFlag, ContentReviewItem
from apps.api.schemas.admin import (
    PromptVersionCreate,
    PromptVersionResponse,
    FeatureFlagToggle,
    ContentReviewAction
)
from apps.api.services.auth_service import get_current_admin

router = APIRouter(prefix="/api/v1/admin", tags=["Admin & Safety Console"])

@router.get("/moderation/safety-events")
async def list_safety_events(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SafetyEvent).order_by(SafetyEvent.created_at.desc()).limit(50))
    return result.scalars().all()

@router.get("/moderation/problem-reports")
async def list_problem_reports(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ProblemReport).order_by(ProblemReport.created_at.desc()).limit(50))
    return result.scalars().all()

@router.get("/prompts", response_model=List[PromptVersionResponse])
async def list_prompts(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PromptVersion).order_by(PromptVersion.created_at.desc()))
    return result.scalars().all()

@router.post("/prompts", response_model=PromptVersionResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt_version(
    req: PromptVersionCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    pv = PromptVersion(
        agent_name=req.agent_name,
        version=req.version,
        model_id=req.model_id,
        system_prompt=req.system_prompt,
        parameters=req.parameters or {},
        changelog=req.changelog,
        created_by=admin.email,
        is_active=True
    )
    db.add(pv)
    await db.commit()
    await db.refresh(pv)
    return pv

@router.post("/prompts/{prompt_id}/rollback", response_model=PromptVersionResponse)
async def rollback_prompt(
    prompt_id: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PromptVersion).where(PromptVersion.id == prompt_id))
    pv = result.scalars().first()
    if not pv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt version not found")

    # Deactivate other versions of the same agent
    others = await db.execute(select(PromptVersion).where(PromptVersion.agent_name == pv.agent_name))
    for item in others.scalars().all():
        item.is_active = False

    pv.is_active = True
    await db.commit()
    await db.refresh(pv)
    return pv

@router.get("/evals")
async def get_eval_runs(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(EvalRun).order_by(EvalRun.created_at.desc()).limit(20))
    return result.scalars().all()

@router.post("/feature-flags/toggle")
async def toggle_feature_flag(
    req: FeatureFlagToggle,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == req.key))
    flag = result.scalars().first()
    if not flag:
        flag = FeatureFlag(key=req.key, is_enabled=req.is_enabled)
        db.add(flag)
    else:
        flag.is_enabled = req.is_enabled

    await db.commit()
    return {"key": flag.key, "is_enabled": flag.is_enabled, "status": "updated"}

@router.get("/content/review-queue")
async def list_content_review_items(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ContentReviewItem).where(ContentReviewItem.status == "PENDING_REVIEW").order_by(ContentReviewItem.created_at.desc())
    )
    return result.scalars().all()

@router.post("/content/review-action")
async def review_content_item(
    req: ContentReviewAction,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ContentReviewItem).where(ContentReviewItem.id == req.review_item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review item not found")

    item.status = "APPROVED" if req.action == "APPROVE" else "REJECTED"
    item.reviewed_by = admin.email
    item.reviewer_comments = req.reviewer_comments
    item.reviewed_at = datetime.utcnow()

    await db.commit()
    return {"status": item.status, "item_id": item.id}
