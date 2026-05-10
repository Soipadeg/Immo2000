"""
Utilitaires pour JWT et hachage de mots de passe.

Fournit des fonctions pour :
- Générer et vérifier les tokens JWT (access + refresh)
- Hacher et vérifier les mots de passe avec bcrypt
- Valider les tokens
"""

import os
import jwt
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from functools import wraps
from flask import request, current_app, jsonify
import bcrypt


def generate_access_token(user_id: int, email: str, role: str, expires_in: Optional[int] = None) -> str:
    """
    Génère un JWT access token valide pour 24h par défaut.

    Args:
        user_id (int): ID de l'utilisateur.
        email (str): Email de l'utilisateur.
        role (str): Rôle de l'utilisateur (vendeur, acheteur, agent).
        expires_in (int, optional): Durée de vie en secondes. Défaut: 24h.

    Returns:
        str: Token JWT encodé.

    Raises:
        RuntimeError: Si JWT_SECRET_KEY n'est pas configurée.

    Example:
        >>> token = generate_access_token(1, "user@example.com", "vendeur")
        >>> token
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    """
    secret_key = current_app.config.get("JWT_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY not configured")

    if expires_in is None:
        expires_in = current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES_IN", 86400)  # 24h par défaut

    expiration = datetime.utcnow() + timedelta(seconds=expires_in)

    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": expiration,
        "iat": datetime.utcnow(),
        "type": "access",
    }

    token = jwt.encode(payload, secret_key, algorithm="HS256")
    return token


def generate_refresh_token(user_id: int, expires_in: Optional[int] = None) -> str:
    """
    Génère un JWT refresh token valide pour 7 jours par défaut.

    Args:
        user_id (int): ID de l'utilisateur.
        expires_in (int, optional): Durée de vie en secondes. Défaut: 7 jours.

    Returns:
        str: Token JWT encodé.

    Raises:
        RuntimeError: Si JWT_SECRET_KEY n'est pas configurée.

    Example:
        >>> token = generate_refresh_token(1)
        >>> token
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    """
    secret_key = current_app.config.get("JWT_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY not configured")

    if expires_in is None:
        expires_in = current_app.config.get("JWT_REFRESH_TOKEN_EXPIRES_IN", 604800)  # 7 jours par défaut

    expiration = datetime.utcnow() + timedelta(seconds=expires_in)

    payload = {
        "user_id": user_id,
        "exp": expiration,
        "iat": datetime.utcnow(),
        "type": "refresh",
    }

    token = jwt.encode(payload, secret_key, algorithm="HS256")
    return token


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Vérifie et décode un JWT token.

    Valide :
    - La signature JWT avec la clé secrète.
    - L'expiration (exp).
    - Que le token n'a pas été modifié.

    Args:
        token (str): Token JWT à vérifier.

    Returns:
        dict: Payload du token si valide, None sinon.
        Contient : user_id, email, role, exp, iat, type

    Example:
        >>> payload = verify_token("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        >>> if payload:
        ...     print(f"User: {payload['user_id']}")
        ... else:
        ...     print("Token invalide ou expiré")
    """
    secret_key = current_app.config.get("JWT_SECRET_KEY")
    if not secret_key:
        return None

    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        # Token expiré
        return None
    except jwt.InvalidTokenError:
        # Token invalide (signature, format, etc.)
        return None


def hash_password(password: str) -> str:
    """
    Hache un mot de passe avec bcrypt (12 rounds).

    Args:
        password (str): Mot de passe en clair.

    Returns:
        str: Hash bcrypt (format: $2b$12$...).

    Note:
        À utiliser avant d'appeler user.set_password().
        Généralement utilisé dans les tests ou migrations.

    Example:
        >>> hashed = hash_password("monmotdepasse123")
        >>> hashed
        "$2b$12$..."
    """
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """
    Vérifie si un mot de passe en clair correspond au hash stocké.

    Args:
        password (str): Mot de passe en clair.
        password_hash (str): Hash bcrypt stocké en base.

    Returns:
        bool: True si le mot de passe est correct, False sinon.

    Example:
        >>> hashed = hash_password("monmotdepasse123")
        >>> verify_password("monmotdepasse123", hashed)
        True
        >>> verify_password("autreMDP", hashed)
        False
    """
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def extract_token_from_header(auth_header: Optional[str]) -> Optional[str]:
    """
    Extrait le token JWT du header Authorization.

    Accepte le format : "Bearer <token>"

    Args:
        auth_header (str, optional): Valeur du header Authorization.

    Returns:
        str: Token JWT, ou None si format invalide.

    Example:
        >>> extract_token_from_header("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

        >>> extract_token_from_header("InvalidFormat")
        None
    """
    if not auth_header:
        return None

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]


def generate_email_verification_token(user_id: int, email: str, expires_in: int = 86400) -> str:
    """
    Génère un token de vérification d'email pour confirmation RGPD.

    Args:
        user_id (int): ID de l'utilisateur.
        email (str): Email de l'utilisateur.
        expires_in (int): Durée de vie en secondes (défaut: 24h).

    Returns:
        str: Token JWT encodé pour vérification d'email.

    Example:
        >>> token = generate_email_verification_token(1, "user@example.com")
        >>> len(token) > 50
        True
    """
    secret_key = current_app.config.get("JWT_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY not configured")

    expiration = datetime.utcnow() + timedelta(seconds=expires_in)

    payload = {
        "user_id": user_id,
        "email": email,
        "type": "email_verification",
        "iat": datetime.utcnow(),
        "exp": expiration
    }

    token = jwt.encode(payload, secret_key, algorithm="HS256")
    return token


def verify_email_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Vérifie un token de vérification d'email.

    Args:
        token (str): Token JWT de vérification à vérifier.

    Returns:
        dict: Payload contenant user_id et email si valide, None sinon.

    Example:
        >>> payload = verify_email_token("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        >>> if payload and payload['type'] == 'email_verification':
        ...     print(f"Email verified: {payload['email']}")
    """
    secret_key = current_app.config.get("JWT_SECRET_KEY")
    if not secret_key:
        return None

    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])

        # Vérifier que c'est un token de vérification d'email
        if payload.get("type") != "email_verification":
            return None

        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def generate_reset_token(user_id: int, email: str, reset_code: str, expires_in: int = 600) -> str:
    """
    Génère un token de réinitialisation de mot de passe.

    Args:
        user_id (int): ID de l'utilisateur.
        email (str): Email de l'utilisateur.
        reset_code (str): Code de réinitialisation (6 chiffres).
        expires_in (int): Durée de vie en secondes (défaut: 10 minutes).

    Returns:
        str: Token JWT encodé pour réinitialisation.

    Example:
        >>> token = generate_reset_token(1, "user@example.com", "123456")
        >>> len(token) > 50
        True
    """
    secret_key = current_app.config.get("JWT_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY not configured")

    expiration = datetime.utcnow() + timedelta(seconds=expires_in)

    payload = {
        "user_id": user_id,
        "email": email,
        "reset_code": reset_code,
        "type": "password_reset",
        "iat": datetime.utcnow(),
        "exp": expiration
    }

    token = jwt.encode(payload, secret_key, algorithm="HS256")
    return token


def verify_reset_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Vérifie un token de réinitialisation de mot de passe.

    Args:
        token (str): Token JWT de réinitialisation à vérifier.

    Returns:
        dict: Payload contenant user_id et reset_code si valide, None sinon.

    Example:
        >>> payload = verify_reset_token("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        >>> if payload and payload['type'] == 'password_reset':
        ...     print(f"Reset for user: {payload['user_id']}")
    """
    secret_key = current_app.config.get("JWT_SECRET_KEY")
    if not secret_key:
        return None

    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])

        # Vérifier que c'est un token de réinitialisation
        if payload.get("type") != "password_reset":
            return None

        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


__all__ = [
    "generate_access_token",
    "generate_refresh_token",
    "verify_token",
    "hash_password",
    "verify_password",
    "extract_token_from_header",
    "generate_email_verification_token",
    "verify_email_token",
    "generate_reset_token",
    "verify_reset_token",
]
