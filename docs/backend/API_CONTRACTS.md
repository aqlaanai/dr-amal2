# API Contracts — Dr Amal Clinical OS v2.0

**Purpose:** Define implementation-agnostic API contracts for frontend/backend parallel development.

**Scope:** Contracts only. No code, no database, no implementation details.

**Philosophy:** Frontend defines UX truth. API defines contractual truth. Backend enforces legal truth.

---

## GLOBAL PRINCIPLES

### 1. Standard Response Envelope

Every successful response includes:
```json
{
  "id": "string",
  "status": "enum",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

### 2. Error Response Model

Every error response:
```json
{
  "errorCode": "string",
  "message": "string (human-readable)",
  "severity": "info | warning | critical",
  "details": "object | null"
}
```

### 3. Immutability Rules

- **Finalized** entities: No mutation endpoints
- **Archived** entities: Read-only forever
- **Terminal states**: No state transitions allowed

### 4. State Alignment

All API statuses **MUST** match state machines in `STATE_MACHINES.md`:
- Live Sessions: `scheduled | waiting | active | completed | archived`
- Clinical Notes: `draft | ai_assisted_draft | finalized | archived`
- Prescriptions: `draft | issued | active | completed | cancelled`
- Lab Results: `ordered | pending | received | reviewed | archived`
- Referrals: `created | sent | scheduled | completed | closed`

---

## 1️⃣ AUTH & SESSION CONTRACTS

### Sign In

**Endpoint:** `POST /auth/signin`

**Request:**
```json
{
  "email": "string (required, email format)",
  "password": "string (required, min 8 chars)"
}
```

**Response (200):**
```json
{
  "userId": "string (UUID)",
  "role": "provider | admin | parent",
  "accountStatus": "active | pending | locked",
  "displayName": "string",
  "sessionToken": "string (opaque)",
  "expiresAt": "ISO8601 timestamp"
}
```

**Errors:**
- `AUTH_INVALID_CREDENTIALS` (401): Invalid email or password
- `AUTH_ACCOUNT_PENDING` (403): Account awaiting approval
- `AUTH_ACCOUNT_LOCKED` (403): Account suspended/disabled

---

### Sign Up

**Endpoint:** `POST /auth/signup`

**Request:**
```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "role": "provider | parent (required)",
  "email": "string (required, unique)",
  "phone": "string (required, E.164 format)",
  "password": "string (required, min 8 chars)"
}
```

**Response (201):**
```json
{
  "userId": "string (UUID)",
  "accountStatus": "pending",
  "message": "Account created. Awaiting verification."
}
```

**Errors:**
- `AUTH_EMAIL_EXISTS` (409): Email already registered
- `AUTH_INVALID_ROLE` (400): Invalid role specified
- `VALIDATION_ERROR` (400): Missing or invalid fields

**Notes:**
- All new accounts start with `accountStatus: pending`
- Admin approval required before `accountStatus: active`

---

### Sign Out

**Endpoint:** `POST /auth/signout`

**Request:**
```json
{
  "sessionToken": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "Signed out successfully"
}
```

**Errors:**
- `AUTH_INVALID_SESSION` (401): Invalid or expired token

---

### Get Current User

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Response (200):**
```json
{
  "userId": "string (UUID)",
  "role": "provider | admin | parent",
  "accountStatus": "active | pending | locked",
  "displayName": "string",
  "email": "string",
  "phone": "string",
  "createdAt": "ISO8601 timestamp"
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Missing or invalid token

---

## 2️⃣ OVERVIEW DASHBOARD CONTRACTS

### Get Overview Summary

**Endpoint:** `GET /overview/summary`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Response (200) - Provider:**
```json
{
  "todayAppointments": "number",
  "activePatients": "number",
  "pendingLabResults": "number",
  "sessionsThisWeek": "number",
  "prescriptionsWritten": "number",
  "clinicalNotes": "number",
  "referralsMade": "number",
  "role": "provider"
}
```

**Response (200) - Admin:**
```json
{
  "todayAppointments": "number",
  "activePatients": "number",
  "pendingLabResults": "number",
  "sessionsThisWeek": "number",
  "prescriptionsWritten": "number",
  "clinicalNotes": "number",
  "referralsMade": "number",
  "role": "admin",
  "readOnly": true
}
```

**Response (200) - Parent:**
```json
{
  "upcomingAppointments": "number",
  "familyMembers": "number",
  "role": "parent"
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Invalid session

**Notes:**
- Read-only endpoint
- Response shape varies by role
- All values are current as of request time

---

## 3️⃣ PATIENT REGISTRY CONTRACTS

### List Patients

**Endpoint:** `GET /patients`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Query Parameters:**
```
?search=string (optional, name search)
&status=active|inactive (optional)
&limit=number (default: 50, max: 100)
&offset=number (default: 0)
```

**Response (200):**
```json
{
  "patients": [
    {
      "patientId": "string (UUID)",
      "fullName": "string",
      "dateOfBirth": "ISO8601 date",
      "lastVisit": "ISO8601 timestamp | null",
      "status": "active | inactive",
      "createdAt": "ISO8601 timestamp"
    }
  ],
  "total": "number",
  "limit": "number",
  "offset": "number"
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Invalid session
- `ROLE_FORBIDDEN` (403): Parent role cannot access

---

### Get Patient Detail

**Endpoint:** `GET /patients/{patientId}`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Response (200):**
```json
{
  "patientId": "string (UUID)",
  "fullName": "string",
  "dateOfBirth": "ISO8601 date",
  "status": "active | inactive",
  "encounters": "number",
  "lastVisit": "ISO8601 timestamp | null",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**Errors:**
- `PATIENT_NOT_FOUND` (404): Patient does not exist
- `ROLE_FORBIDDEN` (403): Insufficient permissions

---

## 4️⃣ SCHEDULE CONTRACTS

### List Appointments

**Endpoint:** `GET /schedule`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Query Parameters:**
```
?date=ISO8601 date (default: today)
&status=scheduled|completed (optional)
```

**Response (200):**
```json
{
  "appointments": [
    {
      "appointmentId": "string (UUID)",
      "patientId": "string (UUID)",
      "patientName": "string",
      "scheduledAt": "ISO8601 timestamp",
      "duration": "number (minutes)",
      "status": "scheduled | completed | cancelled",
      "type": "initial | followup | urgent"
    }
  ],
  "date": "ISO8601 date"
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Invalid session
- `ROLE_FORBIDDEN` (403): Parent role cannot access

---

## 5️⃣ LIVE SESSIONS CONTRACTS

### List Sessions

**Endpoint:** `GET /sessions`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Query Parameters:**
```
?status=scheduled|waiting|active|completed|archived (optional)
&patientId=string (optional)
&limit=number (default: 50)
```

**Response (200):**
```json
{
  "sessions": [
    {
      "sessionId": "string (UUID)",
      "patientId": "string (UUID)",
      "patientName": "string",
      "status": "scheduled | waiting | active | completed | archived",
      "scheduledAt": "ISO8601 timestamp",
      "startedAt": "ISO8601 timestamp | null",
      "endedAt": "ISO8601 timestamp | null",
      "duration": "number (minutes) | null",
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp"
    }
  ]
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Invalid session
- `ROLE_FORBIDDEN` (403): Non-provider role

---

### Create Session

**Endpoint:** `POST /sessions`

**Request:**
```json
{
  "patientId": "string (UUID, required)",
  "scheduledAt": "ISO8601 timestamp (required)",
  "duration": "number (minutes, default: 30)"
}
```

**Response (201):**
```json
{
  "sessionId": "string (UUID)",
  "patientId": "string (UUID)",
  "status": "scheduled",
  "scheduledAt": "ISO8601 timestamp",
  "duration": "number",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**Errors:**
- `PATIENT_NOT_FOUND` (404): Patient does not exist
- `VALIDATION_ERROR` (400): Invalid request data

---

### Start Session

**Endpoint:** `PATCH /sessions/{sessionId}/start`

**Request:**
```json
{
  "sessionId": "string (UUID, required)"
}
```

**Response (200):**
```json
{
  "sessionId": "string (UUID)",
  "status": "waiting",
  "startedAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**State Transition:**
- `scheduled` → `waiting`

**Errors:**
- `SESSION_NOT_FOUND` (404): Session does not exist
- `SESSION_INVALID_STATE` (409): Cannot start from current state

---

### Mark Session Active

**Endpoint:** `PATCH /sessions/{sessionId}/activate`

**Request:**
```json
{
  "sessionId": "string (UUID, required)"
}
```

**Response (200):**
```json
{
  "sessionId": "string (UUID)",
  "status": "active",
  "updatedAt": "ISO8601 timestamp"
}
```

**State Transition:**
- `waiting` → `active`

**Errors:**
- `SESSION_INVALID_STATE` (409): Must be in waiting state

---

### End Session

**Endpoint:** `PATCH /sessions/{sessionId}/complete`

**Request:**
```json
{
  "sessionId": "string (UUID, required)"
}
```

**Response (200):**
```json
{
  "sessionId": "string (UUID)",
  "status": "completed",
  "endedAt": "ISO8601 timestamp",
  "duration": "number (minutes)",
  "updatedAt": "ISO8601 timestamp"
}
```

**State Transition:**
- `active` → `completed` (ONE-WAY, irreversible)

**Errors:**
- `SESSION_INVALID_STATE` (409): Must be active

**Notes:**
- This is a terminal transition for the session lifecycle
- Completed sessions become read-only

---

## 6️⃣ CLINICAL NOTES CONTRACTS

### List Notes

**Endpoint:** `GET /notes`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Query Parameters:**
```
?patientId=string (optional)
&status=draft|finalized|archived (optional)
&limit=number (default: 50)
```

**Response (200):**
```json
{
  "notes": [
    {
      "noteId": "string (UUID)",
      "patientId": "string (UUID)",
      "patientName": "string",
      "status": "draft | ai_assisted_draft | finalized | archived",
      "aiAssisted": "boolean",
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp",
      "finalizedAt": "ISO8601 timestamp | null"
    }
  ]
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Invalid session
- `ROLE_FORBIDDEN` (403): Non-provider role

---

### Create Draft Note

**Endpoint:** `POST /notes`

**Request:**
```json
{
  "patientId": "string (UUID, required)",
  "sessionId": "string (UUID, optional)",
  "subjective": "string (optional)",
  "objective": "string (optional)",
  "assessment": "string (optional)",
  "plan": "string (optional)"
}
```

**Response (201):**
```json
{
  "noteId": "string (UUID)",
  "patientId": "string (UUID)",
  "status": "draft",
  "aiAssisted": false,
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**Errors:**
- `PATIENT_NOT_FOUND` (404): Patient does not exist

---

### Update Draft Note

**Endpoint:** `PUT /notes/{noteId}`

**Request:**
```json
{
  "subjective": "string (optional)",
  "objective": "string (optional)",
  "assessment": "string (optional)",
  "plan": "string (optional)",
  "aiAssisted": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "noteId": "string (UUID)",
  "status": "draft | ai_assisted_draft",
  "aiAssisted": "boolean",
  "updatedAt": "ISO8601 timestamp"
}
```

**Errors:**
- `NOTE_NOT_FOUND` (404): Note does not exist
- `NOTE_IMMUTABLE` (409): Note is finalized or archived

**Notes:**
- Only `draft` or `ai_assisted_draft` notes can be updated
- Setting `aiAssisted: true` changes status to `ai_assisted_draft`

---

### Finalize Note

**Endpoint:** `PATCH /notes/{noteId}/finalize`

**Request:**
```json
{
  "noteId": "string (UUID, required)"
}
```

**Response (200):**
```json
{
  "noteId": "string (UUID)",
  "status": "finalized",
  "finalizedAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**State Transition:**
- `draft` → `finalized` (ONE-WAY, irreversible)
- `ai_assisted_draft` → `finalized` (ONE-WAY, irreversible)

**Errors:**
- `NOTE_INVALID_STATE` (409): Note not in draft state
- `NOTE_INCOMPLETE` (400): Required fields missing

**Notes:**
- **This is a permanent, irreversible action**
- Finalized notes cannot be edited or deleted
- Must validate all required fields before allowing finalization

---

### Get Note Detail

**Endpoint:** `GET /notes/{noteId}`

**Response (200):**
```json
{
  "noteId": "string (UUID)",
  "patientId": "string (UUID)",
  "patientName": "string",
  "sessionId": "string (UUID) | null",
  "status": "draft | ai_assisted_draft | finalized | archived",
  "aiAssisted": "boolean",
  "subjective": "string",
  "objective": "string",
  "assessment": "string",
  "plan": "string",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp",
  "finalizedAt": "ISO8601 timestamp | null",
  "archivedAt": "ISO8601 timestamp | null"
}
```

**Errors:**
- `NOTE_NOT_FOUND` (404): Note does not exist

---

## 7️⃣ PRESCRIPTIONS CONTRACTS

### List Prescriptions

**Endpoint:** `GET /prescriptions`

**Query Parameters:**
```
?patientId=string (optional)
&status=draft|issued|active|completed|cancelled (optional)
&limit=number (default: 50)
```

**Response (200):**
```json
{
  "prescriptions": [
    {
      "prescriptionId": "string (UUID)",
      "patientId": "string (UUID)",
      "patientName": "string",
      "medication": "string",
      "dosage": "string",
      "status": "draft | issued | active | completed | cancelled",
      "issuedAt": "ISO8601 timestamp | null",
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp"
    }
  ]
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Invalid session
- `ROLE_FORBIDDEN` (403): Non-provider role

---

### Create Draft Prescription

**Endpoint:** `POST /prescriptions`

**Request:**
```json
{
  "patientId": "string (UUID, required)",
  "medication": "string (required)",
  "dosage": "string (required)",
  "frequency": "string (required)",
  "duration": "string (required)",
  "refills": "number (default: 0)",
  "instructions": "string (optional)"
}
```

**Response (201):**
```json
{
  "prescriptionId": "string (UUID)",
  "patientId": "string (UUID)",
  "status": "draft",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**Errors:**
- `PATIENT_NOT_FOUND` (404): Patient does not exist
- `VALIDATION_ERROR` (400): Invalid fields

---

### Issue Prescription

**Endpoint:** `PATCH /prescriptions/{prescriptionId}/issue`

**Request:**
```json
{
  "prescriptionId": "string (UUID, required)"
}
```

**Response (200):**
```json
{
  "prescriptionId": "string (UUID)",
  "status": "issued",
  "issuedAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**State Transition:**
- `draft` → `issued` (ONE-WAY, irreversible)

**Errors:**
- `PRESCRIPTION_INVALID_STATE` (409): Not in draft state
- `PRESCRIPTION_INCOMPLETE` (400): Required fields missing

**Notes:**
- **Permanent action** - issued prescriptions cannot be edited
- Can only be cancelled, not modified

---

### Cancel Prescription

**Endpoint:** `PATCH /prescriptions/{prescriptionId}/cancel`

**Request:**
```json
{
  "prescriptionId": "string (UUID, required)",
  "reason": "string (required)"
}
```

**Response (200):**
```json
{
  "prescriptionId": "string (UUID)",
  "status": "cancelled",
  "cancelledAt": "ISO8601 timestamp",
  "cancellationReason": "string",
  "updatedAt": "ISO8601 timestamp"
}
```

**State Transition:**
- `draft` → `cancelled` (terminal)
- `issued` → `cancelled` (terminal)
- `active` → `cancelled` (terminal)

**Errors:**
- `PRESCRIPTION_ALREADY_CANCELLED` (409): Already cancelled
- `PRESCRIPTION_COMPLETED` (409): Cannot cancel completed prescription

**Notes:**
- Terminal state - no further transitions
- Cancellation is permanent

---

## 8️⃣ LAB RESULTS CONTRACTS

### List Lab Results

**Endpoint:** `GET /labs`

**Query Parameters:**
```
?patientId=string (optional)
&status=ordered|pending|received|reviewed|archived (optional)
&abnormal=boolean (optional)
&limit=number (default: 50)
```

**Response (200):**
```json
{
  "results": [
    {
      "resultId": "string (UUID)",
      "patientId": "string (UUID)",
      "patientName": "string",
      "testName": "string",
      "status": "ordered | pending | received | reviewed | archived",
      "abnormalFlag": "boolean",
      "orderedAt": "ISO8601 timestamp",
      "receivedAt": "ISO8601 timestamp | null",
      "reviewedAt": "ISO8601 timestamp | null",
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp"
    }
  ]
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Invalid session
- `ROLE_FORBIDDEN` (403): Non-provider role

---

### Order Lab Test

**Endpoint:** `POST /labs`

**Request:**
```json
{
  "patientId": "string (UUID, required)",
  "testName": "string (required)",
  "testType": "string (required)",
  "urgency": "routine | urgent | stat (default: routine)",
  "clinicalIndication": "string (optional)"
}
```

**Response (201):**
```json
{
  "resultId": "string (UUID)",
  "patientId": "string (UUID)",
  "status": "ordered",
  "orderedAt": "ISO8601 timestamp",
  "createdAt": "ISO8601 timestamp"
}
```

**Errors:**
- `PATIENT_NOT_FOUND` (404): Patient does not exist

---

### Get Lab Result Detail

**Endpoint:** `GET /labs/{resultId}`

**Response (200):**
```json
{
  "resultId": "string (UUID)",
  "patientId": "string (UUID)",
  "patientName": "string",
  "testName": "string",
  "status": "ordered | pending | received | reviewed | archived",
  "abnormalFlag": "boolean",
  "values": [
    {
      "parameter": "string",
      "value": "string | number",
      "unit": "string",
      "referenceRange": "string",
      "isAbnormal": "boolean"
    }
  ],
  "orderedAt": "ISO8601 timestamp",
  "receivedAt": "ISO8601 timestamp | null",
  "reviewedAt": "ISO8601 timestamp | null",
  "reviewedBy": "string (userId) | null",
  "notes": "string | null",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**Errors:**
- `RESULT_NOT_FOUND` (404): Result does not exist

---

### Mark Lab Result Reviewed

**Endpoint:** `PATCH /labs/{resultId}/review`

**Request:**
```json
{
  "resultId": "string (UUID, required)",
  "notes": "string (optional)"
}
```

**Response (200):**
```json
{
  "resultId": "string (UUID)",
  "status": "reviewed",
  "reviewedAt": "ISO8601 timestamp",
  "reviewedBy": "string (userId)",
  "updatedAt": "ISO8601 timestamp"
}
```

**State Transition:**
- `received` → `reviewed` (ONE-WAY, irreversible)

**Errors:**
- `RESULT_INVALID_STATE` (409): Not in received state

**Notes:**
- Reviewed results are read-only
- Cannot un-review a result

---

## 9️⃣ MEDICAL IMAGING CONTRACTS

### List Imaging Studies

**Endpoint:** `GET /imaging`

**Query Parameters:**
```
?patientId=string (optional)
&status=ordered|pending|received|reviewed|archived (optional)
&limit=number (default: 50)
```

**Response (200):**
```json
{
  "studies": [
    {
      "studyId": "string (UUID)",
      "patientId": "string (UUID)",
      "patientName": "string",
      "studyType": "xray | ct | mri | ultrasound",
      "bodyPart": "string",
      "status": "ordered | pending | received | reviewed | archived",
      "orderedAt": "ISO8601 timestamp",
      "receivedAt": "ISO8601 timestamp | null",
      "reviewedAt": "ISO8601 timestamp | null",
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp"
    }
  ]
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Invalid session
- `ROLE_FORBIDDEN` (403): Non-provider role

---

### Order Imaging Study

**Endpoint:** `POST /imaging`

**Request:**
```json
{
  "patientId": "string (UUID, required)",
  "studyType": "xray | ct | mri | ultrasound (required)",
  "bodyPart": "string (required)",
  "clinicalIndication": "string (required)",
  "urgency": "routine | urgent | stat (default: routine)"
}
```

**Response (201):**
```json
{
  "studyId": "string (UUID)",
  "patientId": "string (UUID)",
  "status": "ordered",
  "orderedAt": "ISO8601 timestamp",
  "createdAt": "ISO8601 timestamp"
}
```

**Errors:**
- `PATIENT_NOT_FOUND` (404): Patient does not exist
- `VALIDATION_ERROR` (400): Invalid study type or fields

---

### Mark Imaging Reviewed

**Endpoint:** `PATCH /imaging/{studyId}/review`

**Request:**
```json
{
  "studyId": "string (UUID, required)",
  "notes": "string (optional)"
}
```

**Response (200):**
```json
{
  "studyId": "string (UUID)",
  "status": "reviewed",
  "reviewedAt": "ISO8601 timestamp",
  "reviewedBy": "string (userId)",
  "updatedAt": "ISO8601 timestamp"
}
```

**State Transition:**
- `received` → `reviewed` (ONE-WAY, irreversible)

**Errors:**
- `STUDY_INVALID_STATE` (409): Not in received state

---

## 🔟 REFERRALS CONTRACTS

### List Referrals

**Endpoint:** `GET /referrals`

**Query Parameters:**
```
?patientId=string (optional)
&status=created|sent|scheduled|completed|closed (optional)
&limit=number (default: 50)
```

**Response (200):**
```json
{
  "referrals": [
    {
      "referralId": "string (UUID)",
      "patientId": "string (UUID)",
      "patientName": "string",
      "specialty": "string",
      "status": "created | sent | scheduled | completed | closed",
      "urgency": "routine | urgent",
      "sentAt": "ISO8601 timestamp | null",
      "scheduledAt": "ISO8601 timestamp | null",
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp"
    }
  ]
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Invalid session
- `ROLE_FORBIDDEN` (403): Non-provider role

---

### Create Referral

**Endpoint:** `POST /referrals`

**Request:**
```json
{
  "patientId": "string (UUID, required)",
  "specialty": "string (required)",
  "urgency": "routine | urgent (default: routine)",
  "reason": "string (required)",
  "notes": "string (optional)"
}
```

**Response (201):**
```json
{
  "referralId": "string (UUID)",
  "patientId": "string (UUID)",
  "status": "created",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**Errors:**
- `PATIENT_NOT_FOUND` (404): Patient does not exist
- `VALIDATION_ERROR` (400): Invalid fields

---

### Send Referral

**Endpoint:** `PATCH /referrals/{referralId}/send`

**Request:**
```json
{
  "referralId": "string (UUID, required)"
}
```

**Response (200):**
```json
{
  "referralId": "string (UUID)",
  "status": "sent",
  "sentAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**State Transition:**
- `created` → `sent` (ONE-WAY, irreversible)

**Errors:**
- `REFERRAL_INVALID_STATE` (409): Not in created state

**Notes:**
- Sent referrals cannot be edited
- Can only track status from this point

---

### Close Referral

**Endpoint:** `PATCH /referrals/{referralId}/close`

**Request:**
```json
{
  "referralId": "string (UUID, required)",
  "notes": "string (optional)"
}
```

**Response (200):**
```json
{
  "referralId": "string (UUID)",
  "status": "closed",
  "closedAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**State Transition:**
- `completed` → `closed` (terminal)
- `created` → `closed` (cancellation, terminal)

**Errors:**
- `REFERRAL_ALREADY_CLOSED` (409): Already closed

**Notes:**
- Terminal state - no further transitions
- Closed referrals are view-only forever

---

## 1️⃣1️⃣ AUDIT LOGS CONTRACTS

### List Audit Logs

**Endpoint:** `GET /audit`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Query Parameters:**
```
?actor=string (userId, optional)
&action=string (optional)
&entity=string (optional)
&startDate=ISO8601 date (optional)
&endDate=ISO8601 date (optional)
&limit=number (default: 100, max: 1000)
&offset=number (default: 0)
```

**Response (200):**
```json
{
  "logs": [
    {
      "logId": "string (UUID)",
      "actor": "string (userId)",
      "actorName": "string",
      "action": "string (created | updated | finalized | cancelled | deleted | viewed)",
      "entity": "string (note | prescription | session | patient | etc)",
      "entityId": "string (UUID)",
      "ipAddress": "string",
      "userAgent": "string",
      "timestamp": "ISO8601 timestamp",
      "metadata": "object | null"
    }
  ],
  "total": "number",
  "limit": "number",
  "offset": "number"
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Invalid session
- `ROLE_FORBIDDEN` (403): Non-admin role

**Notes:**
- **Append-only** - no mutation endpoints exist
- **Read-only** - no updates or deletes
- Admin role only
- Logs are never deleted, only archived

---

### Get Audit Log Detail

**Endpoint:** `GET /audit/{logId}`

**Response (200):**
```json
{
  "logId": "string (UUID)",
  "actor": "string (userId)",
  "actorName": "string",
  "actorRole": "provider | admin | parent",
  "action": "string",
  "entity": "string",
  "entityId": "string (UUID)",
  "ipAddress": "string",
  "userAgent": "string",
  "timestamp": "ISO8601 timestamp",
  "metadata": {
    "before": "object | null",
    "after": "object | null",
    "changes": "array of field changes"
  }
}
```

**Errors:**
- `LOG_NOT_FOUND` (404): Log does not exist
- `ROLE_FORBIDDEN` (403): Non-admin role

---

## 1️⃣2️⃣ ADMIN MANAGEMENT CONTRACTS

### List Users

**Endpoint:** `GET /admin/users`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Query Parameters:**
```
?role=provider|admin|parent (optional)
&status=active|pending|locked (optional)
&limit=number (default: 50)
```

**Response (200):**
```json
{
  "users": [
    {
      "userId": "string (UUID)",
      "displayName": "string",
      "email": "string",
      "role": "provider | admin | parent",
      "accountStatus": "active | pending | locked",
      "createdAt": "ISO8601 timestamp",
      "lastLogin": "ISO8601 timestamp | null"
    }
  ]
}
```

**Errors:**
- `AUTH_UNAUTHORIZED` (401): Invalid session
- `ROLE_FORBIDDEN` (403): Non-admin role

**Notes:**
- Admin role only
- Read-only for now (activation future feature)

---

## ERROR CODE REFERENCE

### Authentication Errors (AUTH_*)

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `AUTH_ACCOUNT_PENDING` | 403 | Account awaiting approval |
| `AUTH_ACCOUNT_LOCKED` | 403 | Account suspended |
| `AUTH_UNAUTHORIZED` | 401 | Missing or invalid token |
| `AUTH_INVALID_SESSION` | 401 | Session expired or invalid |
| `AUTH_EMAIL_EXISTS` | 409 | Email already registered |
| `AUTH_INVALID_ROLE` | 400 | Invalid role specified |

### Entity Not Found Errors (*_NOT_FOUND)

| Code | Status | Description |
|------|--------|-------------|
| `PATIENT_NOT_FOUND` | 404 | Patient does not exist |
| `SESSION_NOT_FOUND` | 404 | Session does not exist |
| `NOTE_NOT_FOUND` | 404 | Note does not exist |
| `PRESCRIPTION_NOT_FOUND` | 404 | Prescription does not exist |
| `RESULT_NOT_FOUND` | 404 | Lab result does not exist |
| `STUDY_NOT_FOUND` | 404 | Imaging study does not exist |
| `REFERRAL_NOT_FOUND` | 404 | Referral does not exist |
| `LOG_NOT_FOUND` | 404 | Audit log does not exist |

### Invalid State Errors (*_INVALID_STATE)

| Code | Status | Description |
|------|--------|-------------|
| `SESSION_INVALID_STATE` | 409 | Cannot transition from current state |
| `NOTE_INVALID_STATE` | 409 | Note not in allowed state |
| `PRESCRIPTION_INVALID_STATE` | 409 | Prescription not in allowed state |
| `RESULT_INVALID_STATE` | 409 | Lab result not in allowed state |
| `REFERRAL_INVALID_STATE` | 409 | Referral not in allowed state |

### Immutability Errors (*_IMMUTABLE)

| Code | Status | Description |
|------|--------|-------------|
| `NOTE_IMMUTABLE` | 409 | Note is finalized, cannot edit |
| `PRESCRIPTION_IMMUTABLE` | 409 | Prescription is issued, cannot edit |
| `RESULT_IMMUTABLE` | 409 | Result is reviewed, cannot edit |
| `REFERRAL_IMMUTABLE` | 409 | Referral is sent, cannot edit |

### Permission Errors (ROLE_*)

| Code | Status | Description |
|------|--------|-------------|
| `ROLE_FORBIDDEN` | 403 | Insufficient permissions for role |

### Validation Errors (VALIDATION_*)

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |

---

## STATE TRANSITION MATRIX

### Clinical Notes

| From | To | Endpoint | Reversible |
|------|-----|----------|------------|
| - | `draft` | `POST /notes` | - |
| `draft` | `draft` | `PUT /notes/{id}` | ✅ |
| `draft` | `ai_assisted_draft` | `PUT /notes/{id}` (with aiAssisted flag) | ✅ |
| `draft` | `finalized` | `PATCH /notes/{id}/finalize` | ❌ ONE-WAY |
| `ai_assisted_draft` | `finalized` | `PATCH /notes/{id}/finalize` | ❌ ONE-WAY |
| `finalized` | `archived` | Automatic (age-based) | ❌ |

### Prescriptions

| From | To | Endpoint | Reversible |
|------|-----|----------|------------|
| - | `draft` | `POST /prescriptions` | - |
| `draft` | `draft` | `PUT /prescriptions/{id}` | ✅ |
| `draft` | `issued` | `PATCH /prescriptions/{id}/issue` | ❌ ONE-WAY |
| `draft` | `cancelled` | `PATCH /prescriptions/{id}/cancel` | ❌ TERMINAL |
| `issued` | `active` | External (pharmacy confirms) | ❌ |
| `issued` | `cancelled` | `PATCH /prescriptions/{id}/cancel` | ❌ TERMINAL |
| `active` | `completed` | External (all refills used) | ❌ TERMINAL |
| `active` | `cancelled` | `PATCH /prescriptions/{id}/cancel` | ❌ TERMINAL |

### Live Sessions

| From | To | Endpoint | Reversible |
|------|-----|----------|------------|
| - | `scheduled` | `POST /sessions` | - |
| `scheduled` | `waiting` | `PATCH /sessions/{id}/start` | ❌ |
| `waiting` | `active` | `PATCH /sessions/{id}/activate` | ❌ |
| `active` | `completed` | `PATCH /sessions/{id}/complete` | ❌ ONE-WAY |
| `completed` | `archived` | Automatic (age-based) | ❌ TERMINAL |

### Lab Results

| From | To | Endpoint | Reversible |
|------|-----|----------|------------|
| - | `ordered` | `POST /labs` | - |
| `ordered` | `pending` | External (lab receives sample) | ❌ |
| `pending` | `received` | External (lab uploads results) | ❌ |
| `received` | `reviewed` | `PATCH /labs/{id}/review` | ❌ ONE-WAY |
| `reviewed` | `archived` | Automatic (age-based) | ❌ TERMINAL |

### Referrals

| From | To | Endpoint | Reversible |
|------|-----|----------|------------|
| - | `created` | `POST /referrals` | - |
| `created` | `sent` | `PATCH /referrals/{id}/send` | ❌ ONE-WAY |
| `created` | `closed` | `PATCH /referrals/{id}/close` | ❌ TERMINAL (cancelled) |
| `sent` | `scheduled` | External (specialist confirms) | ❌ |
| `scheduled` | `completed` | External (appointment occurs) | ❌ |
| `completed` | `closed` | `PATCH /referrals/{id}/close` | ❌ TERMINAL |

---

## IMMUTABILITY GUARANTEES

### Entities That Become Read-Only

Once these states are reached, **NO mutation endpoints exist**:

1. **Clinical Notes** - `finalized` or `archived`
   - ❌ No `PUT /notes/{id}` allowed
   - ❌ No `DELETE /notes/{id}` exists

2. **Prescriptions** - `issued`, `active`, `completed`, `cancelled`
   - ❌ No `PUT /prescriptions/{id}` allowed after issued
   - ❌ Only `PATCH /cancel` allowed for issued/active

3. **Lab Results** - `reviewed` or `archived`
   - ❌ No `PUT /labs/{id}` allowed after reviewed

4. **Sessions** - `completed` or `archived`
   - ❌ No `PUT /sessions/{id}` allowed after completed

5. **Referrals** - `closed`
   - ❌ No `PUT /referrals/{id}` allowed after sent
   - ❌ Terminal state, no reopening

6. **Audit Logs** - ALL states
   - ❌ No `PUT /audit/{id}` exists
   - ❌ No `DELETE /audit/{id}` exists
   - ✅ Only `POST` (append-only) and `GET` (read-only)

---

## ROLE-BASED ACCESS MATRIX

### Endpoint Access by Role

| Endpoint | Provider | Admin | Parent |
|----------|----------|-------|--------|
| `POST /auth/signin` | ✅ | ✅ | ✅ |
| `POST /auth/signup` | ✅ | ❌ | ✅ |
| `GET /overview/summary` | ✅ | ✅ (read-only) | ✅ (limited) |
| `GET /patients` | ✅ | ✅ (read-only) | ❌ |
| `GET /schedule` | ✅ | ❌ | ❌ |
| `GET /sessions` | ✅ | ❌ | ❌ |
| `POST /sessions` | ✅ | ❌ | ❌ |
| `GET /notes` | ✅ | ❌ | ❌ |
| `POST /notes` | ✅ | ❌ | ❌ |
| `GET /prescriptions` | ✅ | ❌ | ❌ |
| `POST /prescriptions` | ✅ | ❌ | ❌ |
| `GET /labs` | ✅ | ❌ | ❌ |
| `POST /labs` | ✅ | ❌ | ❌ |
| `GET /imaging` | ✅ | ❌ | ❌ |
| `POST /imaging` | ✅ | ❌ | ❌ |
| `GET /referrals` | ✅ | ❌ | ❌ |
| `POST /referrals` | ✅ | ❌ | ❌ |
| `GET /audit` | ❌ | ✅ | ❌ |
| `GET /admin/users` | ❌ | ✅ | ❌ |

**Legend:**
- ✅ Full access
- ✅ (read-only) Can view but not modify
- ✅ (limited) Restricted data returned
- ❌ No access (returns `ROLE_FORBIDDEN`)

---

## PAGINATION STANDARD

All list endpoints follow this pattern:

**Query Parameters:**
```
?limit=number (default: 50, max: 100)
&offset=number (default: 0)
```

**Response:**
```json
{
  "items": [...],
  "total": "number (total count)",
  "limit": "number (current page size)",
  "offset": "number (current offset)"
}
```

---

## TIMESTAMP STANDARD

All timestamps use **ISO 8601 format**:

```
2026-01-14T10:30:00.000Z
```

**Key Timestamp Fields:**
- `createdAt` - When entity was created (never changes)
- `updatedAt` - Last modification time
- `finalizedAt` - When entity became immutable
- `archivedAt` - When entity moved to archive
- `deletedAt` - Soft delete timestamp (if applicable)

---

## API VERSIONING

**Base URL Pattern:**
```
https://api.dramal.com/v1/{resource}
```

**Version Strategy:**
- Major version in URL path (`/v1`, `/v2`)
- Breaking changes require new version
- Non-breaking changes allowed in current version
- Deprecation notices 6 months before removal

---

## RATE LIMITING

**Standard Limits:**
- 100 requests per minute per user
- 1000 requests per hour per user

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642160400
```

**Error Response (429):**
```json
{
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "severity": "warning",
  "retryAfter": 60
}
```

---

## PHILOSOPHY

> "APIs are contracts, not implementations."

**Core Principles:**

1. **Explicit Over Implicit**
   - Every state transition is a named endpoint
   - No magic state changes in the background

2. **Immutability by Design**
   - Once finalized, no mutation endpoints exist
   - Terminal states are truly terminal

3. **Predictable Errors**
   - Every error has a code and message
   - Severity levels guide frontend handling

4. **Role-Based Truth**
   - API knows about roles
   - Responses shaped by requester's role
   - Forbidden actions return 403, not 404

5. **State Machine Alignment**
   - API states match frontend states exactly
   - No hidden states
   - No undocumented transitions

**This is a clinical system. APIs must be safe, boring, and predictable.**

---

**Last Updated:** January 14, 2026  
**Status:** API Contract Definitions Complete  
**Integration:** Aligns with STATE_MACHINES.md, ROLE_BASED_UI.md, USER_JOURNEYS.md  
**Implementation:** Ready for parallel frontend/backend development
