# RELEASE CHECKLIST — Dr Amal Clinical OS v2.0

**Document Status:** 🟢 ACTIVE  
**Last Updated:** January 14, 2026  
**Owner:** Release Manager / Tech Lead

---

## PURPOSE

This document defines the **mandatory release checklist** for Dr Amal Clinical OS v2.0.

**Philosophy:**
- **Shipping is easy, undoing harm is not**
- **Clinical systems earn trust slowly**
- **Discipline is the product**

---

## 🚦 ABSOLUTE RELEASE RULE

**If ANY item below is ❌ → RELEASE IS BLOCKED**

No exceptions.  
No "we'll fix it later."  
No "it's just a small release."

Every release is **patient-impacting**.

---

## RELEASE CHECKLIST

### 1️⃣ FRONTEND VERIFICATION

#### ✅ Required Checks

- [ ] **App Shell Loads Correctly**
  - All pages render without console errors
  - No white screen of death
  - Loading states show appropriately
  - Error boundaries catch failures gracefully

- [ ] **Sidebar Visibility Matches Role Matrix**
  - Provider sees: Dashboard, Patients, Sessions, Clinical Notes, Prescriptions, Labs, Referrals
  - Admin sees: Dashboard, Tenants, Users, Audit Logs
  - Caregiver sees: Dashboard, Patients (read-only), Sessions (read-only)
  - Reference: ROLE_BASED_UI.md

- [ ] **Restricted Pages Show Calm Messaging**
  - No angry "Access Denied" or "Forbidden"
  - Use gentle language: "This page is not available for your role"
  - No error codes exposed to users
  - No stack traces visible

- [ ] **Finalized / Archived Data Is Read-Only**
  - Finalized clinical notes cannot be edited (inputs disabled, no save button)
  - Issued prescriptions cannot be modified (read-only view)
  - Archived sessions cannot be reopened (no actions available)
  - UI clearly indicates read-only state (visual styling, disabled controls)

- [ ] **No Debug UI or Test Routes Visible**
  - No `/debug`, `/test`, `/admin-dev` routes accessible
  - No "Test Mode" toggles in production
  - No mock data switches
  - No developer-only controls

#### ❌ BLOCK CONDITIONS

**Immediate block if:**
- ✋ UI implies illegal actions (e.g., "Edit Finalized Note" button exists)
- ✋ AI output is unlabeled (missing "AI-generated" disclaimer)
- ✋ Role-restricted pages accessible without proper guards
- ✋ Console shows errors on initial load

---

### 2️⃣ AUTH & ACCESS CONTROL

#### ✅ Required Checks

- [ ] **Roles Enforced Server-Side**
  - Every protected endpoint has role guard (`@Roles()` decorator)
  - Frontend role cannot be spoofed (backend validates JWT role claim)
  - Test: Modify frontend localStorage role → should have no effect on API access

- [ ] **Pending Accounts Cannot Access Clinical Data**
  - User with `accountStatus: 'pending'` blocked from all clinical endpoints
  - Can only access: profile, logout
  - Test: Create pending user → verify no access to /patients, /sessions, etc.

- [ ] **Locked Accounts Are Fully Blocked**
  - User with `accountStatus: 'locked'` cannot authenticate
  - Existing tokens invalidated
  - Test: Lock user → verify all API calls return 401

- [ ] **Tokens Scoped Correctly (User + Tenant)**
  - JWT includes: `userId`, `tenantId`, `role`
  - Every query auto-filters by `tenantId` from token
  - Test: Provider from Clinic A cannot access Clinic B's data

- [ ] **Token Expiry and Refresh Working**
  - Access token expires in 15 minutes
  - Refresh token expires in 7 days
  - Refresh token rotation enabled
  - Test: Wait 16 minutes → should prompt re-auth or auto-refresh

- [ ] **Session Fixation Prevented**
  - New session ID on login
  - Old session invalidated on logout
  - Test: Copy token before logout → should be invalid after logout

#### ❌ BLOCK CONDITIONS

**Immediate block if:**
- ✋ Any endpoint trusts frontend role flags (role must come from JWT)
- ✋ Cross-tenant data leak confirmed (even read-only)
- ✋ Pending or locked users can access clinical data
- ✋ Tokens do not expire or refresh fails

---

### 3️⃣ STATE MACHINE ENFORCEMENT

#### ✅ Required Checks

- [ ] **All State Transitions Validated**
  - Every state change validated against STATE_MACHINES.md
  - Invalid transitions return clear error: `"Cannot transition from X to Y"`
  - Test each critical transition path (at least):
    - `session: draft → active → ended`
    - `clinical_note: draft → finalized → archived`
    - `prescription: draft → issued → active`
    - `user: pending → active → locked`

- [ ] **Illegal Transitions Rejected**
  - Cannot skip states (e.g., `draft → archived` without `finalized`)
  - Cannot reverse terminal states (e.g., `finalized → draft`)
  - Test: Attempt illegal transition → verify 400 Bad Request

- [ ] **Terminal States Are Immutable**
  - `clinical_note.status = 'finalized'` → cannot edit content
  - `session.status = 'ended'` → cannot reopen
  - `prescription.status = 'cancelled'` → cannot reactivate
  - Database triggers enforce immutability (see DATABASE_SCHEMA.md)

- [ ] **State Guards Enforce Role + State**
  - Only provider can finalize clinical notes
  - Only provider in active session can create prescriptions
  - Only admin can lock users
  - Test: Non-provider attempts finalize → verify 403 Forbidden

#### ❌ BLOCK CONDITIONS

**Immediate block if:**
- ✋ Finalized data can be modified (even by admin)
- ✋ Illegal state transitions succeed
- ✋ State changes bypass role checks
- ✋ Database allows immutability violations

---

### 4️⃣ AI SAFETY CHECK (CRITICAL)

#### ✅ Required Checks

- [ ] **AI Is Read-Only**
  - AI service has read-only database user
  - AI cannot INSERT, UPDATE, DELETE clinical tables
  - Test: AI service attempts write → verify database permission denied

- [ ] **AI Cannot Write, Finalize, Approve, or Trigger**
  - AI cannot call `/clinical-notes/:id/finalize`
  - AI cannot call `/prescriptions/:id/issue`
  - AI cannot call any POST/PUT/PATCH/DELETE endpoints
  - Test: AI service attempts write endpoint → verify 403 Forbidden

- [ ] **AI Suggestions Require Human Action**
  - All AI output clearly labeled: "AI-generated suggestion (not finalized)"
  - Provider must explicitly click "Accept" or "Apply"
  - No auto-apply, no auto-finalize
  - Test: AI returns suggestion → verify no automatic application

- [ ] **AI Confidence Handling Works**
  - AI refuses if confidence < 50%
  - AI returns `confidence` score with every response
  - Low confidence shows warning: "AI is uncertain - review carefully"
  - Test: Trigger low-confidence scenario → verify refusal or warning

- [ ] **AI Refuses Unsafe Contexts**
  - AI refuses diagnosis requests
  - AI refuses triage scoring
  - AI refuses cross-patient analysis
  - AI returns error: `"This request is outside my boundaries"`
  - Test: Ask AI "What is the diagnosis?" → verify refusal

- [ ] **AI Output Includes Reasoning**
  - Every AI response includes `reasoning` field
  - Reasoning explains how AI arrived at suggestion
  - Test: Request AI suggestion → verify reasoning present

- [ ] **AI Rate Limiting Enforced**
  - 10 requests per minute per user
  - Rate limit header included in response
  - Test: Make 11 requests in 1 minute → verify 429 Too Many Requests

- [ ] **AI Interactions Logged**
  - Every AI request logged in `ai_interactions` table
  - Logs include: userId, tenantId, action, inputContext, confidenceScore, timestamp
  - No PHI in logs (only metadata)
  - Test: Make AI request → verify audit log entry

#### ❌ BLOCK CONDITIONS

**Immediate block if:**
- ✋ AI auto-applies content (no human approval)
- ✋ AI runs in background without user initiation
- ✋ AI has write permissions to clinical tables
- ✋ AI output is not clearly labeled
- ✋ AI accepts forbidden use cases (diagnosis, triage, cross-patient)

---

### 5️⃣ AUDIT & LOGGING

#### ✅ Required Checks

- [ ] **All Critical Actions Logged**
  - Clinical note finalized → audit log entry
  - Prescription issued → audit log entry
  - Lab result reviewed → audit log entry
  - User locked → audit log entry
  - Session ended → audit log entry
  - Test: Perform critical action → verify audit log entry created

- [ ] **Logs Are Append-Only**
  - `audit_logs` table has no UPDATE or DELETE permissions
  - Database trigger prevents modifications
  - Test: Attempt to update audit log → verify permission denied

- [ ] **AI Interactions Logged (Metadata Only)**
  - Every AI request logged in `ai_interactions` table
  - Logs include: action, confidence, timestamp
  - Logs do NOT include patient data or PHI
  - Test: Review AI logs → verify no PHI present

- [ ] **No Sensitive Data in Logs**
  - No passwords (even hashed)
  - No full tokens (can log last 4 chars only)
  - No patient SSN, diagnosis, or treatment details
  - Error logs sanitized (no PHI in error messages)

- [ ] **Audit Log Includes Context**
  - Who: `userId`, `role`
  - What: `action`, `entityType`, `entityId`
  - When: `timestamp`
  - Where: `tenantId`, `ipAddress` (optional)
  - Why: `metadata` (e.g., `{ reason: "session ended normally" }`)

- [ ] **Audit Logs Queryable**
  - Admin can view audit logs via UI
  - Logs filterable by: user, date range, action type
  - Logs exportable for compliance reviews

#### ❌ BLOCK CONDITIONS

**Immediate block if:**
- ✋ Any mutation (finalize, issue, archive) lacks audit entry
- ✋ Audit logs can be modified or deleted
- ✋ Sensitive data (passwords, full tokens, PHI) appears in logs
- ✋ AI interactions not logged

---

### 6️⃣ DATA & SCHEMA SAFETY

#### ✅ Required Checks

- [ ] **Schema Matches Approved Design**
  - All tables match DATABASE_SCHEMA.md
  - All columns have documented purpose
  - No "temporary" or "test" tables in production
  - Test: Compare production schema to DATABASE_SCHEMA.md → verify exact match

- [ ] **No Emergency Fields Added**
  - No `temp_field`, `quick_fix_column`, or undocumented fields
  - All schema changes went through migration process
  - Test: Review recent migrations → verify all documented in DATABASE_SCHEMA.md

- [ ] **Migrations Reviewed**
  - All migrations have descriptive names
  - All migrations reviewed by at least 2 engineers
  - Migration rollback tested in staging
  - Test: Review migration history → verify naming and review notes

- [ ] **No Destructive Migrations**
  - No `DROP TABLE`, `DROP COLUMN` in production migrations
  - Data migrations preserve existing data
  - Test: Review migrations → verify no destructive operations

- [ ] **Immutability Rules Enforced**
  - Database triggers prevent updates to finalized clinical notes
  - Database triggers prevent updates to issued prescriptions
  - Database triggers prevent updates to audit logs
  - Test: Attempt direct database update to finalized note → verify trigger prevents it

- [ ] **Foreign Key Constraints Enforced**
  - All foreign keys validated
  - Cascading deletes configured correctly (or disabled for clinical data)
  - Test: Attempt to delete tenant with patients → verify constraint prevents it

- [ ] **Indexes Present for Performance**
  - All foreign keys indexed
  - Tenant ID indexed on all multi-tenant tables
  - Frequently queried fields indexed
  - Test: Review query performance in staging → verify no full table scans

#### ❌ BLOCK CONDITIONS

**Immediate block if:**
- ✋ Immutability rules violated (finalized data can be updated)
- ✋ Schema differs from DATABASE_SCHEMA.md
- ✋ Undocumented fields exist
- ✋ Destructive migration in production

---

### 7️⃣ SECURITY & SECRETS

#### ✅ Required Checks

- [ ] **No Secrets in Code or Configs**
  - No API keys, passwords, tokens in source code
  - No secrets in `git log` history
  - Test: Run `git log --all | grep -E "(password|api_key|secret|token)"` → should find nothing

- [ ] **Environment Variables Validated**
  - All required env vars documented in `.env.example`
  - Missing env vars cause startup failure (fail-fast)
  - Test: Remove required env var → verify app refuses to start

- [ ] **Rate Limits Enabled**
  - Auth endpoints: 5 attempts per minute per IP
  - AI endpoints: 10 requests per minute per user
  - API endpoints: 100 requests per minute per user
  - Test: Exceed rate limit → verify 429 response

- [ ] **Error Messages Sanitized**
  - No stack traces in production API responses
  - No database schema details leaked
  - Generic error: `"An error occurred. Please contact support."`
  - Detailed logs stored server-side only

- [ ] **HTTPS Enforced**
  - All endpoints require HTTPS
  - HTTP requests redirected to HTTPS
  - Test: Attempt HTTP request → verify redirect or rejection

- [ ] **CORS Configured Correctly**
  - Only allowed origins accepted
  - No `Access-Control-Allow-Origin: *`
  - Test: Request from unauthorized origin → verify CORS rejection

- [ ] **Security Headers Present**
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000`
  - `Content-Security-Policy` configured
  - Test: Check response headers → verify all present

- [ ] **SQL Injection Prevention**
  - All queries use parameterized statements (Prisma or prepared statements)
  - No raw string concatenation in SQL
  - Test: Attempt SQL injection via API → verify sanitization

- [ ] **XSS Prevention**
  - All user input sanitized on display
  - CSP headers prevent inline scripts
  - Test: Attempt XSS via input field → verify sanitization

#### ❌ BLOCK CONDITIONS

**Immediate block if:**
- ✋ Tokens appear in logs or error messages
- ✋ Debug endpoints exposed in production
- ✋ Secrets found in code or git history
- ✋ Rate limiting not working
- ✋ Stack traces visible to users

---

### 8️⃣ PERFORMANCE & STABILITY (BASELINE)

#### ✅ Required Checks

- [ ] **Auth Endpoints Stable**
  - `/auth/login` responds in < 500ms (p95)
  - `/auth/refresh` responds in < 300ms (p95)
  - No authentication failures under normal load
  - Test: Load test with 100 concurrent users → verify stability

- [ ] **Read Endpoints Responsive**
  - `/patients` responds in < 1s (p95)
  - `/clinical-notes` responds in < 1s (p95)
  - `/prescriptions` responds in < 1s (p95)
  - Test: Load test read endpoints → verify response times

- [ ] **AI Rate Limits Enforced**
  - AI requests capped at 10/min per user
  - AI does not consume unbounded resources
  - Test: Exceed AI rate limit → verify 429 response

- [ ] **No Memory Leaks Observed**
  - Backend memory stable over 24 hours
  - Frontend memory stable over extended session
  - Test: Run app for 24 hours → verify memory does not grow unbounded

- [ ] **Database Connection Pool Configured**
  - Connection pool size appropriate for load
  - Connections released after use
  - Test: Monitor database connections → verify no leaks

- [ ] **Graceful Degradation**
  - If AI service down, app still functions (AI features disabled)
  - If database slow, app shows loading state (not crash)
  - Test: Disable AI service → verify app continues working

#### ❌ BLOCK CONDITIONS

**Immediate block if:**
- ✋ AI usage can spike uncontrollably (no rate limit)
- ✋ Memory leaks detected (memory grows over time)
- ✋ Auth endpoints fail under normal load
- ✋ App crashes when AI service unavailable

---

### 9️⃣ DOCUMENTATION SYNC

#### ✅ Required Checks

- [ ] **State Machines Up to Date**
  - STATE_MACHINES.md reflects all current states
  - All state transitions documented
  - Guards and constraints documented
  - Test: Compare code to STATE_MACHINES.md → verify exact match

- [ ] **API Contracts Up to Date**
  - API_CONTRACTS.md includes all endpoints
  - Request/response formats documented
  - Status codes documented
  - Test: Compare API implementation to API_CONTRACTS.md → verify match

- [ ] **AI Policies Up to Date**
  - AI_ASSISTANT_SPEC.md reflects current AI boundaries
  - AI_IMPLEMENTATION_PLAN.md reflects current implementation
  - Approved and forbidden use cases documented
  - Test: Compare AI code to AI_ASSISTANT_SPEC.md → verify match

- [ ] **Database Schema Up to Date**
  - DATABASE_SCHEMA.md matches production schema
  - All tables, columns, constraints documented
  - Immutability triggers documented
  - Test: Compare production schema to DATABASE_SCHEMA.md → verify match

- [ ] **Backend Architecture Up to Date**
  - BACKEND_ARCHITECTURE.md reflects current implementation
  - Domain boundaries documented
  - Authorization model documented
  - Test: Review recent backend changes → verify documented

- [ ] **Release Notes Written**
  - What changed (features, fixes, improvements)
  - What was removed or deprecated
  - Migration steps (if any)
  - Known issues (if any)
  - Test: Review release notes → verify completeness

#### ❌ BLOCK CONDITIONS

**Immediate block if:**
- ✋ Docs lag behind code (any major discrepancy)
- ✋ New states or endpoints not documented
- ✋ AI boundaries changed without updating AI_ASSISTANT_SPEC.md
- ✋ Release notes missing

---

### 🔟 FINAL RELEASE QUESTIONS (MANDATORY)

**Release approver must answer YES to all three questions:**

#### Question 1: Would I deploy this for my own family?

- If my parent or child needed medical care, would I trust this release?
- If I saw a bug or safety issue, would I feel responsible for harm caused?
- **Answer:** ☐ YES ☐ NO

#### Question 2: Can I explain this release to a regulator?

- If a HIPAA auditor asked "Why did you release this?", could I justify it?
- If a patient safety board asked "What safeguards are in place?", could I explain?
- **Answer:** ☐ YES ☐ NO

#### Question 3: Does this reduce long-term risk?

- Does this release make the system safer, more maintainable, or more compliant?
- Does this release introduce new risks that outweigh benefits?
- **Answer:** ☐ YES ☐ NO

---

**🚨 If ANY answer is NO → RELEASE IS BLOCKED**

Do not proceed until concerns are resolved.

---

## POST-RELEASE PROCEDURES

### Immediate Post-Release (First 24 Hours)

- [ ] **Monitor Audit Logs**
  - Watch for unusual activity (unexpected state transitions, auth failures)
  - Alert on: finalized data modifications, cross-tenant access attempts, AI write attempts
  - Review hourly for first 4 hours, then every 4 hours

- [ ] **Monitor AI Usage**
  - Track AI request volume
  - Alert on: rate limit violations, confidence threshold refusals, forbidden use case attempts
  - Review AI interaction logs for anomalies

- [ ] **Monitor Error Rates**
  - Track 4xx and 5xx error rates
  - Alert on: spike in 403 (authorization), spike in 500 (server errors)
  - Investigate any errors > 1% of requests

- [ ] **Monitor Performance**
  - Track API response times
  - Alert on: p95 latency > 2s, database connection pool exhaustion
  - Review hourly for first 4 hours

- [ ] **Rollback Plan Ready**
  - Document how to rollback (git tag, deployment command)
  - Test rollback in staging BEFORE release
  - Keep previous version running in background (blue-green) if possible
  - Decision threshold: Rollback if critical bug affecting > 5% of users

### Extended Monitoring (First Week)

- [ ] **Daily Audit Log Review**
  - Review audit logs for anomalies
  - Check for: immutability violations, unauthorized access, AI boundary violations

- [ ] **Daily Error Log Review**
  - Review error logs for patterns
  - Investigate any new error types

- [ ] **Weekly Metrics Review**
  - Compare metrics to pre-release baseline
  - Check for: performance degradation, increased error rates, user complaints

---

## RELEASE APPROVAL SIGN-OFF

**Required Signatures (Digital or Email Confirmation):**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Release Manager** | _______________ | __________ | __________ |
| **Tech Lead** | _______________ | __________ | __________ |
| **Security Lead** | _______________ | __________ | __________ |
| **Product Manager** | _______________ | __________ | __________ |

**All four roles must approve before release.**

---

## EMERGENCY RELEASE PROCESS

In case of **critical production bug** or **security vulnerability**, follow expedited process:

### Criteria for Emergency Release

- Production system down or severely degraded
- Active security vulnerability being exploited
- Data integrity at risk

### Expedited Checklist (Minimum Required)

1. **Fix verified in staging** → YES / NO
2. **Rollback plan ready** → YES / NO
3. **State machine safety verified** → YES / NO
4. **AI safety verified** → YES / NO
5. **Audit logging working** → YES / NO
6. **Docs updated** → YES / NO (or marked as TODO)

**Required approval:** Tech Lead + one other lead

**Documentation:**
- Document what was skipped in emergency
- Create follow-up issue to complete full checklist
- Review within 48 hours: "Should we rollback?"

---

## RELEASE VERSIONING

### Semantic Versioning (MAJOR.MINOR.PATCH)

**Example:** `v2.3.1`

- **MAJOR (2.x.x):** Breaking changes (state machine changes, API contract breaks)
- **MINOR (x.3.x):** New features (new endpoints, new AI use cases, new states)
- **PATCH (x.x.1):** Bug fixes, security patches (no new features, no breaking changes)

### Pre-Release Tags

- **Alpha:** `v2.0.0-alpha.1` (internal testing only)
- **Beta:** `v2.0.0-beta.1` (limited external testing)
- **RC:** `v2.0.0-rc.1` (release candidate, production-ready pending final approval)

### Git Tagging

```bash
# Tag release
git tag -a v2.0.0 -m "Release v2.0.0 - Initial production release"

# Push tag
git push origin v2.0.0
```

---

## PHILOSOPHY

### Why This Matters

**Shipping is easy, undoing harm is not.**

- Deploying code takes minutes
- Fixing harm takes months or years
- Clinical systems must earn trust slowly

**Clinical systems earn trust slowly.**

- Every bug erodes confidence
- Every security issue creates liability
- Every data leak violates patient trust

**Discipline is the product.**

- Discipline in testing → fewer bugs
- Discipline in documentation → clearer system
- Discipline in releases → safer patients

---

## RELATED DOCUMENTATION

- [PR_REVIEW_CHECKLIST.md](./PR_REVIEW_CHECKLIST.md) — Code review standards
- [ISSUE_GOVERNANCE.md](./ISSUE_GOVERNANCE.md) — Issue management rules
- [SPRINT_BREAKDOWN.md](./SPRINT_BREAKDOWN.md) — Sprint execution plan
- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) — Backend enforcement architecture
- [STATE_MACHINES.md](./STATE_MACHINES.md) — State definitions and transitions
- [AI_ASSISTANT_SPEC.md](./AI_ASSISTANT_SPEC.md) — AI boundaries and policies
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Database schema design

---

## REVISION HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-14 | 1.0.0 | Initial release checklist documentation |

---

**🚦 ABSOLUTE RELEASE RULE:**

If ANY item is ❌ → RELEASE IS BLOCKED.

No exceptions. No "we'll fix it later." No "it's just a small release."

Every release is **patient-impacting**.

---

**Would you deploy this for your own family?**
