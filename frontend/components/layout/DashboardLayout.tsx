'use client'

import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { useAuth } from '@/lib/auth-context'
import { Role } from '@/lib/types'
import { X, Building } from 'lucide-react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const pathname = usePathname()
  const { logout } = useAuth()
  const activeRole: Role = pathname.startsWith('/student')
    ? 'student'
    : pathname.startsWith('/warden')
    ? 'warden'
    : 'admin'

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer (Tablet / Mobile) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-72 bg-card p-4 flex flex-col justify-between shadow-2xl animate-slide-up">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
                    <Building className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-foreground">HostelOS</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="py-4 space-y-2">
                <p className="px-2 text-[10px] font-bold uppercase text-muted-foreground">
                  Portal Navigation
                </p>
                {activeRole === 'student' && (
                  <>
                    <NextLink
                      href="/student"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Overview Dashboard
                    </NextLink>
                    <NextLink
                      href="/student/complaints"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Complaints Tracking
                    </NextLink>
                    <NextLink
                      href="/student/notices"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Notices & Events
                    </NextLink>
                    <NextLink
                      href="/student/fees"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Fee Payments
                    </NextLink>
                    <NextLink
                      href="/student/profile"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Profile & Room Info
                    </NextLink>
                  </>
                )}

                {activeRole === 'warden' && (
                  <>
                    <NextLink
                      href="/warden"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Triage Dashboard
                    </NextLink>
                    <NextLink
                      href="/warden/students"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Students Directory
                    </NextLink>
                    <NextLink
                      href="/warden/rooms"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Room Allocation Map
                    </NextLink>
                    <NextLink
                      href="/warden/complaints"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Complaints Kanban
                    </NextLink>
                    <NextLink
                      href="/warden/attendance"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Roll-Call Attendance
                    </NextLink>
                    <NextLink
                      href="/warden/notices"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Publish Notice
                    </NextLink>
                  </>
                )}

                {activeRole === 'admin' && (
                  <>
                    <NextLink
                      href="/admin"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Mission Control
                    </NextLink>
                    <NextLink
                      href="/admin/users"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      User Management
                    </NextLink>
                    <NextLink
                      href="/admin/occupancy"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Occupancy Metrics
                    </NextLink>
                    <NextLink
                      href="/admin/fees"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Fee Treasury
                    </NextLink>
                    <NextLink
                      href="/admin/reports"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Audit & Reports
                    </NextLink>
                    <NextLink
                      href="/admin/settings"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                    >
                      Hostel Settings
                    </NextLink>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={() => {
                  logout()
                  setMobileDrawerOpen(false)
                }}
                className="w-full py-2 text-center text-xs font-semibold text-rose-500 rounded-xl bg-rose-500/10"
              >
                Sign Out
              </button>
            </div>
          </div>
          <div
            className="flex-1"
            onClick={() => setMobileDrawerOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 pb-20 md:pb-8">
        <Topbar onToggleMobileMenu={() => setMobileDrawerOpen(true)} />

        <main className="flex-1 w-full max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileNav />
    </div>
  )
}
