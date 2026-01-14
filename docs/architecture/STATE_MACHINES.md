# State Machines — Dr Amal Clinical OS v2.0

**Purpose:** Define visual UX state machines for all core screens before backend exists.

**Scope:** Frontend-only. Backend will enforce these rules later.

**Philosophy:** States prevent bugs. UI must never suggest illegal transitions. Clarity over flexibility.

---

## 1️⃣ AUTH & APP ENTRY STATE MACHINE

### States

| State | Description | Visual Indicator |
|-------|-------------|------------------|
| `Signed Out` | User not authenticated | Login screen visible |
| `Signing In` | Authentication in progress | Loading spinner, disabled inputs |
| `Signed In` | Active authenticated session | Dashboard visible |
| `Pending Verification` | Account created, awaiting approval | Info banner with message |
| `Locked / Suspended` | Account disabled | Error banner, logout forced |

### Transitions

```
Signed Out → Signing In
  Trigger: User submits credentials
  UI: Show loading state, disable form

Signing In → Signed In
  Trigger: Auth success
  UI: Redirect to /overview

Signing In → Pending Verification
  Trigger: New account, needs approval
  UI: Show verification message

Signed In → Locked
  Trigger: Admin action (visual only)
  UI: Show suspension notice, force logout
```

### Terminal States
- `Locked / Suspended` - Cannot self-recover

### Visual Design

| State | Background | Text | Actions |
|-------|-----------|------|---------|
| Signed Out | White | Default | Sign In, Sign Up enabled |
| Signing In | White | Muted | All inputs disabled |
| Signed In | Clinical BG | Default | Full app access |
| Pending | Blue banner | Info blue | Limited access message |
| Locked | Red banner | Error red | Contact support only |

---

## 2️⃣ LIVE SESSIONS STATE MACHINE

### States

| State | Description | Visual Indicator |
|-------|-------------|------------------|
| `Idle` | No session exists | Empty state UI |
| `Scheduled` | Session booked for future | Calendar icon, blue badge |
| `Waiting` | Provider ready, patient not joined | Yellow badge, "Waiting for patient" |
| `Active` | Session in progress | Green badge, timer running |
| `Completed` | Session ended, notes pending | Gray badge, read-only |
| `Archived` | Session closed permanently | Gray icon, view-only |

### Transitions

```
Idle → Scheduled
  Trigger: Create session appointment
  UI: Show scheduled badge

Scheduled → Waiting
  Trigger: Provider joins at scheduled time
  UI: Yellow status, show waiting message

Waiting → Active
  Trigger: Patient joins session
  UI: Green status, enable session controls

Active → Completed
  Trigger: Session ends (one-way)
  UI: Disable all controls except notes

Completed → Archived
  Trigger: Notes finalized + 30 days elapsed
  UI: Lock all fields, view-only
```

### Immutability Rules

✅ **Editable:**
- `Idle`, `Scheduled`, `Waiting` - Can be rescheduled/cancelled

🔒 **Read-Only:**
- `Active` - Cannot edit details during session
- `Completed` - Cannot edit session metadata
- `Archived` - Locked forever

### Terminal States
- `Archived` - No further transitions allowed

### Visual Design

| State | Badge Color | Icon | Actions Available |
|-------|------------|------|-------------------|
| Idle | - | - | "Start Session" button |
| Scheduled | Blue (#2563EB) | Calendar | Edit, Cancel, Join |
| Waiting | Yellow (#F59E0B) | Clock | Cancel, Notes |
| Active | Green (#10B981) | Video | End Session, Notes |
| Completed | Gray (#6B7280) | Check | View Notes, Archive |
| Archived | Gray (#9CA3AF) | Archive | View Only |

---

## 3️⃣ CLINICAL NOTES (SOAP) STATE MACHINE

### States

| State | Description | Visual Indicator |
|-------|-------------|------------------|
| `Draft` | Note being written | Orange badge, "Draft" label |
| `AI-Assisted Draft` | AI helped generate note | Purple badge, "AI-Assisted" flag |
| `Finalized` | Note signed, immutable | Green badge, "Finalized" label |
| `Archived` | Old note, view-only | Gray badge, lock icon |

### Transitions

```
Draft → AI-Assisted Draft
  Trigger: AI assistance used (flag only)
  UI: Show purple AI badge

Draft → Finalized
  Trigger: Provider clicks "Finalize" (one-way)
  UI: Show confirmation modal, lock all fields

AI-Assisted Draft → Finalized
  Trigger: Provider reviews and signs (one-way)
  UI: Same as Draft → Finalized

Finalized → Archived
  Trigger: Note age > 2 years
  UI: Gray out, show archive date
```

### Immutability Rules

✅ **Editable:**
- `Draft` - Full edit access
- `AI-Assisted Draft` - Full edit access + AI flag visible

🔒 **Immutable:**
- `Finalized` - Cannot edit, cannot delete
- `Archived` - View-only, historical record

### One-Way Gate
**Draft/AI-Assisted → Finalized** is permanent. Show modal:
```
"Once finalized, this note cannot be edited. Continue?"
[Cancel] [Finalize Note]
```

### Terminal States
- `Finalized` - No further edits ever
- `Archived` - View-only forever

### Visual Design

| State | Badge Color | Label | Edit Icon | Save Button |
|-------|------------|-------|-----------|-------------|
| Draft | Orange (#F59E0B) | "Draft" | Visible | Enabled |
| AI-Assisted | Purple (#7C3AED) | "AI-Assisted Draft" | Visible | Enabled |
| Finalized | Green (#10B981) | "Finalized" | Hidden | Hidden |
| Archived | Gray (#6B7280) | "Archived" | Hidden | Hidden |

---

## 4️⃣ PRESCRIPTIONS STATE MACHINE

### States

| State | Description | Visual Indicator |
|-------|-------------|------------------|
| `Draft` | Being composed | Orange badge, editable |
| `Issued` | Sent to pharmacy | Blue badge, read-only |
| `Active` | Patient filling prescription | Green badge, read-only |
| `Completed` | Fully dispensed | Gray badge, terminal |
| `Cancelled` | Void, not valid | Red badge, terminal |

### Transitions

```
Draft → Issued
  Trigger: Provider signs prescription (one-way)
  UI: Lock all fields, show "Issued" badge

Issued → Active
  Trigger: Pharmacy confirms receipt
  UI: Show green "Active" status

Active → Completed
  Trigger: All refills dispensed (terminal)
  UI: Gray badge, mark as historical

Draft → Cancelled
  Trigger: Provider cancels before issuing
  UI: Red badge, strikethrough text

Issued → Cancelled
  Trigger: Provider cancels after issuing
  UI: Red badge, show cancellation reason field
```

### Immutability Rules

✅ **Editable:**
- `Draft` - Can edit all fields

🔒 **Read-Only:**
- `Issued` - Cannot edit, only cancel
- `Active` - Cannot edit, only cancel
- `Completed` - View-only
- `Cancelled` - View-only

### Terminal States
- `Completed` - Natural end state
- `Cancelled` - Error/void state

### Visual Design

| State | Badge Color | Icon | Actions |
|-------|------------|------|---------|
| Draft | Orange (#F59E0B) | Edit | Edit, Issue, Delete |
| Issued | Blue (#2563EB) | Paper | Cancel, View |
| Active | Green (#10B981) | Pills | Cancel, View |
| Completed | Gray (#6B7280) | Check | View Only |
| Cancelled | Red (#EF4444) | X | View Only |

---

## 5️⃣ LAB RESULTS STATE MACHINE

### States

| State | Description | Visual Indicator |
|-------|-------------|------------------|
| `Ordered` | Lab test ordered | Blue badge, pending icon |
| `Pending` | Sample collected, awaiting results | Yellow badge, hourglass |
| `Result Received` | Results back, needs review | Orange badge, alert dot |
| `Reviewed` | Provider reviewed results | Green badge, check icon |
| `Archived` | Old result, reference only | Gray badge, archive icon |

### Abnormal Flag (Overlay State)
- `Normal` - Standard text color
- `Abnormal` - Red warning icon + bold text

### Transitions

```
Ordered → Pending
  Trigger: Sample collected at lab
  UI: Change badge to yellow

Pending → Result Received
  Trigger: Lab uploads results
  UI: Orange badge + notification

Result Received → Reviewed
  Trigger: Provider marks as reviewed (one-way)
  UI: Green badge, lock result fields

Reviewed → Archived
  Trigger: Result age > 1 year
  UI: Gray badge, historical view
```

### Immutability Rules

✅ **Editable:**
- `Ordered` - Can cancel order
- `Pending` - Can add notes

🔒 **Read-Only:**
- `Result Received` - Cannot edit result values
- `Reviewed` - Locked, immutable
- `Archived` - View-only

### Terminal States
- `Archived` - Historical record only

### Visual Design

| State | Badge Color | Alert | Actions |
|-------|------------|-------|---------|
| Ordered | Blue (#2563EB) | - | Cancel Order |
| Pending | Yellow (#F59E0B) | - | Add Notes |
| Result Received | Orange (#F59E0B) | Red dot | Review, Add Notes |
| Reviewed | Green (#10B981) | - | View Only |
| Archived | Gray (#6B7280) | - | View Only |

**Abnormal Results:**
- Show red warning icon ⚠️ next to value
- Bold text for abnormal values
- Highlight in light red background (`#FEF2F2`)

---

## 6️⃣ REFERRALS STATE MACHINE

### States

| State | Description | Visual Indicator |
|-------|-------------|------------------|
| `Created` | Referral drafted | Orange badge, editable |
| `Sent` | Sent to specialist | Blue badge, read-only |
| `Scheduled` | Appointment booked | Purple badge, date shown |
| `Completed` | Patient seen by specialist | Green badge, read-only |
| `Closed` | Referral archived | Gray badge, terminal |

### Transitions

```
Created → Sent
  Trigger: Provider sends referral (one-way)
  UI: Lock referral details, show "Sent" badge

Sent → Scheduled
  Trigger: Specialist confirms appointment
  UI: Show appointment date, purple badge

Scheduled → Completed
  Trigger: Appointment occurs (one-way)
  UI: Show completion date, green badge

Completed → Closed
  Trigger: Follow-up notes added (terminal)
  UI: Gray badge, lock all fields

Created → Closed
  Trigger: Referral cancelled before sending
  UI: Show cancellation reason, gray badge
```

### Immutability Rules

✅ **Editable:**
- `Created` - Can edit all fields

🔒 **Read-Only:**
- `Sent` - Cannot edit, only track
- `Scheduled` - Cannot edit referral, only view appointment
- `Completed` - Cannot edit, can add follow-up notes
- `Closed` - View-only

### Terminal States
- `Closed` - Cannot be reopened

### Visual Design

| State | Badge Color | Icon | Actions |
|-------|------------|------|---------|
| Created | Orange (#F59E0B) | Edit | Edit, Send, Cancel |
| Sent | Blue (#2563EB) | Send | Track, View |
| Scheduled | Purple (#7C3AED) | Calendar | View, Reschedule |
| Completed | Green (#10B981) | Check | Add Notes, Close |
| Closed | Gray (#6B7280) | Archive | View Only |

---

## 7️⃣ AUDIT LOGS STATE MACHINE

### States

| State | Description | Visual Indicator |
|-------|-------------|------------------|
| `Recorded` | Event logged in real-time | Blue dot, recent timestamp |
| `Indexed` | Event searchable/queryable | Default appearance |
| `Archived` | Old log, compressed storage | Gray text, view-only |

### Transitions

```
Recorded → Indexed
  Trigger: Log processing complete (automatic)
  UI: No visual change, searchable

Indexed → Archived
  Trigger: Log age > 7 years (automatic)
  UI: Gray text, moved to archive view
```

### Immutability Rules

🔒 **Append-Only:**
- ALL audit logs are immutable forever
- No edits allowed
- No deletes allowed
- No user actions possible

### Terminal States
- `Archived` - Permanent historical record

### Visual Design

| State | Text Color | Background | Actions |
|-------|-----------|------------|---------|
| Recorded | Default (#111827) | White | None |
| Indexed | Default (#111827) | White | Search, Filter |
| Archived | Gray (#6B7280) | Light gray | View Only |

**Log Entry Display:**
```
[Timestamp] [User] [Action] [Resource] [IP Address]
```

**No Buttons, No Actions** - Read-only table only.

---

## GLOBAL STATE MACHINE PRINCIPLES

### 1. Explicit Over Implicit
Every state must be:
- Named clearly
- Visually distinct
- Documented here

### 2. One-Way Gates
These transitions are irreversible:
- Draft → Finalized (notes)
- Issued → Active (prescriptions)
- Active → Completed (sessions)
- Any → Archived (all entities)

### 3. Terminal States
Once reached, no further transitions:
- `Archived` (all entities)
- `Closed` (referrals)
- `Completed` (prescriptions)
- `Locked` (accounts)

### 4. Visual Clarity

**Badge Colors (Consistent Across All Entities):**
- 🟠 Orange (#F59E0B) - Draft, In Progress, Needs Action
- 🔵 Blue (#2563EB) - Scheduled, Sent, Ordered
- 🟡 Yellow (#F59E0B) - Waiting, Pending
- 🟢 Green (#10B981) - Active, Completed, Finalized
- 🔴 Red (#EF4444) - Cancelled, Error, Abnormal
- ⚫ Gray (#6B7280) - Archived, Closed, Read-Only
- 🟣 Purple (#7C3AED) - AI-Assisted, Special Flag

### 5. Immutability Indicators

**Editable UI:**
- Edit icon visible
- Save/Cancel buttons enabled
- Input fields active
- White background

**Read-Only UI:**
- Edit icon hidden
- No save button
- Input fields disabled or plain text
- Light gray background (#F9FAFB)

**Locked UI (Terminal States):**
- Lock icon 🔒 next to title
- All fields as plain text
- Gray badge
- Archive icon visible

### 6. Confirmation Modals

**One-Way Transitions Must Show Warning:**

```
╔════════════════════════════════════════╗
║  Finalize Clinical Note?               ║
║                                        ║
║  Once finalized, this note cannot be   ║
║  edited or deleted.                    ║
║                                        ║
║  [Cancel]         [Finalize Note]     ║
╚════════════════════════════════════════╝
```

Use for:
- Draft → Finalized (notes)
- Draft → Issued (prescriptions)
- Active → Completed (sessions)

### 7. State Transition Log

Every state change must be logged:
```
{
  entity: "clinical_note_123",
  from: "draft",
  to: "finalized",
  user: "dr.williams@example.com",
  timestamp: "2026-01-14T10:30:00Z",
  reason: "Session completed"
}
```

---

## IMPLEMENTATION CHECKLIST

### For Each State Machine:

- [ ] Define all possible states
- [ ] Map allowed transitions
- [ ] Identify terminal states
- [ ] Design badge colors
- [ ] Design icons for each state
- [ ] Add confirmation modals for one-way transitions
- [ ] Disable UI controls in read-only states
- [ ] Show lock icon in terminal states
- [ ] Test all valid transitions
- [ ] Verify illegal transitions are blocked

### Visual Components Needed:

- [ ] `<StateBadge />` - Colored badge with state label
- [ ] `<StateIcon />` - Icon for each state
- [ ] `<ConfirmationModal />` - One-way transition warnings
- [ ] `<ReadOnlyBanner />` - "This record is finalized" message
- [ ] `<LockedField />` - Disabled input with lock icon
- [ ] `<AbnormalFlag />` - Red warning for lab results

---

## ANTI-PATTERNS (FORBIDDEN)

❌ **Hidden States**
```
// BAD: Implicit state
const isProcessing = loading && !error && !data
```
```
// GOOD: Explicit state
type State = 'idle' | 'loading' | 'success' | 'error'
```

❌ **Magic Transitions**
```
// BAD: State changes without user action
useEffect(() => {
  if (timer > 60) setState('expired')
}, [timer])
```
```
// GOOD: Explicit user action required
<Button onClick={() => setState('expired')}>
  Mark as Expired
</Button>
```

❌ **Reversible One-Way Gates**
```
// BAD: "Unfinalize" button
<Button onClick={() => unfinalizeNote()}>
  Unfinalize
</Button>
```
```
// GOOD: Finalized is permanent
{note.state === 'finalized' && (
  <ReadOnlyBanner message="This note is finalized and cannot be edited" />
)}
```

---

## TESTING REQUIREMENTS

### State Machine Tests

For each entity, verify:

1. **Valid Transitions:**
   - ✅ Draft → Finalized succeeds
   - ✅ Issued → Active succeeds

2. **Invalid Transitions:**
   - ❌ Finalized → Draft fails
   - ❌ Completed → Active fails

3. **Terminal States:**
   - ✅ Archived entities cannot transition
   - ✅ Lock icon visible

4. **UI Controls:**
   - ✅ Edit button hidden in read-only states
   - ✅ Save button disabled in terminal states

5. **Visual Indicators:**
   - ✅ Correct badge color for each state
   - ✅ Confirmation modal shown for one-way transitions

---

## STATE MACHINE DIAGRAM NOTATION

```
[State A] → [State B]
  ↑          ↓
  │          │
  └──────────┘ (one-way only)

[Terminal State] ⊗ (no exits)
```

### Example: Clinical Notes

```
          ┌─────────────┐
          │    Draft    │
          └──────┬──────┘
                 │ (one-way)
                 ↓
     ┌───────────────────────┐
     │  AI-Assisted Draft    │
     └───────────┬───────────┘
                 │ (one-way)
                 ↓
          ┌──────────────┐
          │  Finalized   │
          └──────┬───────┘
                 │ (auto)
                 ↓
          ┌──────────────┐
          │  Archived ⊗  │
          └──────────────┘
```

---

## PHILOSOPHY

> "The best UI is the one that never lies about what's possible."

- States prevent expensive bugs
- Transitions must be obvious
- Terminal states protect data integrity
- Visual truth = backend truth (eventually)
- If a transition feels unsafe, it probably is

**This is a clinical system. Choose safety over flexibility.**

---

**Last Updated:** January 14, 2026  
**Status:** Frontend State Definitions Complete  
**Backend Integration:** Pending (will enforce these rules)
