import React, { useEffect, useState } from 'react'
import { Megaphone, Pin, Calendar, User, Search, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import type { Announcement } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils/formatters'

export const StudentAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'urgent' | 'pinned'>('all')

  useEffect(() => {
    api.getAnnouncements().then(setAnnouncements).catch(console.error)
  }, [])

  const filtered = announcements.filter((a) => {
    if (filter === 'urgent' && a.priority !== 'urgent') return false
    if (filter === 'pinned' && !a.isPinned) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Hostel Announcements
        </h1>
        <p className="text-xs text-slate-500">
          Official administrative broadcasts, maintenance notifications, and event schedules
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'urgent', 'pinned'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search circulars..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <Card
            key={item.id}
            className={`p-5 space-y-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 transition-all ${
              item.isPinned ? 'border-indigo-300/80 dark:border-indigo-800/80 bg-indigo-50/20 dark:bg-indigo-950/10' : ''
            }`}
            onClick={() => setSelectedAnnouncement(item)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {item.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      <Pin className="w-3 h-3 fill-current" />
                      PINNED
                    </span>
                  )}
                  {item.priority === 'urgent' && <Badge variant="critical">Urgent</Badge>}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
              {item.content}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {item.authorName} ({item.authorRole})
              </span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Full Modal View */}
      <Modal
        isOpen={Boolean(selectedAnnouncement)}
        onClose={() => setSelectedAnnouncement(null)}
        title={selectedAnnouncement?.title}
        description={`Published by ${selectedAnnouncement?.authorName} on ${
          selectedAnnouncement ? formatDate(selectedAnnouncement.createdAt) : ''
        }`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-2">
            {selectedAnnouncement?.priority === 'urgent' && <Badge variant="critical">Urgent Broadcast</Badge>}
            <Badge variant="pending">Audience: {selectedAnnouncement?.targetAudience.toUpperCase()}</Badge>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line">
            {selectedAnnouncement?.content}
          </div>
        </div>
      </Modal>
    </div>
  )
}
