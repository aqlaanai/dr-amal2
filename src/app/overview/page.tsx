/**
 * Overview/Dashboard Page
 * Main landing page after authentication
 */

'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import Link from 'next/link'

export default function OverviewPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clinical-blue-600 mx-auto mb-4"></div>
          <p className="text-clinical-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Dashboard cards
  const dashboardItems = [
    {
      title: 'Live Sessions',
      description: 'Active and scheduled telehealth consultations',
      href: '/sessions',
      icon: '📹',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Patient Registry',
      description: 'Register and manage your patients',
      href: '/patients',
      icon: '👥',
      color: 'bg-green-50 border-green-200',
    },
    {
      title: 'Clinical Notes',
      description: 'Document patient visits with SOAP format',
      href: '/notes',
      icon: '📝',
      color: 'bg-purple-50 border-purple-200',
    },
    {
      title: 'Prescriptions',
      description: 'Create and manage medication orders',
      href: '/prescriptions',
      icon: '💊',
      color: 'bg-orange-50 border-orange-200',
    },
    {
      title: 'Lab Results',
      description: 'Order and review laboratory tests',
      href: '/labs',
      icon: '🧪',
      color: 'bg-red-50 border-red-200',
    },
  ]

  return (
    <AppShell>
      <PageHeader
        title="Overview"
        subtitle="Welcome back! Access your clinical tools"
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {dashboardItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`h-full p-4 sm:p-6 rounded-lg border-2 ${item.color} cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1`}>
                <div className="text-3xl sm:text-4xl mb-3">{item.icon}</div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <p className="text-gray-600 text-sm font-medium">Total Patients</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">—</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <p className="text-gray-600 text-sm font-medium">Active Sessions</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">—</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <p className="text-gray-600 text-sm font-medium">Pending Labs</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">—</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
