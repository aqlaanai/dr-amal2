'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

export type UserRole = 'provider' | 'admin' | 'parent'

interface RoleContextType {
  role: UserRole
  setRole: (role: UserRole) => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

interface RoleProviderProps {
  children: ReactNode
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth()
  // Sync role with authenticated user's role
  const [role, setRole] = useState<UserRole>(
    (user?.role as UserRole) || 'provider'
  )

  // Update role when user changes
  useEffect(() => {
    if (user?.role) {
      setRole(user.role as UserRole)
    }
  }, [user])

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}
