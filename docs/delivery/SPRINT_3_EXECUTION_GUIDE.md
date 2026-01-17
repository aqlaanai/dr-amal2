# SPRINT 3 EXECUTION GUIDE — Backend Foundation

**Document Status:** 🟢 ACTIVE  
**Last Updated:** January 14, 2026  
**Sprint:** Sprint 3 (Backend Foundation)  
**Duration:** 2 weeks  
**Owner:** Backend Lead / Execution Reviewer

---

## PURPOSE

This document defines **strict enforcement rules** for Sprint 3 implementation of Dr Amal Clinical OS v2.0.

**Sprint 3 Scope:** Backend foundation ONLY.

**Zero tolerance for:**
- Feature endpoints
- Clinical domain logic
- Business rules
- Shortcuts that bypass audit or tenant isolation

---

## 🎯 SPRINT 3 SCOPE (ABSOLUTE)

### ✅ ALLOWED

- **Backend Skeleton:** NestJS project structure, module boundaries
- **Auth Module:** User entity, login/logout endpoints, JWT tokens
- **Identity Module:** Users, tenants, roles, account status
- **Audit Core:** Audit log entity, audit service, append-only enforcement
- **Database Schema:** Users, tenants, audit_logs tables only
- **Error Model:** Standard error response format, error codes
- **Environment Config:** Development, staging, production configs
- **Database Migrations:** Initial schema migrations
- **Basic Tests:** Unit tests for auth, tenant isolation, audit logging

### ❌ FORBIDDEN

- **Feature Endpoints:** No patients, sessions, clinical notes, prescriptions
- **Clinical Domain Logic:** No state transitions, no validation rules
- **AI Integration:** No AI gateway, no AI service
- **Business Rules:** No role-based feature access, no clinical workflows
- **Frontend Changes:** Sprint 1 + 2 UI frozen, no frontend modifications
- **Premature Optimization:** No caching, no complex queries
- **"Temporary" Bypasses:** No audit logging skips, no tenant isolation shortcuts

---

## 🚦 ENFORCEMENT RULES

### 1️⃣ BACKEND SKELETON (MANDATORY)

#### Module Structure Requirements

**✅ REQUIRED STRUCTURE:**
```
backend/
├── src/
│   ├── main.ts                    ✅ Application entry point
│   ├── app.module.ts              ✅ Root module
│   │
│   ├── modules/
│   │   ├── identity/              ✅ Users, tenants, roles
│   │   │   ├── identity.module.ts
│   │   │   ├── entities/
│   │   │   │   ├── user.entity.ts
│   │   │   │   └── tenant.entity.ts
│   │   │   ├── services/
│   │   │   │   ├── users.service.ts
│   │   │   │   └── tenants.service.ts
│   │   │   └── controllers/
│   │   │       └── users.controller.ts
│   │   │
│   │   ├── audit/                 ✅ Audit logging
│   │   │   ├── audit.module.ts
│   │   │   ├── entities/
│   │   │   │   └── audit-log.entity.ts
│   │   │   └── services/
│   │   │       └── audit.service.ts
│   │   │
│   │   └── (other domains)        ❌ NOT in Sprint 3
│   │
│   ├── auth/                      ✅ Authentication
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── tenant-scope.guard.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── signup.dto.ts
│   │
│   ├── common/                    ✅ Shared utilities (max 20 files)
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── tenant-scope.decorator.ts
│   │   ├── errors/
│   │   │   ├── error-codes.enum.ts
│   │   │   └── app-error.ts
│   │   └── types/
│   │       └── auth-context.type.ts
│   │
│   ├── config/                    ✅ Configuration
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── app.config.ts
│   │
│   └── database/                  ✅ Database setup
│       ├── prisma/
│       │   └── schema.prisma
│       └── migrations/
│
├── test/                          ✅ Tests
│   ├── unit/
│   └── integration/
│
├── .env.example                   ✅ Environment template
├── .env.development               ✅ Dev environment
├── .env.test                      ✅ Test environment
├── package.json
├── tsconfig.json
└── nest-cli.json
```

**❌ REJECT IF:**
```
backend/
├── src/
│   ├── everything.ts              ❌ No structure
│   ├── utils/                     ❌ Vague folder
│   │   └── helpers.ts             ❌ Dumping ground
│   ├── services/                  ❌ Not domain-based
│   │   ├── user.service.ts
│   │   ├── patient.service.ts     ❌ Patients are Sprint 5+
│   │   └── note.service.ts        ❌ Clinical notes are Sprint 6
│   └── routes/                    ❌ Not NestJS pattern
```

#### Module Boundary Rules

**✅ REQUIRED:**
- Each domain is a self-contained NestJS module
- Modules export only what's needed (services, entities)
- Cross-module dependencies are explicit (imports in module definition)
- `common/` folder has ≤ 20 files
- No circular dependencies

**❌ REJECT IF:**
- Everything imports everything
- `common/` becomes a dumping ground (>20 files)
- Modules directly access other modules' internal implementation
- Circular dependencies exist (Module A → Module B → Module A)

---

### 2️⃣ AUTH & IDENTITY (FOUNDATION ONLY)

#### User Entity Requirements

**✅ REQUIRED:**
```typescript
// modules/identity/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from './tenant.entity'

export enum UserRole {
  PROVIDER = 'provider',
  ADMIN = 'admin',
  CAREGIVER = 'caregiver',
}

export enum AccountStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  LOCKED = 'locked',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @ManyToOne(() => Tenant)
  tenant: Tenant

  @Column({ unique: true })
  email: string

  @Column()
  passwordHash: string  // ✅ Hashed with bcrypt

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.PENDING })
  accountStatus: AccountStatus

  @Column()
  fullName: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Feature-specific fields (not in Sprint 3)
@Column()
specialization: string  // Belongs in provider profile (Sprint 5+)

@Column()
lastActiveSessionId: string  // Belongs in sessions domain (Sprint 5)

@Column()
preferredLanguage: string  // Nice-to-have, not foundation

// ❌ Permission fields (too early)
@Column({ type: 'json' })
permissions: string[]  // Backend enforces via role, not custom permissions
```

#### Tenant Entity Requirements

**✅ REQUIRED:**
```typescript
// modules/identity/entities/tenant.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  name: string  // e.g., "City General Hospital"

  @Column({ unique: true })
  slug: string  // e.g., "city-general"

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Business fields (too early)
@Column()
maxPatients: number  // Belongs in billing/subscription module (future)

@Column()
billingPlan: string  // Not foundation

@Column({ type: 'json' })
features: string[]  // Feature flags are future work
```

#### Auth Endpoints (Foundation Only)

**✅ ALLOWED:**
```typescript
// auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto, SignupDto } from './dto'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ✅ Login endpoint
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password)
  }

  // ✅ Signup endpoint
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto)
  }

  // ✅ Refresh token endpoint
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken)
  }

  // ✅ Logout endpoint
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.authService.logout(refreshToken)
  }
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Feature-based endpoints (not in Sprint 3)
@Post('check-permission')
async checkPermission(@Body() dto: CheckPermissionDto) {
  // Permission checking is Sprint 4+ (integration with features)
}

// ❌ Password reset (nice-to-have, not foundation)
@Post('forgot-password')
async forgotPassword(@Body('email') email: string) {
  // This is a feature, not foundation
}

// ❌ Email verification (nice-to-have, not foundation)
@Post('verify-email')
async verifyEmail(@Body('token') token: string) {
  // This is a feature, not foundation
}
```

#### Token Lifecycle

**✅ REQUIRED:**
```typescript
// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private auditService: AuditService,
  ) {}

  async login(email: string, password: string) {
    // 1. Find user
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // 2. Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // 3. Check account status
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.accountStatus}`)
    }

    // 4. Generate tokens
    const accessToken = this.generateAccessToken(user)
    const refreshToken = this.generateRefreshToken(user)

    // 5. Audit log
    await this.auditService.log({
      userId: user.id,
      tenantId: user.tenantId,
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id,
      metadata: { email: user.email },
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        accountStatus: user.accountStatus,
      },
    }
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    }
    return this.jwtService.sign(payload, { expiresIn: '15m' })
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      type: 'refresh',
    }
    return this.jwtService.sign(payload, { expiresIn: '7d' })
  }
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Feature-based token claims
const payload = {
  sub: user.id,
  permissions: user.permissions,  // Permissions are derived from role, not in token
  lastSessionId: user.lastSessionId,  // Session tracking is Sprint 5
  features: user.tenant.features,  // Feature flags are future work
}

// ❌ UI-driven assumptions
if (loginDto.rememberMe) {
  expiresIn = '30d'  // Backend decides expiry, not frontend
}
```

---

### 3️⃣ TENANT ISOLATION (NON-NEGOTIABLE)

#### Tenant Scope Guard

**✅ REQUIRED:**
```typescript
// auth/guards/tenant-scope.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'

@Injectable()
export class TenantScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user  // From JWT strategy
    const tenantId = user?.tenantId

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required')
    }

    // ✅ Attach tenantId to request for downstream use
    request.tenantId = tenantId

    return true
  }
}
```

#### Every Query Must Filter by tenantId

**✅ REQUIRED:**
```typescript
// modules/identity/services/users.service.ts
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // ✅ CORRECT: Always filter by tenantId
  async findAllByTenant(tenantId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { tenantId },
    })
  }

  // ✅ CORRECT: tenantId in where clause
  async findOne(id: string, tenantId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id, tenantId },
    })
  }

  // ✅ CORRECT: tenantId required for creation
  async create(tenantId: string, data: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create({
      ...data,
      tenantId,  // ✅ Explicitly set from auth context
    })
    return this.usersRepository.save(user)
  }
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ REJECT: No tenant filtering
async findAll(): Promise<User[]> {
  return this.usersRepository.find()  // ❌ Cross-tenant leak
}

// ❌ REJECT: tenantId from request body
async findOne(id: string, tenantIdFromBody: string): Promise<User | null> {
  // ❌ Frontend can manipulate tenantId
  return this.usersRepository.findOne({ where: { id, tenantId: tenantIdFromBody } })
}

// ❌ REJECT: Optional tenant filtering
async findAll(tenantId?: string): Promise<User[]> {
  const where = tenantId ? { tenantId } : {}  // ❌ Can bypass tenant isolation
  return this.usersRepository.find({ where })
}

// ❌ REJECT: Tenant inferred from user ID
async findOne(id: string): Promise<User | null> {
  const user = await this.usersRepository.findOne({ where: { id } })
  // ❌ Trusting that user.tenantId is correct, but didn't validate against auth context
  return user
}
```

#### Prisma Middleware (Automatic Tenant Filtering)

**✅ RECOMMENDED (if using Prisma):**
```typescript
// database/prisma/middleware/tenant-isolation.middleware.ts
import { Prisma } from '@prisma/client'

export function tenantIsolationMiddleware(tenantId: string) {
  return async (params: Prisma.MiddlewareParams, next: any) => {
    // ✅ Auto-inject tenantId for all queries
    if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
      params.args.where = {
        ...params.args.where,
        tenantId,
      }
    }

    if (params.action === 'create') {
      params.args.data = {
        ...params.args.data,
        tenantId,
      }
    }

    return next(params)
  }
}
```

**⚠️ WARNING:**
- Middleware is helpful but NOT sufficient alone
- Always explicitly specify `tenantId` in queries
- Middleware is defense-in-depth, not primary enforcement

---

### 4️⃣ AUDIT LOGGING CORE (CRITICAL)

#### Audit Log Entity

**✅ REQUIRED:**
```typescript
// modules/audit/entities/audit-log.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @Column()
  userId: string

  @Column()
  action: string  // e.g., "auth.login", "user.create", "note.finalize"

  @Column()
  entityType: string  // e.g., "user", "patient", "clinical_note"

  @Column({ nullable: true })
  entityId: string  // ID of affected entity

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>  // Additional context (NO PHI)

  @CreateDateColumn()
  timestamp: Date

  // ❌ NO updatedAt column (append-only)
  // ❌ NO deletedAt column (never delete audit logs)
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Updatable audit logs
@UpdateDateColumn()
updatedAt: Date  // ❌ Audit logs must be immutable

// ❌ Soft delete
@DeleteDateColumn()
deletedAt: Date  // ❌ Audit logs must never be deleted

// ❌ PHI in metadata
@Column({ type: 'json' })
metadata: {
  patientName: string,  // ❌ NO PHI in audit logs
  diagnosis: string,    // ❌ NO PHI in audit logs
}
```

#### Audit Service

**✅ REQUIRED:**
```typescript
// modules/audit/services/audit.service.ts
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditLog } from '../entities/audit-log.entity'

interface LogParams {
  userId: string
  tenantId: string
  action: string
  entityType: string
  entityId?: string
  metadata?: Record<string, any>
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  // ✅ Append-only logging
  async log(params: LogParams): Promise<void> {
    const auditLog = this.auditRepository.create({
      userId: params.userId,
      tenantId: params.tenantId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    })

    await this.auditRepository.save(auditLog)
    // ✅ Fire-and-forget, never throws (audit logging must not break app)
  }

  // ✅ Query audit logs (admin only, Sprint 5+)
  async findByTenant(tenantId: string, limit = 100): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { tenantId },
      order: { timestamp: 'DESC' },
      take: limit,
    })
  }

  // ❌ NO update method
  // ❌ NO delete method
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Update audit log
async update(id: string, data: Partial<AuditLog>): Promise<void> {
  // ❌ Audit logs are immutable
}

// ❌ Delete audit log
async delete(id: string): Promise<void> {
  // ❌ Audit logs are never deleted
}

// ❌ Conditional logging
async logIfImportant(params: LogParams): Promise<void> {
  if (params.action.includes('critical')) {
    await this.log(params)  // ❌ ALL actions must be logged
  }
}
```

#### Database Trigger (Immutability Enforcement)

**✅ REQUIRED (Database-level protection):**
```sql
-- migrations/xxx_audit_log_immutability_trigger.sql

-- Prevent updates to audit_logs table
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs cannot be modified';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

-- Prevent deletes from audit_logs table
CREATE TRIGGER audit_log_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();
```

#### Audit Logging Integration

**✅ REQUIRED: Log all critical actions**
```typescript
// Example: Auth login
await this.auditService.log({
  userId: user.id,
  tenantId: user.tenantId,
  action: 'auth.login',
  entityType: 'user',
  entityId: user.id,
  metadata: { email: user.email },
})

// Example: User creation
await this.auditService.log({
  userId: createdBy.id,
  tenantId: createdBy.tenantId,
  action: 'user.create',
  entityType: 'user',
  entityId: newUser.id,
  metadata: { email: newUser.email, role: newUser.role },
})

// Example: Account locked
await this.auditService.log({
  userId: admin.id,
  tenantId: admin.tenantId,
  action: 'user.lock',
  entityType: 'user',
  entityId: targetUser.id,
  metadata: { reason: 'Suspicious activity' },
})
```

---

### 5️⃣ ERROR MODEL (CLEAN & EXPLICIT)

#### Standard Error Response

**✅ REQUIRED:**
```typescript
// common/errors/app-error.ts
export interface ErrorResponse {
  statusCode: number
  code: string  // Machine-readable error code
  message: string  // Human-readable message (sanitized)
  timestamp: string
  path: string
  // ❌ NO stack trace in production
  // ❌ NO internal details
}

// common/errors/error-codes.enum.ts
export enum ErrorCode {
  // Auth errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_PENDING = 'ACCOUNT_PENDING',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Tenant errors
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  CROSS_TENANT_ACCESS = 'CROSS_TENANT_ACCESS',
  
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  
  // General errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

#### HTTP Exception Filter

**✅ REQUIRED:**
```typescript
// common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { ErrorResponse, ErrorCode } from '../errors'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let code = ErrorCode.INTERNAL_ERROR
    let message = 'An unexpected error occurred'

    // ✅ Handle known exceptions
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      
      if (typeof exceptionResponse === 'object' && 'code' in exceptionResponse) {
        code = exceptionResponse.code
        message = exceptionResponse.message || message
      } else {
        message = exception.message
      }
    }

    // ✅ Log error server-side (with full stack trace)
    if (statusCode >= 500) {
      console.error('Internal error:', exception)
    }

    // ✅ Send sanitized error to client
    const errorResponse: ErrorResponse = {
      statusCode,
      code,
      message,  // ✅ Sanitized, no internal details
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    response.status(statusCode).json(errorResponse)
  }
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Leaking internal details
const errorResponse = {
  statusCode,
  message: exception.stack,  // ❌ Exposes stack trace
  query: request.query,  // ❌ Exposes SQL query
  dbError: exception.originalError,  // ❌ Exposes database error
}

// ❌ Silent failures
try {
  await this.doSomething()
} catch (error) {
  // ❌ Swallowing error, no logging
  return null
}

// ❌ Vague errors
throw new Error('Something went wrong')  // ❌ Not helpful
```

#### Custom Exception Examples

**✅ REQUIRED:**
```typescript
// common/errors/exceptions/account-locked.exception.ts
import { UnauthorizedException } from '@nestjs/common'
import { ErrorCode } from '../error-codes.enum'

export class AccountLockedException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.ACCOUNT_LOCKED,
      message: 'Your account has been locked. Please contact your administrator.',
    })
  }
}

// common/errors/exceptions/cross-tenant-access.exception.ts
import { ForbiddenException } from '@nestjs/common'
import { ErrorCode } from '../error-codes.enum'

export class CrossTenantAccessException extends ForbiddenException {
  constructor() {
    super({
      code: ErrorCode.CROSS_TENANT_ACCESS,
      message: 'Access to resources outside your organization is forbidden.',
    })
  }
}
```

---

### 6️⃣ ABSOLUTE FORBIDDEN ITEMS

#### ❌ Feature Endpoints

**FORBIDDEN:**
```typescript
// ❌ Patients endpoints (Sprint 5)
@Controller('patients')
export class PatientsController {
  @Get()
  async findAll() { /* ... */ }
}

// ❌ Sessions endpoints (Sprint 5)
@Controller('sessions')
export class SessionsController {
  @Post()
  async create() { /* ... */ }
}

// ❌ Clinical notes endpoints (Sprint 6)
@Controller('clinical-notes')
export class ClinicalNotesController {
  @Post(':id/finalize')
  async finalize() { /* ... */ }
}

// ❌ Prescriptions endpoints (Sprint 6)
@Controller('prescriptions')
export class PrescriptionsController {
  @Post(':id/issue')
  async issue() { /* ... */ }
}
```

**WHY FORBIDDEN:**
- Feature endpoints belong in Sprint 5+ (read domains) and Sprint 6 (write domains)
- Sprint 3 is foundation only
- Features require business logic, state transitions, and validation

---

#### ❌ Clinical Domain Logic

**FORBIDDEN:**
```typescript
// ❌ State transitions (Sprint 6)
enum NoteStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
  ARCHIVED = 'archived',
}

async finalizeNote(noteId: string): Promise<void> {
  // ❌ State machine logic belongs in Sprint 6
  const note = await this.notesRepository.findOne({ where: { id: noteId } })
  if (note.status !== NoteStatus.DRAFT) {
    throw new Error('Only draft notes can be finalized')
  }
  note.status = NoteStatus.FINALIZED
  await this.notesRepository.save(note)
}

// ❌ Clinical validation (Sprint 6)
async validatePrescription(prescription: Prescription): Promise<void> {
  // ❌ Business rules belong in Sprint 6
  if (!prescription.medication) {
    throw new Error('Medication is required')
  }
  if (prescription.dosage <= 0) {
    throw new Error('Dosage must be positive')
  }
}

// ❌ Role-based business rules (Sprint 4+)
async canFinalizeNote(userId: string, noteId: string): Promise<boolean> {
  // ❌ Feature access logic belongs in Sprint 4+
  const user = await this.usersService.findOne(userId)
  return user.role === UserRole.PROVIDER
}
```

**WHY FORBIDDEN:**
- State transitions require complete state machine implementation (Sprint 6)
- Clinical validation requires domain experts and comprehensive rules (Sprint 6)
- Role-based feature access requires integration with features (Sprint 4+)

---

#### ❌ AI Gateways or Services

**FORBIDDEN:**
```typescript
// ❌ AI gateway (Sprint 7)
@Controller('ai')
export class AIController {
  @Post('suggest-note')
  async suggestNote(@Body() context: any) {
    // ❌ AI integration is Sprint 7
  }
}

// ❌ AI service (Sprint 7)
@Injectable()
export class AIService {
  async generateSuggestion(prompt: string): Promise<string> {
    // ❌ AI integration is Sprint 7
  }
}

// ❌ AI database user (Sprint 7)
// CREATE USER ai_readonly WITH PASSWORD 'xxx';
// GRANT SELECT ON patients, clinical_notes TO ai_readonly;
```

**WHY FORBIDDEN:**
- AI integration is Sprint 7
- AI requires safety guardrails and human-in-the-loop implementation
- AI boundaries not yet defined in backend

---

#### ❌ "Temporary" Bypasses

**FORBIDDEN:**
```typescript
// ❌ Audit logging bypass
async createUser(data: CreateUserDto): Promise<User> {
  const user = await this.usersRepository.save(data)
  
  // ❌ "We'll add audit logging later"
  // TODO: Add audit log
  
  return user
}

// ❌ Tenant isolation bypass
async findAll(skipTenantCheck = false): Promise<User[]> {
  // ❌ "Admin needs to see all users across tenants"
  if (skipTenantCheck) {
    return this.usersRepository.find()
  }
  return this.usersRepository.find({ where: { tenantId } })
}

// ❌ Validation bypass
async signup(dto: SignupDto, skipValidation = false): Promise<User> {
  // ❌ "For testing purposes"
  if (!skipValidation) {
    await this.validateEmail(dto.email)
  }
  // ...
}
```

**WHY FORBIDDEN:**
- "Temporary" bypasses become permanent
- Audit logging is non-negotiable (legal requirement)
- Tenant isolation is non-negotiable (security requirement)
- Bypasses create security vulnerabilities

**✅ CORRECT:**
```typescript
// ✅ Audit logging is mandatory, no bypass
async createUser(createdBy: User, data: CreateUserDto): Promise<User> {
  const user = await this.usersRepository.save(data)
  
  // ✅ Audit log immediately, no exceptions
  await this.auditService.log({
    userId: createdBy.id,
    tenantId: createdBy.tenantId,
    action: 'user.create',
    entityType: 'user',
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  })
  
  return user
}
```

---

## 🔍 CODE REVIEW PROCESS

### Sprint 3 Specific Checks

#### Step 1: Verify Backend Skeleton

- [ ] NestJS project structure exists
- [ ] Modules are domain-based (identity, audit)
- [ ] `common/` folder has ≤ 20 files
- [ ] Environment configs exist (.env.example, .env.development)
- [ ] Database migrations folder exists

**If structure is wrong → Request restructuring before reviewing code**

---

#### Step 2: Check for Feature Endpoints

Search PR for forbidden endpoints:

```bash
# ❌ FORBIDDEN (auto-reject if found)
@Controller('patients')
@Controller('sessions')
@Controller('clinical-notes')
@Controller('prescriptions')
@Controller('labs')
@Controller('referrals')
@Controller('ai')
```

**If found → Explain that features are Sprint 5+, reject PR**

---

#### Step 3: Verify Tenant Isolation

- [ ] Every entity has `tenantId` column
- [ ] Every query filters by `tenantId`
- [ ] TenantScopeGuard exists and is used
- [ ] No queries skip tenant filtering
- [ ] tenantId comes from auth context, NOT request body

**Test:**
```typescript
// ❌ REJECT: Can fetch cross-tenant data
const user = await usersService.findOne(userId)  // No tenantId filter

// ✅ ACCEPT: Always filters by tenant
const user = await usersService.findOne(userId, tenantId)
```

---

#### Step 4: Verify Audit Logging

- [ ] AuditLog entity exists
- [ ] AuditService exists
- [ ] All critical actions are logged (login, logout, user create, user lock)
- [ ] Audit logs are append-only (no update/delete methods)
- [ ] Database trigger prevents audit log modification
- [ ] No PHI in audit log metadata

**Test:**
```typescript
// ✅ ACCEPT: All critical actions logged
await this.auditService.log({ action: 'auth.login', ... })
await this.auditService.log({ action: 'user.create', ... })
await this.auditService.log({ action: 'user.lock', ... })

// ❌ REJECT: Missing audit log
async lockUser(id: string): Promise<void> {
  await this.usersRepository.update({ id }, { accountStatus: 'locked' })
  // ❌ Missing audit log
}
```

---

#### Step 5: Verify Error Model

- [ ] ErrorCode enum exists
- [ ] ErrorResponse interface exists
- [ ] HttpExceptionFilter exists and is globally applied
- [ ] Custom exceptions use error codes
- [ ] No stack traces or internal details in error responses
- [ ] Errors are explicit, not vague

**Test:**
```typescript
// ✅ ACCEPT: Explicit error
throw new AccountLockedException()  // Clear code and message

// ❌ REJECT: Vague error
throw new Error('Failed')  // Not helpful
```

---

#### Step 6: Verify No Frontend Changes

- [ ] No changes to `frontend/` folder
- [ ] Sprint 1 + 2 UI remains unchanged
- [ ] No new frontend dependencies

**If frontend changes exist → Reject with explanation that Sprint 3 is backend-only**

---

### Review Response Templates

#### ✅ APPROVED

```markdown
**Sprint 3 Review: APPROVED ✅**

This PR meets Sprint 3 requirements:
- ✅ Backend skeleton well-structured (domain modules, clear boundaries)
- ✅ Auth & identity foundation complete (users, tenants, roles, tokens)
- ✅ Tenant isolation enforced (all queries filter by tenantId)
- ✅ Audit logging core implemented (append-only, immutable)
- ✅ Error model clean and explicit (error codes, sanitized messages)
- ✅ No feature endpoints or clinical logic
- ✅ No frontend changes

Approved for merge.

**Next Steps (Sprint 4):**
- Integrate frontend with backend auth
- Test tenant isolation end-to-end
- Verify audit logging in production-like environment
```

#### ❌ CHANGES REQUESTED

```markdown
**Sprint 3 Review: CHANGES REQUESTED ❌**

This PR violates Sprint 3 scope:

**Violations:**
1. ❌ Feature endpoint found: `modules/patients/patients.controller.ts`
   - **Issue:** Patients module implemented
   - **Why forbidden:** Features are Sprint 5+ (read domains)
   - **Required action:** Remove patients module entirely

2. ❌ Tenant isolation missing: `modules/identity/services/users.service.ts:42`
   - **Code:** `async findAll() { return this.usersRepository.find() }`
   - **Why forbidden:** Must filter by tenantId (cross-tenant leak risk)
   - **Required action:** Add tenantId parameter, filter all queries

3. ❌ Audit logging missing: `auth/auth.service.ts:78`
   - **Issue:** User creation not logged
   - **Why forbidden:** All critical actions must be audited (legal requirement)
   - **Required action:** Add audit log call after user creation

4. ❌ Temporary bypass found: `auth/guards/tenant-scope.guard.ts:15`
   - **Code:** `if (skipTenantCheck) { return true }`
   - **Why forbidden:** Tenant isolation is non-negotiable
   - **Required action:** Remove bypass, enforce tenant check always

**Please address these violations and request re-review.**

Reference: [SPRINT_3_EXECUTION_GUIDE.md](docs/SPRINT_3_EXECUTION_GUIDE.md)
```

#### 🚫 BLOCKED

```markdown
**Sprint 3 Review: BLOCKED 🚫**

This PR fundamentally violates Sprint 3 scope.

**Critical Issues:**
- ❌ Implements complete patients, sessions, and clinical notes modules
- ❌ Includes state transition logic (draft → finalized)
- ❌ Implements AI suggestion endpoints
- ❌ Modifies frontend auth UI

**This is Sprint 5, 6, and 7 work being done too early.**

**Required Action:**
- Close this PR
- Revert to Sprint 3 scope: Backend foundation only (auth, tenant, audit, errors)
- Review [SPRINT_BREAKDOWN.md](docs/SPRINT_BREAKDOWN.md) for correct sprint sequencing

**Features and AI belong in future sprints.**
```

---

## ✅ SUCCESS CRITERIA

Sprint 3 is successful ONLY if all criteria met:

### Functional Criteria

- [ ] **Backend can authenticate users**
  - Login endpoint works (returns JWT)
  - Signup endpoint works (creates user with pending status)
  - Refresh token endpoint works
  - Logout endpoint works (invalidates refresh token)

- [ ] **Tenant isolation enforced everywhere**
  - All entities have tenantId
  - All queries filter by tenantId
  - TenantScopeGuard applied to all protected routes
  - Cross-tenant access impossible

- [ ] **Audit logging exists and works**
  - Audit log entity persists successfully
  - All critical actions logged (login, signup, logout, user create/lock)
  - Audit logs cannot be updated or deleted (database trigger enforced)
  - Audit logs queryable by admin

- [ ] **Error model clean and explicit**
  - All errors use error codes
  - Error responses sanitized (no stack traces, no internal details)
  - Errors are helpful (clear messages)

### Code Quality Criteria

- [ ] **No business logic**
  - No feature endpoints (patients, sessions, notes, etc.)
  - No state transitions
  - No clinical validation rules
  - No AI integration

- [ ] **No frontend changes**
  - Sprint 1 + 2 UI unchanged
  - No new frontend dependencies

- [ ] **Module boundaries clear**
  - Domains isolated (identity, audit)
  - `common/` folder ≤ 20 files
  - No circular dependencies

### Security Criteria

- [ ] **Passwords hashed**
  - Bcrypt used for password hashing
  - Salt rounds ≥ 10
  - Passwords never logged

- [ ] **Tokens secure**
  - Access token expires in 15 minutes
  - Refresh token expires in 7 days
  - Tokens signed with strong secret (≥32 characters)

- [ ] **No secrets in code**
  - All secrets in environment variables
  - .env files in .gitignore
  - .env.example provided (no actual secrets)

### Database Criteria

- [ ] **Migrations exist**
  - Users table created
  - Tenants table created
  - Audit logs table created
  - Migrations are reversible

- [ ] **Constraints enforced**
  - Email unique constraint
  - Tenant foreign key constraint
  - Audit log immutability trigger

### Testing Criteria

- [ ] **Unit tests exist**
  - AuthService tested (login, signup, token generation)
  - UsersService tested (tenant isolation verified)
  - AuditService tested (append-only verified)

- [ ] **Integration tests exist**
  - Full auth flow tested (signup → login → refresh → logout)
  - Tenant isolation tested (cross-tenant access denied)
  - Audit logging tested (critical actions logged)

---

## 🚨 COMMON VIOLATIONS & CORRECTIONS

### Violation 1: "Just add patients table"

**❌ VIOLATION:**
```sql
-- migrations/xxx_create_patients.sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**WHY FORBIDDEN:**
- Patients are a feature domain (Sprint 5)
- Sprint 3 is foundation only (auth, tenant, audit)
- Adding patients requires controller, service, DTOs, validation (scope creep)

**✅ CORRECTION:**
```markdown
Patients table belongs in Sprint 5 (Read Domains).

Sprint 3 focus:
- Users table ✅
- Tenants table ✅
- Audit logs table ✅

Sprint 5 will add:
- Patients table
- Sessions table
- Referrals table
```

---

### Violation 2: "Skip audit log for performance"

**❌ VIOLATION:**
```typescript
async login(email: string, password: string) {
  // ... authentication logic ...
  
  // ❌ "Audit logging slows down login, skip it"
  // await this.auditService.log({ action: 'auth.login', ... })
  
  return { accessToken, refreshToken }
}
```

**WHY FORBIDDEN:**
- Audit logging is non-negotiable (legal requirement)
- Performance impact is minimal (async fire-and-forget)
- Removing audit logging creates compliance violations

**✅ CORRECTION:**
```typescript
async login(email: string, password: string) {
  // ... authentication logic ...
  
  // ✅ Audit logging is mandatory, no exceptions
  await this.auditService.log({
    userId: user.id,
    tenantId: user.tenantId,
    action: 'auth.login',
    entityType: 'user',
    entityId: user.id,
    metadata: { email: user.email },
  })
  
  return { accessToken, refreshToken }
}
```

---

### Violation 3: "Allow admin to see all tenants"

**❌ VIOLATION:**
```typescript
async findAllUsers(currentUser: User, skipTenantCheck = false): Promise<User[]> {
  // ❌ "Admins need to see all users across all tenants"
  if (currentUser.role === UserRole.ADMIN && skipTenantCheck) {
    return this.usersRepository.find()  // ❌ Cross-tenant access
  }
  
  return this.usersRepository.find({
    where: { tenantId: currentUser.tenantId },
  })
}
```

**WHY FORBIDDEN:**
- Tenant isolation is non-negotiable (security requirement)
- Even admins are scoped to their tenant
- Cross-tenant access creates data leak risk

**✅ CORRECTION:**
```typescript
async findAllUsers(tenantId: string): Promise<User[]> {
  // ✅ ALL users scoped to tenant, no exceptions
  return this.usersRepository.find({
    where: { tenantId },
  })
}

// ✅ If super-admin access needed (future):
// - Create separate super-admin role (outside tenant model)
// - Require explicit super-admin endpoints
// - Log all cross-tenant access as high-priority audit events
```

---

### Violation 4: "Add permission checking now"

**❌ VIOLATION:**
```typescript
// auth/guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    const requiredPermission = this.reflector.get('permission', context.getHandler())
    
    // ❌ Permission logic too early (Sprint 4+)
    return this.checkPermission(user, requiredPermission)
  }
  
  private checkPermission(user: User, permission: string): boolean {
    // ❌ Role-based feature access belongs in Sprint 4+
    if (user.role === UserRole.PROVIDER && permission === 'notes:write') {
      return true
    }
    return false
  }
}
```

**WHY FORBIDDEN:**
- Permission checking requires features to exist (Sprint 5+)
- Role-based access is tested in Sprint 4 (integration)
- Premature abstraction creates maintenance burden

**✅ CORRECTION:**
```typescript
// Sprint 3: Only basic auth guards
// - JwtAuthGuard (is user authenticated?)
// - TenantScopeGuard (is tenantId present?)

// Sprint 4+: Add feature-specific guards
// - RoleGuard (does user have required role?)
// - PermissionGuard (does user have permission for this feature?)
```

---

### Violation 5: "Store passwords in plaintext for testing"

**❌ VIOLATION:**
```typescript
async signup(dto: SignupDto): Promise<User> {
  const user = this.usersRepository.create({
    email: dto.email,
    passwordHash: dto.password,  // ❌ Storing plaintext password
    role: dto.role,
    accountStatus: AccountStatus.PENDING,
  })
  
  return this.usersRepository.save(user)
}
```

**WHY FORBIDDEN:**
- Passwords must ALWAYS be hashed (no exceptions)
- "Just for testing" becomes permanent
- Security violations from day one are never acceptable

**✅ CORRECTION:**
```typescript
import * as bcrypt from 'bcrypt'

async signup(dto: SignupDto): Promise<User> {
  // ✅ Always hash passwords (no exceptions)
  const passwordHash = await bcrypt.hash(dto.password, 10)
  
  const user = this.usersRepository.create({
    email: dto.email,
    passwordHash,  // ✅ Hashed password
    role: dto.role,
    accountStatus: AccountStatus.PENDING,
  })
  
  return this.usersRepository.save(user)
}
```

---

## 📋 SPRINT 3 COMPLETION CHECKLIST

### Before Marking Sprint 3 Complete

- [ ] Backend skeleton structured (NestJS modules, domain boundaries)
- [ ] Auth module complete (login, signup, refresh, logout endpoints)
- [ ] Identity module complete (users, tenants entities and services)
- [ ] Audit module complete (audit logs entity, audit service, immutability trigger)
- [ ] Tenant isolation enforced (all queries filter by tenantId)
- [ ] TenantScopeGuard applied to all protected routes
- [ ] Error model implemented (error codes, HttpExceptionFilter)
- [ ] Database migrations created (users, tenants, audit_logs tables)
- [ ] Environment configs present (.env.example, .env.development)
- [ ] Passwords hashed with bcrypt
- [ ] Tokens expire correctly (15min access, 7day refresh)
- [ ] All critical actions logged (login, signup, logout, user create/lock)
- [ ] Audit logs cannot be updated or deleted (database trigger)
- [ ] No feature endpoints (patients, sessions, notes, etc.)
- [ ] No clinical logic (state transitions, validation)
- [ ] No AI integration
- [ ] No frontend changes
- [ ] Unit tests written (auth, users, audit services)
- [ ] Integration tests written (full auth flow, tenant isolation)
- [ ] README updated with API documentation

### Sprint 3 Demo Requirements

Demonstrate:
1. **Auth Flow:** Signup → Login → Receive JWT → Refresh Token → Logout
2. **Tenant Isolation:** Create users in 2 tenants → Verify cannot access cross-tenant
3. **Audit Logging:** Perform actions → Query audit logs → Verify all logged
4. **Error Handling:** Trigger errors → Verify clean error responses (no stack traces)
5. **Database Triggers:** Attempt to update audit log → Verify database rejects

### Handoff to Sprint 4

**What Sprint 4 Receives:**
- Complete backend foundation (auth, tenant, audit, errors)
- Clean module boundaries (identity, audit)
- Secure auth (hashed passwords, JWT tokens)
- Enforced tenant isolation (all queries scoped)
- Append-only audit logging (immutable)

**What Sprint 4 Will Add:**
- Frontend integration with backend auth
- Replace localStorage mock with real API calls
- Protected routes with JWT guards
- End-to-end auth testing

---

## 🛡️ PHILOSOPHY

### Foundations Carry Legal Risk

**Why strict enforcement matters:**

1. **Audit Logging is Legal Requirement**
   - HIPAA requires comprehensive audit trails
   - Missing audit logs = compliance violation = fines
   - "We'll add it later" = never added = legal liability

2. **Tenant Isolation is Security Requirement**
   - Cross-tenant data leak = HIPAA violation
   - One vulnerability = all tenants compromised
   - "Optional" tenant filtering = guaranteed vulnerability

3. **Auth Foundations Set Security Posture**
   - Weak password hashing = credential theft
   - Long token expiry = session hijacking
   - No refresh token rotation = unauthorized access

### Features Can Wait, Foundations Cannot

**Why no feature creep:**

- **Patients can wait** → No legal risk if delayed
- **Tenant isolation cannot wait** → Legal risk if skipped
- **Clinical notes can wait** → No compliance risk if delayed
- **Audit logging cannot wait** → Compliance risk if skipped

**Priority:**
1. Auth, tenant, audit (Sprint 3) ← NON-NEGOTIABLE
2. Integration (Sprint 4) ← REQUIRED
3. Features (Sprint 5+) ← IMPORTANT

### Enforcement Beats Elegance

**Why strict rules over flexibility:**

- Elegant code that lacks audit logging = useless
- Flexible tenant filtering = security vulnerability
- "Smart" error handling that leaks details = dangerous

**Better to be:**
- Boring and auditable
- Strict and secure
- Simple and compliant

### If Unsure, Block the Change

**When reviewing Sprint 3 PRs:**

- ❓ "Is this a feature?" → If yes, block (Sprint 5+)
- ❓ "Does this skip audit logging?" → If yes, block (mandatory)
- ❓ "Does this bypass tenant isolation?" → If yes, block (security)
- ❓ "Is this 'temporary'?" → If yes, block (becomes permanent)

**Better to delay than to compromise.**

---

## 🔗 RELATED DOCUMENTATION

- [SPRINT_BREAKDOWN.md](./SPRINT_BREAKDOWN.md) — Complete sprint plan
- [SPRINT_2_EXECUTION_GUIDE.md](./SPRINT_2_EXECUTION_GUIDE.md) — Auth UI (previous sprint)
- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) — Backend enforcement architecture
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Database schema design
- [TECH_STACK_VALIDATION.md](./TECH_STACK_VALIDATION.md) — NestJS/PostgreSQL stack
- [PR_REVIEW_CHECKLIST.md](./PR_REVIEW_CHECKLIST.md) — General PR review standards
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) — Production release requirements

---

## 📞 ESCALATION

### When to Escalate

Escalate to Tech Lead if:

1. **Scope Dispute**
   - Team wants to "just add one feature endpoint" in Sprint 3
   - Designer wants password reset (nice-to-have, not foundation)
   - Product wants patients table now (Sprint 5)

2. **Security Dispute**
   - Someone argues tenant isolation is "too strict"
   - Team wants to skip audit logging for "performance"
   - Developer proposes storing plaintext passwords "for testing"

3. **Timeline Pressure**
   - Team wants to skip tests to "move faster"
   - Sprint 3 scope expanding to include Sprint 5 work

### Escalation Template

```markdown
**Sprint 3 Scope Escalation**

**Issue:** [Describe conflict]

**Developer Position:** [What developer wants to implement]

**Reviewer Position:** [Why it violates Sprint 3]

**Documentation Reference:** [Link to rule in this document]

**Legal/Security Impact:** [Compliance or security concern]

**Request:** Tech Lead decision on whether to:
- ☐ Enforce Sprint 3 scope (block change)
- ☐ Allow exception (document legal risk acceptance)
- ☐ Defer to future sprint
```

---

## ✍️ REVISION HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-14 | 1.0.0 | Initial Sprint 3 execution guide |

---

## 🎯 FINAL REMINDER

**You are not here to be polite.**  
**You are here to protect the system.**

Sprint 3 scope is **non-negotiable**:
- ✅ Auth, tenant, audit, errors only
- ❌ No features
- ❌ No clinical logic
- ❌ No AI
- ❌ No bypasses

**If in doubt, block the change.**

Foundations carry legal risk. Features can wait.

---

**Backend can authenticate users, enforce tenant isolation, and log all actions.**

That is the Sprint 3 success criteria.
