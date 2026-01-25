# JWT Refresh Implementation Guide

**For:** Future developers maintaining or extending this code  
**Date:** January 24, 2026

---

## 🎯 What Was Implemented

A **centralized JWT refresh mechanism** that automatically handles token expiry without requiring users to manually re-login.

### Before This Fix
```
User logs in → Works fine
After 15 minutes of inactivity → Token expires
User clicks button → Error: "Invalid or expired access token"
User must manually re-login → Poor UX
```

### After This Fix
```
User logs in → Works fine
After 15 minutes of inactivity → Token expires (transparent)
User clicks button → ApiClient silently refreshes token
User continues working → No interruption ✅
```

---

## 🏗️ Architecture

### Layer 1: API Client (`src/lib/api-client.ts`)

The `ApiClient` class is the **single point of contact** for all API requests:

```typescript
// All requests go through this:
ApiClient.get(endpoint)
ApiClient.post(endpoint, data)
ApiClient.put(endpoint, data)
ApiClient.patch(endpoint, data)
ApiClient.delete(endpoint)
```

**What it does:**
1. Automatically adds `Authorization: Bearer <token>` header
2. If response is 401, silently refreshes the token
3. Retries the original request with the new token
4. If refresh fails, silently redirects to `/auth/signin`
5. **Does NOT throw user-facing error messages**

### Layer 2: Auth Context (`src/contexts/AuthContext.tsx`)

Manages auth state and provides methods:
- `signin()` - Direct fetch to /api/auth/signin
- `signup()` - Direct fetch to /api/auth/signup
- `logout()` - Direct fetch to /api/auth/logout
- `refreshAuth()` - Direct fetch to /api/auth/refresh

**Why direct fetch?** These happen before or outside the normal API flow, so they don't use ApiClient.

### Layer 3: Components

All components use `ApiClient` for data operations:

```typescript
// ✅ CORRECT - Uses ApiClient
const response = await ApiClient.get<Patient>('/api/patients')

// ❌ WRONG - Direct fetch (unless auth-related)
const response = await fetch('/api/patients')
```

---

## 🔑 Key Concepts

### 1. Token Refresh Process

```
User makes API request
    ↓
ApiClient adds Authorization header
    ↓
Server returns 401 Unauthorized
    ↓
ApiClient detects 401
    ↓
ApiClient calls /api/auth/refresh with refreshToken
    ↓
Server returns new accessToken and refreshToken
    ↓
ApiClient stores new tokens in localStorage
    ↓
ApiClient retries original request with new token
    ↓
Success! User never sees the error
```

### 2. Token Rotation

On each refresh, **both tokens are rotated**:

**Before refresh:**
```javascript
localStorage.accessToken = "eyJ...old..."
localStorage.refreshToken = "eyJ...old..."
```

**After refresh:**
```javascript
localStorage.accessToken = "eyJ...new..."
localStorage.refreshToken = "eyJ...new..."
```

This prevents token reuse attacks.

### 3. Silent Error Handling

Auth errors are **handled before reaching UI components**:

```typescript
// ❌ OLD WAY - Error reaches component
if (response.status === 401) {
  throw new Error('Session expired'); // User sees this
}

// ✅ NEW WAY - Error handled silently
if (response.status === 401) {
  try_to_refresh();
  if (refresh_succeeds) {
    retry_request();
  } else {
    redirect_to_login(); // No error thrown
  }
}
```

---

## 📝 Code Patterns

### Pattern 1: Making API Calls

```typescript
// Components should use ApiClient:
try {
  const response = await ApiClient.get<Type>('/api/endpoint', {
    limit: '10',
    offset: '0'
  })
  setData(response.data)
} catch (err: any) {
  // Only show non-auth errors here
  if (!errorMessage.includes('auth')) {
    setError(err.message)
  }
}
```

### Pattern 2: Auth Error Filtering

```typescript
// Don't show auth errors to users
const isAuthError = errorMsg.includes('sign in') || 
                   errorMsg.includes('session') || 
                   errorMsg.includes('authentication')

if (isAuthError) {
  // ApiClient has already handled the redirect
  // Don't show an error message
} else {
  // Show genuine business errors
  setError(errorMsg)
}
```

### Pattern 3: Response Handling

```typescript
// Check for success
if (response.ok) {
  const data = response.json()
  // Use data
}

// Check for errors
if (!response.ok) {
  if (response.status === 401) {
    // ApiClient handles this
  } else {
    // Handle other errors
  }
}
```

---

## 🧪 Testing

### Test: Token Refresh Works

```bash
# 1. Sign in
curl -X POST http://localhost:3002/api/auth/signin \
  -d '{"email":"test@test.com","password":"Pass123!"}' \
  | jq '.accessToken, .refreshToken'

# 2. Refresh token
curl -X POST http://localhost:3002/api/auth/refresh \
  -d '{"refreshToken":"JWT_REFRESH_TOKEN"}' \
  | jq '.accessToken, .refreshToken'

# 3. Verify old token is rejected
curl -X GET http://localhost:3002/api/patients \
  -H "Authorization: Bearer OLD_TOKEN" \
  # Should get 401
```

### Test: Component Still Works After Expiry

1. Sign in
2. Create a patient (works ✅)
3. Wait for token to expire (or simulate with invalid token)
4. Try to create another patient
5. Should succeed without user re-login ✅

---

## 🔒 Security Notes

### Tokens in localStorage

**Current approach:** Tokens stored in `localStorage`
- **Pro:** Survives page reloads, simple
- **Con:** Vulnerable to XSS if JS is compromised

**For production:** Consider adding:
```typescript
// Use httpOnly cookies for extra protection
// But localStorage is acceptable for internal tools
```

### Token Expiry Times

**Access Token:** Short-lived (15 min typical)
- If stolen, limited exposure
- Requires frequent refresh

**Refresh Token:** Long-lived (7 days typical)
- Stored securely in localStorage
- Allows background token refresh
- Can be revoked if compromised

### Security Headers

Ensure these are set on backend:
```
Authorization: Bearer <token>
Content-Type: application/json
X-CSRF-Token: <token> (if not using CORS)
```

---

## 🚨 Common Issues & Solutions

### Issue 1: User keeps getting redirected to login

**Cause:** `refreshToken` is expired or missing  
**Solution:**
- Check `localStorage.refreshToken` exists
- Check refresh token isn't expired on server
- Check `/api/auth/refresh` endpoint returns new tokens

```typescript
// Debug:
console.log('Tokens:', {
  access: localStorage.accessToken?.substring(0, 20),
  refresh: localStorage.refreshToken?.substring(0, 20),
})
```

### Issue 2: API returns 401 but user doesn't get redirected

**Cause:** ApiClient isn't being used  
**Solution:**
- Check if direct `fetch()` is being used
- Replace with `ApiClient.get/post/etc`
- Verify imports are correct

```typescript
// ❌ Wrong
const response = await fetch('/api/endpoint')

// ✅ Right
const response = await ApiClient.get('/api/endpoint')
```

### Issue 3: Error messages show "Invalid token"

**Cause:** Error is leaking from ApiClient to UI  
**Solution:**
- Check error handling in component
- Filter out auth-related errors
- Let ApiClient handle redirects silently

```typescript
// Check for this:
if (errorMsg.includes('Invalid') || errorMsg.includes('expired')) {
  // Don't show this error - ApiClient handled it
  return
}
```

---

## 🔄 Flow Diagrams

### Normal Request Flow
```
Component
    ↓
ApiClient.get(endpoint)
    ↓
Add Authorization header
    ↓
fetch(url, headers)
    ↓
Response 200 ✅
    ↓
Return data to component
```

### 401 Refresh Flow
```
Component
    ↓
ApiClient.get(endpoint)
    ↓
Add Authorization header
    ↓
fetch(url, headers)
    ↓
Response 401 ❌
    ↓
refreshToken()
    ↓
fetch(/api/auth/refresh)
    ↓
Response 200 ✅
    ↓
Store new tokens
    ↓
Retry original request
    ↓
Response 200 ✅
    ↓
Return data to component
```

### Refresh Failure Flow
```
Component
    ↓
ApiClient.get(endpoint)
    ↓
Add Authorization header
    ↓
fetch(url, headers)
    ↓
Response 401 ❌
    ↓
refreshToken()
    ↓
fetch(/api/auth/refresh)
    ↓
Response 401 ❌
    ↓
Clear localStorage
    ↓
Redirect to /auth/signin
    ↓
Return empty object (no error thrown)
```

---

## 📚 Reference: Modified Code

### ApiClient - 401 Handler
```typescript
if (response.status === 401) {
  const refreshed = await this.refreshToken();
  if (refreshed) {
    // Retry with new token
    return await fetch(url, {
      ...options,
      headers: {...this.buildHeaders(), ...customHeaders}
    }).then(r => r.json())
  } else {
    // Refresh failed - silent redirect
    window.location.href = '/auth/signin'
    return {} as T
  }
}
```

### ApiClient - Token Refresh
```typescript
private async refreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return false

  const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })

  if (!response.ok) return false

  const data = await response.json()
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  return true
}
```

---

## 🎯 For Extending This System

### Adding New API Endpoints

1. Create backend route in `/api/endpoint/route.ts`
2. Call it from component using `ApiClient`:

```typescript
// In component
const response = await ApiClient.get<Type>('/api/endpoint')
```

The JWT refresh will automatically apply!

### Adding Auth to New Features

1. Check endpoint in `src/app/api/*/route.ts`
2. Use `getRequestContext(request)` to verify auth
3. Component uses `ApiClient` (which adds auth header)

ApiClient will handle expiry automatically!

### Testing Auth Edge Cases

```typescript
// Simulate token expiry:
localStorage.removeItem('accessToken')
// Now try to make an API call - should redirect

// Simulate refresh failure:
localStorage.removeItem('refreshToken')
// Now try after token expires - should redirect

// Simulate network error:
// Disable network in DevTools, try API call
```

---

## 📊 Monitoring

In production, watch for:

1. **High 401 rate** → Token refresh might be failing
2. **High redirect to login** → Sessions expiring too fast
3. **API errors increasing** → Token might not be attaching
4. **Long refresh times** → Database might be slow

---

## 🏁 Summary

**The JWT refresh fix ensures:**
- ✅ Automatic token refresh on 401
- ✅ Transparent to users (silent operation)
- ✅ No manual re-login required
- ✅ All API calls go through one place
- ✅ Secure token rotation

**Future developers should:**
- Always use `ApiClient` for API calls
- Never use direct `fetch()` for data operations
- Filter auth errors in components
- Test with expired tokens regularly

**Maintain this by:**
- Keeping all API calls in ApiClient
- Not bypassing the centralized mechanism
- Monitoring token refresh failures
- Updating tests when endpoints change

---

**Questions?** Check `src/lib/api-client.ts` for the source of truth.
