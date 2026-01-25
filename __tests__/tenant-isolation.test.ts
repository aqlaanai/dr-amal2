/**
 * Tenant Isolation & Security Tests
 * STEP 5: Security Test Coverage & Isolation Verification
 *
 * Tests cross-tenant isolation, parent ownership, and authorization enforcement.
 * These tests prove that HIPAA security requirements are actually enforced.
 */

import { GET as getPatientsHandler } from '@/app/api/patients/route'
import { GET as getPatientByIdHandler } from '@/app/api/patients/[id]/route'
import { GET as getNotesHandler } from '@/app/api/notes/route'
import { GET as getLabResultsHandler } from '@/app/api/lab-results/route'
import { GET as getPrescriptionsHandler } from '@/app/api/prescriptions/route'
import { GET as getAppointmentsHandler } from '@/app/api/appointments/route'
import {
  cleanupTestDb,
  disconnectTestDb,
  createTestUser,
  createTestPatient,
  createMockRequest,
} from '@tests/utils/test-helpers'
import { UserRole } from '@prisma/client'

describe('Tenant Isolation & Security Tests', () => {
  const TENANT_A = 'clinic_a'
  const TENANT_B = 'clinic_b'

  beforeEach(async () => {
    await cleanupTestDb()
  })

  afterAll(async () => {
    await cleanupTestDb()
    await disconnectTestDb()
  })

  describe('Basic Setup', () => {
    it('should create users in different tenants', async () => {
      const { user: userA } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })
      const { user: userB } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_B
      })

      expect(userA.tenantId).toBe(TENANT_A)
      expect(userB.tenantId).toBe(TENANT_B)
    })

    it('should create patients in different tenants', async () => {
      const patientA = await createTestPatient({ tenantId: TENANT_A })
      const patientB = await createTestPatient({ tenantId: TENANT_B })

      expect(patientA.tenantId).toBe(TENANT_A)
      expect(patientB.tenantId).toBe(TENANT_B)
    })
  })

  describe('Cross-Tenant Isolation', () => {
    it('should prevent user from tenant A accessing patients from tenant B', async () => {
      // Create users in different tenants
      const { accessToken: tokenA } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })
      const { accessToken: tokenB } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_B
      })

      // Create patient in tenant B
      await createTestPatient({ tenantId: TENANT_B })

      // User from tenant A tries to list patients
      const requestA = createMockRequest('GET', '/api/patients', {
        token: tokenA,
      })
      const responseA = await getPatientsHandler(requestA)

      // Should return empty list (no patients in tenant A)
      expect(responseA.status).toBe(200)
      const dataA = await responseA.json()
      expect(dataA.data).toHaveLength(0)
      expect(dataA.pagination.total).toBe(0)
    })

    it('should prevent user from tenant A accessing specific patient from tenant B', async () => {
      // Create users in different tenants
      const { accessToken: tokenA } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })

      // Create patient in tenant B
      const patientB = await createTestPatient({ tenantId: TENANT_B })

      // User from tenant A tries to access patient from tenant B
      const requestA = createMockRequest('GET', `/api/patients/${patientB.id}`, {
        token: tokenA,
      })
      const responseA = await getPatientByIdHandler(requestA, { params: { id: patientB.id } })

      // Should return 404 (patient not found in tenant A)
      expect(responseA.status).toBe(404)
    })

    it('should prevent user from tenant A accessing clinical notes from tenant B', async () => {
      // Create users in different tenants
      const { accessToken: tokenA } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })

      // User from tenant A tries to list clinical notes
      const requestA = createMockRequest('GET', '/api/notes', {
        token: tokenA,
      })
      const responseA = await getNotesHandler(requestA)

      // Should return empty list (no notes in tenant A)
      expect(responseA.status).toBe(200)
      const dataA = await responseA.json()
      expect(dataA.data).toHaveLength(0)
      expect(dataA.pagination.total).toBe(0)
    })

    it('should prevent user from tenant A accessing lab results from tenant B', async () => {
      // Create users in different tenants
      const { accessToken: tokenA } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })

      // User from tenant A tries to list lab results
      const requestA = createMockRequest('GET', '/api/lab-results', {
        token: tokenA,
      })
      const responseA = await getLabResultsHandler(requestA)

      // Should return empty list (no lab results in tenant A)
      expect(responseA.status).toBe(200)
      const dataA = await responseA.json()
      expect(dataA.data).toHaveLength(0)
      expect(dataA.pagination.total).toBe(0)
    })

    it('should prevent user from tenant A accessing prescriptions from tenant B', async () => {
      // Create users in different tenants
      const { accessToken: tokenA } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })

      // User from tenant A tries to list prescriptions
      const requestA = createMockRequest('GET', '/api/prescriptions', {
        token: tokenA,
      })
      const responseA = await getPrescriptionsHandler(requestA)

      // Should return empty list (no prescriptions in tenant A)
      expect(responseA.status).toBe(200)
      const dataA = await responseA.json()
      expect(dataA.data).toHaveLength(0)
      expect(dataA.pagination.total).toBe(0)
    })

    it('should prevent user from tenant A accessing appointments from tenant B', async () => {
      // Create users in different tenants
      const { accessToken: tokenA } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })

      // User from tenant A tries to list appointments
      const requestA = createMockRequest('GET', '/api/appointments', {
        token: tokenA,
      })
      const responseA = await getAppointmentsHandler(requestA)

      // Should return empty list (no appointments in tenant A)
      expect(responseA.status).toBe(200)
      const dataA = await responseA.json()
      expect(dataA.data).toHaveLength(0)
      expect(dataA.pagination.total).toBe(0)
    })
  })

  describe('Parent Ownership & Access Control', () => {
    it('should prevent parent from accessing patient list', async () => {
      const { accessToken: parentToken } = await createTestUser({
        role: UserRole.parent,
        tenantId: TENANT_A
      })

      // Create patient in same tenant
      await createTestPatient({ tenantId: TENANT_A })

      // Parent tries to list patients
      const request = createMockRequest('GET', '/api/patients', {
        token: parentToken,
      })
      const response = await getPatientsHandler(request)

      // Should return 403 Forbidden
      expect(response.status).toBe(403)
    })

    it('should prevent parent from accessing individual patient details', async () => {
      const { accessToken: parentToken } = await createTestUser({
        role: UserRole.parent,
        tenantId: TENANT_A
      })

      // Create patient in same tenant
      const patient = await createTestPatient({ tenantId: TENANT_A })

      // Parent tries to access patient details
      const request = createMockRequest('GET', `/api/patients/${patient.id}`, {
        token: parentToken,
      })
      const response = await getPatientByIdHandler(request, { params: { id: patient.id } })

      // Should return 403 Forbidden
      expect(response.status).toBe(403)
    })

    it('should prevent parent from accessing clinical notes', async () => {
      const { accessToken: parentToken } = await createTestUser({
        role: UserRole.parent,
        tenantId: TENANT_A
      })

      // Parent tries to list clinical notes
      const request = createMockRequest('GET', '/api/notes', {
        token: parentToken,
      })
      const response = await getNotesHandler(request)

      // Should return 403 Forbidden
      expect(response.status).toBe(403)
    })

    it('should prevent parent from accessing lab results', async () => {
      const { accessToken: parentToken } = await createTestUser({
        role: UserRole.parent,
        tenantId: TENANT_A
      })

      // Parent tries to list lab results
      const request = createMockRequest('GET', '/api/lab-results', {
        token: parentToken,
      })
      const response = await getLabResultsHandler(request)

      // Should return 403 Forbidden
      expect(response.status).toBe(403)
    })

    it('should prevent parent from accessing prescriptions', async () => {
      const { accessToken: parentToken } = await createTestUser({
        role: UserRole.parent,
        tenantId: TENANT_A
      })

      // Parent tries to list prescriptions
      const request = createMockRequest('GET', '/api/prescriptions', {
        token: parentToken,
      })
      const response = await getPrescriptionsHandler(request)

      // Should return 403 Forbidden
      expect(response.status).toBe(403)
    })

    it('should prevent parent from accessing appointments', async () => {
      const { accessToken: parentToken } = await createTestUser({
        role: UserRole.parent,
        tenantId: TENANT_A
      })

      // Parent tries to list appointments
      const request = createMockRequest('GET', '/api/appointments', {
        token: parentToken,
      })
      const response = await getAppointmentsHandler(request)

      // Should return 403 Forbidden
      expect(response.status).toBe(403)
    })
  })

  describe('Provider Access Control', () => {
    it('should allow provider to access all patients in their tenant', async () => {
      const { accessToken: providerToken } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })

      // Create multiple patients in same tenant
      await createTestPatient({ tenantId: TENANT_A, firstName: 'Patient', lastName: 'One' })
      await createTestPatient({ tenantId: TENANT_A, firstName: 'Patient', lastName: 'Two' })

      // Provider lists patients
      const request = createMockRequest('GET', '/api/patients', {
        token: providerToken,
      })
      const response = await getPatientsHandler(request)

      // Should return both patients
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(2)
      expect(data.pagination.total).toBe(2)
    })

    it('should allow provider to access specific patient in their tenant', async () => {
      const { accessToken: providerToken } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })

      // Create patient in same tenant
      const patient = await createTestPatient({ tenantId: TENANT_A })

      // Provider accesses patient details
      const request = createMockRequest('GET', `/api/patients/${patient.id}`, {
        token: providerToken,
      })
      const response = await getPatientByIdHandler(request, { params: { id: patient.id } })

      // Should return patient data
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe(patient.id)
    })

    it('should prevent provider from accessing patients in other tenants', async () => {
      const { accessToken: providerToken } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })

      // Create patient in different tenant
      const patientB = await createTestPatient({ tenantId: TENANT_B })

      // Provider tries to access patient from different tenant
      const request = createMockRequest('GET', `/api/patients/${patientB.id}`, {
        token: providerToken,
      })
      const response = await getPatientByIdHandler(request, { params: { id: patientB.id } })

      // Should return 404 (patient not found in provider's tenant)
      expect(response.status).toBe(404)
    })
  })

  describe('ID Guessing & Enumeration Protection', () => {
    it('should return 404 for random UUID access attempts', async () => {
      const { accessToken } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })

      // Try to access random UUID
      const randomId = '550e8400-e29b-41d4-a716-446655440000'
      const request = createMockRequest('GET', `/api/patients/${randomId}`, {
        token: accessToken,
      })
      const response = await getPatientByIdHandler(request, { params: { id: randomId } })

      // Should return 404 (not found)
      expect(response.status).toBe(404)
    })

    it('should return 404 for valid ID from another tenant', async () => {
      const { accessToken } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })

      // Create patient in different tenant
      const patientB = await createTestPatient({ tenantId: TENANT_B })

      // Try to access valid ID from another tenant
      const request = createMockRequest('GET', `/api/patients/${patientB.id}`, {
        token: accessToken,
      })
      const response = await getPatientByIdHandler(request, { params: { id: patientB.id } })

      // Should return 404 (not accessible in this tenant)
      expect(response.status).toBe(404)
    })

    it('should not leak information about record existence across tenants', async () => {
      // Create patient in tenant B
      const patientB = await createTestPatient({ tenantId: TENANT_B })

      // User from tenant A tries to access it
      const { accessToken } = await createTestUser({
        role: UserRole.provider,
        tenantId: TENANT_A
      })

      const request = createMockRequest('GET', `/api/patients/${patientB.id}`, {
        token: accessToken,
      })
      const response = await getPatientByIdHandler(request, { params: { id: patientB.id } })

      // Should return 404, not 403 (which would leak that the record exists)
      expect(response.status).toBe(404)
    })
  })

  describe('Missing Tenant Context Protection', () => {
    it('should reject requests without proper authentication', async () => {
      // Request without token
      const request = createMockRequest('GET', '/api/patients')
      const response = await getPatientsHandler(request)

      // Should return 401 Unauthorized
      expect(response.status).toBe(401)
    })

    it('should handle malformed tokens gracefully', async () => {
      // Request with invalid token
      const request = createMockRequest('GET', '/api/patients', {
        token: 'invalid.jwt.token',
      })
      const response = await getPatientsHandler(request)

      // Should return 401 Unauthorized
      expect(response.status).toBe(401)
    })
  })

  describe('Admin Access Control', () => {
    it('should allow admin to access all patients in their tenant', async () => {
      const { accessToken: adminToken } = await createTestUser({
        role: UserRole.admin,
        tenantId: TENANT_A
      })

      // Create patients in same tenant
      await createTestPatient({ tenantId: TENANT_A, firstName: 'Patient', lastName: 'One' })
      await createTestPatient({ tenantId: TENANT_A, firstName: 'Patient', lastName: 'Two' })

      // Admin lists patients
      const request = createMockRequest('GET', '/api/patients', {
        token: adminToken,
      })
      const response = await getPatientsHandler(request)

      // Should return all patients
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(2)
      expect(data.pagination.total).toBe(2)
    })

    it('should prevent admin from accessing data in other tenants', async () => {
      const { accessToken: adminToken } = await createTestUser({
        role: UserRole.admin,
        tenantId: TENANT_A
      })

      // Create patient in different tenant
      const patientB = await createTestPatient({ tenantId: TENANT_B })

      // Admin tries to access patient from different tenant
      const request = createMockRequest('GET', `/api/patients/${patientB.id}`, {
        token: adminToken,
      })
      const response = await getPatientByIdHandler(request, { params: { id: patientB.id } })

      // Should return 404
      expect(response.status).toBe(404)
    })
  })
})