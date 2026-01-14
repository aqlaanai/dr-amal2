'use client'

import React, { ReactNode } from 'react'
import { RoleProvider } from '@/contexts/RoleContext'
import { RoleSwitcher } from '@/components/dev/RoleSwitcher'

interface ClientProvidersProps {
  children: ReactNode
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  return (
    <RoleProvider>
      {children}
      <RoleSwitcher />
    </RoleProvider>
  )
}
