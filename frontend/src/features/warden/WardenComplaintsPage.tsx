import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  Search,
  Filter,
  Wrench,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  Eye,
  ArrowUpDown,
  Download,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/app/ToastContext'
import type { Complaint, ComplaintPriority, ComplaintStatus, MaintenanceStaff } from '@/lib/types'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Stepper } from '@/components/ui/Stepper'
import { exportToCsv } from '@/lib/utils/exportCsv'
import { formatRelativeTime, formatDateTime, getPriorityBadgeVariant, getStatusBadgeVariant } from '@/lib/utils/formatters'

export const WardenComplaintsPage: React.FC = () => {
  const { success } = useToast()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [staffList, setStaffList] = useState<MaintenanceStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<'all' | ComplaintPriority>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ComplaintStatus>('all')
  const [commentText, setCommentText] = useState('')

  // Priority Override Modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
  const [overridePriorityVal, setOverridePriorityVal] = useState<ComplaintPriority>('critical')
  const [overrideReason, setOverrideReason] = useState('')

  const loadData = async () => {
    try {
      const [compRes, staffRes] = await Promise.all([
        api.getComplaints(),
        api.getStaff(),
      ])
      setComplaints(compRes)
      setStaffList(staffRes)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = complaints.filter((c) => {
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    return true
  })

  const handleAssignStaff = async (staffId: string) => {
    if (!selectedComplaint || !staffId) return
    const updated = await api.assignStaffToComplaint(selectedComplaint.id, staffId)
    setSelectedComplaint(updated)
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    success(`Assigned ticket to ${updated.assignedStaffName}`)
  }

  const handleUpdateStatus = async (newStatus: ComplaintStatus) => {
    if (!selectedComplaint) return
    const updated = await api.updateComplaintStatus(selectedComplaint.id, newStatus)
    setSelectedComplaint(updated)
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    success(`Ticket status updated to ${newStatus.replace('_', ' ').toUpperCase()}`)
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedComplaint || !commentText.trim()) return
    const updated = await api.addComplaintComment(selectedComplaint.id, commentText)
    setSelectedComplaint(updated)
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setCommentText('')
    success('Comment posted to student thread')
  }

  const handleConfirmOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedComplaint || !overrideReason.trim()) return
    const updated = await api.overridePriority(
      selectedComplaint.id,
      overridePriorityVal,
      overrideReason
    )
    setSelectedComplaint(updated)
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setIsOverrideModalOpen(false)
    setOverrideReason('')
    success(`Priority successfully overridden to ${overridePriorityVal.toUpperCase()}`)
  }

  const handleExport = () => {
    exportToCsv('complaints_triage', filtered, [
      { key: 'ticketNumber', label: 'Ticket' },
      { key: 'roomNumber', label: 'Room' },
      { key: 'studentName', label: 'Student' },
      { key: 'category', label: 'Category' },
      { key: 'title', label: 'Title' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'assignedStaffName', label: 'Assigned Staff' },
      { key: 'createdAt', label: 'Reported At' },
    ])
  }

  const columns: Column<Complaint>[] = [
    {
      key: 'ticketNumber',
      header: 'Ticket ID',
      sortable: true,
      render: (c) => (
        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
          {c.ticketNumber}
        </span>
      ),
    },
    {
      key: 'roomNumber',
      header: 'Room',
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{c.roomNumber}</span>
          <p className="text-[10px] text-slate-400">{c.studentName.split(' ')[0]}</p>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Complaint & Category',
      sortable: true,
      render: (c) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">{c.title}</p>
          <p className="text-[11px] text-slate-400">{c.category} • {c.subItem}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (c) => (
        <Badge variant={getPriorityBadgeVariant(c.priority)} size="sm">
          {c.priority.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (c) => (
        <Badge variant={getStatusBadgeVariant(c.status)} size="sm">
          {c.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'assignedStaffName',
      header: 'Technician',
      render: (c) => (
        <span className="text-slate-600 dark:text-slate-300">
          {c.assignedStaffName || <span className="text-amber-500 font-medium">Unassigned</span>}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Reported',
      sortable: true,
      render: (c) => <span className="text-slate-400 text-[11px]">{formatRelativeTime(c.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedComplaint(c)
          }}
          className="text-xs h-7 px-2"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          Triage
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Maintenance Triage Queue
          </h1>
          <p className="text-xs text-slate-500">
            AI-classified tickets, technician dispatching, and priority overrides ({complaints.length} tickets total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" />
          Filters:
        </span>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as 'all' | ComplaintPriority)}
          className="text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ComplaintStatus)}
          className="text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Main Table */}
      <DataTable
        data={filtered as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        isLoading={loading}
        pageSize={10}
        searchPlaceholder="Search complaint ticket, room, title..."
        onRowClick={(row) => setSelectedComplaint(row as unknown as Complaint)}
      />

      {/* Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        title={selectedComplaint?.ticketNumber}
        description={`Reported by ${selectedComplaint?.studentName} (${selectedComplaint?.roomNumber})`}
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-6 text-xs">
            {/* Header controls: Status and Priority */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Update Status</span>
                <select
                  value={selectedComplaint.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as ComplaintStatus)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Priority</span>
                  <button
                    type="button"
                    onClick={() => setIsOverrideModalOpen(true)}
                    className="text-[10px] text-indigo-600 font-bold hover:underline"
                  >
                    Override
                  </button>
                </div>
                <Badge variant={getPriorityBadgeVariant(selectedComplaint.priority)} className="w-full justify-center">
                  {selectedComplaint.priority.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedComplaint.title}</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Staff Assignment Section */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  Dispatch Technician
                </span>
                {selectedComplaint.assignedStaffName && (
                  <span className="text-[11px] text-emerald-600 font-medium">Currently: {selectedComplaint.assignedStaffName}</span>
                )}
              </div>

              <select
                value={selectedComplaint.assignedStaffId || ''}
                onChange={(e) => handleAssignStaff(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Choose maintenance staff member --</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.category}) — Active: {st.activeTasks} tasks • Rating: {st.rating}★
                  </option>
                ))}
              </select>
            </div>

            {/* Timeline Stepper */}
            <div className="space-y-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                Audit Timeline
              </span>
              <Stepper
                orientation="vertical"
                steps={selectedComplaint.timeline.map((t) => ({
                  id: t.id,
                  title: t.note,
                  description: `Logged by ${t.by}`,
                  date: formatDateTime(t.timestamp),
                }))}
                currentStepIndex={selectedComplaint.timeline.length - 1}
              />
            </div>

            {/* Discussion Thread */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Staff / Student Chat Thread
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedComplaint.comments.length === 0 ? (
                  <p className="text-slate-400 italic py-1">No comments posted yet.</p>
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

              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <Input
                  placeholder="Reply to student as Warden..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <Button type="submit" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
                  Post
                </Button>
              </form>
            </div>
          </div>
        )}
      </Drawer>

      {/* Priority Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Override AI Ticket Priority"
        description="Override will be permanently recorded in the complaint audit trail."
        maxWidth="sm"
      >
        <form onSubmit={handleConfirmOverride} className="space-y-4">
          <Select
            label="New Urgency Priority"
            value={overridePriorityVal}
            onChange={(e) => setOverridePriorityVal(e.target.value as ComplaintPriority)}
            options={[
              { value: 'critical', label: 'Critical (2hr SLA)' },
              { value: 'high', label: 'High (12hr SLA)' },
              { value: 'medium', label: 'Medium (48hr SLA)' },
              { value: 'low', label: 'Low (72hr SLA)' },
            ]}
          />

          <Textarea
            label="Reason for Override"
            rows={3}
            placeholder="Explain why the AI classification is being adjusted..."
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!overrideReason.trim()}>
              Confirm Override
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
