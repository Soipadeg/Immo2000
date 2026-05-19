"""
Routes pour les vérifications de santé (health checks) de l'API.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app_fastapi.config import settings

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check():
    """Vérifier la santé générale de l'API."""
    return {
        "status": "✅ OK",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": "development" if settings.DEBUG else "production",
    }
