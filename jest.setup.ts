/**
 * Jest Setup File
 * Global test configuration and utilities
 */

// Set test environment variables - use SQLite for isolated testing
process.env.DATABASE_PROVIDER = 'sqlite'
process.env.DATABASE_URL = 'file:./test.db'
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only'
process.env.PRISMA_TEST_MODE = 'true'

// Disable logs during tests
process.env.PRISMA_LOG = 'false'

// Increase timeout for integration tests
jest.setTimeout(15000)

// Handle test cleanup
afterAll(async () => {
  // Allow process to exit cleanly
  await new Promise(resolve => setTimeout(resolve, 100))
})
