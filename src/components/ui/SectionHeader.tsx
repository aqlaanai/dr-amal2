import React from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  action,
}) => {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-clinical-text-primary">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-clinical-text-secondary mt-1">
            {description}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium text-clinical-blue-600 hover:text-clinical-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
