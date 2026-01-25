/**
 * Prescriptions Page
 * STEP 5: Connected to real API
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ApiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

interface Prescription {
  prescriptionId: string
  patientId: string
  patientName: string
  medication: string
  dosage: string
  duration: string
  instructions?: string
  status: 'draft' | 'issued' | 'completed' | 'cancelled'
  createdAt: string
  issuedAt: string | null
}

interface PrescriptionFormData {
  patientId: string
  medication: string
  dosage: string
  duration: string
  instructions: string
}

export default function PrescriptionsPage() {
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<PrescriptionFormData>({
    patientId: '',
    medication: '',
    dosage: '',
    duration: '',
    instructions: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [issuingId, setIssuingId] = useState<string | null>(null)

  // Fetch prescriptions list
  useEffect(() => {
    async function fetchPrescriptions() {
      try {
        setLoading(true)
        const response = await ApiClient.get<any>('/api/prescriptions?limit=50&offset=0')
        setPrescriptions(response.data || [])
        setError(null)
      } catch (err: any) {
        console.error('Failed to load prescriptions:', err)
        setError(err?.message || err?.error || 'Failed to load prescriptions')
      } finally {
        setLoading(false)
      }
    }

    fetchPrescriptions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.patientId || !formData.medication || !formData.dosage || !formData.duration) {
      setFormError('Patient ID, medication, dosage, and duration are required')
      return
    }

    try {
      setFormLoading(true)
      setFormError(null)
      
      const newPrescription = await ApiClient.post<Prescription>('/api/prescriptions', {
        patientId: formData.patientId,
        medication: formData.medication,
        dosage: formData.dosage,
        duration: formData.duration,
        instructions: formData.instructions || undefined,
      })
      
      setSuccess(true)
      setPrescriptions([newPrescription, ...prescriptions])
      setFormData({
        patientId: '',
        medication: '',
        dosage: '',
        duration: '',
        instructions: '',
      })
      
      setTimeout(() => {
        setSuccess(false)
        setShowForm(false)
      }, 2000)
    } catch (err: any) {
      setFormError(err.error || 'Failed to create prescription')
    } finally {
      setFormLoading(false)
    }
  }

  const handleIssue = async (prescriptionId: string) => {
    try {
      setIssuingId(prescriptionId)
      await ApiClient.post(`/api/prescriptions/${prescriptionId}/issue`)
      // Update the prescription in the list
      setPrescriptions(prescriptions.map(p => 
        p.prescriptionId === prescriptionId 
          ? { ...p, status: 'issued' as const, issuedAt: new Date().toISOString() }
          : p
      ))
    } catch (err: any) {
      setFormError(err.error || 'Failed to issue prescription')
    } finally {
      setIssuingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'issued':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute requiredRoles={['provider', 'admin']}>
      <AppShell>
        <PageHeader
          title="Prescriptions"
          subtitle="Medication orders and prescription history"
          primaryAction={{
            label: "New Prescription",
            onClick: () => setShowForm(true)
          }}
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
            <>
              {showForm && (
                <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
                  <h2 className="text-lg font-semibold mb-6">Create Prescription (Draft)</h2>

                  {formError && (
                    <Alert type="danger" message={formError} className="mb-4" />
                  )}

                  {success && (
                    <Alert type="success" message="Prescription created successfully!" className="mb-4" />
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Patient ID"
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      placeholder="Enter patient ID"
                      required
                    />

                    <Input
                      label="Medication"
                      value={formData.medication}
                      onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                      placeholder="e.g., Amoxicillin"
                      required
                    />

                    <Input
                      label="Dosage"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      placeholder="e.g., 500mg"
                      required
                    />

                    <Input
                      label="Duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 7 days"
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions (optional)
                      </label>
                      <textarea
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        className="w-full border border-gray-300 rounded-md p-2 min-h-[80px]"
                        placeholder="e.g., Take with food. Complete full course."
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={formLoading}>
                        {formLoading ? 'Creating...' : 'Create Draft Prescription'}
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setShowForm(false)}
                        disabled={formLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Prescriptions List */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {prescriptions.length === 0 ? (
                  <div className="p-12 text-center">
                    <PrescriptionIcon />
                    <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Create Prescription</h3>
                    <p className="text-gray-500 mb-6">
                      Create new medication prescriptions for your patients
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      New Prescription
                    </Button>
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
                            Medication
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dosage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {prescriptions.map((prescription) => (
                          <tr key={prescription.prescriptionId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {prescription.patientName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {prescription.medication}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {prescription.dosage}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {prescription.duration}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(prescription.status)}`}>
                                {prescription.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                              {prescription.status === 'draft' ? (
                                <>
                                  <button
                                    onClick={() => router.push(`/prescriptions/${prescription.prescriptionId}`)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleIssue(prescription.prescriptionId)}
                                    disabled={issuingId === prescription.prescriptionId}
                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                  >
                                    {issuingId === prescription.prescriptionId ? 'Issuing...' : 'Issue'}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => router.push(`/prescriptions/${prescription.prescriptionId}`)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

const PrescriptionIcon = () => (
  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)
