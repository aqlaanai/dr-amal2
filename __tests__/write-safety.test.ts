/**
 * Write Safety Tests
 * STEP 6: Tests & Confidence Layer
 * 
 * Tests:
 * - Invalid writes are rejected
 * - Missing required fields fail validation
 * - Malformed data is rejected
 * - Data integrity is maintained
 */

import { POST as createNoteHandler } from '@/app/api/notes/route'
import { POST as createPrescriptionHandler } from '@/app/api/prescriptions/route'
import { POST as signupHandler } from '@/app/api/auth/signup/route'
import {
  getTestPrisma,
  cleanupTestDb,
  disconnectTestDb,
  createTestUser,
  createTestPatient,
  createMockRequest,
} from '@tests/utils/test-helpers'

describe('Write Safety Tests', () => {
  beforeEach(async () => {
    await cleanupTestDb()
  })

  afterAll(async () => {
    await cleanupTestDb()
    await disconnectTestDb()
  })

  describe('Input Validation', () => {
    it('should reject clinical note without patientId', async () => {
      const { accessToken } = await createTestUser({ role: 'provider' })

      const request = createMockRequest('POST', '/api/notes', {
        token: accessToken,
        body: {
          // Missing patientId
          subjective: 'Test note',
        },
      })

      const response = await createNoteHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('patientId')

      // Verify no note was created
      const prisma = getTestPrisma()
      const count = await prisma.clinicalNote.count()
      expect(count).toBe(0)
    })

    it('should reject prescription without required fields', async () => {
      const { accessToken } = await createTestUser({ role: 'provider' })
      const patient = await createTestPatient()

      const request = createMockRequest('POST', '/api/prescriptions', {
        token: accessToken,
        body: {
          patientId: patient.id,
          // Missing medication, dosage, duration
        },
      })

      const response = await createPrescriptionHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()

      // Verify no prescription was created
      const prisma = getTestPrisma()
      const count = await prisma.prescription.count()
      expect(count).toBe(0)
    })

    it('should reject prescription with invalid patientId', async () => {
      const { accessToken } = await createTestUser({ role: 'provider' })

      const request = createMockRequest('POST', '/api/prescriptions', {
        token: accessToken,
        body: {
          patientId: 'non-existent-patient-id',
          medication: 'Amoxicillin',
          dosage: '500mg',
          duration: '7 days',
        },
      })

      const response = await createPrescriptionHandler(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')

      // Verify no prescription was created
      const prisma = getTestPrisma()
      const count = await prisma.prescription.count()
      expect(count).toBe(0)
    })

    it('should reject signup with invalid email format', async () => {
      const request = createMockRequest('POST', '/api/auth/signup', {
        body: {
          email: 'invalid-email-format',
          password: 'ValidPassword123!',
          firstName: 'Test',
          lastName: 'User',
          phone: '1234567890',
          role: 'provider',
        },
      })

      const response = await signupHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('email')

      // Verify no user was created
      const prisma = getTestPrisma()
      const count = await prisma.user.count()
      expect(count).toBe(0)
    })

    it('should reject signup with missing required fields', async () => {
      const request = createMockRequest('POST', '/api/auth/signup', {
        body: {
          email: 'test@example.com',
          // Missing password, firstName, lastName
          role: 'provider',
        },
      })

      const response = await signupHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()

      // Verify no user was created
      const prisma = getTestPrisma()
      const count = await prisma.user.count()
      expect(count).toBe(0)
    })
  })

  describe('Data Integrity', () => {
    it('should maintain referential integrity for notes', async () => {
      const { user, accessToken } = await createTestUser({ role: 'provider' })
      const patient = await createTestPatient()

      const request = createMockRequest('POST', '/api/notes', {
        token: accessToken,
        body: {
          patientId: patient.id,
          subjective: 'Test',
        },
      })

      const response = await createNoteHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)

      // Verify relationships
      const prisma = getTestPrisma()
      const note = await prisma.clinicalNote.findUnique({
        where: { id: data.id },
        include: {
          patient: true,
          provider: true,
        },
      })

      expect(note?.patientId).toBe(patient.id)
      expect(note?.providerId).toBe(user.id)
      expect(note?.patient.id).toBe(patient.id)
      expect(note?.provider.id).toBe(user.id)
    })

    it('should maintain referential integrity for prescriptions', async () => {
      const { user, accessToken } = await createTestUser({ role: 'provider' })
      const patient = await createTestPatient()

      const request = createMockRequest('POST', '/api/prescriptions', {
        token: accessToken,
        body: {
          patientId: patient.id,
          medication: 'Amoxicillin',
          dosage: '500mg',
          duration: '7 days',
        },
      })

      const response = await createPrescriptionHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)

      // Verify relationships
      const prisma = getTestPrisma()
      const prescription = await prisma.prescription.findUnique({
        where: { id: data.id },
        include: {
          patient: true,
          provider: true,
        },
      })

      expect(prescription?.patientId).toBe(patient.id)
      expect(prescription?.providerId).toBe(user.id)
      expect(prescription?.patient.id).toBe(patient.id)
      expect(prescription?.provider.id).toBe(user.id)
    })

    it('should create records with proper defaults', async () => {
      const { user, accessToken } = await createTestUser({ role: 'provider' })
      const patient = await createTestPatient()

      const request = createMockRequest('POST', '/api/notes', {
        token: accessToken,
        body: {
          patientId: patient.id,
          subjective: 'Test',
        },
      })

      const response = await createNoteHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)

      // Verify defaults
      expect(data.status).toBe('draft')
      expect(data.finalizedAt).toBeNull()
      expect(data.createdAt).toBeDefined()
      expect(data.updatedAt).toBeDefined()
    })

    it('should prevent duplicate user emails', async () => {
      // Create first user
      await createTestUser({ email: 'test@example.com' })

      // Attempt to create duplicate
      const request = createMockRequest('POST', '/api/auth/signup', {
        body: {
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          phone: '1234567890',
          role: 'provider',
        },
      })

      const response = await signupHandler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('already exists')

      // Verify only one user exists
      const prisma = getTestPrisma()
      const count = await prisma.user.count({
        where: { email: 'test@example.com' },
      })
      expect(count).toBe(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { accessToken } = await createTestUser({ role: 'provider' })

      // Attempt to create note with malformed UUID
      const request = createMockRequest('POST', '/api/notes', {
        token: accessToken,
        body: {
          patientId: 'invalid-uuid-format',
          subjective: 'Test',
        },
      })

      const response = await createNoteHandler(request)
      const data = await response.json()

      // Should return error, not crash
      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(data.error).toBeDefined()
    })

    it('should not persist partial data on validation failure', async () => {
      const { accessToken } = await createTestUser({ role: 'provider' })

      const prisma = getTestPrisma()
      const initialCount = await prisma.clinicalNote.count()

      // Attempt invalid creation
      const request = createMockRequest('POST', '/api/notes', {
        token: accessToken,
        body: {
          // Missing required field
          subjective: 'Test',
        },
      })

      await createNoteHandler(request)

      // Verify nothing was created
      const finalCount = await prisma.clinicalNote.count()
      expect(finalCount).toBe(initialCount)
    })

    it('should return appropriate error codes', async () => {
      const { accessToken } = await createTestUser({ role: 'provider' })

      // Missing required field - should be 400
      const request1 = createMockRequest('POST', '/api/notes', {
        token: accessToken,
        body: { subjective: 'Test' },
      })
      const response1 = await createNoteHandler(request1)
      expect(response1.status).toBe(400)

      // Non-existent patient - should be 404
      const request2 = createMockRequest('POST', '/api/notes', {
        token: accessToken,
        body: {
          patientId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          subjective: 'Test',
        },
      })
      const response2 = await createNoteHandler(request2)
      expect(response2.status).toBe(404)
    })
  })

  describe('Transaction Safety', () => {
    it('should create note with all required audit trail', async () => {
      const { user, accessToken } = await createTestUser({ role: 'provider' })
      const patient = await createTestPatient()

      const request = createMockRequest('POST', '/api/notes', {
        token: accessToken,
        body: {
          patientId: patient.id,
          subjective: 'Test note',
        },
      })

      const response = await createNoteHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)

      // Verify note created
      const prisma = getTestPrisma()
      const note = await prisma.clinicalNote.findUnique({
        where: { id: data.id },
      })
      expect(note).toBeDefined()

      // Verify audit log created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          actorId: user.id,
          action: 'CREATE_NOTE',
        },
      })
      expect(auditLogs.length).toBeGreaterThan(0)
    })
  })
})
