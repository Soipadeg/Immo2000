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

# ===== ROUTES (MIGRATED FROM FLASK) =====

    # Core Auth & Listings (Phase 1)
    try:
        from src.routers.auth import router as auth_router
        app.include_router(auth_router, prefix="/api/v1")
        logger.info("✅ Auth router included")
    except Exception as e:
        logger.warning(f"⚠️  Auth router failed: {e}")

    try:
        from src.routers.listings import router as listings_router
        app.include_router(listings_router, prefix="/api/v1")
        logger.info("✅ Listings router included")
    except Exception as e:
        logger.warning(f"⚠️  Listings router failed: {e}")

    # Phase 2a: Core Features
    try:
        from src.routers.favorites import router as favorites_router
        app.include_router(favorites_router, prefix="/api/v1")
        logger.info("✅ Favorites router included")
    except Exception as e:
        logger.warning(f"⚠️  Favorites router failed: {e}")

    try:
        from src.routers.notifications import router as notifications_router
        app.include_router(notifications_router, prefix="/api/v1")
        logger.info("✅ Notifications router included")
    except Exception as e:
        logger.warning(f"⚠️  Notifications router failed: {e}")

    try:
        from src.routers.appointments import router as appointments_router
        app.include_router(appointments_router, prefix="/api/v1")
        logger.info("✅ Appointments router included")
    except Exception as e:
        logger.warning(f"⚠️  Appointments router failed: {e}")

    try:
        from src.routers.messages import router as messages_router
        app.include_router(messages_router, prefix="/api/v1")
        logger.info("✅ Messages router included")
    except Exception as e:
        logger.warning(f"⚠️  Messages router failed: {e}")

    try:
        from src.routers.search import router as search_router
        app.include_router(search_router, prefix="/api/v1")
        logger.info("✅ Search router included")
    except Exception as e:
        logger.warning(f"⚠️  Search router failed: {e}")

    try:
        from src.routers.properties import router as properties_router
        app.include_router(properties_router, prefix="/api/v1")
        logger.info("✅ Properties router included")
    except Exception as e:
        logger.warning(f"⚠️  Properties router failed: {e}")
    
    # Phase 2b: Secondary Features
    try:
        from src.routers.admin import router as admin_router
        app.include_router(admin_router, prefix="/api/v1")
        logger.info("✅ Admin router included")
    except Exception as e:
        logger.warning(f"⚠️  Admin router failed: {e}")
    
    try:
        from src.routers.documents import router as documents_router
        app.include_router(documents_router, prefix="/api/v1")
        logger.info("✅ Documents router included")
    except Exception as e:
        logger.warning(f"⚠️  Documents router failed: {e}")
    
    try:
        from src.routers.contracts import router as contracts_router
        app.include_router(contracts_router, prefix="/api/v1")
        logger.info("✅ Contracts/Alerts/Matching router included")
    except Exception as e:
        logger.warning(f"⚠️  Contracts router failed: {e}")
    
    try:
        from src.routers.images import router as images_router
        app.include_router(images_router, prefix="/api/v1")
        logger.info("✅ Images/FAQ router included")
    except Exception as e:
        logger.warning(f"⚠️  Images router failed: {e}")
    
    try:
        from src.routers.loans import router as loans_router
        app.include_router(loans_router, prefix="/api/v1")
        logger.info("✅ Payments/Loans router included")
    except Exception as e:
        logger.warning(f"⚠️  Loans router failed: {e}")
    
    try:
        from src.routers.chatbot import router as chatbot_router
        app.include_router(chatbot_router, prefix="/api/v1")
        logger.info("✅ Chatbot/Analytics router included")
    except Exception as e:
        logger.warning(f"⚠️  Chatbot router failed: {e}")

    # Existing FastAPI routes (offres, notaires, transactions)
    try:
        from src.routes.offres import offres_router
        app.include_router(offres_router, prefix="/api/v1")
        logger.info("✅ Offres router included")
    except Exception as e:
        logger.warning(f"⚠️  Offres router failed: {e}")

    try:
        from src.routes.notaires import notaires_router
        app.include_router(notaires_router, prefix="/api/v1")
        logger.info("✅ Notaires router included")
    except Exception as e:
        logger.warning(f"⚠️  Notaires router failed: {e}")

    try:
        from src.routes.transactions import transactions_router
        app.include_router(transactions_router, prefix="/api/v1")
        logger.info("✅ Transactions router included")
    except Exception as e:
        logger.warning(f"⚠️  Transactions router failed: {e}")

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
