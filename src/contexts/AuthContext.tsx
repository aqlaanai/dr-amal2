/**
 * Authentication Context
 * Issue 1: Real Authentication
 * 
 * Manages authentication state and tokens
 */

'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
  accountStatus: string
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  signin: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Load tokens from localStorage on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('user')

    if (storedAccessToken && storedUser) {
      setAccessToken(storedAccessToken)
      setUser(JSON.parse(storedUser))
    } else if (storedRefreshToken) {
      // Try to refresh
      refreshAuth()
    }
    
    setIsLoading(false)
  }, [])

  const signin = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Authentication failed')
    }

    const data = await response.json()
    
    // Store tokens and user
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    setAccessToken(data.accessToken)
    setUser(data.user)
    
    router.push('/overview')
  }

  const signup = async (signupData: SignupData) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Signup failed')
    }

    const data = await response.json()
    
    // Store tokens and user
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    setAccessToken(data.accessToken)
    setUser(data.user)
    
    router.push('/overview')
  }

  const logout = async () => {
    const token = localStorage.getItem('accessToken')
    
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
          },
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    // Clear local state
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setAccessToken(null)
    setUser(null)
    
    router.push('/auth/signin')
  }

  const refreshAuth = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!refreshToken) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Refresh failed')
      }

      const data = await response.json()
      
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      
      setAccessToken(data.accessToken)
    } catch (error) {
      // Refresh failed, clear everything
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setAccessToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, signin, signup, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
