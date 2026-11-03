'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowRight,
  User,
  Search,
  Check,
  ChevronRight,
  X,
  ShieldAlert,
  Building2,
  Radio,
  Flame,
  AlertTriangle,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Complaint, ComplaintPriority, ComplaintStatus } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function WardenComplaintsPage() {
  const queryClient = useQueryClient()
  const [selectedBlock, setSelectedBlock] = useState('Block A (Newton)')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [assigningTicket, setAssigningTicket] = useState<Complaint | null>(null)
  const [selectedStaff, setSelectedStaff] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority>('urgent')
  const [dispatchNote, setDispatchNote] = useState('')

  // Dynamically load blocks & maintenance staff
  const { data: blocksData = [] } = useQuery({
    queryKey: ['hostel-blocks'],
    queryFn: () => api.getBlocks(),
  })

  const { data: availableStaff = [] } = useQuery({
    queryKey: ['hostel-staff'],
    queryFn: () => api.getStaff(),
  })

  // Warden jurisdiction is strictly ONE assigned block: Block A (Newton)
  const hostelBlocks = useMemo(() => {
    return ['Block A (Newton)']
  }, [])

  // Cross-tab real-time storage event sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smart_hostel_complaints_v2') {
        queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient])

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['warden-all-complaints'],
    queryFn: () => api.getComplaints(),
    refetchInterval: 15000,
  })

  // Derive live complaints per block to highlight blocks with active issues
  const blockComplaintStats = useMemo(() => {
    const stats: Record<
      string,
      { total: number; pending: number; inProgress: number; urgent: number; high: number }
    > = {}

    hostelBlocks.forEach((b) => {
      stats[b] = { total: 0, pending: 0, inProgress: 0, urgent: 0, high: 0 }
    })

    const isResolved = (s?: string) => {
      const norm = String(s || '').toLowerCase().trim().replace(/[\s-]/g, '_')
      return norm === 'resolved' || norm === 'closed' || norm === 'student_approved' || norm === 'completed'
    }

    const isInProgress = (s?: string) => {
      const norm = String(s || '').toLowerCase().trim().replace(/[\s-]/g, '_')
      return norm === 'in_progress' || norm === 'assigned' || norm === 'investigating' || norm === 'wip'
    }

    const isPending = (s?: string) => {
      return !isResolved(s) && !isInProgress(s)
    }

    complaints.forEach((c) => {
      if (isResolved(c.status)) return
      const compBlock = (c.blockName || '').toLowerCase().trim()
      const roomLetter = (c.roomNumber || '').toUpperCase().charAt(0)
      const matched = hostelBlocks.find((b) => {
        const bLower = b.toLowerCase().trim()
        const bLetter = b.replace('Block ', '').charAt(0).toUpperCase()
        return (
          compBlock.includes(bLower) ||
          bLower.includes(compBlock) ||
          compBlock === bLetter.toLowerCase() ||
          compBlock.includes(`block ${bLetter.toLowerCase()}`) ||
          compBlock.includes(`block-${bLetter.toLowerCase()}`) ||
          roomLetter === bLetter
        )
      }) || hostelBlocks[0]

      if (matched) {
        if (!stats[matched]) {
          stats[matched] = { total: 0, pending: 0, inProgress: 0, urgent: 0, high: 0 }
        }
        stats[matched].total += 1
        if (isPending(c.status)) stats[matched].pending += 1
        if (isInProgress(c.status)) stats[matched].inProgress += 1
        if (c.priority === 'urgent') stats[matched].urgent += 1
        if (c.priority === 'high') stats[matched].high += 1
      }
    })

    return stats
  }, [complaints, hostelBlocks])

  const blocksWithComplaints = useMemo(() => {
    return hostelBlocks.filter((b) => (blockComplaintStats[b]?.total || 0) > 0).map((b) => ({
      block: b,
      ...blockComplaintStats[b],
    }))
  }, [blockComplaintStats, hostelBlocks])


  // Optimistic status transition mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
      assignedTo,
      priority,
    }: {
      id: string
      status: ComplaintStatus
      note?: string
      assignedTo?: string
      priority?: ComplaintPriority
    }) => api.updateComplaintStatus(id, status, note, assignedTo, priority),
    onMutate: async ({ id, status, note, assignedTo, priority }) => {
      await queryClient.cancelQueries({ queryKey: ['warden-all-complaints'] })
      const prev = queryClient.getQueryData<Complaint[]>(['warden-all-complaints'])

      queryClient.setQueryData<Complaint[]>(['warden-all-complaints'], (old = []) =>
        old.map((c) =>
          c.id === id
            ? {
                ...c,
                status,
                assignedTo: assignedTo !== undefined ? assignedTo : c.assignedTo,
                priority: priority || c.priority,
                timeline: [
                  ...c.timeline,
                  {
                    status,
                    timestamp: new Date().toISOString(),
                    note: note || `Moved to ${status}`,
                  },
                ],
              }
            : c
        )
      )

      return { prev }
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['warden-all-complaints'], ctx.prev)
      }
      toast.error('Failed to update ticket')
    },
    onSuccess: (updated) => {
      toast.success(`Ticket ${updated.id} updated!`)
      setAssigningTicket(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['admin-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteComplaint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['admin-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-complaints'] })
      toast.success('Complaint ticket permanently removed from hostel records')
    },
    onError: () => {
      toast.error('Failed to remove complaint ticket')
    },
  })

  const isResolvedStatus = (s?: string) => {
    const norm = String(s || '').toLowerCase().trim().replace(/[\s-]/g, '_')
    return norm === 'resolved' || norm === 'closed' || norm === 'student_approved' || norm === 'completed'
  }

  const isInProgressStatus = (s?: string) => {
    const norm = String(s || '').toLowerCase().trim().replace(/[\s-]/g, '_')
    return norm === 'in_progress' || norm === 'assigned' || norm === 'investigating' || norm === 'wip'
  }

  const isPendingStatus = (s?: string) => {
    return !isResolvedStatus(s) && !isInProgressStatus(s)
  }

  const filtered = complaints.filter((c) => {
    // Warden jurisdiction is strictly Block A (Newton) - single building architecture
    const isAllBlocks =
      !selectedBlock ||
      selectedBlock === 'All Blocks' ||
      selectedBlock.toLowerCase().includes('block a') ||
      selectedBlock.toLowerCase().includes('newton')
    let matchesBlock = isAllBlocks

    if (!isAllBlocks) {
      const compBlock = (c.blockName || '').toLowerCase().trim()
      const targetBlock = selectedBlock.toLowerCase().trim()
      matchesBlock =
        compBlock.includes(targetBlock) ||
        targetBlock.includes(compBlock) ||
        compBlock.includes('block a') ||
        compBlock.includes('newton') ||
        (c.roomNumber || '').toUpperCase().startsWith('A-')
    }

    const matchesCategory =
      categoryFilter === 'all' ||
      (c.category || '').toLowerCase() === categoryFilter.toLowerCase()

    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.roomNumber || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q) ||
      (c.studentName || '').toLowerCase().includes(q) ||
      (c.blockName || '').toLowerCase().includes(q)

    return matchesBlock && matchesCategory && matchesSearch
  })

  // Columns for Kanban - Every ticket is guaranteed to be placed into one of the 3 stages
  const pendingItems = filtered.filter((c) => isPendingStatus(c.status))
  const inProgressItems = filtered.filter((c) => isInProgressStatus(c.status))
  const resolvedItems = filtered.filter((c) => isResolvedStatus(c.status))

  const columns: {
    status: ComplaintStatus
    title: string
    count: number
    items: Complaint[]
    color: string
    badgeClass: string
  }[] = [
    {
      status: 'pending',
      title: 'Pending Triage',
      count: pendingItems.length,
      items: pendingItems,
      color: 'border-amber-500/30',
      badgeClass: 'bg-amber-500/15 text-amber-500',
    },
    {
      status: 'in_progress',
      title: 'In Progress / Assigned',
      count: inProgressItems.length,
      items: inProgressItems,
      color: 'border-indigo-500/30',
      badgeClass: 'bg-indigo-500/15 text-indigo-400',
    },
    {
      status: 'resolved',
      title: 'Resolved & Closed',
      count: resolvedItems.length,
      items: resolvedItems,
      color: 'border-emerald-500/30',
      badgeClass: 'bg-emerald-500/15 text-emerald-400',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints & Maintenance Kanban Board"
        subtitle="Manage facility tickets across hostel blocks. Assign technicians, track SLA progress, and sign off completed repairs."
      />

      {/* Warden Single Assigned Block Jurisdiction Banner */}
      <div className="space-y-3 p-5 rounded-3xl bg-card border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-lg">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Assigned Jurisdiction: Block A (Newton)
                </h3>
                <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold px-3 py-0.5 border border-emerald-500/20">
                  Prof. Rajesh K. Sharma • Resident In-charge
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Maintenance triage locked to Block A (Newton) — Undergrad Men&apos;s Wing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-muted/40 border border-border/60 px-4 py-2 text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Supervised Block</span>
              <p className="text-xs font-black text-foreground">Block A (Newton)</p>
            </div>
            <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-2 text-right">
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Queue</span>
              <p className="text-xs font-black text-primary">{filtered.length} Active Tickets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, room, or defect..."
            className="w-full rounded-xl border border-input bg-card pl-9 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'electrical', 'wifi', 'plumbing', 'carpentry', 'cleaning', 'mess'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Kanban 3-Column Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {columns.map((col) => (
          <div
            key={col.status}
            className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-sm p-4 space-y-3 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  {col.title}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-mono font-bold ${col.badgeClass}`}
                >
                  {col.count}
                </span>
              </div>
            </div>

            {/* Ticket Cards */}
            <div className="space-y-3">
              {col.items.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border/50 rounded-2xl">
                  No tickets in this stage.
                </div>
              ) : (
                col.items.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 hover:border-primary/50 shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg">
                          <Building2 className="h-3 w-3" />
                          {ticket.blockName || 'Block A (Newton)'} • Room {ticket.roomNumber}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          #{ticket.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <select
                          value={ticket.priority}
                          onChange={(e) =>
                            updateStatusMutation.mutate({
                              id: ticket.id,
                              status: ticket.status,
                              priority: e.target.value as ComplaintPriority,
                              note: `Warden updated urgency to ${e.target.value.toUpperCase()}`,
                            })
                          }
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer border ${
                            ticket.priority === 'urgent'
                              ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                              : ticket.priority === 'high'
                              ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                              : ticket.priority === 'medium'
                              ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          <option value="urgent" className="bg-popover text-foreground">🚨 Urgent</option>
                          <option value="high" className="bg-popover text-foreground">⚡ High</option>
                          <option value="medium" className="bg-popover text-foreground">📋 Medium</option>
                          <option value="low" className="bg-popover text-foreground">☕ Low</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-snug">
                        {ticket.title}
                      </h4>
                      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                      <span>{ticket.studentName}</span>
                      <span className="font-mono text-[10px]">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>

                    {ticket.assignedTo && (
                      <div className="text-[10px] text-indigo-400 font-medium flex items-center justify-between bg-indigo-500/10 px-2 py-1 rounded-lg">
                        <span>Tech: <strong>{ticket.assignedTo}</strong></span>
                        <button
                          onClick={() => {
                            setAssigningTicket(ticket)
                            setSelectedPriority(ticket.priority)
                          }}
                          className="text-[9px] font-bold text-primary hover:underline"
                        >
                          Reassign
                        </button>
                      </div>
                    )}

                    {/* Quick Move Status Buttons */}
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      {ticket.status === 'pending' && (
                        <button
                          onClick={() => {
                            setAssigningTicket(ticket)
                            setSelectedPriority(ticket.priority)
                          }}
                          className="flex items-center gap-1 rounded-lg bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/25 transition-colors"
                        >
                          <Wrench className="h-3 w-3" /> Assign Staff
                        </button>
                      )}

                      {ticket.status === 'in_progress' && (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: ticket.id,
                              status: 'resolved',
                              note: 'Inspection confirmed & issue signed off by warden',
                            })
                          }
                          className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <Check className="h-3 w-3" /> Mark Resolved
                        </button>
                      )}

                      {(ticket.status === 'resolved' || ticket.status === 'student_approved') && (
                        <div className="flex flex-col gap-1.5 w-full pt-1">
                          {ticket.studentApproved || ticket.status === 'student_approved' ? (
                            <div className="flex items-center justify-between gap-1 w-full">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="h-3 w-3" /> Student Approved Solved
                              </span>
                              <button
                                onClick={() => {
                                  if (confirm(`Permanently remove ticket #${ticket.id} from records?`)) {
                                    deleteMutation.mutate(ticket.id)
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                                className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-500/20 transition-colors shadow-sm"
                                title="Remove solved problem ticket"
                              >
                                <Trash2 className="h-3 w-3" /> Remove Ticket
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-1 w-full bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded-lg text-[10px]">
                              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Awaiting Student Approval
                              </span>
                              <span className="text-[9px] text-muted-foreground italic">
                                Removal unlocked upon student signoff
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Warden Worker Assignment & Urgency Override Modal */}
      {assigningTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Assign Maintenance Worker
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    Ticket: {assigningTicket.id} &bull; Room {assigningTicket.roomNumber || 'Room N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningTicket(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Problem overview */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Problem Description
                </span>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {assigningTicket.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {assigningTicket.description}
                </p>
              </div>

              {/* Worker selector */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Select Available Technician / Staff
                </label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {availableStaff.map((staff) => (
                    <option key={staff.id} value={staff.name}>
                      {staff.name} ({staff.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgency override by Warden */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Urgency Priority (Warden Control)
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Students cannot set this
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['urgent', 'high', 'medium', 'low'] as ComplaintPriority[]).map((p) => {
                    const isSelected = selectedPriority === p
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedPriority(p)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                          isSelected
                            ? p === 'urgent'
                              ? 'bg-rose-500/20 text-rose-500 border-rose-500'
                              : p === 'high'
                              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500'
                              : p === 'medium'
                              ? 'bg-amber-500/20 text-amber-500 border-amber-500'
                              : 'bg-emerald-500/20 text-emerald-500 border-emerald-500'
                            : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {p === 'urgent' && '🚨 '}
                        {p === 'high' && '⚡ '}
                        {p === 'medium' && '📋 '}
                        {p === 'low' && '☕ '}
                        {p}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dispatch Note */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Dispatch Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inspect main breaker box on 3rd floor immediately"
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setAssigningTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  const staffToAssign = selectedStaff || availableStaff[0]?.name || 'Technician'
                  updateStatusMutation.mutate({
                    id: assigningTicket.id,
                    status: 'in_progress',
                    assignedTo: staffToAssign,
                    priority: selectedPriority,
                    note: dispatchNote || `Assigned to ${staffToAssign} by Warden`,
                  })
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {updateStatusMutation.isPending ? 'Assigning...' : 'Confirm & Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
