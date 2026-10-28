import React, { useEffect, useState } from 'react'
import { Megaphone, PlusCircle, Pin, Trash2, Calendar, User, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/app/ToastContext'
import type { Announcement } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { formatDate } from '@/lib/utils/formatters'

export const WardenAnnouncementsPage: React.FC = () => {
  const { success } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal')
  const [targetAudience, setTargetAudience] = useState<'all' | 'students' | 'wardens'>('students')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const data = await api.getAnnouncements()
      setAnnouncements(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setIsSubmitting(true)
    try {
      const created = await api.createAnnouncement({
        title,
        content,
        targetAudience,
        priority,
        isPinned: false,
      })
      setAnnouncements((prev) => [created, ...prev])
      setIsModalOpen(false)
      setTitle('')
      setContent('')
      success('Hostel announcement broadcasted to students')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePin = async (id: string) => {
    const updated = await api.togglePinAnnouncement(id)
    setAnnouncements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    success(`Announcement ${updated.isPinned ? 'pinned to top' : 'unpinned'}`)
  }

  const handleDelete = async (id: string) => {
    await api.deleteAnnouncement(id)
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    success('Announcement removed')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Hostel Bulletin & Notices
          </h1>
          <p className="text-xs text-slate-500">
            Broadcast emergency alerts, maintenance schedules, and administrative memos
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Publish Announcement
        </Button>
      </div>

      <div className="space-y-3">
        {announcements.map((ann) => (
          <Card
            key={ann.id}
            className={`p-5 space-y-3 ${
              ann.isPinned ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/10' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {ann.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      <Pin className="w-3 h-3 fill-current" />
                      PINNED
                    </span>
                  )}
                  {ann.priority === 'urgent' && <Badge variant="critical">Urgent Broadcast</Badge>}
                  <Badge variant="pending" size="sm" className="capitalize">
                    Audience: {ann.targetAudience}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {ann.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs px-2.5"
                  onClick={() => handleTogglePin(ann.id)}
                  leftIcon={<Pin className="w-3.5 h-3.5" />}
                >
                  {ann.isPinned ? 'Unpin' : 'Pin to Top'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                  onClick={() => handleDelete(ann.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {ann.content}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Author: {ann.authorName} ({ann.authorRole})</span>
              <span>Published on {formatDate(ann.createdAt)}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Publish Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publish Hostel Announcement"
        description="Notice will be distributed to student dashboard feeds and notifications."
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Circular Title"
            placeholder="e.g. Scheduled Water Tank Cleaning (Blocks A & B)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Target Audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as 'all' | 'students' | 'wardens')}
              options={[
                { value: 'students', label: 'All Students' },
                { value: 'wardens', label: 'Wardens Only' },
                { value: 'all', label: 'Campus Wide (All Users)' },
              ]}
            />

            <Select
              label="Urgency Level"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'normal' | 'urgent')}
              options={[
                { value: 'normal', label: 'Normal Priority' },
                { value: 'urgent', label: 'Urgent Alert (Red Banner)' },
              ]}
            />
          </div>

          <Textarea
            label="Notice Announcement Body"
            rows={5}
            placeholder="Write full circular instructions, timings, and contact numbers..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Publish Announcement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
