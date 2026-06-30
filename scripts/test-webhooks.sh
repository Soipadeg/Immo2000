#!/bin/bash

###############################################################################
# Webhook Testing Guide for Immo2000 Production
#
# This script contains examples and guidelines for testing:
# 1. Stripe Payment Webhooks
# 2. DocuSign eSignature Webhooks
#
# Usage:
#   # Test Stripe webhook locally
#   ./test-webhooks.sh stripe-test
#
#   # Test DocuSign webhook locally
#   ./test-webhooks.sh docusign-test
#
###############################################################################

set -euo pipefail

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
API_VERSION="v1"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_section() { echo -e "\n${BLUE}====== $1 ======${NC}\n"; }

# =====================================================
# STRIPE WEBHOOK TESTING
# =====================================================

test_stripe_webhook_local() {
    log_section "Testing Stripe Webhook (Local)"

    log_info "Prerequisites:"
    log_info "1. Start your backend: python backend/run_server.py"
    log_info "2. Get your Stripe Secret Key from .env.production"
    log_info ""

    # Test payment_intent.succeeded event
    log_info "Testing payment_intent.succeeded event..."

    curl -X POST "${BACKEND_URL}/api/${API_VERSION}/paiements/webhook/stripe" \
        -H "Content-Type: application/json" \
        -H "Stripe-Signature: test_signature" \
        -d '{
            "id": "evt_test_123",
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_test_123",
                    "amount": 10000,
                    "currency": "eur",
                    "metadata": {
                        "annonce_id": "1",
                        "user_id": "1"
                    }
                }
            }
        }' | jq .

    log_info "✅ Event sent"
}

test_stripe_webhook_stripe_cli() {
    log_section "Testing Stripe Webhook with Stripe CLI (Recommended)"

    log_info "Installation:"
    log_info "1. Download Stripe CLI: https://stripe.com/docs/stripe-cli"
    log_info "2. Login: stripe login"
    log_info "3. Forward events: stripe listen --forward-to localhost:5000/api/v1/paiements/webhook/stripe"
    log_info ""

    log_info "Then in another terminal, trigger test event:"
    log_info "stripe trigger payment_intent.succeeded"
    log_info ""

    log_warn "This is the RECOMMENDED method for testing"
    log_info "Stripe CLI simulates real webhook behavior including signatures"
}

test_stripe_webhook_sandbox() {
    log_section "Stripe Sandbox Testing"

    log_info "For full end-to-end testing in staging:"
    log_info ""
    log_info "1. Use Stripe Test Cards:"
    log_info "   - Visa: 4242 4242 4242 4242"
    log_info "   - Amex: 3782 822463 10005"
    log_info "   - Declined: 4000 0000 0000 0002"
    log_info ""

    log_info "2. Configure webhook endpoint:"
    log_info "   - Stripe Dashboard → Developers → Webhooks"
    log_info "   - Add Endpoint: https://staging.immo2000.fr/api/v1/paiements/webhook/stripe"
    log_info "   - Select events: payment_intent.succeeded, payment_intent.payment_failed"
    log_info ""

    log_info "3. Make a test payment in staging"
    log_info "4. Check webhook delivery in Stripe Dashboard"
    log_info ""
}

# =====================================================
# DOCUSIGN WEBHOOK TESTING
# =====================================================

test_docusign_webhook_local() {
    log_section "Testing DocuSign Webhook (Local)"

    log_info "Prerequisites:"
    log_info "1. Backend running with DocuSign credentials in .env"
    log_info "2. ngrok or similar tool to expose local server"
    log_info ""

    # Test envelope_sent event
    log_info "Testing envelope_sent event..."

    curl -X POST "${BACKEND_URL}/api/${API_VERSION}/documents/webhook/docusign" \
        -H "Content-Type: application/json" \
        -d '{
            "eventNotification": {
                "envelopeId": "test_envelope_123",
                "status": "sent",
                "statusDateTime": "2024-06-26T10:00:00Z",
                "recipientStatuses": [{
                    "email": "test@example.com",
                    "status": "sent"
                }]
            }
        }' | jq .

    log_info "✅ Event sent"
}

test_docusign_webhook_sandbox() {
    log_section "DocuSign Sandbox Testing"

    log_info "1. Create DocuSign developer account (free):"
    log_info "   https://developer.docusign.com"
    log_info ""

    log_info "2. Create a test envelope with your app"
    log_info ""

    log_info "3. Configure webhook in DocuSign:"
    log_info "   - Admin → Connect → Connect"
    log_info "   - Add webhook URL: https://staging.immo2000.fr/api/v1/documents/webhook/docusign"
    log_info "   - Select events: envelope-sent, envelope-complete, recipient-sign-complete"
    log_info ""

    log_info "4. Trigger events in sandbox and monitor webhook delivery"
    log_info ""
}

# =====================================================
# DEBUGGING WEBHOOKS
# =====================================================

debug_webhook_logs() {
    log_section "Debugging Webhook Issues"

    log_info "Check Flask logs:"
    log_info "tail -f logs/flask.log | grep -i webhook"
    log_info ""

    log_info "Check webhook requests:"
    log_info "grep -i 'webhook' logs/access.log | tail -20"
    log_info ""

    log_info "Database query for webhook events:"
    log_info "SELECT * FROM audit_logs WHERE action LIKE '%webhook%' ORDER BY created_at DESC LIMIT 10;"
    log_info ""
}

verify_webhook_signature() {
    log_section "Verifying Webhook Signatures"

    log_info "For Stripe:"
    log_info "- Use STRIPE_WEBHOOK_SECRET from .env"
    log_info "- Verify HMAC-SHA256(payload, secret) == Stripe-Signature header"
    log_info ""

    log_info "For DocuSign:"
    log_info "- Implement XML signature verification"
    log_info "- Validate sender IP whitelist"
    log_info "- Check timestamp to prevent replay attacks"
    log_info ""
}

# =====================================================
# PRODUCTION CHECKLIST
# =====================================================

production_webhook_checklist() {
    log_section "Production Webhook Checklist"

    echo "[ ] Stripe webhook endpoint registered in production account"
    echo "[ ] DocuSign webhook endpoint registered in production account"
    echo "[ ] All webhook secrets loaded from secure environment variables"
    echo "[ ] Webhook signature verification enabled"
    echo "[ ] Retry logic implemented for failed webhook processing"
    echo "[ ] Database logging of all webhook events"
    echo "[ ] Monitoring/alerting for webhook failures"
    echo "[ ] Rate limiting configured for webhook endpoints"
    echo "[ ] Timeout handling implemented"
    echo "[ ] Idempotency keys used to prevent duplicate processing"
    echo ""
}

# =====================================================
# MAIN
# =====================================================

case "${1:-help}" in
    stripe-test)
        test_stripe_webhook_local
        test_stripe_webhook_stripe_cli
        ;;
    stripe-sandbox)
        test_stripe_webhook_sandbox
        ;;
    docusign-test)
        test_docusign_webhook_local
        test_docusign_webhook_sandbox
        ;;
    debug)
        debug_webhook_logs
        verify_webhook_signature
        ;;
    checklist)
        production_webhook_checklist
        ;;
    all)
        test_stripe_webhook_local
        test_stripe_webhook_stripe_cli
        test_stripe_webhook_sandbox
        test_docusign_webhook_local
        test_docusign_webhook_sandbox
        debug_webhook_logs
        verify_webhook_signature
        production_webhook_checklist
        ;;
    *)
        log_section "Webhook Testing Guide"
        echo "Usage: $0 {stripe-test|stripe-sandbox|docusign-test|debug|checklist|all|help}"
        echo ""
        echo "Commands:"
        echo "  stripe-test       - Test Stripe webhooks locally"
        echo "  stripe-sandbox    - Stripe sandbox testing guide"
        echo "  docusign-test     - Test DocuSign webhooks locally"
        echo "  debug             - Debugging webhook issues"
        echo "  checklist         - Production checklist"
        echo "  all               - Run all tests and guides"
        echo "  help              - Show this help message"
        ;;
esac
