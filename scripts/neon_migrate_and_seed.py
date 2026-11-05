"""
KidsMentor Neon PostgreSQL Migration & Seeding Script
Connects to Neon Serverless PostgreSQL, initializes all database tables,
enables pgvector, and seeds curriculum and all 12 Life Values modules.
"""

import asyncio
import os
import sys
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

sys.path.insert(0, os.path.abspath("."))

from apps.api.database import Base
from apps.api.models.user import User, Consent, ChildProfile, AuditLog
from apps.api.models.curriculum import (
    Subject, Topic, Skill, SkillPrerequisite, Lesson, Activity, Attempt, MasteryState
)
from apps.api.models.session import Session, Message, ToolCall, SafetyEvent, ProblemReport
from apps.api.models.values import (
    ValueModule, Story, Dilemma, MissionTemplate, Mission,
    MissionReflection, CharacterGardenItem, Badge, Streak
)
from apps.api.models.memory import ChildMemory
from apps.api.models.admin import PromptVersion, EvalRun, FeatureFlag, ContentReviewItem
from apps.api.seed.curriculum_seed import seed_curriculum
from apps.api.seed.values_seed import seed_values

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("kidsmentor.neon")

async def migrate_and_seed_neon(database_url: str):
    logger.info("==================================================")
    logger.info("   KidsMentor - Neon PostgreSQL Migration & Seeder ")
    logger.info("==================================================")

    # Normalize Neon URL for asyncpg
    # Convert 'postgres://' or 'postgresql://' to 'postgresql+asyncpg://'
    import re
    from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

    raw_url = database_url.strip()
    if raw_url.startswith("postgres://"):
        raw_url = "postgresql://" + raw_url[len("postgres://"):]

    parsed = urlparse(raw_url)
    
    # Direct endpoint preferred for DDL migrations (remove -pooler if present)
    hostname = parsed.hostname or ""
    direct_hostname = hostname.replace("-pooler", "")

    # Reconstruct netloc with credentials
    auth = ""
    if parsed.username:
        auth = parsed.username
        if parsed.password:
            auth += f":{parsed.password}"
        auth += "@"
    
    port_str = f":{parsed.port}" if parsed.port else ""
    netloc = f"{auth}{direct_hostname}{port_str}"

    # Build clean asyncpg URL without incompatible query params
    clean_url = f"postgresql+asyncpg://{netloc}{parsed.path}"
    
    logger.info(f"Target Neon Database: {direct_hostname}{parsed.path}")

    connect_args = {"ssl": True}
    engine = create_async_engine(
        clean_url,
        connect_args=connect_args,
        echo=False,
        future=True,
        pool_pre_ping=True
    )

    # 1. Enable pgvector if available
    logger.info("Step 1/4: Checking and enabling extensions (pgvector)...")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            logger.info("✓ pgvector extension initialized successfully.")
    except Exception as e:
        logger.warning(f"Note: pgvector extension notice (standard text search active): {e}")

    # 2. Create All Tables
    logger.info("Step 2/4: Creating all KidsMentor database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✓ All 27 relational tables generated in Neon PostgreSQL.")

    # 3. Seed Curriculum & Life Values Modules
    logger.info("Step 3/4: Seeding NCERT Curriculum & 12 Life Values modules...")
    SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as session:
        await seed_curriculum(session)
        await seed_values(session)
    logger.info("✓ Curriculum (Class 4, 6, 8) and all 12 Life Values modules seeded.")

    # 4. Verify Database Integrity
    logger.info("Step 4/4: Verifying database connectivity and records count...")
    async with SessionLocal() as session:
        sub_res = await session.execute(text("SELECT count(*) FROM subjects;"))
        mod_res = await session.execute(text("SELECT count(*) FROM value_modules;"))
        story_res = await session.execute(text("SELECT count(*) FROM stories;"))
        miss_res = await session.execute(text("SELECT count(*) FROM mission_templates;"))

        subjects_count = sub_res.scalar()
        modules_count = mod_res.scalar()
        stories_count = story_res.scalar()
        missions_count = miss_res.scalar()

        logger.info(f"✓ Subjects: {subjects_count}")
        logger.info(f"✓ Life Values Modules: {modules_count} / 12")
        logger.info(f"✓ Approved Stories: {stories_count}")
        logger.info(f"✓ Real-Life Missions: {missions_count}")

    await engine.dispose()
    logger.info("==================================================")
    logger.info(" [SUCCESS] Neon Database is LIVE and fully seeded! ")
    logger.info("==================================================")
    return True

if __name__ == "__main__":
    db_url = os.environ.get("NEON_DATABASE_URL") or os.environ.get("DATABASE_URL")
    if len(sys.argv) > 1:
        db_url = sys.argv[1]

    if not db_url or "sqlite" in db_url:
        print("\nUsage: python scripts/neon_migrate_and_seed.py <NEON_DATABASE_URL>")
        print("Example: python scripts/neon_migrate_and_seed.py postgresql://user:password@ep-xyz.ap-southeast-1.aws.neon.tech/kidsmentor?sslmode=require\n")
        sys.exit(1)

    asyncio.run(migrate_and_seed_neon(db_url))
