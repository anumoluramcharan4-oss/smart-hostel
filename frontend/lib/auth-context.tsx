'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from './supabase/client'
import { Role, User } from './types'

interface AuthContextType {
  user: User | null
  role: Role
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; role: Role; error?: string }>
  quickLogin: (targetRole: Role) => Promise<void>
  switchRole: (role: Role, redirect?: boolean) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [role, setRole] = useState<Role>('admin')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getDemoUserForRole = useCallback(async (targetRole: Role): Promise<User> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', targetRole)
        .limit(1)
        .maybeSingle()

      if (profile) {
        return {
          id: profile.id,
          name: profile.full_name || (targetRole === 'admin' ? 'Chief Administrator' : targetRole === 'warden' ? 'Prof. Rajesh K. Sharma' : 'Aarav Patel'),
          email: profile.email || `${targetRole}@hostelos.edu`,
          role: targetRole,
          avatar: profile.avatar_url || (targetRole === 'admin' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : targetRole === 'warden' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'),
          phone: profile.phone || '+91 98201 44521',
          roomNumber: profile.room_number || (targetRole === 'student' ? 'A-204' : undefined),
          blockName: profile.block_name || (targetRole === 'student' ? 'Block A' : undefined),
          bedNumber: profile.bed_number || (targetRole === 'student' ? 'Bed 1' : undefined),
          rollNo: profile.roll_no || (targetRole === 'student' ? '21BCS042' : undefined),
        }
      }
    } catch (err) {
      console.warn('Failed to load profile for demo role:', err)
    }

    if (targetRole === 'admin') {
      return {
        id: 'usr-admin-1',
        name: 'Chief Administrator',
        email: 'admin@hostelos.edu',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        phone: '+91 98100 11223',
      }
    } else if (targetRole === 'warden') {
      return {
        id: 'usr-warden-1',
        name: 'Prof. Rajesh K. Sharma',
        email: 'warden@hostelos.edu',
        role: 'warden',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        phone: '+91 98111 22334',
        designation: 'Senior Resident Warden',
      }
    } else {
      return {
        id: 'usr-student-1',
        name: 'Aarav Patel',
        email: 'aarav.patel@hostelos.edu',
        role: 'student',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        phone: '+91 98201 44521',
        roomNumber: 'A-204',
        blockName: 'Block A',
        bedNumber: 'Bed 1',
        rollNo: '21BCS042',
      }
    }
  }, [supabase])

  const fetchProfileAndSetUser = useCallback(async (authUser: any) => {
    if (!authUser) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      // Read user's role and details from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (error) {
        console.warn('Error fetching profile from profiles table:', error.message)
      }

      const assignedRole: Role =
        (profile?.role as Role) ||
        (authUser.user_metadata?.role as Role) ||
        'student'

      const mappedUser: User = {
        id: authUser.id,
        name:
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split('@')[0] ||
          'Hostel Resident',
        email: authUser.email || profile?.email || '',
        role: assignedRole,
        avatar:
          authUser.user_metadata?.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        phone: profile?.phone || '',
      }

      setUser(mappedUser)
      setRole(assignedRole)
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    // Check active session on mount
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (mounted) {
        if (authUser) {
          await fetchProfileAndSetUser(authUser)
        } else {
          let cookieRole: Role | undefined
          if (typeof document !== 'undefined') {
            const match = document.cookie
              .split('; ')
              .find((row) => row.startsWith('hostelos_demo_role='))
            if (match) {
              cookieRole = match.split('=')[1] as Role
            }
          }

          if (cookieRole && ['admin', 'warden', 'student'].includes(cookieRole)) {
            const demoUser = await getDemoUserForRole(cookieRole)
            setUser(demoUser)
            setRole(cookieRole)
            setIsLoading(false)
          } else {
            setUser(null)
            setIsLoading(false)
          }
        }
      }
    })

    // Subscribe to auth state updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          await fetchProfileAndSetUser(session.user)
        } else {
          let cookieRole: Role | undefined
          if (typeof document !== 'undefined') {
            const match = document.cookie
              .split('; ')
              .find((row) => row.startsWith('hostelos_demo_role='))
            if (match) {
              cookieRole = match.split('=')[1] as Role
            }
          }
          if (cookieRole && ['admin', 'warden', 'student'].includes(cookieRole)) {
            const demoUser = await getDemoUserForRole(cookieRole)
            setUser(demoUser)
            setRole(cookieRole)
            setIsLoading(false)
          } else {
            setUser(null)
            setIsLoading(false)
          }
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfileAndSetUser, getDemoUserForRole])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setIsLoading(false)
        return { success: false, role: 'student' as Role, error: error.message }
      }

      if (!data.user) {
        setIsLoading(false)
        return { success: false, role: 'student' as Role, error: 'User not returned' }
      }

      // Fetch profile from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

      const userRole: Role =
        (profile?.role as Role) ||
        (data.user.user_metadata?.role as Role) ||
        'student'

      const mappedUser: User = {
        id: data.user.id,
        name:
          profile?.full_name ||
          data.user.user_metadata?.full_name ||
          data.user.email?.split('@')[0] ||
          'User',
        email: data.user.email || profile?.email || '',
        role: userRole,
        avatar:
          data.user.user_metadata?.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        phone: profile?.phone || '',
      }

      setUser(mappedUser)
      setRole(userRole)
      setIsLoading(false)

      return { success: true, role: userRole }
    } catch (err: any) {
      setIsLoading(false)
      return { success: false, role: 'student' as Role, error: err.message || 'Login failed' }
    }
  }

  const quickLogin = useCallback(async (targetRole: Role) => {
    setIsLoading(true)
    if (typeof document !== 'undefined') {
      document.cookie = `hostelos_demo_role=${targetRole}; path=/; max-age=604800; SameSite=Lax`
    }
    const demoUser = await getDemoUserForRole(targetRole)
    setUser(demoUser)
    setRole(targetRole)
    setIsLoading(false)
    router.push(`/${targetRole}`)
  }, [getDemoUserForRole, router])

  const switchRole = useCallback(async (newRole: Role) => {
    setIsLoading(true)
    if (typeof document !== 'undefined') {
      document.cookie = `hostelos_demo_role=${newRole}; path=/; max-age=604800; SameSite=Lax`
    }
    const demoUser = await getDemoUserForRole(newRole)
    setUser(demoUser)
    setRole(newRole)
    setIsLoading(false)
    router.push(`/${newRole}`)
  }, [getDemoUserForRole, router])

  const logout = async () => {
    setIsLoading(true)
    if (typeof document !== 'undefined') {
      document.cookie = 'hostelos_demo_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Error during signOut:', err)
    } finally {
      setUser(null)
      setIsLoading(false)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickLogin,
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

export function ProtectedRoute({
  children,
}: {
  allowedRole?: Role
  children: React.ReactNode
}) {
  return <>{children}</>
}
