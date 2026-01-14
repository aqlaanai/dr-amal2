/**
 * Type Definitions
 * 
 * Shared TypeScript types for the application
 */

/**
 * User role types
 */
export type UserRole = 'parent' | 'provider'

/**
 * Authentication state
 */
export type AuthState = 'idle' | 'loading' | 'error' | 'success' | 'locked'

/**
 * Form validation error structure
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string
  password: string
}

/**
 * Sign up data
 */
export interface SignUpData {
  firstName: string
  lastName: string
  role: UserRole | ''
  phone: string
  email: string
  password: string
  confirmPassword: string
}

/**
 * User profile (for future use)
 */
export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone: string
  isVerified: boolean
  isApproved: boolean
  createdAt: Date
}

/**
 * API response structure (for future backend integration)
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong'
