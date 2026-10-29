'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Search,
  Bell,
  Sun,
  Moon,
  Building2,
  FlaskConical,
  User,
  ChevronDown,
  Check,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { CommandPalette } from './CommandPalette'
import { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

export function Topbar({ onToggleMobileMenu }: { onToggleMobileMenu?: () => void }) {
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, role, switchRole, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Real-time storage sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'smart_hostel_complaints_v2' ||
        e.key === 'smart_hostel_warden_grievances_v2'
      ) {
        queryClient.invalidateQueries({ queryKey: ['topbar-complaints'] })
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient])

  const { data: serverComplaints = [] } = useQuery({
    queryKey: ['topbar-complaints'],
    queryFn: () => api.getComplaints(),
    refetchInterval: 1000,
  })

  // Real-time active alerts (scoped so student only sees their own urgent alerts)
  const activeAlerts = serverComplaints.filter((c) => {
    const isUrgent =
      (c.priority === 'urgent' || c.priority === 'high') &&
      c.status !== 'resolved' &&
      c.status !== 'student_approved'
    if (!isUrgent) return false

    if (role === 'student') {
      const currentStudentId = user?.id || 'usr-student-1'
      return (
        c.studentId === currentStudentId ||
        (user?.roomNumber && c.roomNumber === user?.roomNumber)
      )
    }

    return true
  })

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0B1020]/95 backdrop-blur px-4 sm:px-6">
        {/* Left: Breadcrumbs matching screenshot */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB] text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="hover:text-blue-600 transition-colors">HostelOS</span>
              <span className="text-slate-400 font-normal">›</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {pathname.startsWith('/student')
                  ? 'Student Resident Portal'
                  : pathname.startsWith('/warden')
                  ? 'Warden Operations'
                  : 'Management Console'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="hidden sm:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              onClick={() => setIsCommandOpen(true)}
              readOnly
              placeholder="Search student, bed 302-B, room, fee invc..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 pl-8 pr-4 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-3">
          {/* Quick Portal Tabs */}
          <div className="hidden xl:flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-xs font-semibold">
            <button
              onClick={() => switchRole('admin')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all',
                pathname.startsWith('/admin') || pathname === '/'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              Admin Console
            </button>
            <button
              onClick={() => switchRole('warden')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all',
                pathname.startsWith('/warden')
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              Warden
            </button>
            <button
              onClick={() => switchRole('student')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all',
                pathname.startsWith('/student')
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              Student Portal
            </button>
          </div>

          {/* DEMO MODE: LOCAL MOCK STATE Pill */}
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="hidden lg:flex items-center gap-1.5 rounded-lg border border-blue-200/80 dark:border-blue-900/70 bg-blue-50/90 dark:bg-blue-950/40 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
          >
            <FlaskConical className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>DEMO MODE: LOCAL MOCK STATE</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Bell className="h-4 w-4" />
              {activeAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white dark:border-slate-900 animate-pulse" />
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xl z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 font-bold">
                  <span>Notifications</span>
                  {activeAlerts.length > 0 ? (
                    <span className="text-[10px] text-red-500 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded">
                      {activeAlerts.length} Urgent Alert{activeAlerts.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal">
                      0 unread
                    </span>
                  )}
                </div>
                <div className="py-2 space-y-2">
                  {activeAlerts.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 dark:text-slate-500">
                      <Bell className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                      <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">No notifications right now</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">All clear across your hostel portal</p>
                    </div>
                  ) : (
                    activeAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="p-2 rounded-lg bg-red-50/50 dark:bg-red-950/20 text-slate-700 dark:text-slate-300">
                        <p className="font-semibold text-red-600 dark:text-red-400">#{alert.id} {alert.title}</p>
                        <p className="text-[11px] text-slate-500">{alert.blockName} • Room {alert.roomNumber}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {!mounted ? (
              <span className="h-4 w-4 block" />
            ) : theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-1 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.name || 'User'}
                className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user?.name || 'Sarah Jenkins'}
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium leading-none">
                  {user?.role === 'student'
                    ? `Room ${user?.roomNumber || 'A-204'} (${user?.bedNumber || 'Bed 1'})`
                    : user?.role === 'warden'
                    ? 'Resident Warden'
                    : 'Chief Administrator'}
                </span>
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 ml-1">
                <User className="h-3.5 w-3.5" />
              </div>
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl z-50">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                  <span className="mt-1 inline-block rounded bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-300">
                    {user?.role === 'student'
                      ? 'Student Resident'
                      : user?.role === 'warden'
                      ? 'Resident Warden'
                      : 'Chief Administrator'}
                  </span>
                </div>

                <div className="py-2 space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase text-slate-400">
                    Switch Active Persona
                  </p>
                  {(['admin', 'warden', 'student'] as Role[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r)
                        setIsUserMenuOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize',
                        (r === 'student' && pathname.startsWith('/student')) ||
                          (r === 'warden' && pathname.startsWith('/warden')) ||
                          (r === 'admin' && !pathname.startsWith('/student') && !pathname.startsWith('/warden'))
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      )}
                    >
                      <span>
                        {r === 'admin'
                          ? 'Chief Administrator'
                          : r === 'warden'
                          ? 'Resident Warden'
                          : 'Student (Aarav Patel)'}
                      </span>
                      {((r === 'student' && pathname.startsWith('/student')) ||
                        (r === 'warden' && pathname.startsWith('/warden')) ||
                        (r === 'admin' && !pathname.startsWith('/student') && !pathname.startsWith('/warden'))) && (
                        <Check className="h-3.5 w-3.5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      logout()
                      setIsUserMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </>
  )
}
