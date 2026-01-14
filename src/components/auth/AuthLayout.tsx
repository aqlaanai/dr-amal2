'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'

interface AuthLayoutProps {
  children: React.ReactNode
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-clinical-text-primary mb-2">
            Pediatric Clinical Portal
          </h1>
          <p className="text-sm text-clinical-text-secondary">
            Secure access to clinical care systems
          </p>
        </div>

        {/* Card */}
        <Card className="p-8">
          {children}
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-clinical-text-muted">
            Dr Amal Clinical OS v2.0 © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
