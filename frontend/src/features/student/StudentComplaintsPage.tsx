import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Search, MessageSquare, Send, Wrench, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { useToast } from '@/app/ToastContext'
import { api } from '@/lib/api'
import type { Complaint, ComplaintStatus } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Drawer'
import { Stepper } from '@/components/ui/Stepper'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatRelativeTime, formatDateTime, getStatusBadgeVariant, getPriorityBadgeVariant } from '@/lib/utils/formatters'

export const StudentComplaintsPage: React.FC = () => {
  const { user } = useAuth()
  const { success } = useToast()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | ComplaintStatus>('all')
  const [search, setSearch] = useState('')
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const fetchComplaints = async () => {
    if (!user) return
    try {
      const list = await api.getComplaints({ studentId: user.id })
      setComplaints(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [user])

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        c.title.toLowerCase().includes(q) ||
        c.ticketNumber.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedComplaint || !commentText.trim()) return

    setIsSubmittingComment(true)
    try {
      const updated = await api.addComplaintComment(selectedComplaint.id, commentText)
      setSelectedComplaint(updated)
      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setCommentText('')
      success('Comment added to complaint thread')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const getTimelineSteps = (complaint: Complaint) => {
    const statusOrder: ComplaintStatus[] = ['pending', 'in_progress', 'resolved']
    const currentIndex =
      complaint.status === 'resolved' || complaint.status === 'closed'
        ? 2
        : complaint.status === 'in_progress'
        ? 1
        : 0

    return {
      steps: [
        { id: '1', title: 'Ticket Logged', description: 'AI triage complete' },
        { id: '2', title: 'Staff Dispatched', description: complaint.assignedStaffName || 'Awaiting assignment' },
        { id: '3', title: 'Resolved', description: complaint.resolvedAt ? 'Confirmed by student' : 'Pending inspection' },
      ],
      currentIndex,
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            My Room Complaints
          </h1>
          <p className="text-xs text-slate-500">
            Track real-time progress, technician visits, and ticket history
          </p>
        </div>

        <Link to="/student/raise-complaint">
          <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Raise New Complaint
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['all', 'pending', 'in_progress', 'resolved'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search tickets or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Complaints List / Cards */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            title="No complaints matching your criteria"
            description="You don't have any complaints in this status filter."
            action={
              <Link to="/student/raise-complaint">
                <Button size="sm">Report an Issue Now</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((complaint) => {
            const { steps, currentIndex } = getTimelineSteps(complaint)
            return (
              <div
                key={complaint.id}
                onClick={() => setSelectedComplaint(complaint)}
                className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800 transition-all cursor-pointer shadow-sm hover:shadow-md space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                      {complaint.ticketNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {complaint.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityBadgeVariant(complaint.priority)} size="sm">
                      {complaint.priority.toUpperCase()}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(complaint.status)} size="sm">
                      {complaint.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {complaint.description}
                </p>

                {/* Progress Stepper Mini */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <Stepper steps={steps} currentStepIndex={currentIndex} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-1 gap-1">
                  <span>Category: <strong className="text-slate-700 dark:text-slate-300">{complaint.category} ({complaint.subItem})</strong></span>
                  {complaint.assignedStaffName ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Assigned: {complaint.assignedStaffName} ({complaint.assignedStaffContact})
                    </span>
                  ) : (
                    <span>Awaiting Staff Assignment</span>
                  )}
                  <span>Reported {formatRelativeTime(complaint.createdAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Complaint Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        title={selectedComplaint?.ticketNumber}
        description={`Logged on ${selectedComplaint ? formatDateTime(selectedComplaint.createdAt) : ''}`}
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-6 text-xs">
            {/* Badges & Meta */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                <div>
                  <Badge variant={getStatusBadgeVariant(selectedComplaint.status)}>
                    {selectedComplaint.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">AI Priority</span>
                <div>
                  <Badge variant={getPriorityBadgeVariant(selectedComplaint.priority)}>
                    {selectedComplaint.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {selectedComplaint.title}
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Assigned Staff Info */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                Assigned Maintenance Staff
              </span>
              {selectedComplaint.assignedStaffName ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{selectedComplaint.assignedStaffName}</p>
                      <p className="text-slate-400 text-[11px]">{selectedComplaint.assignedStaffContact}</p>
                    </div>
                  </div>
                  <Badge variant="success">Dispatched</Badge>
                </div>
              ) : (
                <p className="text-slate-500">Warden is currently triaging and assigning an available technician.</p>
              )}
            </div>

            {/* Progress Stepper Timeline */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                Resolution Timeline
              </span>
              <Stepper
                orientation="vertical"
                steps={selectedComplaint.timeline.map((t) => ({
                  id: t.id,
                  title: t.note,
                  description: `Updated by ${t.by}`,
                  date: formatDateTime(t.timestamp),
                }))}
                currentStepIndex={selectedComplaint.timeline.length - 1}
              />
            </div>

            {/* Comment Thread */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Discussion Thread ({selectedComplaint.comments.length})</span>
              </div>

              <div className="space-y-2.5 max-h-52 overflow-y-auto">
                {selectedComplaint.comments.length === 0 ? (
                  <p className="text-slate-400 italic py-2">No messages exchanged yet.</p>
                ) : (
                  selectedComplaint.comments.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {comm.senderName} ({comm.senderRole})
                        </span>
                        <span className="text-slate-400">{formatRelativeTime(comm.timestamp)}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{comm.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <Input
                  placeholder="Send a note to the warden/electrician..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmittingComment}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Reply
                </Button>
              </form>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
