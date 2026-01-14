'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { RestrictedState } from '@/components/states/RestrictedState'
import { useRoleAccess } from '@/hooks/useRoleAccess'

export default function NotesPage() {
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
        title="Clinical Notes"
        subtitle="Patient visit notes and clinical documentation"
        primaryAction={{
          label: 'New Note',
          onClick: () => {},
        }}
      />
      <div className="p-8">
        <div className="bg-white rounded-card border border-clinical-border">
          <EmptyState
            icon={<NotesIcon />}
            title="No clinical notes"
            description="Document patient visits and clinical observations."
          />
        </div>
      </div>
    </AppShell>
  )
}

const NotesIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
