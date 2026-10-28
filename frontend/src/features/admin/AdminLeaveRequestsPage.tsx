import React, { useEffect, useState } from 'react'
import { Calendar, Download, Search } from 'lucide-react'
import { api } from '@/lib/api'
import type { LeaveRequest } from '@/lib/types'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { exportToCsv } from '@/lib/utils/exportCsv'
import { formatDate, getStatusBadgeVariant } from '@/lib/utils/formatters'

export const AdminLeaveRequestsPage: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getLeaves().then((data) => {
      setLeaves(data)
      setLoading(false)
    }).catch(console.error)
  }, [])

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'studentName',
      header: 'Student Name',
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
      header: 'Type',
      sortable: true,
      render: (l) => (
        <Badge variant="pending" size="sm" className="capitalize">
          {l.type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'startDate',
      header: 'Travel Dates',
      sortable: true,
      render: (l) => <span>{formatDate(l.startDate)} → {formatDate(l.endDate)}</span>,
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (l) => <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">{l.destination}</span>,
    },
    {
      key: 'status',
      header: 'Review Status',
      sortable: true,
      render: (l) => (
        <Badge variant={getStatusBadgeVariant(l.status)} size="sm">
          {l.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'reviewedBy',
      header: 'Warden Officer',
      render: (l) => (
        <span className="text-slate-500 text-[11px]">
          {l.reviewedBy ? l.reviewedBy : <span className="text-amber-500">Pending</span>}
        </span>
      ),
    },
  ]

  const handleExport = () => {
    exportToCsv('campus_leave_audit', leaves, [
      { key: 'studentName', label: 'Student' },
      { key: 'roomNumber', label: 'Room' },
      { key: 'blockName', label: 'Block' },
      { key: 'type', label: 'Type' },
      { key: 'startDate', label: 'Departure' },
      { key: 'endDate', label: 'Return' },
      { key: 'status', label: 'Status' },
      { key: 'destination', label: 'Destination' },
      { key: 'reviewedBy', label: 'Approved By' },
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Student Outpasses & Leave Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Campus security audit trail of student outpass records and overnight leaves
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Travel Ledger CSV
        </Button>
      </div>

      <DataTable
        data={leaves as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        isLoading={loading}
        pageSize={12}
        searchPlaceholder="Search student, room, destination..."
      />
    </div>
  )
}
