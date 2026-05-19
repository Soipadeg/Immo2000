"""
Phase 3.2: Exemples d'intégration Redis Cache

Montrer comment intégrer le cache dans les routes existantes.
Copy-paste ces patterns pour ajouter le cache aux routes critiques.
"""

# ===== EXEMPLE 1: Cacher un GET simple =====
from src.services.cache_service import cached, cache_key, invalidate_listing
from src.auth.models import db, Annonce

@annonces_bp.route('/<int:annonce_id>', methods=['GET'])
def get_annonce(annonce_id: int):
    """
    GET /api/v1/annonces/{id}

    Avec cache:
    - Premier appel: DB query + Redis set (1s)
    - Appels suivants: Redis get (10ms) - 100x plus rapide!
    """
    # V1: Gérer le cache manuellement
    cache = RedisCache()
    cache_key_str = f"cache:listing:{annonce_id}"

    # Essayer le cache
    cached_result = cache.get(cache_key_str)
    if cached_result:
        return cached_result, 200

    # DB query
    annonce = Annonce.query.filter_by(annonce_id=annonce_id).first()
    if not annonce:
        return {'error': 'Listing not found'}, 404

    result = annonce.to_dict()

    # Cacher le résultat
    cache.set(cache_key_str, result, ttl=CacheConfig.TTL_LISTING)

    return result, 200


# ===== EXEMPLE 2: Cacher avec décorateur (Plus simple) =====
@cached('listing', ttl=3600)  # Cache 1 heure
def _fetch_listing_from_db(annonce_id: int):
    """Helper pour fetch depuis DB"""
    annonce = Annonce.query.filter_by(annonce_id=annonce_id).first()
    if not annonce:
        return None
    return annonce.to_dict()

@annonces_bp.route('/<int:annonce_id>', methods=['GET'])
def get_annonce_v2(annonce_id: int):
    """Version avec décorateur @cached - Plus propre"""
    result = _fetch_listing_from_db(annonce_id)
    if not result:
        return {'error': 'Listing not found'}, 404
    return result, 200


# ===== EXEMPLE 3: Invalider le cache au UPDATE =====
@annonces_bp.route('/<int:annonce_id>', methods=['PUT'])
@token_required
def update_annonce(current_user, annonce_id: int):
    """PUT /api/v1/annonces/{id}"""

    annonce = Annonce.query.filter_by(annonce_id=annonce_id).first()
    if not annonce:
        return {'error': 'Listing not found'}, 404

    # Update en BD
    data = request.get_json()
    annonce.titre = data.get('titre', annonce.titre)
    annonce.description = data.get('description', annonce.description)
    # ... autres champs

    db.session.commit()

    # 🔄 IMPORTANT: Invalider le cache!
    invalidate_listing(annonce_id)

    return annonce.to_dict(), 200


# ===== EXEMPLE 4: Cacher une liste (paginer!) =====
@annonces_bp.route('', methods=['GET'])
def list_annonces():
    """
    GET /api/v1/annonces?page=1&limit=20

    Strategy: Cache les listings, PAS la pagination
    (Chaque page=1,2,3... est une clé différente)
    """
    from flask import request

    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    cache_svc = RedisCache()

    # Clé de cache par page
    cache_key_str = f"cache:listings:page:{page}:limit:{limit}"

    # Essayer cache
    cached = cache_svc.get(cache_key_str)
    if cached:
        return cached, 200

    # DB query avec pagination
    query = Annonce.query.filter_by(statut='active')
    total = query.count()

    items = query.offset((page - 1) * limit)\
                 .limit(limit)\
                 .all()

    result = {
        'items': [item.to_dict() for item in items],
        'total': total,
        'page': page,
        'pages': (total + limit - 1) // limit
    }

    # Cacher (5 minutes pour une liste, moins stable)
    cache_svc.set(cache_key_str, result, ttl=CacheConfig.TTL_SEARCH)

    return result, 200


# ===== EXEMPLE 5: Multipart cache invalidation =====
@conversations_bp.route('/<int:conv_id>/close', methods=['POST'])
@token_required
def close_conversation(current_user, conv_id: int):
    """
    POST /api/v1/conversations/{id}/close

    Invalider multiples caches:
    - La conversation
    - Le listing lié
    - Le profil utilisateur
    """
    from src.services.cache_service import invalidate_cache, invalidate_user

    conv = Conversation.query.get(conv_id)
    if not conv:
        return {'error': 'Conversation not found'}, 404

    # Update
    conv.closed_at = datetime.utcnow()
    db.session.commit()

    # Invalider tous les caches impactés
    invalidate_cache(f"cache:conversation:{conv_id}:*")
    invalidate_user(current_user.id)  # Invalidate user profile
    invalidate_listing(conv.listing_id)  # Invalidate listing

    return {'status': 'closed'}, 200


# ===== EXAMPLE 6: Cache monitoring endpoint =====
@admin_bp.route('/cache/stats', methods=['GET'])
@admin_required
def get_cache_stats():
    """GET /api/v1/admin/cache/stats"""
    from src.services.cache_service import get_cache_stats

    stats = get_cache_stats()
    return stats, 200

@admin_bp.route('/cache/clear', methods=['POST'])
@admin_required
def clear_cache():
    """POST /api/v1/admin/cache/clear - DEBUG ONLY"""
    from src.services.cache_service import cache

    if cache.clear():
        return {'status': 'cleared', 'message': 'Redis cache vidé'}, 200
    else:
        return {'error': 'Failed to clear cache'}, 500


# ===== BOTTLENECKS À CACHER (Priorité) =====
"""
HAUTE PRIORITÉ (Cache 1h):
✅ GET /api/v1/annonces/{id}                     - Listing détail
✅ GET /api/v1/annonces/{id}/photos             - Photos
✅ GET /api/v1/users/{id}/profile               - Profil
✅ GET /api/v1/offres/{id}                       - Offer détail

MOYENNE PRIORITÉ (Cache 5min):
🔄 GET /api/v1/annonces?filter=...               - Search
🔄 GET /api/v1/users/{id}/listings               - User listings
🔄 GET /api/v1/offers/active                     - Active offers

BASSE PRIORITÉ (Cache 2min):
⏱️ GET /api/v1/notifications/unread              - Notifications
⏱️ GET /api/v1/conversations                     - Conversations
⏱️ GET /api/v1/messages/{conv_id}                - Messages

JAMAIS CACHER:
❌ POST/PUT/DELETE routes (invalidate instead)
❌ User-specific data (different per user)
❌ Real-time data (rankings, availability)
❌ Authenticated data with varying permissions
"""


# ===== INTEGRATION CHECKLIST =====
"""
Phase 3.2 - Redis Cache Implementation Checklist:

1. ✅ cache_service.py créé (RedisCache, @cached, helpers)
2. ✅ redis ajouté aux dépendances (requirements.txt)
3. ✅ Configuration Redis (.env.redis_example)
4. ⏭️ docker-compose.yml: Ajouter Redis service
5. ⏭️ app.py: Initialiser RedisCache au startup
6. ⏭️ routes/annonces.py: Ajouter @cached au get_annonce
7. ⏭️ routes/annonces.py: Invalider cache au PUT/DELETE
8. ⏭️ routes/users.py: Cacher les profils
9. ⏭️ routes/offres.py: Cacher les offres
10. ⏭️ Test + Validation

Temps estimé: 30 minutes pour intégration complète
Impact: 50-80% amélioration perf sur reads
"""
