import React from 'react'
import { Button } from '@/components/ui/Button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  primaryAction,
}) => {
  return (
    <div className="bg-white border-b border-clinical-border px-8 py-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-clinical-text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-clinical-text-secondary mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {primaryAction && (
          <Button variant="primary" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}
