/**
 * Create New Clinical Note
 * STEP 8: Clinical Frontend MVP
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { ApiClient } from '@/lib/api-client'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface NoteFormData {
  patientId: string
  sessionId: string
  subjective: string
  objective: string
  assessment: string
  plan: string
}

function CreateNotePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<NoteFormData>({
    patientId: '',
    sessionId: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAISuggestion = async () => {
    if (!formData.subjective && !formData.objective) {
      setError('Please enter subjective or objective information first')
      return
    }

    try {
      setAiLoading(true)
      setError(null)

      const response = await ApiClient.post('/api/ai/generate-note', {
        subjective: formData.subjective,
        objective: formData.objective,
        patientId: formData.patientId,
      }) as { suggestion: string }

      setAiSuggestion(response.suggestion)
    } catch (err: any) {
      setError(err.error || 'Failed to generate AI suggestion')
    } finally {
      setAiLoading(false)
    }
  }

  const applyAISuggestion = (field: keyof NoteFormData) => {
    if (aiSuggestion) {
      setFormData(prev => ({ ...prev, [field]: aiSuggestion }))
      setAiSuggestion(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.patientId) {
      setError('Patient ID is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await ApiClient.post('/api/notes', {
        patientId: formData.patientId,
        sessionId: formData.sessionId || undefined,
        subjective: formData.subjective || undefined,
        objective: formData.objective || undefined,
        assessment: formData.assessment || undefined,
        plan: formData.plan || undefined,
      }) as { id: string }

      // Redirect to the created note
      router.push(`/notes/${response.id}`)
    } catch (err: any) {
      setError(err.error || 'Failed to create clinical note')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof NoteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <ProtectedRoute requiredRoles={['provider', 'admin']}>
      <AppShell>
        <PageHeader
          title="Create Clinical Note"
          subtitle="Document patient visit using SOAP format"
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
                    label=""
                    type="text"
                    value={formData.patientId}
                    onChange={(e) => handleChange('patientId', e.target.value)}
                    placeholder="Enter patient ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session ID (Optional)
                  </label>
                  <Input
                    label=""
                    type="text"
                    value={formData.sessionId}
                    onChange={(e) => handleChange('sessionId', e.target.value)}
                    placeholder="Enter session ID"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjective (Patient's complaint)
                </label>
                <textarea
                  value={formData.subjective}
                  onChange={(e) => handleChange('subjective', e.target.value)}
                  placeholder="Patient's reported symptoms and history..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objective (Clinical findings)
                </label>
                <textarea
                  value={formData.objective}
                  onChange={(e) => handleChange('objective', e.target.value)}
                  placeholder="Vital signs, physical exam findings..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Assessment (Diagnosis)
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAISuggestion}
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Generating...' : '🤖 AI Suggest'}
                  </Button>
                </div>
                <textarea
                  value={formData.assessment}
                  onChange={(e) => handleChange('assessment', e.target.value)}
                  placeholder="Clinical assessment and diagnosis..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {aiSuggestion && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800 mb-2">AI Suggestion:</p>
                    <p className="text-sm text-blue-700 mb-2">{aiSuggestion}</p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => applyAISuggestion('assessment')}
                    >
                      Apply to Assessment
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan (Treatment)
                </label>
                <textarea
                  value={formData.plan}
                  onChange={(e) => handleChange('plan', e.target.value)}
                  placeholder="Treatment plan, medications, follow-up..."
                  rows={4}
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
                  {loading ? 'Creating...' : 'Create Note'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

export default CreateNotePage