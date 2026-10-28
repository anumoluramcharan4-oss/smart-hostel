import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  DoorOpen,
  AlertCircle,
  PlusCircle,
  Calendar,
  Utensils,
  Megaphone,
  Bell,
  Bot,
  Users,
  Building,
  Shield,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils/cn'

export interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  title: string
  to: string
  icon: React.ReactNode
  badge?: string | number
  badgeVariant?: 'success' | 'warning' | 'pending' | 'critical'
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeRole } = useAuth()

  const studentNavItems: NavItem[] = [
    { title: 'Dashboard', to: '/student/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { title: 'My Profile', to: '/student/profile', icon: <User className="w-4 h-4" /> },
    { title: 'My Room', to: '/student/room', icon: <DoorOpen className="w-4 h-4" /> },
    { title: 'Complaints', to: '/student/complaints', icon: <AlertCircle className="w-4 h-4" />, badge: 'Active', badgeVariant: 'warning' },
    { title: 'Raise Complaint', to: '/student/raise-complaint', icon: <PlusCircle className="w-4 h-4" /> },
    { title: 'Leave / Outpass', to: '/student/leave', icon: <Calendar className="w-4 h-4" /> },
    { title: 'Mess Feedback', to: '/student/mess', icon: <Utensils className="w-4 h-4" /> },
    { title: 'Announcements', to: '/student/announcements', icon: <Megaphone className="w-4 h-4" /> },
    { title: 'Notifications', to: '/student/notifications', icon: <Bell className="w-4 h-4" /> },
    { title: 'AI Assistant', to: '/student/assistant', icon: <Bot className="w-4 h-4" />, badge: 'AI', badgeVariant: 'pending' },
  ]

  const wardenNavItems: NavItem[] = [
    { title: 'Dashboard', to: '/warden/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { title: 'Students', to: '/warden/students', icon: <Users className="w-4 h-4" /> },
    { title: 'Rooms Grid', to: '/warden/rooms', icon: <DoorOpen className="w-4 h-4" /> },
    { title: 'Complaints', to: '/warden/complaints', icon: <AlertCircle className="w-4 h-4" />, badge: 'Triage', badgeVariant: 'critical' },
    { title: 'Leave Requests', to: '/warden/leave', icon: <Calendar className="w-4 h-4" />, badge: '2 New', badgeVariant: 'pending' },
    { title: 'Mess Feedback', to: '/warden/mess', icon: <Utensils className="w-4 h-4" /> },
    { title: 'Announcements', to: '/warden/announcements', icon: <Megaphone className="w-4 h-4" /> },
    { title: 'Reports & Export', to: '/warden/reports', icon: <FileText className="w-4 h-4" /> },
    { title: 'Notifications', to: '/warden/notifications', icon: <Bell className="w-4 h-4" /> },
  ]

  const adminNavItems: NavItem[] = [
    { title: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { title: 'Students', to: '/admin/students', icon: <Users className="w-4 h-4" /> },
    { title: 'Wardens', to: '/admin/wardens', icon: <Shield className="w-4 h-4" /> },
    { title: 'Users & Roles', to: '/admin/users', icon: <User className="w-4 h-4" /> },
    { title: 'Hostels & Blocks', to: '/admin/hostels', icon: <Building className="w-4 h-4" /> },
    { title: 'Rooms Directory', to: '/admin/rooms', icon: <DoorOpen className="w-4 h-4" /> },
    { title: 'Complaints SLA', to: '/admin/complaints', icon: <AlertCircle className="w-4 h-4" /> },
    { title: 'Leave Logs', to: '/admin/leave', icon: <Calendar className="w-4 h-4" /> },
    { title: 'Mess Management', to: '/admin/mess', icon: <Utensils className="w-4 h-4" /> },
    { title: 'Announcements', to: '/admin/announcements', icon: <Megaphone className="w-4 h-4" /> },
    { title: 'Analytics', to: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { title: 'Reports Engine', to: '/admin/reports', icon: <FileText className="w-4 h-4" /> },
    { title: 'Settings', to: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  ]

  const currentNavItems =
    activeRole === 'admin'
      ? adminNavItems
      : activeRole === 'warden'
      ? wardenNavItems
      : studentNavItems

  const roleLabels = {
    student: 'Student Workspace',
    warden: 'Warden Console',
    admin: 'Admin Operations',
  }

  const roleColors = {
    student: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/50',
    warden: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/50',
    admin: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/50',
  }

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Smart Hostel
              </span>
              <span className="block text-[10px] font-medium text-indigo-600 dark:text-indigo-400 leading-none">
                AI Platform
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Workspace Indicator */}
        <div className="px-5 pt-4 pb-2">
          <div
            className={cn(
              'flex items-center justify-between px-3 py-1.5 rounded-lg border text-[11px] font-semibold uppercase tracking-wider',
              roleColors[activeRole]
            )}
          >
            <span>{roleLabels[activeRole]}</span>
            <span className="flex h-2 w-2 rounded-full bg-current animate-pulse-subtle" />
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {currentNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 1024) onClose()
              }}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <span className={cn(isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500')}>
                      {item.icon}
                    </span>
                    <span>{item.title}</span>
                  </div>

                  {item.badge && (
                    <Badge
                      variant={isActive ? 'neutral' : item.badgeVariant || 'pending'}
                      size="sm"
                      className={isActive ? 'bg-white/20 text-white border-transparent' : undefined}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom AI Status Box */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-950 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Gemini AI Engine
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Auto-triage & assistance active with deterministic fallback.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
