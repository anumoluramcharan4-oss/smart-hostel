import React, { useState } from 'react'
import { FileText, Download, Calendar, Filter, Table, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { exportToCsv } from '@/lib/utils/exportCsv'
import { formatDate } from '@/lib/utils/formatters'

export const WardenReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'complaints' | 'leaves' | 'occupancy'>('complaints')
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
            Category: c.category,
            Title: c.title,
            Priority: c.priority,
            Status: c.status,
            Technician: c.assignedStaffName || 'Unassigned',
            ReportedDate: formatDate(c.createdAt),
          }))
        )
      } else if (reportType === 'leaves') {
        const list = await api.getLeaves()
        setReportData(
          list.map((l) => ({
            Student: l.studentName,
            Room: l.roomNumber,
            Type: l.type,
            Departure: formatDate(l.startDate),
            Return: formatDate(l.endDate),
            Status: l.status,
            Destination: l.destination,
            GuardianPhone: l.parentContact,
          }))
        )
      } else {
        const list = await api.getRooms()
        setReportData(
          list.map((r) => ({
            RoomNumber: r.roomNumber,
            Block: r.blockName,
            Floor: r.floor,
            Capacity: r.capacity,
            OccupantsCount: r.occupants.length,
            Status: r.status,
          }))
        )
      }
      setHasGenerated(true)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCsv = () => {
    if (!reportData.length) return
    exportToCsv(`${reportType}_report`, reportData)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Warden Reports & Audit Exports
        </h1>
        <p className="text-xs text-slate-500">
          Generate consolidated registers for facilities compliance and administration meetings
        </p>
      </div>

      {/* Query Parameters Box */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            Report Configuration & Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <Select
              label="Report Dataset"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as 'complaints' | 'leaves' | 'occupancy')
                setHasGenerated(false)
              }}
              options={[
                { value: 'complaints', label: 'Room Maintenance Complaints & SLAs' },
                { value: 'leaves', label: 'Student Outpasses & Overnight Leaves' },
                { value: 'occupancy', label: 'Block Occupancy & Room Allocations' },
              ]}
            />

            <Input
              label="Period Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="Period End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" onClick={handleGenerate} isLoading={loading}>
              Generate Report Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview Surface */}
      {hasGenerated && (
        <Card className="space-y-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-600" />
                Report Preview ({reportData.length} Records)
              </CardTitle>
              <p className="text-xs text-slate-500">
                Period: {formatDate(startDate)} to {formatDate(endDate)}
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleDownloadCsv}
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
                  {reportData.slice(0, 8).map((row, idx) => (
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

            {reportData.length > 8 && (
              <p className="text-center text-xs text-slate-400 pt-2">
                Showing first 8 records. Download CSV for the complete {reportData.length}-row audit report.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
