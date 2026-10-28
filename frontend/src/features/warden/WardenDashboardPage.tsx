import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Calendar,
  Building,
  Utensils,
  Shield,
  Bot,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { useToast } from '@/app/ToastContext'
import { api } from '@/lib/api'
import type { Complaint, LeaveRequest, AIInsight, Room } from '@/lib/types'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime, formatDate, getPriorityBadgeVariant } from '@/lib/utils/formatters'

export const WardenDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [compRes, leaveRes, insRes, roomRes] = await Promise.all([
        api.getComplaints(),
        api.getLeaves(),
        api.getAIInsights(),
        api.getRooms(),
      ])
      setComplaints(compRes)
      setLeaves(leaveRes)
      setInsights(insRes)
      setRooms(roomRes)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const pendingComplaints = complaints.filter((c) => c.status !== 'resolved')
  const criticalComplaints = complaints.filter((c) => c.priority === 'critical' && c.status !== 'resolved')
  const pendingLeaves = leaves.filter((l) => l.status === 'pending')

  const totalBeds = rooms.reduce((acc, r) => acc + r.capacity, 0)
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupants.length, 0)

  const handleQuickApproveLeave = async (leaveId: string) => {
    await api.reviewLeave(leaveId, 'approved')
    success('Leave request approved')
    loadData()
  }

  const handleQuickRejectLeave = async (leaveId: string) => {
    await api.reviewLeave(leaveId, 'rejected', 'Did not meet gate outpass approval criteria')
    success('Leave request rejected')
    loadData()
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hostel Warden Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {user?.name}
          </h1>
          <p className="text-xs text-slate-300">
            Assigned: Block A (Newton) & Block B (Aryabhata) • 192 Beds Capacity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => navigate('/warden/complaints')}
          >
            Triage Complaints Queue
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Complaints"
          value={pendingComplaints.length}
          subtext={`${criticalComplaints.length} critical SLA tickets`}
          trend={{ value: '-14%', isPositive: true, label: 'resolution turnaround' }}
          icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
          iconColor="amber"
          onClick={() => navigate('/warden/complaints')}
        />
        <StatCard
          title="Pending Leaves"
          value={pendingLeaves.length}
          subtext="Requires warden review"
          trend={{ value: `${pendingLeaves.length} requests`, isPositive: false }}
          icon={<Calendar className="w-5 h-5 text-indigo-500" />}
          iconColor="indigo"
          onClick={() => navigate('/warden/leave')}
        />
        <StatCard
          title="Block Occupancy"
          value={`${occupiedBeds} / ${totalBeds}`}
          subtext={`${((occupiedBeds / totalBeds) * 100).toFixed(1)}% capacity`}
          icon={<Building className="w-5 h-5 text-emerald-500" />}
          iconColor="emerald"
          onClick={() => navigate('/warden/rooms')}
        />
        <StatCard
          title="Mess Sentiment"
          value="4.1 / 5.0"
          subtext="68% positive meal ratings"
          trend={{ value: '+0.2', isPositive: true, label: 'weekly score' }}
          icon={<Utensils className="w-5 h-5 text-purple-500" />}
          iconColor="slate"
          onClick={() => navigate('/warden/mess')}
        />
      </div>

      {/* AI Predictive Maintenance Alert */}
      {insights.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/60 dark:bg-rose-950/20 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-600 text-white shadow-sm shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-rose-950 dark:text-rose-200">
                {insights[0].title}
              </h4>
              <Badge variant="critical" size="sm">{insights[0].metric}</Badge>
            </div>
            <p className="mt-1 text-rose-800 dark:text-rose-300 leading-relaxed">
              {insights[0].description}
            </p>
          </div>
        </div>
      )}

      {/* Grid: Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical & High Priority Complaints requiring attention */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Urgent Complaints Requiring Action
              </CardTitle>
              <p className="text-xs text-slate-500">Critical and high-priority maintenance tickets</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/warden/complaints')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingComplaints.slice(0, 4).map((comp) => (
              <div
                key={comp.id}
                onClick={() => navigate('/warden/complaints')}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {comp.ticketNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                      {comp.title}
                    </span>
                  </div>
                  <Badge variant={getPriorityBadgeVariant(comp.priority)} size="sm">
                    {comp.priority.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>Room: <strong className="text-slate-700 dark:text-slate-300">{comp.roomNumber} ({comp.blockName.split(' ')[0]})</strong></span>
                  <span>{comp.assignedStaffName ? `Assigned: ${comp.assignedStaffName}` : 'Needs Assignment'}</span>
                  <span>{formatRelativeTime(comp.createdAt)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leave Requests Awaiting Warden Approval */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Pending Leave & Outpass Queue
              </CardTitle>
              <p className="text-xs text-slate-500">Student travel applications pending gate approval</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/warden/leave')}
            >
              Manage Leaves
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingLeaves.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                All student leave requests have been reviewed!
              </div>
            ) : (
              pendingLeaves.slice(0, 3).map((leave) => (
                <div
                  key={leave.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {leave.studentName} ({leave.roomNumber})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {leave.type.replace('_', ' ').toUpperCase()} • {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                      </p>
                    </div>
                    <Badge variant="pending">Pending</Badge>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    "{leave.reason}"
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      Guardian: {leave.parentContact}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 hover:bg-rose-50 h-7 text-xs px-2.5"
                        onClick={() => handleQuickRejectLeave(leave.id)}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => handleQuickApproveLeave(leave.id)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
