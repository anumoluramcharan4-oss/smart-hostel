import React, { useEffect, useState } from 'react'
import { Users, Search, Download, Eye, Building } from 'lucide-react'
import { api } from '@/lib/api'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
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

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null)

  useEffect(() => {
    api.getStudents().then((res) => {
      setStudents(res as StudentRecord[])
      setLoading(false)
    }).catch(console.error)
  }, [])

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
      header: 'Room & Block',
      sortable: true,
      render: (s) => (
        <div>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.roomNumber}</span>
          <p className="text-[10px] text-slate-400">{s.blockName.split(' ')[0]}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (s) => <span>{s.department} (Year {s.year})</span>,
    },
    {
      key: 'phone',
      header: 'Phone & Email',
      render: (s) => (
        <div className="text-[11px]">
          <p className="font-mono">{s.phone}</p>
          <p className="text-slate-400 truncate max-w-[140px]">{s.email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Enrollment',
      render: () => <Badge variant="success" size="sm">Active Resident</Badge>,
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
          Details
        </Button>
      ),
    },
  ]

  const handleExport = () => {
    exportToCsv('admin_students_database', students, [
      { key: 'studentId', label: 'ID' },
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
            Student Resident Directory
          </h1>
          <p className="text-xs text-slate-500">
            Institution-wide registry of active hostel occupants ({students.length} students enrolled)
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export CSV Roster
        </Button>
      </div>

      <DataTable
        data={students as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        isLoading={loading}
        pageSize={12}
        searchPlaceholder="Search student name, roll number, department, room..."
        onRowClick={(row) => setSelectedStudent(row as unknown as StudentRecord)}
      />

      {/* Student Details Modal */}
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
                <Badge variant="success" size="sm" className="mt-1">Active Status</Badge>
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
          </div>
        )}
      </Modal>
    </div>
  )
}
