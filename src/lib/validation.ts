/**
 * Validation Utilities
 * 
 * Frontend validation helpers for forms.
 * Backend server-side validation (security-critical).
 */

// ============================================================================
// SERVER-SIDE VALIDATION (Issue 7: Security Hardening)
// ============================================================================

/**
 * Validation errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate email format (SERVER-SIDE)
 */
export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required');
  }

  if (email.length > 255) {
    throw new ValidationError('Email too long (max 255 characters)');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Prevent email injection
  if (email.includes('\n') || email.includes('\r')) {
    throw new ValidationError('Invalid email format');
  }
}

/**
 * Validate password strength (SERVER-SIDE)
 */
export function validatePassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  if (password.length > 128) {
    throw new ValidationError('Password too long (max 128 characters)');
  }

  // Require at least one letter and one number
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one letter and one number');
  }
}

/**
 * Validate UUID format (SERVER-SIDE)
 */
export function validateUUID(id: string, fieldName: string = 'ID'): void {
  if (!id || typeof id !== 'string') {
    throw new ValidationError(`${fieldName} is required`);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
}

/**
 * Sanitize string input (SERVER-SIDE)
 * Remove potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input) return '';

  // Trim whitespace
  let sanitized = input.trim();

  // Enforce length limit (DoS prevention)
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes (SQL injection prevention)
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Validate string field (SERVER-SIDE)
 */
export function validateString(
  value: string | undefined,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  } = {}
): void {
  if (options.required && (!value || typeof value !== 'string')) {
    throw new ValidationError(`${fieldName} is required`);
  }

  if (!value) return; // Optional field, skip validation

  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  if (options.minLength && value.length < options.minLength) {
    throw new ValidationError(`${fieldName} must be at least ${options.minLength} characters`);
  }

  if (options.maxLength && value.length > options.maxLength) {
    throw new ValidationError(`${fieldName} too long (max ${options.maxLength} characters)`);
  }
}

/**
 * Validate array field (SERVER-SIDE)
 */
export function validateArray(
  value: any,
  fieldName: string,
  options: {
    required?: boolean;
    maxItems?: number;
  } = {}
): void {
  if (options.required && (!value || !Array.isArray(value))) {
    throw new ValidationError(`${fieldName} is required and must be an array`);
  }

  if (!value) return; // Optional field

  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }

  if (options.maxItems && value.length > options.maxItems) {
    throw new ValidationError(`${fieldName} has too many items (max ${options.maxItems})`);
  }
}

// ============================================================================
// CLIENT-SIDE VALIDATION (UI/UX helpers)
// ============================================================================

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates phone number format (allows international formats)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

/**
 * Validates password strength
 * Returns object with strength level and feedback
 */
export const validatePasswordStrength = (password: string) => {
  let score = 0
  const feedback: string[] = []

  if (password.length >= 8) {
    score++
  } else {
    feedback.push('Use at least 8 characters')
  }

  if (password.length >= 12) {
    score++
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('Include both uppercase and lowercase letters')
  }

  if (/\d/.test(password)) {
    score++
  } else {
    feedback.push('Include at least one number')
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++
  } else {
    feedback.push('Include at least one special character')
  }

  let strength: 'weak' | 'medium' | 'strong'
  if (score <= 2) {
    strength = 'weak'
  } else if (score <= 3) {
    strength = 'medium'
  } else {
    strength = 'strong'
  }

  return { strength, score, feedback }
}

/**
 * Formats phone number for display (US format)
 * Example: "5551234567" → "(555) 123-4567"
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  return phone
}

/**
 * Sanitizes input to prevent XSS (basic frontend sanitization)
 * Note: Backend must also sanitize - this is for UI only
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validates required field
 */
export const isRequired = (value: string): boolean => {
  return value.trim().length > 0
}

/**
 * Validates minimum length
 */
export const minLength = (value: string, min: number): boolean => {
  return value.length >= min
}

/**
 * Validates maximum length
 */
export const maxLength = (value: string, max: number): boolean => {
  return value.length <= max
}

/**
 * Validates that two values match (for password confirmation)
 */
export const matches = (value1: string, value2: string): boolean => {
  return value1 === value2
}
