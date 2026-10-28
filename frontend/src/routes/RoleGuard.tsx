import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/AuthContext'
import type { Role } from '@/lib/types'

export interface RoleGuardProps {
  requiredRole: Role
  children: React.ReactNode
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ requiredRole, children }) => {
  const { user, hasRole, activeRole, switchRole } = useAuth()
  const location = useLocation()

  useEffect(() => {
    // If user has the required role but activeRole is currently different, automatically switch it
    if (user && hasRole(requiredRole) && activeRole !== requiredRole) {
      switchRole(requiredRole).catch(console.error)
    }
  }, [user, requiredRole, activeRole, hasRole, switchRole])

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!hasRole(requiredRole)) {
    return <Navigate to="/forbidden" replace />
  }

  return <>{children}</>
}
