# Database Schema Design — Dr Amal Clinical OS v2.0

**Purpose:** Define logical database schema that enforces frontend truth and backend rules.

**Scope:** Schema design only. No SQL. No ORM. No performance tuning.

**Philosophy:** Schema is law. Immutability is protection. Simplicity beats cleverness.

---

## CORE PRINCIPLE

```
Frontend States → Backend Enforcement → Database Constraints
```

**Database layer is the final enforcement boundary.**

Even if code has bugs, schema prevents:
- Illegal state values
- Missing tenant isolation
- Timestamp inconsistencies
- Orphaned relationships

---

## GLOBAL SCHEMA RULES (MANDATORY)

### Every Table Must Have

```
id              UUID PRIMARY KEY
tenantId        UUID NOT NULL (indexed)
createdAt       TIMESTAMP NOT NULL
updatedAt       TIMESTAMP NOT NULL
```

**Rationale:**
- `id` - Unique identifier, no autoincrement integers (prevents ID guessing)
- `tenantId` - Multi-tenant isolation, every query scoped
- `createdAt` - Audit trail, never changes
- `updatedAt` - Change tracking, updated on every mutation

### Forbidden Patterns

❌ **No Polymorphic Associations**
```
// BAD: One table for multiple entity types
entityType, entityId
```

❌ **No Overloaded Tables**
```
// BAD: One "documents" table for notes, prescriptions, referrals
type, payload
```

❌ **No Soft Deletes**
```
// BAD: deletedAt field
// Use explicit states instead: archived, closed, cancelled
```

❌ **No "Just in Case" Fields**
```
// BAD: Adding fields for future features
futureUseField1, futureUseField2
```

❌ **No Role Arrays**
```
// BAD: roles: ["provider", "admin"]
// Each user has ONE role
role: "provider | admin | parent"
```

---

## 1️⃣ USERS TABLE

### Purpose
Identity and authentication for all system users.

### Schema

```
users
├── id                  UUID PRIMARY KEY
├── tenantId            UUID NOT NULL (FK → tenants.id)
├── firstName           VARCHAR(100) NOT NULL
├── lastName            VARCHAR(100) NOT NULL
├── email               VARCHAR(255) NOT NULL UNIQUE
├── phone               VARCHAR(20)
├── passwordHash        VARCHAR(255) NOT NULL
├── role                VARCHAR(20) NOT NULL
│                       CHECK (role IN ('provider', 'admin', 'parent'))
├── accountStatus       VARCHAR(20) NOT NULL
│                       CHECK (accountStatus IN ('active', 'pending', 'locked'))
├── createdAt           TIMESTAMP NOT NULL
└── updatedAt           TIMESTAMP NOT NULL
```

### States

| accountStatus | Meaning | Can Sign In? |
|---------------|---------|--------------|
| `pending` | Awaiting verification | No |
| `active` | Full access | Yes |
| `locked` | Suspended/disabled | No |

### Constraints

- `email` must be unique across system (enforced at DB level)
- `role` is single-value, not array
- `tenantId` ties user to specific clinic

### Immutability Rules

**Immutable after creation:**
- `email` (cannot change email, create new account instead)

**Mutable:**
- `firstName`, `lastName`, `phone`
- `passwordHash` (on password change)
- `accountStatus` (admin can lock/unlock)

### Indexes

```
INDEX idx_users_email ON users(email)
INDEX idx_users_tenant ON users(tenantId)
INDEX idx_users_role ON users(role, accountStatus)
```

### Relationships

- `tenantId` → `tenants.id` (RESTRICT on delete)

---

## 2️⃣ PATIENTS TABLE

### Purpose
Patient registry with demographics and status.

### Schema

```
patients
├── id                  UUID PRIMARY KEY
├── tenantId            UUID NOT NULL (FK → tenants.id)
├── fullName            VARCHAR(200) NOT NULL
├── dateOfBirth         DATE NOT NULL
├── gender              VARCHAR(20)
│                       CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'))
├── status              VARCHAR(20) NOT NULL
│                       CHECK (status IN ('active', 'inactive'))
├── createdAt           TIMESTAMP NOT NULL
└── updatedAt           TIMESTAMP NOT NULL
```

### States

| status | Meaning | Visible? |
|--------|---------|----------|
| `active` | Current patient | Yes |
| `inactive` | Discharged/transferred | Archive view only |

### Constraints

- Patient can belong to only ONE tenant
- Cannot have duplicate `fullName + dateOfBirth` within same tenant (prevent duplicates)

### Immutability Rules

**Immutable after creation:**
- `dateOfBirth` (patient identity)

**Mutable:**
- `fullName` (legal name changes allowed)
- `gender` (patient can update)
- `status` (active ↔ inactive transitions)

### Indexes

```
INDEX idx_patients_tenant ON patients(tenantId, status)
INDEX idx_patients_name ON patients(fullName)
INDEX idx_patients_dob ON patients(dateOfBirth)
UNIQUE INDEX idx_patients_identity ON patients(tenantId, fullName, dateOfBirth)
```

### Relationships

- `tenantId` → `tenants.id` (RESTRICT on delete)

---

## 3️⃣ LIVE_SESSIONS TABLE

### Purpose
Track live patient encounters (scheduled, active, completed).

### Schema

```
live_sessions
├── id                  UUID PRIMARY KEY
├── tenantId            UUID NOT NULL (FK → tenants.id)
├── patientId           UUID NOT NULL (FK → patients.id)
├── providerId          UUID NOT NULL (FK → users.id)
├── status              VARCHAR(20) NOT NULL
│                       CHECK (status IN ('scheduled', 'waiting', 'active', 'completed', 'archived'))
├── scheduledAt         TIMESTAMP NOT NULL
├── startedAt           TIMESTAMP
├── completedAt         TIMESTAMP
├── createdAt           TIMESTAMP NOT NULL
└── updatedAt           TIMESTAMP NOT NULL
```

### State Machine (Enforced)

```
scheduled → waiting → active → completed → archived
```

**Terminal States:**
- `completed` (session ended, immutable)
- `archived` (long-term storage, immutable)

### Constraints

- `providerId` must have `role = 'provider'`
- `startedAt` must be >= `scheduledAt`
- `completedAt` must be >= `startedAt`

### Immutability Rules

**Immutable when `status` is:**
- `completed`
- `archived`

**Fields that become read-only after completion:**
- `patientId`
- `providerId`
- `scheduledAt`
- `startedAt`
- `completedAt`

**Enforcement:**
```
// At application layer
if (session.status === 'completed' || session.status === 'archived') {
  throw ImmutableEntityError
}
```

### Indexes

```
INDEX idx_sessions_patient ON live_sessions(patientId, status)
INDEX idx_sessions_provider ON live_sessions(providerId, scheduledAt)
INDEX idx_sessions_tenant ON live_sessions(tenantId, status)
INDEX idx_sessions_scheduled ON live_sessions(scheduledAt)
```

### Relationships

- `tenantId` → `tenants.id` (RESTRICT)
- `patientId` → `patients.id` (RESTRICT)
- `providerId` → `users.id` (RESTRICT)

---

## 4️⃣ CLINICAL_NOTES TABLE

### Purpose
SOAP notes for patient encounters. Immutable after finalization.

### Schema

```
clinical_notes
├── id                  UUID PRIMARY KEY
├── tenantId            UUID NOT NULL (FK → tenants.id)
├── patientId           UUID NOT NULL (FK → patients.id)
├── sessionId           UUID (FK → live_sessions.id)
├── providerId          UUID NOT NULL (FK → users.id)
├── subjective          TEXT
├── objective           TEXT
├── assessment          TEXT
├── plan                TEXT
├── status              VARCHAR(30) NOT NULL
│                       CHECK (status IN ('draft', 'ai_assisted_draft', 'finalized', 'archived'))
├── aiAssisted          BOOLEAN DEFAULT FALSE
├── finalizedAt         TIMESTAMP
├── createdAt           TIMESTAMP NOT NULL
└── updatedAt           TIMESTAMP NOT NULL
```

### State Machine (Enforced)

```
draft → finalized → archived
   ↓         ↓
ai_assisted_draft
```

**One-Way Gates:**
- `draft` → `finalized` (cannot reverse)
- `finalized` → `archived` (cannot reverse)

**Terminal States:**
- `finalized` (legal record, IMMUTABLE)
- `archived` (long-term storage, IMMUTABLE)

### Constraints

- `providerId` must have `role = 'provider'`
- `finalizedAt` must be set when `status = 'finalized'`
- At least one SOAP field must be non-empty before finalization

### Immutability Rules (CRITICAL)

**When `status IN ('finalized', 'archived')`:**

❌ **No updates allowed on:**
- `subjective`
- `objective`
- `assessment`
- `plan`
- `status` (cannot un-finalize)
- `providerId`
- `patientId`
- `sessionId`

✅ **Only these operations allowed:**
- `SELECT` (read-only)
- State transition `finalized` → `archived`

**Enforcement Levels:**

1. **Application Layer:**
```
if (note.status === 'finalized' || note.status === 'archived') {
  if (operation !== 'archive') {
    throw ImmutableEntityError
  }
}
```

2. **Database Trigger (Optional but Recommended):**
```
BEFORE UPDATE ON clinical_notes
  IF OLD.status IN ('finalized', 'archived')
  AND NEW.status != 'archived'
  THEN RAISE EXCEPTION 'Finalized notes are immutable'
```

### Indexes

```
INDEX idx_notes_patient ON clinical_notes(patientId, status)
INDEX idx_notes_provider ON clinical_notes(providerId, createdAt)
INDEX idx_notes_session ON clinical_notes(sessionId)
INDEX idx_notes_tenant ON clinical_notes(tenantId, status)
INDEX idx_notes_finalized ON clinical_notes(finalizedAt) WHERE status = 'finalized'
```

### Relationships

- `tenantId` → `tenants.id` (RESTRICT)
- `patientId` → `patients.id` (RESTRICT)
- `sessionId` → `live_sessions.id` (RESTRICT, nullable)
- `providerId` → `users.id` (RESTRICT)

---

## 5️⃣ PRESCRIPTIONS TABLE

### Purpose
Medication prescriptions. Immutable after issuance.

### Schema

```
prescriptions
├── id                  UUID PRIMARY KEY
├── tenantId            UUID NOT NULL (FK → tenants.id)
├── patientId           UUID NOT NULL (FK → patients.id)
├── providerId          UUID NOT NULL (FK → users.id)
├── medication          VARCHAR(200) NOT NULL
├── dosage              VARCHAR(100) NOT NULL
├── duration            VARCHAR(100) NOT NULL
├── instructions        TEXT
├── status              VARCHAR(20) NOT NULL
│                       CHECK (status IN ('draft', 'issued', 'active', 'completed', 'cancelled'))
├── issuedAt            TIMESTAMP
├── createdAt           TIMESTAMP NOT NULL
└── updatedAt           TIMESTAMP NOT NULL
```

### State Machine (Enforced)

```
draft → issued → active → completed
                    ↓
                cancelled (terminal)
```

**One-Way Gates:**
- `draft` → `issued` (cannot reverse)
- Once `issued`, can only transition to `active`, `completed`, or `cancelled`

**Terminal States:**
- `completed` (prescription ended, immutable)
- `cancelled` (prescription voided, immutable)

### Constraints

- `providerId` must have `role = 'provider'`
- `issuedAt` must be set when `status = 'issued'`
- `medication`, `dosage`, `duration` required before issuance

### Immutability Rules (CRITICAL)

**When `status IN ('issued', 'active', 'completed', 'cancelled')`:**

❌ **No updates allowed on:**
- `medication`
- `dosage`
- `duration`
- `instructions`
- `providerId`
- `patientId`

✅ **Only these operations allowed:**
- `SELECT` (read-only)
- State transitions: `issued` → `active` → `completed`
- Cancellation: `issued` → `cancelled`

**Enforcement:**
```
if (prescription.status !== 'draft') {
  // Only status transitions allowed, no field edits
  if (changedFields !== ['status', 'updatedAt']) {
    throw ImmutableEntityError
  }
}
```

### Indexes

```
INDEX idx_prescriptions_patient ON prescriptions(patientId, status)
INDEX idx_prescriptions_provider ON prescriptions(providerId, issuedAt)
INDEX idx_prescriptions_tenant ON prescriptions(tenantId, status)
INDEX idx_prescriptions_medication ON prescriptions(medication)
```

### Relationships

- `tenantId` → `tenants.id` (RESTRICT)
- `patientId` → `patients.id` (RESTRICT)
- `providerId` → `users.id` (RESTRICT)

---

## 6️⃣ LAB_RESULTS TABLE

### Purpose
Laboratory test orders and results. Immutable after review.

### Schema

```
lab_results
├── id                  UUID PRIMARY KEY
├── tenantId            UUID NOT NULL (FK → tenants.id)
├── patientId           UUID NOT NULL (FK → patients.id)
├── orderedBy           UUID NOT NULL (FK → users.id)
├── reviewedBy          UUID (FK → users.id)
├── testType            VARCHAR(200) NOT NULL
├── resultSummary       TEXT
├── abnormalFlag        BOOLEAN DEFAULT FALSE
├── status              VARCHAR(20) NOT NULL
│                       CHECK (status IN ('ordered', 'pending', 'received', 'reviewed', 'archived'))
├── orderedAt           TIMESTAMP NOT NULL
├── receivedAt          TIMESTAMP
├── reviewedAt          TIMESTAMP
├── createdAt           TIMESTAMP NOT NULL
└── updatedAt           TIMESTAMP NOT NULL
```

### State Machine (Enforced)

```
ordered → pending → received → reviewed → archived
```

**Terminal States:**
- `reviewed` (clinically reviewed, immutable)
- `archived` (long-term storage, immutable)

### Constraints

- `orderedBy` must have `role = 'provider'`
- `reviewedBy` must have `role = 'provider'` (when set)
- `reviewedAt` must be set when `status = 'reviewed'`
- `receivedAt` must be set when `status = 'received'`

### Immutability Rules

**When `status IN ('reviewed', 'archived')`:**

❌ **No updates allowed on:**
- `resultSummary`
- `abnormalFlag`
- `reviewedBy`
- `reviewedAt`

✅ **Only these operations allowed:**
- `SELECT` (read-only)
- State transition `reviewed` → `archived`

### Indexes

```
INDEX idx_labs_patient ON lab_results(patientId, status)
INDEX idx_labs_ordered ON lab_results(orderedBy, orderedAt)
INDEX idx_labs_tenant ON lab_results(tenantId, status)
INDEX idx_labs_abnormal ON lab_results(abnormalFlag, status) WHERE abnormalFlag = TRUE
```

### Relationships

- `tenantId` → `tenants.id` (RESTRICT)
- `patientId` → `patients.id` (RESTRICT)
- `orderedBy` → `users.id` (RESTRICT)
- `reviewedBy` → `users.id` (RESTRICT, nullable)

---

## 7️⃣ REFERRALS TABLE

### Purpose
Referrals to specialists or other providers. Terminal when closed.

### Schema

```
referrals
├── id                  UUID PRIMARY KEY
├── tenantId            UUID NOT NULL (FK → tenants.id)
├── patientId           UUID NOT NULL (FK → patients.id)
├── referringProviderId UUID NOT NULL (FK → users.id)
├── specialty           VARCHAR(100) NOT NULL
├── urgency             VARCHAR(20) NOT NULL
│                       CHECK (urgency IN ('routine', 'urgent', 'emergency'))
├── reason              TEXT
├── status              VARCHAR(20) NOT NULL
│                       CHECK (status IN ('created', 'sent', 'scheduled', 'completed', 'closed'))
├── sentAt              TIMESTAMP
├── createdAt           TIMESTAMP NOT NULL
└── updatedAt           TIMESTAMP NOT NULL
```

### State Machine (Enforced)

```
created → sent → scheduled → completed → closed
```

**One-Way Gates:**
- `created` → `sent` (cannot unsend)
- `sent` → cannot edit referral details

**Terminal State:**
- `closed` (referral cycle complete, immutable)

### Constraints

- `referringProviderId` must have `role = 'provider'`
- `sentAt` must be set when `status = 'sent'`

### Immutability Rules

**When `status = 'closed'`:**

❌ **No updates allowed** (terminal state)

**When `status IN ('sent', 'scheduled', 'completed')`:**

❌ **No updates allowed on:**
- `specialty`
- `urgency`
- `reason`
- `referringProviderId`
- `patientId`

✅ **Only these operations allowed:**
- `SELECT` (read-only)
- Status transitions forward only

### Indexes

```
INDEX idx_referrals_patient ON referrals(patientId, status)
INDEX idx_referrals_provider ON referrals(referringProviderId, createdAt)
INDEX idx_referrals_tenant ON referrals(tenantId, status)
INDEX idx_referrals_urgency ON referrals(urgency, status)
```

### Relationships

- `tenantId` → `tenants.id` (RESTRICT)
- `patientId` → `patients.id` (RESTRICT)
- `referringProviderId` → `users.id` (RESTRICT)

---

## 8️⃣ AUDIT_LOGS TABLE

### Purpose
Immutable, append-only audit trail for all critical actions.

### Schema

```
audit_logs
├── id                  UUID PRIMARY KEY
├── tenantId            UUID NOT NULL (FK → tenants.id)
├── actorId             UUID NOT NULL (FK → users.id)
├── actorRole           VARCHAR(20) NOT NULL
├── action              VARCHAR(100) NOT NULL
├── entityType          VARCHAR(50) NOT NULL
├── entityId            UUID NOT NULL
├── ipAddress           VARCHAR(45)
├── userAgent           TEXT
├── metadata            JSONB
├── timestamp           TIMESTAMP NOT NULL
├── createdAt           TIMESTAMP NOT NULL
└── updatedAt           TIMESTAMP NOT NULL (always equals createdAt)
```

### Actions Logged

| action | Triggered By | entityType |
|--------|--------------|------------|
| `note_finalized` | Provider finalizes note | `clinical_note` |
| `prescription_issued` | Provider issues prescription | `prescription` |
| `lab_reviewed` | Provider reviews lab | `lab_result` |
| `session_completed` | Provider completes session | `live_session` |
| `ai_suggestion_shown` | AI shows suggestion | `ai_interaction` |
| `ai_suggestion_accepted` | User accepts AI suggestion | `ai_interaction` |
| `user_locked` | Admin locks account | `user` |
| `user_unlocked` | Admin unlocks account | `user` |

### Constraints

- **NO UPDATE operations** (append-only)
- **NO DELETE operations** (permanent record)
- `timestamp` must be set at creation
- `updatedAt` always equals `createdAt` (never updated)

### Immutability Rules (ABSOLUTE)

❌ **Forbidden operations:**
- `UPDATE audit_logs`
- `DELETE audit_logs`

✅ **Only allowed operations:**
- `INSERT` (append new log)
- `SELECT` (read logs, admin only)

**Enforcement:**

1. **Application Layer:**
```
// No update or delete methods exist
AuditLogService.create(log)  // ✅
AuditLogService.query(filters)  // ✅
AuditLogService.update(id, changes)  // ❌ Method does not exist
AuditLogService.delete(id)  // ❌ Method does not exist
```

2. **Database Trigger:**
```
BEFORE UPDATE ON audit_logs
  RAISE EXCEPTION 'Audit logs are immutable'

BEFORE DELETE ON audit_logs
  RAISE EXCEPTION 'Audit logs cannot be deleted'
```

### Metadata Structure

```json
{
  "before": { ... },  // Entity state before action (optional)
  "after": { ... },   // Entity state after action (optional)
  "changes": ["field1", "field2"],  // Changed fields
  "aiAssisted": true,  // Was AI involved?
  "confidence": 0.92,  // AI confidence (if applicable)
  "reason": "string"   // Admin action reason (if applicable)
}
```

### Indexes

```
INDEX idx_audit_tenant ON audit_logs(tenantId, timestamp DESC)
INDEX idx_audit_actor ON audit_logs(actorId, timestamp DESC)
INDEX idx_audit_entity ON audit_logs(entityType, entityId, timestamp DESC)
INDEX idx_audit_action ON audit_logs(action, timestamp DESC)
```

### Relationships

- `tenantId` → `tenants.id` (RESTRICT)
- `actorId` → `users.id` (RESTRICT)

---

## 9️⃣ AI_INTERACTIONS TABLE

### Purpose
Track AI usage for transparency and debugging. Informational only.

### Schema

```
ai_interactions
├── id                  UUID PRIMARY KEY
├── tenantId            UUID NOT NULL (FK → tenants.id)
├── userId              UUID NOT NULL (FK → users.id)
├── contextType         VARCHAR(50) NOT NULL
│                       CHECK (contextType IN ('draft_note', 'lab_result', 'session_transcript'))
├── contextId           UUID NOT NULL
├── suggestionType      VARCHAR(50) NOT NULL
├── confidenceLevel     DECIMAL(3,2)
│                       CHECK (confidenceLevel >= 0 AND confidenceLevel <= 1)
├── accepted            BOOLEAN DEFAULT FALSE
├── createdAt           TIMESTAMP NOT NULL
└── updatedAt           TIMESTAMP NOT NULL
```

### Context Types

| contextType | Meaning | Linked To |
|-------------|---------|-----------|
| `draft_note` | AI suggested note content | `clinical_notes.id` |
| `lab_result` | AI suggested interpretation | `lab_results.id` |
| `session_transcript` | AI analyzed session | `live_sessions.id` |

### Constraints

- `userId` must have `role = 'provider'` (only providers use AI)
- `confidenceLevel` range: 0.0 to 1.0

### Immutability Rules

**Mutable:**
- `accepted` (can change from `false` → `true` when user accepts)

**Immutable after creation:**
- `contextType`
- `contextId`
- `suggestionType`
- `confidenceLevel`

### Critical Rule

> **AI never writes to clinical tables directly.**
> This table only tracks AI suggestions shown to users.

### Indexes

```
INDEX idx_ai_user ON ai_interactions(userId, createdAt DESC)
INDEX idx_ai_context ON ai_interactions(contextType, contextId)
INDEX idx_ai_tenant ON ai_interactions(tenantId, createdAt DESC)
INDEX idx_ai_accepted ON ai_interactions(accepted, createdAt DESC)
```

### Relationships

- `tenantId` → `tenants.id` (RESTRICT)
- `userId` → `users.id` (RESTRICT)

---

## 🔟 TENANTS TABLE

### Purpose
Multi-tenant isolation. One record per clinic/organization.

### Schema

```
tenants
├── id                  UUID PRIMARY KEY
├── organizationName    VARCHAR(200) NOT NULL
├── timezone            VARCHAR(50) NOT NULL
├── status              VARCHAR(20) NOT NULL
│                       CHECK (status IN ('active', 'suspended', 'closed'))
├── createdAt           TIMESTAMP NOT NULL
└── updatedAt           TIMESTAMP NOT NULL
```

### States

| status | Meaning | Users Can Sign In? |
|--------|---------|-------------------|
| `active` | Operational | Yes |
| `suspended` | Temporarily disabled | No |
| `closed` | Permanently closed | No |

### Constraints

- `organizationName` must be unique
- `timezone` must be valid IANA timezone

### Indexes

```
INDEX idx_tenants_status ON tenants(status)
UNIQUE INDEX idx_tenants_name ON tenants(organizationName)
```

---

## RELATIONSHIP DIAGRAM

```
┌─────────────┐
│   tenants   │
└──────┬──────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ↓                                      ↓
┌─────────────┐                        ┌─────────────┐
│    users    │                        │  patients   │
└──────┬──────┘                        └──────┬──────┘
       │                                      │
       │                                      │
       ↓                                      ↓
┌─────────────────────────────────────────────────────┐
│              live_sessions                          │
│  (providerId → users, patientId → patients)         │
└──────┬──────────────────────────────────────────────┘
       │
       ├─────────────────────────────────────────┐
       ↓                                         ↓
┌─────────────────┐                    ┌─────────────────┐
│ clinical_notes  │                    │  prescriptions  │
│ lab_results     │                    │   referrals     │
└─────────────────┘                    └─────────────────┘
       │
       ↓
┌─────────────────┐
│  audit_logs     │
│  ai_interactions│
└─────────────────┘
```

### Relationship Rules

**No Cascade Deletes:**
- If parent entity is deleted, child entities are RESTRICTED
- Prevents accidental data loss
- Forces explicit cleanup workflows

**Referential Integrity:**
- All foreign keys enforced at database level
- Invalid references rejected

**Circular Dependency Prevention:**
- No table references itself
- No circular chains

---

## CONSTRAINT SUMMARY

### State Constraints (Enforced via CHECK)

| Table | Column | Allowed Values |
|-------|--------|---------------|
| users | role | `provider`, `admin`, `parent` |
| users | accountStatus | `active`, `pending`, `locked` |
| patients | status | `active`, `inactive` |
| live_sessions | status | `scheduled`, `waiting`, `active`, `completed`, `archived` |
| clinical_notes | status | `draft`, `ai_assisted_draft`, `finalized`, `archived` |
| prescriptions | status | `draft`, `issued`, `active`, `completed`, `cancelled` |
| lab_results | status | `ordered`, `pending`, `received`, `reviewed`, `archived` |
| referrals | status | `created`, `sent`, `scheduled`, `completed`, `closed` |
| referrals | urgency | `routine`, `urgent`, `emergency` |

### Uniqueness Constraints

| Table | Columns | Reason |
|-------|---------|--------|
| users | email | No duplicate accounts |
| patients | tenantId + fullName + dateOfBirth | Prevent duplicate patients |
| tenants | organizationName | Unique clinic names |

### Timestamp Constraints

| Table | Rule |
|-------|------|
| live_sessions | `startedAt >= scheduledAt` |
| live_sessions | `completedAt >= startedAt` |
| clinical_notes | `finalizedAt` required when `status = 'finalized'` |
| prescriptions | `issuedAt` required when `status = 'issued'` |
| lab_results | `reviewedAt` required when `status = 'reviewed'` |

---

## IMMUTABILITY ENFORCEMENT MATRIX

| Table | Immutable When | Enforcement |
|-------|---------------|-------------|
| **clinical_notes** | `status IN ('finalized', 'archived')` | ✅ App layer + Optional DB trigger |
| **prescriptions** | `status != 'draft'` | ✅ App layer |
| **lab_results** | `status IN ('reviewed', 'archived')` | ✅ App layer |
| **live_sessions** | `status IN ('completed', 'archived')` | ✅ App layer |
| **referrals** | `status = 'closed'` | ✅ App layer |
| **audit_logs** | **ALL states** | ✅ App layer + DB trigger (recommended) |

### Enforcement Levels

**Level 1: Application Layer (Required)**
```
Before any UPDATE:
  Check entity.status
  If immutable state → throw ImmutableEntityError
```

**Level 2: Database Trigger (Recommended)**
```
BEFORE UPDATE ON clinical_notes
  IF OLD.status IN ('finalized', 'archived')
  THEN RAISE EXCEPTION 'Finalized notes are immutable'
```

**Level 3: Row-Level Security (Future)**
```
Enable RLS on clinical_notes
Policy: Allow UPDATE only if status = 'draft'
```

---

## INDEX STRATEGY

### Tenant Isolation (Critical)

Every multi-row query must filter by `tenantId` first.

```
INDEX idx_<table>_tenant ON <table>(tenantId, <status/timestamp>)
```

**Why:** Prevents cross-tenant data leakage, improves query performance.

### Common Query Patterns

**1. List entities for a patient:**
```
INDEX idx_<table>_patient ON <table>(patientId, status)
```

**2. List entities for a provider:**
```
INDEX idx_<table>_provider ON <table>(providerId, createdAt DESC)
```

**3. Filter by status:**
```
INDEX idx_<table>_status ON <table>(status, createdAt DESC)
```

**4. Audit queries:**
```
INDEX idx_audit_tenant ON audit_logs(tenantId, timestamp DESC)
INDEX idx_audit_entity ON audit_logs(entityType, entityId, timestamp DESC)
```

### Partial Indexes (Optimize Critical Queries)

```
-- Only index finalized notes (for compliance queries)
INDEX idx_notes_finalized ON clinical_notes(finalizedAt)
  WHERE status = 'finalized'

-- Only index abnormal lab results (for alerts)
INDEX idx_labs_abnormal ON lab_results(abnormalFlag, status)
  WHERE abnormalFlag = TRUE

-- Only index active sessions (for real-time dashboard)
INDEX idx_sessions_active ON live_sessions(providerId, scheduledAt)
  WHERE status IN ('scheduled', 'waiting', 'active')
```

---

## DATA VALIDATION RULES

### Email Validation

```
email VARCHAR(255) NOT NULL
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
```

### Phone Validation (Optional)

```
phone VARCHAR(20)
CHECK (phone ~* '^\+?[1-9]\d{1,14}$')  -- E.164 format
```

### Confidence Level Validation

```
confidenceLevel DECIMAL(3,2)
CHECK (confidenceLevel >= 0.00 AND confidenceLevel <= 1.00)
```

### Timestamp Validation

```
-- All timestamps must be in UTC
-- Application layer converts to tenant timezone for display
```

---

## ANTI-PATTERNS (FORBIDDEN)

### ❌ Soft Deletes

```
// BAD
deletedAt TIMESTAMP
```

**Why:** Complicates queries, creates zombie data.

**Alternative:** Use explicit states: `archived`, `closed`, `cancelled`.

---

### ❌ JSON Blobs for Structured Data

```
// BAD
data JSONB  -- Contains medication, dosage, duration
```

**Why:** Loses type safety, indexing, validation.

**Alternative:** Use proper columns with constraints.

---

### ❌ Polymorphic Associations

```
// BAD
entityType VARCHAR(50)
entityId UUID
```

**Why:** No referential integrity, confusing queries.

**Alternative:** Separate tables or explicit foreign keys.

---

### ❌ Audit Table Per Entity

```
// BAD
users_audit
patients_audit
sessions_audit
...
```

**Why:** Query fragmentation, maintenance nightmare.

**Alternative:** Single `audit_logs` table with `entityType` field.

---

### ❌ Autoincrement IDs

```
// BAD
id SERIAL PRIMARY KEY
```

**Why:** Exposes record count, predictable IDs, not globally unique.

**Alternative:** UUID for all primary keys.

---

## MIGRATION STRATEGY

### Phase 1: Core Tables
1. `tenants`
2. `users`
3. `audit_logs`

### Phase 2: Patient Data
4. `patients`
5. `live_sessions`

### Phase 3: Clinical Data
6. `clinical_notes`
7. `prescriptions`
8. `lab_results`

### Phase 4: Workflows
9. `referrals`
10. `ai_interactions`

### Phase 5: Constraints
11. Add foreign keys
12. Add indexes
13. Add triggers (immutability)

### Phase 6: Validation
14. Test state transitions
15. Test immutability enforcement
16. Test tenant isolation

---

## COMPLIANCE NOTES

### HIPAA Compliance

✅ **Audit logs** capture all access to patient data
✅ **Immutability** protects clinical records
✅ **Encryption at rest** (infrastructure concern)
✅ **Tenant isolation** prevents data leakage

### Data Retention

**Clinical Records:**
- Retain for **7 years minimum** (regulatory requirement)
- After 7 years, can move to cold storage
- Never delete, only archive

**Audit Logs:**
- Retain for **7 years minimum**
- After 7 years, move to separate archive table
- Never delete

**AI Interactions:**
- Retain for **2 years** (informational)
- After 2 years, can aggregate for analytics

---

## PHILOSOPHY (LOCKED)

### Schema is Law

> "The database is the final enforcement boundary. Even if code has bugs, schema prevents corruption."

### Immutability is Protection

> "Finalized clinical notes are legal records. Once written, they cannot change. This protects patients, providers, and the organization."

### Simplicity Beats Cleverness

> "Use boring, proven patterns. No polymorphic associations. No JSON blobs. No soft deletes. Just clear, enforceable constraints."

### Multi-Tenancy is Absolute

> "Every query filters by tenantId. Cross-tenant access is impossible. Tenant boundaries are never crossed."

### Compliance is Built-In

> "Audit logs are append-only. Retention is enforced. Immutability is guaranteed. This is a clinical system, not a startup demo."

---

**Last Updated:** January 14, 2026  
**Status:** Database Schema Design Complete  
**Integration:** Aligns with STATE_MACHINES.md, BACKEND_ARCHITECTURE.md, API_CONTRACTS.md  
**Next Step:** Implementation-specific migrations (PostgreSQL, MySQL, etc.)
