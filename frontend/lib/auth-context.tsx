'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Role, User } from './types'
import { DEMO_USERS } from './mock-data'

interface AuthContextType {
  user: User | null
  role: Role
  isAuthenticated: boolean
  isLoading: boolean
  login: (role: Role, email?: string, password?: string) => Promise<void>
  switchRole: (role: Role, redirect?: boolean) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'hostelos_user_role'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const initialRole: Role = pathname?.startsWith('/student')
    ? 'student'
    : pathname?.startsWith('/warden')
    ? 'warden'
    : 'admin'

  const [role, setRole] = useState<Role>(initialRole)
  const [user, setUser] = useState<User | null>(DEMO_USERS[initialRole] || DEMO_USERS.admin)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      let activeRole: Role = 'admin'
      if (pathname.startsWith('/student')) {
        activeRole = 'student'
      } else if (pathname.startsWith('/warden')) {
        activeRole = 'warden'
      } else if (pathname.startsWith('/admin')) {
        activeRole = 'admin'
      } else {
        const savedRole = localStorage.getItem(STORAGE_KEY) as Role | null
        if (savedRole && DEMO_USERS[savedRole]) {
          activeRole = savedRole
        }
      }
      setRole(activeRole)
      setUser(DEMO_USERS[activeRole])
      localStorage.setItem(STORAGE_KEY, activeRole)
    } catch {
      // localStorage may fail in some environments
    } finally {
      setIsLoading(false)
    }
  }, [pathname])

  const login = async (selectedRole: Role, _email?: string, _password?: string) => {
    setIsLoading(true)
    const newUser = DEMO_USERS[selectedRole]
    setRole(selectedRole)
    setUser(newUser)
    try {
      localStorage.setItem(STORAGE_KEY, selectedRole)
    } catch {}
    setIsLoading(false)
    window.location.href = `/${selectedRole}`
  }

  const switchRole = useCallback(
    (newRole: Role, redirect: boolean = true) => {
      const newUser = DEMO_USERS[newRole]
      setRole(newRole)
      setUser(newUser)
      try {
        localStorage.setItem(STORAGE_KEY, newRole)
      } catch {}
      if (redirect) {
        window.location.href = `/${newRole}`
      }
    },
    []
  )

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Route protection wrapper for role-based routes.
 * In demo mode, renders children directly without blocking or state deadlock loops.
 */
export function ProtectedRoute({
  allowedRole,
  children,
}: {
  allowedRole: Role
  children: React.ReactNode
}) {
  return <>{children}</>
}
