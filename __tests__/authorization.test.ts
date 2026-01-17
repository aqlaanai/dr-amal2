/**
 * Authorization Tests
 * STEP 6: Tests & Confidence Layer
 * 
 * Tests:
 * - Role-based access enforced server-side
 * - Forbidden roles receive 403
 * - Parent role cannot access provider-only endpoints
 * - Admin access does not leak to non-admins
 */

import { POST as createNoteHandler } from '@/app/api/notes/route'
import { POST as createPrescriptionHandler } from '@/app/api/prescriptions/route'
import { GET as patientsHandler } from '@/app/api/patients/route'
import {
  cleanupTestDb,
  disconnectTestDb,
  createTestUser,
  createTestPatient,
  createMockRequest,
} from '@tests/utils/test-helpers'

describe('Authorization Tests', () => {
  beforeEach(async () => {
    await cleanupTestDb()
  })

  afterAll(async () => {
    await cleanupTestDb()
    await disconnectTestDb()
  })

  describe('Role-Based Access Control', () => {
    it('should allow provider to access patients endpoint', async () => {
      const { accessToken } = await createTestUser({ role: 'provider' })

      const request = createMockRequest('GET', '/api/patients', {
        token: accessToken,
      })

      const response = await patientsHandler(request)

      expect(response.status).toBe(200)
    })

    it('should allow admin to access patients endpoint', async () => {
      const { accessToken } = await createTestUser({ role: 'admin' })

      const request = createMockRequest('GET', '/api/patients', {
        token: accessToken,
      })

      const response = await patientsHandler(request)

      expect(response.status).toBe(200)
    })

    it('should forbid parent from accessing patients endpoint', async () => {
      const { accessToken } = await createTestUser({ role: 'parent' })

      const request = createMockRequest('GET', '/api/patients', {
        token: accessToken,
      })

      const response = await patientsHandler(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Forbidden')
    })
  })

  describe('Provider-Only Actions', () => {
    it('should allow provider to create clinical note', async () => {
      const { user, accessToken } = await createTestUser({ role: 'provider' })
      const patient = await createTestPatient()

      const request = createMockRequest('POST', '/api/notes', {
        token: accessToken,
        body: {
          patientId: patient.id,
          subjective: 'Test note',
          objective: 'Normal',
          assessment: 'Healthy',
          plan: 'Follow up',
        },
      })

      const response = await createNoteHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.providerId).toBe(user.id)
    })

    it('should allow admin to create clinical note', async () => {
      const { user, accessToken } = await createTestUser({ role: 'admin' })
      const patient = await createTestPatient()

      const request = createMockRequest('POST', '/api/notes', {
        token: accessToken,
        body: {
          patientId: patient.id,
          subjective: 'Test note',
        },
      })

      const response = await createNoteHandler(request)

      expect(response.status).toBe(201)
    })

    it('should forbid parent from creating clinical note', async () => {
      const { accessToken } = await createTestUser({ role: 'parent' })
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

      expect(response.status).toBe(403)
      expect(data.error).toContain('Forbidden')
    })

    it('should allow provider to create prescription', async () => {
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
      expect(data.providerId).toBe(user.id)
    })

    it('should forbid parent from creating prescription', async () => {
      const { accessToken } = await createTestUser({ role: 'parent' })
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

      expect(response.status).toBe(403)
      expect(data.error).toContain('Forbidden')
    })
  })

  describe('Account Status Enforcement', () => {
    it('should forbid locked account from accessing endpoints', async () => {
      const { accessToken } = await createTestUser({
        role: 'provider',
        accountStatus: 'locked',
      })

      const request = createMockRequest('GET', '/api/patients', {
        token: accessToken,
      })

      const response = await patientsHandler(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('locked')
    })

    it('should allow active account to access endpoints', async () => {
      const { accessToken } = await createTestUser({
        role: 'provider',
        accountStatus: 'active',
      })

      const request = createMockRequest('GET', '/api/patients', {
        token: accessToken,
      })

      const response = await patientsHandler(request)

      expect(response.status).toBe(200)
    })
  })
})
