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

interface AISuggestion {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface AIResponse {
  suggestion: AISuggestion
  confidence: 'low' | 'medium' | 'high'
  refused: boolean
  reasoning: string
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
  
  // AI Suggestion State
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Fetch notes list
  useEffect(() => {
    async function fetchNotes() {
      try {
        setLoading(true)
        const response = await ApiClient.get<any>('/api/notes?limit=50&offset=0')
        setNotes(response.data || [])
        setError(null)
      } catch (err: any) {
        console.error('Failed to load notes:', err)
        setError(err?.message || err?.error || 'Failed to load clinical notes')
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

  // AI Suggestion Handler - USER-TRIGGERED ONLY
  const handleGetAISuggestion = async () => {
    if (!formData.sessionId) {
      setAiError('Session ID is required for AI suggestions')
      return
    }

    try {
      setAiLoading(true)
      setAiError(null)
      setAiResponse(null)
      
      const response = await ApiClient.post<AIResponse>('/api/ai/generate-note', {
        sessionId: formData.sessionId
      })
      
      setAiResponse(response)
      setShowAiModal(true)
    } catch (err: any) {
      // Handle specific errors
      if (err.statusCode === 429) {
        setAiError('Too many AI requests. Please wait before trying again.')
      } else if (err.statusCode === 403) {
        setAiError('You do not have permission to use AI suggestions.')
      } else {
        setAiError(err.error || 'Failed to get AI suggestion')
      }
    } finally {
      setAiLoading(false)
    }
  }

  // Apply AI Suggestion - MANUAL ONLY, USER-TRIGGERED
  const handleApplyAISuggestion = () => {
    if (aiResponse && aiResponse.suggestion) {
      setFormData({
        ...formData,
        subjective: aiResponse.suggestion.subjective || formData.subjective,
        objective: aiResponse.suggestion.objective || formData.objective,
        assessment: aiResponse.suggestion.assessment || formData.assessment,
        plan: aiResponse.suggestion.plan || formData.plan,
      })
      setShowAiModal(false)
      setAiResponse(null)
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
    <ProtectedRoute requiredRoles={['provider', 'admin']}>
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

                  {aiError && (
                    <Alert type="danger" message={aiError} className="mb-4" />
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

                    {/* AI Suggestion Button */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">AI Assistance</h4>
                          <p className="text-xs text-blue-700 mt-1">
                            Get an AI-generated SOAP note suggestion based on this session
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={handleGetAISuggestion}
                          disabled={!formData.sessionId || aiLoading}
                        >
                          {aiLoading ? 'Generating...' : '🤖 Get AI Suggestion'}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        ⚠️ AI suggestions require manual review before use
                      </p>
                    </div>

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

        {/* AI Suggestion Modal */}
        {showAiModal && aiResponse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">AI-Generated SOAP Note Suggestion</h3>
                    <p className="text-sm text-gray-500 mt-1">Review carefully before applying</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAiModal(false)
                      setAiError(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Confidence Badge */}
                <div className="mt-3">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    aiResponse.confidence === 'high' ? 'bg-green-100 text-green-800' :
                    aiResponse.confidence === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {aiResponse.confidence.toUpperCase()} CONFIDENCE
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {aiResponse.refused ? (
                  <Alert 
                    type="warning" 
                    message={`AI declined to generate suggestion: ${aiResponse.reasoning}`}
                  />
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subjective (S)
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {aiResponse.suggestion.subjective}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Objective (O)
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {aiResponse.suggestion.objective}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assessment (A)
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {aiResponse.suggestion.assessment}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plan (P)
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {aiResponse.suggestion.plan}
                      </div>
                    </div>

                    {aiResponse.reasoning && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-xs font-medium text-blue-900 mb-1">AI Reasoning:</p>
                        <p className="text-sm text-blue-700">{aiResponse.reasoning}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    ⚠️ AI-generated content. Clinical judgment required. Review and edit as needed.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowAiModal(false)
                        setAiError(null)
                      }}
                    >
                      Close
                    </Button>
                    {!aiResponse.refused && (
                      <Button
                        type="button"
                        onClick={handleApplyAISuggestion}
                      >
                        Apply to Form
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  )
}

const NotesIcon = () => (
  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
