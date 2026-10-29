'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  Megaphone,
  Plus,
  Bell,
  Pin,
  Calendar,
  User,
  X,
  Trash2,
  Building2,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Send,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Notice } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const noticeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(15, 'Content must be at least 15 characters'),
  priority: z.enum(['urgent', 'important', 'general']),
  category: z.enum(['event', 'maintenance', 'mess', 'admin', 'rule']),
  targetBlock: z.string().default('All Dorms (Campus-Wide)'),
  pinned: z.boolean().default(false),
})

type NoticeFormData = z.infer<typeof noticeSchema>

export default function AdminNoticesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Real-time cross-tab synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smart_hostel_notices_v3' || e.key === 'smart_hostel_notices_v2') {
        queryClient.invalidateQueries({ queryKey: ['admin-notices'] })
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient])

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['admin-notices'],
    queryFn: () => api.getNotices(),
    refetchInterval: 2000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] })
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-notices'] })
      toast.success('Notice removed successfully from all portals')
    },
    onError: () => {
      toast.error('Failed to remove notice')
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoticeFormData>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      priority: 'important',
      category: 'admin',
      targetBlock: 'All Dorms (Campus-Wide)',
      pinned: true,
    },
  })

  const createMutation = useMutation({
    mutationFn: (newNotice: Omit<Notice, 'id' | 'publishedAt'>) =>
      api.createNotice(newNotice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] })
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-notices'] })
      toast.success('Official campus circular broadcasted successfully')
      reset()
      setIsComposerOpen(false)
    },
    onError: () => {
      toast.error('Failed to broadcast notice')
    },
  })

  const onSubmit = (data: NoticeFormData) => {
    createMutation.mutate({
      title: data.title,
      content: data.content,
      priority: data.priority,
      category: data.category,
      pinned: data.pinned,
      author: 'Office of Chief Administrator',
      authorRole: 'Chief Administrator',
    })
  }

  // Filter notices
  const filteredNotices = notices.filter((n) => {
    if (selectedCategory !== 'all' && n.category !== selectedCategory) return false
    return true
  })

  const urgentCount = notices.filter((n) => n.priority === 'urgent').length
  const pinnedCount = notices.filter((n) => n.pinned).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Official Campus Notice Board &amp; Circulars
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Broadcast institutional directives, academic guidelines, safety protocols, and dorm circulars.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsComposerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Broadcast Official Circular</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Live Circulars</span>
            <Megaphone className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{notices.length}</span>
            <span className="text-xs text-slate-400">active</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase">Urgent Directives</span>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">{urgentCount}</span>
            <span className="text-xs text-slate-400">high priority</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase">Pinned Announcements</span>
            <Pin className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pinnedCount}</span>
            <span className="text-xs text-slate-400">at top</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Reach</span>
            <Radio className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">100%</span>
            <span className="text-xs text-slate-400">all residents</span>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { key: 'all', label: 'All Announcements' },
          { key: 'admin', label: 'Administrative & Policy' },
          { key: 'maintenance', label: 'Maintenance & Works' },
          { key: 'event', label: 'Campus Events' },
          { key: 'mess', label: 'Dining & Mess' },
          { key: 'rule', label: 'Hostel Regulations' },
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedCategory === cat.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Notices Feed */}
      {filteredNotices.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
          <Bell className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">No notices published yet</h3>
          <p className="text-xs text-slate-500 mt-1">Broadcast an official circular to all residents and wardens.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotices.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition bg-white dark:bg-slate-900/60 shadow-xs space-y-3 relative flex flex-col justify-between ${
                n.priority === 'urgent'
                  ? 'border-red-300 dark:border-red-900/70 bg-red-50/10'
                  : n.pinned
                  ? 'border-blue-200 dark:border-blue-900/60'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {n.pinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/80">
                        <Pin className="h-3 w-3" /> Pinned
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        n.priority === 'urgent'
                          ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300'
                          : n.priority === 'important'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {n.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 capitalize">
                      {n.category}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Delete circular "${n.title}"?`)) {
                        deleteMutation.mutate(n.id)
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Delete notice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {n.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {n.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  {n.author || 'Office of Chief Administrator'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(n.publishedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Broadcast Official Circular
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Instantly published to Student and Warden portals
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComposerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Circular Subject / Headline *
                </label>
                <input
                  {...register('title')}
                  placeholder="e.g. Mandatory Semester Maintenance Schedule & Inspection"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
                {errors.title && <p className="text-rose-500 text-[10px] mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Priority Level
                  </label>
                  <select
                    {...register('priority')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
                  >
                    <option value="important">Important (Official Broadcast)</option>
                    <option value="urgent">Urgent Alert (Banner Broadcast)</option>
                    <option value="general">General Notice</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Category Tag
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
                  >
                    <option value="admin">Administrative</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="rule">Rule &amp; Discipline</option>
                    <option value="event">Event &amp; Academic</option>
                    <option value="mess">Dining &amp; Mess</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Target Scope
                </label>
                <select
                  {...register('targetBlock')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  <option value="All Dorms (Campus-Wide)">All Dorms (Campus-Wide Broadcast)</option>
                  <option value="Block A (Newton)">Block A (Newton Only)</option>
                  <option value="Block B (Aryabhata)">Block B (Aryabhata Only)</option>
                  <option value="Block C (Ramanujan)">Block C (Ramanujan Only)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Circular Content &amp; Details *
                </label>
                <textarea
                  {...register('content')}
                  rows={4}
                  placeholder="Detail the directive, date, timings, instructions for residents..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                />
                {errors.content && <p className="text-rose-500 text-[10px] mt-1">{errors.content.message}</p>}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinToggle"
                  {...register('pinned')}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="pinToggle" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                  Pin to Top of all Notice Boards
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{createMutation.isPending ? 'Publishing...' : 'Publish Circular'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
