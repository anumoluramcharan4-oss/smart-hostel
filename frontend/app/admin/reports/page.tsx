'use client'

import React from 'react'
import {
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { toast } from 'sonner'

export default function AdminReportsPage() {
  const reports = [
    {
      title: 'Monthly Hostel Occupancy & Census Audit',
      description: 'Complete breakdown of student occupancy, room vacancy rates, and wing capacity audits.',
      period: 'October 2026',
      size: '1.8 MB',
      type: 'PDF & XLSX',
    },
    {
      title: 'Facility Maintenance & SLA Resolution Report',
      description: 'Resolution turnaround times across electrical, plumbing, carpentry, and Wi-Fi tickets.',
      period: 'Q3 2026',
      size: '2.4 MB',
      type: 'PDF Report',
    },
    {
      title: 'Semester Fee Collection & Revenue Ledger',
      description: 'Bank reconciliation, UPI ledger, pending student dues, and late surcharge penalties.',
      period: 'Autumn 2026',
      size: '3.1 MB',
      type: 'Financial XLSX',
    },
    {
      title: 'Biometric Attendance & Turnstile Access Logs',
      description: 'Daily 10:30 PM curfew check-in records, night-out pass approvals, and unexcused absences.',
      period: 'Past 30 Days',
      size: '4.2 MB',
      type: 'CSV Dataset',
    },
    {
      title: 'Mess Nutrition & Food Safety Committee Report',
      description: 'Weekly meal ratings, food safety audit inspections, vendor performance, and wastage metrics.',
      period: 'Bi-Weekly',
      size: '1.2 MB',
      type: 'PDF Summary',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel System Reports & Compliance Audits"
        subtitle="Generate certified institutional audit summaries, financial ledgers, and operational compliance reports."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report, idx) => (
          <div
            key={idx}
            className="rounded-3xl glass-card p-6 border border-border/80 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {report.type}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {report.period}
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground mt-3 leading-snug">
                {report.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {report.description}
              </p>
            </div>

            <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-mono">{report.size}</span>
              <button
                onClick={() => toast.success(`Downloading certified report: ${report.title}`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary px-3.5 py-1.5 font-bold transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
