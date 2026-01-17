'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { RestrictedState } from '@/components/states/RestrictedState'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { withAuth } from '@/components/auth/withAuth'

function LabsPage() {
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
        title="Lab Results"
        subtitle="Laboratory test orders and results"
        primaryAction={{
          label: 'Order Labs',
          onClick: () => {},
        }}
      />
      <div className="p-8">
        <div className="bg-white rounded-card border border-clinical-border">
          <EmptyState
            icon={<LabIcon />}
            title="No lab results"
            description="Order and review laboratory tests for your patients."
          />
        </div>
      </div>
    </AppShell>
  )
}

const LabIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)

export default withAuth(LabsPage)
