'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type StatusType =
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'paid'
  | 'overdue'
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'present'
  | 'absent'
  | 'leave'
  | 'urgent'
  | 'important'
  | 'general'
  | 'low'
  | 'medium'
  | 'high'

interface StatusBadgeProps {
  status: StatusType | string
  className?: string
  showDot?: boolean
  label?: string
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  pending: {
    label: 'Pending',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/20 dark:border-amber-500/30',
    dot: 'bg-amber-500',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-500/20 dark:border-indigo-500/30',
    dot: 'bg-indigo-500 animate-pulse',
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/20 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  paid: {
    label: 'Paid',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/20 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  overdue: {
    label: 'Overdue',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/20 dark:border-rose-500/30',
    dot: 'bg-rose-500',
  },
  available: {
    label: 'Available',
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    text: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-500/20 dark:border-teal-500/30',
    dot: 'bg-teal-500',
  },
  occupied: {
    label: 'Occupied',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-500/20 dark:border-indigo-500/30',
    dot: 'bg-indigo-500',
  },
  maintenance: {
    label: 'Maintenance',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/20 dark:border-rose-500/30',
    dot: 'bg-rose-500',
  },
  present: {
    label: 'Present',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/20 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  absent: {
    label: 'Absent',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/20 dark:border-rose-500/30',
    dot: 'bg-rose-500',
  },
  leave: {
    label: 'On Leave',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/20 dark:border-blue-500/30',
    dot: 'bg-blue-500',
  },
  urgent: {
    label: 'Urgent',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/20 dark:border-rose-500/30',
    dot: 'bg-rose-500 animate-ping',
  },
  important: {
    label: 'Important',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/20 dark:border-amber-500/30',
    dot: 'bg-amber-500',
  },
  general: {
    label: 'General',
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-500/20 dark:border-slate-500/30',
    dot: 'bg-slate-400',
  },
  high: {
    label: 'High',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/20 dark:border-rose-500/30',
    dot: 'bg-rose-500',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/20 dark:border-amber-500/30',
    dot: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-500/20 dark:border-slate-500/30',
    dot: 'bg-slate-400',
  },
}

export function StatusBadge({
  status,
  className,
  showDot = true,
  label,
}: StatusBadgeProps) {
  const normalizedKey = status.toLowerCase()
  const conf = statusConfig[normalizedKey] || {
    label: status,
    bg: 'bg-secondary',
    text: 'text-secondary-foreground',
    border: 'border-border',
    dot: 'bg-muted-foreground',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm transition-colors',
        conf.bg,
        conf.text,
        conf.border,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-2 w-2 items-center justify-center">
          <span className={cn('h-1.5 w-1.5 rounded-full', conf.dot)} />
        </span>
      )}
      {label || conf.label}
    </span>
  )
}
