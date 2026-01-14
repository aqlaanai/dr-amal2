# User Journeys — Dr Amal Clinical OS v2.0

**Purpose:** Define safe, predictable user flows connecting screens and state machines.

**Scope:** Frontend-only. Describes what users see, not what backend enforces.

**Philosophy:** Journeys protect clinical safety. UX must never imply illegal actions.

---

## JOURNEY NOTATION

```
[Screen A] → [Screen B] → [Screen C]
    ↓
[Alternative Path]

⛔ Blocked
✅ Allowed
⚠️ Edge Case
```

---

## 1️⃣ HEALTHCARE PROVIDER — DAILY CLINICAL FLOW (HAPPY PATH)

**Goal:** Conduct a complete patient encounter from start to finish.

**Entry Point:** Sign In → Overview

### Flow Diagram

```
[Sign In]
    ↓
[App Shell + Overview]
    ↓
[Schedule] → View today's appointments
    ↓
[Patient Registry] → Search/select patient
    ↓
[Patient Context] → Review chart
    ↓
[Live Session - Scheduled]
    ↓
[Live Session - Waiting] → Provider joins
    ↓
[Live Session - Active] → Patient joins, consultation begins
    ↓
[Clinical Notes - Draft] → During/after session
    ↓
[Clinical Notes - Finalized] ⊗ → One-way, locked forever
    ↓
[Prescriptions - Draft] → Write prescription
    ↓
[Prescriptions - Issued] ⊗ → One-way, sent to pharmacy
    ↓
[Live Session - Completed]
    ↓
[Overview] → Return to dashboard
```

### Screen-by-Screen Journey

| Step | Screen | State | Actions Available | Exit Options |
|------|--------|-------|-------------------|--------------|
| 1 | Sign In | Signing In | Submit credentials | None (loading) |
| 2 | Overview | Signed In | View KPIs, navigate | All nav items |
| 3 | Schedule | Viewing | See appointments, join session | Sidebar, back |
| 4 | Patient Registry | Idle | Search, filter, select patient | Sidebar, back |
| 5 | Patient Context | Viewing | Review chart, start session | Sidebar, back |
| 6 | Live Session | Scheduled | Edit details, cancel | Sidebar, cancel |
| 7 | Live Session | Waiting | Wait for patient, cancel | End session, cancel |
| 8 | Live Session | Active | Session controls, take notes | End session |
| 9 | Clinical Notes | Draft | Edit, save, AI assist | Save draft, finalize |
| 10 | Clinical Notes | Finalized ⊗ | View only | Close |
| 11 | Prescriptions | Draft | Edit, save | Save, issue |
| 12 | Prescriptions | Issued ⊗ | View only | Close |
| 13 | Live Session | Completed | View summary | Close, archive |
| 14 | Overview | Signed In | Next patient | Continue work |

### Critical Rules

✅ **Allowed:**
- Editing draft notes before finalization
- Editing draft prescriptions before issuing
- Canceling scheduled sessions

🔒 **One-Way Gates:**
- Draft Note → Finalized (show confirmation modal)
- Draft Prescription → Issued (show confirmation modal)
- Active Session → Completed (cannot restart)

⛔ **Blocked:**
- Editing finalized notes
- Editing issued prescriptions
- Restarting completed sessions

### UX Safety Measures

**Confirmation Modal 1: Finalize Note**
```
╔══════════════════════════════════════════╗
║  Finalize Clinical Note?                 ║
║                                          ║
║  Patient: Sarah Johnson                  ║
║  Date: January 14, 2026                  ║
║                                          ║
║  Once finalized, this note cannot be     ║
║  edited or deleted. This action is       ║
║  permanent.                              ║
║                                          ║
║  [Cancel]            [Finalize Note]    ║
╚══════════════════════════════════════════╝
```

**Confirmation Modal 2: Issue Prescription**
```
╔══════════════════════════════════════════╗
║  Issue Prescription?                     ║
║                                          ║
║  Medication: Amoxicillin 500mg           ║
║  Patient: Sarah Johnson                  ║
║                                          ║
║  This prescription will be sent to the   ║
║  pharmacy and cannot be edited after     ║
║  being issued.                           ║
║                                          ║
║  [Cancel]            [Issue Prescription]║
╚══════════════════════════════════════════╝
```

---

## 2️⃣ HEALTHCARE PROVIDER — QUICK REVIEW FLOW

**Goal:** Review and acknowledge lab results without a full encounter.

**Entry Point:** Overview → Lab Results

### Flow Diagram

```
[Overview]
    ↓
[Lab Results - List View]
    ↓
[Filter: Result Received] → Orange badge items
    ↓
[Lab Result Detail]
    ↓
[Review Values] → Check for abnormal flags
    ↓
[Mark as Reviewed] → One-way transition
    ↓
[Lab Result - Reviewed State] ⊗
    ↓
[Back to Lab Results List]
    ↓
[Next Pending Result] OR [Overview]
```

### Screen-by-Screen Journey

| Step | Screen | State | Actions | Visual Indicators |
|------|--------|-------|---------|-------------------|
| 1 | Lab Results | Viewing list | Filter, search, select | Orange badges on unreviewed |
| 2 | Lab Detail | Result Received | Review, add notes, mark reviewed | ⚠️ Red flags on abnormal values |
| 3 | Lab Detail | Reviewed ⊗ | View only | Green badge, lock icon |
| 4 | Lab Results | Viewing list | Continue reviewing | Updated badge colors |

### Critical Rules

✅ **Allowed:**
- Adding notes to received results
- Marking results as reviewed

🔒 **One-Way Gates:**
- Result Received → Reviewed (permanent)

⛔ **Blocked:**
- Editing reviewed results
- Unmarking reviewed status

### Abnormal Result Handling

**Visual Flag:**
```
┌─────────────────────────────────────┐
│ Hemoglobin A1C                      │
│                                     │
│ ⚠️ 8.2%  (Normal: 4.0-5.6%)       │
│    └── Red background highlight     │
│                                     │
│ Status: Result Received             │
│ [Add Notes]  [Mark as Reviewed]     │
└─────────────────────────────────────┘
```

---

## 3️⃣ HEALTHCARE PROVIDER — REFERRAL WORKFLOW

**Goal:** Create and track specialist referral.

**Entry Point:** Patient Context → Referrals

### Flow Diagram

```
[Patient Context]
    ↓
[Referrals - List View]
    ↓
[Create Referral - Draft]
    ↓
[Fill Details] → Specialist, reason, urgency
    ↓
[Send Referral] → One-way transition
    ↓
[Referral - Sent State] ⊗
    ↓
[Track Status] → Waiting for specialist
    ↓
[Referral - Scheduled] → Appointment confirmed
    ↓
[Referral - Completed] → Patient seen
    ↓
[Add Follow-up Notes]
    ↓
[Close Referral] → Terminal state ⊗
```

### Screen-by-Screen Journey

| Step | Screen | State | Actions | Transitions |
|------|--------|-------|---------|-------------|
| 1 | Referrals List | Idle | Create new referral | → Create form |
| 2 | Referral Form | Draft | Edit all fields, save | → Sent (one-way) |
| 3 | Referral Detail | Sent | View, track | Wait for update |
| 4 | Referral Detail | Scheduled | View appointment | Wait for completion |
| 5 | Referral Detail | Completed | Add follow-up notes | → Close |
| 6 | Referral Detail | Closed ⊗ | View only | None (terminal) |

### Critical Rules

✅ **Allowed:**
- Editing draft referrals
- Adding notes to completed referrals before closing

🔒 **One-Way Gates:**
- Draft → Sent (show confirmation)
- Completed → Closed (terminal)

⛔ **Blocked:**
- Editing sent referrals
- Reopening closed referrals

---

## 4️⃣ HEALTHCARE PROVIDER — MEDICAL IMAGING WORKFLOW

**Goal:** Order imaging study and review results.

**Entry Point:** Patient Context → Medical Imaging

### Flow Diagram

```
[Medical Imaging - List]
    ↓
[Order Imaging - Draft]
    ↓
[Select Study Type] → X-ray, MRI, CT, etc.
    ↓
[Add Clinical Indication]
    ↓
[Submit Order]
    ↓
[Imaging - Ordered State]
    ↓
[Imaging - Pending] → Study scheduled
    ↓
[Imaging - Result Received] → Images uploaded
    ↓
[View Images + Report]
    ↓
[Mark as Reviewed] → One-way
    ↓
[Imaging - Reviewed State] ⊗
    ↓
[Archive After 6 Months]
    ↓
[Imaging - Archived] ⊗
```

### Critical Rules

✅ **Allowed:**
- Canceling ordered studies before pending
- Adding notes to any non-archived study

🔒 **One-Way Gates:**
- Result Received → Reviewed

⛔ **Blocked:**
- Editing reviewed imaging studies
- Deleting archived studies

---

## 5️⃣ HEALTHCARE PROVIDER — EDGE CASES

### Edge Case A: Pending Account

**Scenario:** New provider account awaiting admin approval.

```
[Sign In Page]
    ↓
[Submit Valid Credentials]
    ↓
[Pending Verification Screen] ⊗
    ↓
    No access to App Shell
    ↓
[Sign Out Only]
```

**Visual:**
```
┌─────────────────────────────────────────┐
│  Account Pending Verification            │
│                                          │
│  Your account has been created and is    │
│  awaiting administrator approval.        │
│                                          │
│  You will receive an email once your     │
│  account is activated.                   │
│                                          │
│               [Sign Out]                 │
└─────────────────────────────────────────┘
```

**Blocked:**
- Cannot access any clinical screens
- Cannot bypass verification

---

### Edge Case B: Interrupted Session

**Scenario:** Network connection lost during active session.

```
[Live Session - Active]
    ↓
[Connection Lost Event]
    ↓
[Session State: Paused]
    ↓
[Reconnection UI Shown]
    ↓
[Manual Resume] → Provider clicks "Resume"
    ↓
[Live Session - Active] → Resumed
```

**Visual:**
```
┌─────────────────────────────────────────┐
│  ⚠️  Session Paused                     │
│                                          │
│  Your connection was interrupted.        │
│  The session is paused, and all work     │
│  is saved.                               │
│                                          │
│  [Resume Session]  [End Session]         │
└─────────────────────────────────────────┘
```

**Critical Rules:**
- No data loss implied
- Session state preserved
- Draft notes still accessible
- Patient notified (visual placeholder)

---

### Edge Case C: Read-Only Encounter Review

**Scenario:** Provider reviewing finalized encounter from previous date.

```
[Patient Context]
    ↓
[Encounters History]
    ↓
[Select Past Encounter]
    ↓
[Encounter Detail - Finalized] ⊗
    ↓
    All fields locked
    Notes read-only
    Prescriptions view-only
    ↓
[Close]
```

**Visual Indicators:**
```
┌─────────────────────────────────────────┐
│  🔒 Finalized Encounter                 │
│  Date: January 10, 2026                  │
│                                          │
│  This encounter is finalized and cannot  │
│  be edited.                              │
│                                          │
│  [View Notes]  [View Prescriptions]      │
└─────────────────────────────────────────┘
```

---

### Edge Case D: Canceled Prescription Recovery

**Scenario:** Provider accidentally cancels prescription.

```
[Prescription - Issued]
    ↓
[Click Cancel]
    ↓
[Confirmation Modal]
    ↓
[Confirm Cancellation]
    ↓
[Prescription - Cancelled] ⊗
    ↓
    No undo possible
    Must create new prescription
    ↓
[Create New Prescription - Draft]
```

**Confirmation Modal:**
```
╔══════════════════════════════════════════╗
║  Cancel Prescription?                    ║
║                                          ║
║  Medication: Amoxicillin 500mg           ║
║  Patient: Sarah Johnson                  ║
║                                          ║
║  This will permanently cancel this       ║
║  prescription. This action cannot be     ║
║  undone.                                 ║
║                                          ║
║  You will need to create a new           ║
║  prescription if needed.                 ║
║                                          ║
║  [Go Back]            [Cancel Rx]        ║
╚══════════════════════════════════════════╝
```

**Blocked:**
- Cannot undo cancellation
- Cannot restore cancelled prescription

---

## 6️⃣ ADMIN — MANAGEMENT FLOW

**Goal:** Manage system settings and review audit logs.

**Entry Point:** Sign In → Admin Panel

### Flow Diagram

```
[Sign In]
    ↓
[App Shell + Overview (Read-Only)]
    ↓
[Admin Panel]
    ↓
[User Management] → View provider list
    ↓
[View Provider Status]
    ↓
[Audit Logs]
    ↓
[Filter/Search Logs]
    ↓
[View Log Details] → Read-only
    ↓
[Settings]
    ↓
[System Configuration]
    ↓
[Sign Out]
```

### Screen-by-Screen Journey

| Step | Screen | State | Actions | Restrictions |
|------|--------|-------|---------|--------------|
| 1 | Overview | Read-Only | View KPIs | No clinical actions |
| 2 | Admin Panel | Active | Navigate to management | Only admin items visible |
| 3 | User Management | Viewing | View users, filter | Cannot edit (future feature) |
| 4 | Audit Logs | Viewing | Search, filter, export | Read-only, no edits |
| 5 | Settings | Active | View settings | Edit future feature |

### Critical Rules

✅ **Allowed:**
- Viewing all system data
- Searching audit logs
- Navigating admin sections

⛔ **Blocked:**
- Accessing clinical workflows (Schedule, Sessions, Notes, etc.)
- Editing provider notes
- Modifying audit logs
- Deleting any records

### Sidebar Visibility (Admin)

**Visible:**
- Overview (read-only)
- Admin Panel
- Audit Logs
- Settings

**Hidden:**
- Schedule
- Patient Registry
- Live Sessions
- Clinical Notes
- Prescriptions
- Lab Results
- Medical Imaging
- Referrals

---

## 7️⃣ PARENT / CAREGIVER — LIMITED FLOW

**Goal:** View basic family information.

**Entry Point:** Sign In → Overview (Limited)

### Flow Diagram

```
[Sign In]
    ↓
[App Shell + Overview (Limited)]
    ↓
    Only 2 cards visible:
    - Upcoming Appointments
    - Family Members
    ↓
[Profile Settings]
    ↓
[Update Contact Info] → Future feature
    ↓
[Sign Out]
```

### Screen-by-Screen Journey

| Step | Screen | State | Actions | Visibility |
|------|--------|-------|---------|------------|
| 1 | Sign In | Authenticating | Submit credentials | Standard |
| 2 | Overview | Limited | View 2 cards only | Minimal sidebar |
| 3 | Profile | Viewing | View info | Edit future |
| 4 | Sign Out | - | Logout | End session |

### Sidebar Visibility (Parent)

**Visible:**
- Overview (limited)

**Hidden:**
- All clinical screens
- All admin screens
- Schedule, Patients, Sessions, etc.

### Critical Rules

✅ **Allowed:**
- Viewing limited overview
- Accessing profile

⛔ **Blocked:**
- Accessing any clinical data
- Viewing provider information
- Accessing admin panels
- Viewing other patients

---

## 8️⃣ BLOCKED & INVALID JOURNEYS

### Blocked Journey 1: Parent → Clinical Notes

**Attempt:** Parent tries to access clinical notes URL directly.

```
[Parent Signed In]
    ↓
[Navigate to /notes]
    ↓
[Restricted State Screen] ⊗
    ↓
    "This section is available to authorized
     clinical staff only."
    ↓
[Sidebar Still Shows Overview Only]
```

**Visual:**
```
┌─────────────────────────────────────────┐
│                                          │
│         🔒                              │
│                                          │
│  This section is available to            │
│  authorized clinical staff only.         │
│                                          │
└─────────────────────────────────────────┘
```

**Blocked:**
- No way to proceed
- No error language
- Calm, professional message

---

### Blocked Journey 2: Provider → Admin Panel

**Attempt:** Provider tries to access admin panel.

```
[Provider Signed In]
    ↓
[Navigate to /admin]
    ↓
[Restricted State Screen] ⊗
    ↓
    Same calm message
    ↓
[Return to Overview]
```

**Sidebar Behavior:**
- Admin Panel not visible in provider sidebar
- Direct URL navigation shows restricted state

---

### Blocked Journey 3: Editing Finalized Notes

**Attempt:** Provider tries to edit finalized note.

```
[Clinical Notes - List]
    ↓
[Select Finalized Note]
    ↓
[Note Detail - Finalized State] ⊗
    ↓
    All fields disabled
    No edit button
    Lock icon visible
    ↓
[Read-Only View Only]
```

**Visual:**
```
┌─────────────────────────────────────────┐
│  🔒 Clinical Note - Finalized           │
│  Date: January 10, 2026                  │
│                                          │
│  This note is finalized and cannot be    │
│  edited.                                 │
│                                          │
│  Subjective: Patient reports...          │
│  Objective: Vital signs...               │
│  Assessment: Diagnosis...                │
│  Plan: Treatment plan...                 │
│                                          │
│              [Close]                     │
└─────────────────────────────────────────┘
```

**Blocked:**
- No edit button
- No save button
- Fields rendered as plain text, not inputs

---

### Blocked Journey 4: Modifying Archived Records

**Attempt:** Provider tries to modify archived session.

```
[Sessions - List]
    ↓
[Filter: Archived]
    ↓
[Select Archived Session]
    ↓
[Session Detail - Archived State] ⊗
    ↓
    Gray badge
    Lock icon
    All fields frozen
    ↓
[View-Only Mode]
```

**Visual:**
```
┌─────────────────────────────────────────┐
│  🔒 Session Archived                    │
│  Date: June 15, 2025                     │
│                                          │
│  This session was archived and is        │
│  view-only.                              │
│                                          │
│  Duration: 45 minutes                    │
│  Status: Completed                       │
│                                          │
│  [View Notes]  [Close]                   │
└─────────────────────────────────────────┘
```

---

## 9️⃣ JOURNEY ERROR HANDLING

### Connection Errors

**Scenario:** Network fails during critical action.

```
[Submit Action]
    ↓
[Network Error]
    ↓
[Show Error Toast]
    ↓
    "Connection lost. Your work is saved
     as a draft. Please try again."
    ↓
[Retry Button Available]
```

**Visual (Toast Notification):**
```
┌─────────────────────────────────────────┐
│  ⚠️  Connection Error                   │
│                                          │
│  Your work is saved as a draft.          │
│  Please check your connection and retry. │
│                                          │
│  [Retry]  [Dismiss]                      │
└─────────────────────────────────────────┘
```

**Critical Rules:**
- Never lose draft data
- Always show retry option
- No silent failures

---

### Validation Errors

**Scenario:** User submits incomplete form.

```
[Fill Form]
    ↓
[Click Submit]
    ↓
[Validation Fails]
    ↓
[Show Inline Errors]
    ↓
    Red text under invalid fields
    Form stays on screen
    No data lost
    ↓
[Fix Errors and Resubmit]
```

**Visual (Inline Error):**
```
┌─────────────────────────────────────────┐
│  Patient Name                            │
│  [________________]                      │
│  ⚠️ Patient name is required            │
│                                          │
│  Medication                              │
│  [Amoxicillin___]                        │
│  ✓ Valid                                 │
└─────────────────────────────────────────┘
```

---

## 🔟 JOURNEY COMPLETION PATTERNS

### Successful Completion

**Pattern:** Action → Success State → Return to List

```
[Create/Edit Entity]
    ↓
[Submit]
    ↓
[Success Toast]
    ↓
    "Clinical note finalized successfully."
    ↓
[Redirect to List View]
    ↓
[Updated Badge/State Visible]
```

**Success Toast:**
```
┌─────────────────────────────────────────┐
│  ✓ Clinical Note Finalized              │
│                                          │
│  The note has been finalized and saved.  │
└─────────────────────────────────────────┘
```

---

### Cancellation Pattern

**Pattern:** Action → Cancel → Confirm → Return

```
[Editing Entity]
    ↓
[Click Cancel]
    ↓
[Confirmation Modal] → If unsaved changes
    ↓
    "You have unsaved changes. Discard them?"
    ↓
[Confirm Discard]
    ↓
[Return to Previous Screen]
```

**Confirmation Modal:**
```
╔══════════════════════════════════════════╗
║  Discard Changes?                        ║
║                                          ║
║  You have unsaved changes. If you leave  ║
║  now, they will be lost.                 ║
║                                          ║
║  [Keep Editing]      [Discard Changes]   ║
╚══════════════════════════════════════════╝
```

---

## JOURNEY SAFETY PRINCIPLES

### 1. No Surprise Redirects

❌ **Bad:**
```
User clicks "View Details"
  → Suddenly redirected to different section
```

✅ **Good:**
```
User clicks "View Details"
  → Detail modal opens in same context
  → Clear "Close" button to return
```

### 2. Reversible Actions Until Point of No Return

❌ **Bad:**
```
User clicks "Delete"
  → Immediately deleted, no confirmation
```

✅ **Good:**
```
User clicks "Delete"
  → Confirmation modal shown
  → User confirms
  → Action executed
```

### 3. Visible State at All Times

❌ **Bad:**
```
Entity state changes in background
User doesn't notice
```

✅ **Good:**
```
Entity state changes
  → Badge color updates
  → Success toast shown
  → User sees confirmation
```

### 4. Calm Error Messages

❌ **Bad:**
```
"ERROR: OPERATION FAILED. TRY AGAIN."
```

✅ **Good:**
```
"Connection lost. Your work is saved. Please try again."
```

---

## JOURNEY TESTING CHECKLIST

For each journey, verify:

- [ ] Entry point is clear
- [ ] All intermediate screens exist
- [ ] Exit state is defined
- [ ] One-way gates show confirmation
- [ ] Blocked paths show calm restricted message
- [ ] No surprise redirects
- [ ] State badges update correctly
- [ ] Error handling is graceful
- [ ] No data loss on navigation
- [ ] Sidebar reflects current role

---

## JOURNEY DOCUMENTATION TEMPLATE

For new journeys, use this template:

```
### Journey Name

**Goal:** [One sentence description]

**Entry Point:** [Starting screen]

**Flow Diagram:**
[Screen A]
    ↓
[Screen B]
    ↓
[Screen C]

**Rules:**
✅ Allowed: [List]
🔒 One-Way: [List]
⛔ Blocked: [List]

**Visual Indicators:**
[Screenshots or ASCII diagrams]
```

---

## ANTI-PATTERNS (FORBIDDEN)

### ❌ Magic Navigation

```
// BAD: Silent redirect based on state
if (entity.state === 'finalized') {
  router.push('/different-page')
}
```

```
// GOOD: Show locked UI in current view
{entity.state === 'finalized' && (
  <ReadOnlyBanner message="This note is finalized" />
)}
```

---

### ❌ Hidden Transitions

```
// BAD: State changes without user seeing
useEffect(() => {
  if (timer > 60) updateState('expired')
}, [timer])
```

```
// GOOD: Explicit user action required
<Button onClick={() => handleExpire()}>
  Mark as Expired
</Button>
```

---

### ❌ Bypassing State Machines

```
// BAD: Skip states
setState('completed') // From draft directly
```

```
// GOOD: Follow state machine
setState('finalized') // Draft → Finalized
// Later: setState('archived') // Finalized → Archived
```

---

## PHILOSOPHY

> "A good journey makes the safe path obvious and the dangerous path impossible."

- Every screen transition must be intentional
- Users should never wonder "where am I?" or "how did I get here?"
- Blocked paths show calm messages, not errors
- One-way gates protect data integrity
- Terminal states are visually obvious

**This is a clinical system. Every journey must be safe, predictable, and boring.**

---

**Last Updated:** January 14, 2026  
**Status:** Frontend Journey Definitions Complete  
**Integration:** Maps to STATE_MACHINES.md and ROLE_BASED_UI.md  
**Backend:** Will enforce these flows when implemented
