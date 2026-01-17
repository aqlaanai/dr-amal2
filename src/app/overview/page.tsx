/**
 * Overview Page
 * Issue 1: Real Authentication - Protected route
 * STEP 5: Connected to real API
 */

'use client'

import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthContext'

interface OverviewData {
  stats: {
    totalPatients: number
    activeSessions: number
    pendingLabResults: number
    recentNotes: number
  }
  recentActivity: {
    recentPatients: any[]
    recentSessions: any[]
  }
}

function OverviewPage() {
  const { user } = useAuth()
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true)
        const overview = await ApiClient.get<OverviewData>('/api/overview')
        setData(overview)
        setError(null)
      } catch (err: any) {
        setError(err.error || 'Failed to load overview data')
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
  }, [])

  return (
    <ProtectedRoute>
      <AppShell>
        <PageHeader 
          title="Overview" 
          subtitle={user ? `Welcome back, ${user.firstName || user.email}` : undefined}
        />

        <div className="p-8">
          {loading && <LoadingState />}
          
          {error && (
            <ErrorState 
              message={error}
              retry={() => window.location.reload()}
            />
          )}

          {!loading && !error && data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Total Patients"
                value={data.stats.totalPatients}
              />
              <StatCard
                label="Active Sessions"
                value={data.stats.activeSessions}
              />
              <StatCard
                label="Recent Notes"
                value={data.stats.recentNotes}
              />
              <StatCard
                label="Pending Labs"
                value={data.stats.pendingLabResults}
              />
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

export default OverviewPage
