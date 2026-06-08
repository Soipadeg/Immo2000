"""
FastAPI Database Sessions - Async SQLAlchemy Integration

Phase 3: Async database operations pour meilleure performance
"""

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker
)
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
import os
import logging

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for all models"""
    pass


class DatabaseManager:
    """Manage async database connections and sessions"""

    def __init__(self):
        self.engine = None
        self.async_session = None

    async def init(self):
        """Initialize async database engine"""
        db_url = os.getenv('DATABASE_URL', 'postgresql://localhost/immo2000')

        # Convert postgresql:// to postgresql+asyncpg://
        if db_url.startswith('postgresql://'):
            db_url = db_url.replace('postgresql://', 'postgresql+asyncpg://', 1)

        logger.info(f"🗄️  Initializing async database: {db_url.split('@')[0] if '@' in db_url else 'custom'}")

        self.engine = create_async_engine(
            db_url,
            echo=os.getenv('SQL_ECHO', 'false').lower() == 'true',
            pool_size=20,
            max_overflow=0,
            pool_pre_ping=True,
            connect_args={
                "timeout": 10,
                "command_timeout": 10,
            }
        )

        self.async_session = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False
        )

        logger.info("✅ Async database initialized")

    async def close(self):
        """Close database connection"""
        if self.engine:
            await self.engine.dispose()
            logger.info("🔌 Database connection closed")

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get async database session"""
        if not self.async_session:
            raise RuntimeError("Database not initialized. Call init() first.")

        async with self.async_session() as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"❌ Database error: {e}")
                raise
            finally:
                await session.close()


# Global instance
db_manager = DatabaseManager()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI routes to get database session"""
    async with db_manager.async_session() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"❌ Database session error: {e}")
            raise
        finally:
            await session.close()
