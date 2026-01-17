/**
 * Protected Route Component
 * Issue 1: Real Authentication
 * 
 * Wraps pages that require authentication
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/states/LoadingState'

export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/auth/signin')
      }
    }, [user, isLoading, router])

    if (isLoading) {
      return <LoadingState message="Loading..." />
    }

    if (!user) {
      return null
    }

    return <Component {...props} />
  }
}
