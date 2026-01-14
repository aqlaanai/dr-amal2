# SPRINT 2 EXECUTION GUIDE — Auth & Role Visibility

**Document Status:** 🟢 ACTIVE  
**Last Updated:** January 14, 2026  
**Sprint:** Sprint 2 (Auth & Role Visibility)  
**Duration:** 2 weeks  
**Owner:** Frontend Lead / Execution Reviewer

---

## PURPOSE

This document defines **strict enforcement rules** for Sprint 2 implementation of Dr Amal Clinical OS v2.0.

**Sprint 2 Scope:** Authentication UI and role-based visibility ONLY.

**Zero tolerance for:**
- Auth logic (backend responsibility)
- Permission enforcement (backend responsibility)
- API integration (Sprint 4+)
- Scope creep

---

## 🎯 SPRINT 2 SCOPE (ABSOLUTE)

### ✅ ALLOWED

- **Sign In UI:** Email/password form, visual validation
- **Sign Up UI:** Provider/Caregiver registration form (visual only)
- **Post-Login Gate:** Role + account status display screen
- **Role-Based UI Visibility:** Show/hide sidebar items based on mock role
- **Client-Side State:** Mock role storage (localStorage for demo only)
- **Form Validation:** Format validation (email format, password length)
- **Visual Feedback:** Loading states, error messages (UI only)
- **Routing:** Protected route wrappers (visual redirect only)

### ❌ FORBIDDEN

- **Auth API Calls:** No `/auth/login`, no token exchange
- **Token Handling:** No JWT storage, no token refresh
- **Backend Auth Logic:** No password hashing, no session creation
- **Permission Enforcement:** No role-based guards (backend will enforce)
- **Redirect Logic Based on Backend:** No server-driven redirects
- **Auth State Management:** No global auth context (yet - Sprint 4)
- **Real Account Status Checks:** No API calls to check if account is locked
- **Database Assumptions:** No user schema assumptions

---

## 🚦 ENFORCEMENT RULES

### 1️⃣ AUTH UI ONLY (NO AUTH LOGIC)

#### Sign In Form Requirements

**✅ ALLOWED:**
```tsx
// ✅ Sign In form (UI only)
<form onSubmit={handleSignIn}>
  <input 
    type="email" 
    name="email" 
    placeholder="Email"
    required
  />
  <input 
    type="password" 
    name="password" 
    placeholder="Password"
    required
  />
  <button type="submit">Sign In</button>
</form>

// ✅ Visual validation (format only)
const handleSignIn = (e: FormEvent) => {
  e.preventDefault()
  const email = e.target.email.value
  
  // ✅ Format validation only
  if (!email.includes('@')) {
    setError('Please enter a valid email')
    return
  }
  
  // ✅ Mock role assignment for UI demo
  localStorage.setItem('mockRole', 'provider')
  router.push('/gate')
}
```

**❌ FORBIDDEN:**
```tsx
// ❌ API call to authenticate
const handleSignIn = async (e) => {
  e.preventDefault()
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
  const { token } = await response.json()
  localStorage.setItem('token', token)  // ❌ Token handling
}

// ❌ Password validation logic
if (password.length < 8) {
  setError('Password too short')  // Backend will validate
}

// ❌ Backend-driven redirect
if (response.accountStatus === 'locked') {
  router.push('/locked')  // Backend determines this
}
```

#### Sign Up Form Requirements

**✅ ALLOWED:**
```tsx
// ✅ Sign Up form (UI only)
<form onSubmit={handleSignUp}>
  <input type="text" name="name" placeholder="Full Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <input type="password" name="password" placeholder="Password" required />
  
  {/* ✅ Role selection (for UI demo) */}
  <select name="role" required>
    <option value="">Select Role</option>
    <option value="provider">Provider</option>
    <option value="caregiver">Caregiver</option>
  </select>
  
  <button type="submit">Sign Up</button>
</form>

// ✅ Mock registration (UI demo only)
const handleSignUp = (e: FormEvent) => {
  e.preventDefault()
  const role = e.target.role.value
  
  // ✅ Store mock role for UI demo
  localStorage.setItem('mockRole', role)
  localStorage.setItem('mockAccountStatus', 'pending')
  router.push('/gate')
}
```

**❌ FORBIDDEN:**
```tsx
// ❌ API call to create user
const handleSignUp = async (e) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(formData)
  })
}

// ❌ Password strength validation
const isStrongPassword = (password) => {
  // This is backend responsibility
}

// ❌ Email uniqueness check
const emailExists = await checkEmailAvailability(email)
```

#### Form Validation Rules (Format Only)

**✅ ALLOWED:**
- Email format: `includes('@')` or regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Password length: Visual indicator only (not enforced)
- Required fields: HTML5 `required` attribute

**❌ FORBIDDEN:**
- Password strength requirements (backend enforces)
- Email domain validation (backend enforces)
- Email uniqueness check (requires API call)
- Phone number format (backend enforces)

---

### 2️⃣ POST-LOGIN GATE (MANDATORY)

#### What is the Post-Login Gate?

After sign-in or sign-up, user MUST land on a **gate screen** that displays:

1. **Role** (provider | admin | caregiver)
2. **Account Status** (active | pending | locked)
3. **Calm messaging** based on status
4. **Continue button** (if active) or **Contact admin message** (if pending/locked)

**Purpose:**
- Educate user about their role and status
- Prevent direct jump into app without context
- Prepare for backend integration (gate will call API later)

#### Gate Screen Requirements

**✅ REQUIRED STRUCTURE:**
```tsx
// app/gate/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GatePage() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [accountStatus, setAccountStatus] = useState<string | null>(null)

  useEffect(() => {
    // ✅ Read mock data from localStorage (Sprint 2 only)
    const mockRole = localStorage.getItem('mockRole')
    const mockStatus = localStorage.getItem('mockAccountStatus') || 'active'
    
    if (!mockRole) {
      router.push('/signin')
      return
    }
    
    setRole(mockRole)
    setAccountStatus(mockStatus)
  }, [router])

  const handleContinue = () => {
    if (accountStatus === 'active') {
      router.push('/')  // Go to dashboard
    }
  }

  if (!role) return <div>Loading...</div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        
        {/* Role Display */}
        <div className="mb-6">
          <p className="text-gray-600">Your role:</p>
          <p className="text-xl font-semibold capitalize">{role}</p>
        </div>
        
        {/* Account Status Display */}
        <div className="mb-6">
          <p className="text-gray-600">Account status:</p>
          <p className={`text-xl font-semibold capitalize ${
            accountStatus === 'active' ? 'text-green-600' :
            accountStatus === 'pending' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {accountStatus}
          </p>
        </div>
        
        {/* Status-Based Messaging */}
        {accountStatus === 'active' && (
          <>
            <p className="text-gray-600 mb-4">
              Your account is active. You can now access the system.
            </p>
            <button
              onClick={handleContinue}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Continue to Dashboard
            </button>
          </>
        )}
        
        {accountStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800">
              Your account is pending approval. Please contact your administrator.
            </p>
          </div>
        )}
        
        {accountStatus === 'locked' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <p className="text-red-800">
              Your account has been locked. Please contact your administrator.
            </p>
          </div>
        )}
        
        <button
          onClick={() => {
            localStorage.removeItem('mockRole')
            localStorage.removeItem('mockAccountStatus')
            router.push('/signin')
          }}
          className="w-full mt-4 text-gray-600 hover:text-gray-800"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
```

**❌ REJECT IF:**
- Gate screen does not exist
- User can skip gate and go directly to dashboard
- Gate calls API to check account status (Sprint 2 is UI-only)
- Gate enforces permissions (visual only, no enforcement)

---

### 3️⃣ ROLE-BASED VISIBILITY (VISUAL ONLY)

#### Sidebar Visibility Matrix

**From ROLE_BASED_UI.md:**

| Page | Provider | Admin | Caregiver |
|------|----------|-------|-----------|
| Dashboard | ✅ | ✅ | ✅ |
| Patients | ✅ | ❌ | ✅ (read-only) |
| Sessions | ✅ | ❌ | ✅ (read-only) |
| Clinical Notes | ✅ | ❌ | ❌ |
| Prescriptions | ✅ | ❌ | ❌ |
| Lab Results | ✅ | ❌ | ❌ |
| Referrals | ✅ | ❌ | ❌ |
| Tenants | ❌ | ✅ | ❌ |
| Users | ❌ | ✅ | ❌ |
| Audit Logs | ❌ | ✅ | ❌ |

#### Implementation (Visual Only)

**✅ ALLOWED:**
```tsx
// components/layout/Sidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Sidebar() {
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    // ✅ Read mock role from localStorage (Sprint 2 only)
    const mockRole = localStorage.getItem('mockRole')
    setRole(mockRole)
  }, [])

  if (!role) return null

  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <nav className="p-4 space-y-2">
        {/* Dashboard - All roles */}
        <Link href="/" className="block px-4 py-2 hover:bg-gray-100 rounded">
          Dashboard
        </Link>
        
        {/* Clinical Suite - Provider only */}
        {role === 'provider' && (
          <>
            <Link href="/patients" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Patients
            </Link>
            <Link href="/sessions" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Sessions
            </Link>
            <Link href="/clinical-notes" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Clinical Notes
            </Link>
            <Link href="/prescriptions" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Prescriptions
            </Link>
            <Link href="/labs" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Lab Results
            </Link>
            <Link href="/referrals" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Referrals
            </Link>
          </>
        )}
        
        {/* Admin Panel - Admin only */}
        {role === 'admin' && (
          <>
            <Link href="/admin/tenants" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Tenants
            </Link>
            <Link href="/admin/users" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Users
            </Link>
            <Link href="/admin/audit" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Audit Logs
            </Link>
          </>
        )}
        
        {/* Caregiver - Read-only access */}
        {role === 'caregiver' && (
          <>
            <Link href="/patients" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Patients (Read-Only)
            </Link>
            <Link href="/sessions" className="block px-4 py-2 hover:bg-gray-100 rounded">
              Sessions (Read-Only)
            </Link>
          </>
        )}
      </nav>
    </aside>
  )
}
```

**❌ FORBIDDEN:**
```tsx
// ❌ Role enforcement via API
const { role } = await fetch('/api/user/me').then(r => r.json())

// ❌ Permission guard
const canAccessPatients = checkPermission(role, 'patients:read')

// ❌ Server-side role check
if (session.user.role !== 'provider') {
  redirect('/unauthorized')
}

// ❌ Global auth context (Sprint 4)
const { user } = useAuth()  // Too early, no backend yet
```

#### Protected Route Wrapper (Visual Only)

**✅ ALLOWED:**
```tsx
// components/auth/ProtectedRoute.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedRoute({ 
  children,
  allowedRoles 
}: { 
  children: React.ReactNode
  allowedRoles?: string[]
}) {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // ✅ Read mock role from localStorage (Sprint 2 only)
    const mockRole = localStorage.getItem('mockRole')
    
    if (!mockRole) {
      router.push('/signin')
      return
    }
    
    setRole(mockRole)
    setIsChecking(false)
  }, [router])

  if (isChecking) {
    return <div>Loading...</div>
  }

  // ✅ Visual redirect only (not enforced)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
          <p className="text-gray-600">
            This page is not available for your role.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
```

**❌ FORBIDDEN:**
```tsx
// ❌ Backend permission check
const hasAccess = await checkAccess(userId, resource)

// ❌ Token validation
const isValid = verifyToken(token)

// ❌ Database query
const user = await db.users.findUnique({ where: { id: userId } })
```

**CRITICAL NOTES:**
1. This is **visual only** - not security enforcement
2. Backend will enforce permissions (Sprint 3+)
3. LocalStorage is temporary (Sprint 4 will use real auth)
4. Redirect is client-side (not protected)

---

### 4️⃣ DESIGN CONSISTENCY (CLINICAL THEME)

#### Auth Screens Must Match Clinical OS Style

**✅ REQUIRED:**
- Professional, clinical aesthetic
- Calm, neutral colors (blues, grays)
- Clear, readable typography
- Minimal decoration
- Accessible form inputs
- No marketing language ("Join us!", "Get started!")

**❌ FORBIDDEN:**
- Startup-style design (gradients, playful colors)
- Marketing copy ("Transform your practice!")
- Social login buttons (Google, Facebook) - Sprint 2 is UI-only
- Fancy animations (keep it subtle)
- Split-screen layouts with photos

#### Sign In Page Example

**✅ APPROVED DESIGN:**
```tsx
// app/signin/page.tsx
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Dr Amal Clinical OS</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        
        {/* Form */}
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="provider@clinic.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign In
          </button>
        </form>
        
        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
```

**❌ REJECT IF:**
- Looks like a consumer app (Airbnb, Instagram style)
- Uses bright, playful colors (pink, orange, purple gradients)
- Has marketing language ("Welcome to the future of healthcare!")
- Includes social login UI (not functional in Sprint 2)
- Uses photos or illustrations (keep it minimal)

---

### 5️⃣ ABSOLUTE FORBIDDEN ITEMS

#### ❌ Backend Assumptions

**FORBIDDEN:**
```typescript
// ❌ Assuming backend user schema
interface User {
  id: string
  tenantId: string
  createdAt: Date
  // This is backend's responsibility
}

// ❌ Assuming backend auth response
interface AuthResponse {
  token: string
  refreshToken: string
  user: User
}

// ❌ Assuming backend endpoints
const loginEndpoint = '/api/auth/login'
```

**WHY FORBIDDEN:**
- Backend not built yet (Sprint 3)
- Schema may change
- Creates coupling before integration

**✅ ALLOWED:**
```typescript
// ✅ UI-only types
interface SignInFormData {
  email: string
  password: string
}

interface MockAuthState {
  role: 'provider' | 'admin' | 'caregiver' | null
  accountStatus: 'active' | 'pending' | 'locked'
}
```

---

#### ❌ Hardcoded Roles or Permissions

**FORBIDDEN:**
```typescript
// ❌ Hardcoded role checks
const ADMIN_EMAILS = ['admin@clinic.com']
if (ADMIN_EMAILS.includes(email)) {
  role = 'admin'
}

// ❌ Hardcoded permissions
const PROVIDER_PERMISSIONS = ['patients:read', 'patients:write', 'notes:write']

// ❌ Role hierarchy
const roleHierarchy = {
  admin: 3,
  provider: 2,
  caregiver: 1
}
```

**WHY FORBIDDEN:**
- Backend determines roles and permissions
- Hardcoding creates security vulnerabilities
- Changes require code changes (not configurable)

**✅ ALLOWED:**
```typescript
// ✅ Mock role for UI demo (explicitly temporary)
const MOCK_ROLES = ['provider', 'admin', 'caregiver'] as const
// NOTE: Real roles will come from backend in Sprint 4
```

---

#### ❌ Permission Checks or Guards

**FORBIDDEN:**
```typescript
// ❌ Permission check function
const hasPermission = (role: string, permission: string): boolean => {
  // This is backend responsibility
}

// ❌ Guard decorator
@RequireRole('provider')
function handleAction() { }

// ❌ Middleware
export function withAuth(handler) {
  return async (req, res) => {
    const token = req.headers.authorization
    const user = verifyToken(token)  // ❌ No token verification
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    return handler(req, res)
  }
}
```

**WHY FORBIDDEN:**
- Permission enforcement is backend responsibility
- Frontend checks are not security (can be bypassed)
- Creates false sense of security

**✅ ALLOWED:**
```typescript
// ✅ Visual visibility only (not enforcement)
{role === 'provider' && <EditButton />}
// NOTE: Backend will enforce edit permission in Sprint 4
```

---

#### ❌ AI Usage in Auth

**FORBIDDEN:**
```typescript
// ❌ AI-generated passwords
const suggestedPassword = await generatePasswordWithAI()

// ❌ AI security questions
const securityQuestions = await aiService.generateQuestions(user)

// ❌ AI fraud detection
const isFraudulent = await aiService.detectFraud(loginAttempt)
```

**WHY FORBIDDEN:**
- AI integration is Sprint 7
- Auth must be deterministic and reliable
- AI should not be involved in authentication

---

#### ❌ Global Auth State Management

**FORBIDDEN:**
```typescript
// ❌ Auth context (too early)
// contexts/AuthContext.tsx
const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  
  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', { /* ... */ })
    setUser(response.user)
    setToken(response.token)
  }
  
  return (
    <AuthContext.Provider value={{ user, token, login }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**WHY FORBIDDEN:**
- Backend does not exist yet (Sprint 3)
- API integration is Sprint 4
- Creates premature abstraction

**✅ ALLOWED (Sprint 2):**
```typescript
// ✅ Simple localStorage read (temporary demo)
const role = localStorage.getItem('mockRole')
// NOTE: Sprint 4 will replace with real auth context
```

---

## 🔍 CODE REVIEW PROCESS

### Sprint 2 Specific Checks

#### Step 1: Verify Auth UI Exists

- [ ] Sign In page exists (`app/signin/page.tsx`)
- [ ] Sign Up page exists (`app/signup/page.tsx`)
- [ ] Post-Login Gate exists (`app/gate/page.tsx`)
- [ ] All three pages are accessible via routing

**If any missing → Request creation before reviewing code**

---

#### Step 2: Check for API Calls

Search PR for forbidden keywords:

```bash
# ❌ FORBIDDEN (auto-reject if found in auth files)
fetch('/api/auth
axios.post('/api/auth
verifyToken
hashPassword
generateToken
jwt.sign
bcrypt
```

**If found → Explain that Sprint 2 is UI-only, backend is Sprint 3+**

---

#### Step 3: Verify Post-Login Gate

- [ ] Gate screen displays role and account status
- [ ] Gate shows calm messaging (not aggressive "Access Denied")
- [ ] Gate handles all three account statuses (active, pending, locked)
- [ ] User cannot skip gate (routing enforced)

**Gate Flow:**
```
Sign In → Gate Screen → Dashboard (if active)
                      → Contact Admin (if pending/locked)
```

**❌ REJECT IF:**
- User goes directly from Sign In to Dashboard
- Gate is skippable
- Gate calls API to check status

---

#### Step 4: Verify Role-Based Visibility

- [ ] Sidebar shows/hides items based on role
- [ ] Provider sees clinical suite
- [ ] Admin sees admin panel
- [ ] Caregiver sees limited read-only access
- [ ] Role is read from localStorage (temporary)

**❌ REJECT IF:**
- Role fetched from API
- Permission checks implemented
- Server-side role validation

---

#### Step 5: Check Design Consistency

- [ ] Auth screens match Clinical OS theme (blues, grays)
- [ ] No marketing language or startup aesthetic
- [ ] Forms are accessible (labels, focus states)
- [ ] Typography is professional
- [ ] No social login buttons (unless disabled/placeholder)

**Compare to Sprint 1 UI:**
- Should feel like same product
- Color palette consistent
- Spacing and typography match

---

#### Step 6: Verify No Backend Coupling

- [ ] No backend schema assumptions
- [ ] No hardcoded roles or permissions
- [ ] No auth context (too early)
- [ ] No token handling
- [ ] LocalStorage used only for mock demo (documented as temporary)

---

### Review Response Templates

#### ✅ APPROVED

```markdown
**Sprint 2 Review: APPROVED ✅**

This PR meets Sprint 2 requirements:
- ✅ Auth UI complete (Sign In, Sign Up, Gate)
- ✅ Post-login gate properly intercepts user flow
- ✅ Role-based visibility implemented (visual only, no enforcement)
- ✅ Design consistent with clinical theme
- ✅ No API calls or backend assumptions
- ✅ No permission enforcement logic

Approved for merge.

**Note:** LocalStorage mock auth will be replaced in Sprint 4 with real authentication.
```

#### ❌ CHANGES REQUESTED

```markdown
**Sprint 2 Review: CHANGES REQUESTED ❌**

This PR violates Sprint 2 scope:

**Violations:**
1. ❌ API call found: `app/signin/page.tsx:25`
   - **Code:** `await fetch('/api/auth/login', { ... })`
   - **Why forbidden:** Sprint 2 is UI-only, backend does not exist (Sprint 3)
   - **Required action:** Remove API call, use localStorage mock role instead

2. ❌ Post-login gate missing
   - **Issue:** User navigates directly from Sign In to Dashboard
   - **Why required:** Gate screen is mandatory to display role + account status
   - **Required action:** Add `/gate` page, redirect Sign In → Gate → Dashboard

3. ❌ Permission guard found: `components/layout/Sidebar.tsx:18`
   - **Code:** `if (!hasPermission(role, 'patients:read')) return null`
   - **Why forbidden:** Permission enforcement is backend responsibility (Sprint 3+)
   - **Required action:** Use simple role visibility only: `{role === 'provider' && <Link>}`

**Please address these violations and request re-review.**

Reference: [SPRINT_2_EXECUTION_GUIDE.md](docs/SPRINT_2_EXECUTION_GUIDE.md)
```

#### 🚫 BLOCKED

```markdown
**Sprint 2 Review: BLOCKED 🚫**

This PR fundamentally violates Sprint 2 scope and cannot be salvaged.

**Critical Issues:**
- ❌ Implements complete auth backend (JWT, bcrypt, session storage)
- ❌ Includes database user schema and Prisma queries
- ❌ Implements server-side permission enforcement

**This is Sprint 3+ work being done too early.**

**Required Action:**
- Close this PR
- Revert to Sprint 2 scope: Auth UI only, no backend logic
- Review [SPRINT_BREAKDOWN.md](docs/SPRINT_BREAKDOWN.md) for correct sprint sequencing

**Backend auth implementation belongs in Sprint 3.**
```

---

## ✅ SUCCESS CRITERIA

Sprint 2 is successful ONLY if all criteria met:

### Functional Criteria

- [ ] **Auth UI complete**
  - Sign In page functional (UI-only)
  - Sign Up page functional (UI-only)
  - Post-login gate displays role + account status
  - Forms validate format (email, required fields)

- [ ] **Role-based visibility working**
  - Provider sees clinical suite in sidebar
  - Admin sees admin panel in sidebar
  - Caregiver sees limited read-only access
  - Dashboard content adapts to role (empty states)

- [ ] **User flow correct**
  - Sign In → Gate → Dashboard (if active)
  - Sign In → Gate → Contact Admin (if pending/locked)
  - Sign Up → Gate → Contact Admin (pending by default)
  - Sign Out clears mock auth, returns to Sign In

### Code Quality Criteria

- [ ] **No backend integration**
  - No API calls in auth flow
  - No token handling (JWT, refresh tokens)
  - No password hashing or validation
  - LocalStorage used only for mock demo (documented as temporary)

- [ ] **No permission enforcement**
  - Visibility is visual only (not enforced)
  - No permission check functions
  - No auth guards or middleware
  - Backend will enforce in Sprint 3+

- [ ] **No premature abstractions**
  - No auth context (Sprint 4)
  - No permission system (Sprint 3)
  - No API client (Sprint 4)

### Design Criteria

- [ ] **Clinical theme consistent**
  - Auth screens match app aesthetic
  - Professional, calm, neutral design
  - No marketing language or startup style
  - Accessible forms (labels, focus states)

### Documentation Criteria

- [ ] **Temporary code clearly marked**
  - LocalStorage usage documented as temporary
  - Mock role assignment commented
  - Comments indicate Sprint 4 will replace with real auth

---

## 🚨 COMMON VIOLATIONS & CORRECTIONS

### Violation 1: "Just validate the password"

**❌ VIOLATION:**
```typescript
// "I'll just add basic password validation"
const isValidPassword = (password: string): boolean => {
  if (password.length < 8) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  return true
}
```

**WHY FORBIDDEN:**
- Password validation is backend responsibility
- Password requirements should be configurable (not hardcoded)
- Creates duplicate logic (frontend + backend)

**✅ CORRECTION:**
```typescript
// ✅ Visual feedback only (not enforced)
const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  // Visual indicator only, not validation
  if (password.length < 6) return 'weak'
  if (password.length < 10) return 'medium'
  return 'strong'
}

// Show visual feedback, but don't prevent submission
<PasswordStrengthIndicator strength={getPasswordStrength(password)} />
// Backend will validate on submission (Sprint 3+)
```

---

### Violation 2: "Mock API for development"

**❌ VIOLATION:**
```typescript
// lib/mockAuth.ts
export const mockAuthAPI = {
  login: async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock authentication
    if (email === 'admin@clinic.com' && password === 'admin123') {
      return { token: 'mock-token', role: 'admin' }
    }
    throw new Error('Invalid credentials')
  }
}
```

**WHY FORBIDDEN:**
- Creates false API contract before backend exists
- Hardcodes credentials (security risk)
- Must be deleted when real backend is ready (wasted effort)

**✅ CORRECTION:**
```typescript
// ✅ Simple localStorage mock (no fake API)
const handleSignIn = (e: FormEvent) => {
  e.preventDefault()
  const email = e.target.email.value
  
  // Mock role assignment (clearly temporary)
  // TODO Sprint 4: Replace with real API call
  if (email.includes('admin')) {
    localStorage.setItem('mockRole', 'admin')
  } else {
    localStorage.setItem('mockRole', 'provider')
  }
  
  router.push('/gate')
}
```

---

### Violation 3: "Check if email exists"

**❌ VIOLATION:**
```typescript
// "I'll check if the email is already registered"
const handleSignUp = async (e) => {
  e.preventDefault()
  const email = e.target.email.value
  
  const emailExists = await fetch(`/api/users/check-email?email=${email}`)
    .then(r => r.json())
  
  if (emailExists) {
    setError('Email already registered')
    return
  }
  
  // Continue sign up...
}
```

**WHY FORBIDDEN:**
- Requires backend API (Sprint 3+)
- Email uniqueness check is backend responsibility
- Creates security vulnerability (email enumeration)

**✅ CORRECTION:**
```typescript
// ✅ No email existence check in Sprint 2
const handleSignUp = (e: FormEvent) => {
  e.preventDefault()
  
  // Mock sign up (UI demo only)
  // TODO Sprint 4: Real API will check email uniqueness
  localStorage.setItem('mockRole', 'provider')
  localStorage.setItem('mockAccountStatus', 'pending')
  router.push('/gate')
}
```

---

### Violation 4: "Protect routes with middleware"

**❌ VIOLATION:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  
  // ❌ Server-side auth check
  if (!token) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }
  
  // ❌ Token verification
  const user = verifyToken(token.value)
  if (!user) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }
  
  return NextResponse.next()
}
```

**WHY FORBIDDEN:**
- Server-side auth is Sprint 3+ (backend)
- No tokens exist yet (Sprint 2 is UI-only)
- Middleware should not be added until backend integration (Sprint 4)

**✅ CORRECTION:**
```typescript
// ✅ Client-side visual redirect only (Sprint 2)
// app/patients/page.tsx
'use client'

export default function PatientsPage() {
  const router = useRouter()
  
  useEffect(() => {
    const role = localStorage.getItem('mockRole')
    if (!role) {
      router.push('/signin')
    }
  }, [router])
  
  // Rest of page...
}

// TODO Sprint 4: Replace with real auth middleware
```

---

### Violation 5: "Store user data globally"

**❌ VIOLATION:**
```typescript
// contexts/UserContext.tsx
'use client'

import { createContext, useContext, useState } from 'react'

interface User {
  id: string
  email: string
  role: string
  accountStatus: string
}

const UserContext = createContext<User | null>(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState<User | null>(null)
  
  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
```

**WHY FORBIDDEN:**
- Creates premature abstraction before backend exists
- Assumes user schema (backend may differ)
- Will need refactoring in Sprint 4 anyway

**✅ CORRECTION:**
```typescript
// ✅ Simple localStorage read (no context yet)
// Sprint 2: Each component reads localStorage directly
const role = localStorage.getItem('mockRole')

// TODO Sprint 4: Create proper auth context with real backend
```

---

## 📋 SPRINT 2 COMPLETION CHECKLIST

### Before Marking Sprint 2 Complete

- [ ] Sign In page exists and works (UI-only)
- [ ] Sign Up page exists and works (UI-only)
- [ ] Post-login gate exists and displays role + account status
- [ ] Gate handles all three account statuses (active, pending, locked)
- [ ] Role-based sidebar visibility implemented (visual only)
- [ ] Provider sees clinical suite
- [ ] Admin sees admin panel
- [ ] Caregiver sees limited read-only access
- [ ] User flow is correct (Sign In → Gate → Dashboard)
- [ ] Sign Out clears mock auth and returns to Sign In
- [ ] No API calls in auth flow
- [ ] No backend assumptions (no user schema, no endpoints)
- [ ] No permission enforcement logic
- [ ] No auth context or global state
- [ ] Design consistent with clinical theme
- [ ] Auth screens professional and accessible
- [ ] Temporary code marked with comments (localStorage usage)
- [ ] No hardcoded credentials
- [ ] No token handling
- [ ] README updated explaining mock auth approach

### Sprint 2 Demo Requirements

Demonstrate:
1. **Sign In Flow:** Sign In → Gate (shows role + status) → Dashboard (if active)
2. **Role Visibility:** Switch mock role in localStorage → Sidebar items change
3. **Account Status:** Switch mock account status → Gate messaging changes
4. **Sign Out:** Sign Out → Returns to Sign In → Mock auth cleared
5. **Design Consistency:** Show that auth screens match Sprint 1 UI theme

### Handoff to Sprint 3

**What Sprint 3 Receives:**
- Complete auth UI (Sign In, Sign Up, Gate)
- Role-based visibility (visual only, ready for backend enforcement)
- User flow defined (Sign In → Gate → Dashboard)
- Design system applied to auth screens

**What Sprint 3 Will Add:**
- Backend auth logic (JWT, password hashing, session management)
- User schema and database
- Real role and permission enforcement
- API endpoints for login, signup, logout

---

## 🛡️ PHILOSOPHY

### Identity is UI First, Authority Comes Later

**Why UI before logic:**

1. **User Experience Defined First**
   - Auth flow must be smooth and clear
   - Role visibility must make sense visually
   - Backend can't improve broken UX

2. **Backend Enforces, Frontend Displays**
   - Frontend shows what user can see
   - Backend enforces what user can do
   - Clear separation prevents security vulnerabilities

3. **Visual Design Informs Backend**
   - Role visibility matrix guides backend permission model
   - Gate screen design shows what backend must return
   - UI-first prevents backend over-engineering

### Clinical Systems Fail at Auth More Than Features

**Why auth is critical:**

- **Most breaches start at authentication**
  - Weak passwords
  - Session hijacking
  - Role escalation

- **Auth failures are catastrophic**
  - Wrong user sees patient data → HIPAA violation
  - Caregiver modifies clinical notes → Patient safety risk
  - Admin locked out → System unavailable

- **Auth must be simple and correct**
  - Complexity creates vulnerabilities
  - "Clever" auth is dangerous auth
  - Boring and correct wins

### If Unsure, Block the Change

**When reviewing Sprint 2 PRs:**

- ❓ "Is this auth logic?" → If yes, block (backend's job)
- ❓ "Does this assume backend structure?" → If yes, block (too early)
- ❓ "Will this need rewriting in Sprint 4?" → If yes, simplify or block

**Better to delay than to compromise.**

---

## 🔗 RELATED DOCUMENTATION

- [SPRINT_BREAKDOWN.md](./SPRINT_BREAKDOWN.md) — Complete sprint plan
- [SPRINT_1_EXECUTION_GUIDE.md](./SPRINT_1_EXECUTION_GUIDE.md) — Frontend foundation (previous sprint)
- [ROLE_BASED_UI.md](./ROLE_BASED_UI.md) — Role visibility matrix
- [USER_JOURNEYS.md](./USER_JOURNEYS.md) — User flows (including auth)
- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) — Backend auth design (Sprint 3+)
- [PR_REVIEW_CHECKLIST.md](./PR_REVIEW_CHECKLIST.md) — General PR review standards
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) — Production release requirements

---

## 📞 ESCALATION

### When to Escalate

Escalate to Tech Lead if:

1. **Scope Dispute**
   - Team wants to "just add JWT handling" in Sprint 2
   - Designer wants social login buttons (functional, not just visual)
   - Product wants real email validation (requires backend)

2. **Timeline Pressure**
   - Team wants to skip post-login gate to "save time"
   - Sprint 2 scope expanding to include Sprint 3 work

3. **Security Concern**
   - Someone proposes storing passwords in localStorage
   - Hardcoded credentials appear in PR
   - Session fixation vulnerability introduced

### Escalation Template

```markdown
**Sprint 2 Scope Escalation**

**Issue:** [Describe conflict]

**Developer Position:** [What developer wants to implement]

**Reviewer Position:** [Why it violates Sprint 2]

**Documentation Reference:** [Link to rule in this document]

**Security Impact:** [If applicable]

**Request:** Tech Lead decision on whether to:
- ☐ Enforce Sprint 2 scope (block change)
- ☐ Allow exception (document why)
- ☐ Defer to Sprint 3 (backend auth)
```

---

## ✍️ REVISION HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-14 | 1.0.0 | Initial Sprint 2 execution guide |

---

## 🎯 FINAL REMINDER

**You are not here to be polite.**  
**You are here to protect the system.**

Sprint 2 scope is **non-negotiable**:
- ✅ Auth UI only
- ❌ No auth logic
- ❌ No backend integration
- ❌ No permission enforcement

**If in doubt, block the change.**

Identity is UI first. Authority comes later.

---

**Backend can plug in later without UI changes.**

That is the Sprint 2 success criteria.
