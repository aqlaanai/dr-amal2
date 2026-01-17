# QUICK REFERENCE — Dr Amal Clinical OS v2.0

**Last Updated:** January 17, 2026

---

## 🎯 3 CRITICAL ISSUES

| Issue | Status | Impact | Fix Time |
|-------|--------|--------|----------|
| Test Database Adapter | 🔴 BLOCKING | Can't run tests | 30 min |
| Test Expectations | 🔴 BLOCKING | 41% tests failing | 1-2 hours |
| Frontend Data Pages | 🟡 HIGH | No data display | 8-12 hours |

---

## 📊 CURRENT METRICS

```
Backend:          ✅ 100% (21/21 routes, 9/9 services, 7/7 tables)
Frontend Auth:    ✅ 100% (sign in/up, protected routes, token mgmt)
Frontend Pages:   🔶 12% (pages created, no data display)
Tests:            🔶 59% (36/61 passing, blocked by adapter)
AI Features:      ❌ 0% (all endpoints return "refused: true")
Documentation:    ✅ 100% (fully organized and current)
```

---

## 🔧 QUICK FIX CHECKLIST

### Fix #1: Prisma Adapter (30 min) 🔴
```bash
# File: __tests__/utils/test-helpers.ts
# Change SQLite to PostgreSQL

# Before
const adapter = new PrismaBetterSqlite3({ url: './test.db' })

# After
testPrisma = new PrismaClient() // Uses DATABASE_URL
```

### Fix #2: Test Enum Values (15 min) 🔴
```bash
# File: __tests__/utils/test-helpers.ts
# Update AccountStatus enum

# Before
accountStatus: AccountStatus.CREATED

# After
accountStatus: 'active'
```

### Fix #3: Status Codes (15 min) 🔴
```bash
# Pattern: Change 400 → 409 for conflicts
# Example: already finalized note

# Before
expect(response.status).toBe(400)

# After
expect(response.status).toBe(409)
```

### Fix #4: Remove Old Fields (15 min) 🔴
```bash
# Remove these fields (no longer in User schema)
- first_name
- last_name
- user_id (rename to actor_id in AuditLog)
```

---

## 🚀 EXECUTION FLOW

### Today (1-2 hours)
```
1. npm test                          ← See current status
2. Fix test database setup           ← 30 min
3. Fix test expectations             ← 1-2 hours
4. npm test                          ← Should see 80%+ passing
5. git commit && git push
```

### This Week (12 hours)
```
Day 1-2: Fix tests (2 hours)
Day 2-3: Build frontend pages (8 hours)
Day 4:   Add AI features (4-8 hours)
Day 5:   Polish & launch prep
```

---

## 📁 KEY FILES

| File | Purpose | Status |
|------|---------|--------|
| [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md) | Quick overview | ✅ Read first |
| [FULL_PROJECT_STATUS_REPORT.md](FULL_PROJECT_STATUS_REPORT.md) | Complete details | ✅ Reference |
| [IMMEDIATE_ACTION_PLAN.md](IMMEDIATE_ACTION_PLAN.md) | Step-by-step guide | ✅ Implementation |
| `__tests__/utils/test-helpers.ts` | Test database setup | ❌ Needs fixes |
| `src/app/api/` | 21 API routes | ✅ Production |
| `src/app/patients/` | Patients page | 🔶 Needs data |
| `src/app/notes/` | Notes page | 🔶 Needs data |

---

## 💻 COMMANDS

### Run Tests
```bash
npm test
# Expected: 36/61 currently passing
# Target: 49+/61 after fixes
```

### Run Dev Server
```bash
npm run dev
# Runs on http://localhost:3001
```

### Build
```bash
npm run build
# Should pass with 0 errors
```

### Seed Database
```bash
npm run seed
# Creates test data
```

### Check API Health
```bash
curl http://localhost:3001/api/health/liveness
# Should return: { status: "ok" }
```

---

## 🔑 API ENDPOINTS (Summary)

### Auth (4)
```
POST   /api/auth/signup              ← Create account
POST   /api/auth/signin              ← Get tokens
POST   /api/auth/refresh             ← Rotate tokens
POST   /api/auth/logout              ← Invalidate session
```

### Read (5)
```
GET    /api/patients                 ← List patients
GET    /api/patients/:id             ← Get patient
GET    /api/lab-results              ← List labs
GET    /api/lab-results/:id          ← Get lab
GET    /api/overview                 ← Dashboard
```

### Write (6)
```
POST   /api/notes                    ← Create draft note
PATCH  /api/notes/:id                ← Update draft note
POST   /api/notes/:id/finalize       ← Finalize note
POST   /api/prescriptions            ← Create draft Rx
POST   /api/prescriptions/:id/issue  ← Issue Rx
POST   /api/sessions/:id/transition  ← Transition session
```

### AI (3)
```
POST   /api/ai/generate-note         ← Generate note suggestion
POST   /api/ai/explain-lab           ← Explain lab result
POST   /api/ai/suggest-diagnosis     ← Suggest diagnosis
```

---

## 🧬 DATABASE SCHEMA (Quick View)

```
User
├── id (UUID)
├── email (unique)
├── name
├── role (Patient|Provider|Admin)
├── accountStatus (active|suspended|deleted)
└── password (hashed)

Patient
├── id (UUID)
├── userId (FK)
├── dateOfBirth
├── gender
└── accountStatus

LiveSession
├── id (UUID)
├── patientId (FK)
├── providerId (FK)
├── status (scheduled|waiting|active|completed|archived)
└── timestamps

ClinicalNote
├── id (UUID)
├── sessionId (FK)
├── providerId (FK)
├── content
├── status (draft|finalized)
└── [IMMUTABLE after finalized]

Prescription
├── id (UUID)
├── sessionId (FK)
├── providerId (FK)
├── medication
├── status (draft|issued)
└── [IMMUTABLE after issued]

LabResult
├── id (UUID)
├── patientId (FK)
├── testName
├── result
└── normalRange

AuditLog [APPEND-ONLY]
├── id (UUID)
├── actorId (FK to User)
├── action (create|read|update|delete)
├── resource (table name)
└── timestamp
```

---

## 🎓 ARCHITECTURE PATTERNS

### Service Layer Pattern
```typescript
// All CRUD goes through services, never direct Prisma
class PatientService {
  async getPatient(id: string) {
    return this.repository.findById(id)
  }
}
```

### State Machine Pattern
```typescript
// Enforce one-way transitions
const TRANSITIONS = {
  draft: ['finalized'],        // Note
  scheduled: ['waiting'],      // Session
  draft: ['issued']            // Prescription
}
```

### Authorization Pattern
```typescript
// Every endpoint checks role/ownership
if (user.role === 'patient' && user.id !== record.userId) {
  throw new ForbiddenError()
}
```

---

## ✅ DONE CRITERIA

**Phase 1 (Today):**
- [ ] Tests running without adapter errors
- [ ] 49+/61 tests passing
- [ ] All fixes committed

**Phase 2 (This Week):**
- [ ] All frontend pages show data
- [ ] CRUD workflows tested end-to-end
- [ ] No console errors

**Phase 3 (Production):**
- [ ] 100% tests passing
- [ ] AI features working
- [ ] Load testing passed
- [ ] Security audit passed

---

## 🆘 TROUBLESHOOTING

**Tests Won't Run**
```
Problem: PrismaClientInitializationError
Fix: Update __tests__/utils/test-helpers.ts to use postgres
```

**API Not Responding**
```
Problem: Connection refused on port 3000
Fix: npm run dev (ensure running)
```

**Auth Not Working**
```
Problem: 401 Unauthorized on protected routes
Fix: Check localStorage for token, ensure JWT valid
```

**Database Errors**
```
Problem: Foreign key violations in tests
Fix: Ensure test data has valid relationships (userId must exist)
```

---

## 📞 WHO TO CONTACT

| Issue | Owner | Time |
|-------|-------|------|
| Test fixes | Backend team | 1-2 hours |
| Frontend pages | Frontend team | 8-12 hours |
| AI features | Backend/AI team | 4-8 hours |
| Deployment | DevOps | 2-4 hours |

---

## 🎯 ONE-PAGE ACTION

```
1. Read EXECUTIVE_SUMMARY.md (5 min)
2. Read IMMEDIATE_ACTION_PLAN.md (10 min)
3. Fix test database adapter (30 min)
4. Fix test expectations (1 hour)
5. Build frontend pages (8-12 hours)
6. Ship to production 🚀
```

---

**Status:** Ready to execute  
**Confidence:** High  
**Risk:** Low  
**Timeline:** 15-20 hours to production  

See detailed docs in `docs/` directory.
