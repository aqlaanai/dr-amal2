'use client'

import React from 'react'

interface Appointment {
  id: string
  patientId: string
  patientName: string
  scheduledAt: string
  reason: string
  status: string
  notes?: string
}

interface AppointmentListProps {
  appointments: Appointment[]
  loading?: boolean
}

export const AppointmentList: React.FC<AppointmentListProps> = ({ appointments, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Loading appointments...</p>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No appointments scheduled yet</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Patient</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Reason</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {appointments.map(appointment => (
            <tr key={appointment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">{appointment.patientName}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{formatDate(appointment.scheduledAt)}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{formatTime(appointment.scheduledAt)}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{appointment.reason}</td>
              <td className="px-6 py-4 text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {appointment.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
