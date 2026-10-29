'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shirt,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  RotateCw,
  Plus,
  Minus,
  Sparkles,
  CreditCard,
  User,
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function StudentLaundryPage() {
  const queryClient = useQueryClient()
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [timeSlot, setTimeSlot] = useState('09:00 - 11:00 AM')
  const [billToFees, setBillToFees] = useState(true)
  const [instructions, setInstructions] = useState('')

  // Item counts
  const [counts, setCounts] = useState<Record<string, number>>({
    SHIRT: 2,
    TROUSER: 2,
    BEDSHEET: 1,
    TOWEL: 1,
    JACKET: 0,
  })

  // Real-time listener for tariff updates by admin
  useEffect(() => {
    const handleLaundry = () => {
      queryClient.invalidateQueries({ queryKey: ['laundry-rates'] })
    }
    window.addEventListener('storage-laundry-rates', handleLaundry)
    return () => window.removeEventListener('storage-laundry-rates', handleLaundry)
  }, [queryClient])

  // Queries
  const { data: rates = [] } = useQuery({
    queryKey: ['laundry-rates'],
    queryFn: () => api.getLaundryRates(),
    refetchInterval: 5000,
  })

  const { data: myOrders = [], isLoading } = useQuery({
    queryKey: ['student-laundry-orders'],
    queryFn: () => api.getLaundryOrders('student', 'STU101'),
    refetchInterval: 5000,
  })

  const rateMap: Record<string, number> = {
    SHIRT: 15,
    TROUSER: 18,
    BEDSHEET: 35,
    TOWEL: 12,
    JACKET: 45,
  }
  rates.forEach((r: any) => {
    if (r.item_category) {
      rateMap[r.item_category.toUpperCase()] = Number(r.rate_per_piece)
    }
  })

  // Dynamic category list combining defaults and any custom rates configured by admin
  const allCategories = Array.from(
    new Set([
      'SHIRT',
      'TROUSER',
      'BEDSHEET',
      'TOWEL',
      'JACKET',
      ...rates.map((r: any) => r.item_category?.toUpperCase()).filter(Boolean),
    ])
  )

  // Calculate total pieces & estimated amount
  const totalPieces = Object.values(counts).reduce((acc, c) => acc + c, 0)
  const estimatedTotal = Object.entries(counts).reduce(
    (acc, [cat, qty]) => acc + (rateMap[cat] || 20) * qty,
    0
  )

  const bookMutation = useMutation({
    mutationFn: (payload: any) => api.bookLaundryOrder(payload),
    onSuccess: (data) => {
      toast.success(
        `Order ${data.order_ref} booked for ${data.pickup_date} (${data.pickup_time_slot})! Total: ₹${data.estimated_amount}`
      )
      queryClient.invalidateQueries({ queryKey: ['student-laundry-orders'] })
      // Reset counts
      setCounts({ SHIRT: 2, TROUSER: 2, BEDSHEET: 1, TOWEL: 1, JACKET: 0 })
    },
    onError: (err: any) => toast.error(err.message || 'Booking failed'),
  })

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (totalPieces === 0) {
      toast.error('Please select at least 1 clothing item')
      return
    }

    const items = Object.entries(counts)
      .filter(([_, qty]) => qty > 0)
      .map(([item_category, quantity]) => ({ item_category, quantity }))

    bookMutation.mutate({
      student_id: 'STU101',
      student_name: 'Alex Johnson',
      room_number: '204',
      block_name: 'Block A',
      service_type: 'WASH_AND_IRON',
      pickup_date: pickupDate,
      pickup_time_slot: timeSlot,
      items,
      special_instructions: instructions,
      bill_to_fees: billToFees,
    })
  }

  const updateItemQty = (cat: string, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [cat]: Math.max(0, (prev[cat] || 0) + delta),
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 shadow-xs">
          <Shirt className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hostel Laundry Services
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Book washing &amp; steam-ironing slots, select clothing counts, track intake, and bill seamlessly to fees.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Form (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-500" />
                Schedule Wash &amp; Iron Pickup
              </h3>
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded">
                Transparent Rates
              </span>
            </div>

            <form onSubmit={handleBooking} className="space-y-5">
              {/* Pickup Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Time Window (Max 15 orders/slot) *
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold"
                  >
                    <option value="09:00 - 11:00 AM">09:00 - 11:00 AM (Morning)</option>
                    <option value="02:00 - 04:00 PM">02:00 - 04:00 PM (Afternoon)</option>
                    <option value="05:00 - 07:00 PM">05:00 - 07:00 PM (Evening)</option>
                  </select>
                </div>
              </div>

              {/* Items Counter Grid */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-2">
                  Select Clothing Items &amp; Counts
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allCategories.map((cat) => {
                    const price = rateMap[cat] ?? 20
                    const count = counts[cat] || 0

                    return (
                      <div
                        key={cat}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{cat}</div>
                          <div className="text-[10px] text-slate-400">₹{price} / item</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateItemQty(cat, -1)}
                            className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemQty(cat, 1)}
                            className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Special instructions */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Special Care Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mild starch on white shirts, delicate woolen wash"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              {/* Fee Module Integration Checkbox */}
              <div className="p-3 rounded-xl border border-cyan-100 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-cyan-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Bill to Semester Hostel Dues
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Charge ₹{estimatedTotal} to your Fee Management ledger directly
                    </div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={billToFees}
                  onChange={(e) => setBillToFees(e.target.checked)}
                  className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[11px] text-slate-500">Total Items: {totalPieces}</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    Est. Total: <span className="text-cyan-600 dark:text-cyan-400">₹{estimatedTotal}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bookMutation.isPending}
                  className="px-6 py-2.5 rounded-lg bg-cyan-600 text-white font-semibold text-xs hover:bg-cyan-700 shadow-sm transition"
                >
                  {bookMutation.isPending ? 'Booking Slot...' : 'Confirm Laundry Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Orders History & Status Track (1 Col) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            My Laundry Orders ({myOrders.length})
          </h3>

          {myOrders.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50">
              <Shirt className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No active laundry orders.</p>
              <p className="text-[10px] text-slate-400 mt-1">Book your first slot using the form.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((ord: any) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                        {ord.order_ref}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        {ord.pickup_date} • {ord.pickup_time_slot}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ord.status === 'READY_FOR_COLLECTION'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                          : ord.status === 'COLLECTED' || ord.status === 'PROCESSING'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Submitted Items:</span>
                      <span className="font-semibold">{ord.submitted_item_count} pcs</span>
                    </div>
                    {ord.confirmed_item_count !== null && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Staff Verified Count:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {ord.confirmed_item_count} pcs
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">
                      <span className="text-slate-500">Charge:</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">₹{ord.final_amount}</span>
                    </div>
                  </div>

                  {ord.count_mismatch_noted === 'TRUE' && (
                    <div className="p-2 rounded bg-amber-50 text-amber-800 text-[10px] flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Count discrepancy verified by staff. Charge adjusted.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
