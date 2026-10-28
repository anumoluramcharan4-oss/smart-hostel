'use client'

import React from 'react'
import {
  User,
  GraduationCap,
  Building,
  Phone,
  Mail,
  Shield,
  HeartHandshake,
  Calendar,
  Lock,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { PageHeader } from '@/components/common/PageHeader'

export default function StudentProfilePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Student Profile & Residential Record"
        subtitle="Manage your personal information, emergency contact credentials, and hostel room allotment details."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Avatar & Card (Col 4) */}
        <div className="lg:col-span-4 rounded-3xl glass-card p-6 border border-border/80 text-center space-y-4">
          <div className="relative inline-block">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="h-28 w-28 rounded-full object-cover ring-4 ring-primary/20 mx-auto shadow-md"
            />
            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-card" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Roll No: {user?.rollNo || '21BCS042'}
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <GraduationCap className="h-3.5 w-3.5" /> 3rd Year B.Tech
            </span>
          </div>

          <div className="pt-4 border-t border-border/60 text-left space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span>{user?.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Building className="h-4 w-4 text-primary shrink-0" />
              <span>
                {user?.blockName}, Room {user?.roomNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed info & Emergency Contacts (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Academic & Hostel Info */}
          <div className="rounded-3xl glass-card p-6 border border-border/80 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              Hostel Accommodation Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/50">
                <span className="text-muted-foreground">Allotted Room</span>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  Room {user?.roomNumber}
                </p>
                <span className="text-[11px] text-muted-foreground">
                  {user?.bedNumber}
                </span>
              </div>

              <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/50">
                <span className="text-muted-foreground">Hostel Block</span>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {user?.blockName}
                </p>
                <span className="text-[11px] text-muted-foreground">
                  Chief Warden: Prof. Rajesh K. Sharma
                </span>
              </div>

              <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/50">
                <span className="text-muted-foreground">Course & Dept</span>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {user?.course || 'Computer Science & Engineering'}
                </p>
                <span className="text-[11px] text-muted-foreground">
                  Semester 5 (Autumn 2026)
                </span>
              </div>

              <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/50">
                <span className="text-muted-foreground">Biometric Check-in</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Enrolled & Verified
                </p>
                <span className="text-[11px] text-muted-foreground">
                  Curfew Cutoff: 10:30 PM IST
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="rounded-3xl glass-card p-6 border border-border/80 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-rose-500" />
              Parent / Guardian Emergency Contact
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/50">
                <span className="text-muted-foreground">Guardian Name</span>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {user?.emergencyContact?.name || 'Mukesh Patel'}
                </p>
                <span className="text-[11px] text-muted-foreground">
                  Relation: {user?.emergencyContact?.relation || 'Father'}
                </span>
              </div>

              <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/50">
                <span className="text-muted-foreground">Contact Number</span>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {user?.emergencyContact?.phone || '+91 98201 00099'}
                </p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  SMS & Call Alerts Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
