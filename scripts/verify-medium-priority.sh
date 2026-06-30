#!/bin/bash

# Script to verify Password Policy & Audit Logs implementation
# Usage: bash scripts/verify-medium-priority.sh

set -u

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║  🔐 PASSWORD POLICY & AUDIT LOGS - VERIFICATION SCRIPT                 ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_DIR="/home/djali/code/Soipadeg/Immo2000"
BACKEND_DIR="$PROJECT_DIR/backend"
CHECKS_PASSED=0
CHECKS_TOTAL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    local file=$1
    local description=$2
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        echo "  📄 $file"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        echo "  📄 $file (NOT FOUND)"
        return 1
    fi
}

check_file_contains() {
    local file=$1
    local pattern=$2
    local description=$3
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        return 1
    fi
}

echo "📋 CHECKING FILES CREATED..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Password validator
check_file "$BACKEND_DIR/src/validators/password.py" "Password Validator"
check_file_contains "$BACKEND_DIR/src/validators/password.py" "class PasswordValidator" "PasswordValidator class"
check_file_contains "$BACKEND_DIR/src/validators/password.py" "def validate" "validate() method"
check_file_contains "$BACKEND_DIR/src/validators/password.py" "def get_strength_score" "get_strength_score() method"

echo ""

# Audit models
check_file "$BACKEND_DIR/src/models/audit.py" "Audit Models"
check_file_contains "$BACKEND_DIR/src/models/audit.py" "class AuditLog" "AuditLog model"
check_file_contains "$BACKEND_DIR/src/models/audit.py" "class SecurityEvent" "SecurityEvent model"
check_file_contains "$BACKEND_DIR/src/models/audit.py" "class AuditActionType" "AuditActionType enum"

echo ""

# Audit decorators
check_file "$BACKEND_DIR/src/decorators/audit.py" "Audit Decorators"
check_file_contains "$BACKEND_DIR/src/decorators/audit.py" "def audit_action" "audit_action decorator"
check_file_contains "$BACKEND_DIR/src/decorators/audit.py" "def track_changes" "track_changes decorator"

echo ""

# Admin routes
check_file "$BACKEND_DIR/src/routes/admin_audit.py" "Admin Audit Routes"
check_file_contains "$BACKEND_DIR/src/routes/admin_audit.py" "def get_audit_logs" "get_audit_logs endpoint"
check_file_contains "$BACKEND_DIR/src/routes/admin_audit.py" "def get_security_events" "get_security_events endpoint"
check_file_contains "$BACKEND_DIR/src/routes/admin_audit.py" "def export_audit_logs" "export_audit_logs endpoint"

echo ""

# Tests
check_file "$BACKEND_DIR/tests/test_password_and_audit.py" "Unit Tests"
check_file_contains "$BACKEND_DIR/tests/test_password_and_audit.py" "class TestPasswordValidator" "Password tests"
check_file_contains "$BACKEND_DIR/tests/test_password_and_audit.py" "class TestAuditLogging" "Audit logging tests"

echo ""

# Migration
check_file "$BACKEND_DIR/migrations/versions/002_add_audit_tables.py" "Database Migration"
check_file_contains "$BACKEND_DIR/migrations/versions/002_add_audit_tables.py" "def upgrade" "Migration upgrade function"

echo ""

# Documentation
check_file "$PROJECT_DIR/docs/PASSWORD_AND_AUDIT_INTEGRATION.md" "Integration Guide"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 CHECKING CODE QUALITY..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "MIN_LENGTH = 12" "$BACKEND_DIR/src/validators/password.py"; then
    echo -e "${GREEN}✓${NC} Password minimum length is 12 characters"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Password minimum length not configured"
fi

CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "REQUIRE_UPPERCASE = True" "$BACKEND_DIR/src/validators/password.py"; then
    echo -e "${GREEN}✓${NC} Password requires uppercase"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Uppercase requirement missing"
fi

CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "REQUIRE_SPECIAL = True" "$BACKEND_DIR/src/validators/password.py"; then
    echo -e "${GREEN}✓${NC} Password requires special characters"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Special character requirement missing"
fi

CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "AuditActionType" "$BACKEND_DIR/src/models/audit.py"; then
    count=$(grep -c "= \"" "$BACKEND_DIR/src/models/audit.py")
    if [ "$count" -ge 15 ]; then
        echo -e "${GREEN}✓${NC} Audit action types defined ($count actions)"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠${NC} Only $count audit action types (expected 15+)"
    fi
else
    echo -e "${RED}✗${NC} AuditActionType not found"
fi

CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "__table_args__" "$BACKEND_DIR/src/models/audit.py"; then
    echo -e "${GREEN}✓${NC} Audit tables have indexes"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Table indexes not configured"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 FINAL RESULTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PERCENTAGE=$((CHECKS_PASSED * 100 / CHECKS_TOTAL))

echo "Checks Passed: $CHECKS_PASSED / $CHECKS_TOTAL ($PERCENTAGE%)"
echo ""

if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Apply database migration: flask db upgrade"
    echo "  2. Register blueprint in app.py"
    echo "  3. Run tests: pytest backend/tests/test_password_and_audit.py -v"
    echo "  4. Deploy to staging"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME CHECKS FAILED${NC}"
    echo ""
    echo "Please review the failed checks above and try again."
    echo ""
    exit 1
fi
