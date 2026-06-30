#!/bin/bash

###############################################################################
# Quick Wins Verification Script - Immo2000
#
# Vérifie que tous les 6 Quick Wins sont correctement implémentés
#
# Usage: bash scripts/verify-quick-wins.sh
#
###############################################################################

set -u  # Error on undefined variables only, don't fail on command errors

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

log_pass() { echo -e "${GREEN}✅${NC} $1"; ((PASSED++)); }
log_fail() { echo -e "${RED}❌${NC} $1"; ((FAILED++)); }
log_warn() { echo -e "${YELLOW}⚠️${NC}  $1"; ((WARNINGS++)); }
log_info() { echo -e "${BLUE}ℹ️${NC}  $1"; }
log_section() { echo -e "\n${BLUE}====== $1 ======${NC}\n"; }

# =====================================================
# Quick Win 1: Configuration Production
# =====================================================

check_config_production() {
    log_section "1️⃣  Configuration Production"

    # Check DEBUG flag
    if grep -q "DEBUG = False" backend/src/config.py; then
        log_pass "DEBUG = False configured"
    else
        log_fail "DEBUG not set to False"
    fi

    # Check Production Config class
    if grep -q "class ProductionConfig" backend/src/config.py; then
        log_pass "ProductionConfig class exists"
    else
        log_fail "ProductionConfig class missing"
    fi

    # Check Connection Pooling
    if grep -q "pool_size" backend/src/config.py; then
        log_pass "Connection pooling configured"
    else
        log_fail "Connection pooling NOT configured"
    fi

    # Check Session Security
    if grep -q "SESSION_COOKIE_SECURE" backend/src/config.py; then
        log_pass "Session cookie security configured"
    else
        log_fail "Session cookie security NOT configured"
    fi

    # Check LOG_LEVEL
    if grep -q 'LOG_LEVEL = os.getenv' backend/src/config.py; then
        log_pass "LOG_LEVEL configured"
    else
        log_fail "LOG_LEVEL NOT configured"
    fi
}

# =====================================================
# Quick Win 2: Rate Limiting
# =====================================================

check_rate_limiting() {
    log_section "2️⃣  Rate Limiting"

    # Check rate limiter file exists
    if [ -f "backend/src/services/rate_limiter.py" ]; then
        log_pass "Rate limiter module exists"
    else
        log_fail "Rate limiter module NOT found"
        return
    fi

    # Check it's initialized in app.py
    if grep -q "init_rate_limiting" backend/src/app.py; then
        log_pass "Rate limiting initialized in app.py"
    else
        log_fail "Rate limiting NOT initialized in app.py"
    fi

    # Check slowapi is in requirements
    if grep -q "slowapi" backend/requirements.txt; then
        log_pass "slowapi package in requirements.txt"
    else
        log_fail "slowapi package NOT in requirements.txt"
    fi
}

# =====================================================
# Quick Win 3: Alertes Sentry
# =====================================================

check_sentry() {
    log_section "3️⃣  Sentry Alerts"

    # Check sentry file exists
    if [ -f "backend/src/integrations/sentry.py" ]; then
        log_pass "Sentry integration module exists"
    else
        log_fail "Sentry integration module NOT found"
        return
    fi

    # Check it's initialized
    if grep -q "init_sentry" backend/src/app.py; then
        log_pass "Sentry initialized in app.py"
    else
        log_fail "Sentry NOT initialized in app.py"
    fi

    # Check sentry-sdk in requirements
    if grep -q "sentry-sdk" backend/requirements.txt; then
        log_pass "sentry-sdk in requirements.txt"
    else
        log_warn "sentry-sdk NOT in requirements.txt (optional)"
    fi

    # Check .env.production has SENTRY_DSN
    if [ -f ".env.production" ] && grep -q "SENTRY_DSN" .env.production; then
        log_pass ".env.production has SENTRY_DSN"
    else
        log_warn "SENTRY_DSN not configured in .env.production"
    fi
}

# =====================================================
# Quick Win 4: Tests Frontend CI/CD
# =====================================================

check_tests_frontend() {
    log_section "4️⃣  Tests Frontend"

    # Check package.json exists
    if [ -f "frontend/package.json" ]; then
        log_pass "package.json exists"
    else
        log_fail "package.json NOT found"
        return
    fi

    # Check npm scripts
    local scripts_to_check=("lint" "format" "test" "build" "format:check")
    for script in "${scripts_to_check[@]}"; do
        if grep -q "\"$script\":" frontend/package.json; then
            log_pass "npm script: $script"
        else
            log_warn "npm script: $script NOT found"
        fi
    done

    # Check test framework
    if grep -q "jest\|vitest" frontend/package.json; then
        log_pass "Test framework (jest/vitest) configured"
    else
        log_fail "Test framework NOT configured"
    fi

    # Check linter
    if grep -q "eslint" frontend/package.json; then
        log_pass "ESLint configured"
    else
        log_warn "ESLint NOT configured"
    fi
}

# =====================================================
# Quick Win 5: Security Scan CI/CD
# =====================================================

check_security_scan() {
    log_section "5️⃣  Security Scan"

    if [ ! -f ".github/workflows/deploy-phase6f.yml" ]; then
        log_fail "Workflow file NOT found"
        return
    fi

    # Check for security-scan job
    if grep -q "security-scan:" .github/workflows/deploy-phase6f.yml; then
        log_pass "security-scan job added"
    else
        log_fail "security-scan job NOT found"
        return
    fi

    # Check for Trivy
    if grep -q "trivy-action" .github/workflows/deploy-phase6f.yml; then
        log_pass "Trivy vulnerability scan configured"
    else
        log_warn "Trivy NOT configured"
    fi

    # Check for Snyk
    if grep -q "snyk/actions" .github/workflows/deploy-phase6f.yml; then
        log_pass "Snyk vulnerability scan configured"
    else
        log_warn "Snyk NOT configured"
    fi

    # Check for TruffleHog
    if grep -q "trufflesecurity/trufflehog" .github/workflows/deploy-phase6f.yml; then
        log_pass "TruffleHog secret detection configured"
    else
        log_warn "TruffleHog NOT configured"
    fi

    # Check test-frontend job exists
    if grep -q "test-frontend:" .github/workflows/deploy-phase6f.yml; then
        log_pass "test-frontend job added"
    else
        log_fail "test-frontend job NOT found"
    fi

    # Check dependencies
    if grep -q "needs: \[test-backend, test-frontend, security-scan\]" .github/workflows/deploy-phase6f.yml; then
        log_pass "build-images depends on all checks"
    else
        log_warn "build-images dependencies may not be correct"
    fi
}

# =====================================================
# Quick Win 6: CSRF Protection
# =====================================================

check_csrf() {
    log_section "6️⃣  CSRF Protection"

    # Check CSRF module exists
    if [ -f "backend/src/middleware/csrf_protection.py" ]; then
        log_pass "CSRF protection module exists"
    else
        log_fail "CSRF protection module NOT found"
        return
    fi

    # Check it's initialized
    if grep -q "init_csrf_protection" backend/src/app.py; then
        log_pass "CSRF protection initialized in app.py"
    else
        log_fail "CSRF protection NOT initialized in app.py"
    fi

    # Check Flask-WTF in requirements
    if grep -q "Flask-WTF" backend/requirements.txt; then
        log_pass "Flask-WTF in requirements.txt"
    else
        log_fail "Flask-WTF NOT in requirements.txt"
    fi
}

# =====================================================
# Overall Summary
# =====================================================

summary() {
    log_section "📊 Summary"

    local total=$((PASSED + FAILED + WARNINGS))
    local percentage=$((PASSED * 100 / total))

    echo "Checks Passed:  $PASSED/$total (${GREEN}${percentage}%${NC})"

    if [ $FAILED -gt 0 ]; then
        echo "Checks Failed:  ${RED}$FAILED${NC}"
    fi

    if [ $WARNINGS -gt 0 ]; then
        echo "Warnings:       ${YELLOW}$WARNINGS${NC}"
    fi

    echo ""

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All Quick Wins implemented correctly!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Run local tests: npm test (frontend), pytest (backend)"
        echo "2. Configure GitHub Secrets (SNYK_TOKEN, etc.)"
        echo "3. Push to main branch to trigger CI/CD pipeline"
        echo "4. Monitor first deployment in GitHub Actions"
        return 0
    else
        echo -e "${RED}❌ Some issues found - please review above${NC}"
        return 1
    fi
}

# =====================================================
# Main
# =====================================================

log_section "🔍 Immo2000 Quick Wins Verification"

check_config_production
check_rate_limiting
check_sentry
check_tests_frontend
check_security_scan
check_csrf

summary
exit $?
