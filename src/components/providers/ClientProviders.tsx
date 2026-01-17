/**
 * Client Providers
 * Issue 1: Real Authentication - Updated to include AuthProvider
 */

'use client'

import React, { ReactNode } from 'react'
import { RoleProvider } from '@/contexts/RoleContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { RoleSwitcher } from '@/components/dev/RoleSwitcher'

interface ClientProvidersProps {
  children: ReactNode
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <RoleProvider>
        {children}
        <RoleSwitcher />
      </RoleProvider>
    </AuthProvider>
  )
}
