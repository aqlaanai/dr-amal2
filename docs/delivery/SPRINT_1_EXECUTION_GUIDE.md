# SPRINT 1 EXECUTION GUIDE — Frontend Foundation Only

**Document Status:** 🟢 ACTIVE  
**Last Updated:** January 14, 2026  
**Sprint:** Sprint 1 (Frontend Foundation)  
**Duration:** 2 weeks  
**Owner:** Frontend Lead / Execution Reviewer

---

## PURPOSE

This document defines **strict enforcement rules** for Sprint 1 implementation of Dr Amal Clinical OS v2.0.

**Sprint 1 Scope:** Frontend foundation ONLY.

**Zero tolerance for:**
- Backend integration
- Business logic
- API clients
- Scope creep

---

## 🎯 SPRINT 1 SCOPE (ABSOLUTE)

### ✅ ALLOWED

- **App Shell:** Layout, navigation, routing
- **UI Components:** Buttons, cards, tables, forms (visual only)
- **Static Pages:** Empty states, placeholders, mockups
- **Routing:** Next.js routing, navigation between pages
- **Styling:** Tailwind CSS, design system, clinical theme
- **TypeScript Types:** UI props, component interfaces
- **Client-side State:** Loading states, UI visibility toggles
- **Static Data:** Hardcoded examples for visual layout (clearly marked as mock)

### ❌ FORBIDDEN

- **API Calls:** No `fetch()`, no `axios`, no API clients
- **Backend Logic:** No authorization, no validation, no state transitions
- **Mock Services:** No fake backend, no simulated responses
- **AI Integration:** No AI prompts, no AI components
- **Business Logic:** No clinical calculations, no state machines
- **Data Mutations:** No forms that submit, no editable clinical content
- **Database Assumptions:** No code that assumes backend structure

---

## 🚦 ENFORCEMENT RULES

### 1️⃣ STRUCTURAL DISCIPLINE

#### App Shell Requirements

- [ ] **App Shell exists** (`app/layout.tsx`)
  - Wraps all pages
  - Contains Sidebar
  - Contains top navigation (if applicable)
  - NO business logic in layout

- [ ] **Sidebar is persistent and static**
  - Shows on every page (except auth pages)
  - Navigation items hardcoded (no dynamic role-based hiding yet)
  - Uses Next.js Link for navigation
  - NO API calls to determine visibility

- [ ] **Pages live in correct locations**
  - All routes in `app/` directory (Next.js App Router)
  - One page = one file (no mixing concerns)
  - Page files are thin (delegate to components)

- [ ] **Components are reusable and UI-only**
  - Located in `frontend/components/`
  - Props-driven (no internal business logic)
  - Presentational only (no data fetching)
  - NO components that assume backend data structure

#### File Structure Compliance

```
frontend/
├── app/
│   ├── layout.tsx              ✅ App Shell
│   ├── page.tsx                ✅ Dashboard (empty state)
│   ├── patients/
│   │   └── page.tsx            ✅ Patients list (empty state)
│   ├── sessions/
│   │   └── page.tsx            ✅ Sessions list (empty state)
│   ├── clinical-notes/
│   │   └── page.tsx            ✅ Clinical notes (empty state)
│   └── ...
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         ✅ Static sidebar
│   │   ├── Header.tsx          ✅ Top navigation
│   │   └── AppShell.tsx        ✅ Layout wrapper
│   ├── ui/
│   │   ├── Button.tsx          ✅ Reusable button
│   │   ├── Card.tsx            ✅ Reusable card
│   │   └── ...
│   └── states/
│       ├── EmptyState.tsx      ✅ Empty state display
│       ├── LoadingState.tsx    ✅ Loading spinner
│       └── RestrictedState.tsx ✅ Access denied message
├── lib/                        ❌ Should be nearly empty
│   └── utils.ts                ✅ Only UI helpers (max 3 files)
└── types/
    └── ui.ts                   ✅ UI-only types
```

**❌ REJECT IF:**
- `lib/api/` folder exists
- `services/` folder exists
- `hooks/` folder has data fetching hooks
- Any file imports `fetch` or `axios`

---

### 2️⃣ UI-ONLY RULE (ABSOLUTE)

#### What "UI-Only" Means

**✅ ALLOWED:**
```typescript
// ✅ Static navigation
<Link href="/patients">Patients</Link>

// ✅ UI state toggle
const [isOpen, setIsOpen] = useState(false)

// ✅ Hardcoded mock data for LAYOUT ONLY
const mockPatient = {
  name: "John Doe (MOCK DATA)",
  id: "mock-123"
}

// ✅ Empty state
{patients.length === 0 && <EmptyState message="No patients yet" />}

// ✅ Loading state
{isLoading && <LoadingSpinner />}
```

**❌ FORBIDDEN:**
```typescript
// ❌ API call
const response = await fetch('/api/patients')

// ❌ Mock service
const patientService = {
  getAll: () => mockPatients
}

// ❌ Backend assumption
const canEdit = user.role === 'provider' // Backend will determine this

// ❌ Form submission
<form onSubmit={handleSubmit}>  // No submit handlers yet

// ❌ Data mutation
const saveNote = async () => { /* ... */ }  // No save logic

// ❌ State transition logic
if (note.status === 'draft') { /* ... */ }  // Backend will enforce this
```

#### Mock Data Rules (Use Sparingly)

**When mock data is ALLOWED:**
- Visual layout only (e.g., showing table structure)
- Clearly labeled as `MOCK DATA`
- Hardcoded in component (not in separate file)
- Small (< 10 lines)

**Example:**
```typescript
// ✅ ACCEPTABLE (for layout visualization only)
const MOCK_PATIENTS_FOR_LAYOUT = [
  { id: "1", name: "MOCK: John Doe", age: 45 },
  { id: "2", name: "MOCK: Jane Smith", age: 32 }
]

// ❌ REJECT (this is a mock service)
// lib/mockData/patients.ts
export const mockPatients = [ /* 100+ lines */ ]
export const getMockPatients = () => mockPatients
```

**❌ REJECT IF:**
- Mock data files in `lib/` or `services/`
- Mock data pretends to be "real" (not labeled as MOCK)
- Mock data used for business logic
- Mock data fetched via fake API

---

### 3️⃣ DESIGN CONSISTENCY (CLINICAL THEME)

#### Visual Requirements

- [ ] **Colors match clinical theme**
  - Primary: Blue (professional, trustworthy)
  - Success: Green (safe actions)
  - Warning: Yellow (caution)
  - Danger: Red (destructive actions)
  - Neutral: Gray (backgrounds, borders)
  - NO bright, playful colors
  - NO gradients (unless approved in design system)

- [ ] **Spacing is consistent**
  - Use Tailwind spacing scale (4px increments)
  - Cards: `p-4` or `p-6`
  - Sections: `space-y-4` or `space-y-6`
  - NO arbitrary values like `mt-[13px]`

- [ ] **Typography is professional**
  - Headings: `text-2xl font-bold` for h1, `text-xl font-semibold` for h2
  - Body: `text-base` (16px)
  - Small text: `text-sm` (14px)
  - NO decorative fonts
  - NO all-caps headings (unless approved)

- [ ] **Card styles are clinical**
  - Clean borders: `border border-gray-200`
  - Subtle shadows: `shadow-sm`
  - White backgrounds: `bg-white`
  - Rounded corners: `rounded-lg`
  - NO heavy shadows, NO animations (unless subtle)

- [ ] **Buttons are clear and accessible**
  - Primary: Solid blue (`bg-blue-600 hover:bg-blue-700`)
  - Secondary: Outlined (`border border-gray-300`)
  - Danger: Solid red (`bg-red-600 hover:bg-red-700`)
  - Disabled: Faded (`opacity-50 cursor-not-allowed`)
  - NO icon-only buttons without labels

#### Design Review Criteria

**✅ ACCEPT IF:**
- Looks professional, clinical, trustworthy
- Matches medical software aesthetic (think Epic, Cerner)
- High contrast, accessible, readable

**❌ REJECT IF:**
- Looks playful, colorful, consumer-app-like
- Looks like a social media app or game
- Poor contrast, hard to read
- Overly decorative or "creative"

**Remember:** This is clinical software, not a consumer app.

---

### 4️⃣ PAGE COMPLETENESS

#### Every Sidebar Item Must Have a Real Page

**Required pages (from ROLE_BASED_UI.md):**

| Route | Page Title | Minimum Content |
|-------|------------|-----------------|
| `/` | Dashboard | Welcome message + empty state |
| `/patients` | Patients | Empty state: "No patients yet" |
| `/sessions` | Sessions | Empty state: "No active sessions" |
| `/clinical-notes` | Clinical Notes | Empty state: "No clinical notes yet" |
| `/prescriptions` | Prescriptions | Empty state: "No prescriptions yet" |
| `/labs` | Lab Results | Empty state: "No lab results yet" |
| `/referrals` | Referrals | Empty state: "No referrals yet" |
| `/admin/tenants` | Tenants | Empty state: "No tenants configured" |
| `/admin/users` | Users | Empty state: "No users yet" |
| `/admin/audit` | Audit Logs | Empty state: "No audit logs yet" |

#### Page Structure Requirements

Every page MUST have:

1. **Page Title (h1)**
   ```tsx
   <h1 className="text-2xl font-bold">Patients</h1>
   ```

2. **Subtitle (optional but recommended)**
   ```tsx
   <p className="text-gray-600">Manage patient records</p>
   ```

3. **Content Area**
   - Empty state if no data
   - OR placeholder table/cards for layout visualization
   - OR "Coming soon" message

4. **NO Dead Links**
   - Every `<Link>` must go to a real route
   - Every route must render a page (no 404s)

**❌ REJECT IF:**
- Sidebar link navigates to 404
- Page has no title
- Page is completely blank (not even empty state)
- "Coming soon" without any structure

---

### 5️⃣ ABSOLUTE FORBIDDEN ITEMS

#### ❌ API Clients

**FORBIDDEN:**
```typescript
// ❌ API client file
// lib/api/patients.ts
export const patientsApi = {
  getAll: () => fetch('/api/patients'),
  getOne: (id) => fetch(`/api/patients/${id}`)
}

// ❌ API wrapper
// lib/fetchWrapper.ts
export async function apiRequest(url, options) { /* ... */ }

// ❌ Any use of fetch/axios
const data = await fetch('/api/...')
```

**WHY FORBIDDEN:**
- Sprint 1 is UI-only
- Backend does not exist yet
- This creates false dependencies

---

#### ❌ Backend Assumptions

**FORBIDDEN:**
```typescript
// ❌ Assuming backend structure
interface Patient {
  id: string
  tenantId: string  // Backend not built yet, don't assume schema
  createdAt: Date
}

// ❌ Authorization logic
if (user.role === 'provider') {
  // show edit button
}

// ❌ State transition logic
if (note.status === 'draft') {
  // allow editing
}
```

**WHY FORBIDDEN:**
- Backend schema not finalized
- Authorization happens server-side
- State machines not implemented yet

**✅ ALLOWED:**
```typescript
// ✅ UI-only types (for component props)
interface PatientCardProps {
  name: string
  age: number
  onSelect?: () => void  // UI callback only
}
```

---

#### ❌ Permission Logic

**FORBIDDEN:**
```typescript
// ❌ Role-based rendering
{user.role === 'provider' && <EditButton />}

// ❌ Permission checks
const canEdit = hasPermission(user, 'clinical-notes:edit')

// ❌ State-based access
if (note.status === 'finalized') {
  disableForm()
}
```

**WHY FORBIDDEN:**
- Backend will enforce permissions
- Frontend should not make authorization decisions
- This logic belongs in Sprint 2+

**✅ ALLOWED (Sprint 1):**
```tsx
// ✅ Show ALL UI elements (no conditional hiding)
<EditButton disabled={true} />  // Always visible, always disabled for now
```

---

#### ❌ AI Prompts or Components

**FORBIDDEN:**
```typescript
// ❌ AI prompt input
<textarea placeholder="Ask AI to draft a clinical note..." />

// ❌ AI suggestion component
<AISuggestion text="..." confidence={0.9} />

// ❌ AI service
const aiService = {
  generateNote: (context) => { /* ... */ }
}
```

**WHY FORBIDDEN:**
- AI integration is Sprint 7
- AI boundaries not yet implemented
- Creates false expectations

---

#### ❌ Editable Clinical Content

**FORBIDDEN:**
```typescript
// ❌ Editable clinical note
<textarea value={clinicalNote} onChange={handleChange} />

// ❌ Prescription form
<form onSubmit={handleSubmitPrescription}>
  <input name="medication" />
  <input name="dosage" />
  <button type="submit">Issue Prescription</button>
</form>

// ❌ Lab result entry
<input type="number" placeholder="Enter lab value" />
```

**WHY FORBIDDEN:**
- Forms are visual-only in Sprint 1
- Submission logic belongs in Sprint 6
- Clinical data requires backend validation

**✅ ALLOWED (Sprint 1):**
```tsx
// ✅ Non-functional form (visual layout only)
<form onSubmit={(e) => e.preventDefault()}>
  <input name="medication" disabled />
  <input name="dosage" disabled />
  <button type="submit" disabled>Issue Prescription (Not Functional)</button>
</form>
```

---

#### ❌ Forms That Submit

**FORBIDDEN:**
```typescript
// ❌ Form submission handler
const handleSubmit = async (e) => {
  e.preventDefault()
  const data = new FormData(e.target)
  await fetch('/api/patients', { method: 'POST', body: data })
}

// ❌ Save button with logic
<button onClick={savePatient}>Save</button>
```

**WHY FORBIDDEN:**
- No backend to submit to
- Validation logic belongs in backend
- Sprint 1 is visual-only

**✅ ALLOWED (Sprint 1):**
```tsx
// ✅ Disabled save button (visual placeholder)
<button disabled className="opacity-50 cursor-not-allowed">
  Save (Not Functional)
</button>

// ✅ Form with preventDefault only
<form onSubmit={(e) => e.preventDefault()}>
  {/* Fields here */}
</form>
```

---

## 🔍 CODE REVIEW PROCESS

### How to Review Sprint 1 PRs

#### Step 1: Check File Structure

- [ ] All pages in `app/` directory?
- [ ] All components in `components/` directory?
- [ ] No `lib/api/` or `services/` folders?
- [ ] `lib/` folder has ≤ 3 files?

**If any ❌ → Request changes before reviewing code**

---

#### Step 2: Scan for Forbidden Keywords

Search the PR for these keywords:

```bash
# ❌ FORBIDDEN KEYWORDS (auto-reject if found)
fetch
axios
api/
backend
permission
authorize
canEdit
canDelete
handleSubmit
onSubmit (unless preventDefault only)
saveNote
updatePatient
deleteSession
```

**If found → Explain violation and request removal**

---

#### Step 3: Review Component Props

Check every component:

- [ ] Props are UI-only (strings, numbers, booleans, callbacks)?
- [ ] No props assume backend schema (e.g., `tenantId`, `createdAt`)?
- [ ] Callbacks are UI-only (e.g., `onSelect`, `onClose`, not `onSave`)?

**Example:**
```typescript
// ✅ GOOD (UI-only props)
interface CardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  onClose?: () => void
}

// ❌ BAD (assumes backend)
interface PatientCardProps {
  patient: Patient  // Assumes Patient schema from backend
  onSave: (patient: Patient) => Promise<void>  // Save logic
}
```

---

#### Step 4: Check for Business Logic

Look for:

- [ ] State transitions (draft → finalized)?
- [ ] Authorization checks (role === 'provider')?
- [ ] Calculations (age from birthdate, total cost)?
- [ ] Validation rules (required fields, format checks)?

**If found → This belongs in backend, reject**

---

#### Step 5: Verify Design Consistency

- [ ] Colors match clinical theme (blues, grays, no bright colors)?
- [ ] Spacing uses Tailwind scale (no arbitrary values)?
- [ ] Typography is professional (no decorative fonts)?
- [ ] Buttons are accessible (labels present, contrast good)?

**If inconsistent → Request design alignment**

---

#### Step 6: Test Navigation

- [ ] Every sidebar link navigates to a real page?
- [ ] Every page has title + content (no blank pages)?
- [ ] No 404 errors when clicking around?

**If broken → Request fix before merge**

---

### Review Response Templates

#### ✅ APPROVED

```markdown
**Sprint 1 Review: APPROVED ✅**

This PR meets Sprint 1 requirements:
- ✅ UI-only (no API calls, no business logic)
- ✅ File structure compliant
- ✅ Design consistent with clinical theme
- ✅ Navigation complete (no dead links)
- ✅ No forbidden items found

Approved for merge.
```

#### ❌ CHANGES REQUESTED

```markdown
**Sprint 1 Review: CHANGES REQUESTED ❌**

This PR violates Sprint 1 scope:

**Violations:**
1. ❌ API client found: `lib/api/patients.ts`
   - **Why forbidden:** Sprint 1 is UI-only, backend does not exist yet
   - **Required action:** Remove this file entirely

2. ❌ Authorization logic found: `components/EditButton.tsx:15`
   - **Code:** `if (user.role === 'provider') { setEnabled(true) }`
   - **Why forbidden:** Authorization is backend responsibility (Sprint 3+)
   - **Required action:** Remove conditional, show button always (disabled for now)

3. ❌ Form submission handler found: `app/patients/new/page.tsx:42`
   - **Code:** `const handleSubmit = async (e) => { await fetch(...) }`
   - **Why forbidden:** No backend to submit to, Sprint 1 is visual-only
   - **Required action:** Change to `(e) => e.preventDefault()` only

**Please address these violations and request re-review.**

Reference: [SPRINT_1_EXECUTION_GUIDE.md](docs/SPRINT_1_EXECUTION_GUIDE.md)
```

#### 🚫 BLOCKED

```markdown
**Sprint 1 Review: BLOCKED 🚫**

This PR fundamentally violates Sprint 1 scope and cannot be salvaged with minor changes.

**Critical Issues:**
- ❌ Implements complete backend integration (should be Sprint 4+)
- ❌ Includes AI prompting system (should be Sprint 7)
- ❌ Contains business logic for state transitions (should be Sprint 3)

**Required Action:**
- Close this PR
- Revert to Sprint 1 scope: UI-only, no backend, no AI, no logic
- Review [SPRINT_BREAKDOWN.md](docs/SPRINT_BREAKDOWN.md) for correct sprint sequencing

**This work is valuable but belongs in future sprints.**
```

---

## ✅ SUCCESS CRITERIA

Sprint 1 is successful ONLY if all criteria met:

### Functional Criteria

- [ ] **App is fully navigable**
  - Every sidebar item navigates to a real page
  - No 404 errors
  - Routing works correctly

- [ ] **UI structure is frozen**
  - App Shell finalized
  - Sidebar finalized
  - Page layouts defined
  - Component library started

- [ ] **All pages have content**
  - Every page has title + subtitle
  - Every page shows empty state or placeholder
  - No completely blank pages

### Code Quality Criteria

- [ ] **Repo is clean**
  - No `lib/api/` folder
  - No `services/` folder
  - No mock data services
  - `lib/` folder ≤ 3 files

- [ ] **No forbidden items**
  - No API calls
  - No backend assumptions
  - No permission logic
  - No AI components
  - No editable clinical content
  - No forms that submit

### Design Criteria

- [ ] **Clinical theme applied**
  - Professional colors (blues, grays)
  - Consistent spacing
  - Readable typography
  - Accessible buttons

### Documentation Criteria

- [ ] **Components documented**
  - README in `components/` explaining folder structure
  - Props documented (TypeScript types)

- [ ] **Pages documented**
  - README in `app/` explaining routing

---

## 🚨 COMMON VIOLATIONS & CORRECTIONS

### Violation 1: "Just a small API call"

**❌ VIOLATION:**
```typescript
// "Just to test the UI, I'll add a small API call"
const patients = await fetch('/api/patients').then(r => r.json())
```

**WHY FORBIDDEN:**
- Backend does not exist yet
- Creates false dependency
- Violates Sprint 1 scope

**✅ CORRECTION:**
```typescript
// Use hardcoded mock data for layout ONLY
const MOCK_PATIENTS_FOR_LAYOUT = [
  { id: "1", name: "MOCK: Patient 1" },
  { id: "2", name: "MOCK: Patient 2" }
]
```

---

### Violation 2: "Mock backend for development"

**❌ VIOLATION:**
```typescript
// lib/mockBackend.ts
export const mockBackend = {
  patients: {
    getAll: () => mockPatients,
    getOne: (id) => mockPatients.find(p => p.id === id)
  }
}
```

**WHY FORBIDDEN:**
- Creates coupling between frontend and assumed backend
- When real backend is built, this must be deleted (wasted effort)
- Encourages frontend to make backend assumptions

**✅ CORRECTION:**
```typescript
// NO mock backend
// UI shows empty states or hardcoded layout examples ONLY
```

---

### Violation 3: "Permission logic for UI"

**❌ VIOLATION:**
```typescript
// "I'm just showing/hiding buttons, not enforcing permissions"
{user.role === 'provider' && <EditButton />}
```

**WHY FORBIDDEN:**
- Frontend should NOT make authorization decisions
- Backend will enforce permissions (Sprint 3+)
- Creates false sense of security

**✅ CORRECTION:**
```typescript
// Show ALL buttons (disabled for now)
<EditButton disabled={true} />
// Backend will control enabled/disabled state later
```

---

### Violation 4: "Form that does nothing"

**❌ VIOLATION:**
```typescript
// "The form doesn't submit anywhere, it's just UI"
<form onSubmit={handleSubmit}>
  <input name="medication" />
  <button type="submit">Save</button>
</form>

const handleSubmit = (e) => {
  e.preventDefault()
  console.log('Form submitted (does nothing)')
}
```

**WHY PROBLEMATIC:**
- Implies functionality that doesn't exist
- User might expect it to work
- Better to be explicit about non-functionality

**✅ CORRECTION:**
```tsx
// Clearly disabled form (visual placeholder)
<form onSubmit={(e) => e.preventDefault()}>
  <input name="medication" disabled />
  <button type="submit" disabled className="opacity-50">
    Save (Not Functional)
  </button>
</form>
```

---

## 📋 SPRINT 1 COMPLETION CHECKLIST

### Before Marking Sprint 1 Complete

- [ ] All required pages exist and render
- [ ] All sidebar navigation works (no 404s)
- [ ] All pages have titles and content (no blank pages)
- [ ] No API clients in codebase
- [ ] No backend assumptions in types or components
- [ ] No permission or authorization logic
- [ ] No AI components or prompts
- [ ] No editable clinical content
- [ ] No forms that submit
- [ ] Design is consistent (clinical theme applied)
- [ ] Components are reusable and UI-only
- [ ] File structure follows REPO_STRUCTURE.md
- [ ] `lib/` folder has ≤ 3 files
- [ ] No mock data services
- [ ] README files present in `app/` and `components/`

### Sprint 1 Demo Requirements

Demonstrate:
1. **Navigation:** Click through every sidebar item → all pages load
2. **Empty States:** Show empty states for all major pages
3. **Design Consistency:** Show that all pages use same theme
4. **No Functionality:** Explain that buttons are disabled, forms don't submit

### Handoff to Sprint 2

**What Sprint 2 Receives:**
- Complete UI structure (frozen)
- All pages defined (empty states)
- Component library (UI-only)
- Design system (clinical theme)
- Clean repo (no forbidden items)

**What Sprint 2 Will Add:**
- Auth pages (login, logout)
- Role-based UI visibility (actual logic)
- Protected routes (auth guards)

---

## 🛡️ PHILOSOPHY

### Discipline Creates Speed

**Why strict enforcement matters:**

1. **Prevents Rework**
   - If frontend makes backend assumptions → must rewrite when backend is built
   - If frontend has permission logic → must remove when backend enforces
   - Clean separation now = faster integration later

2. **Forces Clear Thinking**
   - "What is UI vs logic?" must be answered now
   - Unclear boundaries create bugs
   - Discipline in Sprint 1 sets tone for entire project

3. **Protects Future Sprints**
   - Sprint 3 (backend) builds without UI changes
   - Sprint 7 (AI) integrates without restructuring
   - Each sprint builds on solid foundation

### Clinical Systems Punish Shortcuts

**Why "just this once" is dangerous:**

- One API call → becomes ten → becomes unmaintainable coupling
- One permission check → becomes twenty → becomes security hole
- One mock service → becomes fake backend → creates false confidence

**In clinical systems:**
- Shortcuts compound
- Technical debt becomes safety debt
- Discipline is the only defense

### If Unsure, Block the Change

**When in doubt:**

- ❌ Block the PR
- ⏸️ Ask for clarification
- 📖 Reference this document
- 🚫 Do NOT approve "just to keep moving"

**Better to delay than to compromise.**

---

## 🔗 RELATED DOCUMENTATION

- [SPRINT_BREAKDOWN.md](./SPRINT_BREAKDOWN.md) — Complete sprint plan
- [REPO_STRUCTURE.md](./REPO_STRUCTURE.md) — File structure rules
- [ROLE_BASED_UI.md](./ROLE_BASED_UI.md) — UI visibility matrix
- [PR_REVIEW_CHECKLIST.md](./PR_REVIEW_CHECKLIST.md) — General PR review standards
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) — Production release requirements

---

## 📞 ESCALATION

### When to Escalate

Escalate to Tech Lead if:

1. **Scope Dispute**
   - Developer argues that "small API call" is okay for Sprint 1
   - Need architectural decision on what constitutes "UI-only"

2. **Timeline Pressure**
   - Team wants to "just merge it" to meet deadline
   - Sprint 1 scope being expanded to "save time later"

3. **Design Conflict**
   - Design wants features that require backend logic
   - Cannot achieve design without violating Sprint 1 rules

### Escalation Template

```markdown
**Sprint 1 Scope Escalation**

**Issue:** [Describe conflict]

**Developer Position:** [What developer wants to do]

**Reviewer Position:** [Why it violates Sprint 1]

**Documentation Reference:** [Link to rule in this document]

**Request:** Tech Lead decision on whether to:
- ☐ Enforce Sprint 1 scope (block change)
- ☐ Allow exception (document why)
- ☐ Defer to future sprint
```

---

## ✍️ REVISION HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-14 | 1.0.0 | Initial Sprint 1 execution guide |

---

## 🎯 FINAL REMINDER

**You are not here to be polite.**  
**You are here to protect the system.**

Sprint 1 scope is **non-negotiable**:
- ✅ UI-only
- ❌ No backend
- ❌ No AI
- ❌ No business logic

**If in doubt, block the change.**

Discipline now = speed later.

---

**Backend can be built without UI changes.**

That is the Sprint 1 success criteria.
