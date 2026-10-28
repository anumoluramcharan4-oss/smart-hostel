import React, { useEffect, useState } from 'react'
import { DoorOpen, Search, Wrench, Download, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import type { Room } from '@/lib/types'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { exportToCsv } from '@/lib/utils/exportCsv'
import { getStatusBadgeVariant } from '@/lib/utils/formatters'

export const AdminRoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getRooms().then((res) => {
      setRooms(res)
      setLoading(false)
    }).catch(console.error)
  }, [])

  const columns: Column<Room>[] = [
    {
      key: 'roomNumber',
      header: 'Room Number',
      sortable: true,
      render: (r) => (
        <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
          {r.roomNumber}
        </span>
      ),
    },
    {
      key: 'blockName',
      header: 'Hostel Block',
      sortable: true,
      render: (r) => <span>{r.blockName}</span>,
    },
    {
      key: 'floor',
      header: 'Floor',
      sortable: true,
      render: (r) => <span>Floor {r.floor}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (r) => <span className="capitalize">{r.type} Sharing</span>,
    },
    {
      key: 'occupancy',
      header: 'Beds (Occupied / Cap)',
      render: (r) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {r.occupants.length} / {r.capacity} Beds
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => (
        <Badge variant={getStatusBadgeVariant(r.status)} size="sm">
          {r.status.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
  ]

  const handleExport = () => {
    exportToCsv('rooms_inventory', rooms, [
      { key: 'roomNumber', label: 'Room' },
      { key: 'blockName', label: 'Block' },
      { key: 'floor', label: 'Floor' },
      { key: 'type', label: 'Type' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'status', label: 'Status' },
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Rooms Master Directory
          </h1>
          <p className="text-xs text-slate-500">
            Comprehensive list of all {rooms.length} residential dorm rooms across campus
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Rooms CSV
        </Button>
      </div>

      <DataTable
        data={rooms as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        isLoading={loading}
        pageSize={12}
        searchPlaceholder="Search room number, block..."
      />
    </div>
  )
}
