'use client'

import React, { useState } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
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
    <AuthLayout>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as AuthTab)}
        />

        {/* Form Content */}
        <div className="pt-2">
          {activeTab === 'signin' && (
            <SignInForm onForgotPassword={handleForgotPassword} />
          )}
          
          {activeTab === 'signup' && (
            <SignUpForm />
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
