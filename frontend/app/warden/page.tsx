'use client'

import React, { useEffect } from 'react'
import NextLink from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ShieldAlert,
  AlertTriangle,
  Users,
  BedDouble,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Coffee,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { StatCard } from '@/components/common/StatCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate } from '@/lib/utils'

export default function WardenDashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Real-time Supabase subscription for complaints
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('warden-dash-complaints-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complaints' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['warden-complaints'] })
          queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  })

  const { data: complaints = [], isLoading: isLoadingComplaints } = useQuery({
    queryKey: ['warden-complaints'],
    queryFn: () => api.getComplaints(),
    refetchInterval: 1500,
  })

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.getBlocks(),
  })

  // Urgent triage items for the hero "Needs Attention" panel
  const urgentTickets = complaints.filter(
    (c) =>
      (String(c.priority).toLowerCase() === 'urgent' ||
        String(c.priority).toLowerCase() === 'critical') &&
      c.status !== 'resolved' &&
      c.status !== 'student_approved'
  )

  const pendingComplaintsCount = complaints.filter(
    (c) => c.status !== 'resolved' && c.status !== 'student_approved'
  ).length

  // Warden's Single Assigned Block (Prof. Rajesh K. Sharma - Block A Newton)
  const myBlock = blocks.find(
    (b) => b.code === 'BLK-A' || b.name.includes('Block A') || b.id === 'blk-a'
  ) || {
    id: 'blk-a',
    name: 'Block A (Newton)',
    code: 'BLK-A',
    floorsCount: 5,
    roomsCount: 30,
    capacity: 120,
    occupied: 120,
    wardenName: 'Prof. Rajesh K. Sharma',
  }

  return (
    <div className="space-y-6">
      {/* Hero: "Needs Attention" Operations Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#1A120B] via-card to-background border border-saffron-500/30 shadow-card-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron-500/15 border border-saffron-500/30 px-3 py-1 text-xs font-bold text-saffron-500">
                <Flame className="h-3.5 w-3.5" /> Warden Triage Center
              </span>
              <span className="text-xs font-bold text-slate-100 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                Duty Roster: Block A (Newton) Assigned In-charge
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Needs Attention ({urgentTickets.length} Critical Items)
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {urgentTickets.length} urgent facility tickets awaiting technician dispatch, 4 night-out requests pending signature, and morning mess feedback flagged for review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <NextLink
              href="/warden/complaints"
              className="inline-flex items-center gap-2 rounded-xl bg-saffron-500 px-4 py-2.5 text-xs font-bold text-black shadow-lg shadow-saffron-500/20 hover:bg-saffron-400 transition-all hover:scale-105"
            >
              <Wrench className="h-4 w-4" />
              Open Kanban Board
            </NextLink>
            <NextLink
              href="/warden/rooms"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
            >
              <BedDouble className="h-4 w-4 text-primary" />
              Room Allocation Map
            </NextLink>
            <NextLink
              href="/warden/attendance"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
            >
              <Users className="h-4 w-4 text-teal-500" />
              Take Roll-Call
            </NextLink>
          </div>
        </div>

        {/* 3 Urgent Highlights Cards inside Hero */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-card/70 border border-saffron-500/20 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-500">Plumbing Overflow</span>
              <span className="text-[10px] text-muted-foreground font-mono">B-102</span>
            </div>
            <p className="text-xs text-foreground font-medium">
              Flush valve stuck open; technician team dispatched.
            </p>
          </div>

          <div className="rounded-2xl bg-card/70 border border-saffron-500/20 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-saffron-500">Electrical Load</span>
              <span className="text-[10px] text-muted-foreground font-mono">A-204</span>
            </div>
            <p className="text-xs text-foreground font-medium">
              Geyser tripping MCB; electrician Manoj on site.
            </p>
          </div>

          <div className="rounded-2xl bg-card/70 border border-saffron-500/20 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-teal-500">Curfew Roll-Call</span>
              <span className="text-[10px] text-muted-foreground font-mono">97.8% Checked</span>
            </div>
            <p className="text-xs text-foreground font-medium">
              4 absent, 3 approved night-out passes on file.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Residents"
          value={stats?.totalStudents || 120}
          numericValue={stats?.totalStudents || 120}
          description="Block A (Newton) • 120 Residents"
          icon={Users}
          iconColor="text-primary"
          iconBg="from-primary/20 to-indigo-500/10"
        />
        <StatCard
          title="Campus Occupancy"
          value={`${stats?.occupancyRate || 100}%`}
          numericValue={stats?.occupancyRate || 100}
          suffix="%"
          description="120 of 120 beds occupied (100%)"
          icon={BedDouble}
          iconColor="text-indigo-500"
          iconBg="from-indigo-500/20 to-violet-500/10"
        />
        <StatCard
          title="Pending Tickets"
          value={pendingComplaintsCount || 14}
          numericValue={pendingComplaintsCount || 14}
          description={`${urgentTickets.length} critical awaiting triage`}
          icon={Wrench}
          iconColor="text-saffron-500"
          iconBg="from-saffron-500/20 to-amber-500/10"
        />
        <StatCard
          title="Attendance Roll"
          value={`${stats?.todayAttendancePercent || 97.8}%`}
          numericValue={stats?.todayAttendancePercent || 97.8}
          suffix="%"
          description="4 absent, 3 approved night-outs"
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          iconBg="from-emerald-500/20 to-teal-500/10"
        />
      </div>

      {/* Bento Grid: Live Block Occupancy + Recent Complaints Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Block Capacity & Supervision - Single Assigned Block (Block A) */}
        <div className="lg:col-span-5 rounded-3xl glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Assigned Block Supervision
              </h3>
              <p className="text-xs text-muted-foreground">
                Direct administrative jurisdiction • {myBlock.name}
              </p>
            </div>
            <NextLink
              href="/warden/rooms"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Allot Rooms
            </NextLink>
          </div>

          <div className="rounded-2xl bg-muted/40 p-5 border border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/20 text-primary font-black text-xs">
                    A
                  </span>
                  {myBlock.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Warden In-charge: {myBlock.wardenName}
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-extrabold text-foreground">
                  {myBlock.occupied} / {myBlock.capacity}
                </span>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                  {myBlock.capacity - myBlock.occupied} Beds Available
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Occupancy Load</span>
                <span className="text-foreground font-bold">
                  {Math.round((myBlock.occupied / myBlock.capacity) * 100)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${Math.round((myBlock.occupied / myBlock.capacity) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Block Specifications */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
              <div className="p-2.5 rounded-xl bg-card border border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  Total Rooms
                </span>
                <p className="text-sm font-extrabold text-foreground mt-0.5">
                  {myBlock.roomsCount} Rooms (5 Floors)
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  Wing Profile
                </span>
                <p className="text-sm font-extrabold text-foreground mt-0.5">
                  Undergrad Men&apos;s
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Complaints Triage Feed (Col 7) */}
        <div className="lg:col-span-7 rounded-3xl glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Recent Maintenance Tickets
              </h3>
              <p className="text-xs text-muted-foreground">
                Awaiting diagnosis or technician sign-off
              </p>
            </div>
            <NextLink
              href="/warden/complaints"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Open Kanban <ArrowRight className="h-3 w-3" />
            </NextLink>
          </div>

          <div className="space-y-2.5">
            {complaints.slice(0, 5).map((cmp) => (
              <div
                key={cmp.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/60 hover:bg-muted/60 transition-colors gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-primary">
                      {cmp.roomNumber}
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {cmp.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {cmp.studentName} • Filed {formatDate(cmp.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={cmp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
