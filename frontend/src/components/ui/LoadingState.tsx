import React from 'react'
import { Loader2 } from 'lucide-react'
import { Skeleton } from './Skeleton'
import { cn } from '@/lib/utils/cn'

export interface LoadingStateProps {
  message?: string
  subtext?: string
  variant?: 'spinner' | 'skeleton' | 'table'
  rows?: number
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  subtext = 'Fetching the latest updates from smart hostel services',
  variant = 'spinner',
  rows = 4,
  className,
}) => {
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3 p-4', className)}>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: rows }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4', className)}>
        <div className="flex justify-between items-center pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-3 shadow-inner">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {message}
      </h4>
      {subtext && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          {subtext}
        </p>
      )}
    </div>
  )
}
