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
} from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Student } from '@/lib/types'
import { formatINR } from '@/lib/utils'

export default function WardenStudentsPage() {
  const [selectedBlock, setSelectedBlock] = useState('all')
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('all')
  const [activeStudent, setActiveStudent] = useState<Student | null>(null)

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['warden-students', selectedBlock, selectedFeeStatus],
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
      header: 'Fee Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.feeStatus} />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setActiveStudent(row.original)
          }}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Inspect Student Record"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Residential Directory"
        subtitle="Browse all registered hostel residents, verify bed allotments, and inspect contact records."
      />

      {/* TanStack Data Table with Custom Filter Elements */}
      <DataTable
        columns={columns}
        data={students}
        isLoading={isLoading}
        searchPlaceholder="Filter by name, roll no, or room..."
        onRowClick={(student) => setActiveStudent(student)}
        filterElement={
          <div className="flex items-center gap-2">
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Blocks</option>
              <option value="Newton">Block A (Newton)</option>
              <option value="Aryabhata">Block B (Aryabhata)</option>
              <option value="Ramanujan">Block C (Ramanujan)</option>
              <option value="Kalam">Block D (Kalam)</option>
            </select>

            <select
              value={selectedFeeStatus}
              onChange={(e) => setSelectedFeeStatus(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Fee Statuses</option>
              <option value="paid">Fee Paid</option>
              <option value="pending">Fee Pending</option>
              <option value="overdue">Fee Overdue</option>
            </select>
          </div>
        }
      />

      {/* Student Details Drawer / Modal */}
      {activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-popover p-6 shadow-2xl animate-slide-up space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <img
                src={activeStudent.avatar}
                alt={activeStudent.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
              />
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground">
                  {activeStudent.name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {activeStudent.rollNo} • {activeStudent.course}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                <span className="text-muted-foreground">Allotted Room:</span>
                <span className="font-bold text-foreground">
                  {activeStudent.roomNumber} ({activeStudent.bedNumber})
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                <span className="text-muted-foreground">Block:</span>
                <span className="font-bold text-foreground">
                  {activeStudent.blockName}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                <span className="text-muted-foreground">Student Phone:</span>
                <span className="font-mono text-foreground">
                  {activeStudent.phone}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                <span className="text-muted-foreground">Guardian Contact:</span>
                <span className="font-mono text-foreground">
                  {activeStudent.guardianName} ({activeStudent.guardianPhone})
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                <span className="text-muted-foreground">Attendance:</span>
                <span className="font-bold text-emerald-500">
                  {activeStudent.attendancePercent}% Roll Attendance
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveStudent(null)}
              className="w-full mt-2 rounded-xl bg-muted py-2 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
