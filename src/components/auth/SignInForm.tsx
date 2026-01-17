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

    if (!validateForm()) {
      return
    }

    setAuthState('loading')

    try {
      await signin(formData.email, formData.password)
      // Redirect handled by AuthContext
    } catch (error) {
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {authState === 'error' && (
        <Alert type="danger" message={errorMessage} />
      )}
      
      {authState === 'locked' && (
        <Alert type="warning" message={errorMessage} />
      )}

      <Input
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="you@example.com"
        autoComplete="email"
        disabled={authState === 'loading'}
      />

      <Input
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        placeholder="Enter your password"
        autoComplete="current-password"
        disabled={authState === 'loading'}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-clinical-blue-600 hover:text-clinical-blue-700 transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={authState === 'loading'}
      >
        Sign In
      </Button>
    </form>
  )
}
