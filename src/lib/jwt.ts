/**
 * JWT Token Utilities
 * Issue 1: Real Authentication
 * 
 * Generate and verify JWT tokens for authentication
 */

import jwt from 'jsonwebtoken'

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'dev-secret'
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'

// Environment validation (warn but don't crash)
if (!process.env.ACCESS_TOKEN_EXPIRES_IN) {
  console.warn('ACCESS_TOKEN_EXPIRES_IN not set, using default 15m')
}
if (!process.env.REFRESH_TOKEN_EXPIRES_IN) {
  console.warn('REFRESH_TOKEN_EXPIRES_IN not set, using default 7d')
}

export interface TokenPayload {
  userId: string
  email: string
  role: string
  tenantId: string
}

export interface RefreshTokenPayload {
  userId: string
  tokenVersion: number
}

/**
 * Generate access token (short-lived: 15 minutes)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  } as jwt.SignOptions)
}

/**
 * Generate refresh token (longer-lived: 7 days)
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  } as jwt.SignOptions)
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload
  } catch (error) {
    throw new Error('Invalid or expired access token')
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}
