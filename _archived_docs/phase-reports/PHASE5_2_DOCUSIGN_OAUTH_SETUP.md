# 📋 Setup Instructions - Phase 5.2.2 DocuSign OAuth Integration

## Status: ✅ COMPLETE

Phase 5.2.2 implement DocuSign OAuth for both SignCompromisPage and SignActePage with complete frontend integration.

## 1. What Was Implemented

### Frontend Changes

**New Files Created:**
1. **`frontend/src/services/api/docusign.js`** - DocuSign API service with 7 methods
2. **`frontend/src/pages/DocuSignCallbackPage.jsx`** - OAuth callback handler
3. **Updated `SignCompromisPage.jsx`** - Real DocuSign OAuth integration (4 steps)
4. **Updated `SignActePage.jsx`** - Real DocuSign OAuth integration (4 steps)
5. **Updated `App.jsx`** - Added callback route

### Features

- **OAuth 2.0 Flow**: User authenticates with DocuSign
- **Multi-Step Process**: Clear progression through 4 steps
- **Envelope Management**: Create, sign, verify DocuSign envelopes
- **Signing URL**: Redirect to DocuSign for document signing
- **Status Polling**: Check envelope status and auto-advance
- **Error Handling**: User-friendly error messages with retry
- **Callback Handling**: Secure OAuth callback with localStorage state

## 2. How DocuSign OAuth Works

### User Flow

```
1. User clicks "Connecter DocuSign" button
   ↓
2. Frontend calls /api/v1/transactions/:id/docusign/auth
   ↓
3. Backend returns DocuSign authorization URL
   ↓
4. Frontend redirects to DocuSign login page
   ↓
5. User logs in and grants permission
   ↓
6. DocuSign redirects to /docusign/callback with code + state
   ↓
7. Frontend calls /api/v1/transactions/:id/docusign/callback
   ↓
8. Backend exchanges code for access token
   ↓
9. Backend creates envelope and gets signing URL
   ↓
10. Frontend displays signing URL for user to sign
    ↓
11. User signs in DocuSign embedded window
    ↓
12. Frontend polls envelope status
    ↓
13. When completed, user confirms and transaction advances
```

## 3. Backend Requirements

The backend needs these endpoints (already in Phase 3):

```python
# Start OAuth flow
POST /api/v1/transactions/:id/docusign/auth
Request: { document_type: "compromis" | "acte" }
Response: { auth_url: "https://account.docusign.com/oauth/authorize..." }

# Handle OAuth callback
POST /api/v1/transactions/:id/docusign/callback
Request: { code: "...", state: "..." }
Response: { envelope_id: "...", signing_url: "..." }

# Get envelope status
GET /api/v1/transactions/:id/docusign/envelope/:envelope_id/status
Response: { status: "sent" | "completed" | "declined" | "voided" }

# Get signing URL
GET /api/v1/transactions/:id/docusign/envelope/:envelope_id/signing-url
Response: { signing_url: "..." }

# Download signed document
GET /api/v1/transactions/:id/docusign/envelope/:envelope_id/document
Response: PDF binary

# Create envelope
POST /api/v1/transactions/:id/docusign/envelope
Request: { document_data: {...} }
Response: { envelope_id: "..." }

# Cancel envelope
POST /api/v1/transactions/:id/docusign/envelope/:envelope_id/cancel
Response: { status: "voided" }
```

## 4. DocuSign Configuration

### Get Your DocuSign Credentials

1. Go to [https://developer.docusign.com](https://developer.docusign.com)
2. Sign up for a free developer account
3. Click **Apps and Keys** on the left menu
4. Under **API and Keys**, you'll see:
   - **Integration Key** (Client ID)
   - **Secret Key** (Client Secret)

### Configure OAuth in DocuSign Dashboard

1. In **Apps and Keys**, scroll to **Authentication**
2. Under **Redirect URIs**, add:
   ```
   http://localhost:5173/docusign/callback
   http://localhost:3000/docusign/callback
   https://yourdomain.com/docusign/callback (production)
   ```
3. Save the changes

### Backend Configuration

Add to backend `.env`:

```env
# DocuSign
DOCUSIGN_INTEGRATION_KEY=your-integration-key-from-dashboard
DOCUSIGN_SECRET_KEY=your-secret-key-from-dashboard
DOCUSIGN_ACCOUNT_ID=your-account-id
DOCUSIGN_BASE_URL=https://demo.docusign.net  # For development
# DOCUSIGN_BASE_URL=https://na3.docusign.net  # For production

# OAuth Callback
DOCUSIGN_REDIRECT_URI=http://localhost:5173/docusign/callback
```

### Backend Implementation

The backend should use the `docusign-esign` library:

```python
from docusign_esign import ApiClient, EnvelopesApi, AuthenticationApi
from datetime import datetime, timedelta

class DocuSignService:
    def __init__(self):
        self.integration_key = os.getenv('DOCUSIGN_INTEGRATION_KEY')
        self.secret_key = os.getenv('DOCUSIGN_SECRET_KEY')
        self.account_id = os.getenv('DOCUSIGN_ACCOUNT_ID')
        self.base_url = os.getenv('DOCUSIGN_BASE_URL')
        self.redirect_uri = os.getenv('DOCUSIGN_REDIRECT_URI')

    def get_auth_url(self):
        """Get DocuSign OAuth authorization URL"""
        return (
            f"{self.base_url}/oauth/authorize"
            f"?response_type=code"
            f"&scope=signature"
            f"&client_id={self.integration_key}"
            f"&redirect_uri={self.redirect_uri}"
        )

    def exchange_code_for_token(self, code):
        """Exchange authorization code for access token"""
        # Use Python requests to POST to token endpoint
        response = requests.post(
            f"{self.base_url}/oauth/token",
            auth=(self.integration_key, self.secret_key),
            data={'grant_type': 'authorization_code', 'code': code}
        )
        return response.json()['access_token']

    def create_envelope(self, access_token, transaction_id, document_type):
        """Create DocuSign envelope for document"""
        # Create envelope with document and signing fields
        # Return envelope_id and signing_url

    def get_envelope_status(self, access_token, envelope_id):
        """Get current status of envelope"""
        # Return status: sent, completed, declined, voided

    def get_signing_url(self, access_token, envelope_id):
        """Get embedded signing URL for recipient"""
        # Return signing_url for redirect
```

## 5. Frontend Service API

The DocuSign service (`frontend/src/services/api/docusign.js`) has 7 methods:

```javascript
import docusignApi from '../services/api/docusign';

// Start OAuth flow
const { auth_url } = await docusignApi.startOAuth(transactionId, 'compromis');
window.location.href = auth_url;

// Handle callback
const { envelope_id, signing_url } = await docusignApi.handleOAuthCallback(code, state, transactionId);

// Get envelope status
const { status } = await docusignApi.getEnvelopeStatus(transactionId, envelopeId);

// Get signing URL
const { signing_url } = await docusignApi.getSigningUrl(transactionId, envelopeId);

// Download signed document
const pdfBlob = await docusignApi.downloadSignedDocument(transactionId, envelopeId);

// Create envelope
const { envelope_id } = await docusignApi.createEnvelope(transactionId, documentData);

// Cancel envelope
await docusignApi.cancelEnvelope(transactionId, envelopeId);
```

## 6. State Management

The frontend uses localStorage to pass state through OAuth callback:

```javascript
// Before redirect to DocuSign
localStorage.setItem('docusign_oauth_state', JSON.stringify({
  transactionId: '123',
  documentType: 'sign-compromis'
}));

// In callback page
const callbackState = JSON.parse(localStorage.getItem('docusign_oauth_state'));
const { transactionId, documentType } = callbackState;
```

This ensures we know which transaction and document type to handle when DocuSign redirects back.

## 7. Testing DocuSign Integration

### Test OAuth Flow

1. Start frontend and backend
2. Navigate to `/transactions/1/sign-compromis`
3. Click "Télécharger le PDF"
4. Click "Connecter DocuSign"
5. You should be redirected to DocuSign login
6. Log in with your developer account
7. Grant permission to Immo2000
8. You should be redirected back to `/docusign/callback`
9. Page should show success and redirect to signing step

### Test Envelope Status Polling

1. Complete the OAuth flow
2. Click "Accéder à DocuSign"
3. DocuSign window opens with signing form
4. Sign the document
5. Frontend polls every 2 seconds for status
6. When status is "completed", step 4 appears
7. Click "Finaliser la Transaction"

### Debugging

Check browser console for:
- OAuth redirect URL
- Envelope creation response
- Status polling results
- Error messages

Check network tab:
- POST to `/api/v1/transactions/:id/docusign/auth`
- POST to `/api/v1/transactions/:id/docusign/callback`
- GET to `/api/v1/transactions/:id/docusign/envelope/:id/status`

## 8. Production Setup

### 1. DocuSign Production Account

1. DocuSign offers free production accounts (after development)
2. Request production account from DocuSign
3. Get new credentials for production:
   - Production Integration Key
   - Production Secret Key
   - Production Account ID

### 2. Backend Configuration

Update `.env` for production:

```env
DOCUSIGN_BASE_URL=https://na3.docusign.net
DOCUSIGN_REDIRECT_URI=https://yourdomain.com/docusign/callback
```

### 3. Frontend Configuration

No frontend changes needed - OAuth happens on backend.

### 4. HTTPS Required

DocuSign OAuth requires HTTPS in production. Configure your server accordingly.

## 9. Supported Document Types

- **compromis** - Compromise/offer agreement (first signature)
- **acte** - Final deed (irrevocable signature)

Each has its own endpoint and envelope configuration.

## 10. Error Handling

### Common Errors

**"Error: Stripe is not defined"**
- Cause: OAuth redirect URI not configured in DocuSign dashboard
- Solution: Add your redirect URI to DocuSign Apps and Keys

**"Error: code or transaction ID missing"**
- Cause: OAuth callback missing parameters
- Solution: Check DocuSign is redirecting with `code` and `state`

**"Envelope not found"**
- Cause: Envelope ID not saved correctly
- Solution: Verify backend creates envelope before returning signing URL

**"User denied access"**
- Cause: User clicked "Deny" in DocuSign permission dialog
- Solution: Catch error and allow user to retry

## 11. Checklist

- [ ] DocuSign developer account created
- [ ] Integration Key and Secret Key obtained
- [ ] OAuth redirect URI added to DocuSign dashboard
- [ ] Backend `.env` configured with DocuSign credentials
- [ ] Backend DocuSignService implemented
- [ ] Frontend docusign.js service created
- [ ] DocuSignCallbackPage component created
- [ ] SignCompromisPage updated with OAuth flow
- [ ] SignActePage updated with OAuth flow
- [ ] Route `/docusign/callback` added to App.jsx
- [ ] Test OAuth flow end-to-end
- [ ] Test signing in DocuSign
- [ ] Test envelope status polling
- [ ] Test production setup with HTTPS

## 12. Next Steps

- ✅ **5.2.1**: Stripe Elements intégré
- ✅ **5.2.2**: DocuSign OAuth dans SignCompromisPage et SignActePage
- ⏳ **5.2.3**: DocuSign OAuth dans SignActePage (duplicate - already done)
- ⏳ **5.2.4**: Zustand Store creation
- ⏳ **5.2.5**: React Hook Form validation

---

**Created**: 19 mai 2026 | **Phase**: 5.2.2 DocuSign OAuth Integration
