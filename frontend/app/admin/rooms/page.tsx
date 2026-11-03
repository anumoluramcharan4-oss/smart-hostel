'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  BedDouble,
  Building,
  Users,
  UserPlus,
  UserMinus,
  Check,
  X,
  Layers,
  Wrench,
  Search,
} from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Room, Student } from '@/lib/types'

export default function AdminRoomsPage() {
  const queryClient = useQueryClient()
  const [selectedFloor, setSelectedFloor] = useState<number>(1)
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [allocatingStudentId, setAllocatingStudentId] = useState('')
  const [allocatingBed, setAllocatingBed] = useState('Bed 1')
  const [confirmDeallocate, setConfirmDeallocate] = useState<{
    studentId: string
    name: string
    bed: string
    roomNumber: string
    reason: string
  } | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['admin-rooms', selectedFloor],
    queryFn: () => api.getRooms({ floor: selectedFloor }),
  })

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.getBlocks(),
  })

  const { data: allStudents = [] } = useQuery({
    queryKey: ['admin-students-for-allotment'],
    queryFn: () => api.getStudents(),
  })

  // Vacant beds in the active modal room
  const vacantBeds = useMemo(() => {
    if (!activeRoom) return []
    const occupied = (activeRoom.occupants || []).map((o) => o.bed)
    const all = Array.from({ length: activeRoom.capacity || 4 }, (_, i) => `Bed ${i + 1}`)
    return all.filter((b) => !occupied.includes(b))
  }, [activeRoom])

  // Filter unallocated students (students with no active room/bed assignment)
  const unallocatedStudents = useMemo(() => {
    return allStudents.filter((s) => !s.roomNumber || s.roomNumber.trim() === '')
  }, [allStudents])

  // Set default bed when room opens or vacant beds change
  useEffect(() => {
    if (vacantBeds.length > 0 && !vacantBeds.includes(allocatingBed)) {
      setAllocatingBed(vacantBeds[0])
    }
  }, [vacantBeds, allocatingBed])

  // Allocate Room Mutation
  const allocateMutation = useMutation({
    mutationFn: ({ roomId, studentId, bed }: { roomId: string; studentId: string; bed: string }) =>
      api.allocateRoom(roomId, studentId, bed),
    onSuccess: (updatedRoom) => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['admin-students-for-allotment'] })
      queryClient.invalidateQueries({ queryKey: ['admin-students-roster'] })
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-live-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      setActiveRoom(updatedRoom)
      setAllocatingStudentId('')
      toast.success('Bed successfully assigned to resident')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Room allocation failed')
    },
  })

  const { data: roomHistory = [] } = useQuery({
    queryKey: ['room-history', activeRoom?.id],
    queryFn: () => (activeRoom ? api.getRoomHistory(activeRoom.id) : Promise.resolve([])),
    enabled: Boolean(activeRoom && showHistory),
  })

  // Deallocate Room Mutation
  const deallocateMutation = useMutation({
    mutationFn: ({ roomId, studentId, reason }: { roomId: string; studentId: string; reason?: string }) =>
      api.deallocateRoom(roomId, studentId, reason),
    onSuccess: (updatedRoom) => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['admin-students-for-allotment'] })
      queryClient.invalidateQueries({ queryKey: ['admin-students-roster'] })
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-live-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['room-history'] })

      setActiveRoom(updatedRoom)
      setConfirmDeallocate(null)
      toast.success('Student deallocated from room successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Deallocation failed')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <BedDouble className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Room Allocation &amp; Floor Map
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Block A (Newton) • 5 Floors • 30 Rooms • 120 Beds • Quad Occupancy
              </p>
            </div>
          </div>
        </div>

        {/* Floor Dropdown Selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="floor-select" className="text-xs font-bold text-foreground">
            Select Floor:
          </label>
          <select
            id="floor-select"
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(Number(e.target.value))}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <option value={1}>Floor 1 (Rooms A-101 to A-106)</option>
            <option value={2}>Floor 2 (Rooms A-201 to A-206)</option>
            <option value={3}>Floor 3 (Rooms A-301 to A-306)</option>
            <option value={4}>Floor 4 (Rooms A-401 to A-406)</option>
            <option value={5}>Floor 5 (Rooms A-501 to A-506)</option>
          </select>
        </div>
      </div>

      {/* Grid of Rooms (Exactly 6 rooms per floor) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {rooms.map((room) => {
          const isFull = room.occupied >= room.capacity
          const hasMaintenance = room.status === 'maintenance'

          return (
            <div
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`rounded-2xl border p-4 transition-all cursor-pointer hover:shadow-card group relative ${
                hasMaintenance
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : isFull
                  ? 'border-border bg-card hover:border-primary/50'
                  : 'border-primary/40 bg-primary/5 hover:border-primary/70'
              }`}
            >
              <div className="flex items-start justify-between pb-3 border-b border-border">
                <div>
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    Room {room.number}
                  </h4>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {room.type} (4 Beds)
                  </p>
                </div>
                <StatusBadge
                  status={room.status}
                  label={
                    isFull
                      ? 'FULL'
                      : room.status === 'available'
                      ? `${room.capacity - room.occupied} VACANT`
                      : 'MAINT'
                  }
                />
              </div>

              {/* Occupant Slots (4 Beds) */}
              <div className="py-3 space-y-1.5">
                {Array.from({ length: room.capacity || 4 }).map((_, idx) => {
                  const occupant = (room.occupants || [])[idx]
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-background/60 border border-border/40"
                    >
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Bed {idx + 1}
                      </span>
                      {occupant ? (
                        <span className="font-semibold text-foreground truncate max-w-[100px]" title={occupant.name}>
                          {occupant.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                          Vacant
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
                <span>{room.occupied}/{room.capacity} Beds</span>
                <span className="text-primary font-bold group-hover:underline">
                  Manage &rarr;
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Room Detail & Allocation Modal */}
      {activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-foreground text-base">
                  Manage Room {activeRoom.number}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Floor {activeRoom.floor} • Quad Room ({activeRoom.occupied}/{activeRoom.capacity} Beds Occupied)
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveRoom(null)
                  setAllocatingStudentId('')
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing Occupants */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Current Residents ({activeRoom.occupants.length}/{activeRoom.capacity})
              </h4>
              {activeRoom.occupants.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 italic">
                  No occupants assigned. Room is completely vacant.
                </p>
              ) : (
                <div className="divide-y divide-border rounded-xl border border-border bg-muted/20">
                  {activeRoom.occupants.map((occ) => (
                    <div
                      key={occ.id}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-foreground">{occ.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {occ.bed} • Roll No: {occ.rollNo || occ.id} • {occ.course}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setConfirmDeallocate({
                            studentId: occ.id,
                            name: occ.name,
                            bed: occ.bed,
                            roomNumber: activeRoom.number,
                            reason: '',
                          })
                        }
                        disabled={deallocateMutation.isPending}
                        className="px-2.5 py-1 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-[11px] font-semibold transition"
                      >
                        Deallocate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Room Full Banner OR Allocation Form */}
            {activeRoom.occupied >= activeRoom.capacity ? (
              <div className="rounded-xl border border-border/80 bg-muted/40 p-4 text-center space-y-1">
                <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  Room is full (4/4 beds occupied)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Deallocate a resident above or transfer them to assign a new student to this room.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-2 border-t border-border">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Allocate New Student to Vacant Bed
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Select Student
                    </label>
                    <select
                      value={allocatingStudentId}
                      onChange={(e) => setAllocatingStudentId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-semibold"
                    >
                      <option value="">Choose resident...</option>
                      {unallocatedStudents.length === 0 ? (
                        <option value="" disabled>No unallocated students (100% full)</option>
                      ) : (
                        unallocatedStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.rollNo || s.id})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Target Bed
                    </label>
                    <select
                      value={allocatingBed}
                      onChange={(e) => setAllocatingBed(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-semibold"
                    >
                      {vacantBeds.length === 0 ? (
                        <option value="" disabled>No vacant beds</option>
                      ) : (
                        vacantBeds.map((bed) => (
                          <option key={bed} value={bed}>
                            {bed} (Vacant)
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!allocatingStudentId || !allocatingBed || allocateMutation.isPending}
                  onClick={() =>
                    allocateMutation.mutate({
                      roomId: activeRoom.id,
                      studentId: allocatingStudentId,
                      bed: allocatingBed,
                    })
                  }
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {allocateMutation.isPending ? 'Allocating...' : 'Confirm Bed Allocation'}
                </button>
              </div>
            )}

            {/* Audit History Toggle */}
            <div className="pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowHistory((prev) => !prev)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                {showHistory ? 'Hide Allocation History' : 'View Room Allocation History & Audit Log →'}
              </button>

              {showHistory && (
                <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-border bg-muted/20 p-2 space-y-2">
                  {roomHistory.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-2">
                      No recent allocation actions recorded for this room.
                    </p>
                  ) : (
                    roomHistory.map((h) => (
                      <div key={h.id} className="text-[11px] p-2 rounded-lg bg-card border border-border/50">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="capitalize text-foreground font-bold">
                            {h.action}: {h.studentName} ({h.bedNumber})
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {h.timestamp ? new Date(h.timestamp).toLocaleDateString() : ''}
                          </span>
                        </div>
                        {h.reason && <p className="text-muted-foreground text-[10px] mt-0.5">Reason: {h.reason}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Confirmation Dialog for Deallocation */}
            {confirmDeallocate && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xl animate-scale-in">
                  <h4 className="text-sm font-bold text-foreground">
                    Confirm Resident Removal
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Remove <strong className="text-foreground">{confirmDeallocate.name}</strong> from Room <strong className="text-foreground">{confirmDeallocate.roomNumber}</strong> {confirmDeallocate.bed}?
                  </p>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Reason (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. End of term / room transfer / withdrew"
                      value={confirmDeallocate.reason}
                      onChange={(e) =>
                        setConfirmDeallocate((prev) => prev ? { ...prev, reason: e.target.value } : null)
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeallocate(null)}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deallocateMutation.isPending}
                      onClick={() =>
                        deallocateMutation.mutate({
                          roomId: activeRoom.id,
                          studentId: confirmDeallocate.studentId,
                          reason: confirmDeallocate.reason,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
                    >
                      {deallocateMutation.isPending ? 'Removing...' : 'Confirm Remove'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
