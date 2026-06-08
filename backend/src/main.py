"""
FastAPI Unified Application - PHASE 6 Migration

Remplace Flask par FastAPI pour:
- Meilleure performance (async/await)
- Type safety (Pydantic)
- Auto OpenAPI docs
- Simpler architecture

Structure:
- Models: SQLAlchemy ORM (shared with Flask)
- Services: Business logic
- Routes: FastAPI routers
- Middleware: CORS, logging, error handling
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from dotenv import load_dotenv
from typing import Optional

# Load environment
load_dotenv()

# Import config
from src.config import get_config

# Import database
from src.auth.models import db

# Import services
from src.services.scheduler import SchedulerService
from src.services.chatbot import init_chatbot
from src.integrations.sentry import init_sentry
from src.integrations.prometheus import init_prometheus
from src.services.cache_service import init_cache

# Import routes (to be migrated gradually)
# Auth routes (will create FastAPI versions)
# from src.routes.auth_fastapi import auth_router
# from src.routes.annonces_fastapi import annonces_router
# etc.

logger = logging.getLogger(__name__)

# ===== LIFESPAN EVENTS =====

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage app startup and shutdown events
    """
    # STARTUP
    logger.info("🚀 Starting FastAPI unified application...")

    # Initialize services
    try:
        init_cache()
        logger.info("✅ Cache initialized")
    except Exception as e:
        logger.warning(f"⚠️  Cache init failed: {e}")

    try:
        init_chatbot()
        logger.info("✅ Chatbot initialized")
    except Exception as e:
        logger.warning(f"⚠️  Chatbot init failed: {e}")

    try:
        scheduler = SchedulerService()
        scheduler.start()
        logger.info("✅ Scheduler started")
    except Exception as e:
        logger.warning(f"⚠️  Scheduler init failed: {e}")

    # Initialize monitoring
    try:
        init_sentry()
        logger.info("✅ Sentry initialized")
    except Exception as e:
        logger.warning(f"⚠️  Sentry init failed: {e}")

    try:
        init_prometheus()
        logger.info("✅ Prometheus initialized")
    except Exception as e:
        logger.warning(f"⚠️  Prometheus init failed: {e}")

    yield

    # SHUTDOWN
    logger.info("🛑 Shutting down FastAPI application...")


# ===== CREATE APP =====

def create_app(config_name: str = None) -> FastAPI:
    """Create and configure FastAPI application"""

    # Get config
    config = get_config(config_name or os.getenv('FLASK_ENV', 'development'))

    # Create app
    app = FastAPI(
        title="Immo2000 API",
        description="Real estate platform API - Unified FastAPI",
        version="6.0.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json"
    )

    # ===== MIDDLEWARE =====

    # CORS
    cors_origins = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Logging middleware
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Log all requests"""
        import time
        start_time = time.time()

        try:
            response = await call_next(request)
        except Exception as e:
            logger.error(f"❌ Request error: {e}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )

        process_time = time.time() - start_time
        logger.info(
            f"📨 {request.method} {request.url.path} - "
            f"{response.status_code} ({process_time:.2f}s)"
        )

        return response

    # ===== ERROR HANDLERS =====

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle validation errors"""
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": exc.errors(),
                "body": exc.body
            }
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle general exceptions"""
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"}
        )

    # ===== HEALTH CHECK =====

    @app.get("/api/v1/health")
    async def health():
        """Health check endpoint"""
        return {
            "status": "ok",
            "service": "immo2000-api",
            "version": "6.0.0"
        }

# ===== ROUTES (MIGRATED) =====

    # Import and include newly migrated FastAPI routers
    try:
        from src.routers.auth import router as auth_router
        app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
        logger.info("✅ Auth router included (migrated from Flask)")
    except Exception as e:
        logger.warning(f"⚠️  Failed to include auth router: {e}")

    try:
        from src.routers.listings import router as listings_router
        app.include_router(listings_router, prefix="/api/v1", tags=["listings"])
        logger.info("✅ Listings router included (migrated from Flask)")
    except Exception as e:
        logger.warning(f"⚠️  Failed to include listings router: {e}")

    # Include existing FastAPI routes (offres, notaires, transactions)
    try:
        from src.routes.offres import offres_router
        app.include_router(offres_router, prefix="/api/v1", tags=["offres"])
        logger.info("✅ Offres router included")
    except Exception as e:
        logger.warning(f"⚠️  Failed to include offres router: {e}")

    try:
        from src.routes.notaires import notaires_router
        app.include_router(notaires_router, prefix="/api/v1", tags=["notaires"])
        logger.info("✅ Notaires router included")
    except Exception as e:
        logger.warning(f"⚠️  Failed to include notaires router: {e}")

    try:
        from src.routes.transactions import transactions_router
        app.include_router(transactions_router, prefix="/api/v1", tags=["transactions"])
        logger.info("✅ Transactions router included")
    except Exception as e:
        logger.warning(f"⚠️  Failed to include transactions router: {e}")

    logger.info("✅ FastAPI application created successfully")

    return app


# ===== CREATE INSTANCE =====

app = create_app()


if __name__ == "__main__":
    import uvicorn

    config = get_config()
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=config.DEBUG,
        log_level="info"
    )
