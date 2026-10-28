import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  AlertCircle,
  Calendar,
  Utensils,
  Bell,
  Bot,
  User,
  Building,
  DoorOpen,
  Users,
  Settings,
  Shield,
  FileText,
  Moon,
  Sun,
  X,
} from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { useTheme } from '@/app/ThemeContext'
import { cn } from '@/lib/utils/cn'

interface CommandItem {
  id: string
  title: string
  category: 'Navigation' | 'Actions' | 'Roles' | 'Preferences'
  icon: React.ReactNode
  perform: () => void
  roleRequired?: 'student' | 'warden' | 'admin'
}

export const CommandPalette: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { user, activeRole, hasRole, switchRole } = useAuth()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const items: CommandItem[] = [
    // Current role navigation
    ...(activeRole === 'student'
      ? [
          {
            id: 'stu-dash',
            title: 'Student Dashboard',
            category: 'Navigation' as const,
            icon: <LayoutDashboard className="w-4 h-4" />,
            perform: () => navigate('/student/dashboard'),
          },
          {
            id: 'stu-room',
            title: 'My Room & Roommates',
            category: 'Navigation' as const,
            icon: <DoorOpen className="w-4 h-4" />,
            perform: () => navigate('/student/room'),
          },
          {
            id: 'stu-comp',
            title: 'My Complaints',
            category: 'Navigation' as const,
            icon: <AlertCircle className="w-4 h-4" />,
            perform: () => navigate('/student/complaints'),
          },
          {
            id: 'stu-raise',
            title: 'Raise New Complaint',
            category: 'Actions' as const,
            icon: <AlertCircle className="w-4 h-4" />,
            perform: () => navigate('/student/raise-complaint'),
          },
          {
            id: 'stu-leave',
            title: 'Leave / Outpass Requests',
            category: 'Navigation' as const,
            icon: <Calendar className="w-4 h-4" />,
            perform: () => navigate('/student/leave'),
          },
          {
            id: 'stu-mess',
            title: 'Mess Menu & Feedback',
            category: 'Navigation' as const,
            icon: <Utensils className="w-4 h-4" />,
            perform: () => navigate('/student/mess'),
          },
          {
            id: 'stu-ai',
            title: 'AI Hostel Assistant (Ask AI)',
            category: 'Actions' as const,
            icon: <Bot className="w-4 h-4" />,
            perform: () => navigate('/student/assistant'),
          },
        ]
      : []),

    ...(activeRole === 'warden'
      ? [
          {
            id: 'war-dash',
            title: 'Warden Dashboard',
            category: 'Navigation' as const,
            icon: <LayoutDashboard className="w-4 h-4" />,
            perform: () => navigate('/warden/dashboard'),
          },
          {
            id: 'war-comp',
            title: 'Complaints Triage',
            category: 'Navigation' as const,
            icon: <AlertCircle className="w-4 h-4" />,
            perform: () => navigate('/warden/complaints'),
          },
          {
            id: 'war-rooms',
            title: 'Room Occupancy Grid',
            category: 'Navigation' as const,
            icon: <Building className="w-4 h-4" />,
            perform: () => navigate('/warden/rooms'),
          },
          {
            id: 'war-leave',
            title: 'Review Leave Requests',
            category: 'Navigation' as const,
            icon: <Calendar className="w-4 h-4" />,
            perform: () => navigate('/warden/leave'),
          },
          {
            id: 'war-students',
            title: 'Students Directory',
            category: 'Navigation' as const,
            icon: <Users className="w-4 h-4" />,
            perform: () => navigate('/warden/students'),
          },
          {
            id: 'war-rep',
            title: 'Warden Reports & Exports',
            category: 'Navigation' as const,
            icon: <FileText className="w-4 h-4" />,
            perform: () => navigate('/warden/reports'),
          },
        ]
      : []),

    ...(activeRole === 'admin'
      ? [
          {
            id: 'adm-dash',
            title: 'Admin Central Dashboard',
            category: 'Navigation' as const,
            icon: <LayoutDashboard className="w-4 h-4" />,
            perform: () => navigate('/admin/dashboard'),
          },
          {
            id: 'adm-analytics',
            title: 'Hostel Analytics & Insights',
            category: 'Navigation' as const,
            icon: <Shield className="w-4 h-4" />,
            perform: () => navigate('/admin/analytics'),
          },
          {
            id: 'adm-hostels',
            title: 'Hostels & Blocks Management',
            category: 'Navigation' as const,
            icon: <Building className="w-4 h-4" />,
            perform: () => navigate('/admin/hostels'),
          },
          {
            id: 'adm-users',
            title: 'Users & Roles Management',
            category: 'Navigation' as const,
            icon: <Users className="w-4 h-4" />,
            perform: () => navigate('/admin/users'),
          },
          {
            id: 'adm-settings',
            title: 'System & Hostel Settings',
            category: 'Navigation' as const,
            icon: <Settings className="w-4 h-4" />,
            perform: () => navigate('/admin/settings'),
          },
        ]
      : []),

    // Role Switchers
    ...(hasRole('student')
      ? [
          {
            id: 'role-stu',
            title: 'Switch to Student View',
            category: 'Roles' as const,
            icon: <User className="w-4 h-4" />,
            perform: () => {
              switchRole('student')
              navigate('/student/dashboard')
            },
          },
        ]
      : []),
    ...(hasRole('warden')
      ? [
          {
            id: 'role-war',
            title: 'Switch to Warden View',
            category: 'Roles' as const,
            icon: <Shield className="w-4 h-4" />,
            perform: () => {
              switchRole('warden')
              navigate('/warden/dashboard')
            },
          },
        ]
      : []),
    ...(hasRole('admin')
      ? [
          {
            id: 'role-adm',
            title: 'Switch to Admin View',
            category: 'Roles' as const,
            icon: <Building className="w-4 h-4" />,
            perform: () => {
              switchRole('admin')
              navigate('/admin/dashboard')
            },
          },
        ]
      : []),

    // Preferences
    {
      id: 'pref-theme',
      title: `Toggle Theme (Current: ${theme})`,
      category: 'Preferences',
      icon: theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      perform: toggleTheme,
    },
    {
      id: 'pref-notifs',
      title: 'View Notifications',
      category: 'Preferences',
      icon: <Bell className="w-4 h-4" />,
      perform: () => navigate(`/${activeRole}/notifications`),
    },
  ]

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4"
    >
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-slide-up dark:border-slate-800 dark:bg-slate-900">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, page, or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-4 text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.perform()
                  onClose()
                }}
                className="flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <span>Active Role: <strong className="capitalize text-indigo-600 dark:text-indigo-400">{activeRole}</strong> ({user?.name})</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  )
}
