'use client'

import { useRole, UserRole } from '@/contexts/RoleContext'

export const useRoleAccess = (allowedRoles: UserRole[]) => {
  const { role } = useRole()
  
  const hasAccess = allowedRoles.includes(role)
  const isReadOnly = role === 'admin' && allowedRoles.includes('provider')
  
  return { hasAccess, isReadOnly, role }
}
