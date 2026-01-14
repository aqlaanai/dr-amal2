'use client'

import React from 'react'
import { useRole, UserRole } from '@/contexts/RoleContext'

export const RoleSwitcher: React.FC = () => {
  const { role, setRole } = useRole()

  const roles: { value: UserRole; label: string }[] = [
    { value: 'provider', label: 'Healthcare Provider' },
    { value: 'admin', label: 'Admin' },
    { value: 'parent', label: 'Parent / Caregiver' },
  ]

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-clinical-border p-4 z-50">
      <div className="text-xs font-medium text-clinical-text-muted uppercase tracking-wide mb-3">
        Development: Role Switcher
      </div>
      <div className="flex gap-2">
        {roles.map((r) => (
          <button
            key={r.value}
            onClick={() => setRole(r.value)}
            className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              role === r.value
                ? 'bg-clinical-blue text-white'
                : 'bg-clinical-bg-secondary text-clinical-text-secondary hover:bg-clinical-bg-tertiary'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}
