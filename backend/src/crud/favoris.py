"""
CRUD operations for favorites
"""

from sqlalchemy.orm import Session
from datetime import datetime
from sqlalchemy import and_, func, desc
from src.models.favoris import Favori
from src.models.annonces import Annonce
from src.auth.models import User


def add_favorite(
    db: Session,
    user_id: int,
    annonce_id: int,
    note: int = None,
    commentaire: str = None
) -> Favori:
    """
    Add an annonce to favorites
    """
    # Check if already favorited
    existing = db.query(Favori).filter(
        and_(Favori.user_id == user_id, Favori.annonce_id == annonce_id)
    ).first()

    if existing:
        return existing

    favori = Favori(
        user_id=user_id,
        annonce_id=annonce_id,
        date_ajout=datetime.utcnow(),
        note=note,
        commentaire=commentaire
    )
    db.add(favori)
    db.commit()
    db.refresh(favori)
    return favori


def get_favorite(db: Session, favori_id: int) -> Favori:
    """
    Get a favorite by ID
    """
    return db.query(Favori).filter(Favori.favori_id == favori_id).first()


def is_favorite(db: Session, user_id: int, annonce_id: int) -> bool:
    """
    Check if an annonce is in user's favorites
    """
    return db.query(Favori).filter(
        and_(Favori.user_id == user_id, Favori.annonce_id == annonce_id)
    ).first() is not None


def remove_favorite(
    db: Session,
    user_id: int,
    annonce_id: int
) -> bool:
    """
    Remove an annonce from favorites
    """
    favori = db.query(Favori).filter(
        and_(Favori.user_id == user_id, Favori.annonce_id == annonce_id)
    ).first()

    if not favori:
        return False

    db.delete(favori)
    db.commit()
    return True


def get_user_favorites(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50
) -> tuple[list[Favori], int]:
    """
    Get user's favorite annonces
    """
    query = db.query(Favori).filter(Favori.user_id == user_id)
    total = query.count()

    favorites = query.order_by(desc(Favori.date_ajout)).offset(skip).limit(limit).all()
    return favorites, total


def get_user_favorite_count(db: Session, user_id: int) -> int:
    """
    Get count of user's favorites
    """
    return db.query(Favori).filter(Favori.user_id == user_id).count()


def get_annonce_favorite_count(db: Session, annonce_id: int) -> int:
    """
    Get number of times an annonce was added to favorites
    """
    return db.query(Favori).filter(Favori.annonce_id == annonce_id).count()


def update_favorite_note(
    db: Session,
    user_id: int,
    annonce_id: int,
    note: int
) -> Favori:
    """
    Update the rating/note for a favorite
    """
    favori = db.query(Favori).filter(
        and_(Favori.user_id == user_id, Favori.annonce_id == annonce_id)
    ).first()

    if favori:
        favori.note = note
        db.commit()
        db.refresh(favori)

    return favori


def update_favorite_comment(
    db: Session,
    user_id: int,
    annonce_id: int,
    commentaire: str
) -> Favori:
    """
    Update the comment for a favorite
    """
    favori = db.query(Favori).filter(
        and_(Favori.user_id == user_id, Favori.annonce_id == annonce_id)
    ).first()

    if favori:
        favori.commentaire = commentaire
        db.commit()
        db.refresh(favori)

    return favori


def get_top_rated_annonces(db: Session, limit: int = 10) -> list:
    """
    Get most highly rated annonces by users
    """
    results = db.query(
        Annonce.annonce_id,
        Annonce.titre,
        func.avg(Favori.note).label('avg_note'),
        func.count(Favori.favori_id).label('favorite_count')
    ).outerjoin(Favori).filter(
        Favori.note.isnot(None)
    ).group_by(
        Annonce.annonce_id,
        Annonce.titre
    ).order_by(desc('avg_note')).limit(limit).all()

    return [
        {
            'annonce_id': row.annonce_id,
            'titre': row.titre,
            'avg_rating': row.avg_note,
            'favorite_count': row.favorite_count
        }
        for row in results
    ]


def get_most_favorited_annonces(
    db: Session,
    days: int = 30,
    limit: int = 10
) -> list:
    """
    Get most frequently favorited annonces
    """
    from datetime import timedelta
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    results = db.query(
        Annonce.annonce_id,
        Annonce.titre,
        func.count(Favori.favori_id).label('favorite_count')
    ).join(Favori).filter(
        Favori.date_ajout >= cutoff_date
    ).group_by(
        Annonce.annonce_id,
        Annonce.titre
    ).order_by(desc('favorite_count')).limit(limit).all()

    return [
        {'annonce_id': row.annonce_id, 'titre': row.titre, 'count': row.favorite_count}
        for row in results
    ]


def get_user_favorite_types(db: Session, user_id: int) -> dict:
    """
    Get breakdown of user's favorites by property type
    """
    results = db.query(
        Annonce.type_bien,
        func.count(Favori.favori_id).label('count')
    ).join(Annonce).filter(
        and_(
            Favori.user_id == user_id,
            Annonce.type_bien.isnot(None)
        )
    ).group_by(Annonce.type_bien).all()

    return {row.type_bien: row.count for row in results}


def get_user_favorite_villes(db: Session, user_id: int) -> dict:
    """
    Get breakdown of user's favorites by city
    """
    results = db.query(
        Annonce.ville,
        func.count(Favori.favori_id).label('count')
    ).join(Annonce).filter(
        and_(
            Favori.user_id == user_id,
            Annonce.ville.isnot(None)
        )
    ).group_by(Annonce.ville).order_by(desc('count')).all()

    return {row.ville: row.count for row in results}


def get_vendor_favorite_count_per_annonce(db: Session, vendor_id: int) -> list:
    """
    Get favorite counts for all annonces of a vendor
    """
    results = db.query(
        Annonce.annonce_id,
        Annonce.titre,
        func.count(Favori.favori_id).label('favorite_count')
    ).outerjoin(Favori).filter(
        Annonce.vendeur_id == vendor_id
    ).group_by(
        Annonce.annonce_id,
        Annonce.titre
    ).order_by(desc('favorite_count')).all()

    return [
        {'annonce_id': row.annonce_id, 'titre': row.titre, 'favorite_count': row.favorite_count}
        for row in results
    ]


def delete_old_favorites(db: Session, days: int = 365) -> int:
    """
    Delete favorites older than N days without notes/comments (for cleanup)
    """
    from datetime import timedelta
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    count = db.query(Favori).filter(
        and_(
            Favori.date_ajout < cutoff_date,
            Favori.note.is_(None),
            Favori.commentaire.is_(None)
        )
    ).delete()
    db.commit()
    return count
