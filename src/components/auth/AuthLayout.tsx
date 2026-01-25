'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'

interface AuthLayoutProps {
  children: React.ReactNode
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-blue-50 via-white to-clinical-green-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-clinical-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-clinical-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header with icon */}
        <div className="text-center mb-10">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-clinical-blue-500 to-clinical-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-clinical-text-primary mb-3 tracking-tight">
            Dr Amal
          </h1>
          <p className="text-base text-clinical-text-secondary font-medium mb-2">
            Pediatric Clinical Portal
          </p>
          <p className="text-sm text-clinical-text-muted">
            Secure access to comprehensive clinical care systems
          </p>
        </div>

        {/* Card with enhanced styling */}
        <Card className="p-8 shadow-xl border border-clinical-border-light bg-white/95 backdrop-blur">
          {children}
        </Card>

        {/* Footer with additional info */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-clinical-text-muted">
            Dr Amal Clinical OS v2.0
          </p>
          <p className="text-xs text-clinical-text-muted">
            © {new Date().getFullYear()} All rights reserved
          </p>
          <div className="flex justify-center gap-4 mt-4 text-xs">
            <a href="#" className="text-clinical-blue-600 hover:text-clinical-blue-700 transition-colors">
              Privacy Policy
            </a>
            <span className="text-clinical-border-light">•</span>
            <a href="#" className="text-clinical-blue-600 hover:text-clinical-blue-700 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
