'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShieldCheck,
  UserCheck,
  Clock,
  AlertTriangle,
  QrCode,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  RefreshCw,
  Building,
  User,
  Phone,
  FileText,
  X,
  ArrowLeft,
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function VisitorManagementPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'radar' | 'pending' | 'register' | 'gate' | 'history'>('radar')
  const [searchQuery, setSearchQuery] = useState('')
  const [gateCode, setGateCode] = useState('')
  const [verifiedPass, setVerifiedPass] = useState<any>(null)

  // Listen to Escape key to easily close registration or scanner and return to radar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (activeTab === 'register' || activeTab === 'gate')) {
        setActiveTab('radar')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    id_proof_type: 'National ID',
    id_proof_number: '',
    category: 'PARENT',
    host_student_id: 'STU101',
    host_student_name: 'Alex Johnson',
    host_student_room: '204',
    host_student_block: 'Block A',
    purpose: '',
    expected_arrival: '',
    expected_departure: '',
    notes: '',
  })

  // Queries
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['visitor-stats'],
    queryFn: () => api.getVisitorStats(),
    refetchInterval: 5000,
  })

  const { data: liveInside = [], isLoading: loadingInside } = useQuery({
    queryKey: ['visitors-inside'],
    queryFn: () => api.getVisitorsInside(),
    refetchInterval: 3000,
  })

  const { data: pendingQueue = [], isLoading: loadingPending } = useQuery({
    queryKey: ['visitors-pending'],
    queryFn: () => api.getPendingVisitors(),
  })

  const { data: allVisitors = [], isLoading: loadingAll } = useQuery({
    queryKey: ['visitors-all', searchQuery],
    queryFn: () => api.getVisitors({ search: searchQuery }),
  })

  // Mutations
  const registerMutation = useMutation({
    mutationFn: (data: any) => api.registerVisitor(data, 'admin'),
    onSuccess: (data) => {
      toast.success(
        data.status === 'APPROVED'
          ? `Visit auto-approved! Pass Code: ${data.passes?.[0]?.pass_code}`
          : 'Visitor registration submitted for Warden approval'
      )
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] })
      queryClient.invalidateQueries({ queryKey: ['visitors-inside'] })
      queryClient.invalidateQueries({ queryKey: ['visitors-pending'] })
      queryClient.invalidateQueries({ queryKey: ['visitors-all'] })
      setActiveTab('radar')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Registration failed')
    },
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) =>
      api.reviewVisitor(id, approved, reason, 'warden'),
    onSuccess: () => {
      toast.success('Visitor review decision recorded')
      queryClient.invalidateQueries({ queryKey: ['visitors-pending'] })
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Review failed')
    },
  })

  const checkInMutation = useMutation({
    mutationFn: (id: string) => api.checkInVisitor(id, 'Gate Officer'),
    onSuccess: () => {
      toast.success('Visitor checked in at gate successfully')
      setVerifiedPass(null)
      setGateCode('')
      queryClient.invalidateQueries({ queryKey: ['visitors-inside'] })
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] })
      setActiveTab('radar')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Check-in failed')
    },
  })

  const checkOutMutation = useMutation({
    mutationFn: (id: string) => api.checkOutVisitor(id, 'Gate Officer'),
    onSuccess: () => {
      toast.success('Visitor checked out successfully')
      queryClient.invalidateQueries({ queryKey: ['visitors-inside'] })
      queryClient.invalidateQueries({ queryKey: ['visitor-stats'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Check-out failed')
    },
  })

  const handleVerifyPass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gateCode.trim()) return
    try {
      const res = await api.verifyVisitorPass(gateCode.trim())
      setVerifiedPass(res)
      toast.success(`Valid pass verified for ${res.visitor_name}`)
    } catch (err: any) {
      setVerifiedPass(null)
      toast.error(err.message || 'Invalid or expired pass')
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.phone || !formData.purpose) {
      toast.error('Please fill required visitor details')
      return
    }
    const arrival = formData.expected_arrival
      ? new Date(formData.expected_arrival).toISOString()
      : new Date().toISOString()
    const departure = formData.expected_departure
      ? new Date(formData.expected_departure).toISOString()
      : new Date(Date.now() + 3 * 3600000).toISOString()

    registerMutation.mutate({
      ...formData,
      expected_arrival: arrival,
      expected_departure: departure,
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Visitor & Security Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Digital gate register, QR pass validation, live security radar, and warden approvals.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'register' ? 'radar' : 'register')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition ${
              activeTab === 'register'
                ? 'bg-slate-800 text-white dark:bg-slate-700 hover:bg-slate-900'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {activeTab === 'register' ? (
              <>
                <X className="h-4 w-4" />
                Close Form
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Register Visitor
              </>
            )}
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'gate' ? 'radar' : 'gate')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition ${
              activeTab === 'gate'
                ? 'bg-slate-800 text-white dark:bg-slate-700 hover:bg-slate-900'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {activeTab === 'gate' ? (
              <>
                <X className="h-4 w-4" />
                Close Scanner
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" />
                Gate Scanner / Fallback
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Inside Now</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.currently_inside ?? 0}
            </span>
            <span className="text-xs text-slate-400">visitors</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Pending Review</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.pending_approvals ?? 0}
            </span>
            <span className="text-xs text-slate-400">in queue</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Expected Today</span>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.expected_today ?? 0}
            </span>
            <span className="text-xs text-slate-400">approved</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Overdue Alert</span>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats?.overdue_count ?? 0}
            </span>
            <span className="text-xs text-slate-400">flagged</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Today</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.total_today ?? 0}
            </span>
            <span className="text-xs text-slate-400">entries</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('radar')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'radar'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Live Security Radar ({liveInside.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Warden Approval Queue ({pendingQueue.length})
          </button>
          <button
            onClick={() => setActiveTab('gate')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'gate'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Gate Pass Verification
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'register'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Register New Visit
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Visitor Log & History
          </button>
        </div>
      </div>

      {/* TAB 1: Live Radar */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              Visitors Currently Inside Campus
            </h3>
            <span className="text-xs text-slate-500">Auto-refreshing every 3s</span>
          </div>

          {liveInside.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
              <ShieldCheck className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                No active visitors inside the hostel grounds right now.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                When a visitor checks in at the gate, their active presence appears here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveInside.map((v: any) => (
                <div
                  key={v.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{v.name}</h4>
                      <p className="text-[11px] text-slate-500">{v.phone} • {v.category}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Inside
                    </span>
                  </div>

                  <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-500">Host Student:</span> {v.host_student_name}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-500">Location:</span> {v.host_student_block} - Room {v.host_student_room}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-500">Purpose:</span> {v.purpose}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      Pass: {v.passes?.[0]?.pass_code || 'Verified'}
                    </span>
                    <button
                      onClick={() => checkOutMutation.mutate(v.id)}
                      disabled={checkOutMutation.isPending}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 transition"
                    >
                      <LogOut className="h-3 w-3" />
                      Check Out Gate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Warden Approval Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Warden Approval Queue ({pendingQueue.length})
            </h3>
            <span className="text-xs text-slate-500">Visits requiring explicit authorization</span>
          </div>

          {pendingQueue.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                All visitor requests have been reviewed!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
              {pendingQueue.map((v: any) => (
                <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{v.name}</h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        {v.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Phone: {v.phone} • Host: {v.host_student_name} ({v.host_student_block} Rm {v.host_student_room})
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-500">Purpose:</span> {v.purpose}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => reviewMutation.mutate({ id: v.id, approved: true })}
                      disabled={reviewMutation.isPending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve Pass
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:') || 'Policy restriction'
                        reviewMutation.mutate({ id: v.id, approved: false, reason })
                      }}
                      disabled={reviewMutation.isPending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 transition"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Gate Pass Verification */}
      {activeTab === 'gate' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4 relative">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Gate Pass Scanner &amp; Verification
                  </h3>
                  <p className="text-xs text-slate-500">
                    Authenticate visitor entry/exit via pass code.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('radar')}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                title="Close and return to radar (Esc)"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyPass} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. VP-A1B2C3D4"
                value={gateCode}
                onChange={(e) => setGateCode(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                Verify Pass
              </button>
            </form>

            {verifiedPass && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Verified Authenticated Pass
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {verifiedPass.pass_code}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <p><span className="font-semibold text-slate-500">Visitor:</span> {verifiedPass.visitor_name} ({verifiedPass.category})</p>
                  <p><span className="font-semibold text-slate-500">Host:</span> {verifiedPass.host_student}</p>
                  <p><span className="font-semibold text-slate-500">Purpose:</span> {verifiedPass.purpose}</p>
                  <p><span className="font-semibold text-slate-500">Current Status:</span> <b className="uppercase">{verifiedPass.status}</b></p>
                </div>

                <div className="pt-2 flex gap-2">
                  {verifiedPass.status === 'APPROVED' && (
                    <button
                      onClick={() => checkInMutation.mutate(verifiedPass.visitor_id)}
                      disabled={checkInMutation.isPending}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="h-4 w-4" />
                      Grant Gate Entry (Check In)
                    </button>
                  )}
                  {verifiedPass.status === 'CHECKED_IN' && (
                    <button
                      onClick={() => checkOutMutation.mutate(verifiedPass.visitor_id)}
                      disabled={checkOutMutation.isPending}
                      className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="h-4 w-4" />
                      Record Gate Exit (Check Out)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Register Visitor Form */}
      {activeTab === 'register' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs relative">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Register Visitor &amp; Issue Pass
              </h3>
              <p className="text-xs text-slate-500">
                Daytime parent visits auto-approve; vendor/contractor visits queue for warden review.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Close and return to radar (Esc)"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Visitor Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Martha Davis"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                >
                  <option value="PARENT">Parent</option>
                  <option value="FAMILY">Family Member</option>
                  <option value="FRIEND">Friend</option>
                  <option value="DELIVERY_OFFICIAL">Delivery Official</option>
                  <option value="VENDOR_CONTRACTOR">Vendor / Contractor</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Host Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.host_student_name}
                  onChange={(e) => setFormData({ ...formData, host_student_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Host Block & Room
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Block A"
                    value={formData.host_student_block}
                    onChange={(e) => setFormData({ ...formData, host_student_block: e.target.value })}
                    className="w-1/2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Room 204"
                    value={formData.host_student_room}
                    onChange={(e) => setFormData({ ...formData, host_student_room: e.target.value })}
                    className="w-1/2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Purpose of Visit *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delivering luggage, semester greeting"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('radar')}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4 text-slate-400" />
                <span>Cancel / Go Back</span>
              </button>
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{registerMutation.isPending ? 'Registering...' : 'Register Visitor & Issue Pass'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: History / All Logs */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search visitor, phone, or host..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['visitors-all'] })}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Visitor Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Host Student</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Pass Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allVisitors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">
                        No visitor records found.
                      </td>
                    </tr>
                  ) : (
                    allVisitors.map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {v.name}
                          <div className="text-[10px] text-slate-400 font-normal">{v.phone}</div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{v.category}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {v.host_student_name}
                          <div className="text-[10px] text-slate-400">
                            {v.host_student_block} Rm {v.host_student_room}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{v.purpose}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              v.status === 'CHECKED_IN'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : v.status === 'APPROVED'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                : v.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {v.passes?.[0]?.pass_code || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
