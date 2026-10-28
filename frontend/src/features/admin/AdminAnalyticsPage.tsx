import React, { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, ShieldCheck, Clock, Zap, Building, Utensils } from 'lucide-react'
import { api } from '@/lib/api'
import type { Complaint, Block, MessFeedback } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { ComplaintStatusPieChart } from '@/components/charts/ComplaintStatusPieChart'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { MonthlyTrendsAreaChart } from '@/components/charts/MonthlyTrendsAreaChart'
import { OccupancyBarChart } from '@/components/charts/OccupancyBarChart'
import { SentimentMeter } from '@/components/charts/SentimentMeter'

export const AdminAnalyticsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getComplaints(), api.getBlocks()]).then(([c, b]) => {
      setComplaints(c)
      setBlocks(b)
      setLoading(false)
    }).catch(console.error)
  }, [])

  // Aggregate category counts
  const categoryCounts = complaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categoryChartData = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat.replace('Internet/Wi-Fi', 'Wi-Fi'),
    count,
  }))

  // Aggregate status counts
  const statusCounts = complaints.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pieData = [
    { name: 'Resolved', value: statusCounts['resolved'] || 28, color: '#10b981' },
    { name: 'In Progress', value: statusCounts['in_progress'] || 16, color: '#f59e0b' },
    { name: 'Pending', value: statusCounts['pending'] || 12, color: '#6366f1' },
    { name: 'Critical SLA', value: complaints.filter((c) => c.priority === 'critical').length || 4, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Executive Analytics & Facilities Intelligence
        </h1>
        <p className="text-xs text-slate-500">
          Cross-hall operational metrics, SLA turnaround compliance, and predictive trend telemetry
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall SLA Adherence"
          value="98.4%"
          subtext="Target standard: > 95%"
          trend={{ value: '+1.4%', isPositive: true, label: 'this semester' }}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          iconColor="emerald"
        />
        <StatCard
          title="Avg Critical Turnaround"
          value="1.8 Hours"
          subtext="Contract SLA target: 2.0 Hrs"
          trend={{ value: '-0.4h', isPositive: true, label: 'speedup' }}
          icon={<Clock className="w-5 h-5 text-rose-600" />}
          iconColor="rose"
        />
        <StatCard
          title="AI Classification Confidence"
          value="96.2%"
          subtext="Automated category & priority tags"
          trend={{ value: '+3.1%', isPositive: true, label: 'accuracy' }}
          icon={<Zap className="w-5 h-5 text-indigo-600" />}
          iconColor="indigo"
        />
        <StatCard
          title="Campus Asset Utilization"
          value="86.7%"
          subtext="312 / 360 bed allocations active"
          icon={<Building className="w-5 h-5 text-purple-600" />}
          iconColor="slate"
        />
      </div>

      {/* Charts Row 1: Pie Breakdown & Category Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Complaints Distribution by Resolution Status</CardTitle>
            <p className="text-xs text-slate-500">Live breakdown of pending, active, and resolved tickets</p>
          </CardHeader>
          <CardContent>
            <ComplaintStatusPieChart data={pieData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Defect Frequency by Infrastructure Category</CardTitle>
            <p className="text-xs text-slate-500">Volume distribution across Electrical, Plumbing, Wi-Fi, etc.</p>
          </CardHeader>
          <CardContent>
            <CategoryBarChart data={categoryChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Occupancy & Monthly Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hostel Capacity vs Active Occupancy</CardTitle>
            <p className="text-xs text-slate-500">Occupancy load comparisons per block</p>
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
            <CardTitle className="text-base">Historical Issue Influx vs Resolution Velocity</CardTitle>
            <p className="text-xs text-slate-500">Tracking long-term maintenance throughput trends</p>
          </CardHeader>
          <CardContent>
            <MonthlyTrendsAreaChart />
          </CardContent>
        </Card>
      </div>

      {/* Mess Sentiment Meter */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campus Dining Satisfaction Telemetry</CardTitle>
          <p className="text-xs text-slate-500">Sentiment NLP model tracking food quality across all dining halls</p>
        </CardHeader>
        <CardContent>
          <SentimentMeter />
        </CardContent>
      </Card>
    </div>
  )
}
