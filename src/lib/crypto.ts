/**
 * Password Hashing Utilities
 * Issue 1: Real Authentication
 * 
 * Secure password hashing using bcrypt
 */

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hash a plaintext password
 * @param password - Plaintext password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 * @param password - Plaintext password
 * @param hash - Hashed password from database
 * @returns true if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
