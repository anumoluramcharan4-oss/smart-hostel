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

  const { data: allStudents = [] } = useQuery({
    queryKey: ['students-for-allotment'],
    queryFn: () => api.getStudents(),
  })

  // Optimistic Allocate Room Mutation
  const allocateMutation = useMutation({
    mutationFn: ({ roomId, studentId, bed }: { roomId: string; studentId: string; bed: string }) =>
      api.allocateRoom(roomId, studentId, bed),
    onMutate: async ({ roomId, studentId, bed }) => {
      await queryClient.cancelQueries({ queryKey: ['rooms', selectedBlockId, selectedFloor] })
      const prevRooms = queryClient.getQueryData<Room[]>(['rooms', selectedBlockId, selectedFloor])
      const targetStudent = allStudents.find((s) => s.id === studentId)

      if (targetStudent && prevRooms) {
        queryClient.setQueryData<Room[]>(['rooms', selectedBlockId, selectedFloor], (old = []) =>
          old.map((r) => {
            if (r.id === roomId || r.number === roomId) {
              const updatedOccupants = [
                ...r.occupants.filter((o) => o.id !== studentId),
                {
                  id: targetStudent.id,
                  name: targetStudent.name,
                  rollNo: targetStudent.rollNo,
                  bed,
                  course: targetStudent.course,
                  avatar: targetStudent.avatar,
                },
              ]
              const newOccupied = updatedOccupants.length
              return {
                ...r,
                occupied: newOccupied,
                status: (newOccupied >= r.capacity ? 'occupied' : 'available') as 'occupied' | 'available',
                occupants: updatedOccupants,
              }
            }
            return r
          })
        )
      }
      return { prevRooms }
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prevRooms) {
        queryClient.setQueryData(['rooms', selectedBlockId, selectedFloor], ctx.prevRooms)
      }
      toast.error('Failed to allocate student to room')
    },
    onSuccess: (updatedRoom) => {
      toast.success(`Student assigned to Room ${updatedRoom.number} successfully!`)
      setActiveRoom(updatedRoom)
      setAllocatingStudentId('')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['warden-students'] })
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visual Floor Map & Room Allotment"
        subtitle="Interactive spatial grid of rooms across hostel blocks. Click any room tile to inspect occupants or assign beds."
      />

      {/* Block & Floor Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-3xl glass-card border border-border/80">
        {/* Block Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {blocks.map((blk) => (
            <button
              key={blk.id}
              onClick={() => setSelectedBlockId(blk.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                selectedBlockId === blk.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {blk.name}
            </button>
          ))}
        </div>

        {/* Floor selector & Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border/60">
            {[1, 2, 3].map((fl) => (
              <button
                key={fl}
                onClick={() => setSelectedFloor(fl)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  selectedFloor === fl
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Floor {fl}
              </button>
            ))}
          </div>

          {/* Quick Legend */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
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
              <span className="text-muted-foreground">Full</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="text-muted-foreground">Service</span>
            </div>
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
                      Select Unassigned / Transfer Student
                    </label>
                    <select
                      value={allocatingStudentId}
                      onChange={(e) => setAllocatingStudentId(e.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">Choose a student...</option>
                      {allStudents
                        .filter(
                          (st) =>
                            !activeRoom.occupants.some((o) => o.id === st.id)
                        )
                        .map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.rollNo}) - Current: {st.roomNumber}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Bed Position
                    </label>
                    <select
                      value={allocatingBed}
                      onChange={(e) => setAllocatingBed(e.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="Bed 1 (Window)">Bed 1 (Window)</option>
                      <option value="Bed 2 (Door)">Bed 2 (Door)</option>
                      <option value="Bed 3 (Balcony)">Bed 3 (Balcony)</option>
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
