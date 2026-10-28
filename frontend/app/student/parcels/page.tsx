'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  PackageSearch,
  KeyRound,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Archive,
  Truck,
  MapPin,
} from 'lucide-react'
import { api } from '@/lib/api'

export default function StudentParcelsPage() {
  const { data: myParcels = [], isLoading } = useQuery({
    queryKey: ['student-my-parcels'],
    queryFn: () => api.getStudentParcels('STU101'),
    refetchInterval: 4000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shadow-xs">
          <PackageSearch className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Deliveries &amp; Pickup OTPs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Show your private 6-digit OTP code to the security or reception desk to claim your parcels.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading your deliveries...</div>
      ) : myParcels.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
          <Archive className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No Packages Waiting
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            When a delivery arrives for you, you will receive an alert with a secure pickup OTP.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myParcels.map((p: any) => {
            const isAwaiting = p.status === 'AWAITING_COLLECTION' || p.status === 'RECEIVED'

            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border shadow-xs transition-all ${
                  isAwaiting
                    ? 'border-purple-200/90 dark:border-purple-900/60 bg-white dark:bg-slate-900/80 ring-1 ring-purple-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                      {p.parcel_ref}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {p.courier} Delivery
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isAwaiting
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 animate-pulse'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {isAwaiting ? 'Awaiting Collection' : 'Collected'}
                  </span>
                </div>

                <div className="mt-3 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Collect from:{' '}
                      <b className="text-slate-900 dark:text-white">{p.storage_location}</b>
                    </span>
                  </div>
                  {p.tracking_number && (
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-slate-400" />
                      <span>Tracking: {p.tracking_number}</span>
                    </div>
                  )}
                </div>

                {isAwaiting && p.active_pickup_code ? (
                  <div className="mt-4 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/70 dark:bg-purple-950/40 text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                      Your Pickup OTP Code
                    </span>
                    <div className="font-mono text-2xl font-black text-purple-950 dark:text-purple-200 tracking-widest">
                      {p.active_pickup_code}
                    </div>
                    <p className="text-[10px] text-purple-600 dark:text-purple-400">
                      Show this 6-digit code at the reception desk to claim your parcel.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 text-xs text-slate-400">
                    Handed over on {p.collected_at ? new Date(p.collected_at).toLocaleDateString() : 'N/A'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
