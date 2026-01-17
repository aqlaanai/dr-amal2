/**
 * Clinical Notes Page
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

interface NoteFormData {
  patientId: string
  sessionId: string
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export default function NotesPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<NoteFormData>({
    patientId: '',
    sessionId: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.patientId) {
      setError('Patient ID is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      await ApiClient.post('/api/notes', {
        patientId: formData.patientId,
        sessionId: formData.sessionId || undefined,
        subjective: formData.subjective || undefined,
        objective: formData.objective || undefined,
        assessment: formData.assessment || undefined,
        plan: formData.plan || undefined,
      })
      
      setSuccess(true)
      setFormData({
        patientId: '',
        sessionId: '',
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
      })
      
      setTimeout(() => {
        setSuccess(false)
        setShowForm(false)
      }, 2000)
    } catch (err: any) {
      setError(err.error || 'Failed to create clinical note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole={['provider', 'admin']}>
      <AppShell>
        <PageHeader
          title="Clinical Notes"
          subtitle="Patient visit notes and clinical documentation"
          primaryAction={{
            label: "New Note",
            onClick: () => router.push('/notes/new')
          }}
        />

        <div className="p-8">
          {!showForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                <NotesIcon />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Create Clinical Note</h3>
              <p className="text-gray-500 mb-6">
                Document patient visits using SOAP format
              </p>
              <Button onClick={() => setShowForm(true)}>
                New Note
              </Button>
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold mb-6">Create Clinical Note (Draft)</h2>

              {error && (
                <Alert type="danger" message={error} className="mb-4" />
              )}

              {success && (
                <Alert type="success" message="Clinical note created successfully!" className="mb-4" />
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
                  label="Session ID (optional)"
                  value={formData.sessionId}
                  onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                  placeholder="Enter session ID"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subjective (S)
                  </label>
                  <textarea
                    value={formData.subjective}
                    onChange={(e) => setFormData({ ...formData, subjective: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 min-h-[80px]"
                    placeholder="Patient's chief complaint and symptoms"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objective (O)
                  </label>
                  <textarea
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 min-h-[80px]"
                    placeholder="Clinical observations and findings"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assessment (A)
                  </label>
                  <textarea
                    value={formData.assessment}
                    onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 min-h-[80px]"
                    placeholder="Clinical diagnosis and impressions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan (P)
                  </label>
                  <textarea
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 min-h-[80px]"
                    placeholder="Treatment plan and next steps"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Draft Note'}
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

const NotesIcon = () => (
  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
