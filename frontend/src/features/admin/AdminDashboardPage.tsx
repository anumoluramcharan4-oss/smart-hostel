import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building,
  Users,
  Shield,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Bot,
  Settings,
  Sparkles,
  Utensils,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { api } from '@/lib/api'
import type { Hostel, Block, Complaint, AIInsight } from '@/lib/types'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { OccupancyBarChart } from '@/components/charts/OccupancyBarChart'
import { MonthlyTrendsAreaChart } from '@/components/charts/MonthlyTrendsAreaChart'

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [hostel, setHostel] = useState<Hostel | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [hostelRes, blocksRes, complaintsRes, insightsRes] = await Promise.all([
          api.getHostel(),
          api.getBlocks(),
          api.getComplaints(),
          api.getAIInsights(),
        ])
        setHostel(hostelRes)
        setBlocks(blocksRes)
        setComplaints(complaintsRes)
        setInsights(insightsRes)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const pendingComplaints = complaints.filter((c) => c.status !== 'resolved' && c.status !== 'closed')
  const criticalComplaints = complaints.filter((c) => c.priority === 'critical' && c.status !== 'resolved')

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 p-6 text-white shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-semibold">
            <Building className="w-3.5 h-3.5 text-purple-400" />
            <span>Central Administration Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {hostel?.name || 'Apex Residential Towers'}
          </h1>
          <p className="text-xs text-slate-300">
            {hostel?.blocksCount} Blocks • {hostel?.occupiedCapacity} / {hostel?.totalCapacity} Students Housed • Chief Warden: {hostel?.chiefWarden}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => navigate('/admin/analytics')}
            leftIcon={<BarChart3 className="w-4 h-4" />}
          >
            Full Analytics Suite
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => navigate('/admin/settings')}
            leftIcon={<Settings className="w-4 h-4" />}
          >
            Settings
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Campus Occupancy"
          value={`${hostel?.occupiedCapacity || 312} / ${hostel?.totalCapacity || 360}`}
          subtext="86.7% capacity occupied"
          trend={{ value: '+4.8%', isPositive: true, label: 'semester gain' }}
          icon={<Building className="w-5 h-5 text-indigo-600" />}
          iconColor="indigo"
          onClick={() => navigate('/admin/hostels')}
        />
        <StatCard
          title="Open Complaints"
          value={pendingComplaints.length}
          subtext={`${criticalComplaints.length} critical SLA tickets`}
          trend={{ value: '-18%', isPositive: true, label: 'avg resolution time' }}
          icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
          iconColor="amber"
          onClick={() => navigate('/admin/complaints')}
        />
        <StatCard
          title="SLA Compliance Rate"
          value="98.4%"
          subtext="Tickets closed inside window"
          trend={{ value: '+1.2%', isPositive: true, label: 'SLA adherence' }}
          icon={<Shield className="w-5 h-5 text-emerald-600" />}
          iconColor="emerald"
          onClick={() => navigate('/admin/complaints')}
        />
        <StatCard
          title="Average Mess Score"
          value="4.1 / 5.0"
          subtext="142 ratings recorded this month"
          icon={<Utensils className="w-5 h-5 text-purple-600" />}
          iconColor="slate"
          onClick={() => navigate('/admin/mess')}
        />
      </div>

      {/* AI Intelligence Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.slice(0, 2).map((ins) => (
          <div
            key={ins.id}
            className="p-4 rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 dark:border-indigo-900/60 dark:from-indigo-950/20 dark:to-purple-950/20 flex items-start gap-3"
          >
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{ins.title}</h4>
                {ins.metric && <Badge variant="critical" size="sm">{ins.metric}</Badge>}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{ins.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dual Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hostel Blocks Capacity vs Occupancy</CardTitle>
            <p className="text-xs text-slate-500">Real-time room allocation counts across all 4 hostel halls</p>
          </CardHeader>
          <CardContent>
            <OccupancyBarChart
              data={blocks.map((b) => ({
                block: b.name.split(' ')[0],
                capacity: b.capacity,
                occupied: b.occupied,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Complaints & Resolution Velocity</CardTitle>
            <p className="text-xs text-slate-500">Volume of reported issues vs successfully resolved SLA tickets</p>
          </CardHeader>
          <CardContent>
            <MonthlyTrendsAreaChart />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
