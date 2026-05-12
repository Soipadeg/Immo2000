"""
CRUD operations for purchase offers - OPTIMIZED
"""

from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from sqlalchemy import and_, or_, func, desc
from src.models.offres import Offre, OffreStatus
from src.models.annonces import Annonce
from src.auth.models import User
from src.helpers.query import paginate_query, PaginationParams


def create_offer(
    db: Session,
    annonce_id: int,
    acheteur_id: int,
    prix_propose: float,
    message: str = None,
    conditions: dict = None
) -> Offre:
    """
    Create a new purchase offer
    """
    offre = Offre(
        annonce_id=annonce_id,
        acheteur_id=acheteur_id,
        prix_propose=prix_propose,
        statut=OffreStatus.PROPOSEE.value,
        message=message,
        date_offre=datetime.utcnow(),
        conditions=conditions or {}
    )
    db.add(offre)
    db.commit()
    db.refresh(offre)
    return offre


def get_offer(db: Session, offre_id: int) -> Offre:
    """
    Get an offer by ID with eager loading
    """
    return db.query(Offre).options(
        joinedload(Offre.annonce),
        joinedload(Offre.acheteur)
    ).filter(Offre.offre_id == offre_id).first()


def get_offer_with_permission_check(
    db: Session,
    offre_id: int,
    user_id: int
) -> Offre:
    """
    Get an offer only if user is the seller or buyer
    """
    return db.query(Offre).options(
        joinedload(Offre.annonce),
        joinedload(Offre.acheteur)
    ).join(Annonce).filter(
        and_(
            Offre.offre_id == offre_id,
            or_(Annonce.utilisateur_id == user_id, Offre.acheteur_id == user_id)
        )
    ).first()


def list_offers_for_annonce(
    db: Session,
    annonce_id: int,
    skip: int = 0,
    limit: int = 50
) -> tuple[list[Offre], int]:
    """
    List all offers for an annonce with eager loading (NO N+1!)
    """
    query = db.query(Offre).options(
        joinedload(Offre.annonce),
        joinedload(Offre.acheteur)
    ).filter(Offre.annonce_id == annonce_id).order_by(desc(Offre.date_offre))

    return paginate_query(query, skip, limit)


def list_offers_for_buyer(
    db: Session,
    acheteur_id: int,
    skip: int = 0,
    limit: int = 50
) -> tuple[list[Offre], int]:
    """
    List all offers made by a buyer with eager loading (NO N+1!)
    """
    query = db.query(Offre).options(
        joinedload(Offre.annonce),
        joinedload(Offre.acheteur)
    ).filter(Offre.acheteur_id == acheteur_id).order_by(desc(Offre.date_offre))

    return paginate_query(query, skip, limit)



def list_offers_for_vendor(
    db: Session,
    vendor_id: int,
    skip: int = 0,
    limit: int = 50
) -> tuple[list[Offre], int]:
    """
    List all offers for a vendor's annonces with eager loading (NO N+1!)
    """
    query = db.query(Offre).options(
        joinedload(Offre.annonce),
        joinedload(Offre.acheteur)
    ).join(Annonce).filter(Annonce.utilisateur_id == vendor_id).order_by(desc(Offre.date_offre))

    return paginate_query(query, skip, limit)


def update_offer_status(
    db: Session,
    offre_id: int,
    new_status: str,
    vendor_id: int = None
) -> Offre:
    """
    Update offer status (only vendor can change status)
    """
    if vendor_id:
        offre = db.query(Offre).join(Annonce).filter(
            and_(Offre.offre_id == offre_id, Annonce.utilisateur_id == vendor_id)
        ).first()
    else:
        offre = db.query(Offre).filter(Offre.offre_id == offre_id).first()

    if offre:
        offre.statut = new_status
        offre.date_reponse = datetime.utcnow()
        db.commit()
        db.refresh(offre)

    return offre


def accept_offer(db: Session, offre_id: int, vendor_id: int) -> Offre:
    """
    Accept an offer
    """
    return update_offer_status(db, offre_id, OffreStatus.ACCEPTEE.value, vendor_id)


def reject_offer(db: Session, offre_id: int, vendor_id: int) -> Offre:
    """
    Reject an offer
    """
    return update_offer_status(db, offre_id, OffreStatus.REFUSEE.value, vendor_id)


def counter_offer(
    db: Session,
    offre_id: int,
    new_price: float,
    vendor_id: int
) -> Offre:
    """
    Make a counter offer
    """
    offre = db.query(Offre).join(Annonce).filter(
        and_(Offre.offre_id == offre_id, Annonce.vendeur_id == vendor_id)
    ).first()

    if offre:
        offre.statut = OffreStatus.NEGOCIATION.value
        offre.prix_propose = new_price  # Updated price
        offre.date_reponse = datetime.utcnow()
        db.commit()
        db.refresh(offre)

    return offre


def update_offer_conditions(
    db: Session,
    offre_id: int,
    conditions: dict,
    vendor_id: int = None
) -> Offre:
    """
    Update offer conditions
    """
    if vendor_id:
        offre = db.query(Offre).join(Annonce).filter(
            and_(Offre.offre_id == offre_id, Annonce.vendeur_id == vendor_id)
        ).first()
    else:
        offre = db.query(Offre).filter(Offre.offre_id == offre_id).first()

    if offre:
        offre.conditions = conditions
        db.commit()
        db.refresh(offre)

    return offre


def get_pending_offers(db: Session, vendor_id: int) -> list[Offre]:
    """
    Get all pending offers (not yet responded to)
    """
    pending_statuses = [OffreStatus.PROPOSEE.value, OffreStatus.NEGOCIATION.value]

    return db.query(Offre).join(Annonce).filter(
        and_(
            Annonce.vendeur_id == vendor_id,
            Offre.statut.in_(pending_statuses)
        )
    ).order_by(desc(Offre.date_offre)).all()


def get_pending_offer_count(db: Session, vendor_id: int) -> int:
    """
    Get count of pending offers for a vendor
    """
    pending_statuses = [OffreStatus.PROPOSEE.value, OffreStatus.NEGOCIATION.value]

    return db.query(Offre).join(Annonce).filter(
        and_(
            Annonce.vendeur_id == vendor_id,
            Offre.statut.in_(pending_statuses)
        )
    ).count()


def get_accepted_offers(db: Session, vendor_id: int) -> list[Offre]:
    """
    Get all accepted offers
    """
    return db.query(Offre).join(Annonce).filter(
        and_(
            Annonce.vendeur_id == vendor_id,
            Offre.statut == OffreStatus.ACCEPTEE.value
        )
    ).order_by(desc(Offre.date_reponse)).all()


def get_offers_by_status(db: Session, vendor_id: int, statut: str) -> list[Offre]:
    """
    Get offers filtered by status
    """
    return db.query(Offre).join(Annonce).filter(
        and_(
            Annonce.vendeur_id == vendor_id,
            Offre.statut == statut
        )
    ).order_by(desc(Offre.date_offre)).all()


def get_offer_stats_for_vendor(db: Session, vendor_id: int) -> dict:
    """
    Get comprehensive offer statistics for a vendor
    """
    offers = db.query(Offre).join(Annonce).filter(
        Annonce.vendeur_id == vendor_id
    ).all()

    total_offers = len(offers)

    # Status breakdown
    status_breakdown = {}
    for offer in offers:
        status_breakdown[offer.statut] = status_breakdown.get(offer.statut, 0) + 1

    # Price statistics
    proposed_prices = [o.prix_propose for o in offers]
    avg_price = sum(proposed_prices) / len(proposed_prices) if proposed_prices else 0
    min_price = min(proposed_prices) if proposed_prices else 0
    max_price = max(proposed_prices) if proposed_prices else 0

    # Time to response
    responded_offers = [o for o in offers if o.date_reponse]
    avg_response_time = None
    if responded_offers:
        response_times = [(o.date_reponse - o.date_offre).total_seconds() / 3600 for o in responded_offers]
        avg_response_time = sum(response_times) / len(response_times)

    return {
        'total_offers': total_offers,
        'status_breakdown': status_breakdown,
        'avg_proposed_price': avg_price,
        'min_proposed_price': min_price,
        'max_proposed_price': max_price,
        'avg_response_time_hours': avg_response_time
    }


def get_offer_stats_for_annonce(db: Session, annonce_id: int) -> dict:
    """
    Get offer statistics for a specific annonce
    """
    offers = db.query(Offre).filter(Offre.annonce_id == annonce_id).all()

    total_offers = len(offers)
    proposed_prices = [o.prix_propose for o in offers]

    return {
        'total_offers': total_offers,
        'avg_proposed_price': sum(proposed_prices) / len(proposed_prices) if proposed_prices else 0,
        'min_proposed_price': min(proposed_prices) if proposed_prices else 0,
        'max_proposed_price': max(proposed_prices) if proposed_prices else 0,
        'last_offer': max((o for o in offers), key=lambda x: x.date_offre, default=None)
    }


def delete_offer(db: Session, offre_id: int, user_id: int) -> bool:
    """
    Delete an offer (buyer or vendor can delete)
    """
    offre = db.query(Offre).join(Annonce).filter(
        and_(
            Offre.offre_id == offre_id,
            or_(Offre.acheteur_id == user_id, Annonce.vendeur_id == user_id)
        )
    ).first()

    if not offre:
        return False

    db.delete(offre)
    db.commit()
    return True


def withdraw_offer(db: Session, offre_id: int, acheteur_id: int) -> Offre:
    """
    Withdraw an offer (buyer can withdraw their offer)
    """
    offre = db.query(Offre).filter(
        and_(Offre.offre_id == offre_id, Offre.acheteur_id == acheteur_id)
    ).first()

    if offre:
        offre.statut = OffreStatus.RETIREE.value
        db.commit()
        db.refresh(offre)

    return offre
