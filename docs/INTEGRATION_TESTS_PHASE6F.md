# Phase 6f Integration Test Suite

**Status**: Ready for implementation
**Scope**: End-to-end testing, DocuSign webhook integration, email verification

---

## 🎯 Test Objectives

1. **End-to-End Workflow**: Complete transaction from creation to signature completion
2. **DocuSign Integration**: Envelope creation → Event callbacks → Status updates
3. **Email Notifications**: All parties receive appropriate emails
4. **Database Consistency**: Transaction state matches DocuSign state
5. **Error Handling**: Graceful handling of edge cases and timeouts

---

## 📋 Test Categories

### Category 1: Webhook Event Handling

```python
# tests/integration/test_webhook_docusign_events.py

def test_envelope_created_event():
    """Verify webhook accepts envelope.created event"""
    # Given: DocuSign webhook payload for new envelope
    # When: POST /api/v1/webhooks/docusign/envelope-status
    # Then: Response 200, transaction status = "compromis_envoye"

def test_envelope_sent_event():
    """Verify envelope sent updates status"""
    # Given: Envelope in DocuSign with status "sent"
    # When: Webhook receives envelope.sent event
    # Then: TransactionNotaire.statut = "compromis_envoye_confirme"

def test_envelope_completed_event():
    """Verify all signatories signed triggers completion"""
    # Given: All recipients have signed
    # When: Webhook receives envelope.completed event
    # Then:
    #   - TransactionNotaire.statut = "finalisee"
    #   - HistoriqueNotaire entry created
    #   - Completion emails sent to all parties

def test_envelope_declined_event():
    """Verify decline updates status and notifies parties"""
    # Given: Recipient declined to sign
    # When: Webhook receives envelope.declined event
    # Then:
    #   - TransactionNotaire.statut = "signature_refusee"
    #   - Declined email sent
    #   - Reason stored in database

def test_envelope_voided_event():
    """Verify voided envelope cancels transaction"""
    # Given: Envelope voided in DocuSign
    # When: Webhook receives envelope.voided event
    # Then: TransactionNotaire.statut = "compromis_annule"

def test_webhook_missing_envelope():
    """Verify graceful handling of unknown envelope"""
    # Given: Webhook for envelope not in database
    # When: POST /api/v1/webhooks/docusign/envelope-status
    # Then: Response 200, status = "ignored"

def test_webhook_invalid_payload():
    """Verify validation of webhook payload"""
    # Given: Malformed JSON payload
    # When: POST /api/v1/webhooks/docusign/envelope-status
    # Then: Response 400 with error details
```

### Category 2: DocuSign Envelope Creation

```python
# tests/integration/test_docusign_envelope_creation.py

def test_create_compromis_document():
    """Verify PDF generation for compromis"""
    # Given: Transaction with all required data
    # When: POST /api/v1/notaire/{id}/generate-compromis
    # Then:
    #   - PDF generated and stored in S3
    #   - URL stored in TransactionNotaire.compromis_url

def test_send_to_docusign():
    """Verify envelope creation and sending"""
    # Given: PDF compromis exists
    # When: POST /api/v1/notaire/{id}/send-to-docusign
    # Then:
    #   - DocuSign API called successfully
    #   - Envelope ID stored
    #   - Status = "compromis_envoye"
    #   - Notification emails sent to signatories

def test_docusign_recipient_configuration():
    """Verify correct recipients and signing order"""
    # Given: Three parties (acheteur, vendeur, notaire)
    # When: Envelope created
    # Then:
    #   - Acheteur is first signer
    #   - Vendeur is second signer
    #   - Notaire receives copy (no signature)
    #   - Sign/initial tabs configured on document
```

### Category 3: Email Notifications

```python
# tests/integration/test_email_notifications.py

@mock.patch('app_fastapi.services.sendgrid_service.send_email')
def test_send_completion_emails(mock_send):
    """Verify all parties get completion notification"""
    # Given: Completed transaction
    # When: Webhook processes completion event
    # Then:
    #   - mock_send called 3 times (acheteur, vendeur, notaire)
    #   - Email templates correct
    #   - Links to signed document included

@mock.patch('app_fastapi.services.sendgrid_service.send_email')
def test_send_decline_emails(mock_send):
    """Verify decline notifications sent"""
    # Given: Declined transaction
    # When: Webhook processes declined event
    # Then:
    #   - All parties notified
    #   - Reason included in email

@mock.patch('app_fastapi.services.sendgrid_service.send_email')
def test_send_signature_request_emails(mock_send):
    """Verify initial signature request emails"""
    # Given: Envelope sent to signatories
    # When: POST /api/v1/notaire/{id}/send-to-docusign
    # Then:
    #   - Signature request emails sent
    #   - DocuSign signing links included
```

### Category 4: Database Transaction Consistency

```python
# tests/integration/test_database_consistency.py

def test_transaction_state_tracking():
    """Verify all state changes logged"""
    # Given: Transaction through full lifecycle
    # When: Multiple state changes occur
    # Then:
    #   - HistoriqueNotaire has 5+ entries
    #   - date_action correct for each
    #   - action type matches state change

def test_concurrent_webhook_handling():
    """Verify handling of simultaneous webhooks"""
    # Given: Two webhook requests for same envelope
    # When: Both received within 1 second
    # Then:
    #   - No race condition
    #   - Final state correct
    #   - No duplicate audit entries

def test_date_fields_populated():
    """Verify all date fields set correctly"""
    # Given: Transaction through completion
    # Then:
    #   - date_validation_frais set when fees calculated
    #   - compromis_genere_le set when PDF created
    #   - date_envoi_signature set when sent
    #   - (date_action set for each audit entry)
```

### Category 5: Error Handling & Resilience

```python
# tests/integration/test_error_handling.py

def test_webhook_timeout_retry():
    """Verify retry logic for timeouts"""
    # Given: External service timeout
    # When: Webhook processed
    # Then:
    #   - Transaction remains consistent
    #   - No partial state
    #   - Retry can be triggered manually

def test_invalid_email_handling():
    """Verify graceful handling of invalid emails"""
    # Given: Recipient with invalid email
    # When: Completion emails sent
    # Then:
    #   - SendGrid error logged
    #   - Transaction not marked as failed
    #   - Admin notified

def test_docusign_api_error():
    """Verify handling of DocuSign errors"""
    # Given: DocuSign API returns error
    # When: Envelope creation attempted
    # Then:
    #   - Error logged with request/response
    #   - User-friendly error message
    #   - Transaction not partially updated

def test_database_connection_error():
    """Verify handling of database errors"""
    # Given: Database temporarily unavailable
    # When: Webhook processed
    # Then:
    #   - Request queued for retry
    #   - 503 returned to DocuSign
    #   - No data loss
```

### Category 6: Security Tests

```python
# tests/integration/test_security.py

def test_webhook_signature_validation():
    """Verify webhook authenticity"""
    # Given: Invalid webhook signature
    # When: POST /api/v1/webhooks/docusign/envelope-status
    # Then: 401 Unauthorized

def test_unauthorized_access():
    """Verify endpoint protection"""
    # Given: Request without auth token
    # When: POST /api/v1/notaire/{id}/send-to-docusign
    # Then: 401 Unauthorized

def test_user_isolation():
    """Verify users can't access others' transactions"""
    # Given: User A's transaction
    # When: User B tries to access
    # Then: 403 Forbidden

def test_pdf_generation_injection():
    """Verify no HTML injection in PDF generation"""
    # Given: Transaction with malicious data
    # When: PDF generated
    # Then: Malicious content escaped/rendered safely
```

---

## 🏃 Running the Tests

### Unit Tests (Current)

```bash
# Backend tests
cd backend
pytest tests/fastapi/test_webhooks_phase6g.py -v

# With coverage
pytest tests/ --cov=app_fastapi --cov-report=html
```

### Integration Tests (To Implement)

```bash
# All integration tests
pytest tests/integration/ -v --tb=short

# Specific category
pytest tests/integration/test_webhook_docusign_events.py -v

# With fixtures
pytest tests/integration/ -v --fixtures

# Performance profiling
pytest tests/integration/ -v --durations=10
```

### End-to-End Tests (Manual)

```bash
# Staging environment
curl -X POST http://staging.immo2000.fr/api/v1/notaire/1/generate-compromis
# Download and verify PDF

# Send to DocuSign (staging)
curl -X POST http://staging.immo2000.fr/api/v1/notaire/1/send-to-docusign

# Simulate webhook from DocuSign
curl -X POST http://staging.immo2000.fr/api/v1/webhooks/docusign/envelope-status \
  -H "Content-Type: application/json" \
  -d '{
    "envelopeId": "test-envelope",
    "status": "completed",
    "recipientStatuses": [...]
  }'

# Verify database
docker-compose exec postgres psql -U postgres -d immo2000 \
  -c "SELECT * FROM transaction_notaire WHERE docusign_envelope_id='test-envelope';"
```

---

## 📊 Test Coverage Goals

| Category | Current | Target | Priority |
|----------|---------|--------|----------|
| Webhook Events | 3/5 ✅ | 8/8 | HIGH |
| Email Notifications | 0/3 | 3/3 | HIGH |
| Database Consistency | 1/3 | 3/3 | MEDIUM |
| DocuSign Integration | 1/3 | 3/3 | HIGH |
| Error Handling | 0/4 | 4/4 | MEDIUM |
| Security | 0/4 | 4/4 | HIGH |
| **Total** | **5/22** | **25/25** | **100%** |

---

## 🔄 Implementation Order

1. **Phase 1** (Week 1): Webhook event tests + email notification tests
2. **Phase 2** (Week 2): Database consistency + DocuSign integration tests
3. **Phase 3** (Week 3): Error handling + security tests + performance tests
4. **Phase 4** (Week 4): End-to-end testing + staging validation

---

## 🛠️ Tools & Fixtures

```python
# conftest.py fixtures for integration tests

@pytest.fixture
def docusign_client(monkeypatch):
    """Mock DocuSign client"""
    # Returns configured mock for all DocuSign API calls

@pytest.fixture
def sendgrid_client(monkeypatch):
    """Mock SendGrid client"""
    # Returns configured mock for all email calls

@pytest.fixture
def test_transaction():
    """Create test transaction with all required fields"""
    # Returns TransactionNotaire ready for testing

@pytest.fixture
def webhook_payload():
    """DocuSign webhook event payload"""
    # Returns realistic webhook JSON

@pytest.fixture
def app_with_db():
    """FastAPI app with test database"""
    # Returns configured app with SQLite in-memory DB
```

---

## ✅ Success Criteria

- [ ] All webhook events handled correctly
- [ ] Email notifications sent to correct recipients
- [ ] Database state consistent with DocuSign
- [ ] Error cases handled gracefully
- [ ] No data loss in edge cases
- [ ] Response times < 500ms
- [ ] Test coverage > 85%
- [ ] All tests pass in CI/CD pipeline

---

**Next Step**: Implement tests in `tests/integration/` directory following this plan.
