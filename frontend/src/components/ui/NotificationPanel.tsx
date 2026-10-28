import React from 'react'
import type { Notification } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface NotificationPanelProps {
  notifications: Notification[]
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  onSelect?: (notif: Notification) => void
  className?: string
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSelect,
  className,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900', className)}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Notifications
          </h4>
          {unreadCount > 0 && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && onMarkAllRead && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No notifications available
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                onMarkRead?.(notif.id)
                onSelect?.(notif)
              }}
              className={cn(
                'group flex items-start gap-3 p-3 rounded-xl cursor-pointer text-xs transition-colors',
                notif.read
                  ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  : 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-medium'
              )}
            >
              <div
                className={cn(
                  'mt-1.5 h-2 w-2 rounded-full shrink-0',
                  notif.read ? 'bg-transparent' : 'bg-indigo-600 dark:bg-indigo-400'
                )}
              />

              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-slate-900 dark:text-slate-100">
                    {notif.title}
                  </h5>
                  <span className="text-[10px] text-slate-400">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {notif.link && (
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
