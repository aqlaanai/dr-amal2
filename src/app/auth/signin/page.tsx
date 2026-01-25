'use client'

import React, { useState } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthHero } from '@/components/auth/AuthHero'
import { Tabs } from '@/components/ui/Tabs'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignUpForm } from '@/components/auth/SignUpForm'

type AuthTab = 'signin' | 'signup'

export default function SignInPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin')

  const tabs = [
    { id: 'signin', label: 'Sign In' },
    { id: 'signup', label: 'Sign Up' },
  ]

  const handleForgotPassword = () => {
    // In production, this would navigate to a password reset page
    alert('Password reset functionality would be implemented here.\n\nThis would typically send a reset link to the user\'s email.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-blue-50 via-white to-clinical-green-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-clinical-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-clinical-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>
      
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Hero Section */}
          <AuthHero />

          {/* Form Section */}
          <div className="w-full">
            <div className="max-w-md mx-auto lg:mx-0">
              {/* Header */}
              <div className="mb-10">
                <h1 className="text-4xl lg:text-3xl font-bold text-clinical-text-primary mb-3">
                  Welcome Back
                </h1>
                <p className="text-clinical-text-secondary">
                  Sign in to your account to access clinical tools and patient data
                </p>
              </div>

              {/* Tabs */}
              <div className="mb-8 border-b border-clinical-border-light">
                <Tabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onChange={(tabId) => setActiveTab(tabId as AuthTab)}
                />
              </div>

              {/* Form Content */}
              <div>
                {activeTab === 'signin' && (
                  <SignInForm onForgotPassword={handleForgotPassword} />
                )}
                
                {activeTab === 'signup' && (
                  <SignUpForm />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-clinical-border-light text-center text-xs text-clinical-text-muted">
          <p>© {new Date().getFullYear()} Dr Amal Clinical OS. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
