'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  UserCheck,
  Calendar,
  Check,
  X,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { formatDate } from '@/lib/utils'
import { AttendanceDaySummary } from '@/lib/types'

export default function WardenAttendancePage() {
  const queryClient = useQueryClient()
  const [selectedBlock, setSelectedBlock] = useState('Newton')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students-attendance', selectedBlock],
    queryFn: () => api.getStudents({ block: selectedBlock }),
  })

  const { data: attendanceHistory = [] } = useQuery({
    queryKey: ['attendance-history'],
    queryFn: () => api.getAttendanceHistory(),
  })

  const { data: todayAttendance = {} } = useQuery({
    queryKey: ['today-attendance'],
    queryFn: () => api.getAttendanceForToday(),
  })

  const markMutation = useMutation({
    mutationFn: ({ studentId, status }: { studentId: string; status: 'present' | 'absent' | 'leave' }) =>
      api.markAttendance(studentId, status),
    onMutate: async ({ studentId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['today-attendance'] })
      const prev = queryClient.getQueryData<Record<string, 'present' | 'absent' | 'leave'>>(['today-attendance'])

      queryClient.setQueryData<Record<string, string>>(['today-attendance'], (old = {}) => ({
        ...old,
        [studentId]: status,
      }))

      return { prev }
    },
    onSuccess: (data) => {
      toast.success(`Marked ${data.status} for resident.`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] })
    },
  })

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const presentCount = Object.values(todayAttendance).filter((s) => s === 'present').length
  const absentCount = Object.values(todayAttendance).filter((s) => s === 'absent').length
  const leaveCount = Object.values(todayAttendance).filter((s) => s === 'leave').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Night Curfew Roll-Call & Attendance Heatmap"
        subtitle="Execute daily 10:30 PM roll call, verify biometric punch-ins, and inspect historical attendance trends."
      />

      {/* 3 Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Present Tonight"
          value={presentCount}
          numericValue={presentCount}
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          iconBg="from-emerald-500/20 to-teal-500/10"
          description="In quarters / biometric verified"
        />
        <StatCard
          title="Unaccounted Absent"
          value={absentCount}
          numericValue={absentCount}
          icon={XCircle}
          iconColor="text-rose-500"
          iconBg="from-rose-500/20 to-amber-500/10"
          description="Overdue beyond 10:30 PM cutoff"
        />
        <StatCard
          title="Authorized Leave"
          value={leaveCount}
          numericValue={leaveCount}
          icon={Clock}
          iconColor="text-blue-500"
          iconBg="from-blue-500/20 to-indigo-500/10"
          description="Approved night-out passes"
        />
      </div>

      {/* Attendance Heatmap Grid (14 Days) */}
      <div className="rounded-3xl glass-card p-6 border border-border/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">
              14-Day Hostel Attendance Heatmap
            </h3>
            <p className="text-xs text-muted-foreground">
              Daily turnout percentage across all residential blocks
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-primary">
            Avg: 97.4%
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
          {attendanceHistory.map((day: AttendanceDaySummary) => {
            const isHigh = day.percentage >= 98
            const isMedium = day.percentage >= 95
            const isLow = day.percentage < 95

            return (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-border/60 bg-muted/30 hover:border-primary/50 transition-colors"
                title={`${formatDate(day.date)}: ${day.percentage}% (${day.presentCount} present, ${day.absentCount} absent)`}
              >
                <span className="text-[10px] text-muted-foreground font-mono">
                  {day.date.split('-')[2]} Oct
                </span>
                <span
                  className={`h-5 w-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                    isHigh
                      ? 'bg-emerald-500 text-white'
                      : isMedium
                      ? 'bg-teal-500/80 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {Math.round(day.percentage)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily Student Roll-Call Checklist */}
      <div className="rounded-3xl glass-card p-6 border border-border/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Block Roll-Call Roster
            </h3>
            <p className="text-xs text-muted-foreground">
              Mark individual resident status for tonight
            </p>
          </div>

          {/* Block filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              <option value="Newton">Block A (Newton)</option>
              <option value="Aryabhata">Block B (Aryabhata)</option>
              <option value="Ramanujan">Block C (Ramanujan)</option>
              <option value="Kalam">Block D (Kalam)</option>
            </select>
          </div>
        </div>

        {/* Student items */}
        {isLoadingStudents ? (
          <div className="space-y-3 py-4">
            <div className="h-14 rounded-2xl bg-muted/70 animate-pulse" />
            <div className="h-14 rounded-2xl bg-muted/70 animate-pulse" />
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((student) => {
              const currentStatus = todayAttendance[student.id] || 'present'

              return (
                <div
                  key={student.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        {student.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Room {student.roomNumber} ({student.bedNumber}) • {student.rollNo}
                      </p>
                    </div>
                  </div>

                  {/* 3 Status toggle buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        markMutation.mutate({ studentId: student.id, status: 'present' })
                      }
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        currentStatus === 'present'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() =>
                        markMutation.mutate({ studentId: student.id, status: 'absent' })
                      }
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        currentStatus === 'absent'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      onClick={() =>
                        markMutation.mutate({ studentId: student.id, status: 'leave' })
                      }
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        currentStatus === 'leave'
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Leave Pass
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
