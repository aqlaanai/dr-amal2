'use client'

import React from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { ReadOnlyBanner } from '@/components/states/ReadOnlyBanner'
import { useRoleAccess } from '@/hooks/useRoleAccess'

export default function OverviewPage() {
  const { role, isReadOnly } = useRoleAccess(['provider', 'admin', 'parent'])

  return (
    <AppShell>
      {isReadOnly && <ReadOnlyBanner />}
      
      <PageHeader
        title="Overview"
        subtitle={
          role === 'parent'
            ? 'Your family care summary'
            : 'Clinical practice performance and key metrics'
        }
      />

      <div className="p-8">
        {/* Provider and Admin see full KPI dashboard */}
        {(role === 'provider' || role === 'admin') && (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                label="Today's Appointments"
                value={12}
                change={{ value: '+2', trend: 'up' }}
                icon={<CalendarIcon />}
              />
              <StatCard
                label="Active Patients"
                value={247}
                change={{ value: '+18', trend: 'up' }}
                icon={<PatientIcon />}
              />
              <StatCard
                label="Pending Lab Results"
                value={8}
                change={{ value: '-3', trend: 'down' }}
                icon={<LabIcon />}
              />
              <StatCard
                label="Sessions This Week"
                value={34}
                change={{ value: '+5', trend: 'up' }}
                icon={<SessionIcon />}
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Prescriptions Written"
                value={156}
                change={{ value: '+12', trend: 'up' }}
              />
              <StatCard
                label="Clinical Notes"
                value={89}
                change={{ value: '+7', trend: 'up' }}
              />
              <StatCard
                label="Referrals Made"
                value={23}
                change={{ value: '0', trend: 'neutral' }}
              />
            </div>
          </>
        )}

        {/* Parent sees limited placeholder view */}
        {role === 'parent' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              label="Upcoming Appointments"
              value={2}
              icon={<CalendarIcon />}
            />
            <StatCard
              label="Family Members"
              value={3}
              icon={<PatientIcon />}
            />
          </div>
        )}
      </div>
    </AppShell>
  )
}

// Simple icons for KPI cards
const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const PatientIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const LabIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)

const SessionIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)
