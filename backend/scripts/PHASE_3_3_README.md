# Phase 3.3 : Rate Limiting Implementation

**Objectif**: Protéger les APIs contre les abus (brute force, DoS, resource abuse)
**Priorité**: 🔴 HAUTE (Sécurité + stabilité)
**Durée**: ~5-10 minutes setup + 15 minutes intégration

---

## 🎯 Architecture Rate Limiting

```
Client Request
    ↓
Global Rate Limit Check (1000 req/min per IP)
    ├─ EXCEEDED → 429 Too Many Requests ❌
    └─ OK ↓
        Action-Specific Rate Limit
        ├─ Login: 5 req/min per IP (Brute force protection)
        ├─ Register: 3 req/min per IP (Spam prevention)
        ├─ API: 100 req/min per user (Standard quota)
        ├─ Search: 30 req/min per user (Resource intensive)
        └─ Admin: 500 req/min per admin (High quota)
            ├─ EXCEEDED → 429 ❌
            └─ OK → Process Request ✅
```

---

## 📦 Composants Phase 3.3

### 1. **Rate Limiter Service** (`backend/src/services/rate_limiter.py`)
- ✅ RateLimiter class (Redis-backed)
- ✅ Décorateurs pour chaque type d'endpoint
- ✅ Global IP rate limiting (middleware)
- ✅ Per-user rate limiting (authenticated)
- ✅ Response headers X-RateLimit-*
- ✅ Flexible configuration

### 2. **Integration in app.py**
- ✅ `init_rate_limiting(app)` au startup
- ✅ Global @before_request check
- ✅ @after_request headers addition

### 3. **Configuration** (.env)
```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEBUG=false

# Auth (strict)
RATE_LIMIT_LOGIN=5
RATE_LIMIT_REGISTER=3
RATE_LIMIT_PWD_RESET=3

# User API
RATE_LIMIT_USER_API=100
RATE_LIMIT_SEARCH=30
RATE_LIMIT_MSG=50

# Admin
RATE_LIMIT_ADMIN=500

# Global
RATE_LIMIT_GLOBAL_IP=1000
RATE_LIMIT_WINDOW=60
```

---

## 🚀 Déploiement

### Phase 3.3.1: Vérifier Dépendances
```bash
# Redis doit être running (pour le rate limiting)
redis-cli ping
# Output: PONG

# Vérifier requirements.txt (redis doit être présent)
grep redis /home/djali/code/Soipadeg/Immo2000/backend/requirements.txt
```

### Phase 3.3.2: Configuration .env
```bash
# Ajouter à .env:
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN=5
RATE_LIMIT_REGISTER=3
RATE_LIMIT_USER_API=100
RATE_LIMIT_SEARCH=30
RATE_LIMIT_GLOBAL_IP=1000
```

### Phase 3.3.3: Tester Rate Limiting
```bash
# Test 1: Global rate limit (should allow many requests)
for i in {1..10}; do
  curl -s http://localhost:5000/health | grep status
done

# Test 2: Login brute force (5th attempt should fail)
for i in {1..7}; do
  echo "Attempt $i:" && \
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -s | python -m json.tool | grep -E '(error|message)'
done

# Expected: First 5 return 401, next 2 return 429 Too Many Requests

# Test 3: Check rate limit headers
curl -v http://localhost:5000/health 2>&1 | grep X-RateLimit
# Output:
# < X-RateLimit-Limit: 100
# < X-RateLimit-Remaining: 99
# < X-RateLimit-Reset: 2024-05-18T12:34:50
```

---

## 💾 Rate Limit Tiers

### 🔴 Tier 1: Brute Force Prevention (Strict)
```
Auth Endpoints:
├─ POST /auth/login             → 5 requests/minute per IP
├─ POST /auth/register          → 3 requests/minute per IP
└─ POST /auth/forgot-password   → 3 requests/minute per IP

Why: Prevent credential stuffing and account takeover
TTL: 1 minute
Action: IP-based (even before authentication)
```

### 🟠 Tier 2: Standard API Quota (User-based)
```
User Endpoints:
├─ GET  /api/v1/annonces        → 100 requests/minute per user
├─ POST /api/v1/annonces        → 100 requests/minute per user
├─ GET  /api/v1/messages        → 50 requests/minute per user
├─ POST /api/v1/messages/send   → 50 requests/minute per user
└─ GET  /api/v1/users/{id}      → 100 requests/minute per user

Why: Fair usage policy + prevent single user from monopolizing resources
TTL: 1 minute
Action: Per-user (after authentication)
```

### 🟡 Tier 3: Resource Intensive (Strict)
```
Expensive Endpoints:
├─ GET  /api/v1/search?q=...    → 30 requests/minute per user
├─ POST /api/v1/matching/find   → 20 requests/minute per user
└─ GET  /api/v1/estimations     → 10 requests/minute per user

Why: Prevent DB abuse (expensive queries)
TTL: 1 minute
Action: Per-user
```

### 🟢 Tier 4: Admin Endpoints (Relaxed)
```
Admin Actions:
├─ GET  /api/v1/admin/users     → 500 requests/minute per admin
├─ POST /api/v1/admin/actions   → 500 requests/minute per admin
└─ GET  /api/v1/admin/reports   → 500 requests/minute per admin

Why: Allow admins to perform bulk operations
TTL: 1 minute
Action: Per-user (admin only)
```

### 🔵 Tier 5: Global DoS Protection (Lenient)
```
Global Limit:
└─ ALL ENDPOINTS                → 1000 requests/minute per IP

Why: Prevent distributed denial of service attacks
TTL: 1 minute
Action: Per-IP (before any auth)
Impact: Only triggered if someone makes 1000+ requests/min
```

---

## 📊 Response Status Codes

### 200-299: Success
```
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 2024-05-18T12:34:50
Content-Type: application/json

{"data": "..."}
```

### 429: Too Many Requests
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-05-18T12:34:50
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "reset_time": "2024-05-18T12:34:50"
}
```

---

## 🧪 Testing & Validation

### Test 1: Brute Force Protection
```bash
#!/bin/bash
# Simulate 10 login attempts
for i in {1..10}; do
  echo "=== Attempt $i ==="
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"attacker@example.com","password":"wrong123"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 0.5
done

# Expected behavior:
# - Attempts 1-5: 401 Unauthorized
# - Attempts 6-10: 429 Too Many Requests
```

### Test 2: Search Quota
```bash
#!/bin/bash
# Simulate 40 search requests
for i in {1..40}; do
  echo "Request $i..."
  curl -s "http://localhost:5000/api/v1/search?q=apartment&page=$i" \
    -H "Authorization: Bearer <token>" \
    -w "Status: %{http_code}\n"
done

# Expected behavior:
# - Requests 1-30: 200 OK
# - Requests 31-40: 429 Too Many Requests
```

### Test 3: Different Users
```bash
# User A makes 50 requests
for i in {1..50}; do
  curl -H "Authorization: Bearer <token_user_a>" \
    http://localhost:5000/api/v1/annonces
done
# Last 10 should be 429

# User B makes 10 requests (should succeed)
for i in {1..10}; do
  curl -H "Authorization: Bearer <token_user_b>" \
    http://localhost:5000/api/v1/annonces
done
# All should be 200 (independent limit per user)
```

---

## ✅ Checklist Phase 3.3

- [x] rate_limiter.py créé (RateLimiter, decorators)
- [x] app.py: init_rate_limiting() called
- [ ] .env: Rate limit configuration added
- [ ] redis running (pour rate limit backend)
- [ ] Test login brute force (curl script)
- [ ] Test search quota (curl script)
- [ ] Integrate @rate_limit decorators in routes
- [ ] Git commit Phase 3.3
- [ ] Git push origin architecture-0.1

---

## 🎯 Integration Checklist (After Commit)

To complete Phase 3.3 integration:

1. **Add decorators to auth routes**:
   - `@rate_limit_login` on POST /auth/login
   - `@rate_limit_register` on POST /auth/register

2. **Add to search endpoints**:
   - `@rate_limit_search` on GET /search

3. **Add to message routes**:
   - `@rate_limit('message', limit=50)` on POST /messages/send

4. **Add to admin**:
   - `@rate_limit_admin` on /api/v1/admin/*

5. **Test thoroughly**:
   - Verify login attempts blocked after 5/min
   - Verify search blocked after 30/min
   - Verify headers returned correctly
   - Verify 429 responses when limit exceeded

---

## 📝 Notes

- **Redis**: Required for distributed rate limiting (across multiple backend instances)
- **IP Detection**: Supports X-Forwarded-For (for reverse proxies)
- **Graceful Degradation**: If Redis down, rate limiting disabled (but app continues)
- **Whitelist**: Can add IP whitelist in RateLimitConfig for testing
- **Monitoring**: Track in /api/v1/admin/rate-limit/stats (to be implemented)

---

## 🔗 Dependencies

- Redis (for distributed rate limiting) ✅
- FlaskGlobal context (g) ✅
- cache_service (RedisCache) ✅

---

## 🚀 Prochaines Étapes

**Phase 3.4**: Query Optimization (remaining routes)
**Phase 4**: Frontend State Management (Zustand)

---

## 📚 Resources

- [Redis Rate Limiting Pattern](https://redis.io/docs/latest/develop/use-cases/rate-limiting/)
- [HTTP 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
- [X-RateLimit Headers Standard](https://github.com/RateLimit/RateLimit-Specification)
