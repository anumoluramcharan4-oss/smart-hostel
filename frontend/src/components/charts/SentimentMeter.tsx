import React from 'react'
import { Smile, Meh, Frown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SentimentMeterProps {
  positive?: number // percentage
  neutral?: number
  negative?: number
  averageRating?: number
  totalReviews?: number
  className?: string
}

export const SentimentMeter: React.FC<SentimentMeterProps> = ({
  positive = 68,
  neutral = 21,
  negative = 11,
  averageRating = 4.1,
  totalReviews = 142,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400 font-medium ml-1">/ 5.0</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Based on {totalReviews} meal ratings this month
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <Smile className="w-4 h-4" />
          <span>{positive}% Positive</span>
        </div>
      </div>

      {/* Progress Bar Stack */}
      <div className="h-3.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
        <div
          style={{ width: `${positive}%` }}
          className="bg-emerald-500 transition-all duration-500"
          title={`Positive: ${positive}%`}
        />
        <div
          style={{ width: `${neutral}%` }}
          className="bg-amber-400 transition-all duration-500"
          title={`Neutral: ${neutral}%`}
        />
        <div
          style={{ width: `${negative}%` }}
          className="bg-rose-500 transition-all duration-500"
          title={`Negative: ${negative}%`}
        />
      </div>

      {/* Breakdown Legend */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
        <div className="flex items-center gap-2">
          <Smile className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-slate-600 dark:text-slate-400">Positive ({positive}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <Meh className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-slate-600 dark:text-slate-400">Neutral ({neutral}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <Frown className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-slate-600 dark:text-slate-400">Negative ({negative}%)</span>
        </div>
      </div>
    </div>
  )
}
