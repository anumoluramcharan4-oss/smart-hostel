'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import {
  CreditCard,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { StatCard } from '@/components/common/StatCard'
import { FeeRecord } from '@/lib/types'
import { formatINR, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminFeesPage() {
  const [selectedStatus, setSelectedStatus] = useState('all')

  const { data: fees = [], isLoading } = useQuery({
    queryKey: ['admin-fees', selectedStatus],
    queryFn: () => api.getFees({ status: selectedStatus }),
  })

  const columns: ColumnDef<FeeRecord>[] = [
    {
      accessorKey: 'studentName',
      header: 'Resident / Student',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-foreground text-xs sm:text-sm">
            {row.original.studentName}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {row.original.rollNo} • Room {row.original.roomNumber}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Invoice Description',
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium text-foreground">{row.original.title}</p>
          <span className="text-[11px] text-muted-foreground">{row.original.semester}</span>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount (INR)',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground text-xs sm:text-sm">
          {formatINR(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-mono">
          {formatDate(row.original.dueDate)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Payment Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Receipt',
      cell: ({ row }) => (
        <button
          onClick={() =>
            toast.success(`Exporting Invoice receipt ${row.original.receiptNumber || 'RCP-PENDING'}`)
          }
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Download Receipt"
        >
          <Download className="h-4 w-4" />
        </button>
      ),
    },
  ]

  const totalCollected = 13850000
  const totalPending = 1580000

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Treasury & Fee Management"
        subtitle="Track semester residential fees, mess deposits, payment receipts, and automated overdue reminders."
      >
        <button
          onClick={() => toast.success('Dispatched overdue reminders via SMS & Email to 28 students')}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
        >
          <AlertCircle className="h-4 w-4" />
          Send Batch Overdue Notices
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Collected Fees"
          value={formatINR(totalCollected)}
          numericValue={totalCollected}
          prefix="₹"
          trend={{ value: 14.2, label: 'on-time settlement' }}
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          iconBg="from-emerald-500/20 to-teal-500/10"
        />
        <StatCard
          title="Outstanding Dues"
          value={formatINR(totalPending)}
          numericValue={totalPending}
          prefix="₹"
          trend={{ value: -6.5, label: 'vs last month', isPositiveGood: false }}
          icon={Clock}
          iconColor="text-rose-500"
          iconBg="from-rose-500/20 to-amber-500/10"
        />
        <StatCard
          title="Collection Rate"
          value="94.2%"
          numericValue={94}
          suffix="%"
          icon={TrendingUp}
          iconColor="text-primary"
          iconBg="from-primary/20 to-indigo-500/10"
        />
      </div>

      <DataTable
        columns={columns}
        data={fees}
        isLoading={isLoading}
        searchPlaceholder="Filter invoices by student name, roll no, or room..."
        filterElement={
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">All Invoices</option>
            <option value="paid">Settled / Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue Notice</option>
          </select>
        }
      />
    </div>
  )
}
