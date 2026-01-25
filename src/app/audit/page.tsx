'use client'

import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/states/LoadingState'
import { ErrorState } from '@/components/states/ErrorState'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ApiClient } from '@/lib/api-client'

interface AuditLog {
  logId: string
  actor: string
  actorName: string
  action: string
  entity: string
  entityId: string
  timestamp: string
  details?: string
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit] = useState(100)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        setLoading(true)
        const response = await ApiClient.get<{ logs: AuditLog[] }>(
          `/api/audit?limit=${limit}&offset=${offset}`
        )
        setLogs(response.logs || [])
        setError(null)
      } catch (err: any) {
        setError(err.error || 'Failed to load audit logs')
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLogs()
  }, [limit, offset])

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800'
      case 'updated':
        return 'bg-blue-100 text-blue-800'
      case 'finalized':
      case 'issued':
        return 'bg-purple-100 text-purple-800'
      case 'deleted':
        return 'bg-red-100 text-red-800'
      case 'viewed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <AppShell>
        <PageHeader
          title="Audit Logs"
          subtitle="System activity and compliance tracking"
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
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {logs.length === 0 ? (
                <div className="p-12 text-center">
                  <AuditIcon />
                  <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No audit logs</h3>
                  <p className="text-gray-500">
                    Activity logs will appear here for compliance and security monitoring.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.logId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.actorName}
                            <div className="text-xs text-gray-500">{log.actor}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="capitalize">{log.entity}</div>
                            <div className="text-xs text-gray-500 font-mono">{log.entityId.substring(0, 8)}...</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && logs.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Showing {offset + 1} - {offset + logs.length}
                  </span>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={logs.length < limit}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

const AuditIcon = () => (
  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
