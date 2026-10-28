'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  Wrench,
  Filter,
  X,
  Search,
  ShieldAlert,
  Lock,
  Building2,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Trash2,
  Check,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  WardenGrievance,
  GrievanceCategory,
} from '@/lib/types'
import { formatDate, formatTime } from '@/lib/utils'
import { determineAutoPriority } from '@/lib/priority-helper'

const HOSTEL_BLOCKS = [
  'Block A (Newton)',
  'Block B (Aryabhata)',
  'Block C (Ramanujan)',
  'Block D (Kalam)',
  'Block E (Visvesvaraya)',
]

const BLOCK_TO_WARDEN: Record<
  string,
  { name: string; designation: string; phone: string; email: string }
> = {
  'Block A (Newton)': {
    name: 'Prof. Rajesh K. Sharma',
    designation: 'Senior Resident Warden',
    phone: '+91 98111 22334',
    email: 'rajesh.sharma@hostelos.edu',
  },
  'Block B (Aryabhata)': {
    name: 'Dr. Meenakshi Sundaram',
    designation: 'Associate Warden',
    phone: '+91 98111 22335',
    email: 'meenakshi.s@hostelos.edu',
  },
  'Block C (Ramanujan)': {
    name: 'Dr. Alok Nath Mukherjee',
    designation: 'Resident Warden',
    phone: '+91 98111 22336',
    email: 'alok.mukherjee@hostelos.edu',
  },
  'Block D (Kalam)': {
    name: 'Prof. Ananya Sen',
    designation: 'Resident Warden',
    phone: '+91 98111 22337',
    email: 'ananya.sen@hostelos.edu',
  },
  'Block E (Visvesvaraya)': {
    name: 'Prof. K. R. Rao',
    designation: 'Senior Warden & Safety Officer',
    phone: '+91 98111 22338',
    email: 'kr.rao@hostelos.edu',
  },
}

const complaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['plumbing', 'electrical', 'wifi', 'carpentry', 'cleaning', 'mess', 'other']),
  blockName: z.string().min(1, 'Please select your block'),
  roomNumber: z.string().min(1, 'Room number is required'),
})

type ComplaintFormData = z.infer<typeof complaintSchema>

export default function StudentComplaintsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'maintenance' | 'grievances'>('maintenance')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGrievanceModalOpen, setIsGrievanceModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Grievance form state - Block determines the exact warden automatically
  const [grievanceBlock, setGrievanceBlock] = useState(user?.blockName || HOSTEL_BLOCKS[0])
  const [grievanceRoom, setGrievanceRoom] = useState(user?.roomNumber || 'A-204')
  const [grievanceCategory, setGrievanceCategory] = useState<GrievanceCategory>('misconduct')
  const [grievanceSubject, setGrievanceSubject] = useState('')
  const [grievanceDesc, setGrievanceDesc] = useState('')

  // Automatically derive the designated warden for the chosen block
  const currentAssignedWarden =
    BLOCK_TO_WARDEN[grievanceBlock] || BLOCK_TO_WARDEN['Block A (Newton)']


  // Cross-tab real-time storage event sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'smart_hostel_complaints_v2' ||
        e.key === 'smart_hostel_warden_grievances_v2'
      ) {
        queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
        queryClient.invalidateQueries({ queryKey: ['student-warden-grievances'] })
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient])

  // Facility tickets query
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['student-complaints', user?.id],
    queryFn: () => api.getComplaints({ studentId: user?.id || 'usr-student-1' }),
    refetchInterval: 1000,
  })

  // Confidential warden grievances query (Student only views their own direct reports)
  const { data: myGrievances = [], isLoading: isLoadingGrievances } = useQuery({
    queryKey: ['student-warden-grievances', user?.id],
    queryFn: async () => {
      const all = await api.getWardenGrievances()
      const currentStudentId = user?.id || 'usr-student-1'
      return all.filter((g) => g.studentId === currentStudentId)
    },
    refetchInterval: 1000,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      category: 'electrical',
      blockName: user?.blockName || HOSTEL_BLOCKS[0],
      roomNumber: user?.roomNumber || 'A-204',
    },
  })

  const watchedCategory = watch('category') || 'electrical'
  const watchedTitle = watch('title') || ''
  const watchedDesc = watch('description') || ''

  const autoPriority = determineAutoPriority(watchedCategory, watchedTitle, watchedDesc)

  // Facility ticket creation mutation
  const createMutation = useMutation({
    mutationFn: (newComplaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>) =>
      api.createComplaint(newComplaint),
    onMutate: async (newComplaint) => {
      const currentStudentId = user?.id || 'usr-student-1'
      await queryClient.cancelQueries({ queryKey: ['student-complaints', currentStudentId] })
      const previous = queryClient.getQueryData<Complaint[]>(['student-complaints', currentStudentId])

      const optimisticItem: Complaint = {
        ...newComplaint,
        id: `cmp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [
          {
            status: 'pending',
            timestamp: new Date().toISOString(),
            note: 'Complaint registered by student',
          },
        ],
      }

      queryClient.setQueryData<Complaint[]>(['student-complaints', currentStudentId], (old = []) => [
        optimisticItem,
        ...old,
      ])

      return { previous }
    },
    onError: (err, newComplaint, context) => {
      const currentStudentId = user?.id || 'usr-student-1'
      if (context?.previous) {
        queryClient.setQueryData(['student-complaints', currentStudentId], context.previous)
      }
      toast.error('Failed to submit ticket. Please retry.')
    },
    onSuccess: (created) => {
      toast.success(`Maintenance Ticket #${created.id} registered! Auto-classified as ${created.priority.toUpperCase()}.`)
      setIsModalOpen(false)
      reset()
    },
    onSettled: () => {
      const currentStudentId = user?.id || 'usr-student-1'
      queryClient.invalidateQueries({ queryKey: ['student-complaints', currentStudentId] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['admin-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  // Confidential Warden grievance mutation
  const grievanceMutation = useMutation({
    mutationFn: (data: Omit<WardenGrievance, 'id' | 'createdAt' | 'updatedAt' | 'status'>) =>
      api.createWardenGrievance(data),
    onSuccess: () => {
      toast.success('Grievance reported directly to Chief Administrator. Warden cannot view this.', {
        duration: 5000,
      })
      setIsGrievanceModalOpen(false)
      setGrievanceSubject('')
      setGrievanceDesc('')
      setActiveTab('grievances')
      queryClient.invalidateQueries({ queryKey: ['student-warden-grievances'] })
      queryClient.invalidateQueries({ queryKey: ['admin-warden-grievances'] })
    },
    onError: () => {
      toast.error('Failed to submit confidential grievance. Please try again.')
    },
  })

  // Mutation to remove a solved/closed complaint
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteComplaint(id),
    onSuccess: (res) => {
      toast.success(`Complaint #${res.id} has been removed.`)
      const currentStudentId = user?.id || 'usr-student-1'
      queryClient.invalidateQueries({ queryKey: ['student-complaints', currentStudentId] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['admin-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: () => {
      toast.error('Failed to remove complaint. Please try again.')
    },
  })

  // Mutation to remove a solved/closed warden grievance
  const deleteGrievanceMutation = useMutation({
    mutationFn: (id: string) => api.deleteWardenGrievance(id),
    onSuccess: (res) => {
      toast.success(`Warden grievance #${res.id} has been removed.`)
      const currentStudentId = user?.id || 'usr-student-1'
      queryClient.invalidateQueries({ queryKey: ['student-warden-grievances', currentStudentId] })
      queryClient.invalidateQueries({ queryKey: ['student-warden-grievances'] })
      queryClient.invalidateQueries({ queryKey: ['admin-warden-grievances'] })
    },
    onError: () => {
      toast.error('Failed to remove grievance. Please try again.')
    },
  })

  // Mutation for student to approve resolution
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.approveComplaintResolution(id, 'Student inspected and confirmed issue completely resolved.'),
    onSuccess: () => {
      toast.success('Resolution confirmed! You have approved that the problem is solved.')
      const currentStudentId = user?.id || 'usr-student-1'
      queryClient.invalidateQueries({ queryKey: ['student-complaints', currentStudentId] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['admin-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-complaints'] })
    },
    onError: () => {
      toast.error('Failed to approve resolution. Please try again.')
    },
  })

  // Mutation for student to reopen ticket if still broken
  const reopenMutation = useMutation({
    mutationFn: (id: string) => api.reopenComplaint(id, 'Student reported issue is still broken after inspection.'),
    onSuccess: () => {
      toast.info('Ticket re-opened for staff attention. Warden and technician notified.')
      const currentStudentId = user?.id || 'usr-student-1'
      queryClient.invalidateQueries({ queryKey: ['student-complaints', currentStudentId] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['admin-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-complaints'] })
    },
    onError: () => {
      toast.error('Failed to reopen ticket.')
    },
  })

  const onSubmit = (data: ComplaintFormData) => {
    createMutation.mutate({
      title: data.title,
      description: data.description,
      category: data.category as ComplaintCategory,
      priority: autoPriority.priority,
      status: 'pending',
      studentId: user?.id || 'usr-student-1',
      studentName: user?.name || 'Aarav Patel',
      roomNumber: data.roomNumber,
      blockName: data.blockName,
    })
  }

  const handleGrievanceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!grievanceSubject.trim() || !grievanceDesc.trim()) {
      toast.error('Please provide a subject and incident description')
      return
    }

    grievanceMutation.mutate({
      studentId: user?.id || 'usr-student-1',
      studentName: user?.name || 'Aarav Patel',
      studentEmail: user?.email || 'aarav.patel@hostelos.edu',
      studentPhone: user?.phone || '+91 98201 44521',
      blockName: grievanceBlock,
      roomNumber: grievanceRoom,
      wardenName: `${currentAssignedWarden.name} (${grievanceBlock})`,
      category: grievanceCategory,
      subject: grievanceSubject,
      description: grievanceDesc,
    })
  }

  // Filter complaints
  const filtered = complaints.filter((c) => {
    const matchesCategory =
      selectedCategory === 'all' || c.category === selectedCategory
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Maintenance & Complaints"
        subtitle="Report room faults, electrical defects, plumbing or Wi-Fi connectivity issues and track live resolutions."
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsGrievanceModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition-all shadow-sm"
          >
            <ShieldAlert className="h-4 w-4" />
            Report Warden Grievance
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Raise New Ticket
          </button>
        </div>
      </PageHeader>

      {/* Primary Section Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border w-fit">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'maintenance'
              ? 'bg-card text-foreground shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          Facility Maintenance Tickets ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('grievances')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'grievances'
              ? 'bg-rose-500/15 text-rose-500 shadow-sm border border-rose-500/30'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          Confidential Warden Reports ({myGrievances.length})
        </button>
      </div>

      {activeTab === 'maintenance' ? (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search my tickets by ID or title..."
                className="w-full rounded-xl border border-input bg-card pl-9 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'electrical', 'wifi', 'plumbing', 'carpentry', 'cleaning', 'mess'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                      selectedCategory === cat
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

          {/* Complaints Timeline Feed */}
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-32 rounded-3xl bg-card border border-border animate-pulse" />
              <div className="h-32 rounded-3xl bg-card border border-border animate-pulse" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No maintenance tickets found"
              description="Click 'Raise New Ticket' to submit room issues. Urgency priority will be automatically assigned based on the problem."
              action={{
                label: 'Raise Maintenance Ticket',
                onClick: () => setIsModalOpen(true),
                icon: Plus,
              }}
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl glass-card p-6 border border-border/80 shadow-sm space-y-4"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                        #{item.id}
                      </span>
                      <StatusBadge status={item.status} />
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          item.priority === 'urgent'
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            : item.priority === 'high'
                            ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                            : item.priority === 'medium'
                            ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {item.priority === 'urgent' && '🚨 Urgent'}
                        {item.priority === 'high' && '⚡ High'}
                        {item.priority === 'medium' && '📋 Medium'}
                        {item.priority === 'low' && '☕ Low'}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {item.blockName} &bull; Room {item.roomNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Filed on {formatDate(item.createdAt)} at {formatTime(item.createdAt)}
                      </span>
                      {item.status === 'resolved' && (
                        <button
                          onClick={() => {
                            if (confirm('Do you want to remove this solved complaint?')) {
                              deleteMutation.mutate(item.id)
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          title="Remove solved complaint"
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

                  {/* Assigned Worker Banner if dispatched */}
                  {item.assignedTo && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-medium">
                      <UserCheck className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>
                        Assigned Technician: <strong>{item.assignedTo}</strong> is actively working on this defect.
                      </span>
                    </div>
                  )}

                  {/* Solved/Resolved banner + Remove Button */}
                  {item.status === 'resolved' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>Problem solved! Technician completed repairs and marked ticket resolved.</span>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Do you want to remove this solved complaint from your portal?')) {
                            deleteMutation.mutate(item.id)
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 px-3 py-1.5 font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-sm whitespace-nowrap self-end sm:self-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove Solved Complaint
                      </button>
                    </div>
                  )}

                  {/* Timeline */}
                  {item.timeline && item.timeline.length > 0 && (
                    <div className="pt-2 border-t border-border/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Ticket Activity Log
                      </p>
                      <div className="space-y-1.5">
                        {item.timeline.map((event, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            <span className="text-muted-foreground font-mono text-[10px] shrink-0">
                              {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:
                            </span>
                            <span className="text-foreground">{event.note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Confidential Grievances against Warden Tab */
        <div className="space-y-6">
          <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
            <Lock className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-500">
                Encrypted Direct Reporting Channel
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complaints submitted here bypass all hostel staff and are delivered directly to the <strong>Campus Chief Administrator</strong>. Wardens do not have access to view or know about these reports.
              </p>
            </div>
          </div>

          {isLoadingGrievances ? (
            <div className="h-32 rounded-3xl bg-card border border-border animate-pulse" />
          ) : myGrievances.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No grievances reported against wardens"
              description="If you experience misconduct, harassment, or negligence from hostel wardens, you can report it confidentially here."
              action={{
                label: 'Report Warden Grievance',
                onClick: () => setIsGrievanceModalOpen(true),
                icon: ShieldAlert,
              }}
            />
          ) : (
            <div className="space-y-4">
              {myGrievances.map((grv) => (
                <div
                  key={grv.id}
                  className="rounded-3xl glass-card p-6 border border-border shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                        #{grv.id}
                      </span>
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        {grv.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        Target: <strong className="text-foreground">{grv.wardenName}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Filed on {formatDate(grv.createdAt)}
                      </span>
                      {grv.status === 'resolved' && (
                        <button
                          onClick={() => {
                            if (confirm('Do you want to remove this resolved grievance report?')) {
                              deleteGrievanceMutation.mutate(grv.id)
                            }
                          }}
                          disabled={deleteGrievanceMutation.isPending}
                          title="Remove resolved grievance"
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                      Category: {grv.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-0.5">
                      {grv.subject}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {grv.description}
                    </p>
                  </div>

                  {grv.adminNotes && (
                    <div className="p-3 rounded-2xl bg-muted/60 border border-border text-xs space-y-1">
                      <p className="font-bold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Chief Administrator Response:
                      </p>
                      <p className="text-muted-foreground">{grv.adminNotes}</p>
                    </div>
                  )}

                  {/* Solved/Resolved banner + Remove Button */}
                  {grv.status === 'resolved' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>Investigation closed & resolved by Chief Administrator.</span>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Do you want to remove this resolved grievance report from your portal?')) {
                            deleteGrievanceMutation.mutate(grv.id)
                          }
                        }}
                        disabled={deleteGrievanceMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 px-3 py-1.5 font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-sm whitespace-nowrap self-end sm:self-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove Solved Grievance
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Raise Maintenance Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Raise Maintenance Ticket
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Urgency priority is automated according to hostel safety regulations.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              {/* Block & Room Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Hostel Block
                  </label>
                  <select
                    {...register('blockName')}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {HOSTEL_BLOCKS.map((blk) => (
                      <option key={blk} value={blk}>
                        {blk}
                      </option>
                    ))}
                  </select>
                  {errors.blockName && (
                    <p className="text-xs text-rose-500 mt-1">{errors.blockName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Room Number
                  </label>
                  <input
                    {...register('roomNumber')}
                    placeholder="e.g. A-204"
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {errors.roomNumber && (
                    <p className="text-xs text-rose-500 mt-1">{errors.roomNumber.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Issue Title
                </label>
                <input
                  {...register('title')}
                  placeholder="e.g., Geyser not heating water in Room A-204"
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.title && (
                  <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Problem Category
                  </label>
                  <select
                    {...register('category')}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 capitalize"
                  >
                    <option value="electrical">⚡ Electrical (Sparks, Outlets, Lights)</option>
                    <option value="plumbing">🚰 Plumbing & Water (Leaks, Taps, Drain)</option>
                    <option value="wifi">📶 Wi-Fi & Internet (LAN, AP Offline)</option>
                    <option value="cleaning">🧹 Housekeeping / Cleaning</option>
                    <option value="mess">🍽️ Mess & Dining</option>
                    <option value="carpentry">🪑 Carpentry / Furniture</option>
                    <option value="other">🔧 Other Hostel Defect</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Automated Urgency Classification
                  </label>
                  <div className="rounded-xl border border-border bg-muted/40 p-2.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${autoPriority.badgeClass}`}>
                        {autoPriority.priority === 'urgent' && '🚨'}
                        {autoPriority.priority === 'high' && '⚡'}
                        {autoPriority.priority === 'medium' && '📋'}
                        {autoPriority.priority === 'low' && '☕'}
                        {autoPriority.label}
                      </span>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {autoPriority.reason}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-foreground shrink-0 bg-background/80 px-2 py-1 rounded-md border border-border/60">
                      {autoPriority.slaText}
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground/80 mt-1 italic">
                    * Priority is automated based on safety policy & handled only by Admin / Warden.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Detailed Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Explain when the defect started, exact fixture location, and best time for technician visit..."
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.description && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Register Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confidential Warden Grievance Modal */}
      {isGrievanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-rose-500/30 bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Report Issue on Hostel Warden
                  </h3>
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Confidential to Chief Admin Only
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGrievanceModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-muted-foreground">
              <strong className="text-foreground">Student Protection Protocol:</strong> This report is securely stored and forwarded straight to the <strong>Campus Administrator</strong>. The warden will not be notified or have access to this portal.
            </div>

            <form onSubmit={handleGrievanceSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Your Hostel Block
                  </label>
                  <select
                    value={grievanceBlock}
                    onChange={(e) => setGrievanceBlock(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {HOSTEL_BLOCKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Your Room Number
                  </label>
                  <input
                    type="text"
                    value={grievanceRoom}
                    onChange={(e) => setGrievanceRoom(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-foreground">
                    Assigned Block Warden
                  </label>
                  <span className="rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold">
                    Locked to {grievanceBlock.split(' ')[0]} {grievanceBlock.split(' ')[1]}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/40">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {currentAssignedWarden.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {currentAssignedWarden.designation} &bull; {grievanceBlock}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground font-mono">
                    <p>{currentAssignedWarden.phone}</p>
                    <p className="truncate max-w-[140px]">{currentAssignedWarden.email}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 italic">
                  * Automatically selected based on your hostel block. Students cannot alter the designated warden.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nature of Grievance
                </label>
                <select
                  value={grievanceCategory}
                  onChange={(e) => setGrievanceCategory(e.target.value as GrievanceCategory)}
                  className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 capitalize"
                >
                  <option value="misconduct">Misconduct / Rude Behavior</option>
                  <option value="harassment">Harassment / Verbal Abuse</option>
                  <option value="negligence">Negligence / Inaction on Urgent Safety</option>
                  <option value="bias">Unfair Bias / Discriminatory Penalties</option>
                  <option value="unresponsiveness">Complete Unresponsiveness / Repeated Absence</option>
                  <option value="corruption">Financial or Mess Irregularities</option>
                  <option value="other">Other Violation of Campus Code</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Incident Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unfair gate penalty and refusal to accept valid leave slip"
                  value={grievanceSubject}
                  onChange={(e) => setGrievanceSubject(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Detailed Account of What Happened
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide precise details including date, time, words spoken, witnesses present, and how you were impacted..."
                  value={grievanceDesc}
                  onChange={(e) => setGrievanceDesc(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGrievanceModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grievanceMutation.isPending}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {grievanceMutation.isPending ? 'Transmitting...' : 'Submit Confidential Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
