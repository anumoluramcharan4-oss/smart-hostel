import React, { useEffect, useState } from 'react'
import { Users, Search, Mail, Phone, Building, User, Eye, Download } from 'lucide-react'
import { api } from '@/lib/api'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { exportToCsv } from '@/lib/utils/exportCsv'

interface StudentRecord {
  id: string
  name: string
  email: string
  studentId: string
  phone: string
  department: string
  year: number
  blockName: string
  roomNumber: string
  status: 'active' | 'graduated' | 'leave'
}

export const WardenStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null)
  const [blockFilter, setBlockFilter] = useState('all')

  const fetchStudents = async () => {
    try {
      const data = await api.getStudents()
      setStudents(data as StudentRecord[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const filtered = students.filter((s) => {
    if (blockFilter !== 'all' && !s.blockName.toLowerCase().includes(blockFilter.toLowerCase())) {
      return false
    }
    return true
  })

  const columns: Column<StudentRecord>[] = [
    {
      key: 'name',
      header: 'Student Name',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={s.name} size="sm" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{s.studentId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roomNumber',
      header: 'Allocated Room',
      sortable: true,
      render: (s) => (
        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
          {s.roomNumber}
        </span>
      ),
    },
    {
      key: 'blockName',
      header: 'Hostel Block',
      sortable: true,
      render: (s) => <span className="text-slate-600 dark:text-slate-300">{s.blockName.split(' ')[0]}</span>,
    },
    {
      key: 'department',
      header: 'Department & Year',
      sortable: true,
      render: (s) => (
        <span className="text-slate-600 dark:text-slate-300">
          {s.department} (Yr {s.year})
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (s) => <span className="font-mono text-[11px]">{s.phone}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedStudent(s)
          }}
          className="text-xs h-7 px-2"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View
        </Button>
      ),
    },
  ]

  const handleExport = () => {
    exportToCsv('students_roster', filtered, [
      { key: 'studentId', label: 'Student ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'roomNumber', label: 'Room' },
      { key: 'blockName', label: 'Block' },
      { key: 'department', label: 'Department' },
      { key: 'year', label: 'Year' },
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Hostellers Directory
          </h1>
          <p className="text-xs text-slate-500">
            Browse registered students, room placements, and emergency contacts ({students.length} students enrolled)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Roster CSV
          </Button>
        </div>
      </div>

      {/* Block Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Blocks' },
          { id: 'newton', label: 'Block A (Newton)' },
          { id: 'aryabhata', label: 'Block B (Aryabhata)' },
          { id: 'curie', label: 'Block C (Curie)' },
          { id: 'darwin', label: 'Block D (Darwin)' },
        ].map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBlockFilter(b.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              blockFilter === b.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <DataTable
        data={filtered as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        isLoading={loading}
        pageSize={12}
        searchPlaceholder="Search student name, ID, or room..."
        onRowClick={(row) => setSelectedStudent(row as unknown as StudentRecord)}
      />

      {/* Student Profile Modal */}
      <Modal
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.name}
        description={`Student ID: ${selectedStudent?.studentId}`}
        maxWidth="md"
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Avatar name={selectedStudent.name} size="lg" />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedStudent.name}</h4>
                <p className="text-slate-500">{selectedStudent.department} • Year {selectedStudent.year}</p>
                <Badge variant="success" size="sm" className="mt-1">Active Resident</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Allocated Room</span>
                <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {selectedStudent.roomNumber}
                </p>
                <p className="text-slate-400 text-[11px]">{selectedStudent.blockName}</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Direct Contact</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {selectedStudent.phone}
                </p>
                <p className="text-slate-400 text-[11px] truncate">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Guardian Contact</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Registered Guardian: +91 91234 56700
              </p>
              <p className="text-slate-400 text-[11px]">Primary outpass authorization number</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
