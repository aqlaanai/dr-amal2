# Sprint Breakdown — Dr Amal Clinical OS v2.0

**Purpose:** Sequential execution plan for production-ready clinical system.

**Scope:** Sprint planning only. No code. No shortcuts. No compromises.

**Philosophy:** Every sprint reduces risk. Speed comes from discipline. Clinical systems punish shortcuts.

---

## DELIVERY PRINCIPLES (ABSOLUTE)

```
┌─────────────────────────────────────────────────────────┐
│  FOUNDATIONS BEFORE FEATURES                            │
│  READ BEFORE WRITE                                      │
│  ENFORCEMENT BEFORE CONVENIENCE                         │
│  SAFETY BEFORE SPEED                                    │
│                                                         │
│  Every sprint must end with:                           │
│    • Something demoable                                │
│    • No broken contracts                               │
│    • No unfinished foundations                         │
└─────────────────────────────────────────────────────────┘
```

---

## SPRINT STRUCTURE (LOCKED)

**Sprint Length:** 2 weeks (10 working days)

**Sprint Cadence:**
- Day 1: Sprint planning (4 hours)
- Days 2-9: Development
- Day 10: Demo + retrospective (3 hours)

**Team Composition (Assumed):**
- 1 Frontend Developer
- 1 Backend Developer
- 1 Full-Stack Developer (floats between frontend/backend)
- 1 Tech Lead (you)

**Total Duration:** 7 sprints × 2 weeks = **14 weeks (~3.5 months)**

---

## 🟦 SPRINT 0 — PROJECT HARDENING

**Duration:** 1 week (pre-Sprint 1 setup)

**Goal:** Prepare the ground so nothing breaks later.

**Why This Sprint Matters:**
> "Without this foundation, every future sprint will accumulate technical debt. A clinical system cannot afford chaos in its foundations."

---

### Tasks

#### 1. Repository Structure
- [ ] Create mono-repo or separate repos (decision: separate for frontend/backend/ai)
- [ ] Initialize frontend/ with Next.js 14 App Router
- [ ] Initialize backend/ with NestJS
- [ ] Initialize ai/ (can be stub for now)
- [ ] Create docs/ folder with all architecture documents
- [ ] Create infra/ folder with environment configs

**Deliverable:** Three empty repos with proper structure (see REPO_STRUCTURE.md)

---

#### 2. Coding Standards & Linting
- [ ] ESLint config for frontend (import boundaries enforced)
- [ ] ESLint config for backend (module boundaries enforced)
- [ ] Prettier config (consistent formatting)
- [ ] TypeScript strict mode enabled
- [ ] Pre-commit hooks (lint + format)

**Deliverable:** Code that violates standards cannot be committed.

---

#### 3. Environment Separation
- [ ] `.env.example` files for frontend, backend, ai
- [ ] Environment variables documented
- [ ] Development environment setup script
- [ ] Staging environment plan (can deploy later)
- [ ] Production environment plan (secrets management)

**Deliverable:** Clear separation between dev/staging/prod.

---

#### 4. Documentation Population
- [ ] Move all architecture docs to `docs/architecture/`
- [ ] Create README.md in each repo
- [ ] Create CONTRIBUTING.md with PR guidelines
- [ ] Create CHANGELOG.md (empty for now)

**Deliverable:** Docs folder is complete, up-to-date.

---

#### 5. CI/CD Skeleton
- [ ] GitHub Actions (or similar) for frontend build
- [ ] GitHub Actions for backend build + tests
- [ ] Linting runs on PR
- [ ] Tests run on PR (even if no tests yet)

**Deliverable:** Broken code cannot merge.

---

### Success Criteria

✅ All repos initialized with proper structure  
✅ Linting enforces import/module boundaries  
✅ Environment variables separated  
✅ Documentation in place  
✅ CI/CD pipeline runs (even if minimal)  

**Demo:** Show folder structure, run lint, show docs.

**No Feature Code Yet.**

---

## 🟦 SPRINT 1 — FRONTEND FOUNDATION

**Duration:** 2 weeks

**Goal:** Visual truth becomes real. All screens navigable.

**Why This Sprint Matters:**
> "Frontend defines the truth. Backend will enforce it. We build the truth first, so enforcement is never guessing what to validate."

---

### Tasks

#### 1. App Shell Implementation
- [ ] AppShell component (Sidebar + Header + main content area)
- [ ] Sidebar with all navigation items (static, no filtering yet)
- [ ] Header component (logo, placeholder for user menu)
- [ ] Footer component (if needed)
- [ ] Responsive layout (desktop-first, mobile later)

**Deliverable:** Every page uses AppShell layout.

---

#### 2. Page Skeletons (All 12 Pages)
- [ ] `/overview` - Overview page skeleton
- [ ] `/patients` - Patient list page skeleton
- [ ] `/schedule` - Schedule page skeleton
- [ ] `/sessions` - Live sessions page skeleton
- [ ] `/notes` - Clinical notes page skeleton
- [ ] `/prescriptions` - Prescriptions page skeleton
- [ ] `/labs` - Lab results page skeleton
- [ ] `/imaging` - Medical imaging page skeleton
- [ ] `/referrals` - Referrals page skeleton
- [ ] `/admin` - Admin panel page skeleton
- [ ] `/audit` - Audit logs page skeleton
- [ ] `/settings` - Settings page skeleton

**Deliverable:** All pages render with placeholder content ("This is the [Page Name] page").

---

#### 3. Global UI States (Reusable Components)
- [ ] `LoadingState.tsx` - Spinning indicator + message
- [ ] `EmptyState.tsx` - Calm empty state with icon + message
- [ ] `ErrorState.tsx` - Error UI with retry button
- [ ] `RestrictedState.tsx` - Unauthorized access UI

**Deliverable:** Every page can show loading/empty/error/restricted states.

---

#### 4. Navigation Between Pages
- [ ] Clicking sidebar items navigates to pages
- [ ] Active route highlighted in sidebar
- [ ] Page transitions smooth (Next.js default)

**Deliverable:** Fully navigable UI, no 404s.

---

#### 5. Tailwind Styling
- [ ] Clinical color palette applied (see ROLE_BASED_UI.md)
- [ ] Global styles in `globals.css`
- [ ] Sidebar styled (calm, professional)
- [ ] Header styled
- [ ] Page containers have consistent padding

**Deliverable:** UI looks clinical, not generic.

---

### Success Criteria

✅ All 12 pages navigable  
✅ AppShell renders on all pages  
✅ Sidebar navigation works  
✅ Global states (loading/empty/error/restricted) functional  
✅ UI matches clinical design (calm, professional)  

**Demo:** Navigate through all pages, show empty states.

**No Data. No APIs. Just Structure.**

---

## 🟦 SPRINT 2 — AUTH & ROLE-BASED UI

**Duration:** 2 weeks

**Goal:** Identity without authority. Role-based visibility.

**Why This Sprint Matters:**
> "Auth defines who you are. Roles define what you see. We build visual access control before enforcement, so UI never exposes what backend will deny."

---

### Tasks

#### 1. Auth Pages (UI Only)
- [ ] `/signin` page with SignInForm component
- [ ] `/signup` page with SignUpForm component
- [ ] Forms styled, validation (email format, password length)
- [ ] Loading states during form submission
- [ ] Redirect to `/overview` after successful signin (simulated for now)

**Deliverable:** Auth flows feel complete (even though backend doesn't exist yet).

---

#### 2. Role Context Implementation
- [ ] `RoleContext.tsx` created
- [ ] Provides `role` state (provider | admin | parent)
- [ ] Wraps app in `layout.tsx`
- [ ] Default role: `provider`

**Deliverable:** Global role state available to all components.

---

#### 3. Role-Based Sidebar Filtering
- [ ] Each sidebar item has `roles: UserRole[]` property
- [ ] Sidebar filters items based on current role
- [ ] Provider sees: Overview, Patients, Schedule, Sessions, Notes, Prescriptions, Labs, Imaging, Referrals
- [ ] Admin sees: Overview (read-only), Admin Panel, Audit, Settings
- [ ] Parent sees: Overview (limited)

**Deliverable:** Sidebar items appear/disappear based on role.

---

#### 4. Role-Based Header Variants
- [ ] Provider header: Search bar + Notifications + Profile
- [ ] Admin header: Admin menu + Profile
- [ ] Parent header: Profile only
- [ ] Header changes instantly when role switches

**Deliverable:** Header adapts to role.

---

#### 5. Page-Level Access Control (Visual)
- [ ] Create `useRoleAccess` hook
- [ ] Hook returns `{ hasAccess, isReadOnly, role }`
- [ ] All protected pages use hook
- [ ] If no access → show `RestrictedState`

**Deliverable:** Unauthorized pages show calm "access restricted" message.

---

#### 6. Development Tool: Role Switcher
- [ ] `RoleSwitcher.tsx` component (bottom-right, fixed position)
- [ ] Three buttons: Provider, Admin, Parent
- [ ] Clicking switches role instantly
- [ ] Only visible in development mode

**Deliverable:** Easy role testing without backend.

---

### Success Criteria

✅ Auth pages functional (UI only)  
✅ Role context provides global role state  
✅ Sidebar filters items by role  
✅ Header variants work per role  
✅ Pages show RestrictedState for unauthorized roles  
✅ Role switcher enables easy testing  

**Demo:** Sign in, switch roles, show how sidebar and pages change.

**No Backend Yet. Visual Only.**

---

## 🟦 SPRINT 3 — BACKEND FOUNDATION

**Duration:** 2 weeks

**Goal:** Enforcement layer exists. Auth is real.

**Why This Sprint Matters:**
> "Backend enforces what frontend defined. This sprint builds the enforcement foundation. No features yet, just safety."

---

### Tasks

#### 1. Backend Project Skeleton
- [ ] NestJS project initialized
- [ ] Module structure created (see REPO_STRUCTURE.md)
- [ ] `src/modules/` folder with empty module folders
- [ ] `src/auth/` folder
- [ ] `src/common/` folder
- [ ] `src/config/` folder
- [ ] `src/database/` folder

**Deliverable:** Backend repo follows REPO_STRUCTURE.md exactly.

---

#### 2. Database Setup
- [ ] PostgreSQL running locally (Docker or native)
- [ ] Prisma or pg connection configured
- [ ] `tenants` table migration
- [ ] `users` table migration
- [ ] `audit_logs` table migration
- [ ] Test data seeded (1 tenant, 3 users with different roles)

**Deliverable:** Database exists with core tables.

---

#### 3. Auth & Identity Module
- [ ] POST `/auth/signin` endpoint
- [ ] POST `/auth/signup` endpoint
- [ ] POST `/auth/refresh` endpoint
- [ ] POST `/auth/signout` endpoint
- [ ] GET `/auth/me` endpoint (current user)
- [ ] JWT access token generation (15-min expiry)
- [ ] Refresh token generation (7-day expiry, stored in DB)
- [ ] Password hashing (bcrypt)

**Deliverable:** Auth endpoints functional, tokens issued.

---

#### 4. Tenant Isolation
- [ ] Middleware to inject `tenantId` into request context
- [ ] All queries filtered by `tenantId`
- [ ] Test: User from Tenant A cannot access Tenant B data

**Deliverable:** Cross-tenant data leakage impossible.

---

#### 5. Audit Logging Core
- [ ] `AuditService` created
- [ ] Logs: `user_created`, `user_signin`, `user_signout`
- [ ] Audit logs are append-only (no update/delete methods)
- [ ] Test: Audit log created on signin

**Deliverable:** Audit logging functional for auth events.

---

#### 6. Error Model
- [ ] Custom exceptions (ImmutableEntityException, InvalidStateTransitionException, TenantIsolationException)
- [ ] Global exception filter (HTTP response formatter)
- [ ] Error responses follow standard format:
  ```json
  {
    "errorCode": "string",
    "message": "string",
    "severity": "info | warning | critical"
  }
  ```

**Deliverable:** All errors return consistent format.

---

#### 7. Guards & Middleware
- [ ] `JwtAuthGuard` - Verifies access token
- [ ] `RoleGuard` - Checks user role
- [ ] `TenantGuard` - Verifies tenant isolation
- [ ] Applied globally to protected endpoints

**Deliverable:** Protected endpoints require valid token + role.

---

### Success Criteria

✅ Backend running locally  
✅ Database migrations applied  
✅ Auth endpoints functional (signin, signup, refresh, signout)  
✅ JWT tokens issued and validated  
✅ Tenant isolation enforced  
✅ Audit logging captures auth events  
✅ Error responses standardized  

**Demo:** Sign in via Postman, get token, call `/auth/me`, see audit log.

**No Business Features Yet. Just Foundation.**

---

## 🟦 SPRINT 4 — FRONTEND ↔ BACKEND INTEGRATION

**Duration:** 2 weeks

**Goal:** Frontend auth connects to backend. Role-based UI becomes real.

**Why This Sprint Matters:**
> "This is the integration point. Frontend defined truth, backend enforced it. Now they talk. If contracts are correct, this sprint is smooth. If not, we find out now."

---

### Tasks

#### 1. API Client Implementation
- [ ] `lib/api-client.ts` created
- [ ] Wrapper around `fetch` with:
  - Base URL from env var
  - Auto-attach access token from localStorage
  - Auto-refresh token on 401
  - Error handling (network errors, 4xx, 5xx)
- [ ] TypeScript types for all responses

**Deliverable:** Centralized API client ready.

---

#### 2. Auth Integration
- [ ] SignInForm calls `POST /auth/signin`
- [ ] On success: Store access token + refresh token
- [ ] On success: Redirect to `/overview`
- [ ] SignUpForm calls `POST /auth/signup`
- [ ] On success: Redirect to `/overview` (or verification screen if required)
- [ ] `useAuth` hook fetches `GET /auth/me` on app load
- [ ] If token expired, auto-refresh or redirect to signin

**Deliverable:** Auth flows work end-to-end.

---

#### 3. Role Context from Backend
- [ ] `RoleContext` gets role from `GET /auth/me` response
- [ ] Role switcher disabled (or hidden) in production
- [ ] Role switcher works only in dev mode

**Deliverable:** User role comes from backend, not hardcoded.

---

#### 4. Protected Routes
- [ ] Middleware checks if user is authenticated
- [ ] If not authenticated → Redirect to `/signin`
- [ ] If authenticated but wrong role → Show `RestrictedState`

**Deliverable:** Unauthenticated users cannot access app.

---

#### 5. Token Management
- [ ] Access token stored in memory (or localStorage with caution)
- [ ] Refresh token stored in httpOnly cookie (if backend supports) or localStorage
- [ ] Token refresh logic (auto-refresh before expiry)
- [ ] Signout clears tokens

**Deliverable:** Token lifecycle managed safely.

---

#### 6. Error Handling
- [ ] Network errors show `ErrorState`
- [ ] 401 → Redirect to signin
- [ ] 403 → Show `RestrictedState`
- [ ] 500 → Show `ErrorState` with retry
- [ ] Display error messages from backend

**Deliverable:** User sees meaningful errors.

---

### Success Criteria

✅ Frontend signin/signup works with backend  
✅ Tokens issued and stored  
✅ Role fetched from backend  
✅ Protected routes enforce authentication  
✅ Token refresh works automatically  
✅ Error states display correctly  

**Demo:** Sign in, navigate app, sign out, try accessing protected page without auth.

**Auth is Real. UI is Real. Integration Complete.**

---

## 🟦 SPRINT 5 — CORE READ DOMAINS

**Duration:** 2 weeks

**Goal:** Safe data access. UI shows real data.

**Why This Sprint Matters:**
> "Read before write. We build read-only flows first to prove data access works. No mutations yet, so nothing can break."

---

### Tasks

#### 1. Patients Module (Backend)
- [ ] `patients` table migration
- [ ] GET `/patients` - List patients (filtered by tenantId)
- [ ] GET `/patients/:id` - Get single patient
- [ ] Pagination support (limit, offset)
- [ ] Role check: Only provider and admin can access

**Deliverable:** Patients API ready.

---

#### 2. Patients Page (Frontend)
- [ ] Fetch patients list from API
- [ ] Display in table or cards
- [ ] Show `LoadingState` while fetching
- [ ] Show `EmptyState` if no patients
- [ ] Show `ErrorState` if fetch fails
- [ ] Pagination controls (if > 50 patients)

**Deliverable:** Patients page shows real data.

---

#### 3. Overview Summaries (Backend)
- [ ] GET `/overview/summary` - Aggregate stats
- [ ] Returns:
  - Total patients (for provider/admin)
  - Total sessions today (for provider)
  - Pending labs (for provider)
  - Recent activity (for admin)
  - Limited summary for parent
- [ ] Role-based response (different data per role)

**Deliverable:** Overview API returns role-specific summaries.

---

#### 4. Overview Page (Frontend)
- [ ] Fetch summary from API
- [ ] Display cards with stats
- [ ] Different layout per role (provider sees clinical stats, admin sees admin stats, parent sees limited)
- [ ] Show `LoadingState` while fetching

**Deliverable:** Overview page shows real, role-specific data.

---

#### 5. Lab Results Module (Backend, Read-Only)
- [ ] `lab_results` table migration
- [ ] GET `/labs` - List lab results (filtered by tenantId)
- [ ] GET `/labs/:id` - Get single lab result
- [ ] Seed some test lab results

**Deliverable:** Lab results API ready (read-only).

---

#### 6. Lab Results Page (Frontend, Read-Only)
- [ ] Fetch lab results from API
- [ ] Display in list with:
  - Test type
  - Status badge (ordered, pending, received, reviewed)
  - Abnormal flag (if true, show warning indicator)
  - Date
- [ ] Filter by status
- [ ] Show `EmptyState` if no results

**Deliverable:** Lab results page shows real data.

---

#### 7. Referrals Module (Backend, Read-Only)
- [ ] `referrals` table migration
- [ ] GET `/referrals` - List referrals
- [ ] GET `/referrals/:id` - Get single referral
- [ ] Seed some test referrals

**Deliverable:** Referrals API ready (read-only).

---

#### 8. Referrals Page (Frontend, Read-Only)
- [ ] Fetch referrals from API
- [ ] Display in list with:
  - Patient name
  - Specialty
  - Urgency badge (routine, urgent, emergency)
  - Status badge (created, sent, scheduled, completed, closed)
  - Date
- [ ] Filter by status

**Deliverable:** Referrals page shows real data.

---

### Success Criteria

✅ Patients API functional, frontend shows list  
✅ Overview API returns role-specific summaries  
✅ Lab results API functional, frontend shows list  
✅ Referrals API functional, frontend shows list  
✅ All read flows work (loading, empty, error states)  
✅ Pagination works (if needed)  

**Demo:** Navigate to patients, overview, labs, referrals. Show real data.

**No Mutations Yet. Read-Only Flows Complete.**

---

## 🟦 SPRINT 6 — WRITE DOMAINS (SAFE, IMMUTABLE)

**Duration:** 2 weeks

**Goal:** Controlled mutation with immutability enforcement.

**Why This Sprint Matters:**
> "Write operations are risky. We start with the most critical: clinical notes and prescriptions. Immutability is enforced at service layer + database triggers. Nothing finalized can ever be changed."

---

### Tasks

#### 1. Clinical Notes Module (Backend)
- [ ] `clinical_notes` table migration
- [ ] Database trigger: Prevent updates on `finalized` or `archived` notes
- [ ] POST `/notes` - Create draft note
- [ ] GET `/notes` - List notes (filtered by tenantId, patientId)
- [ ] GET `/notes/:id` - Get single note
- [ ] PUT `/notes/:id` - Update draft note (only if status = draft)
- [ ] PATCH `/notes/:id/finalize` - Finalize note (one-way, immutable)
- [ ] State machine enforced: `draft` → `finalized` → `archived`
- [ ] Audit log on finalize

**Deliverable:** Clinical notes API with immutability enforcement.

---

#### 2. Clinical Notes Page (Frontend)
- [ ] List clinical notes
- [ ] Create new draft note (modal or dedicated page)
- [ ] SOAP note editor:
  - Subjective textarea
  - Objective textarea
  - Assessment textarea
  - Plan textarea
  - Draft status badge
- [ ] Save draft (PUT endpoint)
- [ ] Finalize button (with confirmation modal: "This cannot be undone")
- [ ] Finalized notes show as read-only (no edit button)

**Deliverable:** Full clinical notes workflow (draft → finalize).

---

#### 3. Prescriptions Module (Backend)
- [ ] `prescriptions` table migration
- [ ] Database trigger: Prevent updates on `issued` prescriptions (except status transitions)
- [ ] POST `/prescriptions` - Create draft prescription
- [ ] GET `/prescriptions` - List prescriptions
- [ ] GET `/prescriptions/:id` - Get single prescription
- [ ] PUT `/prescriptions/:id` - Update draft (only if status = draft)
- [ ] PATCH `/prescriptions/:id/issue` - Issue prescription (one-way)
- [ ] PATCH `/prescriptions/:id/cancel` - Cancel prescription (terminal state)
- [ ] State machine enforced: `draft` → `issued` → `active` → `completed` or `cancelled`
- [ ] Audit log on issue, cancel

**Deliverable:** Prescriptions API with immutability enforcement.

---

#### 4. Prescriptions Page (Frontend)
- [ ] List prescriptions
- [ ] Create new draft prescription form:
  - Medication (text input or autocomplete)
  - Dosage
  - Duration
  - Instructions
- [ ] Save draft
- [ ] Issue button (with confirmation modal: "Once issued, cannot be edited")
- [ ] Issued prescriptions show as read-only
- [ ] Cancel button (with confirmation modal)

**Deliverable:** Full prescriptions workflow (draft → issue → cancel).

---

#### 5. Live Sessions Module (Backend)
- [ ] `live_sessions` table migration
- [ ] POST `/sessions` - Create scheduled session
- [ ] GET `/sessions` - List sessions
- [ ] GET `/sessions/:id` - Get single session
- [ ] PATCH `/sessions/:id/start` - Start session (scheduled → active)
- [ ] PATCH `/sessions/:id/complete` - Complete session (active → completed, immutable)
- [ ] State machine enforced: `scheduled` → `waiting` → `active` → `completed` → `archived`
- [ ] Audit log on complete

**Deliverable:** Sessions API with state transitions.

---

#### 6. Sessions Page (Frontend)
- [ ] List sessions (today's schedule)
- [ ] Create new session (schedule future appointment)
- [ ] Session card shows:
  - Patient name
  - Status badge (scheduled, waiting, active, completed)
  - Start/complete buttons (based on status)
- [ ] Start button (scheduled → active)
- [ ] Complete button (active → completed, with confirmation)
- [ ] Completed sessions show as read-only

**Deliverable:** Full session lifecycle (schedule → start → complete).

---

#### 7. Immutability Testing
- [ ] Test: Cannot update finalized note (expect 409 Conflict)
- [ ] Test: Cannot update issued prescription (expect 409 Conflict)
- [ ] Test: Cannot update completed session (expect 409 Conflict)
- [ ] Test: Database trigger rejects finalized note update (even if code has bug)

**Deliverable:** Immutability verified at app + DB level.

---

### Success Criteria

✅ Clinical notes workflow complete (draft → finalize)  
✅ Finalized notes immutable (verified)  
✅ Prescriptions workflow complete (draft → issue → cancel)  
✅ Issued prescriptions immutable (verified)  
✅ Sessions workflow complete (schedule → start → complete)  
✅ Completed sessions immutable (verified)  
✅ Audit logs capture all critical actions  

**Demo:** Create note, finalize it, try to edit (fails). Create prescription, issue it, try to edit (fails).

**Immutability Enforced. Write Flows Safe.**

---

## 🟦 SPRINT 7 — AI INTEGRATION (READ-ONLY, HUMAN-IN-THE-LOOP)

**Duration:** 2 weeks

**Goal:** AI assists without authority. Human-in-the-loop mandatory.

**Why This Sprint Matters:**
> "AI is powerful but dangerous. We integrate it last, with maximum constraints. It can suggest, but never decide. It can read, but never write. It can help, but never replace."

---

### Tasks

#### 1. AI Gateway Service Setup
- [ ] Separate AI service initialized (ai/)
- [ ] Database connection with read-only user:
  ```sql
  GRANT SELECT ON clinical_notes, lab_results, live_sessions, patients TO ai_gateway_user;
  REVOKE INSERT, UPDATE, DELETE ON ALL TABLES FROM ai_gateway_user;
  ```
- [ ] OpenAI or Anthropic API client configured
- [ ] Environment variables: `AI_API_KEY`, `AI_MODEL`

**Deliverable:** AI Gateway service running, read-only DB access verified.

---

#### 2. Context Preparation Service
- [ ] Build patient summary (demographics only, current patient)
- [ ] Build session transcript (current session only)
- [ ] Build recent notes (last 5, current patient only)
- [ ] Scoped to: userId, patientId, sessionId, tenantId
- [ ] Validate user has access before building context

**Deliverable:** AI context preparation functional, scoped correctly.

---

#### 3. AI Suggestion Endpoints (Backend)
- [ ] POST `/ai/suggest-note` - Generate SOAP note suggestion
- [ ] POST `/ai/summarize-session` - Generate session summary
- [ ] POST `/ai/explain-lab` - Explain lab result
- [ ] Request validation: userId, patientId, sessionId (if applicable)
- [ ] Response includes:
  ```json
  {
    "suggestionId": "UUID",
    "confidence": "high | medium | low | very_low",
    "content": { ... },
    "reasoning": "string",
    "disclaimer": "This is an AI suggestion..."
  }
  ```
- [ ] Rate limiting: 10 requests/min per user

**Deliverable:** AI endpoints functional, rate-limited.

---

#### 4. AI UI Components (Frontend)
- [ ] `AISuggestionBox.tsx` - Display AI suggestion with Accept/Edit/Dismiss buttons
- [ ] `ConfidenceIndicator.tsx` - Badge showing high/medium/low confidence
- [ ] `AIDisclaimerBadge.tsx` - "AI Suggestion" label
- [ ] AI UI states: Idle, Generating, Suggestion Ready, Confidence Low, Human Review Required

**Deliverable:** AI UI components ready.

---

#### 5. AI Integration in Clinical Notes
- [ ] "Suggest with AI" button in draft notes (only visible when status = draft)
- [ ] Clicking button:
  - Sends request to `/ai/suggest-note`
  - Shows loading spinner
  - Displays suggestion in `AISuggestionBox`
  - Shows confidence indicator
- [ ] User can:
  - Accept → Suggestion inserted into SOAP fields
  - Edit → User modifies before inserting
  - Dismiss → Suggestion discarded
- [ ] Acceptance logged to `ai_interactions` table

**Deliverable:** AI suggests SOAP notes, provider reviews and accepts/dismisses.

---

#### 6. AI Audit Logging
- [ ] `ai_interactions` table migration
- [ ] Log every AI request:
  - userId
  - contextType (draft_note, session_transcript, lab_result)
  - contextId (noteId, sessionId, labId)
  - confidenceLevel
  - accepted (true/false)
  - timestamp
- [ ] Admin can query AI usage

**Deliverable:** All AI interactions logged.

---

#### 7. AI Safety Testing
- [ ] Test: AI with insufficient context refuses (confidence very_low)
- [ ] Test: AI cannot write to database (read-only user verified)
- [ ] Test: Rate limit enforced (11th request in 1 min returns 429)
- [ ] Test: Cross-patient data not accessible (AI sees only current patient)

**Deliverable:** AI safety guarantees verified.

---

### Success Criteria

✅ AI Gateway running with read-only DB access  
✅ AI suggests SOAP notes for drafts  
✅ AI suggestions show confidence level  
✅ Human-in-the-loop: Accept/Edit/Dismiss functional  
✅ AI interactions logged to audit table  
✅ Rate limiting enforced  
✅ AI cannot access cross-patient data  

**Demo:** Create draft note, click "Suggest with AI", show suggestion, accept it, verify logged.

**AI Assists. Never Decides. Never Writes.**

---

## 🟦 SPRINT 8 — HARDENING & PRODUCTION READINESS

**Duration:** 2 weeks

**Goal:** Production-grade safety, compliance, monitoring.

**Why This Sprint Matters:**
> "This is the difference between a prototype and a clinical system. Every safety mechanism is tested. Every failure mode is designed. Every secret is secured. No shortcuts allowed."

---

### Tasks

#### 1. Rate Limiting (All Endpoints)
- [ ] Auth endpoints: 5 requests/min per IP
- [ ] AI endpoints: 10 requests/min per user
- [ ] Write endpoints: 30 requests/min per user
- [ ] Read endpoints: 100 requests/min per user
- [ ] Redis-based rate limiter (or in-memory for MVP)
- [ ] Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Deliverable:** All endpoints rate-limited.

---

#### 2. Permission Audits
- [ ] Test: Provider cannot access admin endpoints (expect 403)
- [ ] Test: Admin cannot create clinical notes (expect 403)
- [ ] Test: Parent cannot access clinical endpoints (expect 403)
- [ ] Test: User from Tenant A cannot access Tenant B data (expect 404)
- [ ] Test: Finalized note cannot be edited (expect 409)

**Deliverable:** Permission matrix verified.

---

#### 3. Failure Mode Testing
- [ ] Test: Database connection lost → Return 503, retry logic
- [ ] Test: AI service down → Return user-friendly error, degrade gracefully
- [ ] Test: Invalid state transition → Return 409 with clear message
- [ ] Test: Immutability violation → Return 409 Critical error
- [ ] Test: Cross-tenant access attempt → Return 404 (not 403, to hide existence)

**Deliverable:** All failure modes handled gracefully.

---

#### 4. Logging & Monitoring
- [ ] Structured logging (Winston or Pino)
- [ ] Log levels: error, warn, info, debug
- [ ] Log: HTTP requests (method, path, status, duration)
- [ ] Log: Auth failures (email, IP, timestamp)
- [ ] Log: State transition errors
- [ ] Log: AI requests and failures
- [ ] Do NOT log: Passwords, tokens, patient PHI

**Deliverable:** Comprehensive logging in place.

---

#### 5. Security Review
- [ ] SQL injection prevention verified (parameterized queries only)
- [ ] XSS prevention verified (React escapes by default, confirm)
- [ ] CSRF protection (if using cookies)
- [ ] HTTPS enforced (staging/prod)
- [ ] Secrets not in code (environment variables only)
- [ ] `.env` files gitignored
- [ ] CORS configured (strict origin, no wildcards)
- [ ] Helmet.js or equivalent (security headers)

**Deliverable:** Security checklist complete.

---

#### 6. Database Backup & Recovery
- [ ] Database backup strategy defined (daily, 7-day retention minimum)
- [ ] Restore tested (from backup to fresh DB)
- [ ] Migrations reversible (DOWN scripts)

**Deliverable:** Data can be recovered.

---

#### 7. Staging Environment Deployment
- [ ] Deploy backend to staging
- [ ] Deploy frontend to staging
- [ ] Deploy AI Gateway to staging
- [ ] Environment variables separated from dev
- [ ] Test end-to-end in staging

**Deliverable:** Staging environment mirrors production.

---

#### 8. Documentation Final Pass
- [ ] API documentation up-to-date (OpenAPI spec generated)
- [ ] Deployment guide written
- [ ] Environment setup guide written
- [ ] Runbook for common issues

**Deliverable:** Docs complete for handoff.

---

### Success Criteria

✅ Rate limiting enforced across all endpoints  
✅ Permission matrix verified (no access violations)  
✅ Failure modes tested and handled  
✅ Logging comprehensive and privacy-safe  
✅ Security review complete  
✅ Database backup/restore tested  
✅ Staging environment deployed and functional  
✅ Documentation complete  

**Demo:** Show rate limiting, show error handling, show logs, show staging deployment.

**Production Ready.**

---

## DEFINITION OF DONE (MANDATORY)

### Sprint is DONE Only If:

✅ **All tasks completed** (no placeholders, no TODOs in merged code)  
✅ **Tests passing** (unit tests for services, integration tests for critical flows)  
✅ **Linting passing** (no warnings, no errors)  
✅ **Documentation updated** (if architecture changed, docs updated)  
✅ **Demo-able** (sprint review can show working feature)  
✅ **No shortcuts added** (no "temporary" code, no bypassing rules)  
✅ **No broken contracts** (API contracts match frontend expectations)  
✅ **AI boundaries intact** (if AI sprint, read-only verified)  

**If ANY checkbox unchecked → Sprint NOT done. Continue work.**

---

## SPRINT DEPENDENCIES (CRITICAL)

### Dependency Chain

```
Sprint 0 (Project Hardening)
  ↓
Sprint 1 (Frontend Foundation)
  ↓
Sprint 2 (Auth & Role-Based UI)
  ↓
Sprint 3 (Backend Foundation)
  ↓
Sprint 4 (Frontend ↔ Backend Integration)
  ↓
Sprint 5 (Core Read Domains)
  ↓
Sprint 6 (Write Domains, Immutable)
  ↓
Sprint 7 (AI Integration, Read-Only)
  ↓
Sprint 8 (Hardening & Production Readiness)
```

**Cannot skip. Cannot reorder. Dependencies are absolute.**

---

## RISK MITIGATION

### High-Risk Areas (Monitor Closely)

| Risk | Sprint | Mitigation |
|------|--------|------------|
| **Frontend/Backend Contract Mismatch** | Sprint 4 | Integration sprint dedicated to alignment |
| **Immutability Bypass** | Sprint 6 | Database triggers + service layer enforcement |
| **AI Writes to Database** | Sprint 7 | Read-only DB user, verified in tests |
| **Cross-Tenant Data Leak** | Sprint 3, 4 | Tenant guard + row-level security |
| **Rate Limit Bypass** | Sprint 8 | Redis-based limiter, tested |

---

## VELOCITY ASSUMPTIONS

### Expected Velocity (Story Points per Sprint)

- Sprint 0: 20 points (setup tasks)
- Sprint 1: 30 points (UI implementation)
- Sprint 2: 25 points (Auth UI + roles)
- Sprint 3: 35 points (Backend foundation, complex)
- Sprint 4: 20 points (Integration, debugging expected)
- Sprint 5: 30 points (CRUD APIs, straightforward)
- Sprint 6: 40 points (State machines, immutability, critical)
- Sprint 7: 35 points (AI integration, complex)
- Sprint 8: 30 points (Testing, hardening)

**Total:** ~265 story points across 8 sprints (including Sprint 0)

**Adjustment:** If velocity lower than expected, extend sprints or reduce scope. **Do NOT skip safety features.**

---

## POST-SPRINT 8 (OPTIONAL ENHANCEMENTS)

### After Production Readiness, Consider:

**Sprint 9: Additional Clinical Workflows**
- Medical imaging workflow (upload, review)
- Advanced referral tracking
- Patient portal (parent role features)

**Sprint 10: Performance Optimization**
- Database query optimization
- Frontend bundle size reduction
- Caching layer (Redis)

**Sprint 11: Advanced AI Features**
- Lab result explanations (more detail)
- Session summaries (more contexts)
- Differential diagnosis suggestions (extremely cautious, human-review required)

**Sprint 12: Mobile Responsiveness**
- Optimize UI for tablets
- Mobile layout variants
- Touch-friendly controls

**Philosophy:** These are enhancements, not requirements. Ship production-ready system first, enhance later.

---

## SPRINT RETROSPECTIVE TEMPLATE

### After Each Sprint, Ask:

1. **What went well?**
2. **What slowed us down?**
3. **What will we change next sprint?**
4. **Did we violate any architectural principles?** (If yes, fix immediately)
5. **Is documentation up-to-date?** (If no, update before next sprint)

**Retrospective is mandatory. Skipping retrospective = accumulating debt.**

---

## FINAL PHILOSOPHY

### Every Sprint Reduces Risk

> "We don't ship features to say 'we're fast.' We ship foundations to say 'we're safe.' Speed without safety is recklessness. Clinical systems punish recklessness with lawsuits, not applause."

### Discipline = Speed

> "Linting enforces rules. Tests catch bugs. Reviews catch shortcuts. Discipline is slower on day 1, but faster by week 12. Undisciplined teams ship bugs, then spend months fixing them. Disciplined teams ship once, correctly."

### No Shortcuts, Ever

> "The moment you say 'just for now,' you've created technical debt. Technical debt in clinical systems is not code smell—it's patient risk. If a shortcut feels tempting, it is forbidden."

---

**Last Updated:** January 14, 2026  
**Status:** Sprint Breakdown Complete  
**Integration:** Implements BACKEND_ARCHITECTURE.md, DATABASE_SCHEMA.md, TECH_STACK_VALIDATION.md, AI_IMPLEMENTATION_PLAN.md, REPO_STRUCTURE.md  
**Next Step:** Sprint 0 kickoff (1 week from now)  
**Estimated Completion:** 14 weeks (~3.5 months) from Sprint 0 start
