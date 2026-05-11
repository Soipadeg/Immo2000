"""
CRUD operations for search history
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import and_, func, desc
from src.models.search_history import SearchHistory
from src.auth.models import User


def record_search(
    db: Session,
    user_id: int = None,
    ville: str = None,
    type_bien: str = None,
    budget_min: float = None,
    budget_max: float = None,
    surface_min: float = None,
    surface_max: float = None,
    pieces_min: int = None,
    nombre_resultats: int = 0
) -> SearchHistory:
    """
    Record a search query by a user
    """
    search = SearchHistory(
        user_id=user_id,
        ville=ville,
        type_bien=type_bien,
        budget_min=budget_min,
        budget_max=budget_max,
        surface_min=surface_min,
        surface_max=surface_max,
        pieces_min=pieces_min,
        date_search=datetime.utcnow(),
        nombre_resultats=nombre_resultats
    )
    db.add(search)
    db.commit()
    db.refresh(search)
    return search


def get_search_by_id(db: Session, search_id: int) -> SearchHistory:
    """
    Get a search record by ID
    """
    return db.query(SearchHistory).filter(SearchHistory.search_id == search_id).first()


def get_user_searches(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50
) -> tuple[list[SearchHistory], int]:
    """
    Get search history for a specific user
    """
    query = db.query(SearchHistory).filter(SearchHistory.user_id == user_id)
    total = query.count()

    searches = query.order_by(desc(SearchHistory.date_search)).offset(skip).limit(limit).all()
    return searches, total


def get_user_search_count(db: Session, user_id: int) -> int:
    """
    Get total search count for a user
    """
    return db.query(SearchHistory).filter(SearchHistory.user_id == user_id).count()


def get_recent_user_searches(
    db: Session,
    user_id: int,
    days: int = 30,
    limit: int = 10
) -> list[SearchHistory]:
    """
    Get recent searches from the last N days
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    return db.query(SearchHistory).filter(
        and_(
            SearchHistory.user_id == user_id,
            SearchHistory.date_search >= cutoff_date
        )
    ).order_by(desc(SearchHistory.date_search)).limit(limit).all()


def get_trending_searches(
    db: Session,
    days: int = 7,
    limit: int = 10
) -> list:
    """
    Get most popular search terms (for analytics)
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    results = db.query(
        SearchHistory.ville,
        SearchHistory.type_bien,
        func.count(SearchHistory.search_id).label('count')
    ).filter(
        SearchHistory.date_search >= cutoff_date
    ).group_by(
        SearchHistory.ville,
        SearchHistory.type_bien
    ).order_by(desc('count')).limit(limit).all()

    return [
        {'ville': row.ville, 'type_bien': row.type_bien, 'count': row.count}
        for row in results
    ]


def get_search_stats_by_ville(
    db: Session,
    ville: str,
    days: int = 30
) -> dict:
    """
    Get search statistics for a specific city
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    searches = db.query(SearchHistory).filter(
        and_(
            SearchHistory.ville == ville,
            SearchHistory.date_search >= cutoff_date
        )
    ).all()

    total_searches = len(searches)
    avg_budget_min = sum(s.budget_min for s in searches if s.budget_min) / len([s for s in searches if s.budget_min]) if any(s.budget_min for s in searches) else 0
    avg_budget_max = sum(s.budget_max for s in searches if s.budget_max) / len([s for s in searches if s.budget_max]) if any(s.budget_max for s in searches) else 0

    type_breakdown = {}
    for search in searches:
        if search.type_bien:
            type_breakdown[search.type_bien] = type_breakdown.get(search.type_bien, 0) + 1

    return {
        'ville': ville,
        'total_searches': total_searches,
        'avg_budget_min': avg_budget_min,
        'avg_budget_max': avg_budget_max,
        'type_breakdown': type_breakdown
    }


def get_popular_villes(
    db: Session,
    days: int = 30,
    limit: int = 10
) -> list:
    """
    Get most searched cities
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    results = db.query(
        SearchHistory.ville,
        func.count(SearchHistory.search_id).label('count')
    ).filter(
        and_(
            SearchHistory.ville.isnot(None),
            SearchHistory.date_search >= cutoff_date
        )
    ).group_by(SearchHistory.ville).order_by(desc('count')).limit(limit).all()

    return [{'ville': row.ville, 'count': row.count} for row in results]


def get_popular_types(
    db: Session,
    days: int = 30,
    limit: int = 10
) -> list:
    """
    Get most searched property types
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    results = db.query(
        SearchHistory.type_bien,
        func.count(SearchHistory.search_id).label('count')
    ).filter(
        and_(
            SearchHistory.type_bien.isnot(None),
            SearchHistory.date_search >= cutoff_date
        )
    ).group_by(SearchHistory.type_bien).order_by(desc('count')).limit(limit).all()

    return [{'type_bien': row.type_bien, 'count': row.count} for row in results]


def get_user_search_preferences(db: Session, user_id: int) -> dict:
    """
    Get a user's typical search preferences
    """
    searches = db.query(SearchHistory).filter(
        SearchHistory.user_id == user_id
    ).all()

    if not searches:
        return {}

    # Calculate averages and modes
    avg_budget_min = sum(s.budget_min for s in searches if s.budget_min) / len([s for s in searches if s.budget_min]) if any(s.budget_min for s in searches) else None
    avg_budget_max = sum(s.budget_max for s in searches if s.budget_max) / len([s for s in searches if s.budget_max]) if any(s.budget_max for s in searches) else None
    avg_surface_min = sum(s.surface_min for s in searches if s.surface_min) / len([s for s in searches if s.surface_min]) if any(s.surface_min for s in searches) else None

    # Most common ville and type
    villes = [s.ville for s in searches if s.ville]
    types = [s.type_bien for s in searches if s.type_bien]

    most_common_ville = max(set(villes), key=villes.count) if villes else None
    most_common_type = max(set(types), key=types.count) if types else None

    return {
        'avg_budget_min': avg_budget_min,
        'avg_budget_max': avg_budget_max,
        'avg_surface_min': avg_surface_min,
        'most_common_ville': most_common_ville,
        'most_common_type': most_common_type,
        'total_searches': len(searches)
    }


def delete_search(db: Session, search_id: int, user_id: int) -> bool:
    """
    Delete a search record (user can only delete their own)
    """
    search = db.query(SearchHistory).filter(
        and_(SearchHistory.search_id == search_id, SearchHistory.user_id == user_id)
    ).first()

    if not search:
        return False

    db.delete(search)
    db.commit()
    return True


def delete_old_searches(db: Session, days: int = 180) -> int:
    """
    Delete search records older than N days (for cleanup)
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    count = db.query(SearchHistory).filter(
        SearchHistory.date_search < cutoff_date
    ).delete()
    db.commit()
    return count
