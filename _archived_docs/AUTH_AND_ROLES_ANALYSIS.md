# Immo2000 - Complete Authentication & Authorization Analysis

## 1. CURRENT AUTHENTICATION IMPLEMENTATION

### Backend JWT Flow
```
User Login → POST /auth/login → Backend validates credentials →
Generates JWT → Returns access_token + refresh_token →
Client stores in localStorage
```

### JWT Structure
- **Type**: HS256 (HMAC with SHA-256)
- **Secret Key**: From `JWT_SECRET_KEY` environment variable
- **Access Token**: 24 hours expiration
- **Refresh Token**: 7 days expiration
- **Payload contains**: user_id, email, role, exp, iat, type

### Token Location Files

#### Backend:
- **Validation**: [backend/src/auth/decorators.py](backend/src/auth/decorators.py#L1) - `@token_required` decorator
- **Generation**: [backend/src/auth/utils.py](backend/src/auth/utils.py#L1) - `generate_access_token()`, `generate_refresh_token()`
- **Routes**: [backend/src/auth/routes.py](backend/src/auth/routes.py#L1) - All auth endpoints

#### Frontend:
- **Storage**: [frontend/src/services/api.js](frontend/src/services/api.js#L1) - Stores in `localStorage['auth_token']`
- **Validation Hook**: [frontend/src/hooks/useAuth.js](frontend/src/hooks/useAuth.js#L1) - JWT validation logic
- **API Interceptor**: [frontend/src/services/api.js](frontend/src/services/api.js#L1) - Adds Bearer token to requests

---

## 2. ROLE & PERMISSIONS SYSTEM

### Role Definitions

| Role | Description | API Access | UI Pages |
|------|-------------|-----------|----------|
| **visitor** | Unauthenticated | Public endpoints only | Home, Search, Details |
| **user** | Standard user (default) | Authenticated endpoints | Dashboard, Create listings, Profile |
| **admin** | Administrator | All endpoints + management | Admin panel, User management |
| **notaire** | Notary professional | Transaction management | Notaire dashboard |

### Where Roles Are Defined

**Database**: [backend/src/auth/models.py](backend/src/auth/models.py#L63)
```python
role = db.Column(db.String(50), nullable=False, default="user")
```

**JWT Token**: Embedded in JWT payload during login
```python
payload = {
    "user_id": user_id,
    "email": email,
    "role": role,  # ← Role is here
    "exp": expiration,
}
```

**Frontend State**: [frontend/src/hooks/useAuth.js](frontend/src/hooks/useAuth.js#L55)
```javascript
setUser({
    id: userData.utilisateur_id,
    role: userData.role,  // ← Role stored in React state
});
```

---

## 3. BACKEND API STRUCTURE BY ROLE

### Public Endpoints (No Auth Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Register new user (default role='user') |
| POST | `/auth/login` | Get JWT tokens |
| POST | `/auth/verify-email` | Verify email for RGPD compliance |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/annonces` | List all properties |
| GET | `/annonces/{id}` | Get property details |

### User-Only Endpoints (`@token_required`)

Location: [backend/src/routes/annonces.py](backend/src/routes/annonces.py)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/annonces` | Create new listing |
| PUT | `/annonces/{id}` | Update own listing |
| DELETE | `/annonces/{id}` | Delete own listing |
| GET | `/auth/me` | Get current user profile |
| POST | `/favoris` | Save favorite property |
| POST | `/alertes` | Create price alert |

**Owner Validation**: Endpoints check `current_user['user_id']` matches resource owner

### Admin-Only Endpoints (`@admin_required`)

Location: [backend/src/routes/admin.py](backend/src/routes/admin.py)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/dashboard` | Admin statistics dashboard |
| GET | `/utilisateurs` | List all users |
| PUT | `/utilisateurs/{id}` | Update user (admin) |
| DELETE | `/utilisateurs/{id}` | Delete user |
| POST | `/notaires` | Create notary account |

### Notaire-Specific Endpoints

Location: [backend/src/routes/notaires.py](backend/src/routes/notaires.py)

Require custom `@notaire_required` decorator (checks Notaire table)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/notaires/<id>/dashboard/pending` | Pending cases |
| POST | `/transactions/<id>/validate` | Validate contract |
| GET | `/transactions/<id>/history` | Transaction history |

---

## 4. PERMISSION DECORATORS

### Available Decorators

**File**: [backend/src/auth/decorators.py](backend/src/auth/decorators.py)

#### `@token_required`
Validates JWT and extracts user info. Must be **first** decorator.
```python
@route('/endpoint')
@token_required
def endpoint(current_user):  # current_user = {user_id, email, role, ...}
    return {}
```

#### `@role_required(['role1', 'role2'])`
Checks user has one of specified roles. Must be **after** `@token_required`.
```python
@route('/admin-endpoint')
@token_required
@role_required(['admin', 'notaire'])
def endpoint(current_user):
    return {}
```

#### `@admin_required`
Shorthand for admin-only check.
```python
@route('/admin-only')
@token_required
@admin_required
def endpoint(current_user):
    return {}
```

---

## 5. FRONTEND ROUTING & ROLE-BASED UI

### Route Protection

**File**: [frontend/src/components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx)

```jsx
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute
      element={<AdminDashboard />}
      requiredRoles={['admin']}
    />
  }
/>
```

### Route Structure

**File**: [frontend/src/App.jsx](frontend/src/App.jsx)

#### Public Routes
- `/` - Home
- `/search` - Property search
- `/annonce/:id` - Property details
- `/login` - Login page
- `/register` - Registration page

#### Authenticated Routes
- `/dashboard` - Smart redirect by role
- `/user/dashboard` - User dashboard
- `/annonces/create` - Create listing
- `/profile` - User profile

#### Admin Routes
- `/admin/*` - Admin panel (requires role='admin')
  - `/admin/dashboard`
  - `/admin/users`
  - `/admin/listings`
  - `/admin/analytics`

#### Notaire Routes
- `/notaire/*` - Notary dashboard (requires role='notaire')

### Role-Based UI Logic

**Using useAuth Hook**:
```jsx
const { user, hasRole, canAccess } = useAuth();

// Show/hide by role
{hasRole('admin') && <AdminMenu />}
{hasRole('notaire') && <NotaireMenu />}

// Check multiple roles
{hasAnyRole(['admin', 'notaire']) && <ManagerPanel />}
```

---

## 6. HOW TO BYPASS AUTH (DEVELOPMENT MODE)

### Dev Access Pages

**File**: [frontend/src/components/DevRoleWrapper.jsx](frontend/src/components/DevRoleWrapper.jsx)

#### Access Points:
- `http://localhost:3000/dev` - Role selector UI
- `http://localhost:3000/utilisateur/*` - Auto-login as 'user'
- `http://localhost:3000/admin-dev/*` - Auto-login as 'admin'
- `http://localhost:3000/notaire-dev/*` - Auto-login as 'notaire'

#### What It Does:
1. Sets localStorage variables (NO REAL JWT):
   ```javascript
   localStorage.setItem('auth_token', `mock_token_${roleId}`);
   localStorage.setItem('user_id', userId);
   localStorage.setItem('user_role', roleId);
   localStorage.setItem('dev_mode', 'true');
   ```

2. Bypasses JWT validation on frontend
3. API calls return mock data if `dev_mode = 'true'` (see [frontend/src/services/api.js](frontend/src/services/api.js))

### Frontend Dev Mode Check

**File**: [frontend/src/services/api.js](frontend/src/services/api.js#L50)
```javascript
const devMode = localStorage.getItem('dev_mode') === 'true';
if (devMode) {
  // Return mock data without API call
  return Promise.resolve({ data: mockData });
}
```

### Backend Dev Mode (Not Implemented)

Backend **ignores** the `dev_mode` flag and validates real JWT. To truly bypass:
- Backend would need to check `dev_mode` header/cookie
- Or skip `@token_required` decorator on endpoints

---

## 7. FILES THAT NEED MODIFICATION TO CHANGE AUTH

### To Add a New Role:

1. **Database Schema** - Add role validation:
   ```python
   # backend/src/auth/models.py
   role = db.Column(db.String(50), nullable=False, default="user")
   # Update validation to allow new roles
   ```

2. **Decorator** - Add role check decorator:
   ```python
   # backend/src/auth/decorators.py
   def custom_role_required(f):
       # New decorator logic
   ```

3. **Routes** - Add protected endpoints:
   ```python
   # backend/src/routes/yourmodule.py
   @route('/endpoint')
   @token_required
   @role_required(['newrole'])
   def endpoint(current_user):
   ```

4. **Frontend** - Add UI routes:
   ```jsx
   // frontend/src/App.jsx
   <Route
     path="/newrole/dashboard"
     element={<ProtectedRoute element={<Dashboard />} requiredRoles={['newrole']} />}
   />
   ```

### To Change Auth Mechanism:

1. **Token Storage**: [frontend/src/services/api.js](frontend/src/services/api.js) - Change from localStorage to cookies
2. **JWT Config**: [backend/src/config.py](backend/src/config.py) - Update expiration, secret key
3. **Validation**: [backend/src/auth/utils.py](backend/src/auth/utils.py) - Modify `verify_token()`
4. **Hook**: [frontend/src/hooks/useAuth.js](frontend/src/hooks/useAuth.js) - Update auth check logic

---

## 8. KEY SECURITY FINDINGS

### ⚠️ Current Issues:

1. **localStorage JWT Storage** - Vulnerable to XSS attacks
   - Should use httpOnly cookies instead
   - [frontend/src/services/api.js](frontend/src/services/api.js#L15)

2. **Dev Mode Stored in localStorage** - Can be easily modified
   - Users can bypass auth by setting `dev_mode='true'`
   - Should be server-side only in production

3. **No Token Blacklist** - Revoked tokens still work
   - Can't invalidate compromised tokens before expiration
   - Would need Redis blacklist implementation

4. **No Rate Limiting** - Brute force attacks possible
   - No limit on login attempts
   - Should implement rate limiting on [backend/src/auth/routes.py](backend/src/auth/routes.py)

5. **Frontend API Mocks in Dev** - Returns data without validation
   - Easy to skip backend checks during development
   - Should only be used in development environments

### ✅ Security Strengths:

- bcrypt password hashing (12 rounds) ✓
- Email verification token for RGPD compliance ✓
- JWT signature validation ✓
- Role-based access control (RBAC) ✓
- Owner checks on resource modification ✓

---

## 9. QUICK REFERENCE: KEY CODE LOCATIONS

| What | Where |
|------|-------|
| JWT validation | [backend/src/auth/decorators.py](backend/src/auth/decorators.py#L1) |
| Token generation | [backend/src/auth/utils.py](backend/src/auth/utils.py#L1) |
| Auth routes | [backend/src/auth/routes.py](backend/src/auth/routes.py#L1) |
| User model | [backend/src/auth/models.py](backend/src/auth/models.py#L1) |
| Role validation | [backend/src/auth/decorators.py](backend/src/auth/decorators.py#L70) |
| Frontend auth hook | [frontend/src/hooks/useAuth.js](frontend/src/hooks/useAuth.js#L1) |
| Protected routes | [frontend/src/components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx#L1) |
| Route definitions | [frontend/src/App.jsx](frontend/src/App.jsx#L1) |
| API client setup | [frontend/src/services/api.js](frontend/src/services/api.js#L1) |
| Dev mode wrapper | [frontend/src/components/DevRoleWrapper.jsx](frontend/src/components/DevRoleWrapper.jsx#L1) |
| Config (JWT settings) | [backend/src/config.py](backend/src/config.py#L1) |
| Admin routes | [backend/src/routes/admin.py](backend/src/routes/admin.py#L1) |
| Notaire routes | [backend/src/routes/notaires.py](backend/src/routes/notaires.py#L1) |

---

## 10. AUTHENTICATION FLOW DIAGRAMS

### Login Flow
```
┌─────────┐           ┌─────────┐           ┌──────────┐
│ Frontend│           │ Backend │           │ Database │
└────┬────┘           └────┬────┘           └────┬─────┘
     │                      │                     │
     │ POST /auth/login     │                     │
     │─────────────────────>│                     │
     │                      │ Query user by email │
     │                      │────────────────────>│
     │                      │ Return user data    │
     │                      │<────────────────────│
     │                      │ Verify password     │
     │                      │ Generate JWT        │
     │ {access_token, ...}  │                     │
     │<─────────────────────│                     │
     │ Store in localStorage
     │
     ├─ localStorage['auth_token'] = token
     ├─ localStorage['user_role'] = 'user'/'admin'/'notaire'
```

### Protected Request Flow
```
┌─────────┐           ┌─────────┐
│ Frontend│           │ Backend │
└────┬────┘           └────┬────┘
     │                      │
     │ GET /auth/me         │
     │ Header: Bearer {JWT} │
     │─────────────────────>│
     │                      │ @token_required
     │                      │ ├─ Extract token
     │                      │ ├─ Verify signature
     │                      │ ├─ Check expiration
     │                      │ └─ Get user_id from payload
     │                      │ @role_required(['admin'])
     │                      │ └─ Check user.role == 'admin'
     │ {user data}          │
     │<─────────────────────│
```

### Dev Mode Bypass
```
┌─────────────────────────────────────┐
│ User visits /utilisateur/* or /dev  │
└──────────────┬──────────────────────┘
               │
               ├─ DevRoleWrapper component
               │
               ├─ Set localStorage['auth_token'] = 'mock_token'
               ├─ Set localStorage['user_role'] = 'user'/'admin'/'notaire'
               ├─ Set localStorage['dev_mode'] = 'true'
               │
               ├─ Frontend: @token_required skipped
               ├─ Frontend: useAuth uses localStorage directly
               │
               ├─ API calls: Check if dev_mode === 'true'
               │  └─ Yes: Return mock data (NO API CALL)
               │  └─ No: Make real API call with JWT
```

---

## Summary Table

| Aspect | Location | Details |
|--------|----------|---------|
| **JWT Secret** | [config.py](backend/src/config.py) | `JWT_SECRET_KEY` env var |
| **Token Duration** | [config.py](backend/src/config.py) | Access: 24h, Refresh: 7d |
| **Role Storage** | [User model](backend/src/auth/models.py) | `role` column (default='user') |
| **Validation** | [decorators.py](backend/src/auth/decorators.py) | `@token_required`, `@role_required` |
| **Frontend Auth** | [useAuth.js](frontend/src/hooks/useAuth.js) | JWT in localStorage, API interceptor |
| **Route Protection** | [ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx) | Role-based access control |
| **Dev Bypass** | [DevRoleWrapper.jsx](frontend/src/components/DevRoleWrapper.jsx) | Mock tokens in localStorage |
| **Public Endpoints** | [routes/](backend/src/routes/) | `/annonces`, `/auth/login/register` |
| **Admin Only** | [admin.py](backend/src/routes/admin.py) | `/admin/dashboard`, `/utilisateurs` |
| **Notaire Only** | [notaires.py](backend/src/routes/notaires.py) | `/notaires/`, `/transactions/` |
