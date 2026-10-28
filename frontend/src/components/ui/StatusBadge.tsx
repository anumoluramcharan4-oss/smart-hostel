import React from 'react'
import { cn } from '@/lib/utils/cn'

export type StatusType =
  | 'success'
  | 'resolved'
  | 'approved'
  | 'available'
  | 'active'
  | 'pending'
  | 'warning'
  | 'in_progress'
  | 'partially_occupied'
  | 'critical'
  | 'error'
  | 'rejected'
  | 'maintenance'
  | 'info'
  | 'low'
  | 'medium'
  | 'high'
  | 'closed'
  | string

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: StatusType
  variant?: 'success' | 'pending' | 'warning' | 'critical' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  dot?: boolean
}

/**
 * Single StatusBadge used consistently across the entire Smart Hostel platform.
 * 
 * Strict Color System:
 * - green  = success / resolved / approved / available / active
 * - yellow = pending
 * - orange = warning / in_progress / partially_occupied / medium
 * - red    = critical / error / rejected / maintenance / high
 * - blue   = info / low
 * - slate  = neutral / closed
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  size = 'md',
  dot = true,
  children,
  className,
  ...props
}) => {
  // Derive base color family if variant is not explicitly passed
  const normalizedStatus = (status || '').toLowerCase().replace(/[\s-]/g, '_')

  let resolvedVariant = variant
  if (!resolvedVariant) {
    if (['resolved', 'success', 'approved', 'available', 'active', 'green'].includes(normalizedStatus)) {
      resolvedVariant = 'success'
    } else if (['pending', 'yellow'].includes(normalizedStatus)) {
      resolvedVariant = 'pending'
    } else if (['in_progress', 'warning', 'partially_occupied', 'medium', 'orange'].includes(normalizedStatus)) {
      resolvedVariant = 'warning'
    } else if (['critical', 'error', 'rejected', 'maintenance', 'high', 'red'].includes(normalizedStatus)) {
      resolvedVariant = 'critical'
    } else if (['info', 'low', 'blue', 'weekend_leave', 'day_outpass', 'vacation', 'emergency'].includes(normalizedStatus)) {
      resolvedVariant = 'info'
    } else {
      resolvedVariant = 'neutral'
    }
  }

  const variantStyles = {
    // green = success / resolved
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    // yellow = pending
    pending:
      'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    // orange = warning / in_progress
    warning:
      'bg-orange-50 text-orange-700 border-orange-200/70 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60',
    // red = critical / error / rejected
    critical:
      'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    // blue = info / low
    info:
      'bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    // slate = neutral / closed
    neutral:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  }

  const dotColorMap = {
    success: 'bg-emerald-500',
    pending: 'bg-amber-400',
    warning: 'bg-orange-500',
    critical: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
  }

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  }

  const displayText = children || (status ? status.replace(/_/g, ' ') : resolvedVariant)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border leading-none capitalize select-none transition-colors',
        variantStyles[resolvedVariant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColorMap[resolvedVariant])}
          aria-hidden="true"
        />
      )}
      <span>{displayText}</span>
    </span>
  )
}
