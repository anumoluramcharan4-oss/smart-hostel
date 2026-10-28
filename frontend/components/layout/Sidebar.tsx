'use client'

import React, { useEffect } from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Users,
  BedDouble,
  Ticket,
  Megaphone,
  CreditCard,
  BarChart3,
  Sliders,
  ChevronDown,
  Building2,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  AlertCircle,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Role } from '@/lib/types'

export function Sidebar() {
  const pathname = usePathname()
  const { role, switchRole } = useAuth()
  const queryClient = useQueryClient()

  // Real-time storage sync for live complaint badge
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smart_hostel_complaints_v2') {
        queryClient.invalidateQueries({ queryKey: ['sidebar-complaints'] })
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient])

  // Live complaints count query for accurate dynamic badge
  const { data: complaints = [] } = useQuery({
    queryKey: ['sidebar-complaints'],
    queryFn: () => api.getComplaints(),
    refetchInterval: 1000,
  })

  // Exact live count of unresolved complaints (excludes resolved & student approved)
  const activeComplaintsCount = complaints.filter(
    (c) => c.status !== 'resolved' && c.status !== 'student_approved'
  ).length

  const complaintsBadge = activeComplaintsCount > 0 ? `${activeComplaintsCount} New` : undefined

  const isStudent = pathname.startsWith('/student')
  const isWarden = pathname.startsWith('/warden')
  const isAdmin = !isStudent && !isWarden

  const currentScopeValue = isStudent
    ? 'Student Resident Portal'
    : isWarden
    ? 'Resident Warden (Block A & B)'
    : 'Administrator (All Dorms)'

  // Navigation definition based on active portal
  const adminNavItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      activePattern: ['/admin', '/'],
    },
    {
      label: 'Students',
      href: '/warden/students',
      icon: Users,
      badge: '1.2k',
      badgeColor: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      label: 'Rooms & Allocation',
      href: '/warden/rooms',
      icon: BedDouble,
      badge: '94%',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    },
    {
      label: 'Complaints & Tickets',
      href: '/warden/complaints',
      icon: Ticket,
      badge: complaintsBadge,
      badgeColor: complaintsBadge
        ? 'bg-red-50 text-red-600 border border-red-200/80 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900'
        : undefined,
    },
    {
      label: 'Notice Board',
      href: '/warden/notices',
      icon: Megaphone,
    },
    {
      label: 'Visitor & Security',
      href: '/admin/visitors',
      icon: ShieldCheck,
      badge: 'Live Pass',
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
    },
    {
      label: 'Fee Management',
      href: '/admin/fees',
      icon: CreditCard,
      badge: '3 Pending',
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
    },
    {
      label: 'Reports & Analytics',
      href: '/admin/reports',
      icon: BarChart3,
    },
    {
      label: 'System Settings',
      href: '/admin/settings',
      icon: Sliders,
    },
  ]

  const wardenNavItems = [
    {
      label: 'Triage Dashboard',
      href: '/warden',
      icon: LayoutDashboard,
    },
    {
      label: 'Student Residents',
      href: '/warden/students',
      icon: Users,
      badge: '1.2k',
      badgeColor: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      label: 'Rooms & Allocation',
      href: '/warden/rooms',
      icon: BedDouble,
      badge: '94%',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    },
    {
      label: 'Maintenance Kanban',
      href: '/warden/complaints',
      icon: Ticket,
      badge: complaintsBadge,
      badgeColor: complaintsBadge
        ? 'bg-red-50 text-red-600 border border-red-200/80 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900'
        : undefined,
    },
    {
      label: 'Roll-Call Attendance',
      href: '/warden/attendance',
      icon: CheckCircle2,
      badge: 'Live',
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
    {
      label: 'Visitor Approvals',
      href: '/warden/visitors',
      icon: ShieldCheck,
      badge: 'Queue',
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300',
    },
    {
      label: 'Publish Notice',
      href: '/warden/notices',
      icon: Megaphone,
    },
  ]

  const studentNavItems = [
    {
      label: 'My Room & Quarters',
      href: '/student',
      icon: LayoutDashboard,
    },
    {
      label: 'Maintenance Tickets',
      href: '/student/complaints',
      icon: AlertCircle,
      badge: '1 Open',
      badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300',
    },
    {
      label: 'Hostel Bulletins',
      href: '/student/notices',
      icon: Megaphone,
      badge: '3 New',
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300',
    },
    {
      label: 'Semester Fees & Dues',
      href: '/student/fees',
      icon: CreditCard,
      badge: '₹4.5k Due',
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300',
    },
    {
      label: 'Resident Profile',
      href: '/student/profile',
      icon: UserCheck,
    },
  ]

  const navItems = isStudent ? studentNavItems : isWarden ? wardenNavItems : adminNavItems

  return (
    <aside className="w-[240px] shrink-0 hidden md:flex flex-col justify-between border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0B1020] min-h-screen select-none z-30">
      <div>
        {/* Brand Header */}
        <NextLink href="/" className="p-4 flex items-center gap-2.5 hover:opacity-95 transition-opacity">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-md shadow-blue-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Hostel<span className="text-[#2563EB]">OS</span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              SMART CAMPUS
            </span>
          </div>
        </NextLink>

        {/* Role Scope Selector */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
              ROLE SCOPE
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          </div>
          <div className="relative">
            <select
              value={currentScopeValue}
              onChange={(e) => {
                if (e.target.value.includes('Student')) switchRole('student')
                else if (e.target.value.includes('Warden')) switchRole('warden')
                else switchRole('admin')
              }}
              className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Administrator (All Dorms)">Administrator (All Dorms)</option>
              <option value="Resident Warden (Block A & B)">Resident Warden (Block A & B)</option>
              <option value="Student Resident Portal">Student Resident Portal</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 1-Click Role Switcher Pills */}
        <div className="px-4 pt-1 pb-2">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => switchRole('admin')}
              className={cn(
                'py-1 rounded text-center transition-all',
                isAdmin
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => switchRole('warden')}
              className={cn(
                'py-1 rounded text-center transition-all',
                isWarden
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Warden
            </button>
            <button
              type="button"
              onClick={() => switchRole('student')}
              className={cn(
                'py-1 rounded text-center transition-all',
                isStudent
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Student
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="mt-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin' || pathname === '/'
                : item.href === '/student'
                ? pathname === '/student'
                : item.href === '/warden'
                ? pathname === '/warden'
                : pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-[#2563EB] text-white font-semibold shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/70 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NextLink>
            )
          })}
        </nav>
      </div>

      {/* Sidebar Footer: FastAPI Cloud Core Healthy */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              FastAPI Cloud Core
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            Healthy
          </span>
        </div>
      </div>
    </aside>
  )
}
