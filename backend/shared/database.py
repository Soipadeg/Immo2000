"""
Configuration et session SQLAlchemy partagée entre Flask et FastAPI.

Ce module centralise la gestion de la base de données:
- Connexion PostgreSQL unique
- SessionLocal pour les dépendances
- get_db() pour FastAPI

Flask utilise: app.config['SQLALCHEMY_DATABASE_URI']
FastAPI utilise: DATABASE_URL depuis .env via settings
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import logging

from app_fastapi.config import settings

logger = logging.getLogger(__name__)


# ============================================================================
# Engine & Session Factory
# ============================================================================

# Création du moteur SQLAlchemy
engine = create_engine(
    settings.DATABASE_URL,
    # Pool de connexions pour gérer plusieurs connexions
    poolclass=QueuePool,
    pool_size=10,           # Nombre de connexions en pool
    max_overflow=20,        # Connexions supplémentaires si besoin
    pool_pre_ping=True,     # Vérifier la connexion avant utilisation
    pool_recycle=3600,      # Recycler les connexions après 1 heure
    echo=settings.DB_ECHO,  # Logs SQL si True
)

# Factory pour créer les sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ============================================================================
# Dépendance FastAPI
# ============================================================================

def get_db() -> Session:
    """
    Dépendance FastAPI pour injecter une session de base de données.

    Utilisation dans les routes:
        @router.get("/items")
        async def get_items(db: Session = Depends(get_db)):
            items = db.query(Item).all()
            return items
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# Event Listeners (optionnel)
# ============================================================================

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Exécuter du SQL personnalisé à la connexion (ex: PRAGMA pour SQLite)."""
    # Pour PostgreSQL, on peut ajouter des optimisations ici si nécessaire
    pass


# ============================================================================
# Fonctions utilitaires
# ============================================================================

def init_db():
    """
    Initialiser la base de données (créer les tables).

    À utiliser une seule fois au démarrage:
        from backend.shared.database import init_db
        init_db()
    """
    from src.models import Base  # Importer après l'engine
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Base de données initialisée")


def close_db():
    """Fermer toutes les connexions du pool."""
    engine.dispose()
    logger.info("✅ Connexions fermées")


if __name__ == "__main__":
    # Test de connexion
    try:
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            logger.info("✅ Connexion à la BD réussie")
    except Exception as e:
        logger.error(f"❌ Erreur de connexion: {e}")
