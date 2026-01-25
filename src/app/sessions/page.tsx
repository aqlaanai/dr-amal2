'use client'

import React, { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { RestrictedState } from '@/components/states/RestrictedState'
import { StartSessionModal } from '@/components/sessions/StartSessionModal'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { withAuth } from '@/components/auth/withAuth'
import { useRouter } from 'next/navigation'

function SessionsPage() {
  const { hasAccess } = useRoleAccess(['provider'])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleStartSession = async (data: { patientId: string; scheduledAt: string }) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create appointment')
      }

      const appointment = await response.json()

      // Navigate to the session page or refresh the list
      // For now, we'll just close the modal and could show a success message
      console.log('Appointment created:', appointment)

      // Optionally refresh the page or update the sessions list
      // router.refresh()

    } catch (error) {
      console.error('Failed to create session:', error)
      throw error // Re-throw to let the modal handle the error
    }
  }

  return (
    <AppShell>
      {hasAccess ? (
        <>
          <PageHeader
            title="Live Sessions"
            subtitle="Active and scheduled telehealth consultations"
            primaryAction={{
              label: 'Start Session',
              onClick: () => setIsModalOpen(true),
            }}
          />
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-card border border-clinical-border">
              <EmptyState
                icon={<SessionIcon />}
                title="No active sessions"
                description="Start a new session to conduct remote clinical consultations."
              />
            </div>
          </div>

          <StartSessionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleStartSession}
          />
        </>
      ) : (
        <RestrictedState />
      )}
    </AppShell>
  )
}

const SessionIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

export default withAuth(SessionsPage)
