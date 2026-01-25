import React from 'react'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'

interface PageHeaderProps {
  title: string
  subtitle?: string
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  }
  breadcrumb?: Array<{
    label: string
    href?: string
  }>
  showBackButton?: boolean
  backHref?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  breadcrumb,
  showBackButton = false,
  backHref = '/',
}) => {
  return (
    <div className="bg-white border-b border-clinical-border px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link
                href="/"
                className="text-clinical-text-secondary hover:text-clinical-text-primary transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            {breadcrumb.map((item, index) => (
              <li key={index} className="flex items-center">
                <span className="text-clinical-text-secondary mx-2">/</span>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-clinical-text-secondary hover:text-clinical-text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-clinical-text-primary font-medium">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1 flex items-center gap-4">
          {/* Back Button */}
          {showBackButton && (
            <Link
              href={backHref}
              className="flex-shrink-0 p-2 hover:bg-clinical-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-clinical-primary"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-clinical-text-secondary" />
            </Link>
          )}

          {/* Title and Subtitle */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-clinical-text-primary truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base text-clinical-text-secondary mt-1 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'outline'}
              onClick={secondaryAction.onClick}
              className="flex items-center gap-2"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              variant={primaryAction.variant || 'primary'}
              onClick={primaryAction.onClick}
              className="flex items-center gap-2"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
