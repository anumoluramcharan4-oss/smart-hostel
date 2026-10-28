import React, { useEffect, useState } from 'react'
import { AlertCircle, Download, Clock, CheckCircle2, ShieldCheck, Filter } from 'lucide-react'
import { api } from '@/lib/api'
import type { Complaint } from '@/lib/types'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { exportToCsv } from '@/lib/utils/exportCsv'
import { formatRelativeTime, formatDate, getPriorityBadgeVariant, getStatusBadgeVariant } from '@/lib/utils/formatters'

export const AdminComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getComplaints().then((res) => {
      setComplaints(res)
      setLoading(false)
    }).catch(console.error)
  }, [])

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
      header: 'Room & Block',
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{c.roomNumber}</span>
          <p className="text-[10px] text-slate-400">{c.blockName.split(' ')[0]}</p>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Complaint & Category',
      sortable: true,
      render: (c) => (
        <div className="max-w-xs">
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{c.title}</p>
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
  ]

  const handleExport = () => {
    exportToCsv('campus_complaints_sla_log', complaints, [
      { key: 'ticketNumber', label: 'Ticket' },
      { key: 'roomNumber', label: 'Room' },
      { key: 'blockName', label: 'Block' },
      { key: 'studentName', label: 'Student' },
      { key: 'category', label: 'Category' },
      { key: 'title', label: 'Title' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'assignedStaffName', label: 'Technician' },
      { key: 'createdAt', label: 'Reported At' },
      { key: 'resolvedAt', label: 'Resolved At' },
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Complaints & SLA Operations
          </h1>
          <p className="text-xs text-slate-500">
            Campus-wide maintenance performance oversight and turnaround times ({complaints.length} tickets recorded)
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export SLA Audit CSV
        </Button>
      </div>

      <DataTable
        data={complaints as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        isLoading={loading}
        pageSize={12}
        searchPlaceholder="Search ticket number, room, student, category..."
      />
    </div>
  )
}
