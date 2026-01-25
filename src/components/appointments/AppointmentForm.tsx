'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ApiClient } from '@/lib/api-client'

interface AppointmentFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  patientId: string
  appointmentDate: string
  appointmentTime: string
  reason: string
  notes: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<FormData>({
    patientId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    notes: '',
  })

  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await ApiClient.get<any>('/api/patients', { limit: '100', offset: '0' })
        setPatients(response.data || [])
      } catch (err) {
        console.error('Failed to fetch patients:', err)
        setError('Failed to load patients')
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!formData.patientId || !formData.appointmentDate || !formData.appointmentTime || !formData.reason) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`).toISOString()

      await ApiClient.post('/api/appointments', {
        patientId: formData.patientId,
        scheduledAt: appointmentDateTime,
        reason: formData.reason,
        notes: formData.notes || undefined,
      })

      setSuccess(true)
      setFormData({
        patientId: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        notes: '',
      })

      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      console.error('Failed to create appointment:', err)
      const errorMsg = err?.message || 'Failed to create appointment'
      setError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-center text-gray-500">Loading patients...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Schedule New Appointment</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
          ✓ Appointment scheduled successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Patient *
          </label>
          <select
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a patient...</option>
            {patients.length === 0 ? (
              <option disabled>No patients available</option>
            ) : (
              patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))
            )}
          </select>
          {patients.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No patients found. Create a patient first.
            </p>
          )}
        </div>

        {/* Appointment Date */}
        <div>
          <Input
            type="date"
            name="appointmentDate"
            label="Appointment Date *"
            value={formData.appointmentDate}
            onChange={handleChange}
            required
          />
        </div>

        {/* Appointment Time */}
        <div>
          <Input
            type="time"
            name="appointmentTime"
            label="Appointment Time *"
            value={formData.appointmentTime}
            onChange={handleChange}
            required
          />
        </div>

        {/* Reason for Visit */}
        <div>
          <Input
            type="text"
            name="reason"
            label="Reason for Visit *"
            placeholder="e.g., Regular checkup, Follow-up, Urgent care"
            value={formData.reason}
            onChange={handleChange}
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            name="notes"
            placeholder="Any additional information for the appointment..."
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={submitting || patients.length === 0}
            className="flex-1"
          >
            {submitting ? 'Scheduling...' : 'Schedule Appointment'}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
