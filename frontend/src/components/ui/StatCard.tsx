import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from './Card'
import { cn } from '@/lib/utils/cn'

export interface StatCardProps {
  title: string
  value: string | number
  subtext?: string
  trend?: {
    value: number | string
    isPositive?: boolean
    label?: string
  }
  icon?: React.ReactNode
  iconColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
  className?: string
  onClick?: () => void
}

function cleanTrendLabel(label?: string, trendValue?: string): string {
  if (!label) return ''
  let l = label.trim()
  if (trendValue && l.toLowerCase().startsWith(trendValue.toLowerCase())) {
    l = l.slice(trendValue.length).trim()
  }
  return l.replace(/^[+-]?\d+(\.\d+)?%?\s*/, '').trim()
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  trend,
  icon,
  iconColor = 'indigo',
  className,
  onClick,
}) => {
  const iconColorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }

  // Helper to format trend value cleanly without duplicate units
  const trendDisplayValue = trend
    ? typeof trend.value === 'string'
      ? trend.value
      : typeof trend.value === 'number'
      ? trend.value > 0
        ? `+${trend.value}%`
        : `${trend.value}%`
      : ''

  const cleanLabel = cleanTrendLabel(trend?.label, trendDisplayValue)

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {value}
            </h4>
          </div>
        </div>

        {icon && (
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconColorStyles[iconColor])}>
            {icon}
          </div>
        )}
      </div>

      {(trend || subtext) && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold shrink-0',
                trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trendDisplayValue}</span>
            </span>
          )}
          {cleanLabel ? (
            <span className="text-slate-500 dark:text-slate-400">
              {cleanLabel}
            </span>
          ) : subtext ? (
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {subtext}
            </span>
          ) : null}
        </div>
      )}
    </Card>
  )
}
