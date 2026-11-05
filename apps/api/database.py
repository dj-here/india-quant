from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from apps.api.config import settings

DATABASE_URL = settings.DATABASE_URL

# For SQLite, ensure check_same_thread is False
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    # Import all models to register with Base
    import apps.api.models.user
    import apps.api.models.curriculum
    import apps.api.models.session
    import apps.api.models.values
    import apps.api.models.memory
    import apps.api.models.admin
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
