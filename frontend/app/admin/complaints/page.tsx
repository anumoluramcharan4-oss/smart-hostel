'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  User,
  Search,
  Check,
  X,
  Building2,
  AlertTriangle,
  Sparkles,
  Trash2,
  Wrench,
  ShieldCheck,
  ChevronDown,
  Layers,
  ArrowUpDown,
  Send,
} from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Complaint, ComplaintPriority, ComplaintStatus } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const availableStaff = [
  { id: 'staff-1', name: 'Rajesh Verma (Plumber)', phone: '+91 98765-43210' },
  { id: 'staff-2', name: 'Manoj Sharma (Electrician)', phone: '+91 98765-43211' },
  { id: 'staff-3', name: 'Suresh Patil (Network Engineer)', phone: '+91 98765-43212' },
  { id: 'staff-4', name: 'Vikram Seth (Locksmith & Security)', phone: '+91 98765-43213' },
  { id: 'staff-5', name: 'Anita Devi (Housekeeping)', phone: '+91 98765-43214' },
]

const HOSTEL_BLOCKS = [
  'All Blocks',
  'Block A (Newton)',
  'Block B (Aryabhata)',
  'Block C (Ramanujan)',
  'Block D (Kalam)',
  'Block E (Visvesvaraya)',
]

export default function AdminComplaintsPage() {
  const queryClient = useQueryClient()
  const [selectedBlock, setSelectedBlock] = useState('All Blocks')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [assigningTicket, setAssigningTicket] = useState<Complaint | null>(null)
  const [selectedStaff, setSelectedStaff] = useState('Rajesh Verma (Plumber)')
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority>('urgent')
  const [dispatchNote, setDispatchNote] = useState('')

  // Cross-tab real-time storage event sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smart_hostel_complaints_v2') {
        queryClient.invalidateQueries({ queryKey: ['admin-complaints-list'] })
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient])

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['admin-complaints-list'],
    queryFn: () => api.getComplaints(),
    refetchInterval: 2000,
  })

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ComplaintStatus }) =>
      api.updateComplaintStatus(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-complaints-list'] })
      queryClient.invalidateQueries({ queryKey: ['topbar-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-complaints'] })
      toast.success(`Ticket status updated to ${vars.status.replace('_', ' ')}`)
    },
    onError: () => {
      toast.error('Failed to update complaint status')
    },
  })

  const dispatchStaffMutation = useMutation({
    mutationFn: ({
      id,
      staffName,
      priority,
      note,
    }: {
      id: string
      staffName: string
      priority: ComplaintPriority
      note?: string
    }) =>
      api.assignComplaint(id, staffName, priority, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-complaints-list'] })
      queryClient.invalidateQueries({ queryKey: ['topbar-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-complaints'] })
      toast.success(`Dispatched ${selectedStaff} to resolve ticket`)
      setAssigningTicket(null)
      setDispatchNote('')
    },
    onError: () => {
      toast.error('Failed to dispatch maintenance staff')
    },
  })

  const deleteComplaintMutation = useMutation({
    mutationFn: (id: string) => api.deleteComplaint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-complaints-list'] })
      queryClient.invalidateQueries({ queryKey: ['topbar-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-complaints'] })
      toast.success('Ticket closed and removed from system')
    },
    onError: () => {
      toast.error('Failed to delete ticket')
    },
  })

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Block filter
      if (selectedBlock !== 'All Blocks') {
        const blkClean = selectedBlock.split(' ')[0].toLowerCase()
        if (!c.blockName.toLowerCase().includes(blkClean)) return false
      }
      // Category filter
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
      // Priority filter
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.studentName.toLowerCase().includes(q) ||
          c.roomNumber.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [complaints, selectedBlock, categoryFilter, priorityFilter, statusFilter, searchQuery])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = complaints.length
    const pending = complaints.filter((c) => c.status === 'pending').length
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length
    const resolved = complaints.filter((c) => c.status === 'resolved' || c.status === 'student_approved').length
    const urgent = complaints.filter((c) => c.priority === 'urgent' && c.status !== 'resolved').length
    return { total, pending, inProgress, resolved, urgent }
  }, [complaints])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Complaints &amp; Maintenance Oversight
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Centralized campus-wide ticket governance, AI triage analysis, and technician dispatch.
              </p>
            </div>
          </div>
        </div>

        {/* Global Block Filter */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {HOSTEL_BLOCKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Logged</span>
            <Ticket className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.total}</span>
            <span className="text-xs text-slate-400">tickets</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase">Pending Triage</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.pending}</span>
            <span className="text-xs text-slate-400">awaiting</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">In Progress</span>
            <Wrench className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.inProgress}</span>
            <span className="text-xs text-slate-400">assigned</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.resolved}</span>
            <span className="text-xs text-slate-400">closed</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase">Urgent SLA</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{metrics.urgent}</span>
            <span className="text-xs text-slate-400">high alert</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, room, issue title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Categories</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="carpentry">Carpentry &amp; Furniture</option>
            <option value="cleaning">Housekeeping</option>
            <option value="network">Wi-Fi &amp; Internet</option>
            <option value="other">Other</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent Priority</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Complaints List / Table */}
      {filteredComplaints.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">No complaints match your filters</h3>
          <p className="text-xs text-slate-500 mt-1">All tickets are either resolved or clear across the hostel grounds.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredComplaints.map((c) => (
            <div
              key={c.id}
              className={`p-4 rounded-xl border transition bg-white dark:bg-slate-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                c.priority === 'urgent' && c.status !== 'resolved'
                  ? 'border-red-300 dark:border-red-900/80 bg-red-50/20 dark:bg-red-950/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">#{c.id}</span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{c.title}</h3>

                  {/* Priority Tag */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.priority === 'urgent'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200'
                        : c.priority === 'high'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {c.priority}
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === 'resolved' || c.status === 'student_approved'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : c.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {c.status.replace('_', ' ').toUpperCase()}
                  </span>

                  {c.category && (
                    <span className="text-[10px] text-slate-400 capitalize">
                      • {c.category}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{c.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>
                    <strong className="text-slate-600 dark:text-slate-300">Student:</strong> {c.studentName}
                  </span>
                  <span>
                    <strong className="text-slate-600 dark:text-slate-300">Location:</strong> {c.blockName} • Room {c.roomNumber}
                  </span>
                  <span>
                    <strong className="text-slate-600 dark:text-slate-300">Logged:</strong> {formatDate(c.createdAt)}
                  </span>
                  {c.assignedTo && (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                      <Wrench className="h-3 w-3" /> Assigned: {c.assignedTo}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {c.status !== 'resolved' && (
                  <button
                    onClick={() => {
                      setAssigningTicket(c)
                      setSelectedPriority(c.priority)
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                  >
                    <Wrench className="h-3.5 w-3.5 text-blue-500" />
                    <span>Assign Staff</span>
                  </button>
                )}

                {c.status !== 'resolved' ? (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: c.id, status: 'resolved' })}
                    disabled={updateStatusMutation.isPending}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Resolve</span>
                  </button>
                ) : (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: c.id, status: 'pending' })}
                    disabled={updateStatusMutation.isPending}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    Reopen
                  </button>
                )}

                <button
                  onClick={() => {
                    if (confirm(`Remove complaint #${c.id}?`)) {
                      deleteComplaintMutation.mutate(c.id)
                    }
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                  title="Delete ticket"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Assignment Modal */}
      {assigningTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Dispatch Maintenance Staff
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assign technician to ticket #{assigningTicket.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningTicket(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">{assigningTicket.title}</p>
              <p className="text-slate-500">
                {assigningTicket.blockName} • Room {assigningTicket.roomNumber} ({assigningTicket.studentName})
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Select Maintenance Staff *
                </label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  {availableStaff.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Confirm SLA Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as ComplaintPriority)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  <option value="urgent">Urgent (&lt; 2 Hours SLA)</option>
                  <option value="high">High (&lt; 6 Hours SLA)</option>
                  <option value="medium">Medium (&lt; 24 Hours SLA)</option>
                  <option value="low">Low (&lt; 48 Hours SLA)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Dispatch Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Carry 1/2 inch PVC pipe connectors and seal tape"
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssigningTicket(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  dispatchStaffMutation.mutate({
                    id: assigningTicket.id,
                    staffName: selectedStaff,
                    priority: selectedPriority,
                    note: dispatchNote,
                  })
                }
                disabled={dispatchStaffMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                {dispatchStaffMutation.isPending ? 'Dispatching...' : 'Dispatch Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
