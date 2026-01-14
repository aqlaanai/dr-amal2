'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { RestrictedState } from '@/components/states/RestrictedState'
import { useRoleAccess } from '@/hooks/useRoleAccess'

export default function SessionsPage() {
  const { hasAccess } = useRoleAccess(['provider'])

  return (
    <AppShell>
      {hasAccess ? (
        <>
          <PageHeader
            title="Live Sessions"
            subtitle="Active and scheduled telehealth consultations"
            primaryAction={{
              label: 'Start Session',
              onClick: () => {},
            }}
          />
          <div className="p-8">
            <div className="bg-white rounded-card border border-clinical-border">
              <EmptyState
                icon={<SessionIcon />}
                title="No active sessions"
                description="Start a new session to conduct remote clinical consultations."
              />
            </div>
          </div>
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
