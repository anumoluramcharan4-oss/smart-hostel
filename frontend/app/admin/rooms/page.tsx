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

export default function AdminRoomsPage() {
  const queryClient = useQueryClient()
  const [selectedBlockId, setSelectedBlockId] = useState('blk-a')
  const [selectedFloor, setSelectedFloor] = useState<number>(1)
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [allocatingStudentId, setAllocatingStudentId] = useState('')
  const [allocatingBed, setAllocatingBed] = useState('Bed 1')

  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['admin-rooms', selectedBlockId, selectedFloor],
    queryFn: () => api.getRooms({ blockId: selectedBlockId, floor: selectedFloor }),
  })

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.getBlocks(),
  })

  const { data: allStudents = [] } = useQuery({
    queryKey: ['admin-students-for-allotment'],
    queryFn: () => api.getStudents(),
  })

  // Allocate Room Mutation
  const allocateMutation = useMutation({
    mutationFn: ({ roomId, studentId, bed }: { roomId: string; studentId: string; bed: string }) =>
      api.allocateRoom(roomId, studentId, bed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      toast.success('Bed successfully assigned to resident')
      setActiveRoom(null)
      setAllocatingStudentId('')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Room allocation failed')
    },
  })

  // Deallocate Room Mutation
  const deallocateMutation = useMutation({
    mutationFn: ({ roomId, studentId }: { roomId: string; studentId: string }) =>
      api.deallocateRoom(roomId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      toast.success('Student deallocated from room successfully')
      setActiveRoom(null)
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
                Institutional bed assignment matrix, dormitory occupancy, and resident allocation.
              </p>
            </div>
          </div>
        </div>

        {/* Block & Floor Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBlockId}
            onChange={(e) => setSelectedBlockId(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.occupied}/{b.capacity} beds)
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1">
            {[1, 2, 3, 4].map((floor) => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  selectedFloor === floor
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Floor {floor}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Rooms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rooms.map((room) => {
          const isFull = room.occupied >= room.capacity
          const isVacant = room.occupied === 0
          const hasMaintenance = room.status === 'maintenance'

          return (
            <div
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`rounded-2xl border p-4 transition-all cursor-pointer hover:shadow-card group relative ${
                hasMaintenance
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : isFull
                  ? 'border-border bg-card'
                  : 'border-primary/30 bg-primary/5 hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between pb-3 border-b border-border">
                <div>
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    Room {room.number}
                  </h4>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {room.type} Room
                  </p>
                </div>
                <StatusBadge
                  status={room.status}
                  label={
                    room.status === 'occupied'
                      ? 'FULL'
                      : room.status === 'available'
                      ? `${room.capacity - room.occupied} BED LEFT`
                      : 'MAINT'
                  }
                />
              </div>

              {/* Occupant Slots */}
              <div className="py-3 space-y-1.5">
                {Array.from({ length: room.capacity }).map((_, idx) => {
                  const occupant = room.occupants[idx]
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-background/60 border border-border/40"
                    >
                      <span className="text-[11px] font-mono text-muted-foreground">
                        Bed {idx + 1}
                      </span>
                      {occupant ? (
                        <span className="font-semibold text-foreground truncate max-w-[120px]">
                          {occupant.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase">
                          Vacant
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Occupancy: {room.occupied}/{room.capacity} Beds</span>
                <span className="text-primary font-bold group-hover:underline">
                  Manage Bed &rarr;
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
                  Floor {activeRoom.floor} • Capacity: {activeRoom.capacity} Beds
                </p>
              </div>
              <button
                onClick={() => setActiveRoom(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing Occupants */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Current Room Residents ({activeRoom.occupants.length}/{activeRoom.capacity})
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
                          {occ.bed} • Roll No: {occ.rollNo || occ.id}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          deallocateMutation.mutate({
                            roomId: activeRoom.id,
                            studentId: occ.id,
                          })
                        }
                        disabled={deallocateMutation.isPending}
                        className="px-2.5 py-1 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-[11px] font-semibold"
                      >
                        Deallocate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Allocate New Student */}
            {activeRoom.occupied < activeRoom.capacity && (
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
                      {allStudents
                        .filter(
                          (s) =>
                            !activeRoom.occupants.some((o) => o.id === s.id)
                        )
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.rollNo})
                          </option>
                        ))}
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
                      {Array.from({ length: activeRoom.capacity }).map((_, i) => (
                        <option key={i} value={`Bed ${i + 1}`}>
                          Bed {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!allocatingStudentId || allocateMutation.isPending}
                  onClick={() =>
                    allocateMutation.mutate({
                      roomId: activeRoom.id,
                      studentId: allocatingStudentId,
                      bed: allocatingBed,
                    })
                  }
                  className="w-full py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {allocateMutation.isPending ? 'Allocating...' : 'Confirm Bed Allocation'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
