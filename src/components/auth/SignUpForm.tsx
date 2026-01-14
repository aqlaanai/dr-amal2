'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

interface FormData {
  firstName: string
  lastName: string
  role: string
  phone: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  role?: string
  phone?: string
  email?: string
  password?: string
  confirmPassword?: string
}

type PasswordStrength = 'weak' | 'medium' | 'strong'

export const SignUpForm: React.FC = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    role: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null)

  const roleOptions = [
    { value: '', label: 'Select role' },
    { value: 'parent', label: 'Parent / Caregiver' },
    { value: 'provider', label: 'Healthcare Provider' },
  ]

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let strength = 0
    
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    if (strength <= 2) return 'weak'
    if (strength <= 3) return 'medium'
    return 'strong'
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // First name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    // Last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    // Role
    if (!formData.role) {
      newErrors.role = 'Please select a role'
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    // Simulate API call
    // In production, this would call your backend registration endpoint
    setTimeout(() => {
      setIsLoading(false)
      // Success - redirect to dashboard
      console.log('Sign up successful:', {
        ...formData,
        password: '[REDACTED]',
        confirmPassword: '[REDACTED]',
      })
      router.push('/overview')
    }, 2000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Update password strength
    if (name === 'password') {
      if (value) {
        setPasswordStrength(calculatePasswordStrength(value))
      } else {
        setPasswordStrength(null)
      }
    }

    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const getVerificationMessage = () => {
    // Approval messages disabled for now - will be activated later
    return null
  }

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return ''
    
    const colors = {
      weak: 'bg-clinical-danger',
      medium: 'bg-clinical-warning',
      strong: 'bg-clinical-success',
    }
    
    return colors[passwordStrength]
  }

  const getPasswordStrengthWidth = () => {
    if (!passwordStrength) return '0%'
    
    const widths = {
      weak: '33%',
      medium: '66%',
      strong: '100%',
    }
    
    return widths[passwordStrength]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {getVerificationMessage()}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={errors.firstName}
          placeholder="John"
          disabled={isLoading}
        />

        <Input
          label="Last Name"
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={errors.lastName}
          placeholder="Doe"
          disabled={isLoading}
        />
      </div>

      <Select
        label="Role"
        name="role"
        value={formData.role}
        onChange={handleChange}
        error={errors.role}
        options={roleOptions}
        disabled={isLoading}
      />

      <Input
        label="Phone Number"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
        placeholder="+1 (555) 123-4567"
        disabled={isLoading}
      />

      <Input
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="you@example.com"
        autoComplete="email"
        disabled={isLoading}
      />

      <div>
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Create a strong password"
          autoComplete="new-password"
          disabled={isLoading}
        />
        
        {passwordStrength && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                style={{ width: getPasswordStrengthWidth() }}
              />
            </div>
            <p className="mt-1 text-xs text-clinical-text-secondary capitalize">
              Password strength: {passwordStrength}
            </p>
          </div>
        )}
      </div>

      <Input
        label="Confirm Password"
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        placeholder="Re-enter your password"
        autoComplete="new-password"
        disabled={isLoading}
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isLoading}
      >
        Create Account
      </Button>
    </form>
  )
}
