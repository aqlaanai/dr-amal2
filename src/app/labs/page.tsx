'use client'

import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ApiClient } from '@/lib/api-client'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

interface LabResult {
  labId: string
  patientId: string
  patientName: string
  testName: string
  status: 'pending' | 'received' | 'reviewed'
  value: string | number
  unit: string
  abnormal: boolean
  orderedAt: string
  receivedAt: string | null
  reviewedAt: string | null
}

interface AIExplanation {
  summary: string
  normalRange: string
  significance: string
  recommendations: string[]
}

interface AIExplanationResponse {
  suggestion: AIExplanation
  confidence: 'low' | 'medium' | 'high'
  refused: boolean
  reasoning: string
}

export default function LabsPage() {
  const [labs, setLabs] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    patientId: '',
    testName: '',
    orderingProvider: '',
  })
  
  // AI explanation state
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<AIExplanationResponse | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [selectedLab, setSelectedLab] = useState<LabResult | null>(null)

  useEffect(() => {
    async function fetchLabs() {
      try {
        setLoading(true)
        const response = await ApiClient.get<any>('/api/lab-results?limit=50&offset=0')
        setLabs(response.data || [])
        setError(null)
      } catch (err: any) {
        console.error('Failed to load lab results:', err)
        setError(err?.message || err?.error || 'Failed to load lab results')
      } finally {
        setLoading(false)
      }
    }

    fetchLabs()
  }, [])

  const handleOrderTest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.patientId || !formData.testName) {
      setFormError('Patient ID and test name are required')
      return
    }

    try {
      setFormLoading(true)
      setFormError(null)
      
      // Create a new lab order
      const newLab = await ApiClient.post<LabResult>('/api/lab-results', {
        patientId: formData.patientId,
        testName: formData.testName,
        orderingProvider: formData.orderingProvider || undefined,
      })
      
      setLabs([newLab, ...labs])
      setFormData({
        patientId: '',
        testName: '',
        orderingProvider: '',
      })
      setShowForm(false)
    } catch (err: any) {
      setFormError(err.error || 'Failed to order lab test')
    } finally {
      setFormLoading(false)
    }
  }

  const handleGetAIExplanation = async (lab: LabResult) => {
    if (!lab.labId) {
      setAiError('Lab ID is required')
      return
    }

    setSelectedLab(lab)
    setAiLoading(true)
    setAiError(null)
    
    try {
      const response = await ApiClient.post<AIExplanationResponse>(
        '/api/ai/explain-lab',
        { labResultId: lab.labId }
      )

      if (response.refused) {
        setAiError(response.reasoning || 'AI declined to provide an explanation')
      } else {
        setAiResponse(response)
        setShowAiModal(true)
      }
    } catch (err: any) {
      if (err.status === 429) {
        setAiError('Too many AI requests. Please wait a moment and try again.')
      } else if (err.status === 403) {
        setAiError('You do not have permission to use AI features')
      } else {
        setAiError(err.error || 'Failed to get AI explanation')
      }
    } finally {
      setAiLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'received':
        return 'bg-blue-100 text-blue-800'
      case 'reviewed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAbnormalColor = (abnormal: boolean) => {
    return abnormal ? 'text-red-600 font-semibold' : 'text-gray-900'
  }

  return (
    <ProtectedRoute requiredRoles={['provider', 'admin']}>
      <AppShell>
        <PageHeader
          title="Lab Results"
          subtitle="Laboratory test orders and results"
          primaryAction={{
            label: '+ Order Test',
            onClick: () => setShowForm(!showForm),
          }}
        />

        <div className="p-8">
          {/* Order Lab Test Form */}
          {showForm && (
            <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Lab Test</h2>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {formError}
                </div>
              )}

              <form onSubmit={handleOrderTest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient ID *
                  </label>
                  <input
                    type="text"
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter patient ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={formData.testName}
                    onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Complete Blood Count (CBC)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordering Provider
                  </label>
                  <input
                    type="text"
                    value={formData.orderingProvider}
                    onChange={(e) => setFormData({ ...formData, orderingProvider: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter provider name (optional)"
                  />
                </div>

                <div className="md:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {formLoading ? 'Ordering...' : 'Order Lab Test'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading && <LoadingState />}

          {error && (
            <ErrorState
              message={error}
              retry={() => window.location.reload()}
            />
          )}

          {!loading && !error && (
            <>
              {aiError && (
                <Alert type="danger" message={aiError} className="mb-4" />
              )}
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {labs.length === 0 ? (
                  <div className="p-12 text-center">
                    <LabIcon />
                    <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No lab results</h3>
                    <p className="text-gray-500">
                      Order and review laboratory tests for your patients.
                    </p>
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
                            Test Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ordered
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {labs.map((lab) => (
                          <tr key={lab.labId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {lab.patientName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {lab.testName}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${getAbnormalColor(lab.abnormal)}`}>
                              {lab.value} {lab.unit}
                              {lab.abnormal && <span className="ml-2 text-xs">⚠️ Abnormal</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(lab.status)}`}>
                                {lab.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(lab.orderedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleGetAIExplanation(lab)}
                                disabled={aiLoading}
                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {aiLoading && selectedLab?.labId === lab.labId ? '🤖 Loading...' : '🤖 Explain Results'}
                              </button>
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

        {/* AI Explanation Modal */}
        {showAiModal && aiResponse && selectedLab && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">AI Lab Result Explanation</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedLab.testName} for {selectedLab.patientName}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAiModal(false)
                      setAiError(null)
                      setSelectedLab(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Result Value Display */}
                <div className="mt-4 bg-gray-50 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-600">Result: </span>
                      <span className={`text-lg font-semibold ${getAbnormalColor(selectedLab.abnormal)}`}>
                        {selectedLab.value} {selectedLab.unit}
                      </span>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      aiResponse.confidence === 'high' ? 'bg-green-100 text-green-800' :
                      aiResponse.confidence === 'medium' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {aiResponse.confidence.toUpperCase()} CONFIDENCE
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {aiResponse.refused ? (
                  <Alert 
                    type="warning" 
                    message={`AI declined to provide explanation: ${aiResponse.reasoning}`}
                  />
                ) : (
                  <>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
                      <p className="text-sm text-gray-700">{aiResponse.suggestion.summary}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Normal Range</h4>
                      <p className="text-sm text-gray-700">{aiResponse.suggestion.normalRange}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Clinical Significance</h4>
                      <p className="text-sm text-gray-700">{aiResponse.suggestion.significance}</p>
                    </div>

                    {aiResponse.suggestion.recommendations && aiResponse.suggestion.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {aiResponse.suggestion.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-gray-700">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

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
                    ⚠️ AI-generated educational content. Not medical advice. Clinical judgment required.
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAiModal(false)
                      setAiError(null)
                      setSelectedLab(null)
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  )
}

const LabIcon = () => (
  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)
