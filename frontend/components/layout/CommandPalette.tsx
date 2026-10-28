'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Search,
  LayoutDashboard,
  AlertCircle,
  Bell,
  CreditCard,
  UserCheck,
  Building,
  Users,
  Settings,
  Sun,
  Moon,
  ArrowRight,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Role } from '@/lib/types'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { role, switchRole, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onClose() // toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const navigateTo = (path: string) => {
    router.push(path)
    onClose()
  }

  const items = [
    // Navigation based on roles
    {
      group: 'Student Navigation',
      items: [
        { label: 'Student Dashboard', path: '/student', icon: LayoutDashboard },
        { label: 'My Complaints & Tracking', path: '/student/complaints', icon: AlertCircle },
        { label: 'Hostel Notices & Events', path: '/student/notices', icon: Bell },
        { label: 'Fee Dues & Online Payment', path: '/student/fees', icon: CreditCard },
        { label: 'Student Profile & Room Info', path: '/student/profile', icon: UserCheck },
      ],
    },
    {
      group: 'Warden Navigation',
      items: [
        { label: 'Warden Triage Dashboard', path: '/warden', icon: LayoutDashboard },
        { label: 'Students Directory & Roster', path: '/warden/students', icon: Users },
        { label: 'Room Allocation Floor Map', path: '/warden/rooms', icon: Building },
        { label: 'Complaints Kanban Board', path: '/warden/complaints', icon: AlertCircle },
        { label: 'Daily Attendance Roll-Call', path: '/warden/attendance', icon: UserCheck },
        { label: 'Broadcast Official Notice', path: '/warden/notices', icon: Bell },
      ],
    },
    {
      group: 'Admin Navigation',
      items: [
        { label: 'Admin Command Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'User & Staff Management', path: '/admin/users', icon: Users },
        { label: 'Live Occupancy Analytics', path: '/admin/occupancy', icon: Building },
        { label: 'Financial Audit & Revenue', path: '/admin/fees', icon: CreditCard },
        { label: 'Hostel System Settings', path: '/admin/settings', icon: Settings },
      ],
    },
  ]

  const actions = [
    {
      label: 'Switch Persona: Student (Aarav Patel)',
      action: () => {
        switchRole('student')
        onClose()
      },
      icon: Sparkles,
      color: 'text-indigo-400',
    },
    {
      label: 'Switch Persona: Warden (Prof. Rajesh Sharma)',
      action: () => {
        switchRole('warden')
        onClose()
      },
      icon: Sparkles,
      color: 'text-saffron-400',
    },
    {
      label: 'Switch Persona: Admin (Dr. Vikram Malhotra)',
      action: () => {
        switchRole('admin')
        onClose()
      },
      icon: Sparkles,
      color: 'text-teal-400',
    },
    {
      label: `Switch Theme to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      action: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
        onClose()
      },
      icon: theme === 'dark' ? Sun : Moon,
      color: 'text-amber-400',
    },
    {
      label: 'Sign Out of HostelOS',
      action: () => {
        logout()
        onClose()
      },
      icon: LogOut,
      color: 'text-rose-400',
    },
  ]

  const filteredGroups = items
    .map((grp) => ({
      ...grp,
      items: grp.items.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((grp) => grp.items.length > 0)

  const filteredActions = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl rounded-2xl border border-border/80 bg-popover shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page... (ESC to close)"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Scrollable list */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {/* Actions Section */}
          {filteredActions.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </p>
              <div className="space-y-1">
                {filteredActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.action}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-foreground hover:bg-muted/60 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <action.icon className={`h-4 w-4 ${action.color || 'text-muted-foreground'}`} />
                      <span>{action.label}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation groups */}
          {filteredGroups.map((grp, gIdx) => (
            <div key={gIdx}>
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {grp.group}
              </p>
              <div className="space-y-1">
                {grp.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigateTo(item.path)}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-foreground hover:bg-muted/60 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {item.path}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && filteredActions.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands found for "{query}".
            </div>
          )}
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  )
}
