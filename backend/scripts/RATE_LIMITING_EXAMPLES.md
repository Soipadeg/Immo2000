"""
Phase 3.3: Rate Limiting Configuration & Examples

Protéger les APIs contre les abus:
- Brute force attacks (login)
- DoS attacks (global IP limit)
- Resource abuse (search, messages)
- Admin overload
"""

# .env CONFIGURATION
"""
RATE_LIMIT_ENABLED=true              # Enable/disable globally
RATE_LIMIT_DEBUG=false               # Verbose logging

# Auth endpoints (strict)
RATE_LIMIT_LOGIN=5                   # 5 attempts/min per IP
RATE_LIMIT_REGISTER=3                # 3 attempts/min per IP
RATE_LIMIT_PWD_RESET=3               # 3 attempts/min per IP

# User API (standard quota)
RATE_LIMIT_USER_API=100              # 100 req/min per user
RATE_LIMIT_SEARCH=30                 # 30 searches/min per user
RATE_LIMIT_MSG=50                    # 50 messages/min per user

# Admin (higher quota)
RATE_LIMIT_ADMIN=500                 # 500 req/min per admin

# Global (DoS protection)
RATE_LIMIT_GLOBAL_IP=1000            # 1000 req/min per IP

# Timeframe
RATE_LIMIT_WINDOW=60                 # 1 minute
"""

# ===== EXAMPLE 1: Rate limit login endpoint =====
from src.services.rate_limiter import rate_limit_login
from src.auth.models import db, User

@login_bp.route('/login', methods=['POST'])
@rate_limit_login  # Protéger contre brute force (5 attempts/min)
def login_endpoint():
    """
    POST /api/v1/auth/login

    Rate limit: 5 attempts per minute per IP

    Si limit dépassé: 429 Too Many Requests
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Validation
    user = User.query.filter_by(email=email).first()
    if not user or not user.verify_password(password):
        return {'error': 'Invalid credentials'}, 401

    return create_jwt_token(user), 200


# ===== EXAMPLE 2: Rate limit register endpoint =====
from src.services.rate_limiter import rate_limit_register

@register_bp.route('/register', methods=['POST'])
@rate_limit_register  # Protect: 3 attempts/min per IP
def register_endpoint():
    """
    POST /api/v1/auth/register

    Rate limit: 3 attempts per minute per IP
    Prevents spam account creation
    """
    data = request.get_json()

    # Validation & creation
    user = User(email=data['email'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    return {'user_id': user.id}, 201


# ===== EXAMPLE 3: Rate limit API endpoint (decorator) =====
from src.services.rate_limiter import rate_limit_api

@annonces_bp.route('', methods=['GET'])
@rate_limit_api  # Standard API limit (100 req/min per user)
def list_annonces():
    """
    GET /api/v1/annonces?page=1

    Rate limit: 100 requests per minute per authenticated user
    """
    page = request.args.get('page', 1, type=int)

    annonces = Annonce.query.paginate(page=page, per_page=20)

    return {
        'items': [a.to_dict() for a in annonces.items],
        'total': annonces.total
    }, 200


# ===== EXAMPLE 4: Rate limit search (strict) =====
from src.services.rate_limiter import rate_limit_search

@search_bp.route('/search', methods=['GET'])
@rate_limit_search  # Search limit (30 searches/min per user)
def search_listings():
    """
    GET /api/v1/search?q=paris&type=apartment

    Rate limit: 30 searches per minute per user
    (Stricter than standard API to prevent resource abuse)
    """
    query = request.args.get('q')

    # Expensive query
    results = perform_complex_search(query)

    return {'results': results}, 200


# ===== EXAMPLE 5: Rate limit with custom limit =====
from src.services.rate_limiter import rate_limit

@admin_bp.route('/users', methods=['GET'])
@rate_limit('admin', limit=500)  # Custom limit for admin
def list_users():
    """
    GET /api/v1/admin/users

    Rate limit: 500 requests per minute (custom admin limit)
    """
    users = User.query.all()
    return {'items': [u.to_dict() for u in users]}, 200


# ===== EXAMPLE 6: Manual rate limit check =====
from flask import g
from src.services.rate_limiter import RateLimiter, RateLimitExceeded

@messages_bp.route('/send', methods=['POST'])
@token_required
def send_message(current_user):
    """
    POST /api/v1/messages/send

    Manual rate limit check
    """
    limiter = g.rate_limiter

    # Check if allowed
    allowed, info = limiter.is_allowed('message', limit=50)

    if not allowed:
        raise RateLimitExceeded(info)

    # Send message
    message = Message(...)
    db.session.add(message)
    db.session.commit()

    return message.to_dict(), 201


# ===== RATE LIMIT STRATEGY BY ENDPOINT =====

"""
STRICT LIMITS (Brute force prevention):
├─ POST /auth/login         → 5 req/min per IP
├─ POST /auth/register      → 3 req/min per IP
└─ POST /auth/forgot-password → 3 req/min per IP

MEDIUM LIMITS (Standard API quota):
├─ GET /api/annonces        → 100 req/min per user
├─ POST /api/annonces       → 100 req/min per user
├─ GET /api/messages        → 50 req/min per user
├─ POST /api/messages/send  → 50 req/min per user
├─ GET /api/search          → 30 req/min per user
└─ GET /api/users           → 100 req/min per user

HIGH LIMITS (Admin):
├─ GET /api/admin/users     → 500 req/min per admin
├─ POST /api/admin/actions  → 500 req/min per admin
└─ GET /api/admin/reports   → 500 req/min per admin

GLOBAL LIMIT (DoS protection):
└─ * (all endpoints)        → 1000 req/min per IP
"""


# ===== RESPONSE HEADERS =====

"""
Success Response (200-299):
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 2024-05-18T12:34:50

Rate Limited Response (429):
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "reset_time": "2024-05-18T12:34:50"
}
"""


# ===== TESTING RATE LIMITS =====

"""
Test login brute force protection:
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \\
    -H "Content-Type: application/json" \\
    -d '{"email": "test@example.com", "password": "wrong"}'
done

# Expected: First 5 succeed, next 5 return 429

Test search quota:
for i in {1..50}; do
  curl http://localhost:5000/api/v1/search?q=test
done

# Expected: First 30 succeed, next 20 return 429
"""


# ===== CONFIGURATION CHECKLIST =====

"""
Phase 3.3 - Rate Limiting Checklist:

1. ✅ rate_limiter.py créé (RateLimiter, decorators)
2. ✅ app.py: init_rate_limiting() appelé
3. ⏭️ .env: Ajouter RATE_LIMIT_* config
4. ⏭️ auth/login.py: @rate_limit_login
5. ⏭️ auth/register.py: @rate_limit_register
6. ⏭️ routes/search.py: @rate_limit_search
7. ⏭️ routes/messages.py: @rate_limit ('message', limit=50)
8. ⏭️ routes/admin/: @rate_limit_admin
9. ⏭️ Test avec curl/Postman
10. ⏭️ Git commit

Temps estimé: 15 minutes pour intégration complète
Impact: Protège contre abus et DoS attacks
"""


# ===== MONITORING RATE LIMITS =====

"""
Endpoint pour statistiques rate limit (Admin):

GET /api/v1/admin/rate-limit/stats

Response:
{
  "total_requests": 15482,
  "rate_limited_requests": 23,
  "rate_limit_percentage": 0.15,
  "top_limited_ips": [
    {"ip": "192.168.1.100", "limit_hits": 15},
    {"ip": "10.0.0.5", "limit_hits": 8}
  ],
  "top_limited_users": [
    {"user_id": 42, "limit_hits": 12},
    {"user_id": 7, "limit_hits": 5}
  ]
}
"""
