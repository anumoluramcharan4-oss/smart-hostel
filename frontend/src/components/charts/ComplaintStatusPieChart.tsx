import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface StatusCount {
  name: string
  value: number
  color: string
}

interface ComplaintStatusPieChartProps {
  data?: StatusCount[]
}

const DEFAULT_DATA: StatusCount[] = [
  { name: 'Resolved', value: 34, color: '#10b981' },
  { name: 'In Progress', value: 18, color: '#f59e0b' },
  { name: 'Pending', value: 12, color: '#6366f1' },
  { name: 'Critical', value: 4, color: '#ef4444' },
]

export const ComplaintStatusPieChart: React.FC<ComplaintStatusPieChartProps> = ({
  data = DEFAULT_DATA,
}) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
