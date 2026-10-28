import React, { useEffect, useState } from 'react'
import { DoorOpen, Users, Wrench, CheckCircle2, AlertTriangle, ShieldCheck, Mail, Phone } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/app/ToastContext'
import type { Room, Block } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'

export const WardenRoomsPage: React.FC = () => {
  const { success } = useToast()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string>('block-a')
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all')
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [blocksRes, roomsRes] = await Promise.all([
        api.getBlocks(),
        api.getRooms(),
      ])
      setBlocks(blocksRes)
      setRooms(roomsRes)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredRooms = rooms.filter((r) => {
    if (r.blockId !== selectedBlockId) return false
    if (floorFilter !== 'all' && r.floor !== floorFilter) return false
    return true
  })

  const handleToggleMaintenance = async () => {
    if (!selectedRoom) return
    const newStatus = selectedRoom.status === 'maintenance' ? 'available' : 'maintenance'
    const updated = await api.updateRoomStatus(selectedRoom.id, newStatus)
    setSelectedRoom(updated)
    setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    success(`Room ${updated.roomNumber} status set to ${newStatus.toUpperCase()}`)
  }

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available':
        return 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20'
      case 'partially_occupied':
        return 'border-amber-300 bg-amber-50/50 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
      case 'maintenance':
        return 'border-rose-300 bg-rose-50/50 hover:bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20'
      case 'occupied':
      default:
        return 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Room Occupancy & Asset Grid
        </h1>
        <p className="text-xs text-slate-500">
          Visual block hierarchy, floor plans, bed capacity, and maintenance locks
        </p>
      </div>

      {/* Block Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {blocks.map((blk) => {
          const isSelected = blk.id === selectedBlockId
          return (
            <div
              key={blk.id}
              onClick={() => setSelectedBlockId(blk.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{blk.name}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{blk.roomsCount} Rooms • {blk.floorsCount} Floors</p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Occupancy:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {blk.occupied} / {blk.capacity} Beds
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floor Filter Controls & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 mr-1">Floor:</span>
          {(['all', 1, 2, 3, 4] as const).map((f) => (
            <button
              key={String(f)}
              type="button"
              onClick={() => setFloorFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                floorFilter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              {f === 'all' ? 'All Floors' : `Floor ${f}`}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Partially Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            Full Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Maintenance
          </span>
        </div>
      </div>

      {/* Occupancy Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {filteredRooms.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedRoom(r)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-sm hover:scale-[1.02] flex flex-col justify-between h-28 ${getStatusColor(
                r.status
              )}`}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                  {r.roomNumber}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  F{r.floor}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  <span>{r.occupants.length}/{r.capacity} Beds</span>
                  <span className="capitalize text-[10px]">{r.type}</span>
                </div>

                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    style={{ width: `${(r.occupants.length / r.capacity) * 100}%` }}
                    className={`h-full ${
                      r.status === 'maintenance'
                        ? 'bg-rose-500'
                        : r.occupants.length === r.capacity
                        ? 'bg-slate-400'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedRoom)}
        onClose={() => setSelectedRoom(null)}
        title={`Room ${selectedRoom?.roomNumber}`}
        description={`${selectedRoom?.blockName} • Floor ${selectedRoom?.floor} • ${selectedRoom?.capacity}-Bed Capacity`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant={selectedRoom?.status === 'maintenance' ? 'outline' : 'danger'}
              size="sm"
              onClick={handleToggleMaintenance}
              leftIcon={<Wrench className="w-3.5 h-3.5" />}
            >
              {selectedRoom?.status === 'maintenance' ? 'Clear Maintenance Lock' : 'Mark Under Maintenance'}
            </Button>
            <Button size="sm" onClick={() => setSelectedRoom(null)}>
              Done
            </Button>
          </div>
        }
      >
        {selectedRoom && (
          <div className="space-y-6 text-xs">
            {/* Status Strip */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Operational Status:</span>
              <Badge
                variant={
                  selectedRoom.status === 'available'
                    ? 'success'
                    : selectedRoom.status === 'maintenance'
                    ? 'critical'
                    : selectedRoom.status === 'partially_occupied'
                    ? 'warning'
                    : 'pending'
                }
              >
                {selectedRoom.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Occupants List */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Registered Occupants ({selectedRoom.occupants.length}/{selectedRoom.capacity})
              </h4>

              {selectedRoom.occupants.length === 0 ? (
                <p className="text-slate-400 italic py-2">No students currently allocated to this room.</p>
              ) : (
                selectedRoom.occupants.map((occ) => (
                  <div
                    key={occ.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={occ.name} size="sm" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{occ.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{occ.studentId}</p>
                        <p className="text-[10px] text-slate-400">{occ.phone}</p>
                      </div>
                    </div>
                    <Badge variant="neutral">{occ.bedNumber}</Badge>
                  </div>
                ))
              )}
            </div>

            {/* Room Assets */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Fittings & Amenity Status
              </h4>
              <div className="space-y-2">
                {selectedRoom.amenities.map((am, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span>{am.name}</span>
                    <Badge
                      variant={
                        am.condition === 'good'
                          ? 'success'
                          : am.condition === 'fair'
                          ? 'warning'
                          : 'critical'
                      }
                      size="sm"
                    >
                      {am.condition}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
