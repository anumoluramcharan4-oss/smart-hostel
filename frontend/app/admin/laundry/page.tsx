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
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function AdminLaundryPage() {
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [mismatchModal, setMismatchModal] = useState<any>(null)

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['laundry-stats'],
    queryFn: () => api.getLaundryStats(),
    refetchInterval: 5000,
  })

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-laundry-orders'],
    queryFn: () => api.getLaundryOrders('admin'),
    refetchInterval: 4000,
  })

  // Mutations
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
    </div>
  )
}
