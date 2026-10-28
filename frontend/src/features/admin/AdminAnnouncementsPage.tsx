import React, { useEffect, useState } from 'react'
import { Megaphone, PlusCircle, Pin, Trash2, Calendar, User } from 'lucide-react'
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

export const AdminAnnouncementsPage: React.FC = () => {
  const { success } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal')
  const [targetAudience, setTargetAudience] = useState<'all' | 'students' | 'wardens'>('all')
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
        isPinned: true,
      })
      setAnnouncements((prev) => [created, ...prev])
      setIsModalOpen(false)
      setTitle('')
      setContent('')
      success('Administrative circular broadcasted successfully')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePin = async (id: string) => {
    const updated = await api.togglePinAnnouncement(id)
    setAnnouncements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    success(`Circular ${updated.isPinned ? 'pinned' : 'unpinned'}`)
  }

  const handleDelete = async (id: string) => {
    await api.deleteAnnouncement(id)
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    success('Circular archived')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Administrative Broadcasts & Notices
          </h1>
          <p className="text-xs text-slate-500">
            Issue institution-wide directives, security alerts, and hostel policies
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Publish Executive Notice
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
                  className="h-8 text-xs px-2 text-rose-600 hover:bg-rose-50"
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
        title="Broadcast Executive Circular"
        description="Will be displayed prominently on all resident and faculty dashboards."
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Notice Title"
            placeholder="e.g. Revised Night Gate Timings & Access Card Protocols"
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
                { value: 'all', label: 'All Users (Campus Wide)' },
                { value: 'students', label: 'Students Only' },
                { value: 'wardens', label: 'Wardens & Staff Only' },
              ]}
            />

            <Select
              label="Priority Level"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'normal' | 'urgent')}
              options={[
                { value: 'normal', label: 'Normal Information' },
                { value: 'urgent', label: 'Urgent Directive' },
              ]}
            />
          </div>

          <Textarea
            label="Directive Body"
            rows={5}
            placeholder="Write official directive text, compliance dates, and penalty clauses..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Broadcast Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
