'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building, Users, BedDouble, AlertCircle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'

export default function AdminOccupancyPage() {
  const { data: blocks = [], isLoading: isLoadingBlocks } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.getBlocks(),
  })

  const { data: rooms = [] } = useQuery({
    queryKey: ['admin-rooms-all'],
    queryFn: () => api.getRooms(),
  })

  const totalCap = blocks.reduce((a, b) => a + b.capacity, 0) || 360
  const totalOcc = blocks.reduce((a, b) => a + b.occupied, 0) || 312
  const vacantBeds = totalCap - totalOcc

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Capacity & Occupancy Analytics"
        subtitle="Real-time residential density tracking, floor utilization, and block-level vacancy management."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Overall Occupancy Rate"
          value="90.8%"
          numericValue={91}
          suffix="%"
          icon={Building}
          iconColor="text-primary"
          iconBg="from-primary/20 to-indigo-500/10"
          description="312 of 360 available beds allotted"
        />
        <StatCard
          title="Vacant Beds Available"
          value={vacantBeds}
          numericValue={vacantBeds}
          icon={BedDouble}
          iconColor="text-teal-500"
          iconBg="from-teal-500/20 to-emerald-500/10"
          description="Ready for immediate student allocation"
        />
        <StatCard
          title="Maintenance Quarters"
          value="2 Rooms"
          icon={AlertCircle}
          iconColor="text-rose-500"
          iconBg="from-rose-500/20 to-amber-500/10"
          description="A-309 and C-209 undergoing renovation"
        />
      </div>

      {/* Block Deep Dive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blocks.map((blk) => {
          const occPercent = Math.round((blk.occupied / blk.capacity) * 100)
          const blkRooms = rooms.filter((r) => r.blockId === blk.id)

          return (
            <div
              key={blk.id}
              className="rounded-3xl glass-card p-6 border border-border/80 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {blk.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Supervising Warden: {blk.wardenName}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-primary">
                  {occPercent}%
                </span>
              </div>

              {/* Capacity Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Occupancy</span>
                  <span className="font-mono font-bold text-foreground">
                    {blk.occupied} / {blk.capacity} Beds
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-violet-600 transition-all duration-700"
                    style={{ width: `${occPercent}%` }}
                  />
                </div>
              </div>

              {/* Floor breakdown */}
              <div className="pt-2 grid grid-cols-3 gap-2.5 text-center text-xs">
                {[1, 2, 3].map((fl) => (
                  <div
                    key={fl}
                    className="rounded-2xl bg-muted/40 p-3 border border-border/50"
                  >
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Floor {fl}
                    </span>
                    <p className="text-sm font-bold text-foreground mt-0.5 font-mono">
                      10 Rooms
                    </p>
                    <span className="text-[10px] text-emerald-500 font-semibold">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
