import React, { useEffect, useState } from 'react'
import { Users, Shield, User, Building, Search, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import type { User as UserType, Role } from '@/lib/types'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAllUsers().then((res) => {
      setUsers(res)
      setLoading(false)
    }).catch(console.error)
  }, [])

  const columns: Column<UserType>[] = [
    {
      key: 'name',
      header: 'User Account',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={u.name} src={u.avatarUrl} size="sm" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</p>
            <p className="text-[11px] text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Assigned RBAC Roles',
      render: (u) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {u.roles.map((r) => (
            <Badge
              key={r}
              variant={r === 'admin' ? 'critical' : r === 'warden' ? 'warning' : 'pending'}
              size="sm"
              className="capitalize"
            >
              {r}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'activeRole',
      header: 'Current Active Role',
      sortable: true,
      render: (u) => (
        <Badge variant="success" size="sm" dot className="capitalize">
          {u.activeRole}
        </Badge>
      ),
    },
    {
      key: 'department',
      header: 'Department / Unit',
      render: (u) => <span className="text-slate-600 dark:text-slate-400">{u.department || 'General'}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (u) => <span className="font-mono text-[11px] text-slate-500">{u.phone || 'N/A'}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Users & Access Control
        </h1>
        <p className="text-xs text-slate-500">
          Manage system users, multi-role entitlements, and security authorization boundaries
        </p>
      </div>

      <DataTable
        data={users as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        isLoading={loading}
        pageSize={10}
        searchPlaceholder="Search user name, email, or role..."
      />
    </div>
  )
}
