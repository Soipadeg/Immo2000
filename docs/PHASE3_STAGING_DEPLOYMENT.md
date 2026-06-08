# 🚀 PHASE 3: STAGING DEPLOYMENT PLAN

**Status:** 🟡 READY TO EXECUTE  
**Estimated Duration:** 2 hours  
**Target Score:** 9/10 (Production Excellence)  
**Prerequisites:** Phase 1 & Phase 2 complete ✅

---

## 🎯 Phase 3 Objectives

1. **Build Production Docker Images** with cleaned dependencies
2. **Run Full Integration Tests** (backend + frontend)
3. **Validate Security Configuration** (CORS, headers, secrets)
4. **Perform Smoke Tests** on deployed services
5. **Establish Performance Baseline** for future monitoring
6. **Confirm Production Readiness** for live deployment

---

## 📋 Task Breakdown

### Task 1: Build Backend Docker Image (30 min)

#### Step 1a: Verify Dockerfile
```bash
# Check Dockerfile.backend
cat Dockerfile.backend | head -20

# Key requirements:
# - Uses Python 3.11+ 
# - Installs from requirements.txt
# - Exposes port 5000
# - Sets up gunicorn as production server
```

#### Step 1b: Build Image
```bash
cd /home/djali/code/Soipadeg/Immo2000

# Build backend image
docker build -f Dockerfile.backend -t immo2000-backend:latest .

# Verify build success
docker images | grep immo2000-backend
```

#### Step 1c: Verify Dependencies in Image
```bash
# Run image and check installed packages
docker run --rm immo2000-backend:latest pip list | head -20

# Expected: All 58 packages from requirements.txt
# Verify no duplicates or unused packages present
```

#### Acceptance Criteria:
- ✅ Docker build succeeds without errors
- ✅ All 58 packages installed
- ✅ Image size reasonable (< 2GB)
- ✅ No failed build steps

---

### Task 2: Build Frontend Docker Image (20 min)

#### Step 2a: Verify Dockerfile.frontend
```bash
cat Dockerfile.frontend | head -20

# Key requirements:
# - Uses Node.js 18+
# - Runs npm install
# - Runs npm build
# - Serves static files via nginx
```

#### Step 2b: Build Image
```bash
docker build -f Dockerfile.frontend -t immo2000-frontend:latest .

# Verify build success
docker images | grep immo2000-frontend
```

#### Step 2c: Check Build Output
```bash
# Verify build artifacts generated
docker run --rm -v /tmp/output:/output immo2000-frontend:latest \
  cp -r /app/build /output

# Expected: build/ directory with minified React app
```

#### Acceptance Criteria:
- ✅ Docker build succeeds
- ✅ npm dependencies installed (104 tests previously passed)
- ✅ Build completes without warnings
- ✅ Static assets generated

---

### Task 3: Docker Compose Staging Environment (30 min)

#### Step 3a: Verify docker-compose.yml
```bash
cat docker-compose.yml

# Must include:
# - backend service (port 5000)
# - frontend service (port 3000)
# - postgres database
# - redis cache
# - elasticsearch (optional but recommended)
```

#### Step 3b: Start Staging Environment
```bash
# Start services
docker-compose up -d

# Verify all services running
docker-compose ps

# Expected output:
# postgres  ✅ running
# redis     ✅ running
# backend   ✅ running
# frontend  ✅ running
```

#### Step 3c: Initialize Database
```bash
# Run migrations on fresh database
docker-compose exec backend flask db upgrade

# Seed test data (optional but recommended)
docker-compose exec backend python seed_database.py

# Verify tables created
docker-compose exec postgres psql -U postgres -d immo2000 -c "\dt"
```

#### Acceptance Criteria:
- ✅ All services start successfully
- ✅ Services communicate (no connection errors)
- ✅ Database migrations complete
- ✅ Services ready for testing

---

### Task 4: Backend Integration Tests (25 min)

#### Step 4a: Run Test Suite
```bash
cd backend

# Run all tests with coverage
pytest tests/ -v --cov=src --cov-report=html

# Expected: All tests pass (104 tests)
```

#### Step 4b: Check Coverage
```bash
# Coverage report should show:
# - src/app.py: > 90% coverage
# - src/routes/: > 85% coverage
# - src/models/: > 90% coverage
# - src/security/: > 85% coverage (Phase 6g)
```

#### Step 4c: Run Security Tests
```bash
# Verify security implementations
pytest tests/test_security.py -v

# Expected: All security tests pass (18+ tests)
# - 2FA tests
# - RGPD tests
# - Audit log tests
# - XSS protection tests
# - Rate limiting tests
```

#### Step 4d: Check API Endpoints
```bash
# Verify all endpoints accessible
curl http://localhost:5000/api/v1/health
# Expected: {"status": "ok"}

# Check Swagger documentation
curl http://localhost:5000/api/spec.json | head -20
# Expected: Valid OpenAPI specification
```

#### Acceptance Criteria:
- ✅ All tests pass (0 failures)
- ✅ Coverage >= 85% overall
- ✅ API endpoints responding
- ✅ Security endpoints working

---

### Task 5: Frontend Integration Tests (15 min)

#### Step 5a: Run Frontend Tests
```bash
cd frontend

# Run test suite
npm test -- --coverage --watchAll=false

# Expected: All tests pass (104 tests)
```

#### Step 5b: Build Production Bundle
```bash
# Create optimized production build
npm run build

# Check build size
du -sh build/

# Expected: < 5MB gzipped
```

#### Step 5c: Test Build Locally
```bash
# Serve production build locally
npx serve -s build

# Test in browser
curl http://localhost:3000
# Expected: HTML response with React app
```

#### Acceptance Criteria:
- ✅ All tests pass
- ✅ Build completes without warnings
- ✅ Build artifacts generated
- ✅ App loads in browser

---

### Task 6: Security Validation (40 min)

#### Step 6a: CORS Configuration
```bash
# Test CORS headers
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -v http://localhost:5000/api/v1/health

# Expected headers:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Methods: GET, POST, ...
```

#### Step 6b: Security Headers
```bash
# Verify Talisman headers
curl -i http://localhost:5000/api/v1/health | grep -i "X-"

# Expected:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
```

#### Step 6c: HTTPS/TLS (Staging Only)
```bash
# Check if running on HTTPS in staging
# Should have SSL certificate (self-signed OK for staging)
# In production, use Let's Encrypt

# For staging, certificate not required if behind proxy
```

#### Step 6d: Authentication
```bash
# Test JWT token generation
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Expected: Valid JWT token in response
# Verify token is signed and contains claims
```

#### Step 6e: 2FA/Security Features
```bash
# Test 2FA setup endpoint (Phase 6g)
curl -X POST http://localhost:5000/api/v1/security/2fa/setup \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Expected: 200 OK with QR code data
```

#### Step 6f: Rate Limiting
```bash
# Test rate limiting (5 requests/minute to login)
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' -s
  sleep 0.5
done

# Expected: 429 Too Many Requests after 5 attempts
```

#### Acceptance Criteria:
- ✅ CORS configured correctly
- ✅ Security headers present
- ✅ JWT authentication working
- ✅ 2FA setup accessible
- ✅ Rate limiting enforced
- ✅ No security warnings

---

### Task 7: Smoke Tests (20 min)

#### Step 7a: Basic Health Checks
```bash
# Backend health
curl -s http://localhost:5000/api/v1/health | jq .
# Expected: {"status": "ok", "version": "1.0.0"}

# Frontend health
curl -s http://localhost:3000 | head -c 100
# Expected: HTML with React app

# Database connectivity
curl -s http://localhost:5000/api/v1/db/health
# Expected: {"database": "connected"}

# Redis connectivity
curl -s http://localhost:5000/api/v1/cache/health
# Expected: {"cache": "connected"}
```

#### Step 7b: Core Feature Tests
```bash
# 1. User Authentication
curl -X POST http://localhost:5000/api/v1/auth/login

# 2. Listing Management
curl http://localhost:5000/api/v1/listings

# 3. Document Management
curl http://localhost:5000/api/v1/documents

# 4. Notifications
curl http://localhost:5000/api/v1/notifications/health

# All should return 200 OK (or expected HTTP status for valid request)
```

#### Step 7c: Error Handling
```bash
# Test 404 error
curl -i http://localhost:5000/api/v1/nonexistent
# Expected: 404 with proper error message

# Test 401 error (no auth)
curl -i http://localhost:5000/api/v1/user/profile
# Expected: 401 Unauthorized

# Test 500 error handling
# (Verify error doesn't expose sensitive info)
```

#### Acceptance Criteria:
- ✅ All health checks pass
- ✅ Core features accessible
- ✅ Error responses proper
- ✅ No stack traces exposed
- ✅ Response times < 500ms

---

### Task 8: Performance Baseline (15 min)

#### Step 8a: Load Testing
```bash
# Install load testing tool
pip install locust

# Create simple load test file (locustfile.py)
# 10 users, 5 second ramp-up, 1 minute duration

# Run test
locust -f locustfile.py --headless -u 10 -r 5 -t 1m

# Collect metrics:
# - Requests/second
# - Response time (avg, p95, p99)
# - Error rate
```

#### Step 8b: Database Query Performance
```bash
# Slow query log check
docker-compose logs postgres | grep "duration:"

# Analyze slow queries
# All queries should < 100ms for non-aggregations
```

#### Step 8c: Memory Usage
```bash
# Check backend memory usage
docker stats immo2000-backend --no-stream
# Expected: < 500MB

# Check frontend memory usage
docker stats immo2000-frontend --no-stream
# Expected: < 300MB
```

#### Step 8d: Disk Usage
```bash
# Check image sizes
docker images | grep immo2000

# Expected:
# - Backend: < 1.5GB
# - Frontend: < 500MB
```

#### Baseline Metrics to Record
```
- Average response time: _____ ms
- P95 response time: _____ ms
- Requests per second: _____ req/s
- Error rate: _____ %
- Backend memory: _____ MB
- Database connections: _____ /50
```

#### Acceptance Criteria:
- ✅ Baseline metrics established
- ✅ Performance within expected ranges
- ✅ Resource usage reasonable
- ✅ No memory leaks observed

---

### Task 9: Final Production Readiness Check (10 min)

#### Step 9a: Environment Configuration
```bash
# Verify .env.example has all required fields
grep -E "^[A-Z_]+=" .env.example | wc -l

# Expected: 30+ configuration variables
```

#### Step 9b: Dependency Lock
```bash
# Verify requirements.txt is stable
pip freeze > requirements.lock

# Check no unexpected versions
diff requirements.txt <(pip freeze) || echo "OK"
```

#### Step 9c: Git Status
```bash
# Verify all changes committed
git status

# Expected: "working tree clean"
```

#### Step 9d: Documentation Review
```bash
# Verify all docs exist
ls -1 docs/PHASE*.md

# Expected:
# - PHASE1_*.md
# - PHASE2_*.md
# - PHASE3_*.md (this file)
# - DEPLOYMENT_*.md
# - README.md
```

#### Acceptance Criteria:
- ✅ All configuration documented
- ✅ All changes tracked in git
- ✅ Deployment documentation complete
- ✅ Ready for production deployment

---

## 🔍 Verification Checklist

### Backend
- [ ] Docker image builds successfully
- [ ] All 58 dependencies installed
- [ ] Database migrations run
- [ ] 104+ tests pass
- [ ] API endpoints respond
- [ ] Security endpoints functional
- [ ] Swagger docs available

### Frontend
- [ ] Docker image builds successfully
- [ ] npm install completes
- [ ] 104 tests pass
- [ ] Production build succeeds
- [ ] App loads in browser
- [ ] No console errors
- [ ] Performance acceptable

### Infrastructure
- [ ] Docker Compose starts all services
- [ ] Services communicate
- [ ] Database accessible
- [ ] Redis accessible
- [ ] Elasticsearch available (optional)

### Security
- [ ] CORS headers correct
- [ ] Security headers present
- [ ] JWT authentication working
- [ ] 2FA setup endpoint working
- [ ] Rate limiting enforced
- [ ] No security vulnerabilities detected

### Performance
- [ ] Response times < 500ms
- [ ] Memory usage reasonable
- [ ] Database queries optimized
- [ ] Build artifacts small

### Readiness
- [ ] All code committed
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Production config prepared
- [ ] Team sign-off obtained

---

## 📊 Success Criteria

| Criterion | Target | Status |
|-----------|--------|--------|
| Docker builds | 2/2 successful | ⏳ |
| Tests passing | 100% (200+ total) | ⏳ |
| Coverage | >= 85% | ⏳ |
| Security headers | All present | ⏳ |
| CORS configured | Correct | ⏳ |
| Performance | <500ms avg | ⏳ |
| Errors | 0 critical | ⏳ |

---

## 🎯 Phase 3 Score Progression

| Metric | Before Ph3 | After Ph3 | Target |
|--------|-----------|----------|--------|
| Security | 8/10 | 8.5/10 | 8.5/10 ✅ |
| Performance | 8/10 | 8.5/10 | 8.5/10 ✅ |
| Testing | 8/10 | 9/10 | 9/10 ✅ |
| Deployment | 7/10 | 9/10 | 9/10 ✅ |
| **Overall** | **8/10** | **9/10** | **9/10** ✅ |

---

## 🚀 Post-Phase 3: Production Deployment

Once Phase 3 complete with all tests passing:

### Pre-Production Steps
1. Database backup
2. SSL certificate generation (Let's Encrypt)
3. Domain DNS configuration
4. Email service setup (SendGrid verification)
5. Payment service (Stripe) production keys
6. Monitoring setup (Sentry, Prometheus)

### Production Deployment
1. Push to production environment
2. Run database migrations
3. Deploy frontend CDN
4. Run smoke tests in production
5. Monitor for errors/performance
6. Team notification

### Post-Deployment
1. Monitor error logs (Sentry)
2. Check performance metrics (Prometheus)
3. User feedback collection
4. Incident response on standby

---

## ⏱️ Time Estimate

| Task | Estimated |
|------|-----------|
| 1. Backend Docker | 30 min |
| 2. Frontend Docker | 20 min |
| 3. Docker Compose | 30 min |
| 4. Backend Tests | 25 min |
| 5. Frontend Tests | 15 min |
| 6. Security Validation | 40 min |
| 7. Smoke Tests | 20 min |
| 8. Performance Baseline | 15 min |
| 9. Final Checks | 10 min |
| **Total** | **2h 25 min** |

**Contingency:** +30 min (if issues found and fixed)  
**Total with buffer:** ~3 hours

---

## 🎉 Success Outcome

Upon Phase 3 completion:

✅ **Production Readiness Score: 9/10**
- Security: Baseline established, all tests passing
- Performance: Baseline metrics established
- Testing: 100% coverage of critical paths
- Deployment: Docker images built and tested
- Documentation: Complete and reviewed

✅ **Ready for:**
- Live production deployment
- High-load testing
- User acceptance testing
- Customer go-live

---

## 📞 Troubleshooting Guide

### Docker Build Fails
```bash
# Clear Docker cache
docker system prune -a

# Rebuild with verbose output
docker build -f Dockerfile.backend -t immo2000-backend:latest . --progress=plain
```

### Tests Fail
```bash
# Run tests in isolation
pytest tests/test_security.py -v -s

# Check database state
docker-compose exec postgres psql -U postgres -d immo2000 -c "SELECT COUNT(*) FROM users;"
```

### Performance Issues
```bash
# Check database slow queries
docker-compose logs postgres | grep "duration"

# Check application logs
docker-compose logs backend | tail -50
```

### Security Issues
```bash
# Verify SSL certificate
openssl x509 -in /path/to/cert.pem -text -noout

# Check CORS policy
curl -H "Origin: http://example.com" -v http://localhost:5000
```

---

## 📝 Notes

- Phase 3 can run in parallel with final Phase 2 validation
- Docker images should be versioned (tag with git hash or version number)
- Keep baseline metrics for future performance comparisons
- Document any issues found for future improvements

---

**Created:** 2024  
**Phase:** 3/3  
**Status:** READY TO EXECUTE 🚀  
**Branch:** audit08  
**Prerequisites:** Phase 1 ✅ Phase 2 ✅

Next: Execute Phase 3 tasks sequentially
