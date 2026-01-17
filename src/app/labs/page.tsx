'use client'

import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ApiClient } from '@/lib/api-client'

interface LabResult {
  labId: string
  patientId: string
  patientName: string
  testName: string
  status: 'pending' | 'received' | 'reviewed'
  value: string | number
  unit: string
  abnormal: boolean
  orderedAt: string
  receivedAt: string | null
  reviewedAt: string | null
}

export default function LabsPage() {
  const [labs, setLabs] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLabs() {
      try {
        setLoading(true)
        const response = await ApiClient.get<{ labs: LabResult[] }>('/api/lab-results')
        setLabs(response.labs || [])
        setError(null)
      } catch (err: any) {
        setError(err.error || 'Failed to load lab results')
      } finally {
        setLoading(false)
      }
    }

    fetchLabs()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'received':
        return 'bg-blue-100 text-blue-800'
      case 'reviewed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAbnormalColor = (abnormal: boolean) => {
    return abnormal ? 'text-red-600 font-semibold' : 'text-gray-900'
  }

  return (
    <ProtectedRoute requiredRole={['provider', 'admin']}>
      <AppShell>
        <PageHeader
          title="Lab Results"
          subtitle="Laboratory test orders and results"
        />

        <div className="p-8">
          {loading && <LoadingState />}

          {error && (
            <ErrorState
              message={error}
              retry={() => window.location.reload()}
            />
          )}

          {!loading && !error && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {labs.length === 0 ? (
                <div className="p-12 text-center">
                  <LabIcon />
                  <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No lab results</h3>
                  <p className="text-gray-500">
                    Order and review laboratory tests for your patients.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Test Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ordered
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {labs.map((lab) => (
                        <tr key={lab.labId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {lab.patientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lab.testName}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${getAbnormalColor(lab.abnormal)}`}>
                            {lab.value} {lab.unit}
                            {lab.abnormal && <span className="ml-2 text-xs">⚠️ Abnormal</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(lab.status)}`}>
                              {lab.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(lab.orderedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

const LabIcon = () => (
  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)
