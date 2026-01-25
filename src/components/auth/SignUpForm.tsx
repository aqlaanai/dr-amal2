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
    { value: '', label: 'Select Role' },
    { value: 'parent', label: 'Parent/Caregiver' },
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
      newErrors.role = 'Role is required'
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number'
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required'
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
    setErrors({})

    try {
      // Call the signup API directly (before auth, so can't use ApiClient)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle error responses
        setErrors({ email: data.error || 'Signup failed. Please try again.' })
        return
      }

      // Success - store tokens and redirect
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))

      router.push('/overview')
    } catch (error) {
      console.error('[SignUp] Error:', error)
      setErrors({ email: 'Network error. Please check your connection and try again.' })
    } finally {
      setIsLoading(false)
    }
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

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
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
          disabled={isLoading}
        >
          {roleOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

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
          label="Email Address"
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
              <p className="mt-1 text-xs text-slate-500 capitalize">
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
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isLoading}
        className="!py-3 !text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
      >
        Sign Up
      </Button>
    </form>
  )
}
