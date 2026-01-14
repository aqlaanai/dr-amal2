import React from 'react'
import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  change?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, change, icon }) => {
  return (
    <div className="bg-white rounded-card border border-clinical-border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-clinical-text-secondary mb-1">{label}</p>
          <p className="text-3xl font-semibold text-clinical-text-primary">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={clsx(
                  'text-xs font-medium',
                  change.trend === 'up' && 'text-clinical-success',
                  change.trend === 'down' && 'text-clinical-danger',
                  change.trend === 'neutral' && 'text-clinical-text-secondary'
                )}
              >
                {change.value}
              </span>
              <span className="text-xs text-clinical-text-muted">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-lg bg-clinical-blue-50 text-clinical-blue-600 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
