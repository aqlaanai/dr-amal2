# Repository Structure & Conventions — Dr Amal Clinical OS v2.0

**Purpose:** Define production repository structure with strict separation of concerns.

**Scope:** Directory structure, naming conventions, import rules. No code.

**Philosophy:** Structure is governance. Governance prevents accidents. Accidents are unacceptable in clinical systems.

---

## CORE PRINCIPLE

```
┌─────────────────────────────────────────────────────────┐
│  EVERY FOLDER HAS A SINGLE RESPONSIBILITY               │
│  NO UTILS DUMPING GROUNDS                               │
│  NO SHARED MAGIC HELPERS                                │
│  NO CIRCULAR IMPORTS                                    │
│  NO CROSS-DOMAIN LEAKAGE                                │
│                                                         │
│  If a file doesn't clearly belong, it does not exist.  │
└─────────────────────────────────────────────────────────┘
```

---

## TOP-LEVEL STRUCTURE (LOCKED)

```
dr-amal/
├── frontend/              # Next.js web application
├── backend/               # NestJS API server
├── ai/                    # AI Gateway (isolated service)
├── docs/                  # Architecture documentation
├── infra/                 # Infrastructure & deployment
├── .gitignore
├── README.md
└── LICENSE
```

**Rules:**

✅ **Only these 5 top-level folders allowed**
- `frontend/` - Web UI
- `backend/` - API server
- `ai/` - AI Gateway service
- `docs/` - Documentation
- `infra/` - Infrastructure

❌ **Forbidden top-level folders:**
- `shared/` (use package if truly shared)
- `common/` (each service has its own common/)
- `lib/` (vague, dumping ground)
- `utils/` (vague, dumping ground)
- `packages/` (no monorepo until justified)

**No other top-level folders without architectural review.**

---

## 1️⃣ FRONTEND STRUCTURE

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── (auth)/                   # Auth layout group
│   │   │   ├── signin/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/              # Dashboard layout group
│   │   │   ├── layout.tsx            # AppShell wrapper
│   │   │   ├── overview/
│   │   │   │   └── page.tsx
│   │   │   ├── patients/
│   │   │   │   └── page.tsx
│   │   │   ├── schedule/
│   │   │   │   └── page.tsx
│   │   │   ├── sessions/
│   │   │   │   └── page.tsx
│   │   │   ├── notes/
│   │   │   │   └── page.tsx
│   │   │   ├── prescriptions/
│   │   │   │   └── page.tsx
│   │   │   ├── labs/
│   │   │   │   └── page.tsx
│   │   │   ├── imaging/
│   │   │   │   └── page.tsx
│   │   │   ├── referrals/
│   │   │   │   └── page.tsx
│   │   │   ├── admin/
│   │   │   │   └── page.tsx
│   │   │   ├── audit/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── layout/                   # Layout components
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/                     # Auth-specific components
│   │   │   ├── SignInForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   └── VerificationBanner.tsx
│   │   ├── states/                   # State-driven UI components
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── RestrictedState.tsx
│   │   ├── clinical/                 # Clinical workflow components
│   │   │   ├── SOAPNoteEditor.tsx
│   │   │   ├── PrescriptionForm.tsx
│   │   │   ├── LabResultCard.tsx
│   │   │   └── SessionCard.tsx
│   │   ├── ai/                       # AI-related UI components
│   │   │   ├── AISuggestionBox.tsx
│   │   │   ├── ConfidenceIndicator.tsx
│   │   │   └── AIDisclaimerBadge.tsx
│   │   ├── dev/                      # Development-only components
│   │   │   └── RoleSwitcher.tsx
│   │   └── ui/                       # Generic UI primitives
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       └── Modal.tsx
│   │
│   ├── contexts/                     # React contexts
│   │   └── RoleContext.tsx
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useRoleAccess.ts
│   │   └── useAuth.ts
│   │
│   ├── lib/                          # Frontend utilities (strict)
│   │   ├── api-client.ts            # API fetch wrapper
│   │   ├── validators.ts            # Input validation
│   │   └── formatters.ts            # Display formatters
│   │
│   ├── types/                        # TypeScript types
│   │   ├── user.ts
│   │   ├── patient.ts
│   │   ├── session.ts
│   │   ├── clinical-note.ts
│   │   ├── prescription.ts
│   │   ├── lab-result.ts
│   │   ├── referral.ts
│   │   └── api-responses.ts
│   │
│   └── styles/                       # Tailwind & CSS
│       └── globals.css
│
├── public/                           # Static assets
│   ├── icons/
│   └── images/
│
├── .env.local                        # Environment variables (gitignored)
├── .eslintrc.json
├── next.config.js
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

### Frontend Rules (Enforced)

#### 1. Pages (`src/app/`)

**Purpose:** Route definitions only. No business logic.

✅ **Allowed:**
- Route handlers
- Layout wrappers
- Import and render components
- Call API client
- Handle loading/error states

❌ **Forbidden:**
- Direct API calls (use `lib/api-client.ts`)
- State machines (use `components/states/`)
- Role logic (use `hooks/useRoleAccess.ts`)
- Inline styles (use Tailwind or `styles/`)

**Example Violation:**
```typescript
// ❌ BAD: Business logic in page
export default function NotesPage() {
  const [note, setNote] = useState()
  
  // ❌ Direct fetch
  useEffect(() => {
    fetch('/api/notes').then(...)
  }, [])
  
  // ❌ Inline role check
  if (user.role !== 'provider') return <div>Forbidden</div>
}
```

**Correct:**
```typescript
// ✅ GOOD: Delegated to components and hooks
export default function NotesPage() {
  const { hasAccess } = useRoleAccess(['provider'])
  
  if (!hasAccess) return <RestrictedState />
  
  return <ClinicalNotesView />
}
```

---

#### 2. Components (`src/components/`)

**Purpose:** Reusable UI components. Presentation logic only.

**Subfolder Structure:**

| Folder | Purpose | Example |
|--------|---------|---------|
| `layout/` | Page structure components | Sidebar, Header, AppShell |
| `auth/` | Authentication UI | SignInForm, SignUpForm |
| `states/` | State-driven empty/loading/error UI | EmptyState, LoadingState |
| `clinical/` | Clinical workflow UI | SOAPNoteEditor, PrescriptionForm |
| `ai/` | AI-specific UI | AISuggestionBox, ConfidenceIndicator |
| `dev/` | Development-only tools | RoleSwitcher |
| `ui/` | Generic primitives | Button, Input, Card |

✅ **Allowed:**
- Accept props
- Render UI
- Handle local UI state (e.g., modal open/closed)
- Emit events via callbacks

❌ **Forbidden:**
- Direct API calls (pass data as props)
- Global state mutations (use contexts if needed)
- Cross-component imports outside of `ui/`

**Import Rule:**
```typescript
// ✅ GOOD: Import from ui/ or same folder
import { Button } from '@/components/ui/Button'
import { ConfidenceIndicator } from './ConfidenceIndicator'

// ❌ BAD: Import from other domain folders
import { PrescriptionForm } from '@/components/clinical/PrescriptionForm'  // ❌ If you're in auth/
```

---

#### 3. Contexts (`src/contexts/`)

**Purpose:** Global state management (minimal).

✅ **Allowed:**
- User role
- Auth state
- Theme

❌ **Forbidden:**
- Domain data (clinical notes, prescriptions, etc. - fetch on demand)
- API response caching (use SWR or React Query if needed)

**Limit to 3-5 contexts max.**

---

#### 4. Hooks (`src/hooks/`)

**Purpose:** Reusable stateful logic.

✅ **Allowed:**
- Role access checks
- Auth state
- API data fetching (if using SWR pattern)

❌ **Forbidden:**
- Business logic
- State transitions (backend responsibility)

**Naming:** Always prefix with `use` (React convention).

---

#### 5. Lib (`src/lib/`)

**Purpose:** Frontend utilities (strict, minimal).

✅ **Allowed:**
- `api-client.ts` - Centralized fetch wrapper
- `validators.ts` - Input validation (e.g., email format)
- `formatters.ts` - Display formatting (dates, currency)

❌ **Forbidden:**
- Domain logic
- State machines
- "Helper" dumping ground

**Rule:** If it doesn't fit in one of the 3 allowed files, it doesn't belong in `lib/`.

---

#### 6. Types (`src/types/`)

**Purpose:** TypeScript type definitions.

**Structure:**
- One file per domain entity
- Mirror backend API contracts

✅ **Allowed:**
```typescript
// types/clinical-note.ts
export type ClinicalNoteStatus = 'draft' | 'ai_assisted_draft' | 'finalized' | 'archived'

export interface ClinicalNote {
  id: string
  patientId: string
  providerId: string
  status: ClinicalNoteStatus
  subjective: string
  objective: string
  assessment: string
  plan: string
  createdAt: string
  updatedAt: string
}
```

❌ **Forbidden:**
- Functions in type files (types only)
- Enums (use union types instead for better type inference)

---

#### 7. Styles (`src/styles/`)

**Purpose:** Global CSS only.

✅ **Allowed:**
- `globals.css` - Global styles, Tailwind imports

❌ **Forbidden:**
- Component-specific CSS files (use Tailwind classes instead)
- SCSS/SASS (stick to PostCSS + Tailwind)

---

## 2️⃣ BACKEND STRUCTURE

```
backend/
├── src/
│   ├── modules/                      # Domain modules
│   │   ├── identity/
│   │   │   ├── identity.module.ts
│   │   │   ├── identity.service.ts
│   │   │   ├── identity.controller.ts
│   │   │   ├── entities/
│   │   │   │   ├── user.entity.ts
│   │   │   │   └── session.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── signin.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   └── guards/
│   │   │       ├── role.guard.ts
│   │   │       └── tenant.guard.ts
│   │   │
│   │   ├── patients/
│   │   │   ├── patients.module.ts
│   │   │   ├── patients.service.ts
│   │   │   ├── patients.controller.ts
│   │   │   ├── entities/
│   │   │   │   └── patient.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-patient.dto.ts
│   │   │       └── update-patient.dto.ts
│   │   │
│   │   ├── sessions/
│   │   │   ├── sessions.module.ts
│   │   │   ├── sessions.service.ts
│   │   │   ├── sessions.controller.ts
│   │   │   ├── entities/
│   │   │   │   └── live-session.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-session.dto.ts
│   │   │   │   ├── start-session.dto.ts
│   │   │   │   └── complete-session.dto.ts
│   │   │   └── state-machine/
│   │   │       └── session.states.ts
│   │   │
│   │   ├── clinical-notes/
│   │   │   ├── clinical-notes.module.ts
│   │   │   ├── clinical-notes.service.ts
│   │   │   ├── clinical-notes.controller.ts
│   │   │   ├── entities/
│   │   │   │   └── clinical-note.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-note.dto.ts
│   │   │   │   ├── update-note.dto.ts
│   │   │   │   └── finalize-note.dto.ts
│   │   │   ├── state-machine/
│   │   │   │   └── note.states.ts
│   │   │   └── guards/
│   │   │       └── immutability.guard.ts
│   │   │
│   │   ├── prescriptions/
│   │   │   ├── prescriptions.module.ts
│   │   │   ├── prescriptions.service.ts
│   │   │   ├── prescriptions.controller.ts
│   │   │   ├── entities/
│   │   │   │   └── prescription.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-prescription.dto.ts
│   │   │   │   ├── issue-prescription.dto.ts
│   │   │   │   └── cancel-prescription.dto.ts
│   │   │   ├── state-machine/
│   │   │   │   └── prescription.states.ts
│   │   │   └── guards/
│   │   │       └── immutability.guard.ts
│   │   │
│   │   ├── labs/
│   │   │   ├── labs.module.ts
│   │   │   ├── labs.service.ts
│   │   │   ├── labs.controller.ts
│   │   │   ├── entities/
│   │   │   │   └── lab-result.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── order-lab.dto.ts
│   │   │   │   ├── receive-result.dto.ts
│   │   │   │   └── review-result.dto.ts
│   │   │   └── state-machine/
│   │   │       └── lab.states.ts
│   │   │
│   │   ├── referrals/
│   │   │   ├── referrals.module.ts
│   │   │   ├── referrals.service.ts
│   │   │   ├── referrals.controller.ts
│   │   │   ├── entities/
│   │   │   │   └── referral.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-referral.dto.ts
│   │   │   │   ├── send-referral.dto.ts
│   │   │   │   └── close-referral.dto.ts
│   │   │   └── state-machine/
│   │   │       └── referral.states.ts
│   │   │
│   │   └── audit/
│   │       ├── audit.module.ts
│   │       ├── audit.service.ts
│   │       ├── audit.controller.ts
│   │       ├── entities/
│   │       │   └── audit-log.entity.ts
│   │       ├── dto/
│   │       │   ├── create-audit-log.dto.ts
│   │       │   └── query-audit-logs.dto.ts
│   │       └── interceptors/
│   │           └── audit-logging.interceptor.ts
│   │
│   ├── auth/                         # Cross-cutting auth
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── refresh-token.strategy.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── refresh-token.guard.ts
│   │
│   ├── common/                       # Shared primitives only
│   │   ├── exceptions/
│   │   │   ├── immutable-entity.exception.ts
│   │   │   ├── invalid-state-transition.exception.ts
│   │   │   └── tenant-isolation.exception.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── current-tenant.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── tenant-context.interceptor.ts
│   │   └── types/
│   │       ├── user-role.enum.ts
│   │       ├── account-status.enum.ts
│   │       └── base-entity.interface.ts
│   │
│   ├── config/                       # Configuration
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── app.config.ts
│   │   └── rate-limit.config.ts
│   │
│   ├── database/                     # Database migrations & seeds
│   │   ├── migrations/
│   │   │   ├── 001_create_tenants.sql
│   │   │   ├── 002_create_users.sql
│   │   │   ├── 003_create_patients.sql
│   │   │   ├── 004_create_sessions.sql
│   │   │   ├── 005_create_clinical_notes.sql
│   │   │   ├── 006_create_prescriptions.sql
│   │   │   ├── 007_create_lab_results.sql
│   │   │   ├── 008_create_referrals.sql
│   │   │   ├── 009_create_audit_logs.sql
│   │   │   ├── 010_create_ai_interactions.sql
│   │   │   ├── 011_add_rls_policies.sql
│   │   │   └── 012_add_immutability_triggers.sql
│   │   └── seeds/
│   │       ├── dev-tenants.seed.ts
│   │       └── dev-users.seed.ts
│   │
│   ├── app.module.ts                 # Root module
│   └── main.ts                       # Application entry point
│
├── test/
│   ├── unit/
│   │   └── modules/
│   │       ├── clinical-notes/
│   │       └── prescriptions/
│   └── integration/
│       └── api/
│
├── .env.example                      # Example environment variables
├── .env.development                  # Dev environment (gitignored)
├── .eslintrc.js
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

---

### Backend Rules (Enforced)

#### 1. Modules (`src/modules/`)

**Purpose:** Domain-driven modules. One domain = one module.

**Module Structure (Mandatory):**

```
module-name/
├── module-name.module.ts          # NestJS module definition
├── module-name.service.ts         # Business logic
├── module-name.controller.ts      # HTTP endpoints
├── entities/                      # Database entities (Prisma or TypeORM)
├── dto/                           # Data Transfer Objects (validation)
├── state-machine/                 # State transitions (if applicable)
└── guards/                        # Module-specific guards (e.g., immutability)
```

✅ **Allowed:**
- Module imports other modules via NestJS DI
- Module emits events (for audit, notifications)
- Module queries read-only views of other domains

❌ **Forbidden:**
- Module directly calls another module's service (use events or read models)
- Module mutates another module's entities
- Module bypasses state machine

**Example Violation:**
```typescript
// ❌ BAD: Clinical Notes service directly calls Sessions service
@Injectable()
export class ClinicalNotesService {
  constructor(
    private sessionsService: SessionsService  // ❌ Cross-domain write dependency
  ) {}
  
  async createNote(dto) {
    const session = await this.sessionsService.findOne(dto.sessionId)
    await this.sessionsService.updateStatus(session.id, 'documented')  // ❌ Mutation
  }
}
```

**Correct:**
```typescript
// ✅ GOOD: Emit event, Sessions module listens
@Injectable()
export class ClinicalNotesService {
  constructor(private eventEmitter: EventEmitter2) {}
  
  async createNote(dto) {
    const note = await this.repository.create(dto)
    
    // Emit event, don't mutate other domain
    this.eventEmitter.emit('note.created', { noteId: note.id, sessionId: dto.sessionId })
    
    return note
  }
}
```

---

#### 2. Auth (`src/auth/`)

**Purpose:** Cross-cutting authentication and authorization.

✅ **Allowed:**
- JWT strategy
- Refresh token strategy
- Guards (role, tenant, auth)

❌ **Forbidden:**
- Business logic (belongs in `modules/identity/`)
- User CRUD (belongs in `modules/identity/`)

**Rule:** Auth verifies identity, modules enforce access.

---

#### 3. Common (`src/common/`)

**Purpose:** Shared primitives ONLY. Not a dumping ground.

✅ **Allowed:**
- Custom exceptions (ImmutableEntityException, InvalidStateTransitionException)
- Decorators (CurrentUser, CurrentTenant)
- Global filters (HTTP exception filter)
- Global interceptors (logging, tenant context)
- Base types (enums, interfaces)

❌ **Forbidden:**
- Business logic
- Domain-specific helpers
- "Util" functions (if domain-specific, put in module)

**Limit:** Max 20 files. If exceeding, refactor.

---

#### 4. Config (`src/config/`)

**Purpose:** Configuration management.

✅ **Allowed:**
- Database config
- JWT config
- App config
- Rate limit config

❌ **Forbidden:**
- Environment-specific values (use .env files)
- Secrets (use environment variables)

**Example:**
```typescript
// ✅ GOOD: Config reads from env
export const databaseConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,  // From env, not hardcoded
}
```

---

#### 5. Database (`src/database/`)

**Purpose:** Migrations and seed data.

**Migrations:**
- SQL files (not ORM-generated)
- Numbered sequentially (`001_`, `002_`, etc.)
- Include UP and DOWN (rollback)

**Seeds:**
- Development data only (tenants, users)
- Never seed patient data (privacy)

---

#### 6. Test (`test/`)

**Purpose:** Unit and integration tests.

**Structure:**
```
test/
├── unit/
│   └── modules/
│       ├── clinical-notes/
│       │   ├── clinical-notes.service.spec.ts
│       │   └── immutability.guard.spec.ts
│       └── prescriptions/
│           └── prescriptions.service.spec.ts
└── integration/
    └── api/
        ├── auth.e2e.spec.ts
        ├── clinical-notes.e2e.spec.ts
        └── prescriptions.e2e.spec.ts
```

**Coverage Target:** 80% for services, 100% for state machines and immutability guards.

---

## 3️⃣ AI GATEWAY STRUCTURE

```
ai/
├── src/
│   ├── context/                      # Context preparation
│   │   ├── context.service.ts
│   │   ├── patient-summary.builder.ts
│   │   ├── session-transcript.builder.ts
│   │   └── lab-result.builder.ts
│   │
│   ├── models/                       # AI model integration
│   │   ├── ai-client.service.ts
│   │   ├── openai.adapter.ts
│   │   └── anthropic.adapter.ts
│   │
│   ├── prompts/                      # Prompt templates
│   │   ├── soap-note.prompt.ts
│   │   ├── session-summary.prompt.ts
│   │   └── lab-explanation.prompt.ts
│   │
│   ├── policies/                     # AI policies & safety
│   │   ├── confidence.policy.ts
│   │   ├── prohibited-language.filter.ts
│   │   └── refusal.policy.ts
│   │
│   ├── guards/                       # AI-specific guards
│   │   ├── read-only.guard.ts
│   │   ├── patient-scope.guard.ts
│   │   └── rate-limit.guard.ts
│   │
│   ├── audit/                        # AI audit logging
│   │   └── ai-interaction.logger.ts
│   │
│   ├── config/
│   │   ├── ai.config.ts
│   │   └── rate-limit.config.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
│   ├── unit/
│   └── integration/
│
├── .env.example
├── .env.development
├── package.json
└── tsconfig.json
```

---

### AI Gateway Rules (Absolute)

#### 1. No Backend Imports

❌ **Forbidden:**
```typescript
// ❌ BAD: AI imports backend domain service
import { ClinicalNotesService } from '../../backend/src/modules/clinical-notes'
```

✅ **Allowed:**
```typescript
// ✅ GOOD: AI queries read-only database view
const patientSummary = await this.db.query('SELECT * FROM ai_patient_summary WHERE id = $1', [patientId])
```

**Rule:** AI Gateway has NO knowledge of backend services.

---

#### 2. Read-Only Database User

**AI Gateway connects with:**
```
DB_USER=ai_gateway_user  # Read-only permissions
```

**Enforcement:**
```sql
GRANT SELECT ON clinical_notes, lab_results, live_sessions, patients TO ai_gateway_user;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES FROM ai_gateway_user;
```

---

#### 3. Context Preparation Only

**AI Gateway responsibilities:**

✅ Build context from read-only views  
✅ Call external AI model  
✅ Return suggestion to frontend (via backend)  
✅ Log interaction  

❌ Save clinical data  
❌ Trigger state transitions  
❌ Call backend APIs  

---

## 4️⃣ DOCS STRUCTURE

```
docs/
├── architecture/
│   ├── BACKEND_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── TECH_STACK_VALIDATION.md
│   └── REPO_STRUCTURE.md              # This file
│
├── state-machines/
│   ├── STATE_MACHINES.md
│   └── diagrams/
│       ├── sessions.mermaid
│       ├── clinical-notes.mermaid
│       └── prescriptions.mermaid
│
├── api-contracts/
│   ├── API_CONTRACTS.md
│   └── openapi.yaml                   # Generated OpenAPI spec
│
├── user-journeys/
│   └── USER_JOURNEYS.md
│
├── ai/
│   ├── AI_ASSISTANT_SPEC.md
│   └── AI_IMPLEMENTATION_PLAN.md
│
├── compliance/
│   ├── HIPAA_COMPLIANCE.md
│   └── AUDIT_POLICY.md
│
└── README.md                          # Documentation index
```

---

### Docs Rules

✅ **Documentation is first-class**
- All architecture decisions documented
- State machines have diagrams
- API contracts are up-to-date

❌ **No stale docs**
- If code changes, docs must update
- Pull requests touching state machines must update STATE_MACHINES.md

**Review Policy:** Docs are reviewed with same rigor as code.

---

## 5️⃣ INFRA STRUCTURE

```
infra/
├── environments/
│   ├── development.env
│   ├── staging.env
│   └── production.env
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── Dockerfile.ai
│   └── docker-compose.yml
│
├── secrets/
│   └── .gitkeep                       # Actual secrets NEVER committed
│
├── rate-limits/
│   └── rate-limit.rules.json
│
└── monitoring/
    ├── logging.config.json
    └── alerts.config.json
```

---

### Infra Rules (Critical)

#### 1. Secrets Management

❌ **NEVER commit:**
- `.env` files with real values
- API keys
- Database passwords
- JWT secrets

✅ **Always:**
- Use `.env.example` with placeholder values
- Use environment variables in production
- Rotate secrets quarterly

---

#### 2. Environment Separation

**Required Environments:**

| Environment | Purpose | Database | AI |
|-------------|---------|----------|-----|
| `development` | Local dev | Local Postgres | Mock AI |
| `staging` | Pre-prod testing | Separate DB | Real AI (limited quota) |
| `production` | Live system | Production DB | Real AI |

**Rule:** No production secrets in dev/staging.

---

## 6️⃣ NAMING CONVENTIONS (MANDATORY)

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| **Components (React)** | PascalCase | `SOAPNoteEditor.tsx` |
| **Hooks** | camelCase, prefix `use` | `useRoleAccess.ts` |
| **Services (NestJS)** | kebab-case | `clinical-notes.service.ts` |
| **Controllers** | kebab-case | `clinical-notes.controller.ts` |
| **Entities** | kebab-case | `clinical-note.entity.ts` |
| **DTOs** | kebab-case | `create-note.dto.ts` |
| **Types** | kebab-case | `clinical-note.ts` |
| **Tests** | kebab-case, suffix `.spec` or `.e2e.spec` | `clinical-notes.service.spec.ts` |

---

### Variable Naming

**Principle:** Explicit > Clever. No abbreviations.

✅ **Good:**
```typescript
const clinicalNoteStatus = 'draft'
const isFinalized = note.status === 'finalized'
const providerId = user.id
```

❌ **Bad:**
```typescript
const cns = 'draft'  // ❌ Abbreviation
const fin = note.status === 'finalized'  // ❌ Abbreviation
const pid = user.id  // ❌ Abbreviation
```

---

### State & Enum Naming

**Always spell out:**

✅ **Good:**
```typescript
type ClinicalNoteStatus = 'draft' | 'ai_assisted_draft' | 'finalized' | 'archived'
type UserRole = 'provider' | 'admin' | 'parent'
```

❌ **Bad:**
```typescript
type NoteStatus = 'drft' | 'fin' | 'arch'  // ❌ Abbreviations
type Role = 'prov' | 'adm' | 'par'  // ❌ Abbreviations
```

---

### Module/Folder Naming

**Domain-first naming:**

✅ **Good:**
```
modules/clinical-notes/
modules/prescriptions/
modules/lab-results/
```

❌ **Bad:**
```
modules/notes/  // ❌ Too vague
modules/rx/  // ❌ Abbreviation
modules/labs-module/  // ❌ Redundant "module"
```

---

## 7️⃣ IMPORT RULES (ENFORCED)

### Frontend Import Boundaries

```typescript
// ✅ ALLOWED IMPORTS
import { Button } from '@/components/ui/Button'  // UI primitive
import { useRoleAccess } from '@/hooks/useRoleAccess'  // Hook
import { RoleContext } from '@/contexts/RoleContext'  // Context
import { ClinicalNote } from '@/types/clinical-note'  // Type

// ❌ FORBIDDEN IMPORTS
import { api } from '@/lib/api-client'  // ❌ Pages should not import API client directly
import { PrescriptionForm } from '@/components/clinical/PrescriptionForm'  // ❌ If in auth/ folder
```

**Enforcement:** ESLint rule checks import paths.

---

### Backend Import Boundaries

```typescript
// ✅ ALLOWED IMPORTS
import { Injectable } from '@nestjs/common'  // Framework
import { ImmutableEntityException } from '@/common/exceptions'  // Common
import { UserRole } from '@/common/types/user-role.enum'  // Common enum

// ❌ FORBIDDEN IMPORTS (from clinical-notes module)
import { PrescriptionsService } from '@/modules/prescriptions'  // ❌ Cross-domain write
import { SessionsService } from '@/modules/sessions'  // ❌ Cross-domain write

// ✅ ALLOWED (if read-only)
import { SessionReadModel } from '@/modules/sessions/read-models'  // ✅ Read-only view
```

**Enforcement:** NestJS module system + ESLint rules.

---

### AI Gateway Import Boundaries

```typescript
// ✅ ALLOWED IMPORTS
import { Injectable } from '@nestjs/common'  // Framework
import { DatabaseService } from '@/database/database.service'  // Read-only DB

// ❌ FORBIDDEN IMPORTS
import { ClinicalNotesService } from '../../backend/src/modules/clinical-notes'  // ❌ NO BACKEND IMPORTS
import { PrescriptionsService } from '../../backend/src/modules/prescriptions'  // ❌ NO BACKEND IMPORTS
```

**Enforcement:** Separate repository or strict path rules.

---

## 8️⃣ ENFORCEMENT MECHANISMS

### 1. ESLint Rules

**Frontend:**
```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          "@/components/clinical/*",  // Clinical components cannot import each other
          "@/lib/api-client"  // Pages cannot import API client directly
        ]
      }
    ]
  }
}
```

**Backend:**
```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          "../modules/**/*.service"  // Modules cannot cross-import services
        ]
      }
    ]
  }
}
```

---

### 2. Pull Request Checklist

**Before merging:**

- [ ] Does this PR touch multiple domains? (Requires senior review)
- [ ] Are new folders justified and documented?
- [ ] Do imports respect boundaries?
- [ ] Are state machines updated if states changed?
- [ ] Are docs updated if architecture changed?
- [ ] Are tests included for state transitions?

---

### 3. Folder Limits

**Enforce maximum files per folder:**

| Folder | Max Files | Reason |
|--------|-----------|--------|
| `src/lib/` (frontend) | 5 | Prevent dumping ground |
| `src/common/` (backend) | 20 | Prevent bloat |
| Root of any module | 10 | Enforce subfolders |

**If limit exceeded → Refactor required.**

---

## 9️⃣ ANTI-PATTERNS (FORBIDDEN)

### ❌ Utils Dumping Ground

```
// ❌ BAD
src/utils/
├── helpers.ts
├── common.ts
├── misc.ts
└── stuff.ts
```

**Why:** Vague, becomes dumping ground, no clear responsibility.

**Instead:** Domain-specific helpers in domain folders.

---

### ❌ Shared Magic Helpers

```typescript
// ❌ BAD: Shared helper with business logic
export function autoFinalizeNoteIfComplete(note: ClinicalNote) {
  if (note.subjective && note.objective && note.assessment && note.plan) {
    note.status = 'finalized'  // ❌ State transition in helper
  }
}
```

**Why:** Business logic hidden in utility, bypasses state machine.

**Instead:** State transitions ONLY in services.

---

### ❌ Cross-Domain Mutations

```typescript
// ❌ BAD: Clinical Notes service mutates Sessions
@Injectable()
export class ClinicalNotesService {
  constructor(private sessionsService: SessionsService) {}
  
  async finalizeNote(noteId: string) {
    const note = await this.findOne(noteId)
    note.status = 'finalized'
    await this.repository.save(note)
    
    // ❌ Cross-domain mutation
    await this.sessionsService.markAsDocumented(note.sessionId)
  }
}
```

**Why:** Violates domain boundaries, creates coupling.

**Instead:** Emit event, Sessions module listens.

---

### ❌ Circular Imports

```typescript
// ❌ BAD: Module A imports Module B, Module B imports Module A
// modules/clinical-notes/clinical-notes.service.ts
import { SessionsService } from '../sessions/sessions.service'

// modules/sessions/sessions.service.ts
import { ClinicalNotesService } from '../clinical-notes/clinical-notes.service'
```

**Why:** Causes runtime errors, impossible to maintain.

**Instead:** Use events or read models.

---

### ❌ Temporary Folders

```
// ❌ BAD
src/temp/
src/old/
src/backup/
src/new-feature/  // ❌ Use feature branches, not folders
```

**Why:** Clutter, dead code, confusion.

**Instead:** Delete or move to proper location.

---

## PHILOSOPHY (LOCKED)

### Structure is Governance

> "The repository structure enforces architectural decisions. If a developer wants to violate domain boundaries, the folder structure makes it uncomfortable. This discomfort is intentional."

### Explicit > Clever

> "File names are explicit. Folder names are explicit. No abbreviations. No clever shortcuts. Reading the folder structure should reveal the architecture instantly."

### Boring is Safe

> "This structure is boring. It follows conventions. It has no surprises. Medical software should be boring. Exciting code in production is a warning sign, not a badge of honor."

### If It Doesn't Belong, It Doesn't Exist

> "Every file must have a clear home. If a file doesn't fit cleanly in a folder, it means one of two things: (1) The file is wrong. (2) The structure is wrong. Fix it. Don't create 'misc' folders."

---

## FINAL CHECKLIST

### Before Committing to Main

- [ ] All files have clear folder homes
- [ ] No `utils/` or `helpers/` dumping grounds
- [ ] No cross-domain imports (verified by ESLint)
- [ ] No circular dependencies
- [ ] Module boundaries respected
- [ ] AI Gateway has no backend imports
- [ ] Secrets not committed (.env files gitignored)
- [ ] Documentation updated if structure changed

**If ANY checkbox unchecked → Do NOT merge.**

---

**Last Updated:** January 14, 2026  
**Status:** Repository Structure Defined  
**Integration:** Implements BACKEND_ARCHITECTURE.md, DATABASE_SCHEMA.md, TECH_STACK_VALIDATION.md, AI_IMPLEMENTATION_PLAN.md  
**Next Step:** Initialize repositories with this structure
