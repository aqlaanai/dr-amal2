# ISSUE GOVERNANCE — Dr Amal Clinical OS v2.0

**Document Status:** 🟢 ACTIVE  
**Last Updated:** January 14, 2026  
**Owner:** Engineering Management

---

## PURPOSE

This document defines **strict governance rules** for GitHub issues in Dr Amal Clinical OS.

**Philosophy:**
- **Clarity before action** — Vague issues create chaos
- **Safety before speed** — Undefined changes create risk
- **Documentation is part of the product** — Undocumented work is incomplete

---

## GLOBAL ISSUE RULES (MANDATORY)

### Rule 1: One Issue = One Concern

- ❌ **REJECT:** "Add patient search + fix bug in prescriptions + update docs"
- ✅ **ACCEPT:** 3 separate issues, each focused on one thing

### Rule 2: Every Issue Must Map To

1. **A sprint** → When will this be addressed?
2. **A domain** → Which backend domain is affected?
3. **A role** → Which user role is impacted?

### Rule 3: Issues Without Full Information Are Not Accepted

- Missing role → Close with comment
- Missing state → Close with comment
- Missing safety assessment → Close with comment
- "AI impact: not sure" → Close with comment

### Rule 4: No "Quick Fixes"

- All changes, even "simple" ones, must follow the issue template
- No exceptions for "trivial" changes
- Small PRs still require full issue documentation

---

## ISSUE TEMPLATES

Dr Amal uses **5 mandatory issue templates**:

| Template | Purpose | Auto-Labels |
|----------|---------|-------------|
| **Feature Request** | New features or enhancements | `type:feature` |
| **Bug Report** | Report broken functionality | `type:bug` |
| **Security / Compliance** | Security vulnerabilities, compliance issues | `type:security`, `priority:critical` |
| **Technical Debt** | Document cleanup needed | `type:debt` |
| **Documentation Update** | Sync docs with code changes | `type:docs` |

**Blank issues are DISABLED.**

---

## TEMPLATE SUMMARIES

### 🚀 Feature Request

**Required Information:**
1. Problem statement (what is missing?)
2. Affected role (provider / admin / caregiver)
3. Frontend impact (screens, states)
4. Backend impact (read / write, domains)
5. State machine impact (new states? new transitions?)
6. AI impact (can AI see? can AI suggest?)
7. Safety notes (clinical safety, privacy, data integrity)
8. Acceptance criteria (testable outcomes)
9. Sprint assignment

**Auto-Reject Patterns:**
- States not mentioned
- AI impact is "not sure"
- Domain not specified
- Safety implications ignored

**Template Path:** `.github/ISSUE_TEMPLATE/feature_request.yml`

---

### 🐛 Bug Report

**Required Information:**
1. Observed behavior (what is happening?)
2. Expected behavior (what should happen?)
3. Affected role
4. Affected state(s) (reference STATE_MACHINES.md)
5. Affected domain(s)
6. Steps to reproduce
7. Reproducibility (always / often / sometimes / rarely)
8. Severity (critical / high / medium / low)
9. Clinical safety impact (yes / maybe / no)
10. Environment (dev / staging / prod, browser, versions)

**Auto-Reject Patterns:**
- State not specified
- Role missing
- Reproducibility unclear
- Severity not assessed

**Template Path:** `.github/ISSUE_TEMPLATE/bug_report.yml`

---

### 🔒 Security / Compliance Issue

**Required Information:**
1. Security issue type (auth bypass, data leak, etc.)
2. Risk description
3. Affected domain(s)
4. Potential impact (patient privacy, clinical safety, compliance)
5. Data exposure risk (PHI, PII, credentials, etc.)
6. Exploitability (easy / moderate / difficult / theoretical)
7. Urgency level (critical / high / medium / low)
8. Steps to verify (non-exploitative)
9. Affected architecture docs
10. Proposed mitigation

**Auto-Labels:**
- `type:security`
- `priority:critical`

**Rules:**
- Auto-labeled as CRITICAL
- Can be made PRIVATE for high-severity issues
- For active exploits, use GitHub Security Advisories

**Template Path:** `.github/ISSUE_TEMPLATE/security_compliance.yml`

---

### 🔧 Technical Debt

**Required Information:**
1. Debt type (architecture violation, duplication, missing tests, etc.)
2. What is the debt? (clear description)
3. Why is this debt? (not just "it's ugly")
4. Risk if ignored (short / medium / long-term)
5. Affected domain(s)
6. Proposed cleanup
7. Cleanup effort estimate (small / medium / large)
8. Urgency (urgent / high / medium / low)
9. Architecture impact (which docs does this violate?)

**Auto-Reject Patterns:**
- "Refactor" without justification
- No clear risk if ignored
- Vague or subjective complaints

**Philosophy:**
- Not all code needs to be "perfect"
- Focus on debt that increases **risk** or blocks **progress**
- "Could be cleaner" is NOT sufficient justification

**Template Path:** `.github/ISSUE_TEMPLATE/technical_debt.yml`

---

### 📚 Documentation Update

**Required Information:**
1. Update type (code change, new feature, clarification, correction, etc.)
2. What changed? (code, feature, or behavior)
3. Why update? (why are docs outdated?)
4. Affected documentation (which files?)
5. Specific sections to update
6. Proposed changes (what to add/change)
7. Documentation category (architecture, API, state machines, etc.)
8. Urgency
9. Impact if not updated

**Philosophy:**
- Documentation is **part of the product**
- Outdated docs are **worse than no docs**
- Every code change should update relevant docs

**Template Path:** `.github/ISSUE_TEMPLATE/documentation_update.yml`

---

## LABELING RULES

### Mandatory Labels

Every issue MUST have:

1. **Type Label** (auto-applied by template):
   - `type:feature`
   - `type:bug`
   - `type:security`
   - `type:debt`
   - `type:docs`

2. **Domain Label** (applied by triager):
   - `domain:identity`
   - `domain:patients`
   - `domain:sessions`
   - `domain:clinical-notes`
   - `domain:prescriptions`
   - `domain:labs`
   - `domain:referrals`
   - `domain:audit`
   - `domain:ai`
   - `domain:frontend`
   - `domain:infra`

3. **Role Label** (applied by triager):
   - `role:provider`
   - `role:admin`
   - `role:caregiver`
   - `role:all`

4. **State Label** (applied by triager, if applicable):
   - `state:draft`
   - `state:active`
   - `state:ended`
   - `state:archived`
   - (etc., based on affected state machine)

5. **Sprint Label** (applied during sprint planning):
   - `sprint:0`
   - `sprint:1`
   - `sprint:2`
   - ... `sprint:8`
   - `sprint:future`

### Optional Labels

- **Priority:**
  - `priority:critical` (auto-applied for security issues)
  - `priority:high`
  - `priority:medium`
  - `priority:low`

- **Status:**
  - `status:triage` (auto-applied by templates)
  - `status:accepted`
  - `status:in-progress`
  - `status:blocked`
  - `status:done`

---

## ISSUE LIFECYCLE

### 1. Creation

- User selects template
- Fills out ALL required fields
- Submits issue
- Auto-labeled with `type:*` and `status:triage`

### 2. Triage (Within 24 Hours)

**Triager checks:**
- [ ] All required fields completed?
- [ ] Mapped to correct domain(s)?
- [ ] Role(s) specified?
- [ ] State(s) documented (if applicable)?
- [ ] Safety assessed (if applicable)?
- [ ] Acceptance criteria clear (features) or reproducibility clear (bugs)?

**Actions:**
- ✅ **Accept:** Add domain/role/state labels, move to backlog
- ❌ **Reject:** Close with comment explaining missing info, link to template

### 3. Sprint Planning

- Product/Engineering assign to sprint
- Add `sprint:*` label
- Prioritize within sprint backlog

### 4. Implementation

- Developer self-assigns
- Updates status to `status:in-progress`
- Creates PR linked to issue

### 5. PR Review

- PR must pass **PR_REVIEW_CHECKLIST.md**
- PR must reference issue (e.g., "Closes #123")
- Documentation updates included

### 6. Closure

- PR merged → Issue auto-closed
- Update status to `status:done`

---

## AUTO-REJECT PATTERNS

**These patterns result in immediate closure:**

### Feature Requests

- ❌ States not mentioned
- ❌ AI impact is "not sure" or blank
- ❌ Domain not specified
- ❌ Safety implications ignored
- ❌ Acceptance criteria vague ("make it better")

### Bug Reports

- ❌ State not specified
- ❌ Role missing
- ❌ Reproducibility unclear
- ❌ Severity not assessed
- ❌ "It doesn't work" with no details

### Security Issues

- ❌ Includes sensitive data (passwords, keys, patient info)
- ❌ Includes weaponizable exploit code
- ❌ No risk assessment
- ❌ No affected domain

### Technical Debt

- ❌ "Refactor" without justification
- ❌ No risk if ignored
- ❌ Vague ("code is messy")
- ❌ Subjective preference ("I don't like this pattern")

### Documentation Updates

- ❌ "Update docs" without specifying what changed
- ❌ No clear reason for update
- ❌ Affected docs not listed

---

## ENFORCEMENT

### Who Enforces?

- **Template Validation:** GitHub (via YAML form validation)
- **Triage:** Engineering Lead / Product Manager
- **PR Review:** Developer + Reviewer (via PR_REVIEW_CHECKLIST.md)

### How to Reject an Issue

1. Add comment explaining what's missing
2. Reference the template section that was incomplete
3. Close issue with label `status:rejected`
4. Optionally provide example of well-formed issue

**Example:**
```
This issue is missing required information:

- [ ] Affected state(s) not specified (see section 4)
- [ ] AI impact not assessed (see section 6)

Please resubmit using the full Feature Request template:
.github/ISSUE_TEMPLATE/feature_request.yml

Example of a well-formed issue: #456
```

---

## SPECIAL CASES

### Urgent Production Bugs

- Still use Bug Report template
- Set severity to CRITICAL
- Set urgency to URGENT
- Notify team in Slack/Discord
- Triage immediately (< 1 hour)

### Security Vulnerabilities (High Severity)

- Use GitHub Security Advisories for PRIVATE reporting
- Do NOT create public issue if actively exploitable
- Once patched, can create public security issue for transparency

### Documentation-Only Changes

- Use Documentation Update template
- Still requires full information
- Can be low priority if non-blocking

---

## METRICS & ACCOUNTABILITY

### Tracked Metrics

1. **Issue Rejection Rate**
   - Target: < 10%
   - High rejection rate = templates need clarification

2. **Time to Triage**
   - Target: < 24 hours
   - Measures responsiveness

3. **Issues Without Labels**
   - Target: 0
   - Every issue must have domain/role/sprint labels

4. **Issues Open > 30 Days**
   - Target: < 5%
   - Indicates backlog grooming needed

### Accountability

- **Issue Creator:** Provide complete, accurate information
- **Triager:** Review within 24 hours, apply labels, reject incomplete issues
- **Developer:** Link PR to issue, update docs, follow checklist
- **Reviewer:** Verify PR references issue, docs updated, checklist passed

---

## PHILOSOPHY

### Why This Matters

1. **Clarity before action**
   - Vague issues create confusion
   - Confusion creates bugs
   - Bugs in clinical systems create risk

2. **Safety before speed**
   - Undefined changes bypass safety reviews
   - "Quick fixes" skip documentation
   - Undocumented code is unmaintainable

3. **Documentation is part of the product**
   - Code without docs is incomplete
   - Docs enable collaboration
   - Docs enable compliance audits

### What This Prevents

- ❌ Feature dumping ("let's add 10 features at once")
- ❌ Mixed concerns ("fix bug + add feature + refactor")
- ❌ Vague requests ("make it better")
- ❌ Undocumented "quick fixes"
- ❌ Safety bypasses ("we'll test it later")
- ❌ State confusion ("what state is this allowed in?")
- ❌ Role confusion ("who can do this?")
- ❌ AI boundary violations ("can AI modify this?")

---

## RELATED DOCUMENTATION

- [PR_REVIEW_CHECKLIST.md](./PR_REVIEW_CHECKLIST.md) — Mandatory PR review standards
- [SPRINT_BREAKDOWN.md](./SPRINT_BREAKDOWN.md) — Sprint planning and execution
- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) — Backend enforcement architecture
- [STATE_MACHINES.md](./STATE_MACHINES.md) — State definitions and transitions
- [REPO_STRUCTURE.md](./REPO_STRUCTURE.md) — Repository organization

---

## TEMPLATE LOCATIONS

All templates are located in `.github/ISSUE_TEMPLATE/`:

```
.github/
└── ISSUE_TEMPLATE/
    ├── config.yml                  # Template chooser config
    ├── feature_request.yml         # Feature Request template
    ├── bug_report.yml              # Bug Report template
    ├── security_compliance.yml     # Security/Compliance template
    ├── technical_debt.yml          # Technical Debt template
    └── documentation_update.yml    # Documentation Update template
```

---

## REVISION HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-14 | 1.0.0 | Initial issue governance documentation |

---

**Clarity before action. Safety before speed. Documentation is part of the product.**

If an issue cannot be described clearly, it is not ready to be built.
