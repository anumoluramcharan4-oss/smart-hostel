'use client'

import React, { useEffect } from 'react'
import NextLink from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Bed,
  Users,
  Wifi,
  Sparkles,
  CreditCard,
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Zap,
  Coffee,
  Check,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { StatCard } from '@/components/common/StatCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatINR, formatDate } from '@/lib/utils'

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smart_hostel_notices_v2') {
        queryClient.invalidateQueries({ queryKey: ['notices'] })
      }
      if (e.key === 'smart_hostel_complaints_v2') {
        queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: ['student-complaints', user.id] })
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient, user?.id])

  const { data: complaints = [], isLoading: isLoadingComplaints } = useQuery({
    queryKey: ['student-complaints', user?.id],
    queryFn: () => api.getComplaints({ studentId: user?.id }),
    refetchInterval: 1000,
  })

  const { data: notices = [], isLoading: isLoadingNotices } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.getNotices(),
    refetchInterval: 1000,
  })

  const { data: fees = [], isLoading: isLoadingFees } = useQuery({
    queryKey: ['student-fees', user?.id],
    queryFn: () => api.getFees({ studentId: user?.id }),
  })

  // Roommates in room A-204
  const roommates = [
    {
      name: 'Kabir Sen',
      rollNo: '21BCS043',
      bed: 'Bed 2 (Door)',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      status: 'In Room',
    },
    {
      name: 'Dev Dixit',
      rollNo: '21BCS044',
      bed: 'Bed 3 (Balcony)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      status: 'At Library',
    },
  ]

  const pendingComplaintsCount = complaints.filter((c) => c.status !== 'resolved').length
  const pendingFeeAmount = fees
    .filter((f) => f.status !== 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div className="space-y-6">
      {/* Hero Greeting & Room Bento Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Welcome & Quick Persona Banner (Col 7) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-950/60 via-card to-background border border-border/80 shadow-card relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Active Resident Pass
              </span>
              <span className="text-xs text-muted-foreground">
                Academic Year 2026-27
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {user?.name.split(' ')[0]} 👋
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xl">
              You are checked into <strong className="text-foreground">Room {user?.roomNumber}</strong>, {user?.blockName}. Biometric curfew tonight is 10:30 PM.
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <NextLink
              href="/student/complaints"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
            >
              <AlertCircle className="h-4 w-4" />
              Raise Maintenance Ticket
            </NextLink>
            <NextLink
              href="/student/fees"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
            >
              <CreditCard className="h-4 w-4 text-emerald-500" />
              Pay Semester Dues
            </NextLink>
            <NextLink
              href="/student/notices"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
            >
              <Bell className="h-4 w-4 text-saffron-500" />
              Hostel Bulletins
            </NextLink>
          </div>
        </div>

        {/* Hero Room Bento Card (Col 5) */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-gradient-to-br from-[#121A33] to-[#0A0E1C] text-white border border-white/10 shadow-card-dark relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 h-32 w-32 bg-primary/20 rounded-full blur-2xl" />

          {/* Room Card Header */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Assigned Quarters
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-white">
                  {user?.roomNumber || 'A-204'}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {user?.bedNumber || 'Bed 1'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {user?.blockName || 'Block A (Newton)'} • Floor 2
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Keycard Active
            </div>
          </div>

          {/* Roommates Roster */}
          <div className="mt-5 space-y-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Roommates (Triple Occupancy)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {roommates.map((rm, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5"
                >
                  <img
                    src={rm.avatar}
                    alt={rm.name}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {rm.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {rm.bed}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Room Specs & Amenities */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Wifi className="h-4 w-4 text-primary" />
              <span>HostelMesh_5G</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-saffron-400" />
              <span>Backup Power OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Responsive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Roll"
          value="96%"
          numericValue={96}
          suffix="%"
          trend={{ value: 2.1, label: 'vs last month' }}
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          iconBg="from-emerald-500/20 to-teal-500/10"
        />
        <StatCard
          title="Active Complaints"
          value={pendingComplaintsCount}
          numericValue={pendingComplaintsCount}
          trend={{ value: -1, label: 'resolved this week', isPositiveGood: false }}
          icon={AlertCircle}
          iconColor="text-saffron-500"
          iconBg="from-saffron-500/20 to-amber-500/10"
        />
        <StatCard
          title="Fee Balance"
          value={formatINR(pendingFeeAmount)}
          numericValue={pendingFeeAmount}
          prefix="₹"
          icon={CreditCard}
          iconColor="text-primary"
          iconBg="from-primary/20 to-indigo-500/10"
          description={pendingFeeAmount === 0 ? 'All semester dues cleared' : 'Mess fee pending'}
        />
        <StatCard
          title="Mess Status"
          value="Dinner Ready"
          icon={Coffee}
          iconColor="text-teal-500"
          iconBg="from-teal-500/20 to-emerald-500/10"
          description="Paneer Butter Masala & Naan"
        />
      </div>

      {/* Bento Grid: Active Complaints Timeline (Col 7) + Notices Bulletins (Col 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Active Complaints Timeline (Col 7) */}
        <div className="lg:col-span-7 rounded-3xl glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                My Maintenance Tickets
              </h2>
              <p className="text-xs text-muted-foreground">
                Live repair status and technician progress updates
              </p>
            </div>
            <NextLink
              href="/student/complaints"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </NextLink>
          </div>

          {isLoadingComplaints ? (
            <div className="space-y-3 py-4">
              <div className="h-14 rounded-2xl bg-muted/70 animate-pulse" />
              <div className="h-14 rounded-2xl bg-muted/70 animate-pulse" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No complaints filed yet. Everything running smoothly!
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/70 p-4 bg-card/60 hover:border-primary/40 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        {item.id} • {item.category}
                      </span>
                      <h4 className="text-sm font-semibold text-foreground">
                        {item.title}
                      </h4>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>

                  {/* Horizontal mini timeline stepper */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{item.timeline[item.timeline.length - 1]?.note}</span>
                    </div>
                    <span className="font-mono text-[10px]">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Hostel Notices & Events (Col 5) */}
        <div className="lg:col-span-5 rounded-3xl glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Hostel Bulletins
              </h2>
              <p className="text-xs text-muted-foreground">
                Official circulars from warden & estate office
              </p>
            </div>
            <NextLink
              href="/student/notices"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              See All <ArrowRight className="h-3 w-3" />
            </NextLink>
          </div>

          {isLoadingNotices ? (
            <div className="space-y-3 py-4">
              <div className="h-16 rounded-2xl bg-muted/70 animate-pulse" />
              <div className="h-16 rounded-2xl bg-muted/70 animate-pulse" />
            </div>
          ) : notices.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-2xl">
              No active announcements or circulars posted.
            </div>
          ) : (
            <div className="space-y-3">
              {notices.slice(0, 3).map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-2xl border border-border/70 p-4 bg-card/60 hover:border-primary/40 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={notice.priority} />
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDate(notice.publishedAt)}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-foreground leading-snug">
                    {notice.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notice.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
