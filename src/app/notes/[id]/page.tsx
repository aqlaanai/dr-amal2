/**
 * Clinical Note Detail Page
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
  finalizedAt?: string
}

function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string

  const [note, setNote] = useState<ClinicalNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState(false)

  useEffect(() => {
    fetchNote()
  }, [noteId])

  const fetchNote = async () => {
    try {
      setLoading(true)
      const response = await ApiClient.get<ClinicalNote>(`/api/notes/${noteId}`)
      setNote(response)
    } catch (err: any) {
      setError(err.error || 'Failed to load note')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async () => {
    if (!note || note.status !== 'draft') return

    try {
      setFinalizing(true)
      await ApiClient.post(`/api/notes/${noteId}/finalize`, {})
      // Refresh the note
      await fetchNote()
    } catch (err: any) {
      setError(err.error || 'Failed to finalize note')
    } finally {
      setFinalizing(false)
    }
  }

  const handleEdit = () => {
    router.push(`/notes/${noteId}/edit`)
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole={['provider', 'admin']}>
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
      <ProtectedRoute requiredRole={['provider', 'admin']}>
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

  return (
    <ProtectedRoute requiredRole={['provider', 'admin']}>
      <AppShell>
        <PageHeader
          title={`Clinical Note - ${note.patientId}`}
          subtitle={`Created ${new Date(note.createdAt).toLocaleDateString()}`}
        />

        <div className="max-w-4xl mx-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <Badge variant={note.status === 'finalized' ? 'success' : 'warning'}>
              {note.status.toUpperCase()}
            </Badge>

            <div className="space-x-2">
              {note.status === 'draft' && (
                <>
                  <Button variant="secondary" onClick={handleEdit}>
                    Edit
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleFinalize}
                    disabled={finalizing}
                  >
                    {finalizing ? 'Finalizing...' : 'Finalize Note'}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subjective</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {note.subjective || 'Not provided'}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Objective</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {note.objective || 'Not provided'}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assessment</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {note.assessment || 'Not provided'}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Plan</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {note.plan || 'Not provided'}
              </p>
            </Card>
          </div>

          <div className="mt-8 flex justify-end">
            <Button variant="secondary" onClick={() => router.back()}>
              Back to Notes
            </Button>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

export default NoteDetailPage