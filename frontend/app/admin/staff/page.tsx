'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Wrench,
  Phone,
  ShieldCheck,
  Search,
  Filter,
  Users,
  Briefcase,
  Zap,
  Droplets,
  Wifi,
  Sparkles,
  Utensils,
  Hammer,
} from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { StaffMember } from '@/lib/types'

const TRADES = [
  'Electrical',
  'Plumbing & Water',
  'Wi-Fi & Internet',
  'Housekeeping / Cleaning',
  'Mess & Dining',
  'Carpentry / Furniture',
  'General Maintenance',
]

export default function AdminStaffPage() {
  const [selectedTrade, setSelectedTrade] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['admin-staff-list', selectedTrade],
    queryFn: () => api.getStaff(selectedTrade !== 'all' ? { trade: selectedTrade } : undefined),
  })

  const filteredStaff = useMemo(() => {
    return staffList.filter((worker: StaffMember) => {
      if (selectedTrade !== 'all' && worker.trade !== selectedTrade) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = (worker.name || '').toLowerCase().includes(q)
        const matchPhone = (worker.phone || '').includes(q)
        const matchTrade = (worker.trade || '').toLowerCase().includes(q)
        return matchName || matchPhone || matchTrade
      }
      return true
    })
  }, [staffList, selectedTrade, searchQuery])

  const getTradeBadge = (trade: string) => {
    switch (trade) {
      case 'Electrical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Zap className="h-3.5 w-3.5" />
            Electrical
          </span>
        )
      case 'Plumbing & Water':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Droplets className="h-3.5 w-3.5" />
            Plumbing & Water
          </span>
        )
      case 'Wi-Fi & Internet':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Wifi className="h-3.5 w-3.5" />
            Wi-Fi & Internet
          </span>
        )
      case 'Housekeeping / Cleaning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            Housekeeping / Cleaning
          </span>
        )
      case 'Mess & Dining':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Utensils className="h-3.5 w-3.5" />
            Mess & Dining
          </span>
        )
      case 'Carpentry / Furniture':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <Hammer className="h-3.5 w-3.5" />
            Carpentry / Furniture
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Wrench className="h-3.5 w-3.5" />
            {trade || 'General Maintenance'}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Workers"
        subtitle="Facility technicians, maintenance workers, and service staff directory across all dorms."
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Staff
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {staffList.length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Trades
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {TRADES.length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Allocation Status
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              2 per trade
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-3 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search workers by name, trade or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-muted/40 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">All Trades (7 Categories)</option>
            {TRADES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Workers Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border uppercase text-[10px] tracking-wider text-muted-foreground font-semibold">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Trade / Specialty</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    Loading facility staff directory...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    No staff members found matching the selected trade filter or query.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((worker) => (
                  <tr
                    key={worker.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                          {worker.name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-xs sm:text-sm">
                            {worker.name}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {worker.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <a
                        href={`tel:${worker.phone}`}
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {worker.phone}
                      </a>
                    </td>

                    <td className="px-5 py-4">
                      {getTradeBadge(worker.trade)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {worker.status === 'active' ? 'Active' : worker.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
