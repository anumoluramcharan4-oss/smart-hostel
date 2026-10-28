'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Plus, Bell, Pin, Calendar, User, X, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { Notice } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const noticeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(15, 'Content must be at least 15 characters'),
  priority: z.enum(['urgent', 'important', 'general']),
  category: z.enum(['event', 'maintenance', 'mess', 'admin', 'rule']),
  pinned: z.boolean().default(false),
})

type NoticeFormData = z.infer<typeof noticeSchema>

export default function WardenNoticesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isComposerOpen, setIsComposerOpen] = useState(false)

  // Real-time cross-tab synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smart_hostel_notices_v2') {
        queryClient.invalidateQueries({ queryKey: ['notices'] })
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient])

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.getNotices(),
    refetchInterval: 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
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
      category: 'maintenance',
      pinned: false,
    },
  })

  // Optimistic Notice Creation
  const createMutation = useMutation({
    mutationFn: (newNotice: Omit<Notice, 'id' | 'publishedAt'>) =>
      api.createNotice(newNotice),
    onMutate: async (newNotice) => {
      await queryClient.cancelQueries({ queryKey: ['notices'] })
      const prev = queryClient.getQueryData<Notice[]>(['notices'])

      const optimistic: Notice = {
        ...newNotice,
        id: `temp-${Date.now()}`,
        publishedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Notice[]>(['notices'], (old = []) => [
        optimistic,
        ...old,
      ])

      return { prev }
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['notices'], ctx.prev)
      }
      toast.error('Failed to broadcast notice')
    },
    onSuccess: () => {
      toast.success('Notice published to all student and staff feeds!')
      setIsComposerOpen(false)
      reset()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
    },
  })

  const onSubmit = (data: NoticeFormData) => {
    createMutation.mutate({
      title: data.title,
      content: data.content,
      priority: data.priority,
      category: data.category,
      pinned: data.pinned,
      author: user?.name || 'Prof. Rajesh K. Sharma',
      authorRole: 'Resident Warden',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Notice Board & Bulletins"
        subtitle="Publish official circulars, curfew updates, maintenance schedules, and emergency alerts to residents."
      >
        <button
          onClick={() => setIsComposerOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Broadcast Notice
        </button>
      </PageHeader>

      {/* Notices Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 rounded-3xl bg-card border border-border animate-pulse" />
          <div className="h-44 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      ) : notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices published"
          description="Create and broadcast official circulars to student residents."
          action={{
            label: 'Publish First Notice',
            onClick: () => setIsComposerOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {notices.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl glass-card p-6 border transition-all space-y-3 relative overflow-hidden ${
                item.pinned
                  ? 'border-primary/40 ring-1 ring-primary/20 shadow-glow'
                  : 'border-border/80'
              }`}
            >
              {item.pinned && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-xl text-[10px] font-bold flex items-center gap-1">
                  <Pin className="h-3 w-3 fill-current" /> Pinned
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.priority} />
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.category}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Do you want to permanently remove notice "${item.title}"?`)) {
                      deleteMutation.mutate(item.id)
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded-lg transition-colors"
                  title="Remove this notice"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <h3 className="text-base font-bold text-foreground leading-snug">
                {item.title}
              </h3>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {item.content}
              </p>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {item.author} ({item.authorRole})
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(item.publishedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notice Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl border border-border bg-popover p-6 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Broadcast Official Notice
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Sent to all resident portals instantly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComposerOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Circular Headline
                </label>
                <input
                  {...register('title')}
                  placeholder="e.g., Water Tank Cleaning Schedule for Block C & D"
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.title && (
                  <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Priority Level
                  </label>
                  <select
                    {...register('priority')}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 capitalize"
                  >
                    <option value="general">General Information</option>
                    <option value="important">Important Circular</option>
                    <option value="urgent">Urgent / Emergency Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Category
                  </label>
                  <select
                    {...register('category')}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 capitalize"
                  >
                    <option value="maintenance">Estate Maintenance</option>
                    <option value="rule">Rule / Curfew Regulation</option>
                    <option value="event">Campus Event / Festival</option>
                    <option value="mess">Mess & Nutrition</option>
                    <option value="admin">Administrative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Notice Body
                </label>
                <textarea
                  {...register('content')}
                  rows={4}
                  placeholder="Provide complete details, exact timings, and action items required from students..."
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.content && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.content.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinNotice"
                  {...register('pinned')}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="pinNotice" className="text-xs font-medium text-foreground cursor-pointer">
                  Pin to top of student feeds
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
