import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface BlockOccupancy {
  block: string
  capacity: number
  occupied: number
}

interface OccupancyBarChartProps {
  data?: BlockOccupancy[]
}

const DEFAULT_DATA: BlockOccupancy[] = [
  { block: 'Block A (Newton)', capacity: 96, occupied: 86 },
  { block: 'Block B (Aryabhata)', capacity: 96, occupied: 84 },
  { block: 'Block C (Curie)', capacity: 80, occupied: 72 },
  { block: 'Block D (Darwin)', capacity: 88, occupied: 70 },
]

export const OccupancyBarChart: React.FC<OccupancyBarChartProps> = ({
  data = DEFAULT_DATA,
}) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <XAxis
            dataKey="block"
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
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {value}
              </span>
            )}
          />
          <Bar dataKey="capacity" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Total Capacity" />
          <Bar dataKey="occupied" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Occupied" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
