'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect authenticated users to overview
        router.push('/overview')
      } else {
        // Redirect unauthenticated users to signin
        router.push('/auth/signin')
      }
    }
  }, [user, isLoading, router])

  // Show loading state while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-clinical-bg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-clinical-blue mx-auto mb-4"></div>
        <p className="text-clinical-text-secondary">Loading...</p>
      </div>
    </div>
  )
}
