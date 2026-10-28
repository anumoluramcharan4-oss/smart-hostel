'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Pin, Calendar, User, Search, Tag } from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate } from '@/lib/utils'

export default function StudentNoticesPage() {
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  const filtered = notices.filter((n) => {
    const matchesCategory =
      selectedCategory === 'all' || n.category === selectedCategory
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Notices & Announcements"
        subtitle="Official circulars, curfew updates, festival schedules, and estate maintenance announcements."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars by keyword..."
            className="w-full rounded-xl border border-input bg-card pl-9 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'event', 'maintenance', 'rule', 'mess', 'admin'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notices Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 rounded-3xl bg-card border border-border animate-pulse" />
          <div className="h-44 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No circulars found"
          description="Check back later for official announcements and updates."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => (
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

              <div className="flex items-center gap-2">
                <StatusBadge status={item.priority} />
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.category}
                </span>
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
    </div>
  )
}
