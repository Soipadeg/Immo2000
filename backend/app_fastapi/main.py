"""
Point d'entrée FastAPI pour Immo2000 API.

Application FastAPI pour les endpoints /api/v1/*.
Cohabite avec Flask (frontend React sur port 3001).

Commande de démarrage:
    uvicorn backend.app_fastapi.main:app --reload --port 8001
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app_fastapi.config import settings
from app_fastapi.routes import health, offres, transactions, notaires, paiements, documents
from app_fastapi.utils.startup import init_external_services, shutdown_external_services

# Configuration du logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


# === Lifespan Events ===
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gère le démarrage et l'arrêt de l'application."""
    # Au démarrage
    logger.info(f"🚀 Démarrage de {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"   📊 Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'local'}")
    logger.info(f"   🔐 Auth: {settings.ALGORITHM} tokens ({settings.ACCESS_TOKEN_EXPIRE_MINUTES}min)")
    logger.info(f"   🌐 CORS origins: {len(settings.ALLOWED_ORIGINS)} origins")

    # Initialiser les services externes
    await init_external_services()

    yield

    # À l'arrêt
    await shutdown_external_services()
    logger.info("🛑 Arrêt de l'application")


# === Création de l'app ===
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/api/v1/docs",           # Swagger UI
    redoc_url="/api/v1/redoc",         # ReDoc
    openapi_url="/api/v1/openapi.json", # OpenAPI schema
    lifespan=lifespan,
)


# === Middlewares ===

# 1. CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Trusted Hosts (sécurité)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.immo2000.fr"],
)


# === Exception Handlers ===

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Gérer les erreurs de validation Pydantic."""
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "error": "VALIDATION_ERROR",
            "message": "Erreur de validation des données",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Gérer les exceptions génériques."""
    logger.error(f"Exception non gérée: {str(exc)}", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error": "INTERNAL_SERVER_ERROR",
            "message": "Une erreur interne s'est produite",
        }
    )


# === Routes ===

# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    """Vérifier la santé de l'API."""
    return {
        "status": "✅ OK",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG,
    }


# Routes des endpoints
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(offres.router, prefix="/api/v1/offres", tags=["Offres"])
app.include_router(transactions.router, prefix="/api/v1/transactions", tags=["Transactions"])
app.include_router(notaires.router, prefix="/api/v1/notaires", tags=["Notaires"])
app.include_router(paiements.router, prefix="/api/v1/paiements", tags=["Paiements"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])


# === Logging des routes ===
@app.on_event("startup")
async def startup_event():
    """Afficher les routes disponibles au démarrage."""
    routes_count = len([route for route in app.routes])
    logger.info(f"✅ FastAPI démarrée avec {routes_count} routes")
    logger.info(f"   📚 Swagger UI: http://localhost:{settings.FASTAPI_PORT}/api/v1/docs")
    logger.info(f"   📚 ReDoc: http://localhost:{settings.FASTAPI_PORT}/api/v1/redoc")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app_fastapi.main:app",
        host=settings.FASTAPI_HOST,
        port=settings.FASTAPI_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
