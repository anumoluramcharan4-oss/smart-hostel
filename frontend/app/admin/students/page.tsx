'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Building,
  GraduationCap,
  Eye,
  SlidersHorizontal,
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Student } from '@/lib/types'
import { formatINR } from '@/lib/utils'

export default function AdminStudentsPage() {
  const [selectedBlock, setSelectedBlock] = useState('all')
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('all')
  const [activeStudent, setActiveStudent] = useState<Student | null>(null)

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin-students-roster', selectedBlock, selectedFeeStatus],
    queryFn: () =>
      api.getStudents({
        block: selectedBlock,
        feeStatus: selectedFeeStatus,
      }),
  })

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'name',
      header: 'Resident Student',
      cell: ({ row }) => {
        const std = row.original
        return (
          <div className="flex items-center gap-3">
            <img
              src={std.avatar}
              alt={std.name}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-border shrink-0"
            />
            <div>
              <p className="font-semibold text-foreground text-xs sm:text-sm">
                {std.name}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                {std.rollNo}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'roomNumber',
      header: 'Room & Block',
      cell: ({ row }) => {
        const std = row.original
        return (
          <div>
            <span className="font-bold text-foreground text-xs sm:text-sm font-mono">
              {std.roomNumber}
            </span>
            <p className="text-[11px] text-muted-foreground">
              {std.bedNumber} • {std.blockName.split(' ')[0]}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'course',
      header: 'Academic Stream',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-medium text-foreground">
            {row.original.course}
          </span>
          <p className="text-[11px] text-muted-foreground">
            Year {row.original.year}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'attendancePercent',
      header: 'Attendance',
      cell: ({ row }) => {
        const pct = row.original.attendancePercent
        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs font-bold ${
                pct >= 90
                  ? 'text-emerald-500'
                  : pct >= 80
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }`}
            >
              {pct}%
            </span>
            <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pct >= 90
                    ? 'bg-emerald-500'
                    : pct >= 80
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'feeStatus',
      header: 'Fee Ledger',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.feeStatus}
          label={row.original.feeStatus.toUpperCase()}
        />
      ),
    },
    {
      accessorKey: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => setActiveStudent(row.original)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="View Student Dossier"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Student Residents Directory
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Institutional directory of all resident scholars, dorm assignments, and fee standings.
              </p>
            </div>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Dorm Blocks</option>
            <option value="Block A">Block A (Newton)</option>
            <option value="Block B">Block B (Aryabhata)</option>
            <option value="Block C">Block C (Ramanujan)</option>
            <option value="Block D">Block D (Kalam)</option>
          </select>

          <select
            value={selectedFeeStatus}
            onChange={(e) => setSelectedFeeStatus(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Fee Statuses</option>
            <option value="paid">Settled / Paid</option>
            <option value="pending">Due / Pending</option>
            <option value="overdue">Overdue / Flagged</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-card">
        <DataTable
          columns={columns}
          data={students}
          searchKey="name"
          searchPlaceholder="Search student by name, roll no, or room..."
          isLoading={isLoading}
        />
      </div>

      {/* Student Dossier Modal */}
      {activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-6 animate-slide-up">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={activeStudent.avatar}
                  alt={activeStudent.name}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
                />
                <div>
                  <h3 className="font-bold text-foreground text-base">
                    {activeStudent.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {activeStudent.rollNo} • {activeStudent.course} (Yr {activeStudent.year})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveStudent(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 p-3 rounded-xl bg-muted/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Room Allocation
                </span>
                <p className="font-semibold text-foreground">
                  {activeStudent.roomNumber} ({activeStudent.bedNumber})
                </p>
                <p className="text-muted-foreground">{activeStudent.blockName}</p>
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-muted/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Fee Status
                </span>
                <div className="pt-1">
                  <StatusBadge
                    status={activeStudent.feeStatus}
                    label={activeStudent.feeStatus.toUpperCase()}
                  />
                </div>
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-muted/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Phone &amp; Email
                </span>
                <p className="font-semibold text-foreground">{activeStudent.phone}</p>
                <p className="text-muted-foreground truncate">{activeStudent.email}</p>
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-muted/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Guardian Contact
                </span>
                <p className="font-semibold text-foreground">
                  {activeStudent.guardianName}
                </p>
                <p className="text-muted-foreground">{activeStudent.guardianPhone}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveStudent(null)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
