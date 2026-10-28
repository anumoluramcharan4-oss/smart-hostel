'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CreditCard,
  CheckCircle2,
  Download,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  QrCode,
  X,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { StatCard } from '@/components/common/StatCard'
import { formatINR, formatDate } from '@/lib/utils'
import { FeeRecord } from '@/lib/types'

export default function StudentFeesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null)
  const [paymentMode, setPaymentMode] = useState('UPI (Google Pay / PhonePe)')

  const { data: fees = [], isLoading } = useQuery({
    queryKey: ['student-fees', user?.id],
    queryFn: () => api.getFees({ studentId: user?.id }),
  })

  const payMutation = useMutation({
    mutationFn: (feeId: string) => api.payFee(feeId, paymentMode),
    onMutate: async (feeId) => {
      await queryClient.cancelQueries({ queryKey: ['student-fees', user?.id] })
      const prev = queryClient.getQueryData<FeeRecord[]>(['student-fees', user?.id])

      queryClient.setQueryData<FeeRecord[]>(['student-fees', user?.id], (old = []) =>
        old.map((f) =>
          f.id === feeId
            ? {
                ...f,
                status: 'paid' as const,
                paidDate: new Date().toISOString().split('T')[0],
                receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              }
            : f
        )
      )

      return { prev }
    },
    onError: (err, feeId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['student-fees', user?.id], ctx.prev)
      }
      toast.error('Payment simulation failed. Please try again.')
    },
    onSuccess: (updated) => {
      toast.success(`Payment successful! Receipt ${updated.receiptNumber} generated.`)
      setSelectedFee(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['student-fees', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
    },
  })

  const totalPaid = fees
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + f.amount, 0)
  const totalPending = fees
    .filter((f) => f.status !== 'paid')
    .reduce((sum, f) => sum + f.amount, 0)

  const handleDownloadReceipt = (receiptNo?: string) => {
    toast.success(`Downloading official fee receipt (${receiptNo || 'RCP-2026-8841'}).pdf`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Fees & Semester Dues"
        subtitle="Review accommodation fees, mess advances, payment receipts, and settle dues securely."
      />

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Paid (AY 26-27)"
          value={formatINR(totalPaid)}
          numericValue={totalPaid}
          prefix="₹"
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          iconBg="from-emerald-500/20 to-teal-500/10"
          description="Verified bank transactions"
        />
        <StatCard
          title="Outstanding Dues"
          value={formatINR(totalPending)}
          numericValue={totalPending}
          prefix="₹"
          icon={CreditCard}
          iconColor={totalPending > 0 ? 'text-rose-500' : 'text-emerald-500'}
          iconBg={totalPending > 0 ? 'from-rose-500/20 to-amber-500/10' : 'from-emerald-500/20 to-teal-500/10'}
          description={totalPending === 0 ? 'Zero outstanding balance' : 'Due by end of month'}
        />
        <StatCard
          title="Payment Gateway"
          value="Online (Instant)"
          icon={ShieldCheck}
          iconColor="text-primary"
          iconBg="from-primary/20 to-indigo-500/10"
          description="UPI, NetBanking & Cards supported"
        />
      </div>

      {/* Fees List */}
      <div className="rounded-3xl glass-card p-6 border border-border/80 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">
          Fee Invoices & Transaction History
        </h3>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-16 rounded-2xl bg-muted/70 animate-pulse" />
            <div className="h-16 rounded-2xl bg-muted/70 animate-pulse" />
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {fee.title}
                    </span>
                    <StatusBadge status={fee.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{fee.semester}</span>
                    <span>•</span>
                    <span>Due: {formatDate(fee.dueDate)}</span>
                    {fee.paidDate && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Paid on {formatDate(fee.paidDate)}
                        </span>
                      </>
                    )}
                    {fee.receiptNumber && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-[11px]">
                          {fee.receiptNumber}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {formatINR(fee.amount)}
                  </span>

                  {fee.status === 'paid' ? (
                    <button
                      onClick={() => handleDownloadReceipt(fee.receiptNumber)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Receipt
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedFee(fee)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
                    >
                      Pay Now <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pay Online Simulation Modal */}
      {selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-popover p-6 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Hostel Fee Checkout
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Instant Settlement Gateway
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFee(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="rounded-2xl bg-muted/50 p-4 border border-border/80 text-center">
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  Amount Payable
                </span>
                <p className="text-3xl font-black text-foreground mt-1 tabular-nums">
                  {formatINR(selectedFee.amount)}
                </p>
                <p className="text-xs font-medium text-foreground mt-1">
                  {selectedFee.title}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Select Payment Mode
                </label>
                <div className="space-y-2">
                  {[
                    'UPI (Google Pay / PhonePe / Paytm)',
                    'NetBanking (HDFC / ICICI / SBI)',
                    'Debit / Credit Card',
                  ].map((mode) => (
                    <label
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs font-medium transition-all ${
                        paymentMode === mode
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={paymentMode === mode}
                        onChange={() => setPaymentMode(mode)}
                        className="text-primary focus:ring-primary"
                      />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-border p-3 text-center flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <QrCode className="h-4 w-4 text-primary" />
                <span>UPI QR Code active for instant verification</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedFee(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={payMutation.isPending}
                onClick={() => payMutation.mutate(selectedFee.id)}
                className="rounded-xl bg-gradient-to-r from-primary to-violet-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:from-primary/90 disabled:opacity-50"
              >
                {payMutation.isPending ? 'Processing...' : `Authorize ${formatINR(selectedFee.amount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
