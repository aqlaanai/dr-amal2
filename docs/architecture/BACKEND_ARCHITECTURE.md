# Backend Architecture — Dr Amal Clinical OS v2.0

**Purpose:** Define enforcement-focused backend architecture that implements frontend truth.

**Scope:** Logical architecture. Implementation-agnostic. Enterprise-grade.

**Philosophy:** Frontend defines truth. Backend enforces truth. AI is constrained inside truth.

---

## CORE PRINCIPLE (LOCKED)

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │ ───▶ │   Backend    │ ───▶ │   AI Layer   │
│              │      │              │      │              │
│  Defines     │      │  Enforces    │      │  Constrained │
│  Truth       │      │  Truth       │      │  by Truth    │
└──────────────┘      └──────────────┘      └──────────────┘
```

**What This Means:**

- **Frontend** defines states, transitions, roles, and journeys
- **Backend** enforces those rules without interpretation
- **AI** operates read-only within those constraints

No shortcuts. No workarounds. No silent corrections.

---

## 1️⃣ BACKEND RESPONSIBILITIES

### Backend MUST Do

✅ **Authentication & Session Management**
- Verify user identity
- Issue session tokens
- Manage token lifecycle
- Handle refresh flows
- Revoke sessions on logout/suspend

✅ **Authorization Enforcement**
- Verify role permissions
- Check entity state before allowing actions
- Enforce read-only rules for admins on clinical data
- Block parent role from clinical endpoints

✅ **State Transition Validation**
- Reject illegal state transitions (e.g., `finalized` → `draft`)
- Enforce one-way gates (e.g., `draft` → `finalized`)
- Prevent mutations on terminal states (`archived`, `closed`)
- Validate prerequisite states before transitions

✅ **Immutability Enforcement**
- Block updates to finalized clinical notes
- Block updates to issued prescriptions
- Block updates to reviewed lab results
- Block all mutations on archived entities
- Block all mutations on audit logs

✅ **Audit Logging**
- Log every state transition
- Log every finalize/issue action
- Log every AI suggestion acceptance
- Log admin actions
- Append-only, never delete

✅ **AI Access Control**
- Provide read-only views to AI
- Scope AI to current user/patient/encounter
- Block AI from write operations
- Rate-limit AI requests

✅ **Rate Limiting**
- Protect auth endpoints (strict)
- Protect AI endpoints (strict)
- Protect write endpoints (very strict)
- Moderate read endpoints

✅ **Data Isolation (Multi-Tenancy)**
- Isolate tenants at query level
- Embed tenant context in tokens
- Enforce tenant boundaries in audit logs
- Prevent cross-tenant data leakage

---

### Backend MUST NOT Do

❌ **UI Logic**
- Don't decide what users see
- Don't filter lists based on "smart" heuristics
- Don't reorder data for convenience
- Frontend handles presentation

❌ **Workflow Guessing**
- Don't auto-advance states
- Don't infer user intent
- Don't skip validation steps
- Every transition is explicit

❌ **Auto-Corrections**
- Don't "fix" incomplete data
- Don't normalize inputs silently
- Don't fill missing fields automatically
- Validation errors must be explicit

❌ **Silent State Changes**
- Don't change states in background jobs without user action
- Don't auto-archive based on timers (unless explicitly documented)
- Every state change must be traceable to a user action

❌ **AI Decision-Making**
- Don't use AI to approve actions
- Don't use AI to validate clinical data
- Don't use AI to make state transitions
- AI is advisory only, never authoritative

---

## 2️⃣ HIGH-LEVEL ARCHITECTURE

### Logical Layers

```
┌─────────────────────────────────────────────────────┐
│                   API Layer                         │
│  • REST endpoints                                   │
│  • Request validation                               │
│  • Response formatting                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Auth & Identity Layer                  │
│  • Authentication                                   │
│  • Authorization                                    │
│  • Session management                               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│               Domain Services                       │
│  • Identity Domain                                  │
│  • Patients Domain                                  │
│  • Sessions Domain                                  │
│  • Clinical Notes Domain                            │
│  • Prescriptions Domain                             │
│  • Labs Domain                                      │
│  • Referrals Domain                                 │
│  • Audit Domain                                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│          AI Gateway (Read-Only)                     │
│  • Context preparation                              │
│  • Read-only views                                  │
│  • Rate limiting                                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           Audit & Compliance Layer                  │
│  • Append-only log storage                          │
│  • Event capture                                    │
│  • Tamper detection                                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│          Infrastructure Controls                    │
│  • Data isolation (multi-tenant)                    │
│  • Rate limiting                                    │
│  • Caching policies                                 │
└─────────────────────────────────────────────────────┘
```

**Key Properties:**

- **Layered** - Each layer has clear responsibilities
- **Unidirectional** - Data flows down, never up
- **Isolated** - Domains don't call each other directly
- **Enforceable** - Rules applied at each layer

---

## 3️⃣ AUTH & IDENTITY

### Identity Concepts

**User:**
```json
{
  "userId": "UUID",
  "email": "string",
  "role": "provider | admin | parent",
  "accountStatus": "active | pending | locked",
  "tenantId": "UUID",
  "displayName": "string"
}
```

**Session:**
```json
{
  "sessionId": "UUID",
  "userId": "UUID",
  "role": "provider | admin | parent",
  "accountStatus": "active",
  "tenantId": "UUID",
  "issuedAt": "ISO8601",
  "expiresAt": "ISO8601"
}
```

**Access Token (JWT Structure):**
```json
{
  "sub": "userId",
  "role": "provider",
  "status": "active",
  "tenant": "tenantId",
  "iat": 1642160400,
  "exp": 1642164000
}
```

### Authentication Rules

1. **Who You Are:**
   - Email + password → userId
   - MFA required for provider/admin roles (future)
   - Session tokens are opaque to frontend
   - Refresh tokens rotate on use

2. **Account Status Enforcement:**
   - `pending` → Limited to verification screen only
   - `locked` → All endpoints return 403
   - `active` → Full access based on role

3. **Session Lifecycle:**
   - Access token: 15 minutes
   - Refresh token: 7 days
   - Session revoked on password change
   - Session revoked on account lock

### Authorization Rules

**Role-Based Access:**

| Endpoint Pattern | Provider | Admin | Parent |
|------------------|----------|-------|--------|
| `POST /auth/*` | ✅ | ✅ | ✅ |
| `GET /overview/summary` | ✅ | ✅ (read-only) | ✅ (limited) |
| `GET /patients` | ✅ | ✅ (read-only) | ❌ 403 |
| `POST /sessions` | ✅ | ❌ 403 | ❌ 403 |
| `POST /notes` | ✅ | ❌ 403 | ❌ 403 |
| `POST /prescriptions` | ✅ | ❌ 403 | ❌ 403 |
| `GET /audit` | ❌ 403 | ✅ | ❌ 403 |

**State-Based Access:**

| Action | Entity State | Allowed? |
|--------|--------------|----------|
| `PUT /notes/{id}` | `draft` | ✅ Provider only |
| `PUT /notes/{id}` | `finalized` | ❌ 409 Conflict |
| `PATCH /prescriptions/{id}/issue` | `draft` | ✅ Provider only |
| `PATCH /prescriptions/{id}/issue` | `issued` | ❌ 409 Conflict |
| `PUT /sessions/{id}` | `completed` | ❌ 409 Conflict |

**Critical Rule:**

> "Authorization = Role Check + State Check"

Both must pass. If either fails, return explicit error.

---

### Token Security

🚫 **Prohibited:**
- Shared tokens between users
- Tokens with both read and write access for AI
- Long-lived tokens for automated systems
- Token reuse after revocation

✅ **Required:**
- Token rotation on refresh
- Token revocation on security events
- Token scoped to single tenant
- Token includes role and status

---

## 4️⃣ AUTHORIZATION MODEL

### Simple & Strong

**Formula:**
```
Access Allowed = (Role Matches) AND (State Allows) AND (Tenant Matches)
```

### Role Matrix (Mirrors Frontend)

**Provider Role:**
- ✅ Full access to clinical workflows
- ✅ Create/edit drafts
- ✅ Finalize notes (one-way)
- ✅ Issue prescriptions (one-way)
- ❌ Access admin panels
- ❌ View audit logs

**Admin Role:**
- ✅ Read-only access to overview
- ✅ Full access to admin panels
- ✅ Full access to audit logs
- ❌ Create clinical notes
- ❌ Issue prescriptions
- ❌ Modify patient data

**Parent Role:**
- ✅ Limited overview access
- ✅ View own profile
- ❌ Access any clinical data
- ❌ Access admin panels
- ❌ View audit logs

### State-Based Access Control

**Example: Clinical Notes**

```
State: draft
  → PUT /notes/{id}: ✅ Provider
  → PATCH /notes/{id}/finalize: ✅ Provider
  → DELETE /notes/{id}: ✅ Provider

State: finalized
  → GET /notes/{id}: ✅ Provider, Admin (read-only)
  → PUT /notes/{id}: ❌ 409 IMMUTABLE
  → DELETE /notes/{id}: ❌ 409 IMMUTABLE

State: archived
  → GET /notes/{id}: ✅ Provider, Admin
  → Any mutation: ❌ 409 IMMUTABLE
```

**Example: Prescriptions**

```
State: draft
  → PUT /prescriptions/{id}: ✅ Provider
  → PATCH /prescriptions/{id}/issue: ✅ Provider

State: issued
  → GET /prescriptions/{id}: ✅ Provider
  → PUT /prescriptions/{id}: ❌ 409 IMMUTABLE
  → PATCH /prescriptions/{id}/cancel: ✅ Provider (terminal)

State: cancelled
  → Any mutation: ❌ 409 TERMINAL_STATE
```

### Authorization Check Flow

```
1. Extract token from request
   ↓
2. Verify token signature
   ↓
3. Check accountStatus === 'active'
   ↓
4. Check role matches endpoint requirement
   ↓
5. Load entity (if mutation endpoint)
   ↓
6. Check entity.state allows operation
   ↓
7. Check entity.tenantId matches token.tenantId
   ↓
8. Proceed with operation
```

**If ANY check fails → Return explicit error, stop processing**

---

## 5️⃣ DOMAIN BOUNDARIES

### Why Domain Boundaries Matter

- **Single Responsibility:** Each domain owns its rules
- **Isolation:** Domains don't call each other directly
- **Evolvability:** Change one domain without breaking others
- **Testability:** Each domain can be tested independently

### Core Domains

#### 1. Identity Domain

**Responsibilities:**
- User management
- Authentication
- Session lifecycle
- Role assignment
- Account status management

**Owned States:**
- `active | pending | locked`

**Owned Entities:**
- User
- Session
- PasswordReset

**Emits Events:**
- `UserCreated`
- `UserActivated`
- `UserLocked`
- `SessionCreated`
- `SessionRevoked`

---

#### 2. Patients Domain

**Responsibilities:**
- Patient registry
- Patient demographics
- Patient status management

**Owned States:**
- `active | inactive`

**Owned Entities:**
- Patient

**Emits Events:**
- `PatientCreated`
- `PatientUpdated`
- `PatientDeactivated`

---

#### 3. Sessions Domain

**Responsibilities:**
- Live session lifecycle
- Session state transitions
- Session scheduling

**Owned States:**
- `scheduled | waiting | active | completed | archived`

**Owned Entities:**
- Session

**Emits Events:**
- `SessionScheduled`
- `SessionStarted`
- `SessionActivated`
- `SessionCompleted`
- `SessionArchived`

**Immutability Rules:**
- `completed` → Read-only
- `archived` → Read-only

---

#### 4. Clinical Notes Domain

**Responsibilities:**
- SOAP note lifecycle
- Draft management
- Finalization (one-way)
- AI-assisted flag management

**Owned States:**
- `draft | ai_assisted_draft | finalized | archived`

**Owned Entities:**
- ClinicalNote

**Emits Events:**
- `NoteCreated`
- `NoteUpdated`
- `NoteFinalized` (critical audit event)
- `NoteArchived`

**Immutability Rules:**
- `finalized` → Immutable forever
- `archived` → Immutable forever

**Critical Enforcement:**
```
if (note.status === 'finalized' || note.status === 'archived') {
  throw ImmutableEntityError
}
```

---

#### 5. Prescriptions Domain

**Responsibilities:**
- Prescription lifecycle
- Draft management
- Issuance (one-way)
- Cancellation (terminal)

**Owned States:**
- `draft | issued | active | completed | cancelled`

**Owned Entities:**
- Prescription

**Emits Events:**
- `PrescriptionCreated`
- `PrescriptionIssued` (critical audit event)
- `PrescriptionActivated`
- `PrescriptionCompleted`
- `PrescriptionCancelled`

**Immutability Rules:**
- `issued` → Cannot edit, only cancel
- `active` → Cannot edit, only cancel
- `completed` → Terminal, immutable
- `cancelled` → Terminal, immutable

---

#### 6. Labs Domain

**Responsibilities:**
- Lab order management
- Result receipt
- Review workflow

**Owned States:**
- `ordered | pending | received | reviewed | archived`

**Owned Entities:**
- LabResult

**Emits Events:**
- `LabOrdered`
- `LabResultReceived`
- `LabResultReviewed` (critical audit event)
- `LabResultArchived`

**Immutability Rules:**
- `reviewed` → Immutable
- `archived` → Immutable

---

#### 7. Referrals Domain

**Responsibilities:**
- Referral lifecycle
- Send workflow (one-way)
- Closure (terminal)

**Owned States:**
- `created | sent | scheduled | completed | closed`

**Owned Entities:**
- Referral

**Emits Events:**
- `ReferralCreated`
- `ReferralSent` (one-way transition)
- `ReferralScheduled`
- `ReferralCompleted`
- `ReferralClosed` (terminal)

**Immutability Rules:**
- `sent` → Cannot edit
- `closed` → Terminal, immutable

---

#### 8. Audit Domain

**Responsibilities:**
- Event logging
- Audit query interface
- Tamper detection

**Owned States:**
- `recorded | indexed | archived`

**Owned Entities:**
- AuditLog

**Emits Events:**
- None (audit is the final sink)

**Immutability Rules:**
- **ALL audit logs are immutable**
- No updates allowed
- No deletes allowed
- Append-only forever

**Critical Enforcement:**
```
// No mutation endpoints exist for audit logs
// Only POST (append) and GET (read) allowed
```

---

### Domain Communication

**Rule:** Domains communicate via events, not direct calls.

**Example:**

```
Session completed
  ↓
SessionDomain emits SessionCompleted event
  ↓
AuditDomain listens, creates audit log
  ↓
NotificationDomain listens, sends notification (future)
```

**Prohibited:**
```
❌ ClinicalNotesService.call(SessionsService.getDetails())
```

**Allowed:**
```
✅ Event: SessionCompleted { sessionId, patientId, timestamp }
✅ ClinicalNotesService subscribes to SessionCompleted
✅ ClinicalNotesService queries read-only view if needed
```

---

## 6️⃣ IMMUTABILITY ENFORCEMENT

### Critical for Legal Compliance

**Principle:** Once finalized, clinical data is a legal record. It cannot be changed.

### Entities That Become Immutable

| Entity | State | Enforcement |
|--------|-------|-------------|
| Clinical Notes | `finalized` | No `PUT`, no `DELETE` |
| Clinical Notes | `archived` | No mutations at all |
| Prescriptions | `issued` | No `PUT`, only `cancel` |
| Prescriptions | `completed` | No mutations at all |
| Lab Results | `reviewed` | No `PUT`, no `DELETE` |
| Sessions | `completed` | No `PUT`, no state changes |
| Referrals | `sent` | No `PUT`, only status tracking |
| Referrals | `closed` | No mutations at all |
| Audit Logs | **ALL states** | Append-only forever |

### Enforcement Mechanism

**At API Layer:**
```
if endpoint === PUT /notes/{id}:
  if note.status in ['finalized', 'archived']:
    return 409 Conflict
    errorCode: NOTE_IMMUTABLE
```

**At Domain Layer:**
```
function updateNote(noteId, changes):
  note = findNote(noteId)
  
  if note.status !== 'draft' and note.status !== 'ai_assisted_draft':
    throw ImmutableEntityError(
      "Finalized notes cannot be modified"
    )
  
  // Proceed with update
```

**At Database Layer (Optional but Recommended):**
```
// Use database constraints or triggers to block updates
// Even if code has a bug, database prevents corruption
```

### Override Protection

**Even admins cannot override immutability.**

**Example:**
```
Request: PUT /notes/123 (as admin)
Note Status: finalized

Response: 409 Conflict
{
  "errorCode": "NOTE_IMMUTABLE",
  "message": "Finalized notes cannot be modified, even by administrators.",
  "severity": "critical"
}
```

**Why:** Legal compliance. Audit trail integrity. Patient safety.

---

## 7️⃣ AI GATEWAY (READ-ONLY)

### Architecture Principle

**AI is NOT part of the core backend.**

AI is a separate, read-only subsystem that:
- Consumes prepared views
- Has no write access
- Cannot trigger workflows
- Cannot call domain services directly

### AI Gateway Structure

```
┌─────────────────────────────────────────┐
│           AI Gateway                    │
├─────────────────────────────────────────┤
│  • Context Preparation Service          │
│  • Read-Only View Generator             │
│  • Rate Limiter                         │
│  • Safety Filter                        │
└─────────────────────────────────────────┘
         ↓ (Read-Only)
┌─────────────────────────────────────────┐
│       Domain Read Models                │
│  • Session Transcripts (read-only)      │
│  • Patient Summary (read-only)          │
│  • Lab Results (read-only)              │
│  • Previous Notes (read-only)           │
└─────────────────────────────────────────┘
```

### AI Access Rules

✅ **AI CAN:**
- Read session transcripts
- Read patient demographics (current patient only)
- Read previous notes (current patient only)
- Read lab results (current patient only)
- Generate suggestions (returned to frontend)

❌ **AI CANNOT:**
- Write to database
- Update any entity
- Trigger state transitions
- Call domain services
- Access other patients' data
- Access audit logs
- Approve actions

### Scoping Rules

**Every AI request must be scoped to:**

```json
{
  "userId": "UUID (current provider)",
  "patientId": "UUID (current patient)",
  "sessionId": "UUID | null (current session)",
  "tenantId": "UUID (current clinic)"
}
```

**Enforcement:**
```
function prepareAIContext(userId, patientId, sessionId):
  // Verify user has access to patient
  if not hasAccess(userId, patientId):
    throw Forbidden
  
  // Build read-only view scoped to this patient
  context = {
    sessionTranscript: getTranscript(sessionId),
    patientSummary: getPatientSummary(patientId),
    recentNotes: getRecentNotes(patientId, limit=5),
    recentLabs: getRecentLabs(patientId, limit=10)
  }
  
  return context
```

### AI Response Handling

**AI responses are returned to frontend only.**

Backend does NOT:
- Auto-insert AI suggestions into notes
- Auto-apply AI recommendations
- Trigger actions based on AI output

**Flow:**
```
Frontend → Backend AI Gateway → External AI Service
                                        ↓
Frontend ← Backend AI Gateway ← AI Response
   ↓
User Reviews
   ↓
User Clicks "Accept"
   ↓
Frontend → Backend Domain API → Save Draft
```

### Rate Limiting (AI-Specific)

**Strict limits to prevent abuse:**

- 10 AI requests per minute per user
- 100 AI requests per hour per user
- 500 AI requests per day per tenant

**If exceeded:**
```
Response: 429 Too Many Requests
{
  "errorCode": "AI_RATE_LIMIT_EXCEEDED",
  "message": "AI request limit exceeded. Try again in 60 seconds.",
  "severity": "warning",
  "retryAfter": 60
}
```

---

## 8️⃣ AUDIT & COMPLIANCE LAYER

### What Gets Logged

**Every Critical Action:**

| Event | Captured Data |
|-------|---------------|
| Note Finalized | userId, noteId, patientId, timestamp, aiAssisted flag |
| Prescription Issued | userId, prescriptionId, medication, patientId, timestamp |
| Lab Reviewed | userId, resultId, patientId, abnormalFlag, timestamp |
| Session Completed | userId, sessionId, patientId, duration, timestamp |
| AI Suggestion Shown | userId, suggestionType, confidence, timestamp |
| AI Suggestion Accepted | userId, noteId, suggestionId, timestamp |
| Admin Action | userId, action, targetEntity, timestamp |
| Account Status Change | adminId, targetUserId, oldStatus, newStatus, reason |

**Audit Log Structure:**
```json
{
  "logId": "UUID",
  "tenantId": "UUID",
  "actor": "UUID (userId)",
  "actorRole": "provider | admin | parent",
  "action": "note_finalized | prescription_issued | ...",
  "entity": "clinical_note | prescription | session | ...",
  "entityId": "UUID",
  "ipAddress": "string",
  "userAgent": "string",
  "timestamp": "ISO8601",
  "metadata": {
    "before": "object | null",
    "after": "object | null",
    "changes": ["field1", "field2"],
    "aiAssisted": "boolean | null"
  }
}
```

### Audit Properties

**Append-Only:**
- No `PUT /audit/{id}` endpoint exists
- No `DELETE /audit/{id}` endpoint exists
- Only `POST /audit` (internal) and `GET /audit` (admin)

**Immutable:**
- Once written, never modified
- Even database-level protection recommended

**Queryable:**
- Admin role can search/filter logs
- Provider role CANNOT access audit logs
- Parent role CANNOT access audit logs

**Tamper-Resistant:**
- Hash chain or cryptographic signing (optional)
- Detect if logs are modified externally
- Alert on tampering

### Retention Policy

**Regulatory Compliance:**

- Audit logs retained for **7 years minimum**
- After 7 years, can move to cold storage
- Never delete, only archive

**States:**
- `recorded` → Active, searchable
- `indexed` → Searchable, optimized
- `archived` → Cold storage, view-only

---

## 9️⃣ INFRASTRUCTURE CONTROLS

### Rate Limiting

**Per-Endpoint Rate Limits:**

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| `POST /auth/signin` | 5 requests | 1 minute |
| `POST /auth/signup` | 3 requests | 1 hour |
| AI Gateway | 10 requests | 1 minute |
| Read endpoints | 100 requests | 1 minute |
| Write endpoints | 30 requests | 1 minute |
| Admin endpoints | 50 requests | 1 minute |

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642164000
```

**Error Response:**
```json
{
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "severity": "warning",
  "retryAfter": 60
}
```

---

### Caching Policies

**Allowed to Cache:**

| Data Type | TTL | Notes |
|-----------|-----|-------|
| Overview Summary | 5 minutes | Aggregate stats |
| Reference Data | 1 hour | Medication lists, ICD codes |
| Patient List | 2 minutes | For dropdown autocomplete |
| User Profile | 15 minutes | Current user info |

**Forbidden to Cache:**

| Data Type | Reason |
|-----------|--------|
| Clinical Notes | Freshness critical |
| Live Sessions | Real-time data |
| Prescriptions | Regulatory requirement |
| Lab Results | Accuracy critical |
| AI Context | Privacy/security |
| Audit Logs | Compliance |

**Cache Invalidation:**
```
On entity mutation:
  → Invalidate cache for that entity
  → Invalidate related summary caches
  → Emit cache-bust event
```

---

### Multi-Tenancy (Data Isolation)

**Tenant Concept:**

Each clinic is a separate tenant with complete data isolation.

**Enforcement Levels:**

**1. Token Level:**
```json
{
  "sub": "userId",
  "role": "provider",
  "tenant": "tenantId"  // ← Embedded in token
}
```

**2. Query Level:**
```sql
SELECT * FROM clinical_notes
WHERE tenant_id = :tenantId  -- Always present
  AND note_id = :noteId
```

**3. Audit Level:**
```
Every audit log includes tenantId
Cross-tenant access logged as security event
```

**4. API Gateway Level:**
```
Verify request tenantId matches token tenantId
Reject if mismatch (even for admins)
```

**Isolation Guarantees:**

🚫 Tenant A cannot access Tenant B's data
🚫 Even admins cannot cross tenant boundaries
✅ Each tenant's data is logically separated
✅ Tenant ID required on all queries

---

## 🔟 FAILURE MODES (DESIGNED)

### Principle: Silence is Forbidden

When something goes wrong, backend must:
1. Reject the request explicitly
2. Return clear error code and message
3. Log the failure
4. Do NOT guess intent
5. Do NOT auto-correct

### Common Failure Scenarios

#### 1. Illegal State Transition

**Request:**
```
PATCH /notes/123/finalize
Note current state: finalized
```

**Response:**
```
409 Conflict
{
  "errorCode": "NOTE_ALREADY_FINALIZED",
  "message": "This note is already finalized and cannot be finalized again.",
  "severity": "info"
}
```

---

#### 2. Immutability Violation

**Request:**
```
PUT /notes/123
Note state: finalized
```

**Response:**
```
409 Conflict
{
  "errorCode": "NOTE_IMMUTABLE",
  "message": "Finalized notes cannot be modified. Create a new note if needed.",
  "severity": "critical"
}
```

---

#### 3. Authorization Failure

**Request:**
```
POST /notes (as parent role)
```

**Response:**
```
403 Forbidden
{
  "errorCode": "ROLE_FORBIDDEN",
  "message": "Parent role cannot create clinical notes.",
  "severity": "warning"
}
```

---

#### 4. Missing Prerequisites

**Request:**
```
PATCH /prescriptions/456/issue
Prescription missing required field: dosage
```

**Response:**
```
400 Bad Request
{
  "errorCode": "PRESCRIPTION_INCOMPLETE",
  "message": "Cannot issue prescription. Missing required field: dosage.",
  "severity": "warning",
  "details": {
    "missingFields": ["dosage"]
  }
}
```

---

#### 5. Cross-Tenant Access Attempt

**Request:**
```
GET /patients/789
Patient tenantId: tenant-B
Token tenantId: tenant-A
```

**Response:**
```
404 Not Found
{
  "errorCode": "ENTITY_NOT_FOUND",
  "message": "Patient not found.",
  "severity": "info"
}
```

**Note:** Return 404, not 403, to avoid revealing existence of cross-tenant data.

---

### Error Response Standard

**Every Error Includes:**
```json
{
  "errorCode": "string (machine-readable)",
  "message": "string (human-readable)",
  "severity": "info | warning | critical",
  "details": "object | null (additional context)"
}
```

**Status Codes:**
- `400` - Validation errors, incomplete data
- `401` - Authentication failures
- `403` - Authorization failures
- `404` - Entity not found
- `409` - State conflicts, immutability violations
- `429` - Rate limit exceeded
- `500` - Internal server error (logged, not detailed)

---

## 1️⃣1️⃣ WHY THIS ARCHITECTURE WORKS

### Alignment with Frontend Truth

| Frontend Document | Backend Enforcement |
|-------------------|---------------------|
| STATE_MACHINES.md | State transition validation in domains |
| ROLE_BASED_UI.md | Role-based authorization in auth layer |
| USER_JOURNEYS.md | Explicit state transitions only |
| API_CONTRACTS.md | API layer implements exact contracts |
| AI_ASSISTANT_SPEC.md | AI gateway enforces read-only access |

**Everything aligns.** No contradictions.

---

### Enterprise-Grade Properties

✅ **Predictable**
- State machines are enforced, not inferred
- Errors are explicit, never silent
- Transitions are traceable

✅ **Auditable**
- Every critical action logged
- Immutable audit trail
- 7-year retention

✅ **Compliant**
- Finalized notes immutable (legal requirement)
- Issued prescriptions immutable (regulatory)
- Audit logs tamper-resistant (HIPAA/GDPR)

✅ **Secure**
- Role-based + state-based authorization
- Multi-tenant isolation
- AI has no write access
- Rate limiting on all endpoints

✅ **Safe**
- Immutability enforced at multiple layers
- AI cannot act autonomously
- No silent auto-corrections
- Failure modes designed, not ignored

---

### What This Architecture Prevents

❌ **Frontend/Backend Drift**
- API contracts define exact shape
- Backend enforces what frontend defined

❌ **Unauthorized State Changes**
- Every transition validated against state machine
- Role checked, state checked, tenant checked

❌ **AI Overreach**
- AI cannot write data
- AI cannot approve actions
- AI cannot bypass rules

❌ **Audit Trail Corruption**
- Append-only logs
- No deletion
- Tamper detection

❌ **Data Leakage**
- Tenant isolation at every layer
- Cross-tenant access blocked

❌ **Silent Failures**
- Every error explicit
- Every conflict surfaced
- No guessing

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Foundation

- [ ] Auth & Identity layer
- [ ] Session management
- [ ] Role-based authorization
- [ ] Multi-tenant data isolation
- [ ] Audit logging infrastructure

### Phase 2: Core Domains

- [ ] Patients domain
- [ ] Sessions domain
- [ ] Clinical Notes domain (with immutability)
- [ ] Prescriptions domain (with immutability)
- [ ] Labs domain

### Phase 3: Advanced Domains

- [ ] Medical Imaging domain
- [ ] Referrals domain
- [ ] Audit query interface (admin only)

### Phase 4: AI Integration

- [ ] AI Gateway (read-only)
- [ ] Context preparation service
- [ ] Rate limiting for AI
- [ ] Safety filters

### Phase 5: Infrastructure

- [ ] Rate limiting across all endpoints
- [ ] Caching policies
- [ ] Error handling standardization
- [ ] Monitoring and alerting

### Phase 6: Compliance

- [ ] Audit log retention (7 years)
- [ ] Immutability enforcement testing
- [ ] Cross-tenant isolation testing
- [ ] Security audit

---

## ANTI-PATTERNS (FORBIDDEN)

### ❌ Smart Backend

```
// BAD: Backend guesses what user meant
if (note.status === 'draft' && note.isEmpty()) {
  autoDelete(note)
}
```

```
// GOOD: Explicit user action required
// User clicks "Delete Draft" → POST /notes/{id}/delete
```

---

### ❌ Silent Auto-Corrections

```
// BAD: Backend "fixes" data
if (prescription.dosage === null) {
  prescription.dosage = "default"
}
```

```
// GOOD: Return validation error
return 400 {
  errorCode: "PRESCRIPTION_INCOMPLETE",
  message: "Dosage is required"
}
```

---

### ❌ AI with Write Access

```
// BAD: AI can save notes
POST /ai/generate-and-save
```

```
// GOOD: AI only generates, human saves
POST /ai/generate → Returns suggestion to frontend
Frontend shows suggestion → User clicks "Accept"
User clicks "Save" → POST /notes/{id}
```

---

### ❌ Cross-Domain Direct Calls

```
// BAD: Domains call each other directly
ClinicalNotesService.createNote() {
  session = SessionsService.getSession()  // ❌
}
```

```
// GOOD: Use events or read models
ClinicalNotesService.createNote() {
  // Subscribe to SessionCompleted event
  // Or query read-only session view
}
```

---

### ❌ Overriding Immutability

```
// BAD: Admin override for convenience
if (user.role === 'admin') {
  allowUpdateFinalizedNote()  // ❌
}
```

```
// GOOD: Immutability is absolute
if (note.status === 'finalized') {
  throw ImmutableEntityError  // Always, even for admins
}
```

---

## PHILOSOPHY (LOCKED)

### Core Tenets

**1. Frontend Defines Truth**
- Backend implements, not interprets
- State machines come from frontend
- Role visibility comes from frontend

**2. Backend Enforces Truth**
- Validation is strict
- State transitions are explicit
- Immutability is absolute

**3. AI is Constrained by Truth**
- Read-only access
- No authority
- Human approval required

**4. Failures are Explicit**
- No silent errors
- No guessing
- No auto-corrections

**5. Compliance is Built-In**
- Immutability protects legal records
- Audit logs are tamper-resistant
- Retention meets regulatory requirements

### Final Statement

> "This is not startup chaos. This is enterprise-grade clinical software. Every state transition is traceable. Every immutable entity is protected. Every AI suggestion requires human approval. Every failure is explicit. This architecture protects patients, providers, and the organization."

**Backend is boring, predictable, and safe. By design.**

---

**Last Updated:** January 14, 2026  
**Status:** Backend Architecture Complete  
**Integration:** Aligns with STATE_MACHINES.md, ROLE_BASED_UI.md, USER_JOURNEYS.md, API_CONTRACTS.md, AI_ASSISTANT_SPEC.md  
**Implementation:** Ready for parallel development with frontend
