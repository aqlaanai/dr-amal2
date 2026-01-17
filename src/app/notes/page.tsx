/**
 * Clinical Notes Page
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

interface ClinicalNote {
  noteId: string
  patientId: string
  patientName: string
  status: 'draft' | 'ai_assisted_draft' | 'finalized' | 'archived'
  aiAssisted: boolean
  createdAt: string
  updatedAt: string
  finalizedAt: string | null
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
}

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
  const [notes, setNotes] = useState<ClinicalNote[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<NoteFormData>({
    patientId: '',
    sessionId: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [finalizingId, setFinalizingId] = useState<string | null>(null)

  // Fetch notes list
  useEffect(() => {
    async function fetchNotes() {
      try {
        setLoading(true)
        const response = await ApiClient.get<{ notes: ClinicalNote[] }>('/api/notes?limit=50')
        setNotes(response.notes || [])
        setError(null)
      } catch (err: any) {
        setError(err.error || 'Failed to load clinical notes')
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.patientId) {
      setFormError('Patient ID is required')
      return
    }

    try {
      setFormLoading(true)
      setFormError(null)
      
      const newNote = await ApiClient.post<ClinicalNote>('/api/notes', {
        patientId: formData.patientId,
        sessionId: formData.sessionId || undefined,
        subjective: formData.subjective || undefined,
        objective: formData.objective || undefined,
        assessment: formData.assessment || undefined,
        plan: formData.plan || undefined,
      })
      
      setSuccess(true)
      setNotes([newNote, ...notes])
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
      setFormError(err.error || 'Failed to create clinical note')
    } finally {
      setFormLoading(false)
    }
  }

  const handleFinalize = async (noteId: string) => {
    try {
      setFinalizingId(noteId)
      await ApiClient.post(`/api/notes/${noteId}/finalize`)
      // Update the note in the list
      setNotes(notes.map(n => 
        n.noteId === noteId 
          ? { ...n, status: 'finalized' as const, finalizedAt: new Date().toISOString() }
          : n
      ))
    } catch (err: any) {
      setFormError(err.error || 'Failed to finalize note')
    } finally {
      setFinalizingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
      case 'ai_assisted_draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'finalized':
        return 'bg-green-100 text-green-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
                  <h2 className="text-lg font-semibold mb-6">Create Clinical Note (Draft)</h2>

                  {formError && (
                    <Alert type="danger" message={formError} className="mb-4" />
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
                      <Button type="submit" disabled={formLoading}>
                        {formLoading ? 'Creating...' : 'Create Draft Note'}
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

              {/* Notes List */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {notes.length === 0 ? (
                  <div className="p-12 text-center">
                    <NotesIcon />
                    <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Create Clinical Note</h3>
                    <p className="text-gray-500 mb-6">
                      Document patient visits using SOAP format
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      New Note
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
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {notes.map((note) => (
                          <tr key={note.noteId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {note.patientName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(note.status)}`}>
                                {note.status === 'ai_assisted_draft' ? 'AI Draft' : note.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                              {note.status === 'draft' || note.status === 'ai_assisted_draft' ? (
                                <>
                                  <button
                                    onClick={() => router.push(`/notes/${note.noteId}`)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    View/Edit
                                  </button>
                                  <button
                                    onClick={() => handleFinalize(note.noteId)}
                                    disabled={finalizingId === note.noteId}
                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                  >
                                    {finalizingId === note.noteId ? 'Finalizing...' : 'Finalize'}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => router.push(`/notes/${note.noteId}`)}
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

const NotesIcon = () => (
  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
