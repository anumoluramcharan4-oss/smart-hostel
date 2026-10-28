'use client'

import React, { useState } from 'react'
import {
  Sliders,
  Clock,
  ShieldCheck,
  Bell,
  Save,
  Check,
  Coffee,
  Building,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [curfewTime, setCurfewTime] = useState('22:30')
  const [autoSms, setAutoSms] = useState(true)
  const [biometricStrict, setBiometricStrict] = useState(true)
  const [escalationHours, setEscalationHours] = useState('4')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('System configuration saved and synchronized with FastAPI gateway.')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Hostel Administrative & System Settings"
        subtitle="Configure campus rules, curfew cutoffs, emergency escalation triggers, and notification policies."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Curfew & Biometric Configuration */}
        <div className="rounded-3xl glass-card p-6 border border-border/80 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Curfew & Biometric Roll-Call Policy
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-foreground mb-1.5">
                Night Curfew Cutoff Time (IST)
              </label>
              <input
                type="time"
                value={curfewTime}
                onChange={(e) => setCurfewTime(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Turnstiles lock strictly at this hour.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1.5">
                Critical SLA Escalation Threshold
              </label>
              <select
                value={escalationHours}
                onChange={(e) => setEscalationHours(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="2">2 Hours (Emergency)</option>
                <option value="4">4 Hours (Standard High)</option>
                <option value="8">8 Hours (Normal)</option>
              </select>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Auto-alerts Chief Warden if ticket unassigned.
              </span>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSms}
                onChange={(e) => setAutoSms(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs font-medium text-foreground">
                Dispatch automated SMS alerts to parents if resident is absent past curfew
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={biometricStrict}
                onChange={(e) => setBiometricStrict(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs font-medium text-foreground">
                Require biometric fingerprint + facial verification at turnstiles
              </span>
            </label>
          </div>
        </div>

        {/* Mess & Dining Operational Schedule */}
        <div className="rounded-3xl glass-card p-6 border border-border/80 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Coffee className="h-4 w-4 text-teal-500" />
            Dining Hall & Mess Operational Timers
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-2xl bg-muted/40 p-3 border border-border/50">
              <span className="font-bold text-foreground">Breakfast</span>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">07:30 - 09:30 AM</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3 border border-border/50">
              <span className="font-bold text-foreground">Lunch</span>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">12:30 - 02:30 PM</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3 border border-border/50">
              <span className="font-bold text-foreground">Dinner</span>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">07:30 - 09:30 PM</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
          >
            <Save className="h-4 w-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  )
}
