import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface CategoryData {
  category: string
  count: number
}

interface CategoryBarChartProps {
  data?: CategoryData[]
}

const DEFAULT_DATA: CategoryData[] = [
  { category: 'Electrical', count: 24 },
  { category: 'Plumbing', count: 18 },
  { category: 'Internet', count: 14 },
  { category: 'Carpentry', count: 9 },
  { category: 'Cleanliness', count: 7 },
  { category: 'Appliances', count: 6 },
]

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  data = DEFAULT_DATA,
}) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <XAxis
            dataKey="category"
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
          <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
