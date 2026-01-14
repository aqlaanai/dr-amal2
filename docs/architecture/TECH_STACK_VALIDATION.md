# Tech Stack Validation — Dr Amal Clinical OS v2.0

**Purpose:** Validate technology choices against clinical system requirements.

**Scope:** Stack validation only. No code. No setup. No optimization.

**Philosophy:** Boring > Clever. Explicit > Magical. Safe > Fast.

---

## VALIDATION CRITERIA (NON-NEGOTIABLE)

Every technology must support:

✅ **Immutability Enforcement**  
- Can finalized records be protected?
- Can audit logs be made append-only?
- Are there database-level safeguards?

✅ **Audit Logging**  
- Can every critical action be logged?
- Can logs be tamper-resistant?
- Are timestamps reliable and consistent?

✅ **Role & State Enforcement**  
- Can role-based access be enforced at middleware level?
- Can state-based access be validated before mutations?
- Are authorization rules explicit, not inferred?

✅ **AI Read-Only Constraints**  
- Can AI be isolated from write operations?
- Can AI access be scoped to current patient/session?
- Can AI requests be rate-limited and audited?

✅ **Multi-Tenant Isolation**  
- Can tenant boundaries be enforced at query level?
- Can tokens be scoped to single tenant?
- Can data leakage be prevented?

---

## 1️⃣ BACKEND FRAMEWORK: NestJS

### Proposed Choice
**NestJS** (Node.js framework with TypeScript)

### Why It Fits

✅ **Clear Domain Boundaries**
- Built-in module system enforces separation
- Services are explicit, not magical
- Dependency injection makes domain isolation clean

✅ **Service-Level Enforcement**
- Guards for authentication
- Interceptors for authorization
- Pipes for validation
- All enforce rules before reaching business logic

✅ **Middleware Support**
- Request logging
- Audit trail capture
- Tenant context injection
- Rate limiting

✅ **TypeScript Native**
- Compile-time type safety
- Explicit contracts between layers
- Matches frontend (both TypeScript)

✅ **Mature & Boring**
- Enterprise-proven
- Large community
- Not experimental

### Risks

⚠️ **Node.js Single-Threaded**
- Long-running AI requests could block event loop
- **Mitigation:** Run AI Gateway as separate service, not in main app

⚠️ **Decorator Magic**
- Can hide business logic in decorators
- **Mitigation:** Keep decorators for framework concerns only (auth, validation), not domain logic

⚠️ **Over-Engineering Temptation**
- NestJS supports complex patterns (microservices, GraphQL, etc.)
- **Mitigation:** Start simple. Use REST. No microservices until justified.

### Safe Configuration Defaults

```typescript
// ✅ GOOD: Explicit module boundaries
@Module({
  imports: [ClinicalNotesModule],  // Explicit dependencies
  providers: [AuthService],
  exports: [AuthService]
})
```

```typescript
// ✅ GOOD: Guards enforce authorization
@UseGuards(RoleGuard, StateGuard)
@Post('notes/:id/finalize')
finalizeNote() { ... }
```

```typescript
// ❌ BAD: Business logic in decorators
@AutoFinalizeIfComplete()  // ❌ Domain logic hidden
@Post('notes/:id')
```

### Verdict

**✅ APPROVED**

NestJS fits the requirement for:
- Clear domain boundaries
- Middleware-based enforcement
- Explicit service layer
- TypeScript safety

**Conditions:**
- AI Gateway runs as separate service
- Keep decorators for framework concerns only
- No microservices, GraphQL, or other complexity until justified

---

## 2️⃣ DATABASE: PostgreSQL

### Proposed Choice
**PostgreSQL** (Relational database)

### Why It Fits

✅ **Immutability Enforcement**
- Row-level triggers can block updates on finalized records
- CHECK constraints enforce state machine values
- Constraints are enforced at database level, not just application

```sql
-- Trigger to prevent updates on finalized notes
CREATE TRIGGER prevent_finalized_note_updates
BEFORE UPDATE ON clinical_notes
FOR EACH ROW
WHEN (OLD.status IN ('finalized', 'archived'))
EXECUTE FUNCTION reject_immutable_update();
```

✅ **Append-Only Audit Logs**
- Triggers can prevent UPDATE/DELETE on audit_logs table
- Write-ahead log (WAL) provides tamper detection
- Partitioning supports 7-year retention efficiently

✅ **Multi-Tenant Isolation**
- Row-level security (RLS) can enforce tenant boundaries
- Indexes on tenantId optimize tenant-scoped queries
- Schema per tenant (optional, if needed)

✅ **ACID Guarantees**
- Transactions ensure state transitions are atomic
- No partial updates
- Consistent state always

✅ **Mature & Boring**
- 30+ years of production use
- Medical systems trust it
- Not experimental

✅ **JSON Support**
- JSONB for audit log metadata
- Indexable, queryable
- Doesn't force everything into JSON (like MongoDB would)

### Risks

⚠️ **Performance at Scale**
- Large tables (millions of audit logs) need partitioning
- **Mitigation:** Partition audit_logs by month, archive after 7 years

⚠️ **Connection Pooling**
- Each request needs a connection
- **Mitigation:** Use connection pooler (PgBouncer or built-in pooling)

⚠️ **Developer Temptation**
- Developers might bypass schema with JSONB blobs
- **Mitigation:** Code review policy: JSONB only for truly unstructured data (audit metadata)

### Safe Configuration Defaults

**1. Enable Row-Level Security (RLS)**
```sql
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON clinical_notes
FOR ALL
TO app_user
USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**2. Immutability Triggers**
```sql
CREATE FUNCTION reject_immutable_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Record is immutable';
END;
$$ LANGUAGE plpgsql;
```

**3. Audit Log Protection**
```sql
-- No UPDATE or DELETE allowed
CREATE TRIGGER protect_audit_logs_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION reject_immutable_update();

CREATE TRIGGER protect_audit_logs_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION reject_immutable_update();
```

**4. Connection Pooling**
```
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
```

### Verdict

**✅ APPROVED**

PostgreSQL fits the requirement for:
- Immutability enforcement (triggers + constraints)
- Audit log safety (append-only via triggers)
- Multi-tenant isolation (RLS + indexes)
- ACID guarantees

**Conditions:**
- Enable Row-Level Security for tenant isolation
- Implement immutability triggers on finalized tables
- Partition audit_logs by month
- Use JSONB only for metadata, not core data

---

## 3️⃣ AUTH: JWT + Refresh Tokens

### Proposed Choice
**JWT (JSON Web Tokens) + Refresh Token Rotation**

### Why It Fits

✅ **Stateless Access Tokens**
- No database lookup per request
- Role, tenant, status embedded in token
- Fast authorization checks

✅ **Token Scoping**
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

✅ **Refresh Token Rotation**
- Short-lived access tokens (15 minutes)
- Refresh tokens rotate on use (prevents reuse)
- Stolen refresh tokens expire quickly

✅ **Revocation**
- Refresh tokens stored in database
- Can be revoked immediately (password change, account lock)
- Access tokens expire naturally (15 min)

### Risks

⚠️ **Token Leakage**
- If access token stolen, valid for 15 minutes
- **Mitigation:** Short expiration (15 min), HTTPS only, HttpOnly cookies

⚠️ **Refresh Token Storage**
- Storing refresh tokens in database creates state
- **Mitigation:** Index on userId + expiresAt for fast lookups

⚠️ **Clock Skew**
- JWT expiration relies on server time
- **Mitigation:** Use NTP, accept small clock skew (±30 seconds)

### Safe Configuration Defaults

**Access Token (JWT):**
```typescript
{
  algorithm: 'HS256',  // or RS256 for public/private key
  expiresIn: '15m',
  issuer: 'dr-amal-api',
  audience: 'dr-amal-web'
}
```

**Refresh Token:**
```typescript
{
  length: 32,  // Random bytes
  expiresIn: '7d',
  rotation: true,  // New token issued on refresh
  reuseDetection: true  // Revoke family if reuse detected
}
```

**Security Headers:**
```typescript
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
}
```

### Verdict

**✅ APPROVED**

JWT + Refresh Tokens fit the requirement for:
- Stateless authorization (role + tenant in token)
- Token scoping (tenant isolation)
- Revocation (refresh tokens in database)

**Conditions:**
- Access tokens expire in 15 minutes
- Refresh tokens rotate on use
- Refresh tokens stored in database with revocation
- HTTPS only, HttpOnly cookies

---

## 4️⃣ ORM / DATA ACCESS LAYER

### Candidates

**Option A: Prisma**  
**Option B: TypeORM**  
**Option C: Raw SQL (pg library)**

---

### Option A: Prisma

**Pros:**

✅ **Type-Safe Queries**
- Generated types from schema
- Compile-time query validation
- No runtime surprises

✅ **Schema-First**
- Schema defined in `schema.prisma`
- Migrations generated from schema
- Single source of truth

✅ **Tenant Scoping**
```typescript
// Middleware to inject tenantId on all queries
prisma.$use(async (params, next) => {
  if (params.model && params.action !== 'findUnique') {
    params.args.where = { ...params.args.where, tenantId }
  }
  return next(params)
})
```

✅ **Audit Logging**
```typescript
// Middleware to capture all mutations
prisma.$use(async (params, next) => {
  const result = await next(params)
  if (['create', 'update', 'delete'].includes(params.action)) {
    await auditLog.create({ ... })
  }
  return result
})
```

**Cons:**

⚠️ **Immutability Enforcement**
- No built-in way to block updates on finalized records
- Must check in middleware or service layer
- Can't rely on Prisma alone

⚠️ **Migration Complexity**
- Custom triggers/functions require raw SQL
- Prisma migrations can't express everything

⚠️ **Query Flexibility**
- Complex queries need raw SQL fallback
- Aggregations can be awkward

**Verdict for Prisma:**

**✅ APPROVED WITH CAUTION**

Prisma works if:
- Immutability checked at service layer (not just Prisma)
- Complex triggers written as raw SQL migrations
- Team comfortable with Prisma limitations

---

### Option B: TypeORM

**Pros:**

✅ **Decorator-Based Entities**
```typescript
@Entity()
class ClinicalNote {
  @Column()
  status: 'draft' | 'finalized' | 'archived'
  
  @BeforeUpdate()
  validateImmutability() {
    if (this.status === 'finalized') {
      throw new ImmutableEntityError()
    }
  }
}
```

✅ **Migration Control**
- Full control over SQL migrations
- Can add triggers, RLS, etc.
- Not abstracted away

✅ **Query Builder**
- More flexible than Prisma
- Still type-safe
- Handles complex queries

**Cons:**

⚠️ **Decorator Magic**
- Business logic in decorators (like BeforeUpdate)
- Can hide critical enforcement
- Conflicts with "explicit > magical" principle

⚠️ **Migration Drift**
- Entities and migrations can drift
- TypeORM generates migrations, but they need review

⚠️ **Community Concerns**
- Less active than Prisma
- Breaking changes in major versions

**Verdict for TypeORM:**

**⚠️ APPROVED WITH CONDITIONS**

TypeORM works if:
- Decorators used ONLY for schema, not business logic
- Immutability enforced in service layer, not BeforeUpdate hooks
- Migrations reviewed carefully

---

### Option C: Raw SQL (pg library)

**Pros:**

✅ **Full Control**
- Write exact SQL you want
- No abstraction leaks
- No ORM surprises

✅ **Explicit**
- Every query is visible
- No hidden queries
- No magic

✅ **Performance**
- Optimal queries
- No N+1 problems
- No unnecessary joins

**Cons:**

⚠️ **Type Safety**
- No compile-time query validation
- Must write types manually
- Runtime errors possible

⚠️ **Boilerplate**
- Manual query building
- Manual parameter binding
- More code to maintain

⚠️ **Migration Management**
- Need separate migration tool (node-pg-migrate, db-migrate)
- No schema sync validation

**Verdict for Raw SQL:**

**✅ APPROVED FOR MISSION-CRITICAL DOMAINS**

Raw SQL works best for:
- Clinical notes (immutability critical)
- Prescriptions (immutability critical)
- Audit logs (append-only critical)

Can use ORM for:
- Patient registry (CRUD-heavy)
- Users (CRUD-heavy)
- Sessions (state transitions, but less critical)

---

### Recommendation: Hybrid Approach

**Use Prisma for CRUD domains:**
- Users
- Patients
- Referrals

**Use Raw SQL for immutability-critical domains:**
- Clinical Notes
- Prescriptions
- Audit Logs

**Why:**
- Prisma handles 80% of queries cleanly
- Raw SQL gives absolute control for 20% that matters most
- Both can coexist in NestJS

**Trade-Off:**
- Slightly more complexity (two query methods)
- Gain: Safety where it matters, speed where it doesn't

### Final Verdict: ORM/Data Access

**✅ APPROVED: Hybrid (Prisma + Raw SQL)**

**Conditions:**
- Prisma for CRUD-heavy tables
- Raw SQL for immutability-critical tables
- Service layer enforces immutability, not ORM alone
- All migrations reviewed manually

---

## 5️⃣ AI GATEWAY (READ-ONLY)

### Proposed Architecture

```
┌──────────────────────┐
│  AI Gateway Service  │
│  (Separate from API) │
└──────────┬───────────┘
           │
           ↓ (HTTP/gRPC)
┌──────────────────────┐
│  External AI Model   │
│  (OpenAI, etc.)      │
└──────────────────────┘
```

### Why It Fits

✅ **Isolation**
- AI Gateway is separate service
- Main API never calls AI directly
- AI cannot call main API

✅ **Read-Only Access**
- AI Gateway has database connection with read-only user
- Database user permissions: SELECT only
- No INSERT, UPDATE, DELETE

```sql
-- Read-only database user for AI Gateway
CREATE USER ai_gateway_user WITH PASSWORD 'secure_password';
GRANT SELECT ON clinical_notes, lab_results, live_sessions TO ai_gateway_user;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES FROM ai_gateway_user;
```

✅ **Scoping**
- AI requests include: userId, patientId, sessionId, tenantId
- Gateway validates user has access before preparing context
- AI never sees data from other tenants

✅ **Rate Limiting**
- Separate rate limit for AI requests
- Prevents AI abuse
- Protects API from AI cost explosion

✅ **Auditability**
- Every AI request logged in ai_interactions table
- Confidence level captured
- Acceptance tracked

### Risks

⚠️ **AI Service Latency**
- External AI calls can be slow (1-5 seconds)
- **Mitigation:** Async processing, show loading state to user

⚠️ **AI Service Costs**
- OpenAI/Anthropic APIs cost per token
- **Mitigation:** Rate limiting, caching common patterns (carefully)

⚠️ **Data Privacy**
- Sending patient data to external AI service
- **Mitigation:** Strip PII where possible, encrypt in transit, use HIPAA-compliant AI services

### Safe Configuration Defaults

**Database Connection (Read-Only):**
```typescript
{
  host: 'db.example.com',
  port: 5432,
  user: 'ai_gateway_user',  // ← Read-only user
  password: process.env.AI_DB_PASSWORD,
  database: 'dr_amal',
  max: 5  // Small connection pool
}
```

**Rate Limiting:**
```typescript
{
  windowMs: 60 * 1000,  // 1 minute
  max: 10,  // 10 requests per minute per user
  message: 'AI request limit exceeded. Try again in 60 seconds.'
}
```

**Request Timeout:**
```typescript
{
  timeout: 10000,  // 10 seconds
  retry: false  // Don't retry AI requests (expensive)
}
```

### Verdict

**✅ APPROVED**

AI Gateway fits the requirement for:
- Read-only access (database permissions)
- Isolation (separate service)
- Scoping (tenant + patient validation)
- Auditability (ai_interactions table)

**Conditions:**
- AI Gateway uses read-only database user
- AI requests scoped to current user/patient/session
- Rate limiting: 10 requests/minute per user
- Every AI interaction logged

---

## 6️⃣ FRONTEND STACK (LOCKED)

### Current Choice
**Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS**

### Validation Against Requirements

✅ **Component-Based UI**
- React components match role-based visibility
- Reusable, testable
- Clear boundaries

✅ **State-Driven Views**
- UI reflects backend states exactly
- No client-side state inference
- State machines mirrored in UI

✅ **No Client-Side Business Logic**
- Frontend doesn't validate state transitions
- Frontend doesn't enforce immutability
- All logic delegated to backend

✅ **TypeScript Safety**
- API contracts typed
- State types match backend
- Compile-time validation

✅ **Mature & Boring**
- Next.js: Enterprise-proven
- React: Industry standard
- Tailwind: Stable, not experimental

### Risks

⚠️ **Server Components Confusion**
- Next.js 14 mixes server and client components
- **Mitigation:** Clear 'use client' directives, established pattern

⚠️ **Over-Fetching**
- Server components can over-fetch data
- **Mitigation:** Backend API returns minimal data per role

### Verdict

**✅ APPROVED (Already Locked)**

Frontend stack aligns with:
- Component-based architecture
- State-driven UI
- No client-side business logic
- TypeScript safety

**Conditions:**
- Backend API enforces all rules
- Frontend only displays state, never infers it
- Clear server/client component boundaries

---

## 7️⃣ INFRASTRUCTURE REQUIREMENTS

### Rate Limiting

**Implementation:** NestJS Throttler Module

```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,  // 60 seconds
      limit: 100,  // 100 requests per minute
    })
  ]
})
```

**Per-Endpoint Overrides:**
- Auth endpoints: 5 requests/minute
- AI endpoints: 10 requests/minute
- Write endpoints: 30 requests/minute
- Read endpoints: 100 requests/minute

**Verdict:** ✅ Supported by NestJS

---

### Logging

**Implementation:** Winston (structured logging)

```typescript
{
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
}
```

**What to Log:**
- All HTTP requests (method, path, status, duration)
- Auth failures (email, IP, timestamp)
- State transition errors (entity, attempted transition)
- AI requests (userId, confidence, accepted?)

**What NOT to Log:**
- Passwords
- Access tokens
- Patient PHI (unless encrypted)

**Verdict:** ✅ Winston is mature, flexible

---

### Secrets Management

**Options:**

**Option A: Environment Variables**
- Simple, works everywhere
- Risk: Leaked in logs, version control

**Option B: Vault (HashiCorp)**
- Centralized, rotatable
- Complex setup

**Option C: Cloud-Native (AWS Secrets Manager, GCP Secret Manager)**
- Integrated with cloud
- Vendor lock-in

**Recommendation:** Start with environment variables, migrate to Vault/cloud later.

**Safe Defaults:**
```
# .env (never commit)
DATABASE_URL=postgresql://...
JWT_SECRET=...
AI_API_KEY=...
```

```typescript
// Validation at startup
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}
```

**Verdict:** ✅ Environment variables for MVP, plan migration to Vault

---

### Environment Separation

**Required Environments:**

| Environment | Purpose | Database | AI |
|-------------|---------|----------|-----|
| **Development** | Local dev | Local Postgres | Mock AI |
| **Staging** | Pre-production testing | Separate DB | Real AI (limited) |
| **Production** | Live system | Production DB | Real AI |

**Rules:**
- No production data in dev/staging
- Staging mirrors production config
- Separate API keys per environment

**Verdict:** ✅ Standard practice, supported by NestJS

---

## RISK MATRIX

### High-Risk Areas

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Immutability Bypass** | Legal liability | Enforce at service layer + DB triggers |
| **Cross-Tenant Data Leak** | Privacy violation | Row-Level Security + token scoping |
| **AI Writes to Database** | Data corruption | Read-only DB user for AI Gateway |
| **Audit Log Tampering** | Compliance failure | Append-only triggers + WAL monitoring |

### Medium-Risk Areas

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Token Leakage** | Unauthorized access | Short expiration (15 min), HTTPS only |
| **AI Cost Explosion** | Financial | Rate limiting (10/min), caching |
| **N+1 Query Problems** | Performance | Raw SQL for critical queries |

### Low-Risk Areas

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Developer Confusion (NestJS)** | Slower dev | Clear documentation, code review |
| **Server Component Errors (Next.js)** | UI bugs | 'use client' directives, testing |

---

## SAFE DEFAULTS SUMMARY

### NestJS Backend

```typescript
// Global error handler
app.useGlobalFilters(new HttpExceptionFilter())

// Global validation
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,  // Strip unknown properties
  forbidNonWhitelisted: true,  // Reject unknown properties
  transform: true  // Auto-transform types
}))

// CORS (strict)
app.enableCors({
  origin: process.env.ALLOWED_ORIGIN,  // No wildcards
  credentials: true
})
```

### PostgreSQL

```sql
-- Enable RLS on all multi-tenant tables
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
-- etc.

-- Immutability triggers
CREATE TRIGGER prevent_finalized_note_updates ...
CREATE TRIGGER prevent_issued_prescription_updates ...

-- Audit log protection
CREATE TRIGGER protect_audit_logs_update ...
CREATE TRIGGER protect_audit_logs_delete ...
```

### JWT

```typescript
{
  algorithm: 'HS256',
  expiresIn: '15m',
  issuer: 'dr-amal-api',
  audience: 'dr-amal-web'
}
```

### AI Gateway

```typescript
{
  database: {
    user: 'ai_gateway_user',  // Read-only
    max: 5  // Small pool
  },
  rateLimit: {
    max: 10,  // Per minute
    windowMs: 60000
  },
  timeout: 10000  // 10 seconds
}
```

---

## PHILOSOPHY VALIDATION

### Boring > Clever

✅ **PostgreSQL** - 30+ years old, trusted by hospitals  
✅ **JWT** - Industry standard, not experimental  
✅ **NestJS** - Established patterns, not cutting-edge  
✅ **React** - Industry standard, not trendy framework  

❌ **Avoided:** NoSQL (too flexible), GraphQL (too complex), Microservices (premature)

---

### Explicit > Magical

✅ **SQL Triggers** - Explicit immutability enforcement  
✅ **Service Layer** - Explicit state transition validation  
✅ **Guards** - Explicit authorization checks  
✅ **Raw SQL** - Explicit queries for critical operations  

❌ **Avoided:** ORM magic, auto-corrections, implicit state changes

---

### Safe > Fast

✅ **15-Minute Token Expiry** - Safer than 1-hour  
✅ **Read-Only AI User** - Safer than shared DB user  
✅ **Rate Limiting** - Safer than unlimited requests  
✅ **Immutability Triggers** - Safer than app-only enforcement  

❌ **Avoided:** Long-lived tokens, shared credentials, optimistic locking without validation

---

## FINAL VERDICT

### ✅ APPROVED STACK

| Layer | Technology | Condition |
|-------|-----------|-----------|
| **Backend Framework** | NestJS | Keep simple, no microservices |
| **Database** | PostgreSQL | Enable RLS, immutability triggers |
| **Auth** | JWT + Refresh Tokens | 15-min expiry, rotation |
| **Data Access** | Prisma + Raw SQL (Hybrid) | Raw SQL for critical domains |
| **AI Gateway** | Separate Service | Read-only DB user |
| **Frontend** | Next.js 14 + React 18 | Already locked, no changes |

---

### 🚫 REJECTED OPTIONS

| Technology | Reason |
|-----------|--------|
| **MongoDB** | Too flexible, no schema enforcement |
| **GraphQL** | Too complex, exposes internal structure |
| **Microservices** | Premature, adds complexity |
| **NoSQL for Audit Logs** | ACID guarantees required |
| **Client-Side Routing Only** | Need server-side auth validation |

---

## IMPLEMENTATION PRIORITIES

### Phase 1: Foundation
1. NestJS project skeleton
2. PostgreSQL schema + migrations
3. JWT auth + refresh tokens
4. Prisma setup for CRUD tables

### Phase 2: Critical Domains
5. Clinical Notes (raw SQL + immutability triggers)
6. Prescriptions (raw SQL + immutability triggers)
7. Audit logging (raw SQL + append-only triggers)

### Phase 3: Infrastructure
8. Rate limiting
9. Logging (Winston)
10. Environment separation

### Phase 4: AI Integration
11. AI Gateway (separate service)
12. Read-only DB user
13. AI interaction logging

---

## CONCLUSION

**This stack is boring, safe, and proven.**

✅ PostgreSQL enforces immutability at database level  
✅ NestJS enforces authorization at middleware level  
✅ JWT enforces tenant isolation at token level  
✅ AI Gateway enforces read-only access at permission level  

**No clever shortcuts. No experimental tools. No magic.**

This is a clinical system. Lives depend on it being correct, not fast or trendy.

---

**Last Updated:** January 14, 2026  
**Status:** Tech Stack Validated  
**Integration:** Aligns with BACKEND_ARCHITECTURE.md, DATABASE_SCHEMA.md  
**Next Step:** Implementation planning and task breakdown
