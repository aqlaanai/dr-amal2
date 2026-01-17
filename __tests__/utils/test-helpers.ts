/**
 * Test Utilities
 * Common helpers for API integration tests
 */

import { PrismaClient, UserRole, AccountStatus, ClinicalNoteStatus, PrescriptionStatus } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hashPassword } from '@/lib/crypto'
import { generateAccessToken } from '@/lib/jwt'

// Test database singleton
let testPrisma: PrismaClient | null = null

export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    // Force use of test database
    process.env.DATABASE_URL = 'file:./test.db'
    const adapter = new PrismaBetterSqlite3({ url: './test.db' })
    testPrisma = new PrismaClient({ adapter })
  }
  return testPrisma
}

export async function cleanupTestDb() {
  const prisma = getTestPrisma()
  
  // Delete in reverse order of dependencies
  await prisma.auditLog.deleteMany()
  await prisma.labResult.deleteMany()
  await prisma.prescription.deleteMany()
  await prisma.clinicalNote.deleteMany()
  await prisma.liveSession.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.user.deleteMany()
}

export async function disconnectTestDb() {
  if (testPrisma) {
    await testPrisma.$disconnect()
    testPrisma = null
  }
  
  // Clear production singletons to prevent cross-test pollution
  try {
    const { getPrisma, resetPrisma } = await import('@/repositories/BaseRepository')
    const productionPrisma = getPrisma()
    await productionPrisma.$disconnect()
    resetPrisma()
  } catch (e) {
    // Ignore if already disconnected
  }
  
  // Clear AuthService singleton
  try {
    const { resetAuthService } = await import('@/services/AuthService')
    resetAuthService()
  } catch (e) {
    // Ignore
  }
}

/**
 * Create test user and return with auth token
 */
export async function createTestUser(overrides?: {
  email?: string
  role?: UserRole
  accountStatus?: AccountStatus
}) {
  const prisma = getTestPrisma()
  
  const email = overrides?.email || `test-${Date.now()}@test.com`
  const passwordHash = await hashPassword('TestPassword123!')
  
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: (overrides?.role || 'provider') as UserRole,
      accountStatus: (overrides?.accountStatus || 'active') as AccountStatus,
    },
  })
  
  const accessToken = generateAccessToken({ 
    userId: user.id, 
    email: user.email,
    role: user.role 
  })
  
  return { user, accessToken }
}

/**
 * Create test patient
 */
export async function createTestPatient(overrides?: {
  firstName?: string
  lastName?: string
  dateOfBirth?: Date
  status?: string
}) {
  const prisma = getTestPrisma()
  
  const patient = await prisma.patient.create({
    data: {
      firstName: overrides?.firstName || 'Test',
      lastName: overrides?.lastName || 'Patient',
      dateOfBirth: overrides?.dateOfBirth || new Date('2010-01-01'),
      status: overrides?.status || 'active',
    },
  })
  
  return patient
}

/**
 * Create test clinical note
 */
export async function createTestNote(
  patientId: string,
  providerId: string,
  overrides?: {
    status?: string
    subjective?: string
    objective?: string
    assessment?: string
    plan?: string
  }
) {
  const prisma = getTestPrisma()
  
  const note = await prisma.clinicalNote.create({
    data: {
      patientId,
      providerId,
      status: (overrides?.status || 'draft') as ClinicalNoteStatus,
      subjective: overrides?.subjective || 'Test subjective',
      objective: overrides?.objective || 'Test objective',
      assessment: overrides?.assessment || 'Test assessment',
      plan: overrides?.plan || 'Test plan',
    },
  })
  
  return note
}

/**
 * Create test prescription
 */
export async function createTestPrescription(
  patientId: string,
  providerId: string,
  overrides?: {
    status?: string
    medication?: string
    dosage?: string
    duration?: string
  }
) {
  const prisma = getTestPrisma()
  
  const prescription = await prisma.prescription.create({
    data: {
      patientId,
      providerId,
      medication: overrides?.medication || 'Test Medication',
      dosage: overrides?.dosage || '500mg',
      duration: overrides?.duration || '7 days',
      status: (overrides?.status || 'draft') as PrescriptionStatus,
    },
  })
  
  return prescription
}

/**
 * Make mock Next.js request with auth header
 */
export function createMockRequest(
  method: string,
  url: string,
  options?: {
    token?: string
    body?: Record<string, unknown>
  }
): any {
  const headers = new Map()
  headers.set('content-type', 'application/json')
  
  if (options?.token) {
    headers.set('authorization', `Bearer ${options.token}`)
  }
  
  return {
    method,
    url,
    headers,
    json: async () => options?.body || {},
    nextUrl: new URL(url, 'http://localhost:3000'),
  }
}
