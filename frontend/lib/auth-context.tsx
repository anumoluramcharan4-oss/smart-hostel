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
  quickLogin: (targetRole: Role, studentId?: string) => Promise<void>
  switchRole: (role: Role, redirect?: boolean) => void
  switchStudent?: (studentId: string) => void
  demoProfiles?: any
  logout: () => Promise<void>
}

const DEFAULT_DEMO_USERS: Record<Role, User> = {
  admin: {
    id: 'usr-admin-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@hostelos.edu',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98765 43210',
  },
  warden: {
    id: 'usr-warden-1',
    name: 'Prof. Rajesh K. Sharma',
    email: 'rajesh.sharma@hostelos.edu',
    role: 'warden',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98111 22334',
    designation: 'Senior Resident Warden',
  },
  student: {
    id: 'usr-student-2',
    name: 'Kabir Sen',
    email: 'kabir.sen@hostelos.edu',
    role: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KabirSen&gender=male',
    phone: '+91 8773715057',
    roomNumber: 'A-101',
    blockName: 'Block A (Newton)',
    bedNumber: 'Bed 2',
    rollNo: '25BCS002',
    course: 'Computer Science & Engineering',
    year: 2,
  },
}

function setDemoCookie(targetRole: Role) {
  if (typeof document !== 'undefined') {
    document.cookie = `hostelos_demo_role=${targetRole}; path=/; max-age=2592000; SameSite=Lax`
  }
}

function clearDemoCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'hostelos_demo_role=; path=/; max-age=0'
    document.cookie = 'hostelos_demo_student_id=; path=/; max-age=0'
  }
}

function getStoredRole(): Role | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('hostelos_demo_role='))
  if (match) {
    const roleVal = match.split('=')[1] as Role
    if (['admin', 'warden', 'student'].includes(roleVal)) return roleVal
  }
  return null
}

function getStoredStudentId(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('hostelos_demo_student_id='))
  return match ? match.split('=')[1] : null
}

function setDemoStudentIdCookie(studentId: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `hostelos_demo_student_id=${studentId}; path=/; max-age=2592000; SameSite=Lax`
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [role, setRole] = useState<Role>('admin')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [demoProfiles, setDemoProfiles] = useState<any>(null)

  const resolveStudentUser = useCallback(
    (studentId?: string | null, profilesData?: any): User => {
      const targetId = studentId || getStoredStudentId() || 'usr-student-2'
      const data = profilesData || demoProfiles
      if (data?.students) {
        if (data.students.pending?.id === targetId) return data.students.pending
        if (data.students.partial?.id === targetId) return data.students.partial
        if (data.students.paid?.id === targetId) return data.students.paid
        if (data.defaultStudent?.id === targetId) return data.defaultStudent
      }
      return DEFAULT_DEMO_USERS.student
    },
    [demoProfiles]
  )

  const fetchProfileAndSetUser = useCallback(async (authUser: any) => {
    if (!authUser) {
      const stored = getStoredRole()
      if (stored) {
        if (stored === 'student') {
          setUser(resolveStudentUser())
        } else {
          setUser(demoProfiles?.[stored] || DEFAULT_DEMO_USERS[stored])
        }
        setRole(stored)
      } else {
        setUser(null)
      }
      setIsLoading(false)
      return
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

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
        roomNumber: profile?.room_number || '',
        blockName: profile?.block_name || 'Block A (Newton)',
        bedNumber: profile?.bed_number || '',
        rollNo: profile?.roll_no || '',
      }

      setDemoCookie(assignedRole)
      setUser(mappedUser)
      setRole(assignedRole)
    } catch {
      const stored = getStoredRole() || 'admin'
      if (stored === 'student') {
        setUser(resolveStudentUser())
      } else {
        setUser(demoProfiles?.[stored] || DEFAULT_DEMO_USERS[stored])
      }
      setRole(stored)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, resolveStudentUser, demoProfiles])

  // Fetch real demo profiles from database API on mount
  useEffect(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    fetch(`${API_BASE_URL}/api/profiles/demo`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDemoProfiles(data)
          const stored = getStoredRole()
          if (stored === 'student') {
            setUser(resolveStudentUser(null, data))
          } else if (stored && data[stored]) {
            setUser(data[stored])
          }
        }
      })
      .catch(() => {})
  }, [resolveStudentUser])

  useEffect(() => {
    let mounted = true

    // 1. Immediately hydrate from stored cookie for zero-lag offline navigation
    const initialRole = getStoredRole()
    if (initialRole) {
      if (initialRole === 'student') {
        setUser(resolveStudentUser())
      } else {
        setUser(DEFAULT_DEMO_USERS[initialRole])
      }
      setRole(initialRole)
      setIsLoading(false)
    }

    // 2. Validate with Supabase if online / available
    supabase.auth
      .getUser()
      .then(async ({ data: { user: authUser } }) => {
        if (mounted) {
          if (authUser) {
            await fetchProfileAndSetUser(authUser)
          } else if (!initialRole) {
            setUser(null)
            setIsLoading(false)
          }
        }
      })
      .catch(() => {
        if (mounted && !initialRole) {
          setUser(null)
          setIsLoading(false)
        }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          await fetchProfileAndSetUser(session.user)
        } else {
          const stored = getStoredRole()
          if (stored) {
            if (stored === 'student') {
              setUser(resolveStudentUser())
            } else {
              setUser(demoProfiles?.[stored] || DEFAULT_DEMO_USERS[stored])
            }
            setRole(stored)
          } else {
            setUser(null)
          }
          setIsLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfileAndSetUser, resolveStudentUser, demoProfiles])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // 1. Try Supabase sign in if configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (!error && data?.user) {
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
              name: profile?.full_name || data.user.email?.split('@')[0] || 'User',
              email: data.user.email || profile?.email || '',
              role: userRole,
              avatar: data.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              phone: profile?.phone || '',
            }

            setDemoCookie(userRole)
            setUser(mappedUser)
            setRole(userRole)
            setIsLoading(false)
            return { success: true, role: userRole }
          }
        } catch {
          // Supabase network error / offline: continue to offline login
        }
      }

      // 2. Offline credentials fallback
      let demoRole: Role = 'student'
      const lowerEmail = email.toLowerCase()
      if (lowerEmail.includes('admin') || password === 'admin123') {
        demoRole = 'admin'
      } else if (lowerEmail.includes('warden') || lowerEmail.includes('sharma')) {
        demoRole = 'warden'
      } else {
        demoRole = 'student'
      }

      setDemoCookie(demoRole)
      const demoUser =
        demoRole === 'student'
          ? resolveStudentUser()
          : demoProfiles?.[demoRole] || DEFAULT_DEMO_USERS[demoRole]
      setUser(demoUser)
      setRole(demoRole)
      setIsLoading(false)
      return { success: true, role: demoRole }
    } catch (err: any) {
      setIsLoading(false)
      return { success: false, role: 'student' as Role, error: err.message || 'Login failed' }
    }
  }

  const quickLogin = useCallback(
    async (targetRole: Role, studentId?: string) => {
      setIsLoading(true)
      setDemoCookie(targetRole)
      if (targetRole === 'student') {
        const activeStudentId = studentId || getStoredStudentId() || 'usr-student-2'
        setDemoStudentIdCookie(activeStudentId)
        setUser(resolveStudentUser(activeStudentId))
      } else {
        setUser(demoProfiles?.[targetRole] || DEFAULT_DEMO_USERS[targetRole])
      }
      setRole(targetRole)
      setIsLoading(false)
      router.push(`/${targetRole}`)
    },
    [router, demoProfiles, resolveStudentUser]
  )

  const switchRole = useCallback(
    (newRole: Role, redirect: boolean = true) => {
      setDemoCookie(newRole)
      if (newRole === 'student') {
        setUser(resolveStudentUser())
      } else {
        setUser(demoProfiles?.[newRole] || DEFAULT_DEMO_USERS[newRole])
      }
      setRole(newRole)
      if (redirect) {
        router.push(`/${newRole}`)
      }
    },
    [router, demoProfiles, resolveStudentUser]
  )

  const switchStudent = useCallback(
    (studentId: string) => {
      setDemoStudentIdCookie(studentId)
      setDemoCookie('student')
      setRole('student')
      setUser(resolveStudentUser(studentId))
    },
    [resolveStudentUser]
  )

  const logout = async () => {
    setIsLoading(true)
    clearDemoCookie()
    try {
      await supabase.auth.signOut().catch(() => {})
    } catch {
      // ignore
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
        switchStudent,
        demoProfiles,
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
