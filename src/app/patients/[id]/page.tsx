/**
 * Patient Detail Page
 * STEP 5: Connected to real API
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
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
  updatedAt: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPatient() {
      try {
        setLoading(true)
        const data = await ApiClient.get<Patient>(`/api/patients/${patientId}`)
        setPatient(data)
        setError(null)
      } catch (err: any) {
        setError(err.error || 'Failed to load patient details')
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      fetchPatient()
    }
  }, [patientId])

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
        {loading && <LoadingState />}
        
        {error && (
          <ErrorState 
            message={error}
            retry={() => window.location.reload()}
          />
        )}

        {!loading && !error && patient && (
          <>
            <PageHeader
              title={`${patient.firstName} ${patient.lastName}`}
              subtitle={`${calculateAge(patient.dateOfBirth)} years old • ${patient.status}`}
            />

            <div className="p-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">First Name</label>
                    <p className="text-gray-900 mt-1">{patient.firstName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Name</label>
                    <p className="text-gray-900 mt-1">{patient.lastName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(patient.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Age</label>
                    <p className="text-gray-900 mt-1">{calculateAge(patient.dateOfBirth)} years</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-gray-900 mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        patient.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.status}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Registered</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </AppShell>
    </ProtectedRoute>
  )
}
