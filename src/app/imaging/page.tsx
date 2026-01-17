'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { RestrictedState } from '@/components/states/RestrictedState'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { withAuth } from '@/components/auth/withAuth'

function ImagingPage() {
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
        title="Medical Imaging"
        subtitle="Radiology orders and imaging studies"
        primaryAction={{
          label: 'Order Imaging',
          onClick: () => {},
        }}
      />
      <div className="p-8">
        <div className="bg-white rounded-card border border-clinical-border">
          <EmptyState
            icon={<ImagingIcon />}
            title="No imaging studies"
            description="Request and review medical imaging for your patients."
          />
        </div>
      </div>
    </AppShell>
  )
}

const ImagingIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

export default withAuth(ImagingPage)
