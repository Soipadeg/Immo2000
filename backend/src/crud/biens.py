"""
Opérations CRUD pour les biens immobiliers.

Fournit les fonctions de logique métier :
- create_bien()
- get_bien()
- update_bien()
- delete_bien()
- list_biens()
- get_user_biens()
- get_bien_stats()

Gère l'autorisation, la validation métier et les requêtes SQLAlchemy.
"""

from typing import Optional, List, Dict, Any
from sqlalchemy import and_, func
from sqlalchemy.orm import Session
from src.models.biens import Bien
from src.auth.models import User, db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def create_bien(
    utilisateur_id: int,
    adresse: str,
    code_postal: str,
    ville: str,
    surface: int,
    type_bien: str,
    nombre_pieces: Optional[int] = None,
    nombre_chambres: Optional[int] = None,
    nombre_salles_bain: Optional[int] = None,
    etage: Optional[int] = None,
    date_construction: Optional[int] = None,
    description: Optional[str] = None,
    prix_demande: Optional[float] = None,
    etat: str = "bon",
    equipements: Optional[str] = None,
    commodites: Optional[str] = None,
) -> Bien:
    """
    Créer un nouveau bien immobilier.

    Args:
        utilisateur_id: ID du propriétaire/vendeur
        adresse: Adresse du bien
        code_postal: Code postal
        ville: Ville
        surface: Surface en m²
        type_bien: Type (appartement, maison, terrain, commercial)
        ... (autres paramètres)

    Returns:
        Objet Bien créé

    Raises:
        ValueError: Si validation échoue
    """
    try:
        # Validation
        if not adresse or not ville or not code_postal:
            raise ValueError("Adresse, ville et code postal requis")

        if surface <= 0:
            raise ValueError("Surface doit être positive")

        valid_types = ["appartement", "maison", "terrain", "commercial", "garage", "parking"]
        if type_bien not in valid_types:
            raise ValueError(f"Type invalide. Valeurs acceptées: {valid_types}")

        # Créer le bien
        bien = Bien(
            utilisateur_id=utilisateur_id,
            adresse=adresse,
            code_postal=code_postal,
            ville=ville,
            surface=surface,
            type_bien=type_bien,
            nombre_pieces=nombre_pieces,
            nombre_chambres=nombre_chambres,
            nombre_salles_bain=nombre_salles_bain,
            etage=etage,
            date_construction=date_construction,
            description=description,
            prix_demande=prix_demande,
            etat=etat,
            equipements=equipements,
            commodites=commodites,
        )

        db.session.add(bien)
        db.session.commit()

        logger.info(f"Bien créé: {bien.bien_id} par utilisateur {utilisateur_id}")
        return bien

    except ValueError as e:
        db.session.rollback()
        logger.error(f"Erreur création bien (validation): {str(e)}", exc_info=True)
        raise
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur création bien: {str(e)}", exc_info=True)
        raise


def get_bien(bien_id: int) -> Optional[Bien]:
    """
    Récupérer un bien par ID.

    Args:
        bien_id: ID du bien

    Returns:
        Objet Bien ou None
    """
    return Bien.query.filter_by(bien_id=bien_id, actif=True).first()


def get_user_biens(utilisateur_id: int, actif_only: bool = True) -> List[Bien]:
    """
    Récupérer tous les biens d'un utilisateur.

    Args:
        utilisateur_id: ID de l'utilisateur
        actif_only: Si True, retourner seulement les biens actifs

    Returns:
        Liste de biens
    """
    query = Bien.query.filter_by(utilisateur_id=utilisateur_id)
    if actif_only:
        query = query.filter_by(actif=True)
    return query.all()


def list_biens(
    filters: Optional[Dict[str, Any]] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[List[Bien], int]:
    """
    Récupérer une liste de biens avec filtrage.

    Args:
        filters: Dictionnaire de filtres {colonne: valeur}
        limit: Nombre max de résultats
        offset: Offset pour pagination

    Returns:
        Tuple (liste biens, count total)
    """
    query = Bien.query.filter_by(actif=True)

    # Appliquer les filtres
    if filters:
        if "type_bien" in filters and filters["type_bien"]:
            query = query.filter_by(type_bien=filters["type_bien"])

        if "ville" in filters and filters["ville"]:
            query = query.filter_by(ville=filters["ville"])

        if "code_postal" in filters and filters["code_postal"]:
            query = query.filter_by(code_postal=filters["code_postal"])

        if "surface_min" in filters and filters["surface_min"]:
            query = query.filter(Bien.surface >= filters["surface_min"])

        if "surface_max" in filters and filters["surface_max"]:
            query = query.filter(Bien.surface <= filters["surface_max"])

        if "etat" in filters and filters["etat"]:
            query = query.filter_by(etat=filters["etat"])

    total = query.count()
    biens = query.order_by(Bien.date_creation.desc()).limit(limit).offset(offset).all()

    return biens, total


def update_bien(bien_id: int, utilisateur_id: int, **kwargs) -> Optional[Bien]:
    """
    Mettre à jour un bien (propriétaire seulement).

    Args:
        bien_id: ID du bien
        utilisateur_id: ID du propriétaire (vérification d'autorisation)
        **kwargs: Champs à mettre à jour

    Returns:
        Bien mis à jour ou None

    Raises:
        PermissionError: Si l'utilisateur n'est pas propriétaire
    """
    try:
        bien = Bien.query.get(bien_id)

        if not bien:
            return None

        # Vérifier que l'utilisateur est propriétaire
        if bien.utilisateur_id != utilisateur_id:
            raise PermissionError("Vous n'êtes pas propriétaire de ce bien")

        # Mettre à jour les champs autorisés
        allowed_fields = [
            "adresse", "code_postal", "ville",
            "surface", "type_bien", "nombre_pieces",
            "nombre_chambres", "nombre_salles_bain",
            "etage", "date_construction", "description",
            "prix_demande", "etat", "equipements", "commodites"
        ]

        for key, value in kwargs.items():
            if key in allowed_fields:
                setattr(bien, key, value)

        bien.date_modification = datetime.utcnow()
        db.session.commit()

        logger.info(f"Bien {bien_id} mis à jour par utilisateur {utilisateur_id}")
        return bien

    except PermissionError as e:
        db.session.rollback()
        logger.error(f"Erreur mise à jour bien (autorisation): {str(e)}", exc_info=True)
        raise
    except ValueError as e:
        db.session.rollback()
        logger.error(f"Erreur mise à jour bien (validation): {str(e)}", exc_info=True)
        raise
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur mise à jour bien: {str(e)}", exc_info=True)
        raise


def delete_bien(bien_id: int, utilisateur_id: int) -> bool:
    """
    Supprimer un bien (soft delete - marquer comme inactif).

    Args:
        bien_id: ID du bien
        utilisateur_id: ID du propriétaire (vérification d'autorisation)

    Returns:
        True si succès, False sinon

    Raises:
        PermissionError: Si l'utilisateur n'est pas propriétaire
    """
    try:
        bien = Bien.query.get(bien_id)

        if not bien:
            return False

        # Vérifier que l'utilisateur est propriétaire
        if bien.utilisateur_id != utilisateur_id:
            raise PermissionError("Vous n'êtes pas propriétaire de ce bien")

        # Soft delete
        bien.actif = False
        bien.date_modification = datetime.utcnow()
        db.session.commit()

        logger.info(f"Bien {bien_id} supprimé par utilisateur {utilisateur_id}")
        return True

    except PermissionError as e:
        db.session.rollback()
        logger.error(f"Erreur suppression bien (autorisation): {str(e)}", exc_info=True)
        raise
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erreur suppression bien: {str(e)}", exc_info=True)
        raise


def get_bien_stats() -> Dict[str, Any]:
    """
    Obtenir les statistiques sur les biens immobiliers.

    Returns:
        Dictionnaire avec statistiques
    """
    try:
        total_biens = Bien.query.filter_by(actif=True).count()
        total_utilisateurs = db.session.query(func.count(func.distinct(Bien.utilisateur_id))).filter(Bien.actif == True).scalar()

        # Compter par type
        type_distribution = {}
        types = db.session.query(Bien.type_bien, func.count(Bien.bien_id)).filter(Bien.actif == True).group_by(Bien.type_bien).all()
        for type_bien, count in types:
            type_distribution[type_bien] = count

        # Surface moyenne
        avg_surface = db.session.query(func.avg(Bien.surface)).filter(Bien.actif == True).scalar() or 0

        return {
            "total_biens": total_biens,
            "total_utilisateurs_vendeurs": total_utilisateurs or 0,
            "distribution_types": type_distribution,
            "surface_moyenne": float(avg_surface),
        }

    except ValueError as e:
        logger.error(f"Erreur calcul stats (validation): {str(e)}", exc_info=True)
        return {
            "total_biens": 0,
            "total_utilisateurs_vendeurs": 0,
            "distribution_types": {},
            "surface_moyenne": 0,
        }
    except Exception as e:
        logger.error(f"Erreur calcul stats: {str(e)}", exc_info=True)
        return {
            "total_biens": 0,
            "total_utilisateurs_vendeurs": 0,
            "distribution_types": {},
            "surface_moyenne": 0,
        }
