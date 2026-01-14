/**
 * Validation Utilities
 * 
 * Frontend-only validation helpers for forms.
 * All validation is for UI/UX purposes only - backend must re-validate.
 */

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
