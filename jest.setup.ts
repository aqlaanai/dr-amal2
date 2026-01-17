/**
 * Jest Setup File
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.DATABASE_URL = 'file:./test.db'
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only'

// Increase timeout for integration tests
jest.setTimeout(10000)
