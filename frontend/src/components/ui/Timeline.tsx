import React from 'react'
import { cn } from '@/lib/utils/cn'
import { formatDateTime, formatRelativeTime } from '@/lib/utils/formatters'
import { Check, Clock, AlertCircle } from 'lucide-react'

export interface TimelineItem {
  id: string
  title: string
  note?: string
  description?: string
  timestamp: string
  by?: string
  status?: string
}

export interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  if (!items || items.length === 0) {
    return <div className="text-xs text-slate-400 py-3 italic">No timeline entries yet.</div>
  }

  const getDotColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'approved':
        return 'bg-emerald-500 text-white'
      case 'in_progress':
      case 'warning':
        return 'bg-orange-500 text-white'
      case 'critical':
      case 'rejected':
      case 'error':
        return 'bg-rose-500 text-white'
      case 'pending':
        return 'bg-amber-400 text-white'
      default:
        return 'bg-indigo-600 text-white'
    }
  }

  return (
    <div className={cn('relative space-y-4 pl-6 text-xs', className)}>
      {/* Connecting Vertical Track */}
      <div
        className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800"
        aria-hidden="true"
      />

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        const dotBg = getDotColor(item.status)

        return (
          <div key={item.id} className="relative group">
            {/* Status Indicator Dot */}
            <div
              className={cn(
                'absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900',
                dotBg
              )}
            >
              {item.status === 'resolved' || item.status === 'approved' ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>

            {/* Entry Content */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {item.title}
                </span>
                <span className="text-slate-400 font-mono text-[10px]" title={formatDateTime(item.timestamp)}>
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>

              {(item.note || item.description) && (
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {item.note || item.description}
                </p>
              )}

              {item.by && (
                <span className="block text-[10px] text-slate-400">
                  Updated by: <strong className="font-semibold text-slate-500 dark:text-slate-400">{item.by}</strong>
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
