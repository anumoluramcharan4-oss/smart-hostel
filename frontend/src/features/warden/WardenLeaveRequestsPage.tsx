import React, { useEffect, useState } from 'react'
import { Calendar, Search, CheckCircle2, XCircle, MapPin, Phone, Eye, Download } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/app/ToastContext'
import type { LeaveRequest, LeaveStatus } from '@/lib/types'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { exportToCsv } from '@/lib/utils/exportCsv'
import { formatDate, getStatusBadgeVariant } from '@/lib/utils/formatters'

export const WardenLeaveRequestsPage: React.FC = () => {
  const { success } = useToast()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('pending')

  // Review Modal
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null)
  const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadLeaves = async () => {
    try {
      const data = await api.getLeaves()
      setLeaves(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaves()
  }, [])

  const filtered = leaves.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    return true
  })

  const handleOpenReview = (leave: LeaveRequest, action: 'approved' | 'rejected') => {
    setSelectedLeave(leave)
    setActionType(action)
    setRejectionReason('')
  }

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLeave) return

    setIsSubmitting(true)
    try {
      const updated = await api.reviewLeave(
        selectedLeave.id,
        actionType,
        actionType === 'rejected' ? rejectionReason : undefined
      )
      setLeaves((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      setSelectedLeave(null)
      success(`Leave request ${actionType.toUpperCase()}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = () => {
    exportToCsv('leaves_register', filtered, [
      { key: 'studentName', label: 'Student' },
      { key: 'roomNumber', label: 'Room' },
      { key: 'blockName', label: 'Block' },
      { key: 'type', label: 'Type' },
      { key: 'startDate', label: 'Departure' },
      { key: 'endDate', label: 'Return' },
      { key: 'status', label: 'Status' },
      { key: 'destination', label: 'Destination' },
      { key: 'parentContact', label: 'Guardian Phone' },
    ])
  }

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'studentName',
      header: 'Student & Room',
      sortable: true,
      render: (l) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{l.studentName}</p>
          <p className="text-[11px] text-slate-400 font-mono">{l.roomNumber} ({l.blockName.split(' ')[0]})</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Leave Type',
      sortable: true,
      render: (l) => (
        <Badge variant="pending" size="sm" className="uppercase font-semibold text-[10px]">
          {l.type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'startDate',
      header: 'Travel Dates',
      sortable: true,
      render: (l) => (
        <span className="text-slate-700 dark:text-slate-300 font-medium">
          {formatDate(l.startDate)} → {formatDate(l.endDate)}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Purpose / Destination',
      render: (l) => (
        <div className="max-w-xs">
          <p className="truncate font-medium text-slate-800 dark:text-slate-200">{l.reason}</p>
          <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
            {l.destination}
          </p>
        </div>
      ),
    },
    {
      key: 'parentContact',
      header: 'Parent Consent',
      render: (l) => (
        <div className="text-[11px]">
          <span className="font-mono text-slate-700 dark:text-slate-300">{l.parentContact}</span>
          <p className={l.parentInformed ? 'text-emerald-600 font-medium' : 'text-rose-500'}>
            {l.parentInformed ? '✓ Verified' : '⚠ Unverified'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (l) => (
        <Badge variant={getStatusBadgeVariant(l.status)} size="sm">
          {l.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (l) => (
        <div className="flex items-center gap-1.5">
          {l.status === 'pending' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-rose-600 hover:bg-rose-50 h-7 text-xs px-2"
                onClick={() => handleOpenReview(l, 'rejected')}
              >
                Reject
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => handleOpenReview(l, 'approved')}
              >
                Approve
              </Button>
            </>
          ) : (
            <span className="text-[11px] text-slate-400">
              {l.reviewedBy ? `By ${l.reviewedBy.split(' ')[0]}` : 'Done'}
            </span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Leave & Outpass Approvals
          </h1>
          <p className="text-xs text-slate-500">
            Review student travel permissions, verify parent consent, and authorize gate passes
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Register CSV
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
            }`}
          >
            {s} ({leaves.filter((l) => (s === 'all' ? true : l.status === s)).length})
          </button>
        ))}
      </div>

      <DataTable
        data={filtered as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        isLoading={loading}
        pageSize={10}
        searchPlaceholder="Search student, room, destination..."
      />

      {/* Review Modal */}
      <Modal
        isOpen={Boolean(selectedLeave)}
        onClose={() => setSelectedLeave(null)}
        title={`${actionType === 'approved' ? 'Approve' : 'Reject'} Outpass Application`}
        description={`Applicant: ${selectedLeave?.studentName} (${selectedLeave?.roomNumber})`}
        maxWidth="sm"
      >
        {selectedLeave && (
          <form onSubmit={handleConfirmReview} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <p><strong>Travel Dates:</strong> {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}</p>
              <p><strong>Destination:</strong> {selectedLeave.destination}</p>
              <p><strong>Purpose:</strong> "{selectedLeave.reason}"</p>
            </div>

            {actionType === 'rejected' && (
              <Textarea
                label="Reason for Rejection"
                rows={3}
                placeholder="State why this leave cannot be granted (visible to student)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedLeave(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant={actionType === 'rejected' ? 'danger' : 'primary'}
                isLoading={isSubmitting}
              >
                Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
