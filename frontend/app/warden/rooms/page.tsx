'use client'

import React, { useState } from 'react'
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

export default function WardenRoomsPage() {
  const queryClient = useQueryClient()
  const [selectedBlockId, setSelectedBlockId] = useState('blk-a')
  const [selectedFloor, setSelectedFloor] = useState<number>(1)
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [allocatingStudentId, setAllocatingStudentId] = useState('')
  const [allocatingBed, setAllocatingBed] = useState('Bed 1')

  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['rooms', selectedBlockId, selectedFloor],
    queryFn: () => api.getRooms({ blockId: selectedBlockId, floor: selectedFloor }),
  })

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.getBlocks(),
  })

  const { data: unallocatedStudents = [] } = useQuery({
    queryKey: ['unallocated-students'],
    queryFn: () => api.getUnallocatedStudents(),
  })

  // Optimistic Allocate Room Mutation
  const allocateMutation = useMutation({
    mutationFn: ({ roomId, studentId, bed }: { roomId: string; studentId: string; bed: string }) =>
      api.allocateRoom(roomId, studentId, bed),
    onSuccess: (updatedRoom) => {
      toast.success(`Student assigned to Room ${updatedRoom.number} successfully!`)
      setActiveRoom(updatedRoom)
      setAllocatingStudentId('')
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['unallocated-students'] })
      queryClient.invalidateQueries({ queryKey: ['warden-students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to allocate student to room')
    },
  })

  // Deallocate mutation
  const deallocateMutation = useMutation({
    mutationFn: ({ roomId, studentId }: { roomId: string; studentId: string }) =>
      api.deallocateRoom(roomId, studentId),
    onSuccess: (updatedRoom) => {
      toast.success('Resident deallocated from room.')
      setActiveRoom(updatedRoom)
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['unallocated-students'] })
      queryClient.invalidateQueries({ queryKey: ['warden-students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to deallocate resident')
    },
  })

  const getStatusColor = (room: Room) => {
    if (room.status === 'maintenance') {
      return 'border-rose-500/40 bg-rose-500/10 text-rose-500 hover:border-rose-500'
    }
    if (room.occupied >= room.capacity) {
      return 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400 hover:border-indigo-500'
    }
    if (room.occupied > 0) {
      return 'border-saffron-500/40 bg-saffron-500/10 text-saffron-400 hover:border-saffron-500'
    }
    return 'border-border/80 bg-card hover:border-primary/50 text-muted-foreground'
  }

  const allBeds = ['Bed 1', 'Bed 2', 'Bed 3', 'Bed 4']
  const occupiedBeds = (activeRoom?.occupants || []).map((o) => o.bed)
  const vacantBeds = allBeds.filter((b) => !occupiedBeds.includes(b))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visual Floor Map & Room Allotment"
        subtitle="Interactive spatial grid of rooms across hostel blocks. Click any room tile to inspect occupants or assign beds."
      />

      {/* Block & Floor Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-3xl glass-card border border-border/80">
        {/* Floor Dropdown Control (1 Building: Block A - Newton, 5 Floors) */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary" />
            Floor Level:
          </label>
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(Number(e.target.value))}
            className="rounded-xl border border-input bg-card px-4 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shadow-sm"
          >
            {[1, 2, 3, 4, 5].map((fl) => (
              <option key={fl} value={fl}>
                Floor {fl} ({fl === 1 ? 'Ground Level' : `Level ${fl}`}) • 6 Rooms (24 Beds)
              </option>
            ))}
          </select>
        </div>

        {/* Quick Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="text-muted-foreground">Empty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-saffron-500" />
            <span className="text-muted-foreground">Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span className="text-muted-foreground">Full (4/4)</span>
          </div>
        </div>
      </div>

      {/* Visual Floor Grid (Rooms as Interactive Tiles) */}
      {isLoadingRooms ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {rooms.map((room) => {
            const isFull = room.occupied >= room.capacity
            const isPartial = room.occupied > 0 && !isFull

            return (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] shadow-sm ${getStatusColor(
                  room
                )}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-base font-black tracking-tight text-foreground">
                    {room.number}
                  </span>
                  <span className="text-[10px] font-bold uppercase rounded-md px-1.5 py-0.5 bg-background/60">
                    {room.type}
                  </span>
                </div>

                {/* Occupancy Indicator */}
                <div className="my-3 flex items-center gap-1.5">
                  {Array.from({ length: room.capacity }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-2 flex-1 rounded-full ${
                        idx < room.occupied
                          ? isFull
                            ? 'bg-indigo-500'
                            : 'bg-saffron-500'
                          : 'bg-muted/80'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>
                    {room.occupied}/{room.capacity} Beds
                  </span>
                  <StatusBadge status={room.status} showDot={false} />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Side Sheet Drawer for Room Allocation */}
      {activeRoom && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md h-full bg-card border-l border-border p-6 overflow-y-auto shadow-2xl animate-slide-up flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BedDouble className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Room {activeRoom.number} Details
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {activeRoom.blockName} • Floor {activeRoom.floor}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveRoom(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status & Capacity badge */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-muted/40 p-3 border border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Status
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={activeRoom.status} />
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/40 p-3 border border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Bed Allotment
                  </span>
                  <p className="mt-1 text-sm font-bold text-foreground font-mono">
                    {activeRoom.occupied} / {activeRoom.capacity} Occupied
                  </p>
                </div>
              </div>

              {/* Current Occupants List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Current Occupants
                </h4>

                {activeRoom.occupants.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center rounded-2xl bg-muted/30">
                    No residents currently assigned to this room.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeRoom.occupants.map((occ) => (
                      <div
                        key={occ.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/60"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={occ.avatar}
                            alt={occ.name}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                          />
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {occ.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {occ.rollNo} • {occ.bed}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            deallocateMutation.mutate({
                              roomId: activeRoom.id,
                              studentId: occ.id,
                            })
                          }
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                          title="Vacate resident"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign New Student Form */}
              {activeRoom.occupied < activeRoom.capacity && (
                <div className="rounded-2xl border border-dashed border-border p-4 space-y-3 bg-card/60">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Allot Resident to Bed
                  </h4>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Select Unallocated Student
                    </label>
                    <select
                      value={allocatingStudentId}
                      onChange={(e) => setAllocatingStudentId(e.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">Choose a student...</option>
                      {unallocatedStudents.length === 0 ? (
                        <option value="" disabled>No unallocated students available</option>
                      ) : (
                        unallocatedStudents.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.rollNo})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Target Bed
                    </label>
                    <select
                      value={allocatingBed}
                      onChange={(e) => setAllocatingBed(e.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {vacantBeds.length === 0 ? (
                        <option value="" disabled>No vacant beds in this room</option>
                      ) : (
                        vacantBeds.map((bedName) => (
                          <option key={bedName} value={bedName}>
                            {bedName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    disabled={!allocatingStudentId || allocateMutation.isPending}
                    onClick={() =>
                      allocateMutation.mutate({
                        roomId: activeRoom.id,
                        studentId: allocatingStudentId,
                        bed: allocatingBed,
                      })
                    }
                    className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                  >
                    {allocateMutation.isPending ? 'Assigning...' : 'Confirm Bed Allotment'}
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={() => setActiveRoom(null)}
                className="w-full rounded-xl bg-muted py-2 text-xs font-semibold text-foreground hover:bg-muted/80"
              >
                Close Drawer
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setActiveRoom(null)} />
        </div>
      )}
    </div>
  )
}
