/**
 * Protected Route Component
 * Enforces authentication on protected pages
 */

'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/states/LoadingState'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin')
    }
    
    if (!isLoading && user && requiredRole && !requiredRole.includes(user.role)) {
      router.push('/overview')
    }
  }, [user, isLoading, router, requiredRole])

  if (isLoading) {
    return <LoadingState />
  }

  if (!user) {
    return null
  }

  if (requiredRole && !requiredRole.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
