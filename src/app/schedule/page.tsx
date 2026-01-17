'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { RestrictedState } from '@/components/states/RestrictedState'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { withAuth } from '@/components/auth/withAuth'

function SchedulePage() {
  const { hasAccess } = useRoleAccess(['provider'])

  if (!hasAccess) {
    return (
      <AppShell>
        <RestrictedState />
      </AppShell>
    )
  }
  return (
    <AppShell>
      <PageHeader
        title="Schedule"
        subtitle="Manage appointments and availability"
        primaryAction={{
          label: 'New Appointment',
          onClick: () => {},
        }}
      />
      <div className="p-8">
        <div className="bg-white rounded-card border border-clinical-border">
          <EmptyState
            icon={<CalendarIcon />}
            title="No appointments scheduled"
            description="Start scheduling appointments to manage your clinical calendar."
          />
        </div>
      </div>
    </AppShell>
  )
}

const CalendarIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

export default withAuth(SchedulePage)
