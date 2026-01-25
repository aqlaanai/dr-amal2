/**
 * Create New Prescription
 * STEP 8: Clinical Frontend MVP
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { ApiClient } from '@/lib/api-client'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface PrescriptionFormData {
  patientId: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  indication: string
}

function CreatePrescriptionPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<PrescriptionFormData>({
    patientId: '',
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    indication: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.patientId || !formData.medication) {
      setError('Patient ID and medication are required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await ApiClient.post('/api/prescriptions', {
        patientId: formData.patientId,
        medication: formData.medication,
        dosage: formData.dosage || undefined,
        frequency: formData.frequency || undefined,
        duration: formData.duration || undefined,
        instructions: formData.instructions || undefined,
        indication: formData.indication || undefined,
      }) as { id: string }

      // Redirect to the created prescription
      router.push(`/prescriptions/${response.id}`)
    } catch (err: any) {
      setError(err.error || 'Failed to create prescription')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof PrescriptionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAiSuggestion = async () => {
    if (!formData.medication || !formData.dosage) {
      setError('Please enter medication and dosage first')
      return
    }

    try {
      setAiLoading(true)
      setError(null)
      setAiSuggestion(null)

      const response = await ApiClient.post('/api/ai/prescription-instructions', {
        medication: formData.medication,
        dosage: formData.dosage,
        frequency: formData.frequency || undefined,
        duration: formData.duration || undefined,
        indication: formData.indication || undefined,
      }) as { instructions: string }

      setAiSuggestion(response.instructions)
    } catch (err: any) {
      setError(err.error || 'Failed to get AI suggestion')
    } finally {
      setAiLoading(false)
    }
  }

  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      setFormData(prev => ({ ...prev, instructions: aiSuggestion }))
      setAiSuggestion(null)
    }
  }

  return (
    <ProtectedRoute requiredRoles={['provider', 'admin']}>
      <AppShell>
        <PageHeader
          title="Create Prescription"
          subtitle="Prescribe medication for patient"
        />

        <div className="max-w-4xl mx-auto p-8">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert type="danger" message={error} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient ID *
                  </label>
                  <Input
                    label="Patient ID *"
                    type="text"
                    value={formData.patientId}
                    onChange={(e) => handleChange('patientId', e.target.value)}
                    placeholder="Enter patient ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medication *
                  </label>
                  <Input
                    label="Medication *"
                    type="text"
                    value={formData.medication}
                    onChange={(e) => handleChange('medication', e.target.value)}
                    placeholder="e.g., Amoxicillin 500mg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage
                  </label>
                  <Input
                    label="Dosage"
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => handleChange('dosage', e.target.value)}
                    placeholder="e.g., 500mg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <Input
                    label="Frequency"
                    type="text"
                    value={formData.frequency}
                    onChange={(e) => handleChange('frequency', e.target.value)}
                    placeholder="e.g., twice daily"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <Input
                    label="Duration"
                    type="text"
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', e.target.value)}
                    placeholder="e.g., 7 days"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Instructions
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAiSuggestion}
                    disabled={aiLoading || !formData.medication}
                    className="text-xs"
                  >
                    {aiLoading ? 'Getting AI help...' : 'AI Suggest Instructions'}
                  </Button>
                </div>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleChange('instructions', e.target.value)}
                  placeholder="Patient instructions for taking medication..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {aiSuggestion && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 mb-1">AI Suggestion:</p>
                        <p className="text-sm text-blue-700">{aiSuggestion}</p>
                      </div>
                      <div className="ml-3 flex space-x-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={applyAiSuggestion}
                          className="text-xs"
                        >
                          Apply
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setAiSuggestion(null)}
                          className="text-xs text-gray-500"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indication
                </label>
                <textarea
                  value={formData.indication}
                  onChange={(e) => handleChange('indication', e.target.value)}
                  placeholder="Reason for prescription..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Prescription'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

export default CreatePrescriptionPage