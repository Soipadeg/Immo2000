# 🚀 Phase 5c: Frontend API Integration - PLAN

**Status**: STARTING
**Objective**: Verify React frontend works with JWT-authenticated backend endpoints

---

## 📋 What Phase 5c Will Do

### 1. **Frontend API Service Configuration**
- Check how frontend calls backend API
- Configure JWT token handling (storage, headers)
- Add Bearer token to Authorization header
- Handle token refresh and expiration

### 2. **Protected Endpoint Integration**
- `/api/favoris` - Get user's saved properties
- `/api/alertes` - Get user's search alerts
- `/api/messages` - Get user's messages
- Verify frontend components call these with JWT

### 3. **Authentication Flow**
- User logs in → JWT token issued
- Token stored in localStorage/sessionStorage
- Token sent with every protected request
- Handle 401 responses (token expired)
- Redirect to login on auth failure

### 4. **Testing**
- Test login flow in UI
- Verify protected pages load data
- Check error handling
- Test pagination and filters
- Monitor network tab for Authorization headers

---

## 🎯 Success Criteria

- ✅ Frontend calls `/auth/login` and receives JWT token
- ✅ Token is stored securely in frontend
- ✅ Protected endpoints receive Authorization header
- ✅ User data displays correctly
- ✅ Token refresh works (if implemented)
- ✅ Logout clears token
- ✅ 401 errors redirect to login
- ✅ UI shows loading states while fetching

---

## 📁 Key Frontend Files to Check

**API Service** (token management):
- `frontend/src/services/api.js` or similar
- Look for: axios config, interceptors, headers
- Check: JWT token storage and injection

**Login Component**:
- `frontend/src/pages/LoginPage.jsx` or similar
- Should call `/auth/login` endpoint
- Should store returned token

**Protected Pages**:
- `frontend/src/pages/FavorisPage.jsx`
- `frontend/src/pages/AlertesPage.jsx`
- `frontend/src/pages/MessagesPage.jsx`
- Should call protected endpoints with token

**Auth Context/State**:
- `frontend/src/context/AuthContext.jsx` or similar
- Manages current user state
- Stores JWT token
- Provides auth check functions

---

## 🔧 Implementation Steps

### Step 1: Verify API Service
```bash
# Check how frontend handles API calls
find frontend/src -name "*api*" -o -name "*service*" | head -10
cat frontend/src/services/api.js  # or similar file
```

### Step 2: Configure JWT Token Handling
```javascript
// Example: Add token to all requests
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

### Step 3: Update Login Handler
```javascript
// After login success, store token
const response = await api.post('/auth/login', credentials);
localStorage.setItem('access_token', response.data.access_token);
```

### Step 4: Protect Routes
```javascript
// Redirect to login if no token
if (!localStorage.getItem('access_token')) {
    navigate('/login');
}
```

### Step 5: Test in Browser
1. Open DevTools → Network
2. Login with test user
3. Check token in LocalStorage
4. Call protected endpoint
5. Verify Authorization header present
6. Check response has user data

---

## 📊 Testing Checklist

- [ ] Frontend loads without errors
- [ ] Login form present and functional
- [ ] Can login with `alice.martin@example.com` / `password123`
- [ ] Token appears in localStorage after login
- [ ] Protected pages load (not redirect to login)
- [ ] API calls show `Authorization: Bearer ...` header
- [ ] Favoris page displays favoris data
- [ ] Alertes page displays alerts data
- [ ] Messages page displays messages
- [ ] Logout clears token
- [ ] Accessing protected page without token redirects to login

---

## 🔍 What to Look For

**Good Signs**:
- ✅ Network tab shows `Authorization: Bearer eyJ...` header
- ✅ API responses include user data
- ✅ Pages load without 401 errors
- ✅ Token persists after page reload
- ✅ Error messages clear and helpful

**Problems to Fix**:
- ❌ No Authorization header in requests
- ❌ 401 errors on protected endpoints
- ❌ Token not stored in localStorage
- ❌ Token sent as query parameter (insecure)
- ❌ Plain password sent in request body
- ❌ CORS errors

---

## 📝 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 on protected endpoint | No token in header | Configure axios interceptor |
| Token not persisting | Using sessionStorage | Use localStorage or cookies |
| CORS error | Frontend origin not allowed | Check CORS config in backend |
| Blank pages | API call failing silently | Add error boundaries, logging |
| Can't login | Wrong endpoint path | Check `/auth/login` route |

---

## 🚀 Next Phase (Phase 6)

After Phase 5c:
- Database migration & optimization
- Caching layer (Redis)
- Performance monitoring
- Production deployment

---

**Status**: Ready to begin Phase 5c investigation
**Next Action**: Examine frontend API service and login implementation
