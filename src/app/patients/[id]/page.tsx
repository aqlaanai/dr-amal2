/**
 * Patient Detail Page
 * STEP 5: Connected to real API with related data
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

interface ClinicalNote {
  noteId: string
  status: 'draft' | 'ai_assisted_draft' | 'finalized' | 'archived'
  createdAt: string
  updatedAt: string
}

interface Prescription {
  prescriptionId: string
  medication: string
  dosage: string
  status: 'draft' | 'issued' | 'completed' | 'cancelled'
  createdAt: string
}

interface LabResult {
  labId: string
  testName: string
  status: 'pending' | 'received' | 'reviewed'
  orderedAt: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'prescriptions' | 'labs'>('info')
  const [notes, setNotes] = useState<ClinicalNote[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [labs, setLabs] = useState<LabResult[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)

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

  // Fetch related data when tabs are opened
  useEffect(() => {
    async function fetchRelatedData() {
      if (!patientId) return

      setLoadingRelated(true)
      try {
        if (activeTab === 'notes') {
          const response = await ApiClient.get<{ notes: ClinicalNote[] }>(`/api/notes?patientId=${patientId}&limit=10`)
          setNotes(response.notes || [])
        } else if (activeTab === 'prescriptions') {
          const response = await ApiClient.get<{ prescriptions: Prescription[] }>(`/api/prescriptions?patientId=${patientId}&limit=10`)
          setPrescriptions(response.prescriptions || [])
        } else if (activeTab === 'labs') {
          const response = await ApiClient.get<{ labs: LabResult[] }>(`/api/lab-results?patientId=${patientId}&limit=10`)
          setLabs(response.labs || [])
        }
      } catch (err) {
        console.error('Failed to load related data:', err)
      } finally {
        setLoadingRelated(false)
      }
    }

    if (activeTab !== 'info') {
      fetchRelatedData()
    }
  }, [activeTab, patientId])

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

  const getStatusColor = (status: string) => {
    if (status === 'draft' || status === 'pending') return 'bg-yellow-100 text-yellow-800'
    if (status === 'finalized' || status === 'issued' || status === 'received' || status === 'completed') return 'bg-green-100 text-green-800'
    if (status === 'archived' || status === 'cancelled') return 'bg-gray-100 text-gray-800'
    return 'bg-blue-100 text-blue-800'
  }

  return (
    <ProtectedRoute requiredRoles={['provider', 'admin']}>
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
              {/* Tab Navigation */}
              <div className="mb-6 flex gap-2 border-b border-gray-200">
                {['info', 'notes', 'prescriptions', 'labs'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`px-4 py-2 font-medium text-sm border-b-2 ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Info Tab */}
              {activeTab === 'info' && (
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

                    <div>
                      <label className="text-sm font-medium text-gray-500">Patient ID</label>
                      <p className="text-gray-900 mt-1 font-mono text-sm">{patient.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {loadingRelated ? (
                    <div className="p-12 text-center">
                      <div className="inline-block">Loading...</div>
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No clinical notes yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {notes.map((note) => (
                            <tr key={note.noteId} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(note.status)}`}>
                                  {note.status === 'ai_assisted_draft' ? 'AI Draft' : note.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {new Date(note.updatedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Prescriptions Tab */}
              {activeTab === 'prescriptions' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {loadingRelated ? (
                    <div className="p-12 text-center">
                      <div className="inline-block">Loading...</div>
                    </div>
                  ) : prescriptions.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No prescriptions yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medication</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {prescriptions.map((prescription) => (
                            <tr key={prescription.prescriptionId} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {prescription.medication}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {prescription.dosage}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(prescription.status)}`}>
                                  {prescription.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {new Date(prescription.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Labs Tab */}
              {activeTab === 'labs' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {loadingRelated ? (
                    <div className="p-12 text-center">
                      <div className="inline-block">Loading...</div>
                    </div>
                  ) : labs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      No lab results yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {labs.map((lab) => (
                            <tr key={lab.labId} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {lab.testName}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(lab.status)}`}>
                                  {lab.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
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
          </>
        )}
      </AppShell>
    </ProtectedRoute>
  )
}
