'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shirt,
  Search,
  CheckCircle2,
  Clock,
  RotateCw,
  AlertTriangle,
  Layers,
  Sparkles,
  TrendingUp,
  Coins,
  Edit3,
  Check,
  X,
  Plus,
  Tag,
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function AdminLaundryPage() {
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [mismatchModal, setMismatchModal] = useState<any>(null)

  // Pricing configuration state
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<number>(0)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryPrice, setNewCategoryPrice] = useState<number>(20)

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['laundry-stats'],
    queryFn: () => api.getLaundryStats(),
    refetchInterval: 5000,
  })

  const { data: laundryRates = [] } = useQuery({
    queryKey: ['laundry-rates'],
    queryFn: () => api.getLaundryRates(),
    refetchInterval: 5000,
  })

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-laundry-orders'],
    queryFn: () => api.getLaundryOrders('admin'),
    refetchInterval: 4000,
  })

  // Mutations
  const updateRateMutation = useMutation({
    mutationFn: ({ category, newRate, rateId }: { category: string; newRate: number; rateId?: string }) =>
      api.updateLaundryRate(category, newRate, rateId),
    onSuccess: (data, vars) => {
      toast.success(`Laundry tariff for ${vars.category} updated to ₹${vars.newRate}/piece`)
      setEditingCat(null)
      queryClient.invalidateQueries({ queryKey: ['laundry-rates'] })
      queryClient.invalidateQueries({ queryKey: ['sidebar-laundry-rates'] })
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update rate'),
  })

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) {
      toast.error('Please enter a garment category name')
      return
    }
    if (newCategoryPrice <= 0) {
      toast.error('Price must be greater than 0')
      return
    }
    updateRateMutation.mutate({
      category: newCategoryName.trim().toUpperCase(),
      newRate: Number(newCategoryPrice),
    })
    setIsAddModalOpen(false)
    setNewCategoryName('')
    setNewCategoryPrice(20)
  }

  const standardOrder = ['SHIRT', 'TROUSER', 'BEDSHEET', 'TOWEL', 'JACKET']
  const sortedRates = [...laundryRates].sort((a: any, b: any) => {
    const idxA = standardOrder.indexOf(a.item_category?.toUpperCase())
    const idxB = standardOrder.indexOf(b.item_category?.toUpperCase())
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return (a.item_category || '').localeCompare(b.item_category || '')
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.updateLaundryStatus(id, status, notes),
    onSuccess: (data) => {
      toast.success(`Order ${data.order_ref} transitioned to ${data.status}`)
      queryClient.invalidateQueries({ queryKey: ['admin-laundry-orders'] })
      queryClient.invalidateQueries({ queryKey: ['laundry-stats'] })
    },
    onError: (err: any) => toast.error(err.message || 'Status transition failed'),
  })

  const confirmCountsMutation = useMutation({
    mutationFn: ({ id, counts }: { id: string; counts: any[] }) =>
      api.confirmLaundryCounts(id, counts),
    onSuccess: (data) => {
      toast.success(`Intake counts verified for ${data.order_ref}. Final charge: ₹${data.final_amount}`)
      setMismatchModal(null)
      queryClient.invalidateQueries({ queryKey: ['admin-laundry-orders'] })
      queryClient.invalidateQueries({ queryKey: ['laundry-stats'] })
    },
    onError: (err: any) => toast.error(err.message || 'Verification failed'),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
            <Shirt className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Laundry Operations &amp; Turnaround
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Staff queue, item count intake verification, automated status workflows, and billing reconciliation.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Today&apos;s Pickups</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.today_pickups ?? 0}</span>
            <span className="text-xs text-slate-400">orders</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">In Processing</span>
            <RotateCw className="h-4 w-4 text-blue-500 animate-spin" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.in_processing ?? 0}</span>
            <span className="text-xs text-slate-400">batches</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Ready for Pickup</span>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats?.ready_for_delivery ?? 0}
            </span>
            <span className="text-xs text-slate-400">done</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Delivered / Closed</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.completed_orders ?? 0}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Laundry Revenue</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ₹{(stats?.total_revenue ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Garment Tariffs & Laundry Pricing Management */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Clothing Tariffs &amp; Laundry Pricing
                </h3>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Live Rates
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manually adjust per-piece washing and steam-ironing rates. Changes sync dynamically with student slot booking and invoicing.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Garment Tariff</span>
          </button>
        </div>

        {/* Tariffs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedRates.map((rate: any) => {
            const isEditing = editingCat === rate.item_category
            return (
              <div
                key={rate.id || rate.item_category}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between hover:border-cyan-300 dark:hover:border-cyan-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                      <Shirt className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                        {rate.item_category}
                      </span>
                      <p className="text-[10px] text-slate-400">Wash &amp; Steam-Iron</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    Active
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Math.max(1, Number(e.target.value)))}
                          className="w-full pl-6 pr-2 py-1 text-xs font-bold rounded-lg border border-cyan-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => {
                          updateRateMutation.mutate({
                            category: rate.item_category,
                            newRate: editPrice,
                            rateId: rate.id,
                          })
                        }}
                        disabled={updateRateMutation.isPending}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                        title="Save new price"
                      >
                        <Check className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setEditingCat(null)}
                        className="p-1 rounded-lg border border-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          ₹{rate.rate_per_piece}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">/ piece</span>
                      </div>

                      <button
                        onClick={() => {
                          setEditingCat(rate.item_category)
                          setEditPrice(Number(rate.rate_per_piece))
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 hover:underline px-2 py-1 rounded hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Change Price</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Operational Queue ({orders.length})
          </h3>
          <span className="text-xs text-slate-400">Sorted by pickup schedule</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Order Ref</th>
                <th className="p-3">Resident</th>
                <th className="p-3">Slot</th>
                <th className="p-3">Items (Subm / Conf)</th>
                <th className="p-3">Billing</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No active laundry orders in queue.
                  </td>
                </tr>
              ) : (
                orders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                      {ord.order_ref}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {ord.student_name}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {ord.block_name} Rm {ord.room_number}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {ord.pickup_date}
                      <div className="text-[10px] text-slate-400">{ord.pickup_time_slot}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {ord.submitted_item_count} pcs
                      </span>
                      {ord.confirmed_item_count !== null && (
                        <span className="ml-1 text-slate-400">
                          / {ord.confirmed_item_count} pcs
                        </span>
                      )}
                      {ord.count_mismatch_noted === 'TRUE' && (
                        <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] bg-amber-50 text-amber-700 font-bold">
                          Mismatch
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">₹{ord.final_amount}</div>
                      <div className="text-[10px] text-slate-400">{ord.billing_status}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.status === 'READY_FOR_COLLECTION'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : ord.status === 'DELIVERED'
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
                        }`}
                      >
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ord.status === 'REQUESTED' && (
                          <button
                            onClick={() => setMismatchModal(ord)}
                            className="px-2 py-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[11px] hover:bg-blue-100"
                          >
                            Verify Intake Count
                          </button>
                        )}
                        {ord.status === 'COLLECTED' && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: ord.id,
                                status: 'PROCESSING',
                                notes: 'Loaded into industrial washing machine #2',
                              })
                            }
                            className="px-2 py-1 rounded bg-cyan-600 text-white font-semibold text-[11px] hover:bg-cyan-700"
                          >
                            Start Wash
                          </button>
                        )}
                        {ord.status === 'PROCESSING' && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: ord.id,
                                status: 'READY_FOR_COLLECTION',
                                notes: 'Steam-ironed and packaged for resident pickup',
                              })
                            }
                            className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700"
                          >
                            Mark Ready
                          </button>
                        )}
                        {ord.status === 'READY_FOR_COLLECTION' && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: ord.id,
                                status: 'DELIVERED',
                                notes: 'Handed over clean clothing to student at counter',
                              })
                            }
                            className="px-2 py-1 rounded bg-slate-800 text-white dark:bg-slate-700 font-semibold text-[11px] hover:bg-slate-900"
                          >
                            Confirm Handover
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intake Count Verification Modal */}
      {mismatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Verify Intake Clothes: {mismatchModal.order_ref}
            </h3>
            <p className="text-xs text-slate-500">
              Student submitted {mismatchModal.submitted_item_count} items. Confirm the actual physical count received.
            </p>

            <form
              onSubmit={(e: any) => {
                e.preventDefault()
                const counts = mismatchModal.items.map((it: any) => ({
                  item_category: it.item_category,
                  quantity: Number(e.target[`qty_${it.item_category}`].value),
                }))
                confirmCountsMutation.mutate({ id: mismatchModal.id, counts })
              }}
              className="space-y-3"
            >
              {mismatchModal.items?.map((it: any) => (
                <div key={it.id} className="flex items-center justify-between p-2 rounded-lg border bg-slate-50 dark:bg-slate-800">
                  <span className="text-xs font-bold">{it.item_category} (Subm: {it.quantity_submitted})</span>
                  <input
                    name={`qty_${it.item_category}`}
                    type="number"
                    min="0"
                    defaultValue={it.quantity_submitted}
                    className="w-16 px-2 py-1 text-xs text-center font-bold rounded border bg-white dark:bg-slate-900"
                  />
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMismatchModal(null)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmCountsMutation.isPending}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Confirm Physical Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Garment Rate Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-cyan-500" />
                Add New Garment Tariff
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Garment Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLANKET, KURTA, HOODIE..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 uppercase font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Rate Per Piece (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newCategoryPrice}
                  onChange={(e) => setNewCategoryPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateRateMutation.isPending}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 font-bold"
                >
                  Save Tariff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
