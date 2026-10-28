'use client'

import React from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  AlertCircle,
  Bell,
  CreditCard,
  UserCheck,
  Building,
  Users,
  BedDouble,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const pathname = usePathname()
  const { role } = useAuth()

  const tabsByRole: Record<
    Role,
    { label: string; href: string; icon: React.ElementType }[]
  > = {
    student: [
      { label: 'Home', href: '/student', icon: LayoutDashboard },
      { label: 'Complaints', href: '/student/complaints', icon: AlertCircle },
      { label: 'Notices', href: '/student/notices', icon: Bell },
      { label: 'Fees', href: '/student/fees', icon: CreditCard },
      { label: 'Profile', href: '/student/profile', icon: UserCheck },
    ],
    warden: [
      { label: 'Triage', href: '/warden', icon: LayoutDashboard },
      { label: 'Students', href: '/warden/students', icon: Users },
      { label: 'Rooms', href: '/warden/rooms', icon: BedDouble },
      { label: 'Complaints', href: '/warden/complaints', icon: AlertCircle },
      { label: 'Roll Call', href: '/warden/attendance', icon: UserCheck },
    ],
    admin: [
      { label: 'Control', href: '/admin', icon: LayoutDashboard },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Occupancy', href: '/admin/occupancy', icon: Building },
      { label: 'Treasury', href: '/admin/fees', icon: CreditCard },
      { label: 'Reports', href: '/admin/reports', icon: LayoutDashboard },
    ],
  }

  const activeRole: Role = pathname.startsWith('/student')
    ? 'student'
    : pathname.startsWith('/warden')
    ? 'warden'
    : pathname.startsWith('/admin')
    ? 'admin'
    : role

  const tabs = tabsByRole[activeRole] || tabsByRole.student

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border/80 bg-background/95 backdrop-blur-xl px-2 md:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        const Icon = tab.icon

        return (
          <NextLink
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
                isActive && 'bg-primary/10 text-primary'
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="truncate max-w-[64px]">{tab.label}</span>
          </NextLink>
        )
      })}
    </div>
  )
}
