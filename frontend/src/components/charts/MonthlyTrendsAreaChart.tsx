import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface TrendPoint {
  month: string
  reported: number
  resolved: number
}

interface MonthlyTrendsAreaChartProps {
  data?: TrendPoint[]
}

const DEFAULT_DATA: TrendPoint[] = [
  { month: 'May', reported: 32, resolved: 30 },
  { month: 'Jun', reported: 28, resolved: 27 },
  { month: 'Jul', reported: 45, resolved: 41 },
  { month: 'Aug', reported: 58, resolved: 52 },
  { month: 'Sep', reported: 68, resolved: 60 },
  { month: 'Oct', reported: 22, resolved: 18 },
]

export const MonthlyTrendsAreaChart: React.FC<MonthlyTrendsAreaChartProps> = ({
  data = DEFAULT_DATA,
}) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="reported"
            stroke="#6366f1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorReported)"
            name="Reported"
          />
          <Area
            type="monotone"
            dataKey="resolved"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorResolved)"
            name="Resolved"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
