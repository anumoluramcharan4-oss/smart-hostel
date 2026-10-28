import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Calendar,
  Utensils,
  Bot,
  PlusCircle,
  DoorOpen,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { api } from '@/lib/api'
import type { Complaint, LeaveRequest, Announcement, Room } from '@/lib/types'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, formatDate } from '@/lib/utils/formatters'

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!user) return
      try {
        const [complaintsRes, leavesRes, announcementsRes, roomsRes] = await Promise.all([
          api.getComplaints({ studentId: user.id }),
          api.getLeaves(user.id),
          api.getAnnouncements(),
          api.getRooms(),
        ])
        setComplaints(complaintsRes)
        setLeaves(leavesRes)
        setAnnouncements(announcementsRes)
        const myRoom = roomsRes.find((r) => r.roomNumber === user.roomNumber)
        if (myRoom) setRoom(myRoom)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  const pendingComplaints = complaints.filter((c) => c.status !== 'resolved' && c.status !== 'closed')
  const pendingLeaves = leaves.filter((l) => l.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 text-white shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-medium text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Student Living Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-xs text-indigo-200">
            Room <strong className="text-white">{user?.roomNumber}</strong> • {user?.blockName} • Bed-1
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/student/raise-complaint">
            <Button
              size="sm"
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Raise Complaint
            </Button>
          </Link>
          <Link to="/student/assistant">
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              leftIcon={<Bot className="w-4 h-4" />}
            >
              Ask AI
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Complaints"
          value={pendingComplaints.length}
          subtext={pendingComplaints.length > 0 ? 'Staff dispatched / in queue' : 'All issues resolved'}
          icon={<AlertCircle className="w-5 h-5" />}
          iconColor="amber"
          onClick={() => navigate('/student/complaints')}
        />
        <StatCard
          title="Leave / Outpasses"
          value={leaves.length}
          subtext={pendingLeaves.length > 0 ? `${pendingLeaves.length} pending review` : 'No active leaves'}
          icon={<Calendar className="w-5 h-5" />}
          iconColor="indigo"
          onClick={() => navigate('/student/leave')}
        />
        <StatCard
          title="My Roommates"
          value={room ? room.occupants.length : '2'}
          subtext="Occupancy: 2/3 beds allocated"
          icon={<DoorOpen className="w-5 h-5" />}
          iconColor="emerald"
          onClick={() => navigate('/student/room')}
        />
        <StatCard
          title="Mess Satisfaction"
          value="4.1"
          subtext="Rated 4 stars today (Breakfast)"
          icon={<Utensils className="w-5 h-5" />}
          iconColor="slate"
          onClick={() => navigate('/student/mess')}
        />
      </div>

      {/* AI Smart Insight Alert */}
      <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-4 dark:border-indigo-900/60 dark:from-indigo-950/30 dark:to-purple-950/30 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div className="flex-1 text-xs">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">
              AI Hostel Proactive Advisory
            </h4>
            <Badge variant="pending" size="sm">Smart Notice</Badge>
          </div>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Water tank cleaning is scheduled for Saturday, Oct 3, from 9:00 AM to 1:00 PM in Block A.
            Water supply will be suspended during these hours. Please fill drinking bottles and bucket reserves on Friday evening.
          </p>
        </div>
      </div>

      {/* Main Grid: Complaints & Room Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Complaints (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent Room Complaints</CardTitle>
                <p className="text-xs text-slate-500">Track resolution progress and staff updates</p>
              </div>
              <Link to="/student/complaints" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                View all ({complaints.length})
              </Link>
            </CardHeader>
            <CardContent>
              {complaints.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  No open complaints. Everything is running smoothly!
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.slice(0, 3).map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => navigate('/student/complaints')}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {comp.ticketNumber}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                            {comp.title}
                          </span>
                        </div>
                        <Badge variant={comp.status === 'resolved' ? 'success' : comp.status === 'in_progress' ? 'warning' : 'pending'}>
                          {comp.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <span>Category: <strong>{comp.category}</strong></span>
                        {comp.assignedStaffName ? (
                          <span className="text-emerald-600 font-medium">Assigned: {comp.assignedStaffName}</span>
                        ) : (
                          <span>AI Priority: <strong className="capitalize">{comp.priority}</strong></span>
                        )}
                        <span>{formatRelativeTime(comp.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Announcements Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Hostel Bulletin Board</CardTitle>
                <p className="text-xs text-slate-500">Official updates from the warden & administration</p>
              </div>
              <Link to="/student/announcements" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                All Announcements
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {ann.title}
                    </span>
                    {ann.priority === 'urgent' && <Badge variant="critical">Urgent</Badge>}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>By {ann.authorName} ({ann.authorRole})</span>
                    <span>{formatDate(ann.createdAt)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Room & Quick Actions (1 col) */}
        <div className="space-y-6">
          {/* Roommates Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Room {user?.roomNumber}</span>
                <Badge variant="success">Active Stay</Badge>
              </CardTitle>
              <p className="text-xs text-slate-500">{user?.blockName} • Floor 2</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Allocated Occupants
                </span>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <Avatar name={user?.name || ''} size="sm" status="online" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{user?.name} (You)</p>
                    <p className="text-[11px] text-slate-400">Bed-1 • IT Dept (Year 3)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <Avatar name="Kabir Verma" size="sm" status="online" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Kabir Verma</p>
                    <p className="text-[11px] text-slate-400">Bed-2 • CS Dept (Year 3)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  <div className="h-7 w-7 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span>Bed-3: Vacant / Available</span>
                </div>
              </div>

              <Link to="/student/room">
                <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Inspect Room Assets
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-semibold"
                leftIcon={<Calendar className="w-4 h-4 text-purple-600" />}
                onClick={() => navigate('/student/leave')}
              >
                Apply for Weekend Outpass
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-semibold"
                leftIcon={<Utensils className="w-4 h-4 text-amber-600" />}
                onClick={() => navigate('/student/mess')}
              >
                Rate Today's Dinner Menu
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-semibold"
                leftIcon={<Bot className="w-4 h-4 text-sky-600" />}
                onClick={() => navigate('/student/assistant')}
              >
                Ask Hostel Assistant a Rule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
