'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/contexts/AuthContext'

interface StartSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { patientId: string; scheduledAt: string }) => Promise<void>
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [formData, setFormData] = useState({
    patientId: '',
    scheduledAt: '',
    scheduledTime: '09:00'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch patients when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchPatients()
    }
  }, [isOpen, user])

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPatients(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.patientId) newErrors.patientId = 'Please select a patient'
    if (!formData.scheduledAt) newErrors.scheduledAt = 'Please select a date'
    if (!formData.scheduledTime) newErrors.scheduledTime = 'Please select a time'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Combine date and time
    const scheduledDateTime = `${formData.scheduledAt}T${formData.scheduledTime}:00`

    setLoading(true)
    try {
      await onSubmit({
        patientId: formData.patientId,
        scheduledAt: scheduledDateTime
      })

      // Reset form and close modal
      setFormData({
        patientId: '',
        scheduledAt: '',
        scheduledTime: '09:00'
      })
      onClose()
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      patientId: '',
      scheduledAt: '',
      scheduledTime: '09:00'
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-clinical-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-clinical-text">Start New Session</h3>
            <button
              onClick={handleClose}
              className="text-clinical-text-secondary hover:text-clinical-text"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-clinical-text mb-2">
              Select Patient
            </label>
            <Select
              value={formData.patientId}
              onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
              error={errors.patientId}
            >
              <option value="">Choose a patient...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} ({new Date(patient.dateOfBirth).toLocaleDateString()})
                </option>
              ))}
            </Select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-clinical-text mb-2">
              Session Date
            </label>
            <input
              type="date"
              value={formData.scheduledAt}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 rounded-lg border bg-white text-clinical-text-primary placeholder:text-clinical-text-muted focus:outline-none focus:ring-2 focus:ring-clinical-blue-500 focus:border-transparent transition-all duration-200 ${errors.scheduledAt ? 'border-clinical-danger' : 'border-clinical-border'}`}
            />
            {errors.scheduledAt && (
              <p className="mt-1.5 text-sm text-clinical-danger">{errors.scheduledAt}</p>
            )}
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-clinical-text mb-2">
              Session Time
            </label>
            <Select
              value={formData.scheduledTime}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
              error={errors.scheduledTime}
            >
              <option value="09:00">9:00 AM</option>
              <option value="09:30">9:30 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="10:30">10:30 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="11:30">11:30 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="12:30">12:30 PM</option>
              <option value="13:00">1:00 PM</option>
              <option value="13:30">1:30 PM</option>
              <option value="14:00">2:00 PM</option>
              <option value="14:30">2:30 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="15:30">3:30 PM</option>
              <option value="16:00">4:00 PM</option>
              <option value="16:30">4:30 PM</option>
              <option value="17:00">5:00 PM</option>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Start Session'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}