# 📚 API DOCUMENTATION GUIDE - Phase 9

**Generated**: 8 Juin 2026
**Status**: ✅ COMPLETE
**Framework**: Flasgger + Swagger UI

---

## 🚀 Quick Start

### Access Swagger UI
```
🌐 Local Development:
   http://localhost:5000/api/docs

📋 OpenAPI Spec (JSON):
   http://localhost:5000/api/openapi.json

📖 ReDoc Alternative:
   Not configured yet (optional)
```

### Starting the Backend Server
```bash
cd backend
python run_server.py

# Or with Uvicorn (FastAPI)
uvicorn app_fastapi.main:app --reload --port 8001
```

---

## 📖 API Structure

### Base URL
```
/api/
```

### Response Format (All Endpoints)
```json
{
  "status": "success|error",
  "data": { ... },
  "timestamp": "2026-06-08T10:00:00Z"
}
```

### Pagination
```
GET /api/messages?skip=0&limit=20

Response:
{
  "status": "success",
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "timestamp": "..."
}
```

### Authentication
```
All endpoints require JWT Token (except /health)

Header:
Authorization: Bearer <your_jwt_token>

Example:
curl -X GET "http://localhost:5000/api/messages" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Error Handling
```json
{
  "status": "error",
  "message": "Unauthorized access",
  "code": 401,
  "timestamp": "2026-06-08T10:00:00Z"
}
```

**HTTP Status Codes**:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 📊 Phase 8 Endpoints Documentation

### Group 1: Audit Logs (📊 Phase 8.2.1)

#### GET `/admin/audit-logs`
**Purpose**: Get audit logs with optional filtering

**Query Parameters**:
```
- user_id (integer): Filter by user ID
- action (string): Filter by action type
  Values: LIST_TRANSACTIONS, CREATE_MESSAGE, ACCEPT_OFFER, etc.
- start_date (string, date): Start date filter (YYYY-MM-DD)
- end_date (string, date): End date filter (YYYY-MM-DD)
- skip (integer): Number of items to skip (default: 0)
- limit (integer): Limit results to N items (default: 20, max: 100)
```

**Example Request**:
```bash
GET /api/admin/audit-logs?action=ACCEPT_OFFER&skip=0&limit=10
Authorization: Bearer <token>
```

**Example Response (200 OK)**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "user_id": 100,
      "action": "ACCEPT_OFFER",
      "resource_type": "transaction",
      "resource_id": 50,
      "timestamp": "2026-06-08T09:30:00Z",
      "details": {
        "offer_id": 25,
        "amount": 250000
      }
    }
  ],
  "total": 42,
  "page": 1,
  "timestamp": "2026-06-08T10:00:00Z"
}
```

---

#### GET `/admin/audit-logs/:id`
**Purpose**: Get a single audit log entry

**Path Parameters**:
```
- id (integer, required): Audit log ID
```

**Example Request**:
```bash
GET /api/admin/audit-logs/1
Authorization: Bearer <token>
```

---

#### GET `/admin/audit-logs/export`
**Purpose**: Export audit logs as CSV or Excel

**Query Parameters**:
```
- format (string): csv | excel (default: csv)
- start_date (string, date): Start date filter
- end_date (string, date): End date filter
```

**Example Request**:
```bash
GET /api/admin/audit-logs/export?format=excel&start_date=2026-06-01
Authorization: Bearer <token>
```

**Response**: File download (CSV or Excel)

---

### Group 2: Messages (💬 Phase 8.2.2)

#### GET `/messages`
**Purpose**: Get all messages or messages in a conversation

**Query Parameters**:
```
- conversation_id (integer): Filter by conversation ID
- read (boolean): Filter by read status (true|false)
- skip (integer): Pagination offset
- limit (integer): Pagination limit
```

**Example**:
```bash
GET /api/messages?conversation_id=5&read=false&limit=20
Authorization: Bearer <token>
```

---

#### POST `/messages`
**Purpose**: Send a new message

**Request Body**:
```json
{
  "recipient_id": 200,
  "text": "Hello, I'm interested in your property",
  "type": "direct|offer|question"
}
```

**Example**:
```bash
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_id": 200,
  "text": "Hello!",
  "type": "direct"
}
```

**Response (201 Created)**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "sender_id": 100,
    "recipient_id": 200,
    "text": "Hello!",
    "read": false,
    "created_at": "2026-06-08T10:00:00Z",
    "updated_at": "2026-06-08T10:00:00Z"
  },
  "timestamp": "2026-06-08T10:00:00Z"
}
```

---

#### GET `/messages/:id`
**Purpose**: Get a specific message

---

#### DELETE `/messages/:id`
**Purpose**: Delete a message

---

#### PUT `/messages/:id/read`
**Purpose**: Mark a message as read

---

### Group 3: Transactions (💰 Phase 8.2.3)

#### GET `/transactions`
**Purpose**: Get all transactions

**Query Parameters**:
```
- status (string): pending | active | completed | cancelled
- buyer_id (integer): Filter by buyer
- seller_id (integer): Filter by seller
- skip (integer): Pagination
- limit (integer): Pagination
```

---

#### GET `/transactions/:id`
**Purpose**: Get transaction details with full history

**Path Parameters**:
```
- id (integer, required): Transaction ID
```

**Response Includes**:
```json
{
  "id": 1,
  "buyer_id": 100,
  "seller_id": 200,
  "property_id": 300,
  "status": "active",
  "offers": [...],
  "documents": [...],
  "timeline": [...],
  "created_at": "2026-06-01T10:00:00Z"
}
```

---

#### POST `/transactions/:id/offers/:offerId/accept`
**Purpose**: Accept an offer in a transaction

**Request Body**:
```json
{
  "notes": "Accepted offer from buyer"
}
```

---

#### POST `/transactions/:id/offers/:offerId/reject`
**Purpose**: Reject an offer

---

### Group 4: Notifications (🔔 Phase 8.2.4)

#### GET `/notifications`
**Purpose**: Get user notifications

**Query Parameters**:
```
- read (boolean): Filter by read status
- type (string): Filter by notification type
- skip (integer): Pagination
- limit (integer): Pagination
```

---

#### GET `/notifications/preferences`
**Purpose**: Get notification preferences

**Response**:
```json
{
  "status": "success",
  "data": {
    "user_id": 100,
    "email": true,
    "push": true,
    "sms": false,
    "in_app": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00",
    "notification_types": [
      "new_message",
      "offer_received",
      "appointment_reminder"
    ]
  },
  "timestamp": "..."
}
```

---

#### PUT `/notifications/preferences`
**Purpose**: Update notification preferences

**Request Body**:
```json
{
  "email": true,
  "push": false,
  "sms": true,
  "in_app": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00"
}
```

---

#### DELETE `/notifications/:id`
**Purpose**: Delete a notification

---

### Group 5: Appointments (📅 Phase 8.3.1)

#### GET `/appointments`
**Purpose**: Get all appointments

**Query Parameters**:
```
- status (string): scheduled | completed | cancelled | rescheduled
- skip (integer): Pagination
- limit (integer): Pagination
```

---

#### GET `/appointments/:id/historique`
**Purpose**: Get appointment history and timeline

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "property_id": 100,
    "visitor_id": 200,
    "scheduled_date": "2026-06-15T14:00:00Z",
    "status": "scheduled",
    "history": [
      {
        "action": "created",
        "timestamp": "2026-06-01T10:00:00Z"
      },
      {
        "action": "rescheduled",
        "timestamp": "2026-06-05T15:30:00Z",
        "new_date": "2026-06-15T14:00:00Z"
      }
    ]
  },
  "timestamp": "..."
}
```

---

#### PUT `/appointments/:id/reschedule`
**Purpose**: Reschedule an appointment

**Request Body**:
```json
{
  "new_date": "2026-06-20T10:00:00Z",
  "reason": "Requested by visitor"
}
```

---

### Group 6: Calendar (📆 Phase 8.3.2)

#### GET `/calendar/export/ical`
**Purpose**: Export appointments as iCal format

**Response**: `.ics` file (RFC 5545)

---

#### GET `/calendar/export/csv`
**Purpose**: Export appointments as CSV

**Response**: CSV file with columns: ID, Date, Title, Description, Location

---

#### POST `/calendar/import`
**Purpose**: Import calendar events from file

**Request**:
```
Content-Type: multipart/form-data

- file: .ics, .vcs, or .csv file
```

---

### Group 7: Statistics (📊 Phase 8.3.3)

#### GET `/biens/stats`
**Purpose**: Get property statistics

**Response**:
```json
{
  "status": "success",
  "data": {
    "total_properties": 145,
    "active_listings": 89,
    "sold_count": 32,
    "average_price": 275000,
    "days_to_sell_avg": 42,
    "conversion_rate": 0.62,
    "by_location": {...},
    "by_type": {...},
    "by_price_range": {...}
  },
  "timestamp": "..."
}
```

---

#### GET `/statistics/export`
**Purpose**: Export statistics as PDF or Excel

**Query Parameters**:
```
- format (string): pdf | excel
- date_range (string): week | month | quarter | year
```

---

### Group 8: Health (❤️ Phase 8.3.4)

#### GET `/health`
**Purpose**: Global system health check

**Security**: No authentication required

**Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "system_status": "healthy",
    "timestamp": "2026-06-08T10:00:00Z",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "api": "healthy",
      "queue": "healthy"
    },
    "uptime_hours": 240,
    "response_time_ms": 5
  },
  "timestamp": "..."
}
```

**Status Values**: `healthy | degraded | unhealthy`

---

#### GET `/chat/health`
**Purpose**: Check chat service health

---

#### GET `/faq/health`
**Purpose**: Check FAQ service health

---

## 🧪 Testing with curl

### Get Audit Logs
```bash
curl -X GET "http://localhost:5000/api/admin/audit-logs?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Send Message
```bash
curl -X POST "http://localhost:5000/api/messages" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": 200,
    "text": "Hello!"
  }'
```

### Get Health
```bash
# No auth required
curl -X GET "http://localhost:5000/api/health"
```

---

## 🧪 Testing with Postman

1. **Import OpenAPI**:
   - Open Postman
   - Click "Import"
   - Enter: `http://localhost:5000/api/openapi.json`

2. **Set Authorization**:
   - Select collection
   - Go to "Authorization"
   - Type: "Bearer Token"
   - Token: `YOUR_JWT_TOKEN`

3. **Run Requests**:
   - Select any endpoint
   - Click "Send"

---

## 📊 Available Integrations

### Phase 8 Hooks → API Endpoints Mapping
See: [HOOKS_TO_ENDPOINTS_MAPPING.md](../docs/HOOKS_TO_ENDPOINTS_MAPPING.md)

### Complete Endpoint List
See: [BACKEND_ENDPOINTS_ANALYSIS.md](../docs/BACKEND_ENDPOINTS_ANALYSIS.md)

### Integration Testing
See: [INTEGRATION_TEST_REPORT.md](../docs/INTEGRATION_TEST_REPORT.md)

---

## ⚠️ Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Problem**: Invalid or missing JWT token
**Solution**:
```bash
# Get a valid JWT token first
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Use the returned token in Authorization header
```

### Issue 2: 404 Not Found
**Problem**: Endpoint doesn't exist
**Solution**:
- Check endpoint URL in Swagger UI
- Verify it matches the mapping document
- Ensure backend is running

### Issue 3: 500 Server Error
**Problem**: Backend error
**Solution**:
- Check backend logs
- Verify database connection
- Check Redis connection
- Run: `python backend/tests/integration_tests.py` to validate

### Issue 4: CORS Error
**Problem**: Cross-origin request blocked
**Solution**: Already configured in backend (CORS enabled)

---

## 🚀 Performance Tips

### Pagination
Always use pagination for large datasets:
```bash
GET /api/messages?skip=0&limit=20
GET /api/messages?skip=20&limit=20
# Instead of: GET /api/messages (all at once)
```

### Filtering
Use filters to reduce response size:
```bash
# Bad: Get all messages
GET /api/messages

# Good: Get unread messages
GET /api/messages?read=false&limit=20
```

### Batch Operations
Group related operations:
```bash
# Instead of 10 separate requests
POST /api/batch
{
  "requests": [...]
}
```

---

## 📚 Reference Documentation

### External Links
- **Swagger UI**: http://localhost:5000/api/docs
- **OpenAPI Spec**: http://localhost:5000/api/openapi.json
- **Swagger Docs**: https://swagger.io/
- **Flasgger Docs**: https://github.com/flasgger/flasgger

### Internal Documents
- [HOOKS_TO_ENDPOINTS_MAPPING.md](../docs/HOOKS_TO_ENDPOINTS_MAPPING.md) - Hook to endpoint mapping
- [INTEGRATION_TEST_REPORT.md](../docs/INTEGRATION_TEST_REPORT.md) - Test documentation
- [BACKEND_ENDPOINTS_ANALYSIS.md](../docs/BACKEND_ENDPOINTS_ANALYSIS.md) - Full endpoint analysis
- [integration_tests.py](../backend/tests/integration_tests.py) - Test suite with examples

---

## ✅ Checklist for API Users

- [ ] Backend server running: `python run_server.py`
- [ ] Swagger UI accessible: http://localhost:5000/api/docs
- [ ] Have valid JWT token for authentication
- [ ] Read integration mapping: HOOKS_TO_ENDPOINTS_MAPPING.md
- [ ] Understand response format and error codes
- [ ] Have tested at least one endpoint
- [ ] Know how to run integration tests

---

## 🎯 Next Steps

1. **Start Backend**:
   ```bash
   cd backend && python run_server.py
   ```

2. **Open Swagger UI**:
   - Navigate to: http://localhost:5000/api/docs

3. **Get JWT Token**:
   - Use POST `/auth/login` endpoint

4. **Try Sample Requests**:
   - Start with GET `/health` (no auth required)
   - Then try GET `/messages` (with auth)

5. **Run Tests**:
   ```bash
   python backend/tests/integration_tests.py
   ```

---

**Documentation Version**: 2.0.0
**Last Updated**: 2026-06-08
**Status**: ✅ PRODUCTION READY
