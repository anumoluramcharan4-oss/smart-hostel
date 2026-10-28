import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, PlusCircle, Clock, CheckCircle2, XCircle, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { useToast } from '@/app/ToastContext'
import { api } from '@/lib/api'
import type { LeaveRequest, LeaveType } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, formatDateTime, getStatusBadgeVariant } from '@/lib/utils/formatters'

const leaveSchema = z.object({
  type: z.enum(['day_outpass', 'weekend_leave', 'vacation', 'emergency']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Please state reason clearly (min 10 chars)'),
  destination: z.string().min(5, 'Destination address is required'),
  parentContact: z.string().min(10, 'Valid guardian phone is required'),
  parentInformed: z.boolean().refine((val) => val === true, 'Parent consent must be confirmed'),
})

type LeaveFormData = z.infer<typeof leaveSchema>

export const LeaveOutpassPage: React.FC = () => {
  const { user } = useAuth()
  const { success } = useToast()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchLeaves = async () => {
    if (!user) return
    try {
      const list = await api.getLeaves(user.id)
      setLeaves(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaves()
  }, [user])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      type: 'weekend_leave',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      reason: '',
      destination: '',
      parentContact: user?.emergencyContact?.phone || '+91 91234 56700',
      parentInformed: true,
    },
  })

  const onSubmit = async (data: LeaveFormData) => {
    setIsSubmitting(true)
    try {
      const created = await api.createLeave({
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        destination: data.destination,
        parentContact: data.parentContact,
        parentInformed: data.parentInformed,
      })
      setLeaves((prev) => [created, ...prev])
      setIsModalOpen(false)
      reset()
      success('Leave application submitted to Warden Office')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Leave & Outpass Applications
          </h1>
          <p className="text-xs text-slate-500">
            Submit day outpasses and overnight leaves for warden verification
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Apply for Outpass / Leave
        </Button>
      </div>

      {/* Leave Application History Cards */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : leaves.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            title="No leave applications on record"
            description="You haven't requested any outpass or leaves this semester."
            action={
              <Button size="sm" onClick={() => setIsModalOpen(true)}>
                Apply for First Outpass
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className="p-5 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Badge variant="pending" size="sm" className="font-semibold uppercase tracking-wider">
                    {leave.type.replace('_', ' ')}
                  </Badge>
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                  </span>
                </div>

                <Badge variant={getStatusBadgeVariant(leave.status)}>
                  {leave.status.toUpperCase()}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {leave.reason}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  {leave.destination}
                </span>

                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Guardian: {leave.parentContact} ({leave.parentInformed ? 'Confirmed' : 'Unconfirmed'})
                </span>

                {leave.reviewedBy ? (
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Reviewed by {leave.reviewedBy} on {formatDate(leave.reviewedAt || '')}
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">Under Warden Review</span>
                )}
              </div>

              {leave.status === 'rejected' && leave.rejectionReason && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
                  <strong className="block font-semibold">Rejection Note from Warden:</strong>
                  {leave.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Hostel Leave / Outpass"
        description="Gate pass approval is logged in the biometric security ledger."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Outpass / Leave Type"
            options={[
              { value: 'day_outpass', label: 'Day Outpass (Return before 10:00 PM)' },
              { value: 'weekend_leave', label: 'Weekend Home Leave (1-3 days)' },
              { value: 'vacation', label: 'Semester / Festival Vacation (4+ days)' },
              { value: 'emergency', label: 'Emergency / Medical Leave' },
            ]}
            {...register('type')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Departure Date"
              type="date"
              error={errors.startDate?.message}
              {...register('startDate')}
            />
            <Input
              label="Expected Return Date"
              type="date"
              error={errors.endDate?.message}
              {...register('endDate')}
            />
          </div>

          <Input
            label="Destination Address / City"
            placeholder="e.g. 42 Lotus Enclave, Shivaji Nagar, Pune"
            error={errors.destination?.message}
            {...register('destination')}
          />

          <Textarea
            label="Purpose / Detailed Reason"
            rows={3}
            placeholder="Specify reason for travel or visit..."
            error={errors.reason?.message}
            {...register('reason')}
          />

          <Input
            label="Parent / Guardian Emergency Contact"
            placeholder="+91 98765 00000"
            error={errors.parentContact?.message}
            {...register('parentContact')}
          />

          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="parentInformed"
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              {...register('parentInformed')}
            />
            <label htmlFor="parentInformed" className="text-xs text-slate-600 dark:text-slate-400">
              I certify that my parents/guardian are informed of this travel and have granted explicit consent.
            </label>
          </div>
          {errors.parentInformed && (
            <p className="text-xs text-rose-500 font-medium">{errors.parentInformed.message}</p>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
