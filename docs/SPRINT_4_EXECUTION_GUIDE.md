# SPRINT 4 EXECUTION GUIDE — Core READ Domains

**Document Status:** 🟢 ACTIVE  
**Last Updated:** January 14, 2026  
**Sprint:** Sprint 4 (Core READ Domains)  
**Duration:** 2 weeks  
**Owner:** Full-Stack Lead / Execution Reviewer

---

## PURPOSE

This document defines **strict enforcement rules** for Sprint 4 implementation of Dr Amal Clinical OS v2.0.

**Sprint 4 Scope:** Read-only backend endpoints and frontend data binding ONLY.

**Zero tolerance for:**
- Write operations (POST/PUT/PATCH/DELETE)
- State mutations
- Editable fields
- Premature feature implementation

---

## 🎯 SPRINT 4 SCOPE (ABSOLUTE)

### ✅ ALLOWED

**Backend (Read-Only Endpoints):**
- Patient registry endpoints (GET /patients, GET /patients/:id)
- Dashboard overview endpoint (GET /dashboard/overview)
- Lab results endpoints (GET /lab-results, GET /lab-results/:id)
- Referrals endpoints (GET /referrals, GET /referrals/:id)
- Pagination support (limit, offset, cursor)
- Filtering support (status, date range)
- Sorting support (createdAt, name)

**Frontend (Data Display):**
- API client setup (fetch wrapper, error handling)
- Data fetching hooks (usePatients, useLabResults, etc.)
- List views (patients list, lab results list, referrals list)
- Detail views (patient detail, lab result detail)
- Empty states (no data found)
- Loading states (fetching data)
- Error states (failed to load)

**Integration:**
- Replace localStorage mock auth with real JWT
- Protected routes with JWT verification
- Tenant-scoped API calls
- Role-based endpoint access

### ❌ FORBIDDEN

**Backend:**
- Write endpoints (POST/PUT/PATCH/DELETE)
- State transition endpoints (finalize, archive, approve)
- Draft saving endpoints
- Any endpoint that modifies data

**Frontend:**
- Editable fields (inputs, textareas, selects)
- Save buttons or form submissions
- Inline editing (click-to-edit)
- Optimistic updates
- Client-side mutations
- Draft state management

**Features (Too Early):**
- Clinical notes (Sprint 6 - write domain)
- Prescriptions (Sprint 6 - write domain)
- Sessions (Sprint 5 - complex read domain)
- AI integration (Sprint 7)

---

## 🚦 ENFORCEMENT RULES

### 1️⃣ READ-ONLY BACKEND ENDPOINTS

#### Allowed HTTP Methods

**✅ ONLY GET ALLOWED:**
```typescript
// ✅ List patients
@Get('patients')
@UseGuards(JwtAuthGuard, TenantScopeGuard)
async findAll(
  @CurrentUser() user: User,
  @Query('limit') limit = 20,
  @Query('offset') offset = 0,
) {
  return this.patientsService.findAll(user.tenantId, { limit, offset })
}

// ✅ Get patient by ID
@Get('patients/:id')
@UseGuards(JwtAuthGuard, TenantScopeGuard)
async findOne(
  @CurrentUser() user: User,
  @Param('id') id: string,
) {
  return this.patientsService.findOne(id, user.tenantId)
}

// ✅ List lab results
@Get('lab-results')
@UseGuards(JwtAuthGuard, TenantScopeGuard)
async findLabResults(
  @CurrentUser() user: User,
  @Query('patientId') patientId?: string,
  @Query('status') status?: string,
) {
  return this.labResultsService.findAll(user.tenantId, { patientId, status })
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Create patient (Sprint 5)
@Post('patients')
async create(@Body() dto: CreatePatientDto) {
  // ❌ Write operation not allowed in Sprint 4
}

// ❌ Update patient (Sprint 5)
@Patch('patients/:id')
async update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
  // ❌ Write operation not allowed in Sprint 4
}

// ❌ Delete patient (never allowed - soft delete only in Sprint 6+)
@Delete('patients/:id')
async delete(@Param('id') id: string) {
  // ❌ Write operation not allowed in Sprint 4
}

// ❌ State transition (Sprint 6)
@Post('lab-results/:id/review')
async reviewLabResult(@Param('id') id: string) {
  // ❌ State change not allowed in Sprint 4
}
```

#### Tenant Isolation (Mandatory)

**✅ REQUIRED:**
```typescript
// modules/patients/services/patients.service.ts
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Patient } from '../entities/patient.entity'

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
  ) {}

  // ✅ ALWAYS filter by tenantId
  async findAll(tenantId: string, options: { limit: number; offset: number }) {
    return this.patientsRepository.find({
      where: { tenantId },
      take: options.limit,
      skip: options.offset,
      order: { createdAt: 'DESC' },
    })
  }

  // ✅ ALWAYS include tenantId in where clause
  async findOne(id: string, tenantId: string): Promise<Patient | null> {
    return this.patientsRepository.findOne({
      where: { id, tenantId },
    })
  }
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Missing tenant filter
async findAll(limit: number, offset: number) {
  return this.patientsRepository.find({
    take: limit,
    skip: offset,
  })  // ❌ No tenantId filter - cross-tenant leak
}

// ❌ Optional tenant filter
async findOne(id: string, tenantId?: string) {
  const where: any = { id }
  if (tenantId) where.tenantId = tenantId  // ❌ Optional = bypassable
  return this.patientsRepository.findOne({ where })
}

// ❌ Tenant from request body
async findAll(@Body('tenantId') tenantId: string) {
  // ❌ Frontend can manipulate tenantId
  return this.patientsRepository.find({ where: { tenantId } })
}
```

#### Role-Based Access

**✅ REQUIRED:**
```typescript
// auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const Roles = (...roles: string[]) => SetMetadata('roles', roles)

// auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler())
    if (!requiredRoles) {
      return true  // No role restriction
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions')
    }

    return true
  }
}

// Usage in controller
@Get('patients')
@UseGuards(JwtAuthGuard, TenantScopeGuard, RolesGuard)
@Roles('provider', 'admin')  // Only providers and admins
async findAll(@CurrentUser() user: User) {
  return this.patientsService.findAll(user.tenantId)
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Role check in service (should be in guard)
async findAll(tenantId: string, userRole: string) {
  if (userRole !== 'provider') {
    throw new Error('Only providers can view patients')
  }
  return this.patientsRepository.find({ where: { tenantId } })
}

// ❌ Permission based on request body
@Get('patients')
async findAll(@Body('role') role: string) {
  // ❌ Frontend can manipulate role
  if (role === 'admin') {
    return this.patientsService.findAllAcrossTenants()
  }
}
```

#### Pagination (Mandatory for Lists)

**✅ REQUIRED:**
```typescript
// DTOs for pagination
export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0
}

// Controller
@Get('patients')
async findAll(
  @CurrentUser() user: User,
  @Query() pagination: PaginationDto,
) {
  const { limit = 20, offset = 0 } = pagination
  
  const [items, total] = await this.patientsService.findAll(
    user.tenantId,
    { limit, offset }
  )

  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  }
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ No pagination (unbounded query)
@Get('patients')
async findAll(@CurrentUser() user: User) {
  return this.patientsRepository.find({
    where: { tenantId: user.tenantId }
  })  // ❌ Could return millions of records
}

// ❌ Client-side pagination
@Get('patients')
async findAll(@CurrentUser() user: User) {
  const allPatients = await this.patientsRepository.find({
    where: { tenantId: user.tenantId }
  })
  // ❌ Returning all data, letting frontend paginate
  return allPatients
}
```

---

### 2️⃣ FRONTEND DATA BINDING

#### API Client Setup

**✅ REQUIRED:**
```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiError {
  statusCode: number
  code: string
  message: string
}

export class ApiClient {
  private static getAuthToken(): string | null {
    // ✅ Get real JWT from localStorage (Sprint 4)
    return localStorage.getItem('accessToken')
  }

  static async get<T>(endpoint: string): Promise<T> {
    const token = this.getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message)
    }

    return response.json()
  }

  // ❌ NO post/put/patch/delete methods in Sprint 4
  // These will be added in Sprint 6 (write domains)
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Write methods (not allowed in Sprint 4)
static async post<T>(endpoint: string, data: any): Promise<T> {
  // ❌ POST not allowed in Sprint 4
}

static async put<T>(endpoint: string, data: any): Promise<T> {
  // ❌ PUT not allowed in Sprint 4
}

static async patch<T>(endpoint: string, data: any): Promise<T> {
  // ❌ PATCH not allowed in Sprint 4
}

static async delete<T>(endpoint: string): Promise<T> {
  // ❌ DELETE not allowed in Sprint 4
}
```

#### Data Fetching Hooks

**✅ REQUIRED:**
```typescript
// hooks/use-patients.ts
import { useEffect, useState } from 'react'
import { ApiClient } from '@/lib/api-client'

interface Patient {
  id: string
  fullName: string
  dateOfBirth: string
  gender: string
  phone: string
  email: string
  createdAt: string
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPatients() {
      try {
        setIsLoading(true)
        setError(null)
        
        const data = await ApiClient.get<{ items: Patient[] }>('/patients?limit=20&offset=0')
        setPatients(data.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patients')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [])

  return { patients, isLoading, error }
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Mutation hooks (not allowed in Sprint 4)
export function useCreatePatient() {
  const [isCreating, setIsCreating] = useState(false)
  
  const create = async (data: CreatePatientDto) => {
    setIsCreating(true)
    await ApiClient.post('/patients', data)  // ❌ POST not allowed
    setIsCreating(false)
  }
  
  return { create, isCreating }
}

// ❌ Update hook (not allowed in Sprint 4)
export function useUpdatePatient(id: string) {
  const update = async (data: UpdatePatientDto) => {
    await ApiClient.patch(`/patients/${id}`, data)  // ❌ PATCH not allowed
  }
  return { update }
}
```

#### List Views (Read-Only)

**✅ REQUIRED:**
```tsx
// app/patients/page.tsx
'use client'

import { usePatients } from '@/hooks/use-patients'
import { LoadingState } from '@/components/states/LoadingState'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'

export default function PatientsPage() {
  const { patients, isLoading, error } = usePatients()

  if (isLoading) {
    return <LoadingState message="Loading patients..." />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (patients.length === 0) {
    return <EmptyState message="No patients found" />
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Patients</h1>
      
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Date of Birth</th>
              <th className="px-4 py-3 text-left">Gender</th>
              <th className="px-4 py-3 text-left">Phone</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{patient.fullName}</td>
                <td className="px-4 py-3">{patient.dateOfBirth}</td>
                <td className="px-4 py-3">{patient.gender}</td>
                <td className="px-4 py-3">{patient.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**❌ FORBIDDEN:**
```tsx
// ❌ Editable fields (not allowed in Sprint 4)
<tr>
  <td>
    <input
      value={patient.fullName}
      onChange={(e) => updatePatient({ fullName: e.target.value })}  // ❌ Edit
    />
  </td>
</tr>

// ❌ Save button (not allowed in Sprint 4)
<button onClick={handleSave}>Save Changes</button>

// ❌ Inline editing (not allowed in Sprint 4)
<td onClick={() => setEditMode(true)}>
  {editMode ? <input value={patient.fullName} /> : patient.fullName}
</td>

// ❌ Delete button (not allowed in Sprint 4)
<button onClick={() => deletePatient(patient.id)}>Delete</button>
```

#### Detail Views (Read-Only)

**✅ REQUIRED:**
```tsx
// app/patients/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ApiClient } from '@/lib/api-client'

interface Patient {
  id: string
  fullName: string
  dateOfBirth: string
  gender: string
  phone: string
  email: string
  address: string
  createdAt: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPatient() {
      try {
        setIsLoading(true)
        const data = await ApiClient.get<Patient>(`/patients/${params.id}`)
        setPatient(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patient')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatient()
  }, [params.id])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!patient) return <EmptyState message="Patient not found" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{patient.fullName}</h1>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* ✅ Read-only display */}
        <div>
          <label className="text-sm font-medium text-gray-600">Date of Birth</label>
          <p className="text-gray-900">{patient.dateOfBirth}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600">Gender</label>
          <p className="text-gray-900">{patient.gender}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600">Phone</label>
          <p className="text-gray-900">{patient.phone}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600">Email</label>
          <p className="text-gray-900">{patient.email}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600">Address</label>
          <p className="text-gray-900">{patient.address}</p>
        </div>
      </div>
    </div>
  )
}
```

**❌ FORBIDDEN:**
```tsx
// ❌ Editable form (not allowed in Sprint 4)
<form onSubmit={handleSubmit}>
  <input
    value={patient.fullName}
    onChange={(e) => setPatient({ ...patient, fullName: e.target.value })}
  />
  <button type="submit">Save</button>  // ❌ Save button
</form>

// ❌ Edit mode toggle (not allowed in Sprint 4)
const [isEditing, setIsEditing] = useState(false)
<button onClick={() => setIsEditing(true)}>Edit</button>

// ❌ Optimistic update (not allowed in Sprint 4)
const handleUpdate = async () => {
  setPatient({ ...patient, fullName: newName })  // ❌ Optimistic
  await ApiClient.patch(`/patients/${id}`, { fullName: newName })
}
```

---

### 3️⃣ STATE REPRESENTATION (VISUAL ONLY)

#### Display State, Don't Change It

**✅ REQUIRED:**
```tsx
// components/LabResultCard.tsx
interface LabResult {
  id: string
  testName: string
  value: string
  status: 'pending' | 'reviewed' | 'archived'
  orderedAt: string
  reviewedAt: string | null
}

export function LabResultCard({ labResult }: { labResult: LabResult }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{labResult.testName}</h3>
      <p className="text-gray-600">Value: {labResult.value}</p>
      
      {/* ✅ Display status visually */}
      <div className="mt-2">
        <span className={`
          px-2 py-1 rounded text-sm
          ${labResult.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${labResult.status === 'reviewed' ? 'bg-green-100 text-green-800' : ''}
          ${labResult.status === 'archived' ? 'bg-gray-100 text-gray-800' : ''}
        `}>
          {labResult.status}
        </span>
      </div>
      
      {/* ❌ NO state change buttons in Sprint 4 */}
      {/* <button onClick={() => markAsReviewed()}>Mark as Reviewed</button> */}
    </div>
  )
}
```

**❌ FORBIDDEN:**
```tsx
// ❌ State change dropdown (not allowed in Sprint 4)
<select
  value={labResult.status}
  onChange={(e) => updateStatus(e.target.value)}  // ❌ State change
>
  <option value="pending">Pending</option>
  <option value="reviewed">Reviewed</option>
  <option value="archived">Archived</option>
</select>

// ❌ State transition button (not allowed in Sprint 4)
{labResult.status === 'pending' && (
  <button onClick={handleReview}>Mark as Reviewed</button>  // ❌ State change
)}

// ❌ Checkbox to change status (not allowed in Sprint 4)
<input
  type="checkbox"
  checked={labResult.status === 'reviewed'}
  onChange={(e) => toggleReviewed(e.target.checked)}  // ❌ State change
/>
```

#### Status Badges (Read-Only Visual Feedback)

**✅ REQUIRED:**
```tsx
// components/ui/StatusBadge.tsx
interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const colors = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${colors[variant]}`}>
      {status}
    </span>
  )
}

// Usage
<StatusBadge status="Pending" variant="warning" />
<StatusBadge status="Reviewed" variant="success" />
<StatusBadge status="Archived" variant="default" />
```

---

### 4️⃣ ERROR HANDLING (SAFE & QUIET)

#### Error Display (Calm and Informative)

**✅ REQUIRED:**
```tsx
// components/states/ErrorState.tsx
interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg className="w-12 h-12 text-red-500 mx-auto" /* ... */ />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to Load Data
        </h3>
        
        {/* ✅ Sanitized, user-friendly message */}
        <p className="text-gray-600 mb-4">
          {message || 'An unexpected error occurred. Please try again.'}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
```

**❌ FORBIDDEN:**
```tsx
// ❌ Exposing stack traces
<ErrorState message={error.stack} />  // ❌ Internal details

// ❌ Exposing backend errors
<ErrorState message={`Database error: ${error.query}`} />  // ❌ SQL query

// ❌ Silent failure
try {
  await fetchPatients()
} catch (error) {
  // ❌ Swallowing error, showing nothing
}

// ❌ Generic unhelpful message
<ErrorState message="Error" />  // ❌ Not helpful
```

#### Error Logging (Server-Side Only)

**✅ REQUIRED:**
```typescript
// Backend: Log errors server-side, return sanitized message to client
try {
  const patients = await this.patientsService.findAll(tenantId)
  return patients
} catch (error) {
  // ✅ Log full error server-side
  console.error('Failed to fetch patients:', error)
  
  // ✅ Return sanitized error to client
  throw new InternalServerErrorException('Failed to load patients')
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Returning raw error to client
catch (error) {
  throw new InternalServerErrorException(error.message)  // ❌ May leak internals
}

// ❌ No logging (silent failure)
catch (error) {
  return []  // ❌ Swallowing error
}
```

---

### 5️⃣ PERFORMANCE & SAFETY

#### Pagination Implementation

**✅ REQUIRED (Frontend):**
```tsx
// app/patients/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ApiClient } from '@/lib/api-client'

interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [pagination, setPagination] = useState({ offset: 0, limit: 20 })
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchPatients() {
      setIsLoading(true)
      try {
        const data = await ApiClient.get<PaginatedResponse<Patient>>(
          `/patients?limit=${pagination.limit}&offset=${pagination.offset}`
        )
        setPatients(data.items)
        setHasMore(data.hasMore)
      } catch (error) {
        console.error('Failed to fetch patients:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [pagination])

  const handleNextPage = () => {
    setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))
  }

  const handlePrevPage = () => {
    setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))
  }

  return (
    <div>
      {/* Patient list */}
      <table>{ /* ... */ }</table>
      
      {/* Pagination controls */}
      <div className="flex justify-between mt-4">
        <button
          onClick={handlePrevPage}
          disabled={pagination.offset === 0}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        
        <span className="text-gray-600">
          Showing {pagination.offset + 1} - {pagination.offset + patients.length}
        </span>
        
        <button
          onClick={handleNextPage}
          disabled={!hasMore}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

**❌ FORBIDDEN:**
```tsx
// ❌ Loading all data, paginating client-side
useEffect(() => {
  const allPatients = await ApiClient.get('/patients')  // ❌ No limit
  setPatients(allPatients)
  // Client-side pagination here
}, [])

// ❌ Unbounded query
const { data } = useQuery('patients', () =>
  fetch('/api/patients').then(r => r.json())  // ❌ No pagination
)
```

#### No Client-Side Filtering of Sensitive Data

**✅ REQUIRED:**
```typescript
// ✅ Backend filtering (server-side)
@Get('lab-results')
async findLabResults(
  @CurrentUser() user: User,
  @Query('status') status?: string,
) {
  // ✅ Filter on backend
  return this.labResultsService.findAll(user.tenantId, { status })
}
```

**❌ FORBIDDEN:**
```typescript
// ❌ Client-side filtering (security risk)
// Frontend fetches ALL lab results, then filters
const allLabResults = await ApiClient.get('/lab-results')  // ❌ Returns all
const pendingResults = allLabResults.filter(r => r.status === 'pending')  // ❌ Client-side

// This is dangerous because:
// 1. User sees all data in network tab (even if UI filters it out)
// 2. Performance issue (loading unnecessary data)
// 3. Security risk (exposing data user shouldn't see)
```

---

### 6️⃣ ABSOLUTE FORBIDDEN ITEMS

#### ❌ POST / PUT / PATCH / DELETE Endpoints

**FORBIDDEN:**
```typescript
// ❌ Create patient (Sprint 5)
@Post('patients')
async create(@Body() dto: CreatePatientDto) { /* ... */ }

// ❌ Update patient (Sprint 5)
@Patch('patients/:id')
async update(@Param('id') id: string, @Body() dto: UpdatePatientDto) { /* ... */ }

// ❌ Delete patient (Sprint 6+, soft delete only)
@Delete('patients/:id')
async delete(@Param('id') id: string) { /* ... */ }

// ❌ Bulk update (Sprint 6+)
@Patch('patients/bulk')
async bulkUpdate(@Body() dto: BulkUpdateDto) { /* ... */ }
```

**WHY FORBIDDEN:**
- Write operations belong in Sprint 5 (simple writes) and Sprint 6 (complex writes)
- Sprint 4 is read-only integration only
- Premature writes skip state machine implementation

---

#### ❌ Draft Saving

**FORBIDDEN:**
```typescript
// ❌ Save draft (Sprint 6)
@Post('clinical-notes/draft')
async saveDraft(@Body() dto: SaveDraftDto) {
  // ❌ Drafts are Sprint 6 (write domains with state transitions)
}

// ❌ Auto-save (Sprint 6)
@Patch('clinical-notes/:id/autosave')
async autosave(@Param('id') id: string, @Body() dto: AutosaveDto) {
  // ❌ Auto-save requires draft state management
}
```

**WHY FORBIDDEN:**
- Drafts require state machine (draft → finalized)
- State transitions are Sprint 6
- Sprint 4 is read-only only

---

#### ❌ Status Updates

**FORBIDDEN:**
```typescript
// ❌ Mark lab result as reviewed (Sprint 6)
@Post('lab-results/:id/review')
async markAsReviewed(@Param('id') id: string) {
  // ❌ State transition (pending → reviewed)
}

// ❌ Archive referral (Sprint 6)
@Post('referrals/:id/archive')
async archive(@Param('id') id: string) {
  // ❌ State transition (active → archived)
}

// ❌ Bulk status update (Sprint 6)
@Patch('lab-results/bulk-review')
async bulkReview(@Body('ids') ids: string[]) {
  // ❌ Bulk state transitions
}
```

**WHY FORBIDDEN:**
- State transitions require state machine implementation
- State machines are Sprint 6
- Sprint 4 displays state, doesn't change it

---

#### ❌ AI Suggestions

**FORBIDDEN:**
```typescript
// ❌ AI suggestion endpoint (Sprint 7)
@Post('ai/suggest-note')
async suggestNote(@Body() context: any) {
  // ❌ AI integration is Sprint 7
}

// ❌ AI-generated summary (Sprint 7)
@Get('patients/:id/ai-summary')
async getAISummary(@Param('id') id: string) {
  // ❌ Even read-only AI is Sprint 7
}
```

**WHY FORBIDDEN:**
- AI integration is Sprint 7
- AI requires safety guardrails and human-in-the-loop
- Sprint 4 is pure data display

---

#### ❌ Hidden Writes

**FORBIDDEN:**
```typescript
// ❌ Logging user activity as write operation
@Get('patients/:id')
async getPatient(@Param('id') id: string, @CurrentUser() user: User) {
  const patient = await this.patientsService.findOne(id, user.tenantId)
  
  // ❌ Hidden write (incrementing view count)
  await this.patientsService.incrementViewCount(id)  // ❌ Write operation
  
  return patient
}

// ❌ Tracking last accessed (hidden write)
@Get('lab-results/:id')
async getLabResult(@Param('id') id: string, @CurrentUser() user: User) {
  const labResult = await this.labResultsService.findOne(id, user.tenantId)
  
  // ❌ Hidden write (updating last accessed timestamp)
  await this.labResultsService.updateLastAccessed(id, new Date())  // ❌ Write
  
  return labResult
}
```

**WHY FORBIDDEN:**
- Sprint 4 is read-only, NO exceptions
- Hidden writes violate read-only contract
- Analytics/tracking should be separate (audit logs, not entity updates)

**✅ CORRECT (Sprint 4):**
```typescript
// ✅ Pure read operation (audit log for tracking, not entity update)
@Get('patients/:id')
async getPatient(@Param('id') id: string, @CurrentUser() user: User) {
  const patient = await this.patientsService.findOne(id, user.tenantId)
  
  // ✅ Audit log (append-only, doesn't modify patient entity)
  await this.auditService.log({
    userId: user.id,
    tenantId: user.tenantId,
    action: 'patient.view',
    entityType: 'patient',
    entityId: id,
  })
  
  return patient
}
```

---

## 🔍 CODE REVIEW PROCESS

### Sprint 4 Specific Checks

#### Step 1: Verify Read-Only Endpoints

- [ ] All endpoints use GET method only
- [ ] No POST/PUT/PATCH/DELETE endpoints
- [ ] All endpoints enforce tenant isolation
- [ ] All endpoints enforce role-based access
- [ ] Pagination implemented for list endpoints

**Search PR for forbidden HTTP methods:**
```bash
# ❌ FORBIDDEN (auto-reject if found)
@Post(
@Put(
@Patch(
@Delete(
```

---

#### Step 2: Verify No Hidden Writes

- [ ] GET endpoints don't modify data
- [ ] No view count increments
- [ ] No last accessed timestamps
- [ ] No usage tracking (except audit logs)

**Look for write operations in GET handlers:**
```typescript
// ❌ REJECT
@Get('...')
async handler() {
  await this.repository.update(...)  // ❌ Write in GET
  await this.repository.save(...)    // ❌ Write in GET
  await this.repository.delete(...)  // ❌ Write in GET
}
```

---

#### Step 3: Verify Frontend Read-Only

- [ ] No editable inputs in data views
- [ ] No save buttons
- [ ] No inline editing
- [ ] No optimistic updates
- [ ] StatusBadges are display-only (no click handlers to change state)

**Search frontend code for forbidden patterns:**
```tsx
// ❌ FORBIDDEN
<input value={data} onChange={handleChange} />  // ❌ Editable
<button onClick={handleSave}>Save</button>      // ❌ Save button
<select onChange={handleStatusChange}>          // ❌ State change
onClick={handleEdit}                            // ❌ Edit action
```

---

#### Step 4: Verify Tenant Isolation

- [ ] All queries include tenantId filter
- [ ] tenantId comes from JWT (not request body)
- [ ] TenantScopeGuard applied to all endpoints
- [ ] No optional tenant filtering

**Test:**
```typescript
// ✅ ACCEPT
async findAll(tenantId: string) {
  return this.repository.find({ where: { tenantId } })
}

// ❌ REJECT
async findAll() {
  return this.repository.find()  // ❌ No tenant filter
}
```

---

#### Step 5: Verify Error Handling

- [ ] Errors are caught and sanitized
- [ ] No stack traces in API responses
- [ ] No internal details exposed
- [ ] Frontend shows calm error messages
- [ ] Retry functionality available

---

#### Step 6: Verify Performance

- [ ] Pagination implemented (max 100 items per page)
- [ ] No unbounded queries
- [ ] Filtering done server-side (not client-side)
- [ ] Sorting done server-side (not client-side)

---

### Review Response Templates

#### ✅ APPROVED

```markdown
**Sprint 4 Review: APPROVED ✅**

This PR meets Sprint 4 requirements:
- ✅ Read-only endpoints only (GET methods)
- ✅ Tenant isolation enforced (all queries filter by tenantId)
- ✅ Role-based access implemented (guards applied)
- ✅ Pagination implemented (max 100 items per page)
- ✅ Frontend read-only (no editable fields, no save buttons)
- ✅ Error handling safe (sanitized messages, no stack traces)
- ✅ No hidden writes in GET endpoints

Approved for merge.

**Next Steps (Sprint 5):**
- Test end-to-end data flow (auth → fetch → display)
- Verify tenant isolation in production-like environment
- Performance test pagination with large datasets
```

#### ❌ CHANGES REQUESTED

```markdown
**Sprint 4 Review: CHANGES REQUESTED ❌**

This PR violates Sprint 4 scope:

**Violations:**
1. ❌ Write endpoint found: `modules/patients/patients.controller.ts:42`
   - **Code:** `@Post('patients') async create(...) { ... }`
   - **Why forbidden:** Sprint 4 is read-only, write operations are Sprint 5+
   - **Required action:** Remove POST endpoint entirely

2. ❌ Hidden write in GET endpoint: `modules/patients/patients.controller.ts:18`
   - **Code:** `await this.patientsService.incrementViewCount(id)`
   - **Why forbidden:** GET endpoints must not modify data (read-only contract)
   - **Required action:** Remove view count increment, use audit log only

3. ❌ Editable field found: `app/patients/[id]/page.tsx:35`
   - **Code:** `<input value={patient.name} onChange={handleChange} />`
   - **Why forbidden:** Frontend must be read-only in Sprint 4
   - **Required action:** Change to read-only display: `<p>{patient.name}</p>`

4. ❌ Tenant isolation missing: `modules/patients/services/patients.service.ts:25`
   - **Code:** `async findAll() { return this.repository.find() }`
   - **Why forbidden:** Must filter by tenantId (cross-tenant leak risk)
   - **Required action:** Add tenantId parameter and filter

**Please address these violations and request re-review.**

Reference: [SPRINT_4_EXECUTION_GUIDE.md](docs/SPRINT_4_EXECUTION_GUIDE.md)
```

#### 🚫 BLOCKED

```markdown
**Sprint 4 Review: BLOCKED 🚫**

This PR fundamentally violates Sprint 4 scope.

**Critical Issues:**
- ❌ Implements complete CRUD operations (Create, Update, Delete)
- ❌ Implements state transitions (draft → finalized)
- ❌ Includes editable forms with save functionality
- ❌ Implements AI suggestion endpoints

**This is Sprint 6 and Sprint 7 work being done too early.**

**Required Action:**
- Close this PR
- Revert to Sprint 4 scope: Read-only endpoints and frontend data display
- Review [SPRINT_BREAKDOWN.md](docs/SPRINT_BREAKDOWN.md) for correct sprint sequencing

**Write operations belong in Sprint 5 and Sprint 6.**
**AI integration belongs in Sprint 7.**
```

---

## ✅ SUCCESS CRITERIA

Sprint 4 is successful ONLY if all criteria met:

### Functional Criteria

- [ ] **UI shows real data**
  - Patients list displays real data from backend
  - Patient detail view displays real data
  - Lab results list displays real data
  - Referrals list displays real data
  - Dashboard overview displays real aggregated data

- [ ] **Nothing can be edited**
  - No editable inputs on any page
  - No save buttons anywhere
  - No inline editing functionality
  - Status badges are display-only (no click to change)

- [ ] **Auth integration complete**
  - LocalStorage mock auth replaced with real JWT
  - Protected routes verify JWT
  - Unauthorized requests redirect to login
  - Token refresh works automatically

- [ ] **Tenant isolation holds**
  - Users can only see data from their tenant
  - Cross-tenant access impossible
  - TenantId verified on every request

### Code Quality Criteria

- [ ] **Backend read-only**
  - All endpoints use GET method
  - No POST/PUT/PATCH/DELETE endpoints
  - No hidden writes in GET handlers
  - Pagination implemented for all lists

- [ ] **Frontend read-only**
  - No editable fields
  - No save buttons
  - No form submissions
  - No optimistic updates

- [ ] **Error handling safe**
  - Errors are sanitized
  - No stack traces exposed
  - Calm, helpful error messages
  - Retry functionality available

### Security Criteria

- [ ] **Tenant isolation enforced**
  - All queries filter by tenantId
  - tenantId from JWT only (not request body)
  - TenantScopeGuard applied to all endpoints
  - Cross-tenant access tested and blocked

- [ ] **Role-based access enforced**
  - RolesGuard applied to endpoints
  - Providers can access clinical data
  - Admins can access admin data
  - Caregivers have read-only access

### Performance Criteria

- [ ] **Pagination works**
  - Max 100 items per page
  - Offset/limit working correctly
  - HasMore flag accurate
  - Previous/Next navigation functional

- [ ] **No unbounded queries**
  - All list endpoints paginated
  - Filtering done server-side
  - Sorting done server-side
  - No client-side filtering of large datasets

### Testing Criteria

- [ ] **Integration tests exist**
  - Full data flow tested (auth → fetch → display)
  - Tenant isolation tested (cross-tenant access denied)
  - Role-based access tested (unauthorized access denied)
  - Pagination tested (correct items returned)

- [ ] **End-to-end tests exist**
  - Login → Navigate to patients → See patient list
  - Login → View patient detail → See patient data
  - Login as different tenant → See different data
  - Login as different role → See role-appropriate data

---

## 🚨 COMMON VIOLATIONS & CORRECTIONS

### Violation 1: "Just add a quick edit button"

**❌ VIOLATION:**
```tsx
// "Providers need to update patient phone numbers quickly"
<button onClick={() => handleQuickEdit(patient.id, 'phone', newPhone)}>
  Update Phone
</button>
```

**WHY FORBIDDEN:**
- Sprint 4 is read-only only
- Edits require state management and validation (Sprint 5)
- "Quick" edits skip proper workflow

**✅ CORRECTION:**
```tsx
// Sprint 4: Display only
<div>
  <label>Phone</label>
  <p>{patient.phone}</p>
</div>

// Sprint 5 will add edit functionality with proper validation
```

---

### Violation 2: "Auto-increment view count for analytics"

**❌ VIOLATION:**
```typescript
// "We need to track which patients are viewed most"
@Get('patients/:id')
async getPatient(@Param('id') id: string, @CurrentUser() user: User) {
  const patient = await this.patientsService.findOne(id, user.tenantId)
  
  // ❌ Hidden write operation
  await this.patientsService.incrementViewCount(id)
  
  return patient
}
```

**WHY FORBIDDEN:**
- GET endpoints must not modify data
- Violates read-only contract
- Analytics should not modify entities

**✅ CORRECTION:**
```typescript
// Sprint 4: Pure read, use audit log for tracking
@Get('patients/:id')
async getPatient(@Param('id') id: string, @CurrentUser() user: User) {
  const patient = await this.patientsService.findOne(id, user.tenantId)
  
  // ✅ Audit log (append-only, doesn't modify patient)
  await this.auditService.log({
    userId: user.id,
    tenantId: user.tenantId,
    action: 'patient.view',
    entityType: 'patient',
    entityId: id,
  })
  
  return patient
}

// Sprint 6: If view count needed, derive from audit logs (query, not entity field)
```

---

### Violation 3: "Load all patients, filter client-side"

**❌ VIOLATION:**
```tsx
// "Easier to fetch all patients once, then filter in React"
const { data: allPatients } = useQuery('patients', () =>
  ApiClient.get('/patients')  // ❌ No pagination, returns all
)

const activePatients = allPatients.filter(p => p.status === 'active')  // ❌ Client-side
```

**WHY FORBIDDEN:**
- Performance issue (loading unnecessary data)
- Security risk (exposing all data in network tab)
- Filtering should be server-side

**✅ CORRECTION:**
```tsx
// Sprint 4: Server-side filtering with pagination
const { data: activePatients } = useQuery('active-patients', () =>
  ApiClient.get('/patients?status=active&limit=20&offset=0')
)
```

---

### Violation 4: "Add status change dropdown for convenience"

**❌ VIOLATION:**
```tsx
// "Let providers mark lab results as reviewed quickly"
<select
  value={labResult.status}
  onChange={(e) => updateLabResultStatus(labResult.id, e.target.value)}
>
  <option value="pending">Pending</option>
  <option value="reviewed">Reviewed</option>
</select>
```

**WHY FORBIDDEN:**
- State changes require state machine implementation (Sprint 6)
- Sprint 4 displays state, doesn't change it
- Status updates need proper audit logging and validation

**✅ CORRECTION:**
```tsx
// Sprint 4: Display status only
<StatusBadge
  status={labResult.status}
  variant={labResult.status === 'reviewed' ? 'success' : 'warning'}
/>

// Sprint 6 will add status change functionality with state machine
```

---

### Violation 5: "Show all tenants' data to super admin"

**❌ VIOLATION:**
```typescript
// "Super admins need to see data across all tenants"
@Get('patients')
async findAll(@CurrentUser() user: User, @Query('allTenants') allTenants?: boolean) {
  if (user.role === 'admin' && allTenants) {
    // ❌ Cross-tenant access
    return this.patientsRepository.find()
  }
  
  return this.patientsRepository.find({ where: { tenantId: user.tenantId } })
}
```

**WHY FORBIDDEN:**
- Tenant isolation is non-negotiable
- Even admins are scoped to their tenant
- Cross-tenant access creates data leak risk

**✅ CORRECTION:**
```typescript
// Sprint 4: All users scoped to their tenant, no exceptions
@Get('patients')
async findAll(@CurrentUser() user: User) {
  // ✅ ALWAYS filter by tenantId
  return this.patientsRepository.find({
    where: { tenantId: user.tenantId }
  })
}

// Future: If cross-tenant access needed
// - Create separate super-admin role (outside tenant model)
// - Require explicit super-admin endpoints
// - Log all cross-tenant access as high-priority audit events
```

---

## 📋 SPRINT 4 COMPLETION CHECKLIST

### Before Marking Sprint 4 Complete

**Backend:**
- [ ] Patient registry endpoints (GET /patients, GET /patients/:id)
- [ ] Lab results endpoints (GET /lab-results, GET /lab-results/:id)
- [ ] Referrals endpoints (GET /referrals, GET /referrals/:id)
- [ ] Dashboard overview endpoint (GET /dashboard/overview)
- [ ] All endpoints enforce tenant isolation
- [ ] All endpoints enforce role-based access
- [ ] Pagination implemented for all list endpoints
- [ ] No POST/PUT/PATCH/DELETE endpoints
- [ ] No hidden writes in GET endpoints

**Frontend:**
- [ ] API client setup (with JWT auth)
- [ ] Auth integration complete (real JWT, not localStorage mock)
- [ ] Patients list view (displays real data)
- [ ] Patient detail view (displays real data)
- [ ] Lab results list view (displays real data)
- [ ] Referrals list view (displays real data)
- [ ] Dashboard overview (displays real aggregated data)
- [ ] No editable fields anywhere
- [ ] No save buttons anywhere
- [ ] Error handling implemented (calm, safe messages)
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Pagination UI implemented (Previous/Next)

**Security:**
- [ ] Tenant isolation tested (cross-tenant access blocked)
- [ ] Role-based access tested (unauthorized access blocked)
- [ ] JWT verification working
- [ ] Token refresh working
- [ ] Error messages sanitized (no stack traces, no internals)

**Testing:**
- [ ] Integration tests (auth → fetch → display)
- [ ] Tenant isolation tests (cross-tenant blocked)
- [ ] Role-based access tests (unauthorized blocked)
- [ ] Pagination tests (correct items returned)
- [ ] End-to-end tests (user journey complete)

### Sprint 4 Demo Requirements

Demonstrate:
1. **Auth Flow:** Login → Receive JWT → Auto-redirect to dashboard
2. **Data Display:** Navigate to patients → See real patient list (not mock data)
3. **Pagination:** Click Next/Previous → See different pages of data
4. **Tenant Isolation:** Login as different tenant → See different data
5. **Role-Based Access:** Login as caregiver → See read-only view
6. **Read-Only UI:** Attempt to edit → No editable fields or save buttons exist
7. **Error Handling:** Trigger error (e.g., network failure) → See calm error message

### Handoff to Sprint 5

**What Sprint 5 Receives:**
- Complete read-only data flow (backend → frontend)
- Real JWT auth integration
- Tenant-scoped API calls
- Role-based endpoint access
- Clean, read-only UI

**What Sprint 5 Will Add:**
- Sessions management (complex read domain)
- Real-time session status
- Session timeline view
- Provider availability dashboard

---

## 🛡️ PHILOSOPHY

### Read First, Write Later

**Why read-only integration first:**

1. **Validates Architecture**
   - Tenant isolation works before adding writes
   - Role-based access works before adding mutations
   - Error handling works before adding complexity

2. **Reduces Risk**
   - Read-only operations can't corrupt data
   - Mistakes are reversible (no permanent changes)
   - Testing is simpler (no state cleanup needed)

3. **Builds Confidence**
   - Team sees real data flowing
   - Stakeholders see progress (visual UI with real data)
   - Foundation proven before adding complexity

### Visibility Before Control

**Why display before edit:**

- Users must SEE data before they can CHANGE data
- Understanding what exists informs what edits are needed
- Read-only UI reveals UX issues before implementing writes

### Clinical Systems Punish Premature Writes

**Why strict read-only enforcement:**

- **Premature writes skip validation** → Data corruption
- **Premature writes skip state machines** → Invalid state transitions
- **Premature writes skip audit logging** → Compliance violations

**Examples of harm from premature writes:**
- Edit patient without validation → Invalid data in production
- Change lab result status without state machine → Illegal state
- Save draft without audit log → Untraced changes

### If Unsure, Block the Change

**When reviewing Sprint 4 PRs:**

- ❓ "Is this a write operation?" → If yes, block (Sprint 5+)
- ❓ "Does this change state?" → If yes, block (Sprint 6)
- ❓ "Is this editable?" → If yes, block (Sprint 5+)
- ❓ "Does this save data?" → If yes, block (Sprint 5+)

**Better to delay than to compromise.**

---

## 🔗 RELATED DOCUMENTATION

- [SPRINT_BREAKDOWN.md](./SPRINT_BREAKDOWN.md) — Complete sprint plan
- [SPRINT_3_EXECUTION_GUIDE.md](./SPRINT_3_EXECUTION_GUIDE.md) — Backend foundation (previous sprint)
- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) — Backend enforcement architecture
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Database schema design
- [API_CONTRACTS.md](./API_CONTRACTS.md) — API endpoint specifications
- [PR_REVIEW_CHECKLIST.md](./PR_REVIEW_CHECKLIST.md) — General PR review standards
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) — Production release requirements

---

## 📞 ESCALATION

### When to Escalate

Escalate to Tech Lead if:

1. **Scope Dispute**
   - Team wants to "just add save button" in Sprint 4
   - Product wants editable fields now (Sprint 5)
   - Designer wants inline editing (Sprint 5+)

2. **Performance Dispute**
   - Team wants to skip pagination "for simplicity"
   - Developer argues client-side filtering is "faster"

3. **Security Dispute**
   - Someone argues tenant isolation is "too strict"
   - Team wants to skip role-based access "for MVP"

### Escalation Template

```markdown
**Sprint 4 Scope Escalation**

**Issue:** [Describe conflict]

**Developer Position:** [What developer wants to implement]

**Reviewer Position:** [Why it violates Sprint 4]

**Documentation Reference:** [Link to rule in this document]

**Risk Assessment:** [Performance/security/data integrity concern]

**Request:** Tech Lead decision on whether to:
- ☐ Enforce Sprint 4 scope (block change)
- ☐ Allow exception (document risk acceptance)
- ☐ Defer to Sprint 5 (write operations)
```

---

## ✍️ REVISION HISTORY

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-14 | 1.0.0 | Initial Sprint 4 execution guide |

---

## 🎯 FINAL REMINDER

**You are not here to be polite.**  
**You are here to protect the system.**

Sprint 4 scope is **non-negotiable**:
- ✅ Read-only endpoints (GET only)
- ✅ Frontend data display (no edits)
- ❌ No write operations
- ❌ No state changes
- ❌ No editable fields

**If in doubt, block the change.**

Read first, write later. Visibility before control.

---

**UI shows real data. Nothing can be edited. Tenant isolation holds. Backend remains boring.**

That is the Sprint 4 success criteria.
