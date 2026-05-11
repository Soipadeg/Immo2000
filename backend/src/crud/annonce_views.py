"""
CRUD operations for annonce views and analytics
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import and_, func, desc
from src.models.annonce_views import AnnonceView
from src.models.annonces import Annonce


def record_view(
    db: Session,
    annonce_id: int,
    user_id: int = None,
    ip_address: str = None,
    source: str = 'direct',
    duree_vue: int = 0
) -> AnnonceView:
    """
    Record a view for an annonce
    """
    view = AnnonceView(
        annonce_id=annonce_id,
        user_id=user_id,
        ip_address=ip_address,
        date_view=datetime.utcnow(),
        source=source,
        duree_vue=duree_vue
    )
    db.add(view)
    db.commit()
    db.refresh(view)
    return view


def get_view_by_id(db: Session, view_id: int) -> AnnonceView:
    """
    Get a view record by ID
    """
    return db.query(AnnonceView).filter(AnnonceView.view_id == view_id).first()


def list_views_for_annonce(
    db: Session,
    annonce_id: int,
    skip: int = 0,
    limit: int = 100
) -> tuple[list[AnnonceView], int]:
    """
    List all views for an annonce
    """
    query = db.query(AnnonceView).filter(AnnonceView.annonce_id == annonce_id)
    total = query.count()

    views = query.order_by(desc(AnnonceView.date_view)).offset(skip).limit(limit).all()
    return views, total


def get_annonce_view_count(db: Session, annonce_id: int) -> int:
    """
    Get total number of views for an annonce
    """
    return db.query(AnnonceView).filter(AnnonceView.annonce_id == annonce_id).count()


def get_view_count_by_date_range(
    db: Session,
    annonce_id: int,
    start_date: datetime,
    end_date: datetime
) -> int:
    """
    Get number of views within a date range
    """
    return db.query(AnnonceView).filter(
        and_(
            AnnonceView.annonce_id == annonce_id,
            AnnonceView.date_view >= start_date,
            AnnonceView.date_view <= end_date
        )
    ).count()


def get_weekly_views(db: Session, annonce_id: int) -> list:
    """
    Get daily view counts for the last 7 days
    Returns list of dicts with date and count
    """
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    views = db.query(
        func.date(AnnonceView.date_view).label('date'),
        func.count(AnnonceView.view_id).label('count')
    ).filter(
        and_(
            AnnonceView.annonce_id == annonce_id,
            AnnonceView.date_view >= seven_days_ago
        )
    ).group_by(func.date(AnnonceView.date_view)).order_by('date').all()

    return [{'date': row.date, 'count': row.count} for row in views]


def get_monthly_views(db: Session, annonce_id: int, months: int = 3) -> list:
    """
    Get daily view counts for the last N months
    """
    start_date = datetime.utcnow() - timedelta(days=30 * months)

    views = db.query(
        func.date(AnnonceView.date_view).label('date'),
        func.count(AnnonceView.view_id).label('count')
    ).filter(
        and_(
            AnnonceView.annonce_id == annonce_id,
            AnnonceView.date_view >= start_date
        )
    ).group_by(func.date(AnnonceView.date_view)).order_by('date').all()

    return [{'date': row.date, 'count': row.count} for row in views]


def get_views_by_source(db: Session, annonce_id: int) -> dict:
    """
    Get breakdown of views by source
    """
    results = db.query(
        AnnonceView.source,
        func.count(AnnonceView.view_id).label('count')
    ).filter(
        AnnonceView.annonce_id == annonce_id
    ).group_by(AnnonceView.source).all()

    return {row.source: row.count for row in results}


def get_avg_view_duration(db: Session, annonce_id: int) -> float:
    """
    Get average view duration in seconds
    """
    result = db.query(
        func.avg(AnnonceView.duree_vue).label('avg_duration')
    ).filter(
        AnnonceView.annonce_id == annonce_id
    ).first()

    return result.avg_duration or 0


def get_vendor_total_views(db: Session, vendor_id: int) -> int:
    """
    Get total views for all annonces of a vendor
    """
    return db.query(func.count(AnnonceView.view_id)).join(Annonce).filter(
        Annonce.vendeur_id == vendor_id
    ).scalar() or 0


def get_vendor_views_by_annonce(
    db: Session,
    vendor_id: int
) -> list:
    """
    Get view counts for each annonce of a vendor
    """
    results = db.query(
        Annonce.annonce_id,
        Annonce.titre,
        func.count(AnnonceView.view_id).label('views')
    ).outerjoin(AnnonceView).filter(
        Annonce.vendeur_id == vendor_id
    ).group_by(Annonce.annonce_id, Annonce.titre).order_by(desc('views')).all()

    return [
        {'annonce_id': row.annonce_id, 'titre': row.titre, 'views': row.views}
        for row in results
    ]


def get_trending_annonces(db: Session, limit: int = 10) -> list:
    """
    Get most viewed annonces overall (for homepage trending section)
    """
    one_week_ago = datetime.utcnow() - timedelta(days=7)

    results = db.query(
        Annonce.annonce_id,
        Annonce.titre,
        func.count(AnnonceView.view_id).label('views')
    ).outerjoin(AnnonceView).filter(
        AnnonceView.date_view >= one_week_ago
    ).group_by(Annonce.annonce_id, Annonce.titre).order_by(
        desc('views')
    ).limit(limit).all()

    return [
        {'annonce_id': row.annonce_id, 'titre': row.titre, 'views': row.views}
        for row in results
    ]


def get_view_stats(db: Session, annonce_id: int) -> dict:
    """
    Get comprehensive view statistics for an annonce
    """
    total_views = get_annonce_view_count(db, annonce_id)
    weekly_views = get_weekly_views(db, annonce_id)
    views_by_source = get_views_by_source(db, annonce_id)
    avg_duration = get_avg_view_duration(db, annonce_id)

    return {
        'total_views': total_views,
        'weekly_views': weekly_views,
        'views_by_source': views_by_source,
        'avg_view_duration_seconds': avg_duration,
        'last_view': db.query(AnnonceView).filter(
            AnnonceView.annonce_id == annonce_id
        ).order_by(desc(AnnonceView.date_view)).first()
    }


def delete_old_views(db: Session, days: int = 90) -> int:
    """
    Delete view records older than N days (for cleanup)
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    count = db.query(AnnonceView).filter(
        AnnonceView.date_view < cutoff_date
    ).delete()
    db.commit()
    return count
