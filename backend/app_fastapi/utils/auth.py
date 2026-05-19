"""
Utilitaires d'authentification JWT pour FastAPI.

Gère les tokens JWT pour sécuriser les routes.
Compatible avec les tokens générés par Flask.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials as HTTPAuthCredentials
import logging

from app_fastapi.config import settings

logger = logging.getLogger(__name__)

# Configuration du contexte de hachage de mots de passe
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# Schéma de sécurité HTTP Bearer
security = HTTPBearer()


# ============================================================================
# Fonctions JWT
# ============================================================================

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Créer un token JWT d'accès.

    Args:
        data: Données à encoder (ex: {"sub": user_id})
        expires_delta: Durée d'expiration personnalisée

    Returns:
        Token JWT signé
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Vérifier et décoder un token JWT.

    Args:
        token: Token JWT à vérifier

    Returns:
        Payload du token

    Raises:
        JWTError si le token est invalide ou expiré
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.warning(f"Token invalide: {e}")
        raise


def hash_password(password: str) -> str:
    """Hacher un mot de passe."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifier un mot de passe contre son hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================================
# Dépendances FastAPI
# ============================================================================

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security)
) -> dict:
    """
    Dépendance FastAPI pour récupérer l'utilisateur actuellement authentifié.

    Utilisation dans une route:
        @router.get("/me")
        async def get_current_user_info(
            user: dict = Depends(get_current_user)
        ):
            return user

    Raises:
        HTTPException 403 si le token est invalide
    """
    token = credentials.credentials

    try:
        payload = verify_token(token)
        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token invalide: pas d'user_id"
            )

        return {
            "user_id": int(user_id),
            "payload": payload
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )


async def get_current_notaire(
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Dépendance FastAPI pour les routes réservées aux notaires.

    Vérifie que l'utilisateur a le rôle 'notaire'.
    """
    # Vérifier le rôle dans le token
    role = user.get("payload", {}).get("role")

    if role != "notaire":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux notaires"
        )

    return user


async def get_current_admin(
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Dépendance FastAPI pour les routes réservées aux administrateurs.
    """
    role = user.get("payload", {}).get("role")

    if role != "administrateur":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )

    return user


# ============================================================================
# Classes pour les réponses
# ============================================================================

class TokenResponse:
    """Réponse de token JWT."""

    def __init__(self, access_token: str):
        self.access_token = access_token
        self.token_type = "bearer"
        self.expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
