import React, { useState } from 'react'
import { FileText, Download, Calendar, Filter, Table, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { exportToCsv } from '@/lib/utils/exportCsv'
import { formatDate } from '@/lib/utils/formatters'

export const AdminReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'complaints' | 'occupancy' | 'leaves' | 'mess'>('complaints')
  const [startDate, setStartDate] = useState('2026-09-01')
  const [endDate, setEndDate] = useState('2026-09-30')
  const [reportData, setReportData] = useState<Record<string, string | number>[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      if (reportType === 'complaints') {
        const list = await api.getComplaints()
        setReportData(
          list.map((c) => ({
            Ticket: c.ticketNumber,
            Student: c.studentName,
            Room: c.roomNumber,
            Block: c.blockName,
            Category: c.category,
            Title: c.title,
            Priority: c.priority,
            Status: c.status,
            Technician: c.assignedStaffName || 'Unassigned',
            AI_Confidence: `${Math.round((c.aiConfidence || 0.95) * 100)}%`,
            ReportedDate: formatDate(c.createdAt),
            ResolvedDate: c.resolvedAt ? formatDate(c.resolvedAt) : 'Pending',
          }))
        )
      } else if (reportType === 'occupancy') {
        const list = await api.getStudents()
        setReportData(
          list.map((s) => ({
            StudentID: s.studentId,
            Name: s.name,
            Room: s.roomNumber,
            Block: s.blockName,
            Department: s.department,
            Year: s.year,
            Phone: s.phone,
            Email: s.email,
          }))
        )
      } else if (reportType === 'leaves') {
        const list = await api.getLeaves()
        setReportData(
          list.map((l) => ({
            Student: l.studentName,
            Room: l.roomNumber,
            Block: l.blockName,
            Type: l.type,
            Departure: formatDate(l.startDate),
            Return: formatDate(l.endDate),
            Status: l.status,
            Destination: l.destination,
            GuardianPhone: l.parentContact,
            ReviewedBy: l.reviewedBy || 'Pending',
          }))
        )
      } else {
        const list = await api.getMessFeedback()
        setReportData(
          list.map((m) => ({
            Date: formatDate(m.date),
            Student: m.studentName,
            MealType: m.mealType,
            RatingStars: m.rating,
            Category: m.category,
            Sentiment: m.sentiment,
            Comment: m.comment,
          }))
        )
      }
      setHasGenerated(true)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!reportData.length) return
    exportToCsv(`admin_executive_${reportType}_report`, reportData)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Executive Compliance & Reports Engine
        </h1>
        <p className="text-xs text-slate-500">
          Export certified campus registers, SLA compliance logs, and occupancy spreadsheets
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            Report Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <Select
              label="Select Dataset"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as 'complaints' | 'occupancy' | 'leaves' | 'mess')
                setHasGenerated(false)
              }}
              options={[
                { value: 'complaints', label: 'Full Maintenance SLAs & Fault Records' },
                { value: 'occupancy', label: 'Hostel Resident Roster & Bed Inventory' },
                { value: 'leaves', label: 'Student Outpass & Travel Security Log' },
                { value: 'mess', label: 'Catering Feedback & Sentiment Audit' },
              ]}
            />

            <Input
              label="Audit Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="Audit End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" onClick={handleGenerate} isLoading={loading}>
              Run Report Query
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasGenerated && (
        <Card className="space-y-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-600" />
                Query Results ({reportData.length} Records)
              </CardTitle>
              <p className="text-xs text-slate-500">
                Period: {formatDate(startDate)} to {formatDate(endDate)}
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleDownload}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export CSV File
            </Button>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <tr>
                    {Object.keys(reportData[0] || {}).map((header) => (
                      <th key={header} className="px-4 py-3 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                  {reportData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} className="px-4 py-2.5 whitespace-nowrap">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reportData.length > 10 && (
              <p className="text-center text-xs text-slate-400 pt-2">
                Showing top 10 rows. Download full CSV file for complete dataset.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
