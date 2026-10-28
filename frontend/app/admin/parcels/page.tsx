'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PackageSearch,
  Plus,
  KeyRound,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Truck,
  Archive,
  User,
  ShieldCheck,
  RefreshCw,
  Lock,
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function ParcelManagementPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'awaiting' | 'verify' | 'register' | 'history'>('awaiting')
  const [searchQuery, setSearchQuery] = useState('')

  // Verification Form
  const [verifyRef, setVerifyRef] = useState('')
  const [verifyOtp, setVerifyOtp] = useState('')

  // Registration Form
  const [formData, setFormData] = useState({
    recipient_student_id: 'STU101',
    recipient_name: 'Alex Johnson',
    recipient_room: '204',
    recipient_block: 'Block A',
    courier: 'Amazon Prime',
    tracking_number: '',
    storage_location: 'Locker 12',
    locker_number: '12',
    notes: '',
  })

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['parcel-stats'],
    queryFn: () => api.getParcelStats(),
    refetchInterval: 5000,
  })

  const { data: parcels = [], isLoading: loadingParcels } = useQuery({
    queryKey: ['parcels-list', searchQuery],
    queryFn: () => api.getParcels({ search: searchQuery }),
  })

  // Mutations
  const registerMutation = useMutation({
    mutationFn: (data: any) => api.registerParcel(data, 'staff'),
    onSuccess: (data) => {
      toast.success(`Parcel ${data.parcel_ref} checked into ${data.storage_location}. Secret OTP sent to student.`)
      queryClient.invalidateQueries({ queryKey: ['parcels-list'] })
      queryClient.invalidateQueries({ queryKey: ['parcel-stats'] })
      setActiveTab('awaiting')
    },
    onError: (err: any) => toast.error(err.message || 'Registration failed'),
  })

  const verifyMutation = useMutation({
    mutationFn: ({ ref, otp }: { ref: string; otp: string }) =>
      api.verifyAndCollectParcel(ref, otp, 'Reception Officer'),
    onSuccess: (data) => {
      toast.success(`Secure Handover Verified! Parcel ${data.parcel_ref} released to ${data.recipient_name}`)
      setVerifyRef('')
      setVerifyOtp('')
      queryClient.invalidateQueries({ queryKey: ['parcels-list'] })
      queryClient.invalidateQueries({ queryKey: ['parcel-stats'] })
      setActiveTab('awaiting')
    },
    onError: (err: any) => toast.error(err.message || 'Collection verification failed'),
  })

  const awaitingParcels = parcels.filter((p: any) => p.status === 'AWAITING_COLLECTION' || p.status === 'RECEIVED')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <PackageSearch className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Parcel & Delivery Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reception inbound intake, student notifications, cryptographic OTP verification, and smart locker control.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('register')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Inbound Delivery
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
          >
            <KeyRound className="h-4 w-4" />
            Verify Student OTP
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Awaiting Pickup</span>
            <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.awaiting_collection ?? 0}
            </span>
            <span className="text-xs text-slate-400">parcels</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Collected Today</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats?.collected_today ?? 0}
            </span>
            <span className="text-xs text-slate-400">handovers</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Overdue (&gt;3 Days)</span>
            <Clock className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats?.overdue_count ?? 0}
            </span>
            <span className="text-xs text-slate-400">unclaimed</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Logged</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.total_received ?? 0}
            </span>
            <span className="text-xs text-slate-400">packages</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('awaiting')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'awaiting'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Awaiting Collection ({awaitingParcels.length})
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'verify'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Secure OTP Verification
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'register'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Log Inbound Courier
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'history'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Delivery History ({parcels.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Awaiting Collection */}
      {activeTab === 'awaiting' && (
        <div className="space-y-4">
          {awaitingParcels.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                All delivered parcels have been collected by students!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {awaitingParcels.map((p: any) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                        {p.parcel_ref}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {p.recipient_name}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300">
                      {p.courier}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-500">Student ID:</span> {p.recipient_student_id}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-500">Quarters:</span> {p.recipient_block} - Room {p.recipient_room}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-500">Locker / Shelf:</span>{' '}
                      <b className="text-slate-900 dark:text-white">{p.storage_location}</b>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      Arrived: {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => {
                        setVerifyRef(p.parcel_ref)
                        setActiveTab('verify')
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-purple-600 text-white hover:bg-purple-700 transition"
                    >
                      Verify Handover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Secure OTP Verification */}
      {activeTab === 'verify' && (
        <div className="max-w-md mx-auto p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4">
          <div className="text-center space-y-1">
            <div className="inline-flex p-3 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 mb-1">
              <KeyRound className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Secure Delivery Handover
            </h3>
            <p className="text-xs text-slate-500">
              Student must present their unique 6-digit OTP from the resident portal.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!verifyRef || !verifyOtp) {
                toast.error('Enter both Parcel Reference and OTP code')
                return
              }
              verifyMutation.mutate({ ref: verifyRef.trim(), otp: verifyOtp.trim() })
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Parcel Reference ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PCL-2026-9041"
                value={verifyRef}
                onChange={(e) => setVerifyRef(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Student Pickup OTP (6 Digits) *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 582914"
                value={verifyOtp}
                onChange={(e) => setVerifyOtp(e.target.value)}
                className="w-full px-3 py-2 text-center text-lg font-mono font-bold tracking-widest rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={verifyMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition"
            >
              {verifyMutation.isPending ? 'Verifying OTP...' : 'Authenticate & Release Package'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Register Inbound Parcel */}
      {activeTab === 'register' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Log Inbound Courier Delivery
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            System automatically sends an in-app notice and one-time pickup code to the recipient student.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              registerMutation.mutate(formData)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Recipient Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Student ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipient_student_id}
                  onChange={(e) => setFormData({ ...formData, recipient_student_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Courier / Carrier *
                </label>
                <select
                  value={formData.courier}
                  onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold"
                >
                  <option value="Amazon Prime">Amazon Prime</option>
                  <option value="Flipkart Express">Flipkart Express</option>
                  <option value="BlueDart Express">BlueDart Express</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="DTDC">DTDC</option>
                  <option value="India Post">India Post</option>
                  <option value="FedEx">FedEx</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Carrier Tracking # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1928374655"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Assigned Storage Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Locker 12 or Shelf A-3"
                  value={formData.storage_location}
                  onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Physical Locker # (Locks against collision)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12"
                  value={formData.locker_number}
                  onChange={(e) => setFormData({ ...formData, locker_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition"
            >
              {registerMutation.isPending ? 'Logging Inbound...' : 'Register Parcel & Dispatch OTP'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: Delivery History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Courier</th>
                  <th className="p-3">Storage</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Logged Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parcels.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {p.parcel_ref}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {p.recipient_name}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {p.recipient_block} Rm {p.recipient_room}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{p.courier}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold">
                      {p.storage_location}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'COLLECTED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
