/**
 * Prescription Detail Page
 * STEP 8: Clinical Frontend MVP
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { ApiClient } from '@/lib/api-client'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface Prescription {
  id: string
  patientId: string
  providerId: string
  medication: string
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
  indication?: string
  status: 'draft' | 'issued' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  issuedAt?: string
}

function PrescriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const prescriptionId = params.id as string

  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [issuing, setIssuing] = useState(false)

  useEffect(() => {
    fetchPrescription()
  }, [prescriptionId])

  const fetchPrescription = async () => {
    try {
      setLoading(true)
      const response = await ApiClient.get<Prescription>(`/api/prescriptions/${prescriptionId}`)
      setPrescription(response)
    } catch (err: any) {
      setError(err.error || 'Failed to load prescription')
    } finally {
      setLoading(false)
    }
  }

  const handleIssue = async () => {
    if (!prescription || prescription.status !== 'draft') return

    try {
      setIssuing(true)
      await ApiClient.post(`/api/prescriptions/${prescriptionId}/issue`, {})
      // Refresh the prescription
      await fetchPrescription()
    } catch (err: any) {
      setError(err.error || 'Failed to issue prescription')
    } finally {
      setIssuing(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['provider', 'admin']}>
        <AppShell>
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading prescription...</div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (error || !prescription) {
    return (
      <ProtectedRoute requiredRoles={['provider', 'admin']}>
        <AppShell>
          <div className="max-w-4xl mx-auto p-8">
            <Alert type="danger" message={error || 'Prescription not found'} />
            <div className="mt-4">
              <Button onClick={() => router.back()}>Go Back</Button>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  const getStatusColor = (status: string): 'default' | 'info' | 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'draft': return 'warning'
      case 'issued': return 'success'
      case 'completed': return 'info'
      case 'cancelled': return 'danger'
      default: return 'default'
    }
  }

  return (
    <ProtectedRoute requiredRoles={['provider', 'admin']}>
      <AppShell>
        <PageHeader
          title={`Prescription - ${prescription.patientId}`}
          subtitle={`Created ${new Date(prescription.createdAt).toLocaleDateString()}`}
        />

        <div className="max-w-4xl mx-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <Badge variant={getStatusColor(prescription.status)}>
              {prescription.status.toUpperCase()}
            </Badge>

            <div className="space-x-2">
              {prescription.status === 'draft' && (
                <Button
                  variant="primary"
                  onClick={handleIssue}
                  disabled={issuing}
                >
                  {issuing ? 'Issuing...' : 'Issue Prescription'}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Medication Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Medication</label>
                  <p className="text-gray-900">{prescription.medication}</p>
                </div>
                {prescription.dosage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Dosage</label>
                    <p className="text-gray-900">{prescription.dosage}</p>
                  </div>
                )}
                {prescription.frequency && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Frequency</label>
                    <p className="text-gray-900">{prescription.frequency}</p>
                  </div>
                )}
                {prescription.duration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Duration</label>
                    <p className="text-gray-900">{prescription.duration}</p>
                  </div>
                )}
              </div>
            </Card>

            {prescription.instructions && (
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {prescription.instructions}
                </p>
              </Card>
            )}

            {prescription.indication && (
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Indication</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {prescription.indication}
                </p>
              </Card>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <Button variant="secondary" onClick={() => router.back()}>
              Back to Prescriptions
            </Button>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

export default PrescriptionDetailPage