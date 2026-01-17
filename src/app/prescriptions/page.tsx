/**
 * Prescriptions Page
 * STEP 5: Connected to real API
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ApiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

interface PrescriptionFormData {
  patientId: string
  medication: string
  dosage: string
  duration: string
  instructions: string
}

export default function PrescriptionsPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<PrescriptionFormData>({
    patientId: '',
    medication: '',
    dosage: '',
    duration: '',
    instructions: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.patientId || !formData.medication || !formData.dosage || !formData.duration) {
      setError('Patient ID, medication, dosage, and duration are required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      await ApiClient.post('/api/prescriptions', {
        patientId: formData.patientId,
        medication: formData.medication,
        dosage: formData.dosage,
        duration: formData.duration,
        instructions: formData.instructions || undefined,
      })
      
      setSuccess(true)
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
      setError(err.error || 'Failed to create prescription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole={['provider', 'admin']}>
      <AppShell>
        <PageHeader
          title="Prescriptions"
          subtitle="Medication orders and prescription history"
          primaryAction={{
            label: "New Prescription",
            onClick: () => router.push('/prescriptions/new')
          }}
        />

        <div className="p-8">
          {!showForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                <PrescriptionIcon />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Create Prescription</h3>
              <p className="text-gray-500 mb-6">
                Create new medication prescriptions for your patients
              </p>
              <Button onClick={() => setShowForm(true)}>
                New Prescription
              </Button>
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold mb-6">Create Prescription (Draft)</h2>

              {error && (
                <Alert type="danger" message={error} className="mb-4" />
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
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Draft Prescription'}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

const PrescriptionIcon = () => (
  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)
