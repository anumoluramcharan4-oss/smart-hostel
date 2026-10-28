import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ExternalLink, Calendar, AlertCircle, Megaphone, Utensils } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { useToast } from '@/app/ToastContext'
import { api } from '@/lib/api'
import type { Notification } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

export const StudentNotificationsPage: React.FC = () => {
  const { user } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const loadNotifs = async () => {
    if (!user) return
    const list = await api.getNotifications(user.id)
    setNotifications(list)
  }

  useEffect(() => {
    loadNotifs()
  }, [user])

  const handleMarkAll = async () => {
    if (!user) return
    await api.markAllNotificationsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    success('All notifications marked as read')
  }

  const handleItemClick = async (notif: Notification) => {
    await api.markNotificationRead(notif.id)
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)))
    if (notif.link) navigate(notif.link)
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'complaint':
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      case 'leave':
        return <Calendar className="w-4 h-4 text-indigo-500" />
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-purple-500" />
      case 'mess':
        return <Utensils className="w-4 h-4 text-emerald-500" />
      default:
        return <Bell className="w-4 h-4 text-slate-400" />
    }
  }

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.read : true))

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Notifications Center
          </h1>
          <p className="text-xs text-slate-500">
            Live alerts on complaint updates, leave approvals, and campus announcements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAll}
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={cn(
              'flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer text-xs',
              item.read
                ? 'bg-white border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 opacity-80 hover:opacity-100'
                : 'bg-indigo-50/40 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/60 font-medium'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                {getIcon(item.type)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h4>
                  {!item.read && <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />}
                </div>
                <p className="text-slate-600 dark:text-slate-400">{item.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-400 shrink-0">
              <span className="text-[11px]">{formatRelativeTime(item.createdAt)}</span>
              {item.link && <ExternalLink className="w-3.5 h-3.5" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
