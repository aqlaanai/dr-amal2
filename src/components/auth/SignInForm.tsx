/**
 * SignIn Form
 * Issue 1: Real Authentication - Updated to use real API
 */

'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/contexts/AuthContext'

interface SignInFormProps {
  onForgotPassword: () => void
}

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

type AuthState = 'idle' | 'loading' | 'error' | 'locked'

export const SignInForm: React.FC<SignInFormProps> = ({ onForgotPassword }) => {
  const { signin } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [authState, setAuthState] = useState<AuthState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    console.log('Form submitted with data:', { email: formData.email || '(empty)', password: formData.password ? '(provided)' : '(empty)' });

    if (!validateForm()) {
      console.log('Form validation failed');
      return
    }

    console.log('Form validation passed, calling signin...');
    setAuthState('loading')

    try {
      await signin(formData.email, formData.password)
      // Redirect handled by AuthContext
    } catch (error) {
      console.error('Signin error:', error);
      setAuthState('error')
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {authState === 'error' && (
        <div className="animate-in slide-in-from-top">
          <Alert type="danger" message={errorMessage} />
        </div>
      )}
      
      {authState === 'locked' && (
        <div className="animate-in slide-in-from-top">
          <Alert type="warning" message={errorMessage} />
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="Enter your email"
            autoComplete="email"
            disabled={authState === 'loading'}
          />
          {errors.email && <p className="text-xs text-clinical-danger-600 mt-1">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label className="text-sm font-medium text-clinical-text-primary">Password</label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-clinical-blue-600 hover:text-clinical-blue-700 hover:underline transition-colors"
            >
              Forgot?
            </button>
          </div>
          <Input
            label=""
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={authState === 'loading'}
          />
          {errors.password && <p className="text-xs text-clinical-danger-600 mt-1">{errors.password}</p>}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={authState === 'loading'}
        className="h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
      >
        {authState === 'loading' ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Additional Info */}
      <div className="pt-2 border-t border-clinical-border-light">
        <p className="text-xs text-clinical-text-muted text-center">
          First time? <span className="text-clinical-blue-600 font-medium">Sign up on the next tab</span>
        </p>
      </div>
    </form>
  )
}
