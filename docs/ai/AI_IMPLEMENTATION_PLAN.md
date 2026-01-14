# AI Implementation Plan — Dr Amal Clinical OS v2.0

**Purpose:** Define safe, read-only AI implementation with human-in-the-loop controls.

**Scope:** AI layer design only. No code. No vendor selection. No autonomous agents.

**Philosophy:** AI assists clinicians, not replaces them. Trust is built through restraint. Safety beats intelligence.

---

## CORE AI PRINCIPLES (ABSOLUTE)

```
┌─────────────────────────────────────────────┐
│  AI HAS ZERO AUTHORITY                      │
│  AI NEVER CHANGES SYSTEM STATE              │
│  AI SUGGESTIONS ARE OPTIONAL                │
│  AI OUTPUT IS ALWAYS LABELED                │
│  AI SILENCE > AI HALLUCINATION              │
└─────────────────────────────────────────────┘
```

**What This Means:**

❌ AI cannot save data  
❌ AI cannot finalize notes  
❌ AI cannot issue prescriptions  
❌ AI cannot approve actions  
❌ AI cannot diagnose  

✅ AI can suggest  
✅ AI can summarize  
✅ AI can explain  
✅ AI can remain silent  

**If AI violates these principles, the entire feature must be disabled.**

---

## 1️⃣ AI USE CASES (ALLOWED ONLY)

### ✅ Approved Use Cases

#### Use Case 1: Draft Clinical Note Suggestions

**When:** Provider is writing SOAP note in `draft` state  
**Input:** Session transcript, patient summary  
**Output:** Suggested SOAP sections (Subjective, Objective, Assessment, Plan)  
**Confidence:** Must be shown (high/medium/low)  
**Human Action:** Provider reviews, edits, accepts, or dismisses  

**Critical Constraint:**
- AI only suggests for `draft` or `ai_assisted_draft` notes
- AI NEVER suggests for `finalized` notes (read-only)

---

#### Use Case 2: Session Summaries

**When:** Session status is `completed`  
**Input:** Session transcript (if available)  
**Output:** Plain-language summary of session highlights  
**Confidence:** Must be shown  
**Human Action:** Provider reads summary, may use it to inform note  

**Critical Constraint:**
- Summary is informational only
- Does not auto-populate note fields
- Provider copies/edits if desired

---

#### Use Case 3: Lab Result Explanations

**When:** Lab result status is `received` or `reviewed`  
**Input:** Lab test type, result values, normal ranges  
**Output:** Neutral explanation of what result indicates  
**Confidence:** Must be shown  
**Human Action:** Provider reads explanation, makes clinical decision  

**Critical Constraint:**
- Explanation uses neutral language ("This result suggests...")
- NEVER diagnostic language ("Patient has...")
- NEVER treatment recommendations ("Prescribe...")

---

#### Use Case 4: Overview Summaries

**When:** Provider views overview/dashboard  
**Input:** Aggregate stats (session count, patient count)  
**Output:** Brief insight (e.g., "15% increase in sessions this week")  
**Confidence:** Not shown (low-stakes, non-clinical)  
**Human Action:** Provider reads, no action required  

**Critical Constraint:**
- Non-clinical insights only
- No patient-specific data exposed
- Purely informational

---

### ❌ Forbidden Use Cases

| Use Case | Why Forbidden |
|----------|---------------|
| **Auto-Finalize Notes** | Finalization is one-way, requires provider judgment |
| **Auto-Issue Prescriptions** | Prescribing is clinical decision, legally provider's responsibility |
| **Diagnosis Suggestions** | Diagnosis is clinical judgment, AI lacks context |
| **Triage / Urgency Scoring** | Patient safety risk, requires clinical expertise |
| **Cross-Patient Analysis** | Privacy violation, tenant isolation breach |
| **Auto-Archive / Auto-Close** | State transitions require explicit provider action |
| **Appointment Scheduling** | Requires business logic, availability, patient preference |

**If a use case is not explicitly listed in "Approved Use Cases," it is FORBIDDEN.**

---

## 2️⃣ AI INPUT BOUNDARIES (STRICT)

### Scoping Rules

**Every AI Request MUST Include:**

```json
{
  "userId": "UUID (current provider)",
  "patientId": "UUID (current patient)",
  "sessionId": "UUID | null (current session, if applicable)",
  "tenantId": "UUID (current clinic)"
}
```

**AI Gateway validates:**

1. User exists and is `active`
2. User has `role = 'provider'` (only providers use AI)
3. User has access to patient (same tenantId)
4. Session belongs to patient (if sessionId provided)

**If ANY validation fails → Return 403 Forbidden, do NOT call AI model.**

---

### Allowed Inputs (Prepared by Backend)

| Input Type | Source | Scoped To | Max Age |
|------------|--------|-----------|---------|
| **Session Transcript** | `live_sessions` table | Current session only | N/A |
| **Patient Demographics** | `patients` table | Current patient only | N/A |
| **Recent Notes** | `clinical_notes` table | Current patient only | Last 30 days, max 5 notes |
| **Recent Labs** | `lab_results` table | Current patient only | Last 90 days, max 10 results |
| **Medical Reference** | External knowledge base | Not patient-specific | N/A |

---

### Forbidden Inputs

❌ **Cross-Patient Data**
- AI cannot access other patients' records
- Even aggregated/anonymized data forbidden (privacy risk)

❌ **Cross-Tenant Data**
- AI cannot access data from other clinics
- Tenant isolation absolute

❌ **Admin Data**
- AI cannot access user accounts
- AI cannot access audit logs
- AI cannot access admin panels

❌ **Historical AI Suggestions**
- No memory between AI sessions
- Each request is stateless
- No cross-user learning

❌ **Hidden Fields**
- No password hashes
- No internal IDs (only show to AI if needed for reference)
- No system metadata

---

### Input Preparation (Read-Only Views)

**Backend creates safe, read-only views for AI:**

```sql
-- Example: AI-safe patient summary view
CREATE VIEW ai_patient_summary AS
SELECT 
  id,
  full_name,
  date_of_birth,
  gender
FROM patients
-- NO: email, phone, address, SSN
```

**AI Gateway queries ONLY these views, never raw tables.**

---

## 3️⃣ AI OUTPUT CONTRACT (MANDATORY)

### Output Structure

**Every AI Response MUST Include:**

```json
{
  "suggestionId": "UUID",
  "type": "draft_note | session_summary | lab_explanation | overview_insight",
  "confidence": "high | medium | low | very_low",
  "content": {
    "subjective": "string (if draft_note)",
    "objective": "string (if draft_note)",
    "assessment": "string (if draft_note)",
    "plan": "string (if draft_note)",
    "summary": "string (if session_summary or overview_insight)",
    "explanation": "string (if lab_explanation)"
  },
  "reasoning": "string (brief explanation of how AI arrived at suggestion)",
  "disclaimer": "This is an AI-generated suggestion. Review and edit before use.",
  "timestamp": "ISO8601"
}
```

---

### Confidence Levels (Defined)

| Level | Range | Meaning | UI Action |
|-------|-------|---------|-----------|
| **high** | 85-100% | AI is confident | Show suggestion with green indicator |
| **medium** | 70-84% | AI has moderate confidence | Show suggestion with yellow indicator |
| **low** | 50-69% | AI is uncertain | Show suggestion with orange indicator, warning |
| **very_low** | <50% | AI should refuse | Do NOT show suggestion, explain why |

**If `confidence` is `very_low`, AI must refuse:**

```json
{
  "suggestionId": null,
  "type": "draft_note",
  "confidence": "very_low",
  "content": null,
  "reasoning": "Insufficient context to generate a reliable suggestion.",
  "disclaimer": "AI cannot assist with this request. Please complete manually.",
  "timestamp": "ISO8601"
}
```

---

### Output Characteristics (Required)

**Non-Authoritative:**
- Never say "Patient has diabetes" (diagnostic)
- Say "Symptoms suggest further evaluation for diabetes" (suggestive)
- Never say "Prescribe metformin" (directive)
- Say "Consider reviewing glucose management options" (informative)

**Editable:**
- All AI suggestions returned as plain text
- Frontend allows full editing before acceptance
- Provider can modify any part of suggestion

**Dismissible:**
- Provider can dismiss suggestion without action
- Dismissal logged in `ai_interactions` table
- No penalty for dismissing (AI doesn't "learn" from dismissal)

**Labeled:**
- Every AI suggestion shows badge: "AI Suggestion"
- Confidence indicator visible
- Never hide that output is AI-generated

---

## 4️⃣ HUMAN-IN-THE-LOOP FLOW (LOCKED)

### AI Interaction Lifecycle

```
Step 1: Human Initiates
  ↓
  Provider clicks "Suggest with AI" button
  Frontend sends request to AI Gateway
  
Step 2: AI Generates
  ↓
  AI Gateway validates access
  AI Gateway prepares context (read-only)
  AI Gateway calls external AI model
  AI model returns suggestion + confidence
  
Step 3: Suggestion Ready
  ↓
  Frontend displays suggestion
  UI state: "Suggestion Ready"
  Badge: "AI Suggestion" + confidence indicator
  
Step 4: Human Reviews
  ↓
  Provider reads suggestion
  Provider edits suggestion (if desired)
  
Step 5: Human Decides
  ↓
  Option A: Accept → Suggestion inserted into draft note
  Option B: Edit → Modified version inserted
  Option C: Dismiss → Suggestion discarded
  
Step 6: Audit
  ↓
  Backend logs ai_interaction record:
    - userId
    - suggestionType
    - confidence
    - accepted: true | false
    - timestamp
```

**AI NEVER PROCEEDS PAST STEP 3.**

AI cannot:
- Auto-accept suggestions
- Auto-insert into notes
- Auto-save drafts
- Skip human review

---

### UI States (Mirrors AI_ASSISTANT_SPEC.md)

| State | Trigger | UI Indicator | Provider Action |
|-------|---------|--------------|-----------------|
| **Idle** | AI not invoked | No AI UI visible | Can click "Suggest with AI" |
| **Generating** | AI request sent | Loading spinner | Wait (max 10 seconds) |
| **Suggestion Ready** | AI returns response | Suggestion box with Accept/Edit/Dismiss buttons | Review and decide |
| **Confidence Low** | AI confidence < 70% | Orange warning indicator | Proceed with caution |
| **Human Review Required** | AI confidence < 50% | AI refuses, shows explanation | Complete manually |
| **Disabled** | AI feature off | No AI button visible | N/A |

---

## 5️⃣ AUDIT & TRACEABILITY (MANDATORY)

### What Gets Logged

**Every AI Interaction Logs:**

| Field | Value | Purpose |
|-------|-------|---------|
| `id` | UUID | Unique interaction ID |
| `tenantId` | UUID | Tenant isolation |
| `userId` | UUID | Who invoked AI |
| `contextType` | `draft_note`, `lab_result`, `session_transcript` | What AI analyzed |
| `contextId` | UUID (noteId, labId, sessionId) | What entity |
| `suggestionType` | `soap_draft`, `session_summary`, `lab_explanation` | Type of output |
| `confidenceLevel` | 0.00 - 1.00 | AI's confidence |
| `accepted` | `true`, `false` | Did provider accept? |
| `timestamp` | ISO8601 | When it happened |

**Storage:** `ai_interactions` table (see DATABASE_SCHEMA.md)

---

### What Does NOT Get Logged

❌ **Raw Prompts**
- May contain sensitive patient data
- Privacy risk if audit logs leaked
- Only log metadata (type, context ID)

❌ **Full AI Responses**
- Could expose patient data
- Store only: confidence, accepted/dismissed
- If response needed for debugging, encrypt separately

❌ **Provider Edits**
- If provider edits AI suggestion, don't diff
- Only log whether accepted or dismissed
- Provider's final note is in `clinical_notes` table

---

### Audit Query Interface (Admin Only)

**Admins can query:**
- How often AI is used (by provider, by date)
- Acceptance rate (% of suggestions accepted vs dismissed)
- Confidence distribution (how often high vs low)
- Most common suggestion types

**Example Queries:**

```sql
-- AI usage by provider
SELECT userId, COUNT(*) as ai_requests
FROM ai_interactions
WHERE tenantId = :tenantId
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY userId;

-- Acceptance rate
SELECT 
  COUNT(*) FILTER (WHERE accepted = true) * 100.0 / COUNT(*) as acceptance_rate
FROM ai_interactions
WHERE tenantId = :tenantId;

-- Confidence distribution
SELECT 
  CASE 
    WHEN confidenceLevel >= 0.85 THEN 'high'
    WHEN confidenceLevel >= 0.70 THEN 'medium'
    WHEN confidenceLevel >= 0.50 THEN 'low'
    ELSE 'very_low'
  END as confidence_bucket,
  COUNT(*)
FROM ai_interactions
WHERE tenantId = :tenantId
GROUP BY confidence_bucket;
```

---

## 6️⃣ MODEL STRATEGY (HIGH-LEVEL)

### Model Selection Criteria

**Use a general-purpose LLM:**

| Requirement | Why |
|-------------|-----|
| **No fine-tuning on patient data** | Privacy, HIPAA compliance |
| **No model memory** | Each request stateless |
| **No cross-user learning** | Tenant isolation |
| **HIPAA-compliant API** | OpenAI, Anthropic, or similar with BAA |

**Recommended Models (as of Jan 2026):**
- OpenAI GPT-4 (with BAA)
- Anthropic Claude 3 (with BAA)
- Google Med-PaLM (if HIPAA-compliant API available)

**Not Recommended:**
- Open-source models self-hosted (maintenance burden, accuracy risk)
- Older models (GPT-3.5, etc.) - insufficient accuracy
- Specialized medical models without validation

---

### Prompt Engineering Strategy

**System Prompt (Template):**

```
You are an AI assistant for clinical documentation in Dr Amal Clinical OS.

CONSTRAINTS:
- You provide suggestions only. You have no authority.
- Your output will be reviewed and edited by a licensed healthcare provider.
- Never diagnose. Never prescribe. Never direct treatment.
- Use neutral, suggestive language ("may indicate", "consider", "suggests").
- If context is insufficient, refuse and explain briefly.
- If confidence is low (<70%), indicate clearly.

TASK:
Generate a SOAP note draft based on the session transcript below.

CONTEXT:
- Patient: [demographics]
- Session Date: [date]
- Transcript: [transcript text]

OUTPUT:
Provide Subjective, Objective, Assessment, and Plan sections.
Include confidence level (high/medium/low).
```

**Why Template:**
- Consistent AI behavior
- Enforces neutral language
- Explicit refusal conditions
- Clear task definition

---

### Retrieval-Augmented Generation (RAG)

**Allowed RAG Sources:**

✅ **Medical Reference Texts**
- ICD-10 codes and descriptions
- Standard medication dosing guidelines
- Clinical practice guidelines (e.g., AHA, ADA)

✅ **Internal Knowledge Base**
- Common SOAP templates (de-identified)
- Clinic-specific protocols (non-patient)

**Forbidden RAG Sources:**

❌ **Patient Historical Data**
- Do NOT retrieve notes from other patients
- Do NOT retrieve cross-patient patterns
- Privacy violation

❌ **Cross-Tenant Data**
- Do NOT retrieve data from other clinics

**RAG Implementation:**

- Vector database (Pinecone, Weaviate, or PostgreSQL pgvector)
- Index medical reference texts only
- No patient-specific documents
- Query at inference time, inject into prompt

---

### No Autonomous Tools

**AI CANNOT:**

❌ Call functions to save data  
❌ Call functions to issue prescriptions  
❌ Call functions to finalize notes  
❌ Execute code  
❌ Access external APIs (except read-only medical references)  

**AI CAN:**

✅ Generate text  
✅ Query vector database (medical references)  
✅ Return structured JSON  

**Why:** Tool use gives AI agency. AI must have ZERO agency in this system.

---

### No Memory Between Sessions

**Each AI Request is Stateless:**

- AI does not remember previous suggestions
- AI does not learn from provider feedback
- AI does not store user preferences

**Why:**
- Privacy (no cross-session data leakage)
- Simplicity (no complex state management)
- Safety (no drift from desired behavior)

**Exception:**
- Per-request context (session transcript, recent notes) is prepared fresh each time
- No persistent memory, only scoped context

---

## 7️⃣ SAFETY & FAILURE MODES (DESIGNED)

### When AI Must Refuse

**Scenario 1: Insufficient Context**

**Trigger:** Session transcript is empty or too short (<50 words)

**AI Response:**
```json
{
  "suggestionId": null,
  "confidence": "very_low",
  "content": null,
  "reasoning": "Session transcript is too brief to generate a reliable SOAP note.",
  "disclaimer": "Please complete the note manually or add more session details."
}
```

**UI Action:** Show message, disable AI button.

---

**Scenario 2: Low Confidence**

**Trigger:** AI model returns confidence <50%

**AI Response:**
```json
{
  "suggestionId": null,
  "confidence": "very_low",
  "content": null,
  "reasoning": "The available context does not provide sufficient information for a confident suggestion.",
  "disclaimer": "AI cannot assist with this request. Please complete manually."
}
```

**UI Action:** Show message, suggest manual completion.

---

**Scenario 3: Ambiguous Medical Context**

**Trigger:** AI detects conflicting information (e.g., transcript mentions both "normal BP" and "hypertensive crisis")

**AI Response:**
```json
{
  "suggestionId": "uuid",
  "confidence": "low",
  "content": { ... },
  "reasoning": "Transcript contains potentially conflicting information. Review carefully.",
  "disclaimer": "AI detected ambiguity. Verify all details before accepting."
}
```

**UI Action:** Show suggestion with prominent orange warning.

---

**Scenario 4: External AI Service Unavailable**

**Trigger:** OpenAI/Anthropic API returns 5xx error or timeout

**Backend Response:**
```json
{
  "errorCode": "AI_SERVICE_UNAVAILABLE",
  "message": "AI service is temporarily unavailable. Try again later.",
  "severity": "warning"
}
```

**UI Action:** Show error message, disable AI button temporarily.

---

**Scenario 5: Rate Limit Exceeded**

**Trigger:** Provider exceeds 10 AI requests/minute

**Backend Response:**
```json
{
  "errorCode": "AI_RATE_LIMIT_EXCEEDED",
  "message": "AI request limit exceeded. Try again in 60 seconds.",
  "severity": "warning",
  "retryAfter": 60
}
```

**UI Action:** Disable AI button for 60 seconds, show countdown.

---

### Safety Guardrails

**Pre-Request Validation:**

1. User is `active` and `role = provider`
2. Patient exists and belongs to same tenant
3. Session exists (if applicable) and belongs to patient
4. User has not exceeded rate limit

**If ANY fails → Reject before calling AI model**

---

**Post-Response Validation:**

1. AI response contains required fields (`confidence`, `content`, `reasoning`)
2. Confidence is valid (0.0 - 1.0)
3. Content does not contain prohibited language ("diagnose with", "prescribe", etc.)

**If ANY fails → Return error, do NOT show suggestion**

---

**Prohibited Language Filter:**

**Block AI responses containing:**

- Definitive diagnostic language: "Patient has [disease]"
- Treatment directives: "Prescribe [medication]"
- Urgent action commands: "Send to ER immediately"
- Legal/billing advice: "Code as E11.9"

**If detected → Reject response, log as safety event**

---

## 8️⃣ RATE LIMITS & COST CONTROL (STRICT)

### Per-User Rate Limits

| Window | Limit | Applies To |
|--------|-------|-----------|
| **Per Minute** | 10 requests | Individual provider |
| **Per Hour** | 100 requests | Individual provider |
| **Per Day** | 500 requests | Individual provider |

**Enforcement:**
- Tracked by `userId`
- Redis or in-memory cache
- Return 429 if exceeded

---

### Per-Tenant Rate Limits

| Window | Limit | Applies To |
|--------|-------|-----------|
| **Per Day** | 5,000 requests | Entire clinic |

**Why:** Prevent runaway costs if one provider abuses AI

**Enforcement:**
- Tracked by `tenantId`
- Alert admin if approaching limit
- Block if exceeded

---

### Session-Based Quotas (Optional Future)

**Concept:** Limit AI to N requests per session

**Example:**
- Allow 3 AI suggestions per `draft` note
- After 3, disable AI for that note
- Prevents provider from spamming "regenerate" button

**Implementation:** Track in backend, reset when note finalized

---

### No Background AI Calls

**Forbidden:**

❌ Preemptive AI generation (before user clicks button)  
❌ Background AI analysis of all sessions  
❌ Nightly AI batch jobs on patient data  

**Allowed:**

✅ AI invoked ONLY when provider clicks "Suggest with AI"  
✅ Each request is user-initiated  
✅ No automated AI processing  

**Why:**
- Cost control (AI calls are expensive)
- Privacy (AI only accesses data when needed)
- Transparency (provider knows when AI is used)

---

### Cost Estimation

**Assumptions:**
- 100 active providers
- Each provider uses AI 10 times/day
- 1,000 AI requests/day
- Average cost: $0.02/request (GPT-4 API)

**Estimated Cost:**
- $0.02 × 1,000 = $20/day
- $600/month
- $7,200/year

**Cost Controls:**
- Rate limits prevent abuse
- Caching common patterns (medical references)
- Disable AI for tenants exceeding budget (optional)

---

## 9️⃣ IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)

**Tasks:**

1. **AI Gateway Service Setup**
   - Separate service (NestJS or standalone Node.js)
   - Read-only database user
   - Environment variables for AI API keys

2. **Database Schema**
   - `ai_interactions` table (see DATABASE_SCHEMA.md)
   - Indexes on `userId`, `tenantId`, `timestamp`

3. **Access Control**
   - Validate user role (provider only)
   - Validate tenant access
   - Validate patient access

4. **Rate Limiting**
   - Redis-based rate limiter
   - Per-user: 10/min, 100/hour
   - Per-tenant: 5,000/day

**Deliverables:**
- AI Gateway service running locally
- Database schema deployed
- Rate limiting functional

---

### Phase 2: Core AI Integration (Weeks 3-4)

**Tasks:**

5. **Context Preparation Service**
   - Read-only views for patient summary, session transcript, recent notes
   - Scoped to current patient only
   - Max context size: 4,000 tokens

6. **AI Model Integration**
   - OpenAI/Anthropic API client
   - System prompt template
   - Confidence calculation (model-specific)

7. **Response Validation**
   - Schema validation (confidence, content, reasoning)
   - Prohibited language filter
   - Safety checks

8. **Audit Logging**
   - Log every AI request to `ai_interactions` table
   - Log confidence, accepted/dismissed
   - Log failure reasons

**Deliverables:**
- AI can generate draft SOAP note suggestions
- Confidence levels calculated
- All interactions logged

---

### Phase 3: Frontend Integration (Weeks 5-6)

**Tasks:**

9. **AI Button in Draft Notes**
   - "Suggest with AI" button visible only in `draft` state
   - Button disabled for `finalized` notes

10. **UI States**
    - Idle, Generating, Suggestion Ready, Confidence Low
    - Loading spinner during generation
    - Suggestion box with Accept/Edit/Dismiss buttons

11. **Suggestion Review Flow**
    - Display AI suggestion with confidence badge
    - Allow editing before acceptance
    - Dismiss button logs to backend

12. **Error Handling**
    - Show user-friendly errors (rate limit, service unavailable)
    - Retry logic (max 1 retry, no auto-retry)

**Deliverables:**
- AI suggestion flow functional in frontend
- Provider can accept, edit, dismiss
- UI matches AI_ASSISTANT_SPEC.md

---

### Phase 4: Additional Use Cases (Weeks 7-8)

**Tasks:**

13. **Session Summaries**
    - AI summarizes completed sessions
    - Non-authoritative, informational only

14. **Lab Result Explanations**
    - AI explains lab results in neutral language
    - Shown only for `received` or `reviewed` labs

15. **Overview Insights** (Optional)
    - AI generates non-clinical insights for dashboard
    - Low priority, can defer

**Deliverables:**
- 3 AI use cases functional (draft notes, session summaries, lab explanations)
- All use human-in-the-loop pattern

---

### Phase 5: Safety & Monitoring (Weeks 9-10)

**Tasks:**

16. **Admin Dashboard for AI Usage**
    - Query ai_interactions table
    - Show acceptance rate, confidence distribution
    - Alert if acceptance rate drops below 50% (quality issue)

17. **Safety Testing**
    - Test with ambiguous transcripts
    - Test with insufficient context
    - Verify AI refuses when confidence low

18. **Cost Monitoring**
    - Track AI API costs per tenant
    - Alert if costs exceed budget
    - Dashboard showing daily/monthly spend

19. **Documentation**
    - Provider training: How to use AI suggestions safely
    - Admin guide: Monitoring AI usage and costs

**Deliverables:**
- Admin can monitor AI usage
- Safety mechanisms validated
- Cost tracking functional

---

## 🔟 VENDOR CONSIDERATIONS (NON-BINDING)

### AI API Providers

| Provider | Pros | Cons |
|----------|------|------|
| **OpenAI (GPT-4)** | Industry-leading accuracy, HIPAA BAA available | Expensive ($0.03/1K tokens), API rate limits |
| **Anthropic (Claude 3)** | Strong safety features, HIPAA BAA available | Slightly higher latency |
| **Google (Med-PaLM)** | Medical-specific training | Limited availability, may not have public API |

**Recommendation:** Start with OpenAI GPT-4, plan for multi-provider fallback.

---

### Vector Database (for RAG)

| Option | Pros | Cons |
|--------|------|------|
| **PostgreSQL pgvector** | Already using Postgres, simple | Slower than dedicated vector DBs |
| **Pinecone** | Fast, managed, easy to use | Additional cost, vendor lock-in |
| **Weaviate** | Open-source, flexible | Self-hosted complexity |

**Recommendation:** Start with pgvector (simplicity), migrate to Pinecone if needed.

---

### Secrets Management

**AI API keys must be:**
- Stored in environment variables (dev)
- Migrated to Vault/AWS Secrets Manager (prod)
- Rotated quarterly
- Never committed to version control

---

## ANTI-PATTERNS (FORBIDDEN)

### ❌ Autonomous AI Agents

```
// BAD: AI can call tools to save data
ai.runAgent({
  tools: [saveNote, issuePrescription]  // ❌ NO
})
```

**Why:** AI has no authority. Human must approve all actions.

---

### ❌ Cross-Patient Learning

```
// BAD: Fine-tune AI on patient notes
fineTuneModel({
  trainingData: allPatientNotes  // ❌ Privacy violation
})
```

**Why:** Patient data must not train models (HIPAA, privacy).

---

### ❌ Silent AI Actions

```
// BAD: AI auto-accepts its own suggestions
if (ai.confidence > 0.9) {
  autoAcceptSuggestion()  // ❌ No human review
}
```

**Why:** Human-in-the-loop is mandatory, even for high confidence.

---

### ❌ Unbounded Context

```
// BAD: Send entire patient history to AI
context = getAllNotesForPatient(patientId)  // ❌ Too much data
```

**Why:** Privacy risk, cost explosion, context limits.

**Instead:** Last 5 notes, last 30 days only.

---

## PHILOSOPHY (LOCKED)

### AI Assists, Never Replaces

> "A provider using AI is still a provider making decisions. The AI has no authority, no memory, no agenda. It offers suggestions that can be dismissed without consequence."

### Trust Through Restraint

> "Trust is built by showing what AI will NOT do. AI will not diagnose. AI will not prescribe. AI will not finalize. AI will refuse when uncertain. This restraint makes AI trustworthy."

### Safety Beats Intelligence

> "An AI that refuses 20% of requests (low confidence) is safer than an AI that always answers. Silence is preferred over hallucination. Manual work is preferred over incorrect AI output."

### Human-in-the-Loop is Absolute

> "Every AI suggestion stops at the provider. The provider reviews, edits, or dismisses. There are no exceptions. Not for high confidence. Not for urgency. Not for convenience. Human approval is mandatory."

### Auditability is Non-Negotiable

> "Every AI interaction is logged. When invoked, what context, what confidence, whether accepted. If regulators ask 'How was AI used?', we can answer precisely. No black boxes."

---

## FINAL CHECKLIST

### Before Deploying AI to Production

- [ ] AI Gateway uses read-only database user (verified)
- [ ] AI cannot call write endpoints (verified)
- [ ] Rate limiting enforced (10/min per user)
- [ ] Audit logging functional (ai_interactions table)
- [ ] Confidence levels calculated and displayed
- [ ] Human-in-the-loop flow enforced (no auto-accept)
- [ ] Prohibited language filter active
- [ ] Error handling for AI service unavailable
- [ ] Cost monitoring dashboard functional
- [ ] Provider training completed
- [ ] Admin monitoring dashboard functional
- [ ] HIPAA BAA signed with AI API provider
- [ ] Security review completed
- [ ] Load testing completed (1,000 requests/day)

**If ANY checkbox is unchecked → Do NOT deploy.**

---

**Last Updated:** January 14, 2026  
**Status:** AI Implementation Plan Complete  
**Integration:** Aligns with AI_ASSISTANT_SPEC.md, BACKEND_ARCHITECTURE.md, DATABASE_SCHEMA.md, TECH_STACK_VALIDATION.md  
**Next Step:** Phase 1 implementation (AI Gateway service setup)
