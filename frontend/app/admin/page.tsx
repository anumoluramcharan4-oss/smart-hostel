'use client'

import React, { useState, useEffect, useMemo } from 'react'
import NextLink from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
  WardenInfo,
  WardenGrievance,
  GrievanceStatus,
} from '@/lib/types'
import {
  Download,
  Megaphone,
  Building,
  UserPlus,
  GraduationCap,
  Building2,
  PieChart as PieIcon,
  Bed,
  AlertTriangle,
  Banknote,
  MoreHorizontal,
  Clock,
  Droplets,
  Zap,
  Wifi,
  Lock,
  Utensils,
  CheckCircle2,
  ArrowRight,
  Radio,
  FileSpreadsheet,
  X,
  Wrench,
  Phone,
  Check,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  User,
  Eye,
  FileText,
  Flame,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
} from 'recharts'
import { toast } from 'sonner'

interface UrgentTicket {
  id: string
  studentName: string
  studentId: string
  room: string
  bed: string
  block: string
  category: string
  categoryIcon: 'droplets' | 'zap' | 'wifi' | 'lock'
  title: string
  description: string
  priority: 'High' | 'Medium' | 'Low'
  slaStatus: string
  slaBreaching?: boolean
  status: ComplaintStatus
  assignedStaff?: string
  assignedRole?: string
  assignedPhone?: string
  assignedAt?: string
  eta?: string
  notes?: string
  studentPhone: string
  studentEmail: string
  studentApproved?: boolean
  timeline: { time: string; event: string; actor: string }[]
}

const initialUrgentTickets: UrgentTicket[] = []


const availableStaff = [
  {
    id: 'staff-1',
    name: 'Rajesh Verma',
    role: 'Senior Facilities Plumber',
    specialty: 'Plumbing & Hydraulic Lines',
    phone: '+91 98765-43210',
    status: 'Available',
    activeJobs: 1,
  },
  {
    id: 'staff-2',
    name: 'Manoj Sharma',
    role: 'Chief Campus Electrician',
    specialty: 'High Voltage, MCB & Lighting',
    phone: '+91 98765-43211',
    status: 'On Duty',
    activeJobs: 0,
  },
  {
    id: 'staff-3',
    name: 'Suresh Patil',
    role: 'Senior Network Technician',
    specialty: 'WLAN, Fiber & Switchgear',
    phone: '+91 98765-43212',
    status: 'Available',
    activeJobs: 2,
  },
  {
    id: 'staff-4',
    name: 'Vikram Seth',
    role: 'Access Control & Hardware Specialist',
    specialty: 'Smart Locks & Turnstiles',
    phone: '+91 98765-43213',
    status: 'Available',
    activeJobs: 1,
  },
  {
    id: 'staff-5',
    name: 'Anita Devi',
    role: 'Housekeeping Supervisor',
    specialty: 'Sanitation & Emergency Mop-up',
    phone: '+91 98765-43214',
    status: 'On Duty',
    activeJobs: 2,
  },
]

export default function AdminDashboardPage() {
  const [isClient, setIsClient] = useState(false)
  const queryClient = useQueryClient()

  // Real-time multi-tab sync across student & admin portals
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'smart_hostel_warden_grievances_v2' ||
        e.key === 'smart_hostel_complaints_v2'
      ) {
        queryClient.invalidateQueries({ queryKey: ['admin-warden-grievances'] })
        queryClient.invalidateQueries({ queryKey: ['admin-all-complaints'] })
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [queryClient])

  const { data: serverComplaints = [] } = useQuery({
    queryKey: ['admin-all-complaints'],
    queryFn: () => api.getComplaints(),
    refetchInterval: 1000,
  })

  // Wardens Directory (Admin reflection of who are the wardens and for which block)
  const { data: wardens = [] } = useQuery({
    queryKey: ['admin-wardens'],
    queryFn: () => api.getWardens(),
  })

  // Confidential Student Grievances against Wardens (Exclusively Admin Visible)
  const { data: wardenGrievances = [] } = useQuery({
    queryKey: ['admin-warden-grievances'],
    queryFn: () => api.getWardenGrievances(),
    refetchInterval: 1000,
  })

  const [reviewGrievance, setReviewGrievance] = useState<WardenGrievance | null>(null)
  const [grievanceNotes, setGrievanceNotes] = useState('')

  const handleUpdateGrievanceStatus = async (
    grievanceId: string,
    status: GrievanceStatus,
    notes?: string
  ) => {
    try {
      await api.updateWardenGrievanceStatus(grievanceId, status, notes)
      queryClient.invalidateQueries({ queryKey: ['admin-warden-grievances'] })
      queryClient.invalidateQueries({ queryKey: ['student-warden-grievances'] })
      toast.success(`Grievance updated to ${status.replace('_', ' ').toUpperCase()}`)
      setReviewGrievance(null)
      setGrievanceNotes('')
    } catch {
      toast.error('Failed to update grievance')
    }
  }

  const [viewTicket, setViewTicket] = useState<UrgentTicket | null>(null)
  const [assignTicket, setAssignTicket] = useState<UrgentTicket | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<string>('staff-1')
  const [dispatchPriority, setDispatchPriority] = useState<string>('High')
  const [dispatchEta, setDispatchEta] = useState<string>('30 mins')
  const [dispatchNotes, setDispatchNotes] = useState<string>('')

  // Dynamically derive urgent tickets from shared api.getComplaints()
  const urgentTickets: UrgentTicket[] = useMemo(() => {
    if (!serverComplaints || serverComplaints.length === 0) {
      return []
    }

    const priorityWeight: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    }

    const sorted = [...serverComplaints].sort((a, b) => {
      // Pending and In Progress first, resolved at bottom
      if (a.status !== 'resolved' && b.status === 'resolved') return -1
      if (a.status === 'resolved' && b.status !== 'resolved') return 1

      // Higher priority first
      const weightA = priorityWeight[a.priority] || 1
      const weightB = priorityWeight[b.priority] || 1
      if (weightA !== weightB) return weightB - weightA

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return sorted.map((c) => {
      const isUrgent = c.priority === 'urgent'
      const isHigh = c.priority === 'high'

      return {
        id: c.id,
        studentName: c.studentName || 'Student',
        studentId: c.studentId || 'STU-2024',
        room: c.roomNumber || 'Room',
        bed: 'Assigned Bed',
        block: c.blockName || 'Campus Hostel',
        category: c.category.charAt(0).toUpperCase() + c.category.slice(1),
        categoryIcon: (c.category === 'electrical'
          ? 'zap'
          : c.category === 'plumbing'
          ? 'droplets'
          : c.category === 'wifi'
          ? 'wifi'
          : 'lock') as 'droplets' | 'zap' | 'wifi' | 'lock',
        title: c.title,
        description: c.description,
        priority: (c.priority.charAt(0).toUpperCase() + c.priority.slice(1)) as 'High' | 'Medium' | 'Low',
        slaStatus: isUrgent ? '22m left' : isHigh ? '2h 10m left' : '24h left',
        slaBreaching: isUrgent,
        status: c.status,
        assignedStaff: c.assignedTo,
        assignedRole: 'Facilities Technician',
        assignedPhone: '+91 98765-43210',
        studentPhone: '+91 98765-10000',
        studentEmail: `${c.studentName?.toLowerCase().replace(/\s+/g, '.') || 'student'}@hostel.edu`,
        studentApproved: c.studentApproved || c.status === 'student_approved',
        timeline: (c.timeline || []).map((t) => ({
          time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: t.note,
          actor: t.note.includes('Warden') ? 'Warden' : t.note.includes('Admin') ? 'Administrator' : 'Student',
        })),
      }
    })
  }, [serverComplaints])

  const CAMPUS_BLOCKS = [
    { key: 'Block A', name: 'Block A – Mt. Everest (Newton)', letter: 'A', wing: "Undergrad Men's Wing", occ: '96%', count: '180 / 188', color: 'blue' },
    { key: 'Block B', name: 'Block B – Kilimanjaro (Aryabhata)', letter: 'B', wing: "Undergrad Women's Wing", occ: '92%', count: '148 / 160', color: 'blue' },
    { key: 'Block C', name: 'Block C – Nilgiri (Ramanujan)', letter: 'C', wing: 'Postgraduate International', occ: '88%', count: '124 / 140', color: 'emerald' },
    { key: 'Block D', name: 'Block D – Kalam', letter: 'D', wing: 'Faculty & Research Fellows', occ: '80%', count: '72 / 90', color: 'purple' },
    { key: 'Block E', name: 'Block E – Visvesvaraya', letter: 'E', wing: 'Engineering & Tech Wing', occ: '75%', count: '68 / 90', color: 'amber' },
  ]

  const blockComplaintStats = useMemo(() => {
    const stats: Record<string, { total: number; urgent: number; high: number; pending: number; inProgress: number }> = {
      'Block A': { total: 0, urgent: 0, high: 0, pending: 0, inProgress: 0 },
      'Block B': { total: 0, urgent: 0, high: 0, pending: 0, inProgress: 0 },
      'Block C': { total: 0, urgent: 0, high: 0, pending: 0, inProgress: 0 },
      'Block D': { total: 0, urgent: 0, high: 0, pending: 0, inProgress: 0 },
      'Block E': { total: 0, urgent: 0, high: 0, pending: 0, inProgress: 0 },
    }

    serverComplaints.forEach((c) => {
      if (c.status === 'resolved') return
      const bKey = Object.keys(stats).find((k) =>
        c.blockName.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(c.blockName.toLowerCase())
      )
      if (bKey) {
        stats[bKey].total += 1
        if (c.priority === 'urgent') stats[bKey].urgent += 1
        if (c.priority === 'high') stats[bKey].high += 1
        if (c.status === 'pending') stats[bKey].pending += 1
        if (c.status === 'in_progress') stats[bKey].inProgress += 1
      }
    })

    return stats
  }, [serverComplaints])

  const blocksWithActiveComplaints = useMemo(() => {
    return CAMPUS_BLOCKS.filter((b) => (blockComplaintStats[b.key]?.total || 0) > 0).map((b) => ({
      ...b,
      ...blockComplaintStats[b.key],
    }))
  }, [blockComplaintStats])

  const handleOpenAssignModal = (ticket: UrgentTicket) => {
    // Auto-select staff based on category
    if (ticket.category.toLowerCase().includes('plumb')) {
      setSelectedStaffId('staff-1')
    } else if (ticket.category.toLowerCase().includes('elect')) {
      setSelectedStaffId('staff-2')
    } else if (ticket.category.toLowerCase().includes('wifi') || ticket.category.toLowerCase().includes('net')) {
      setSelectedStaffId('staff-3')
    } else if (ticket.category.toLowerCase().includes('lock') || ticket.category.toLowerCase().includes('door')) {
      setSelectedStaffId('staff-4')
    } else {
      setSelectedStaffId('staff-5')
    }
    setDispatchPriority(ticket.priority)
    setDispatchEta('30 mins')
    setDispatchNotes('')
    setAssignTicket(ticket)
  }

  const handleConfirmAssignment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!assignTicket) return

    const staffMember = availableStaff.find((s) => s.id === selectedStaffId) || availableStaff[0]
    const priorityVal = (dispatchPriority.toLowerCase() as ComplaintPriority) || 'urgent'

    try {
      await api.updateComplaintStatus(
        assignTicket.id,
        'in_progress',
        dispatchNotes || `Dispatched ${staffMember.name} (${staffMember.role}) • ETA ${dispatchEta}`,
        staffMember.name,
        priorityVal
      )

      queryClient.invalidateQueries({ queryKey: ['admin-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })

      toast.success(`Staff Dispatched! ${staffMember.name} assigned to Room ${assignTicket.room}.`)
      setAssignTicket(null)
    } catch (err) {
      toast.error('Failed to dispatch staff')
    }
  }

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await api.updateComplaintStatus(
        ticketId,
        'resolved',
        'Inspection confirmed & issue signed off by Chief Administrator'
      )

      queryClient.invalidateQueries({ queryKey: ['admin-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })

      toast.success(`Ticket #${ticketId} signed off & marked Resolved!`)
      if (viewTicket?.id === ticketId) {
        setViewTicket((prev) => (prev ? { ...prev, status: 'resolved' } : null))
      }
    } catch (err) {
      toast.error('Failed to resolve ticket')
    }
  }

  const handleUpdatePriority = async (ticketId: string, newPriority: ComplaintPriority) => {
    try {
      await api.updateComplaintStatus(
        ticketId,
        viewTicket?.status === 'in_progress' ? 'in_progress' : 'pending',
        `Urgency priority adjusted to ${newPriority.toUpperCase()} by Administrator`,
        undefined,
        newPriority
      )

      queryClient.invalidateQueries({ queryKey: ['admin-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })

      toast.success(`Priority updated to ${newPriority.toUpperCase()}!`)
      if (viewTicket && viewTicket.id === ticketId) {
        setViewTicket((prev) => (prev ? { ...prev, priority: (newPriority.charAt(0).toUpperCase() + newPriority.slice(1)) as any } : null))
      }
    } catch (err) {
      toast.error('Failed to update priority')
    }
  }

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm(`Are you sure you want to permanently remove ticket #${ticketId}?`)) return
    try {
      await api.deleteComplaint(ticketId)
      toast.success(`Ticket #${ticketId} removed successfully`)
      queryClient.invalidateQueries({ queryKey: ['admin-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-all-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-complaints'] })
      if (viewTicket?.id === ticketId) setViewTicket(null)
    } catch {
      toast.error('Failed to remove ticket')
    }
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Inflow chart data matching Aug - May with Feb (Now)
  const inflowData = [
    { month: 'Aug', residents: 1040, capacity: 1268, isNow: false },
    { month: 'Sep', residents: 1210, capacity: 1268, isNow: false },
    { month: 'Oct', residents: 1240, capacity: 1268, isNow: false },
    { month: 'Nov', residents: 1230, capacity: 1268, isNow: false },
    { month: 'Dec', residents: 1220, capacity: 1268, isNow: false },
    { month: 'Jan', residents: 1235, capacity: 1268, isNow: false },
    { month: 'Feb (Now)', residents: 1248, capacity: 1268, isNow: true },
    { month: 'Mar*', residents: 1255, capacity: 1268, isNow: false },
    { month: 'Apr*', residents: 1250, capacity: 1268, isNow: false },
    { month: 'May*', residents: 1245, capacity: 1268, isNow: false },
  ]

  // Issue Categories Donut Data
  const issueData = [
    { name: 'Electrical', value: 34, color: '#EF4444' },
    { name: 'Wi-Fi & Net', value: 28, color: '#3B82F6' },
    { name: 'Plumbing', value: 18, color: '#06B6D4' },
    { name: 'Housekeeping', value: 12, color: '#10B981' },
    { name: 'Furniture & Carpentry', value: 8, color: '#94A3B8' },
  ]

  return (
    <div className="space-y-5 pb-8 font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome back, Chief Administrator
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Academic Year 2024–2025 • Term 2 (Spring) <span className="mx-1">•</span> Last snapshot synchronized 4 mins ago
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => toast.success('Exporting master audit report (PDF)...')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export Report
          </button>

          <button
            onClick={() => toast.info('Opening announcement publisher dialog...')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Megaphone className="h-3.5 w-3.5 text-slate-500" />
            + Post Announcement
          </button>

          <NextLink
            href="/warden/rooms"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors shadow-sm"
          >
            <Building className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            + Allocate Room
          </NextLink>

          <button
            onClick={() => toast.success('Student Admission Portal launched.')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <UserPlus className="h-3.5 w-3.5" />
            + Admit Student
          </button>
        </div>
      </div>

      {/* POPUP / HIGHLIGHTER: Campus Live Defect Radar Banner */}
      {blocksWithActiveComplaints.length > 0 ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500/40 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-orange-500/10 p-4 sm:p-5 shadow-lg shadow-rose-500/5 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/30">
                <Flame className="h-6 w-6 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-700 border-2 border-white text-[9px] font-bold text-white items-center justify-center">
                    !
                  </span>
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🚨 Campus Defect Radar:</span>
                    <span className="text-rose-600 dark:text-rose-400">
                      Complaints Active in {blocksWithActiveComplaints.length} Hostel Block{blocksWithActiveComplaints.length > 1 ? 's' : ''}
                    </span>
                  </h3>
                  <span className="rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-bold animate-pulse">
                    Admin Attention
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Real-time ticket detection isolated to specific residential blocks. Review affected blocks and coordinate with respective resident wardens:
                </p>
              </div>
            </div>

            {/* Quick-Jump Block Badges with Warden Info */}
            <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
              {blocksWithActiveComplaints.map((b) => {
                const assignedWarden = wardens.find((w) =>
                  w.assignedBlockName.toLowerCase().includes(b.key.toLowerCase()) ||
                  b.key.toLowerCase().includes(w.assignedBlockName.toLowerCase())
                )
                return (
                  <div
                    key={b.key}
                    className="inline-flex flex-col rounded-xl bg-white dark:bg-slate-900 border-2 border-rose-400/80 dark:border-rose-700 p-2.5 shadow-sm space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {b.key}
                      </span>
                      <span className="rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 px-2 py-0.2 text-[10px] font-black">
                        {b.total} Active
                      </span>
                      {b.urgent > 0 && (
                        <span className="rounded-full bg-red-600 text-white px-1.5 py-0.2 text-[9px] font-black animate-pulse">
                          {b.urgent} Urgent
                        </span>
                      )}
                    </div>
                    {assignedWarden && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Warden: <strong className="text-slate-700 dark:text-slate-200">{assignedWarden.name}</strong>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* 🚨 CONFIDENTIAL WARDEN GRIEVANCES ALERT BANNER */}
      {wardenGrievances.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500 bg-gradient-to-r from-rose-500/15 via-red-500/10 to-amber-500/10 p-4 shadow-lg shadow-rose-500/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold">
                <ShieldAlert className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🚨 Confidential Warden Complaint:</span>
                    <span className="text-rose-600 dark:text-rose-400">
                      {wardenGrievances.length} Student Report{wardenGrievances.length > 1 ? 's' : ''} Received
                    </span>
                  </h4>
                  <span className="rounded-full bg-rose-600 text-white px-2 py-0.2 text-[10px] font-black uppercase tracking-wider animate-pulse">
                    Admin Eyes Only
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  {wardenGrievances.slice(0, 3).map((g) => (
                    <span key={g.id} className="inline-flex items-center gap-1 bg-white/70 dark:bg-slate-900/70 border border-rose-200 dark:border-rose-900/60 rounded-md px-2 py-0.5">
                      <strong className="text-rose-600">{g.wardenName}</strong> ({g.blockName}) &bull; <span className="font-semibold">{g.subject}</span>
                    </span>
                  ))}
                  {wardenGrievances.length > 3 && (
                    <span className="font-semibold text-rose-600">+ {wardenGrievances.length - 3} more</span>
                  )}
                </div>
              </div>
            </div>

            <a
              href="#warden-grievances-section"
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 text-white px-4 py-2 text-xs font-bold hover:bg-rose-700 transition-all shadow-sm shadow-rose-600/30 whitespace-nowrap self-start md:self-auto shrink-0"
            >
              <Eye className="h-3.5 w-3.5" />
              Review Grievances ({wardenGrievances.filter((g) => g.status !== 'resolved').length} Open) &rarr;
            </a>
          </div>
        </div>
      )}

      {/* 2. Top 6 Metric / KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Students */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Students
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                1,248
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.2 rounded">
                +12 this wk
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Capacity Load <strong className="text-slate-800 dark:text-slate-200">98.4%</strong></span>
            <svg width="40" height="14" className="stroke-blue-600 dark:stroke-blue-400 fill-none" strokeWidth="1.5">
              <polyline points="0,10 10,7 20,9 30,3 40,5" />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Rooms */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Rooms
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                480
              </span>
              <span className="text-xs text-slate-500 font-medium">
                4 Blocks
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-[10px] text-slate-400">
            <span className="rounded bg-slate-100 dark:bg-slate-800 px-1 font-bold text-slate-700 dark:text-slate-300">A</span>
            <span className="rounded bg-slate-100 dark:bg-slate-800 px-1 font-bold text-slate-700 dark:text-slate-300">B</span>
            <span className="rounded bg-slate-100 dark:bg-slate-800 px-1 font-bold text-slate-700 dark:text-slate-300">C</span>
            <span className="rounded bg-slate-100 dark:bg-slate-800 px-1 font-bold text-slate-700 dark:text-slate-300">D</span>
            <span className="truncate ml-1">Everest, Kilimanjaro...</span>
          </div>
        </div>

        {/* Card 3: Occupancy Rate */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Occupancy Rate
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <PieIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                91.5%
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.2 rounded">
                +3.2%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px] text-slate-500">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '91.5%' }} />
            </div>
            <p className="text-[10px] text-slate-400">Vs. 88.3% prior semester</p>
          </div>
        </div>

        {/* Card 4: Available Beds */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Available Beds
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Bed className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                41
              </span>
              <span className="text-xs text-slate-500 font-medium">
                vacant
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>28 Single / 13 Twin</span>
            <span className="rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-1.5 py-0.2 text-[10px] font-bold">
              Ready
            </span>
          </div>
        </div>

        {/* Card 5: Open Complaints */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Open Complaints
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                18
              </span>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 px-1.5 py-0.2 rounded">
                3 Critical SLA
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <span className="text-red-600 bg-red-50 px-1 rounded">3 High</span>
              <span className="text-amber-600 bg-amber-50 px-1 rounded">9 Med</span>
              <span className="text-slate-500 bg-slate-100 px-1 rounded">6 Low</span>
            </div>
            <p className="text-[10px] text-slate-400">Avg turnaround: 3.4 hrs</p>
          </div>
        </div>

        {/* Card 6: Fee Collection */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Fee Collection
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Banknote className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                94.2%
              </span>
              <span className="text-xs font-bold text-emerald-600">
                $1.17M
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-red-500 flex items-center gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
            <span className="truncate">$73,000 overdue (28 students)</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Inflow Chart (65%) + Issue Categories Donut (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Capacity & Resident Inflow Timeline */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Capacity & Resident Inflow Timeline
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aug 2024 – May 2025 tracked against 1,268 total bed capacity
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-[#2563EB]" />
                  <span className="text-slate-600 dark:text-slate-400">Enrolled Residents</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 border-t-2 border-dashed border-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Max Bed Ceiling</span>
                </div>
              </div>
            </div>

            {/* Inflow Chart */}
            <div className="h-60 w-full mt-4">
              {isClient ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={inflowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[600, 1400]}
                      ticks={[700, 900, 1100, 1300]}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="capacity"
                      stroke="#94A3B8"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="residents"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      fill="url(#blueGradient)"
                      dot={(props) => {
                        const { cx, cy, payload } = props
                        if (payload.isNow) {
                          return (
                            <circle
                              key="now-dot"
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill="#2563EB"
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          )
                        }
                        return <circle key={cx} cx={cx} cy={cy} r={3} fill="#3B82F6" />
                      }}
                    />
                    <Bar
                      dataKey={(item) => (item.isNow ? item.residents : 0)}
                      fill="#2563EB"
                      barSize={14}
                      radius={[4, 4, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-slate-50 rounded animate-pulse" />
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px] text-slate-400">
              * Asterisk indicates forecasted occupancy following mid-semester intake.
            </span>
            <button
              onClick={() => toast.success('Inflow timeline CSV generated')}
              className="font-semibold text-blue-600 hover:underline"
            >
              Download Inflow Data (.CSV)
            </button>
          </div>
        </div>

        {/* Right: Issue Categories Donut */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Issue Categories
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Distribution of 18 active tickets
                </p>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Donut Chart */}
            <div className="h-44 w-full flex items-center justify-center relative mt-2">
              {isClient ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={issueData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {issueData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-32 w-32 rounded-full border-4 border-slate-100 animate-pulse" />
              )}
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  18
                </span>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider mt-0.5">
                  TICKETS
                </span>
              </div>
            </div>

            {/* Legend breakdown */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 text-xs">
              {issueData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] font-mono ml-1">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Middle Section: Block Breakdown (35%) + Urgent Maintenance Queue (65%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Block Breakdown */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Block Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live physical occupancy ratios per residential hall
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600">
                4 Buildings
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {CAMPUS_BLOCKS.map((blk) => {
                const stats = blockComplaintStats[blk.key] || { total: 0, urgent: 0, high: 0 }
                const hasComplaints = stats.total > 0

                return (
                  <div
                    key={blk.key}
                    className={`space-y-1.5 p-2.5 rounded-xl transition-all ${
                      hasComplaints
                        ? 'border-2 border-rose-400/80 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm'
                        : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded font-bold text-xs ${
                            hasComplaints
                              ? 'bg-rose-600 text-white shadow-sm'
                              : blk.color === 'emerald'
                              ? 'bg-emerald-100 text-emerald-700'
                              : blk.color === 'purple'
                              ? 'bg-purple-100 text-purple-700'
                              : blk.color === 'amber'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {blk.letter}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {blk.name}
                            </p>
                            {hasComplaints && (
                              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">{blk.wing}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasComplaints ? (
                            <span className="rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-[10px] font-black">
                              🚨 {stats.total} Active {stats.urgent > 0 ? `(${stats.urgent} Urgent)` : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              ✓ 0 Issues
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {blk.occ}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">{blk.count}</p>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          hasComplaints
                            ? 'bg-rose-500'
                            : blk.color === 'emerald'
                            ? 'bg-emerald-500'
                            : blk.color === 'purple'
                            ? 'bg-purple-600'
                            : blk.color === 'amber'
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: blk.occ }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Total 5 Blocks: <strong>450 Beds</strong></span>
            <NextLink href="/warden/rooms" className="font-semibold text-blue-600 hover:underline flex items-center gap-1">
              Campus Bed Overview →
            </NextLink>
          </div>
        </div>

        {/* Right: Urgent Maintenance Queue */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Maintenance Queue (All 5 Blocks)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time student submitted defects requiring staff dispatch
                </p>
              </div>
              <span className="rounded-full bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold">
                {urgentTickets.length} Active Tickets
              </span>
            </div>

            {/* Maintenance Queue Table */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-2">Ticket / Student</th>
                    <th className="pb-2">Room / Bed</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Priority</th>
                    <th className="pb-2">SLA Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {urgentTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                        No maintenance complaints registered yet. Student submissions will appear here in real-time.
                      </td>
                    </tr>
                  ) : (
                    urgentTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5">
                        <button
                          onClick={() => setViewTicket(ticket)}
                          className="text-left font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                        >
                          #{ticket.id} • {ticket.studentName}
                        </button>
                        <p className="text-[10px] text-slate-400 font-mono">{ticket.studentId}</p>
                      </td>
                      <td className="py-2.5 font-medium text-slate-700 dark:text-slate-300">
                        {ticket.room} <span className="text-[10px] text-slate-400">({ticket.bed})</span>
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          {ticket.categoryIcon === 'droplets' && <Droplets className="h-3 w-3 text-red-500" />}
                          {ticket.categoryIcon === 'zap' && <Zap className="h-3 w-3 text-amber-500" />}
                          {ticket.categoryIcon === 'wifi' && <Wifi className="h-3 w-3 text-blue-500" />}
                          {ticket.categoryIcon === 'lock' && <Lock className="h-3 w-3 text-amber-500" />}
                          {ticket.title}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            ticket.priority === 'High'
                              ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                              : ticket.priority === 'Medium'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-2.5">
                        {ticket.status === 'resolved' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Resolved
                          </span>
                        ) : ticket.status === 'in_progress' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            <Wrench className="h-3 w-3 animate-spin" /> In Progress
                          </span>
                        ) : ticket.slaBreaching ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                            <Clock className="h-3 w-3" /> {ticket.slaStatus}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">{ticket.slaStatus}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right space-x-1.5 whitespace-nowrap">
                        {ticket.status === 'resolved' || ticket.status === 'student_approved' ? (
                          <div className="inline-flex items-center gap-1.5">
                            {ticket.studentApproved ? (
                              <button
                                onClick={() => handleDeleteTicket(ticket.id)}
                                className="rounded border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors shadow-sm inline-flex items-center gap-1"
                                title="Remove solved and student-approved ticket"
                              >
                                <Trash2 className="h-3 w-3" /> Remove Ticket
                              </button>
                            ) : (
                              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200 dark:border-amber-900">
                                ⏳ Awaiting Student Approval
                              </span>
                            )}
                            <button
                              onClick={() => setViewTicket(ticket)}
                              className="rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-sm"
                            >
                              View
                            </button>
                          </div>
                        ) : ticket.status === 'in_progress' ? (
                          <>
                            <button
                              onClick={() => handleOpenAssignModal(ticket)}
                              className="rounded bg-indigo-600 dark:bg-indigo-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                              title={`Assigned to ${ticket.assignedStaff}`}
                            >
                              Reassign ({ticket.assignedStaff?.split(' ')[0]})
                            </button>
                            <button
                              onClick={() => setViewTicket(ticket)}
                              className="rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              View
                            </button>
                          </>
                        ) : ticket.priority === 'High' ? (
                          <>
                            <button
                              onClick={() => handleOpenAssignModal(ticket)}
                              className="rounded bg-[#2563EB] px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              Assign Staff
                            </button>
                            <button
                              onClick={() => setViewTicket(ticket)}
                              className="rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              View
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setViewTicket(ticket)}
                              className="rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => setViewTicket(ticket)}
                              className="rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              View
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Displaying {urgentTickets.length} maintenance tickets across all 5 hostel blocks</span>
            <NextLink href="/warden/complaints" className="font-semibold text-blue-600 hover:underline flex items-center gap-1">
              Go to Complaint Management →
            </NextLink>
          </div>
        </div>
      </div>

      {/* 4.5 Campus Governance: Wardens & 5-Block Allocation Directory + Confidential Grievances */}
      <div className="space-y-4">
        {/* Wardens Directory */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Campus Wardens & 5-Block Allocation Directory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reflecting resident wardens and designated administrative jurisdiction per block
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold">
              5 Blocks Fully Governed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {wardens.map((w) => {
              const matchedBlockKey = Object.keys(blockComplaintStats).find((k) =>
                w.assignedBlockName.toLowerCase().includes(k.toLowerCase()) ||
                k.toLowerCase().includes(w.assignedBlockName.toLowerCase())
              )
              const blockStats = matchedBlockKey
                ? blockComplaintStats[matchedBlockKey]
                : { total: 0, urgent: 0, pending: 0 }
              const hasBlockComplaints = (blockStats.total || 0) > 0

              const wardenReports = wardenGrievances.filter((g) =>
                g.wardenName.toLowerCase().includes(w.name.toLowerCase()) ||
                w.name.toLowerCase().includes(g.wardenName.toLowerCase())
              )
              const hasGrievances = wardenReports.length > 0

              return (
                <div
                  key={w.id}
                  className={`rounded-xl p-3.5 space-y-2.5 transition-all ${
                    hasGrievances
                      ? 'border-2 border-red-600 dark:border-red-500 bg-red-50/80 dark:bg-red-950/40 shadow-lg shadow-red-500/20 ring-2 ring-red-500/30'
                      : hasBlockComplaints
                      ? 'border-2 border-rose-400 dark:border-rose-600 bg-rose-50/60 dark:bg-rose-950/30 shadow-md shadow-rose-500/10 ring-2 ring-rose-500/20'
                      : 'border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-300'
                  }`}
                >
                  {/* Student Grievance Reported Against Warden Alert */}
                  {hasGrievances && (
                    <div className="flex items-center justify-between rounded-lg bg-red-600 text-white px-2 py-1 text-[10px] font-black animate-pulse shadow-sm">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Grievance Filed!
                      </span>
                      <span>
                        {wardenReports.length} report{wardenReports.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Block Defect Notice */}
                  {hasBlockComplaints && !hasGrievances && (
                    <div className="flex items-center justify-between rounded-lg bg-rose-500/15 border border-rose-500/30 px-2 py-1 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                        Defects Reported
                      </span>
                      <span>
                        {blockStats.total} ticket{blockStats.total > 1 ? 's' : ''}{' '}
                        {blockStats.urgent > 0 ? `(${blockStats.urgent} urg)` : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        w.avatar ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={w.name}
                      className={`h-10 w-10 rounded-full object-cover ring-2 ${
                        hasGrievances ? 'ring-red-600' : hasBlockComplaints ? 'ring-rose-500' : 'ring-blue-500/20'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {w.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate">{w.designation}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Assigned:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          hasGrievances
                            ? 'bg-red-600 text-white shadow-sm'
                            : hasBlockComplaints
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60'
                        }`}
                      >
                        {w.assignedBlockName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Phone:</span>
                      <span>{w.phone}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 truncate">
                      <span>Email:</span>
                      <span className="truncate max-w-[130px]">{w.email}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> On Duty
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {w.id}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Confidential Grievances against Wardens Panel (Admin View ONLY) */}
        <div id="warden-grievances-section" className="rounded-xl border-2 border-rose-400/80 dark:border-rose-900/80 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-rose-100 dark:border-rose-950/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Confidential Student Grievances on Wardens
                  </h3>
                  <span className="rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 text-[10px] font-extrabold px-2 py-0.5">
                    Admin Eyes Only
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Protected direct reporting channel. Wardens have zero visibility into complaints registered here.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 text-xs font-bold">
              {wardenGrievances.length} Reports Registered
            </span>
          </div>

          {wardenGrievances.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
              <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No active warden grievances on record
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                When students file complaints against warden misconduct, harassment, or negligence, they appear securely here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-2">Report ID / Student</th>
                    <th className="pb-2">Block & Room</th>
                    <th className="pb-2">Accused Warden</th>
                    <th className="pb-2">Grievance Nature</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Investigation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {wardenGrievances.map((grv) => (
                    <tr key={grv.id} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/20 transition-colors">
                      <td className="py-2.5">
                        <button
                          onClick={() => {
                            setReviewGrievance(grv)
                            setGrievanceNotes(grv.adminNotes || '')
                          }}
                          className="text-left font-bold text-slate-900 dark:text-white hover:text-rose-600 transition-colors"
                        >
                          #{grv.id} • {grv.studentName}
                        </button>
                        <p className="text-[10px] text-slate-400">{grv.studentEmail}</p>
                      </td>
                      <td className="py-2.5 font-medium text-slate-700 dark:text-slate-300">
                        {grv.blockName} &bull; Room {grv.roomNumber}
                      </td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                        {grv.wardenName}
                      </td>
                      <td className="py-2.5">
                        <span className="rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-rose-200/60">
                          {grv.category.replace('_', ' ')}
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold mt-0.5 line-clamp-1">
                          {grv.subject}
                        </p>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            grv.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : grv.status === 'investigating'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {grv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setReviewGrievance(grv)
                            setGrievanceNotes(grv.adminNotes || '')
                          }}
                          className="rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-2.5 py-1 text-[10px] font-bold hover:opacity-90 transition-opacity"
                        >
                          Review & Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 5. Bottom Section: Recent Student Check-Ins (65%) + Facility Utilities (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Recent Student Check-Ins & Movements */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Student Check-Ins & Movements
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Biometric turnstile check-ins and new hall assignments
                </p>
              </div>
              <button
                onClick={() => toast.info('Opening comprehensive biometric check-in log...')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View All Logins
              </button>
            </div>

            <div className="space-y-3 mt-3">
              {/* Row 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="Maya Lin"
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Maya Lin</span>
                      <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold">
                        Admitted & Key Issued
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Assigned to <strong className="text-slate-700 dark:text-slate-300">Block B (Kilimanjaro)</strong> • Room 204-A
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Just now</span>
                  <p className="text-[10px] text-slate-400">Admin: Warden Jenkins</p>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
                    alt="Kavita Patel"
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Kavita Patel</span>
                      <span className="rounded bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 text-[10px] font-bold">
                        Room Swap Complete
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Transferred from A-108 to <strong className="text-slate-700 dark:text-slate-300">Block C (Nilgiri)</strong> • Room 310
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">14m ago</span>
                  <p className="text-[10px] text-slate-400">Self-Portal Request</p>
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                    alt="Tariq Okonjo"
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Tariq Okonjo</span>
                      <span className="rounded bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 text-[10px] font-bold">
                        Curfew Biometric Scan
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      North Gate Turnstile 02 • <strong className="text-slate-700 dark:text-slate-300">Block A (Everest)</strong>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">38m ago</span>
                  <p className="text-[10px] text-slate-400">Verified Tag</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Facility Utilities */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Facility Utilities
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time IoT building sensor health checks
                </p>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-2.5 mt-3">
              {/* Utility 1 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                    <Droplets className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Water Supply</p>
                    <p className="text-[10px] text-slate-400">Overhead Tanks 88% full</p>
                  </div>
                </div>
                <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                  NORMAL
                </span>
              </div>

              {/* Utility 2 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Main Power Grid</p>
                    <p className="text-[10px] text-slate-400">Backup Diesel Gen: Ready</p>
                  </div>
                </div>
                <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                  ACTIVE
                </span>
              </div>

              {/* Utility 3 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                    <Wifi className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Mesh Wi-Fi Fleet</p>
                    <p className="text-[10px] text-slate-400">99.8% Uptime (94 APs)</p>
                  </div>
                </div>
                <span className="rounded bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                  OPTIMAL
                </span>
              </div>

              {/* Utility 4 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Central Mess Hall</p>
                    <p className="text-[10px] text-slate-400">Dinner Prep: 18:30 - 21:00</p>
                  </div>
                </div>
                <span className="rounded bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                  SERVING
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Central Control Room</span>
            <button
              onClick={() => toast.info('IoT Diagnostics logs stream loaded.')}
              className="font-semibold text-blue-600 hover:underline"
            >
              Diagnostics Log →
            </button>
          </div>
        </div>
      </div>

      {/* 6. Page Footer */}
      <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <div>
          <span>HostelOS v2.4.0 • FastAPI Ready Enterprise SaaS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-slate-600 dark:text-slate-400">Postgres & Redis Linked</span>
        </div>
        <div>
          <span>© 2025 HostelOS Systems Inc. All rights reserved.</span>
        </div>
      </div>

      {/* Modal 1: View Ticket Details */}
      {viewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  {viewTicket.categoryIcon === 'droplets' && <Droplets className="h-5 w-5 text-red-500" />}
                  {viewTicket.categoryIcon === 'zap' && <Zap className="h-5 w-5 text-amber-500" />}
                  {viewTicket.categoryIcon === 'wifi' && <Wifi className="h-5 w-5 text-blue-500" />}
                  {viewTicket.categoryIcon === 'lock' && <Lock className="h-5 w-5 text-amber-500" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      #{viewTicket.id}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                        viewTicket.priority === 'High'
                          ? 'bg-red-50 dark:bg-red-950 text-red-600 border border-red-200 dark:border-red-900'
                          : 'bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-900'
                      }`}
                    >
                      {viewTicket.priority} Priority
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                        viewTicket.status === 'resolved'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200'
                          : viewTicket.status === 'in_progress'
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border border-indigo-200'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200'
                      }`}
                    >
                      {viewTicket.status === 'resolved'
                        ? 'Resolved'
                        : viewTicket.status === 'in_progress'
                        ? 'In Progress'
                        : 'Pending Dispatch'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {viewTicket.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setViewTicket(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Resident & Room Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                    <span>Reported By Student</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {viewTicket.studentName}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {viewTicket.studentId} • {viewTicket.studentPhone}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Building className="h-3.5 w-3.5 text-blue-500" />
                    <span>Location Details</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Room {viewTicket.room} ({viewTicket.bed})
                  </p>
                  <p className="text-xs text-slate-500">
                    {viewTicket.block}
                  </p>
                </div>
              </div>

              {/* Problem Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Incident Description
                </label>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {viewTicket.description}
                </div>
              </div>

              {/* Technician Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assigned Facility Technician
                </label>
                {viewTicket.assignedStaff ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
                        {viewTicket.assignedStaff.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {viewTicket.assignedStaff}
                          </p>
                          <span className="rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 text-[10px] font-bold">
                            On Site
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {viewTicket.assignedRole || 'Facilities Technician'} • {viewTicket.assignedPhone}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const target = viewTicket
                        setViewTicket(null)
                        handleOpenAssignModal(target)
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                    >
                      Reassign Technician →
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                        No technician dispatched yet. SLA Breaching timer is currently ticking!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const target = viewTicket
                        setViewTicket(null)
                        handleOpenAssignModal(target)
                      }}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm shrink-0"
                    >
                      Dispatch Staff Now
                    </button>
                  </div>
                )}
              </div>

              {/* Admin Urgency Priority Management */}
              <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      Administrator Urgency Override
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Students cannot set urgency. Adjust priority level to re-classify SLA threshold across all portals:
                    </p>
                  </div>
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-900">
                    Current: {viewTicket.priority}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {(['urgent', 'high', 'medium', 'low'] as ComplaintPriority[]).map((p) => {
                    const isCurrent = viewTicket.priority.toLowerCase() === p
                    return (
                      <button
                        key={p}
                        onClick={() => handleUpdatePriority(viewTicket.id, p)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                            : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {p === 'urgent' && '🚨 '}
                        {p === 'high' && '⚡ '}
                        {p === 'medium' && '📋 '}
                        {p === 'low' && '☕ '}
                        Set {p}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Timeline / Activity Audit Log */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Lifecycle Audit Trail
                </label>
                <div className="space-y-2 border-l-2 border-blue-500/30 dark:border-blue-500/20 pl-3 ml-2">
                  {viewTicket.timeline.map((item, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[19px] top-1 h-2 w-2 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {item.time}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.event}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">By {item.actor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                SLA Status: <strong className="text-slate-700 dark:text-slate-300 font-mono">{viewTicket.slaStatus}</strong>
              </span>
              <div className="flex items-center gap-2">
                {viewTicket.status !== 'resolved' && viewTicket.status !== 'student_approved' && (
                  <button
                    onClick={() => handleResolveTicket(viewTicket.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Sign Off & Resolve
                  </button>
                )}
                {(viewTicket.status === 'resolved' || viewTicket.status === 'student_approved') && (
                  viewTicket.studentApproved ? (
                    <button
                      onClick={() => handleDeleteTicket(viewTicket.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove Solved Ticket
                    </button>
                  ) : (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-900">
                      ⏳ Awaiting Student Approval before removal
                    </span>
                  )
                )}
                <button
                  onClick={() => setViewTicket(null)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Assign / Dispatch Staff */}
      {assignTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Dispatch Maintenance Staff
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ticket #{assignTicket.id} • Room {assignTicket.room} ({assignTicket.bed}) • {assignTicket.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignTicket(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmAssignment} className="p-6 space-y-4 overflow-y-auto">
              {/* Select Technician */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select On-Duty Facility Technician
                </label>
                <div className="space-y-2">
                  {availableStaff.map((staff) => {
                    const isSelected = selectedStaffId === staff.id
                    return (
                      <div
                        key={staff.id}
                        onClick={() => setSelectedStaffId(staff.id)}
                        className={`cursor-pointer rounded-xl border p-3 flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-600 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {staff.name}
                              </p>
                              <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 px-1 py-0.2 text-[9px] font-bold">
                                {staff.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {staff.role} • {staff.specialty}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-mono text-slate-500">
                            {staff.activeJobs} active {staff.activeJobs === 1 ? 'task' : 'tasks'}
                          </span>
                          <p className="text-[10px] text-slate-400">{staff.phone}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Priority & ETA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dispatch Priority
                  </label>
                  <select
                    value={dispatchPriority}
                    onChange={(e) => setDispatchPriority(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="High">🚨 Emergency / High Priority</option>
                    <option value="Medium">⚡ Standard Priority</option>
                    <option value="Low">📋 Scheduled / Low Priority</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Response ETA
                  </label>
                  <select
                    value={dispatchEta}
                    onChange={(e) => setDispatchEta(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="15 mins">Immediate (Within 15 mins)</option>
                    <option value="30 mins">Urgent (Within 30 mins)</option>
                    <option value="1 hour">Within 1 hour</option>
                    <option value="Today">Before end of day shift</option>
                  </select>
                </div>
              </div>

              {/* Work Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Warden / Admin Dispatch Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="e.g., Bring replacement valve, verify student is present in room..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignTicket(null)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirm & Dispatch Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confidential Grievance Review Modal (Admin Exclusive) */}
      {reviewGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Confidential Warden Grievance #{reviewGrievance.id}
                  </h3>
                  <p className="text-xs text-rose-500 font-medium">
                    Strictly Protected • Hidden from Warden Portal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewGrievance(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Complainant Student</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{reviewGrievance.studentName}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{reviewGrievance.studentEmail}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{reviewGrievance.studentPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Hostel Location</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{reviewGrievance.blockName}</p>
                  <p className="text-slate-500 text-[11px]">Room {reviewGrievance.roomNumber}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-600 uppercase">Reported Warden</span>
                  <span className="rounded bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                    {reviewGrievance.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{reviewGrievance.wardenName}</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 pt-1">{reviewGrievance.subject}</p>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap pt-0.5">{reviewGrievance.description}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Administrator Resolution & Action Notes
                </label>
                <textarea
                  rows={3}
                  value={grievanceNotes}
                  onChange={(e) => setGrievanceNotes(e.target.value)}
                  placeholder="e.g. Conducted inquiry with student. Warden counselled and unauthorized penalty reversed."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateGrievanceStatus(reviewGrievance.id, 'investigating', grievanceNotes)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 hover:bg-amber-500/25"
                  >
                    Mark Investigating
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateGrievanceStatus(reviewGrievance.id, 'resolved', grievanceNotes)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  >
                    Take Action & Resolve
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewGrievance(null)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
