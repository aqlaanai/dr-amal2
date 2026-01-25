/**
 * Edit Clinical Note
 * STEP 8: Clinical Frontend MVP
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { ApiClient } from '@/lib/api-client'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface ClinicalNote {
  id: string
  patientId: string
  providerId: string
  sessionId?: string
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  status: 'draft' | 'finalized'
  createdAt: string
  updatedAt: string
}

interface NoteFormData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

function EditNotePage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string

  const [note, setNote] = useState<ClinicalNote | null>(null)
  const [formData, setFormData] = useState<NoteFormData>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNote()
  }, [noteId])

  const fetchNote = async () => {
    try {
      setLoading(true)
      const response = await ApiClient.get<ClinicalNote>(`/api/notes/${noteId}`)
      setNote(response)
      if (response.status === 'draft') {
        setFormData({
          subjective: response.subjective || '',
          objective: response.objective || '',
          assessment: response.assessment || '',
          plan: response.plan || '',
        })
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load note')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!note || note.status !== 'draft') return

    try {
      setSaving(true)
      setError(null)

      await ApiClient.patch(`/api/notes/${noteId}`, {
        subjective: formData.subjective || undefined,
        objective: formData.objective || undefined,
        assessment: formData.assessment || undefined,
        plan: formData.plan || undefined,
      })

      router.push(`/notes/${noteId}`)
    } catch (err: any) {
      setError(err.error || 'Failed to update note')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof NoteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['provider', 'admin']}>
        <AppShell>
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading note...</div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (error || !note) {
    return (
      <ProtectedRoute requiredRoles={['provider', 'admin']}>
        <AppShell>
          <div className="max-w-4xl mx-auto p-8">
            <Alert type="danger" message={error || 'Note not found'} />
            <div className="mt-4">
              <Button onClick={() => router.back()}>Go Back</Button>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (note.status !== 'draft') {
    return (
      <ProtectedRoute requiredRoles={['provider', 'admin']}>
        <AppShell>
          <div className="max-w-4xl mx-auto p-8">
            <Alert
              type="warning"
              message="This note has been finalized and cannot be edited."
            />
            <div className="mt-4">
              <Button onClick={() => router.push(`/notes/${noteId}`)}>
                View Note
              </Button>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['provider', 'admin']}>
      <AppShell>
        <PageHeader
          title={`Edit Clinical Note - ${note.patientId}`}
          subtitle="Update the clinical documentation"
        />

        <div className="max-w-4xl mx-auto p-8">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert type="danger" message={error} />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjective (Patient's complaint)
                </label>
                <textarea
                  value={formData.subjective}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('subjective', e.target.value)}
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
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('objective', e.target.value)}
                  placeholder="Vital signs, physical exam findings..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment (Diagnosis)
                </label>
                <textarea
                  value={formData.assessment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('assessment', e.target.value)}
                  placeholder="Clinical assessment and diagnosis..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan (Treatment)
                </label>
                <textarea
                  value={formData.plan}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('plan', e.target.value)}
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
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

export default EditNotePage