import React from 'react'
import type { Complaint } from '@/lib/types'
import { StatusBadge } from './StatusBadge'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { Wrench, Clock, MapPin, User, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ComplaintCardProps {
  complaint: Complaint
  onClick?: () => void
  showAssignee?: boolean
  className?: string
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  onClick,
  showAssignee = true,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        'group relative rounded-xl border border-slate-200/90 bg-white p-4 text-left transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700',
        onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        className
      )}
    >
      {/* Header: Ticket & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
            {complaint.ticketNumber}
          </span>
          <span className="text-[11px] text-slate-400">•</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {complaint.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <StatusBadge status={complaint.priority} size="sm" />
          <StatusBadge status={complaint.status} size="sm" />
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-3 space-y-1.5">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
          {complaint.title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {complaint.description}
        </p>
      </div>

      {/* Footer Info Strip */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Room {complaint.roomNumber}</span>
          </span>

          {complaint.studentName && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{complaint.studentName}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showAssignee && (
            <span className="flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-indigo-500" />
              <span>{complaint.assignedStaffName || <em className="text-amber-500 font-normal">Unassigned</em>}</span>
            </span>
          )}

          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRelativeTime(complaint.createdAt)}</span>
          </span>

          {onClick && (
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          )}
        </div>
      </div>
    </div>
  )
}
