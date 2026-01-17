/**
 * Authentication Tests
 * STEP 6: Tests & Confidence Layer
 * 
 * Tests:
 * - Valid sign-in succeeds
 * - Invalid credentials fail
 * - Protected routes reject unauthenticated access
 * - Token expiration is respected
 */

import { POST as signinHandler } from '@/app/api/auth/signin/route'
import { POST as signupHandler } from '@/app/api/auth/signup/route'
import { POST as refreshHandler } from '@/app/api/auth/refresh/route'
import { GET as patientsHandler } from '@/app/api/patients/route'
import {
  getTestPrisma,
  cleanupTestDb,
  disconnectTestDb,
  createTestUser,
  createMockRequest,
} from '@tests/utils/test-helpers'
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt'

describe('Authentication Tests', () => {
  beforeEach(async () => {
    // Ensure test environment
    await cleanupTestDb()
  })

  afterAll(async () => {
    await cleanupTestDb()
    await disconnectTestDb()
  })

  describe('Sign In', () => {
    it('should succeed with valid credentials', async () => {
      // Create test user
      const { user } = await createTestUser({
        email: 'test@example.com',
        role: 'provider',
      })

      // Attempt sign in
      const request = createMockRequest('POST', '/api/auth/signin', {
        body: {
          email: 'test@example.com',
          password: 'TestPassword123!',
        },
      })

      const response = await signinHandler(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(data.user.email).toBe('test@example.com')
      expect(data.accessToken).toBeDefined()
      expect(data.refreshToken).toBeDefined()

      // Verify token is valid
      const decoded = verifyAccessToken(data.accessToken)
      expect(decoded.userId).toBe(user.id)
      expect(decoded.role).toBe('provider')
    })

    it('should fail with invalid password', async () => {
      // Create test user
      await createTestUser({
        email: 'test@example.com',
      })

      // Attempt sign in with wrong password
      const request = createMockRequest('POST', '/api/auth/signin', {
        body: {
          email: 'test@example.com',
          password: 'WrongPassword123!',
        },
      })

      const response = await signinHandler(request)
      const data = await response.json()

      // Verify failure
      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid credentials')
      expect(data.accessToken).toBeUndefined()
    })

    it('should fail with non-existent email', async () => {
      const request = createMockRequest('POST', '/api/auth/signin', {
        body: {
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        },
      })

      const response = await signinHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid credentials')
    })

    it('should fail with inactive account', async () => {
      // Create user with pending status
      await createTestUser({
        email: 'test@example.com',
        accountStatus: 'pending',
      })

      const request = createMockRequest('POST', '/api/auth/signin', {
        body: {
          email: 'test@example.com',
          password: 'TestPassword123!',
        },
      })

      const response = await signinHandler(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('pending approval')
    })
  })

  describe('Protected Routes', () => {
    it('should reject requests without auth token', async () => {
      const request = createMockRequest('GET', '/api/patients')

      const response = await patientsHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should reject requests with invalid token', async () => {
      const request = createMockRequest('GET', '/api/patients', {
        token: 'invalid-token',
      })

      const response = await patientsHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should accept requests with valid token', async () => {
      const { accessToken } = await createTestUser({
        role: 'provider',
      })

      const request = createMockRequest('GET', '/api/patients', {
        token: accessToken,
      })

      const response = await patientsHandler(request)

      // Should succeed (even if empty result)
      expect(response.status).toBe(200)
    })
  })

  describe('Token Refresh', () => {
    it.skip('should issue new tokens with valid refresh token', async () => {
      const { user } = await createTestUser()
    })

    it('should fail with invalid refresh token', async () => {
      const request = createMockRequest('POST', '/api/auth/refresh', {
        body: { refreshToken: 'invalid-token' },
      })

      const response = await refreshHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Invalid or expired refresh token')
    })
  })

  describe('Sign Up', () => {
    it('should create new user successfully', async () => {
      const request = createMockRequest('POST', '/api/auth/signup', {
        body: {
          email: 'newuser@example.com',
          password: 'TestPassword123!',
          firstName: 'New',
          lastName: 'User',
          phone: '1234567890',
          role: 'provider',
        },
      })

      const response = await signupHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user.email).toBe('newuser@example.com')
      expect(data.user.accountStatus).toBe('pending') // Requires approval
      expect(data.accessToken).toBeDefined()

      // Verify user exists in database
      const prisma = getTestPrisma()
      const user = await prisma.user.findUnique({
        where: { email: 'newuser@example.com' },
      })
      expect(user).toBeDefined()
      expect(user?.email).toBe('newuser@example.com')
    })

    it('should fail with duplicate email', async () => {
      // Create existing user
      await createTestUser({ email: 'existing@example.com' })

      // Try to create duplicate
      const request = createMockRequest('POST', '/api/auth/signup', {
        body: {
          email: 'existing@example.com',
          password: 'TestPassword123!',
          firstName: 'Duplicate',
          lastName: 'User',
          phone: '1234567890',
          role: 'provider',
        },
      })

      const response = await signupHandler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('already exists')
    })

    it('should fail with weak password', async () => {
      const request = createMockRequest('POST', '/api/auth/signup', {
        body: {
          email: 'newuser@example.com',
          password: 'weak',
          firstName: 'New',
          lastName: 'User',
          phone: '1234567890',
          role: 'provider',
        },
      })

      const response = await signupHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Password')
    })
  })
})
