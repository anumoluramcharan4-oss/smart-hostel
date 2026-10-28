import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, Role } from '@/lib/types'
import { api } from '@/lib/api'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  activeRole: Role
  hasRole: (role: Role) => boolean
  switchRole: (newRole: Role) => Promise<void>
  login: (email: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check initial user from API
    api.getCurrentUser()
      .then((currUser) => {
        setUser(currUser)
      })
      .catch((err) => {
        console.error('Failed to load current user', err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const hasRole = (role: Role): boolean => {
    if (!user) return false
    return user.roles.includes(role)
  }

  const switchRole = async (newRole: Role) => {
    if (!user) throw new Error('Not authenticated')
    if (!user.roles.includes(newRole)) {
      throw new Error(`User does not have the '${newRole}' role`)
    }
    const updated = await api.switchRole(newRole)
    setUser(updated)
  }

  const login = async (email: string) => {
    setIsLoading(true)
    try {
      const loggedIn = await api.login(email)
      setUser(loggedIn)
      return loggedIn
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
  }

  const activeRole: Role = user?.activeRole || 'student'

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        activeRole,
        hasRole,
        switchRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
