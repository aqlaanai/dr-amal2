/**
 * Patients Page
 * STEP 5: Connected to real API
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ApiClient } from '@/lib/api-client'

interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  status: string
  createdAt: string
}

interface PatientsResponse {
  data: Patient[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [pagination, setPagination] = useState<PatientsResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true)
        const response = await ApiClient.get<PatientsResponse>('/api/patients?limit=50&offset=0')
        setPatients(response.data)
        setPagination(response.pagination)
        setError(null)
      } catch (err: any) {
        setError(err.error || 'Failed to load patients')
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <ProtectedRoute requiredRole={['provider', 'admin']}>
      <AppShell>
        <PageHeader
          title="Patient Registry"
          subtitle={pagination ? `${pagination.total} total patients` : undefined}
        />

        <div className="p-8">
          {loading && <LoadingState />}
          
          {error && (
            <ErrorState 
              message={error}
              retry={() => window.location.reload()}
            />
          )}

          {!loading && !error && patients.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-12">
              <EmptyState
                icon={<PatientIcon />}
                title="No patients found"
                description="No patients are registered in the system."
              />
            </div>
          )}

          {!loading && !error && patients.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr 
                      key={patient.id}
                      onClick={() => router.push(`/patients/${patient.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {calculateAge(patient.dateOfBirth)} years
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination && pagination.hasMore && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button 
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => {/* Load more functionality */}}
                  >
                    Load more ({pagination.total - patients.length} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

const PatientIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

export default PatientsPage
