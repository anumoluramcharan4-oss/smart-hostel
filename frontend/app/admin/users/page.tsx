'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Users, UserPlus, Eye, Shield, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Student } from '@/lib/types'

export default function AdminUsersPage() {
  const [selectedRole, setSelectedRole] = useState('all')

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.getStudents(),
  })

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'name',
      header: 'Resident / User',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img
            src={row.original.avatar}
            alt={row.original.name}
            className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
          />
          <div>
            <p className="font-semibold text-foreground text-xs sm:text-sm">
              {row.original.name}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">
              {row.original.rollNo}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email / Phone',
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-mono text-foreground">{row.original.email}</p>
          <p className="text-[11px] text-muted-foreground">{row.original.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'blockName',
      header: 'Assigned Quarters',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-foreground text-xs sm:text-sm font-mono">
            {row.original.roomNumber}
          </span>
          <p className="text-[11px] text-muted-foreground">
            {row.original.blockName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'course',
      header: 'Course & Year',
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
      accessorKey: 'feeStatus',
      header: 'Account Status',
      cell: ({ row }) => <StatusBadge status={row.original.feeStatus} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus User & Resident Directory"
        subtitle="Manage master student records, room allotments, and authentication credentials."
      />

      <DataTable
        columns={columns}
        data={students}
        isLoading={isLoading}
        searchPlaceholder="Search by name, roll number, or room..."
      />
    </div>
  )
}
