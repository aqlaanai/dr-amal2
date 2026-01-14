# Pull Request Review Checklist — Dr Amal Clinical OS v2.0

**Purpose:** Mandatory checklist for all pull requests. No exceptions.

**Scope:** Every PR must pass this checklist before merge.

**Philosophy:** "Works" is not enough. Safety > Speed. Discipline scales, shortcuts explode.

---

## 🚦 GLOBAL PR RULE (ABSOLUTE)

```
┌─────────────────────────────────────────────────────────┐
│  IF A PR VIOLATES ANY RULE BELOW → IT IS REJECTED      │
│                                                         │
│  No exceptions.                                         │
│  No "just this once."                                  │
│  No "we'll fix it later."                              │
│                                                         │
│  This is a clinical system.                            │
│  Every line of code affects patient safety.            │
└─────────────────────────────────────────────────────────┘
```

---

## REVIEWER RESPONSIBILITIES

**Before reviewing any PR:**

1. Read the PR description
2. Understand the sprint goal
3. Review the checklist below
4. Test locally if critical (auth, immutability, state transitions)
5. Approve ONLY if all checkboxes pass

**Review Time Expected:**
- Small PR (< 100 lines): 15-30 minutes
- Medium PR (100-500 lines): 30-60 minutes
- Large PR (> 500 lines): 1-2 hours (or request split into smaller PRs)

**If PR is too large to review thoroughly → Request split.**

---

## 1️⃣ SCOPE CHECK

### ✅ PR Must:

- [ ] **Do exactly one thing** (one feature, one bug fix, one refactor—not all three)
- [ ] **Match the sprint goal** (aligns with current sprint's objective)
- [ ] **Have clear title** (e.g., "Add finalize button to clinical notes", not "Fix stuff")
- [ ] **Have description explaining:**
  - What changed
  - Why it changed
  - How to test it

### ❌ Reject If:

- [ ] Mixed frontend + backend changes without clear reason (e.g., "Add patients API + refactor sidebar" is two PRs)
- [ ] Refactors bundled with features (refactor first, feature second—separate PRs)
- [ ] "Drive-by fixes" (fixing unrelated bugs in feature PR)
- [ ] Multiple unrelated files changed (indicates scope creep)

**Example Violation:**
```
PR Title: "Add prescription workflow and fix typos and refactor API client"
❌ REJECT: This is 3 PRs disguised as one.
```

**Correct:**
```
PR Title: "Add prescription draft creation endpoint"
✅ APPROVE (if passes other checks): Clear, single responsibility.
```

---

## 2️⃣ FRONTEND SAFETY CHECK

### ✅ Frontend Must:

- [ ] **No business logic in components** (state transitions, role enforcement → backend only)
- [ ] **No permission checks in UI** (UI hides elements based on role, but backend enforces)
- [ ] **All states visible and explicit** (loading, empty, error, restricted states shown)
- [ ] **Finalized/archived data clearly read-only** (no edit buttons, grayed out, labeled)
- [ ] **Confirmation modals for one-way transitions** (finalize, issue, complete)

### ❌ Reject If:

- [ ] Frontend validates state transitions (e.g., `if (note.status === 'draft') note.status = 'finalized'`)
- [ ] Frontend enforces permissions (e.g., `if (user.role !== 'provider') return null`)
- [ ] Finalized notes have edit buttons (even if disabled—should not render at all)
- [ ] One-way actions (finalize, issue) have no confirmation modal
- [ ] Error states missing (API call has no error handling)

**Example Violation:**
```typescript
// ❌ BAD: Frontend enforces state transition
function finalizeNote() {
  if (note.status === 'draft') {
    note.status = 'finalized'  // ❌ Frontend should call API, backend validates
    save(note)
  }
}
```

**Correct:**
```typescript
// ✅ GOOD: Frontend calls API, backend validates
async function finalizeNote() {
  try {
    await apiClient.patch(`/notes/${note.id}/finalize`)
    // Backend decides if transition is allowed
  } catch (error) {
    showError(error)
  }
}
```

---

## 3️⃣ BACKEND ENFORCEMENT CHECK

### ✅ Backend Must:

- [ ] **Validate all state transitions** (cannot go from `finalized` → `draft`)
- [ ] **Enforce immutability** (finalized notes, issued prescriptions cannot be updated)
- [ ] **Check role AND state** (both must pass)
- [ ] **Never trust frontend input** (validate all DTOs)
- [ ] **Return explicit errors** (no silent failures, clear error codes)

### ❌ Reject If:

- [ ] Backend trusts frontend (e.g., accepts `status` from request body without validation)
- [ ] State transition allowed without validation (e.g., `UPDATE notes SET status = $1` without checking current status)
- [ ] Immutability bypassed (e.g., admin can edit finalized notes)
- [ ] Role check missing on protected endpoint
- [ ] Tenant isolation missing (cross-tenant access possible)

**Example Violation:**
```typescript
// ❌ BAD: Backend trusts frontend status
async updateNote(id: string, dto: UpdateNoteDto) {
  await this.repository.update(id, dto)  // ❌ No validation
}
```

**Correct:**
```typescript
// ✅ GOOD: Backend validates before updating
async updateNote(id: string, dto: UpdateNoteDto) {
  const note = await this.repository.findOne(id)
  
  // Enforce immutability
  if (note.status === 'finalized' || note.status === 'archived') {
    throw new ImmutableEntityException('Finalized notes cannot be modified')
  }
  
  // Only draft notes can be updated
  if (note.status !== 'draft') {
    throw new InvalidStateTransitionException(`Cannot update note in ${note.status} state`)
  }
  
  await this.repository.update(id, dto)
}
```

---

## 4️⃣ AI BOUNDARY CHECK (CRITICAL)

### ✅ AI Must:

- [ ] **Have read-only database access** (verified with `REVOKE INSERT, UPDATE, DELETE`)
- [ ] **Never write to clinical tables** (no `INSERT`, `UPDATE`, `DELETE` in AI code)
- [ ] **All output labeled as AI-generated** ("AI Suggestion" badge visible)
- [ ] **Human-initiated only** (no background AI jobs)
- [ ] **Confidence shown** (high/medium/low badge)
- [ ] **Accept/Edit/Dismiss flow** (human approval mandatory)

### ❌ Immediate Rejection If:

- [ ] AI writes to `clinical_notes`, `prescriptions`, or any clinical table
- [ ] AI auto-applies suggestions (no human approval)
- [ ] AI runs in background (cron job, auto-processing)
- [ ] AI output not labeled (user can't tell it's AI-generated)
- [ ] AI bypasses human-in-the-loop (no Accept/Dismiss buttons)

**Example Violation:**
```typescript
// ❌ CRITICAL VIOLATION: AI auto-saves note
async function generateNote(sessionId: string) {
  const suggestion = await aiClient.generateSoapNote(sessionId)
  
  // ❌ AI CANNOT DO THIS
  await notesRepository.create({
    ...suggestion,
    status: 'draft'
  })
}
```

**Correct:**
```typescript
// ✅ GOOD: AI returns suggestion, human decides
async function generateNoteSuggestion(sessionId: string) {
  const suggestion = await aiClient.generateSoapNote(sessionId)
  
  // Return to frontend, human reviews and accepts
  return {
    suggestionId: uuidv4(),
    confidence: suggestion.confidence,
    content: suggestion.content,
    disclaimer: 'This is an AI-generated suggestion. Review and edit before use.'
  }
}
```

---

## 5️⃣ AUDIT & TRACEABILITY CHECK

### ✅ Audit Must:

- [ ] **All critical actions logged** (note finalized, prescription issued, session completed)
- [ ] **Logs are append-only** (no `UPDATE` or `DELETE` on audit_logs table)
- [ ] **Actor, action, entity captured** (who did what to what)
- [ ] **Timestamp in UTC** (ISO8601 format)
- [ ] **AI interactions logged** (confidence, accepted/dismissed)

### ❌ Reject If:

- [ ] Critical action (finalize, issue, complete) has no audit log
- [ ] Audit log can be edited or deleted
- [ ] Actor not captured (userId missing)
- [ ] Timestamp missing or in local time (must be UTC)

**Example Violation:**
```typescript
// ❌ BAD: Finalize note without audit log
async finalizeNote(noteId: string) {
  await this.repository.update(noteId, { status: 'finalized' })
  // ❌ No audit log
}
```

**Correct:**
```typescript
// ✅ GOOD: Finalize note with audit log
async finalizeNote(noteId: string, userId: string) {
  const note = await this.repository.update(noteId, { 
    status: 'finalized',
    finalizedAt: new Date()
  })
  
  // Create audit log
  await this.auditService.log({
    tenantId: note.tenantId,
    actorId: userId,
    action: 'note_finalized',
    entityType: 'clinical_note',
    entityId: noteId,
    timestamp: new Date().toISOString()
  })
  
  return note
}
```

---

## 6️⃣ DATA & SCHEMA CHECK

### ✅ Schema Changes Must:

- [ ] **Be minimal** (only add fields if absolutely necessary)
- [ ] **Have migration** (UP and DOWN scripts)
- [ ] **Preserve immutability** (finalized notes, issued prescriptions stay immutable)
- [ ] **Match state machines** (states align with STATE_MACHINES.md)
- [ ] **Include indexes** (for tenant, status, timestamps)

### ❌ Reject If:

- [ ] "Just in case" fields added (e.g., `futureUseField1`)
- [ ] States don't match enums (e.g., new status not in CHECK constraint)
- [ ] Breaking change without migration plan
- [ ] Immutability rules broken (e.g., removing `finalized` status)
- [ ] Missing indexes on tenant, status, or foreign keys

**Example Violation:**
```sql
-- ❌ BAD: Vague field, no constraint
ALTER TABLE clinical_notes ADD COLUMN extra_data TEXT;
```

**Correct:**
```sql
-- ✅ GOOD: Specific field, clear purpose, documented
ALTER TABLE clinical_notes 
  ADD COLUMN ai_assisted BOOLEAN DEFAULT FALSE;
-- Purpose: Track if AI was used to generate this note

-- Update state machine docs (STATE_MACHINES.md) to reflect this
```

---

## 7️⃣ SECURITY CHECK

### ✅ Security Must:

- [ ] **No secrets in code** (no API keys, passwords, tokens)
- [ ] **No tokens in logs** (redact access tokens, refresh tokens)
- [ ] **No debug endpoints** (no `/debug/users`, `/test/bypass-auth`)
- [ ] **HTTPS only** (staging/prod)
- [ ] **CORS configured** (no wildcards, specific origins)
- [ ] **Input sanitized** (SQL injection prevented, XSS prevented)

### ❌ Reject If:

- [ ] Any credential in code (even in comments)
- [ ] Token logged (access token, refresh token visible in logs)
- [ ] Debug/test endpoints in production code
- [ ] CORS allows all origins (`*`)
- [ ] Raw SQL without parameterization

**Example Violation:**
```typescript
// ❌ BAD: Secret in code
const apiKey = 'sk-abc123'  // ❌ NEVER

// ❌ BAD: Token logged
logger.info('User signed in', { accessToken: token })  // ❌ Exposes token
```

**Correct:**
```typescript
// ✅ GOOD: Secret from environment
const apiKey = process.env.AI_API_KEY

// ✅ GOOD: Redacted logging
logger.info('User signed in', { userId: user.id })  // Token not logged
```

---

## 8️⃣ CLEANLINESS CHECK

### ✅ Code Must:

- [ ] **No unused imports** (clean imports)
- [ ] **No dead code** (commented-out code removed)
- [ ] **No console.log** (use logger)
- [ ] **No TODO/FIXME** (create ticket instead, fix now, or remove)
- [ ] **No experimental code** (no "testing this approach" comments)

### ❌ Reject If:

- [ ] Unused files committed (e.g., `component.backup.tsx`)
- [ ] Commented-out code (delete it, Git has history)
- [ ] `console.log` statements (use logger instead)
- [ ] "Temporary" code (nothing is temporary in production)
- [ ] Test files with `.skip` or `.only` (all tests must run)

**Example Violation:**
```typescript
// ❌ BAD: Dead code, console.log, TODO
// const oldFunction = () => { ... }  // ❌ Delete, don't comment

function saveNote(note) {
  console.log('Saving note', note)  // ❌ Use logger
  // TODO: Add validation  // ❌ Either do it or create ticket
  save(note)
}
```

**Correct:**
```typescript
// ✅ GOOD: Clean, no dead code
function saveNote(note) {
  logger.info('Saving note', { noteId: note.id })
  validateNote(note)
  save(note)
}
```

---

## 9️⃣ DOCUMENTATION CHECK

### ✅ Docs Must:

- [ ] **Updated if behavior changed** (README, API docs, architecture)
- [ ] **State machines updated if states changed** (STATE_MACHINES.md)
- [ ] **API contracts updated if endpoints touched** (API_CONTRACTS.md)
- [ ] **PR description explains change** (what, why, how to test)

### ❌ Reject If:

- [ ] New endpoint added but API_CONTRACTS.md not updated
- [ ] New state added but STATE_MACHINES.md not updated
- [ ] Behavior changed but docs unchanged
- [ ] PR description is vague ("Fixed bug")

**Example Violation:**
```
PR adds new state `ai_assisted_draft` to clinical notes.

STATE_MACHINES.md still shows only: draft → finalized → archived

❌ REJECT: Docs must update to reflect new state.
```

**Correct:**
```
PR adds new state `ai_assisted_draft` to clinical notes.

Changes:
- Backend: Added state to enum, updated transitions
- Frontend: UI shows "AI-Assisted Draft" badge
- Docs: Updated STATE_MACHINES.md with new state diagram

✅ APPROVE: Docs aligned with code.
```

---

## 🔟 FINAL REVIEW QUESTIONS (MANDATORY)

**Reviewer must answer YES to all three questions:**

### Question 1: Medical Audit Defense
> "If this code caused a compliance issue and we had to defend it in a medical audit, would I be comfortable explaining this design decision?"

- [ ] **YES** - The code follows all architectural principles, is auditable, and defensible.
- [ ] **NO** - ❌ REJECT PR

---

### Question 2: Patient Safety
> "If this code ran in production and affected a real patient, would I be comfortable with the outcome?"

- [ ] **YES** - The code enforces safety (immutability, state validation, audit logging).
- [ ] **NO** - ❌ REJECT PR

---

### Question 3: Risk Reduction
> "Does this PR reduce future risk, or does it introduce new risk?"

- [ ] **Reduces risk** - Adds safety, removes shortcuts, improves enforcement.
- [ ] **Introduces risk** - ❌ REJECT PR

**If ANY answer is NO → PR is REJECTED, no exceptions.**

---

## PR SIZE GUIDELINES

### Ideal PR Size

| Lines Changed | Review Time | Recommendation |
|---------------|-------------|----------------|
| **< 100 lines** | 15-30 min | ✅ Ideal size |
| **100-300 lines** | 30-60 min | ✅ Acceptable |
| **300-500 lines** | 1-2 hours | ⚠️ Large, consider splitting |
| **> 500 lines** | > 2 hours | ❌ Too large, must split |

**Exception:** Database migrations or generated code (OpenAPI specs) can be larger.

**If PR > 500 lines → Request split into smaller PRs.**

---

## PR APPROVAL PROCESS

### 1. Self-Review (PR Author)
- [ ] Run linter locally (`npm run lint`)
- [ ] Run tests locally (`npm run test`)
- [ ] Review own code (catch obvious issues)
- [ ] Verify checklist before requesting review

### 2. Peer Review (Reviewer)
- [ ] Go through checklist above
- [ ] Test locally if critical (auth, immutability, state transitions)
- [ ] Request changes if any checkbox fails
- [ ] Approve only if all pass

### 3. Merge
- [ ] Squash and merge (clean Git history)
- [ ] Delete feature branch
- [ ] Verify CI/CD passes after merge

---

## COMMON REJECTION REASONS

### Top 10 Reasons PRs Get Rejected

1. **Scope creep** - PR does multiple unrelated things
2. **Frontend enforces business logic** - State transitions in UI
3. **Backend trusts frontend** - No validation on state changes
4. **AI writes to database** - Violates read-only constraint
5. **Missing audit logs** - Critical action not logged
6. **Immutability bypassed** - Finalized note edited
7. **Secrets in code** - API key committed
8. **Dead code** - Commented-out code, unused imports
9. **Docs not updated** - State machine changed but docs unchanged
10. **No confirmation modal** - One-way action (finalize) has no modal

**If your PR is rejected, fix it and resubmit. Do NOT argue for exceptions.**

---

## EMERGENCY HOTFIX EXCEPTION

**Only in critical production incidents:**

- [ ] Security vulnerability
- [ ] Data loss risk
- [ ] System down

**Process:**
1. Fix deployed immediately
2. PR created retroactively
3. Full review conducted post-deployment
4. Incident report written

**All other "urgent" requests go through normal review.**

---

## REVIEW RESPONSE TIME

**Expected response times:**

| Priority | Response Time | Examples |
|----------|---------------|----------|
| **Critical** | < 2 hours | Security fix, prod down |
| **High** | < 4 hours | Blocking sprint work |
| **Normal** | < 24 hours | Regular features |
| **Low** | < 48 hours | Refactors, docs |

**Reviewers are responsible for timely reviews. Delays block sprints.**

---

## ANTI-PATTERNS (AUTO-REJECT)

### Immediate rejection for these patterns:

❌ **"Works on my machine" defense**
```
Reviewer: "This breaks tenant isolation."
Author: "But it works on my machine."
❌ REJECTED: Must work correctly, not just locally.
```

❌ **"We'll fix it later" promise**
```
Author: "I know there's no audit log, but we'll add it later."
❌ REJECTED: Fix it now, not later.
```

❌ **"It's just a small change" minimization**
```
Author: "It's just removing a validation check, no big deal."
❌ REJECTED: Removing safety is a big deal.
```

❌ **"Nobody will notice" assumption**
```
Author: "This endpoint is internal, nobody will use it."
❌ REJECTED: Assume everything is public and audited.
```

---

## PHILOSOPHY (LOCKED)

### Code Review is Risk Management

> "Every PR is a potential compliance violation, data leak, or patient safety issue. We review to prevent harm, not to criticize. If a PR is rejected, it's because we care about safety, not because we're being difficult."

### "Works" is Not Enough

> "'It works' means it doesn't crash. 'It's correct' means it enforces rules, logs actions, prevents abuse, and survives audit. We demand correctness, not just functionality."

### Shortcuts Compound

> "One shortcut feels harmless. Ten shortcuts create chaos. Fifty shortcuts make the system unmaintainable. We reject shortcuts to prevent future paralysis."

### Clinical Systems Punish Sloppiness

> "Consumer apps forgive bugs with patches. Clinical systems punish bugs with lawsuits. We hold ourselves to medical-grade standards because patients' lives are on the line."

---

## FINAL CHECKLIST FOR REVIEWER

**Before clicking "Approve," verify:**

- [ ] PR scope is clear and single-purpose
- [ ] Frontend has no business logic
- [ ] Backend enforces all rules
- [ ] AI boundaries are intact (if applicable)
- [ ] Audit logging is present
- [ ] Schema changes are minimal and safe
- [ ] No secrets in code
- [ ] Code is clean (no dead code, console.log, TODOs)
- [ ] Docs updated if behavior changed
- [ ] All three final questions answered YES

**If ALL checkboxes pass → Approve.**

**If ANY checkbox fails → Request changes.**

**No exceptions. No shortcuts. No compromises.**

---

**Last Updated:** January 14, 2026  
**Status:** PR Review Checklist Locked  
**Integration:** Enforces BACKEND_ARCHITECTURE.md, DATABASE_SCHEMA.md, AI_IMPLEMENTATION_PLAN.md, REPO_STRUCTURE.md, SPRINT_BREAKDOWN.md  
**Mandatory Use:** Every PR must pass this checklist before merge
