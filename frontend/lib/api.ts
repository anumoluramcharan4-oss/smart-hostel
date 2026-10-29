import {
  STUDENTS,
  ROOMS,
  BLOCKS,
  COMPLAINTS,
  NOTICES,
  FEES,
  ATTENDANCE_HISTORY,
  DASHBOARD_STATS,
  WARDENS,
  INITIAL_WARDEN_GRIEVANCES,
} from './mock-data'
import {
  Student,
  Room,
  Block,
  Complaint,
  Notice,
  FeeRecord,
  AttendanceRecord,
  AttendanceDaySummary,
  DashboardStats,
  ComplaintStatus,
  ComplaintPriority,
  WardenInfo,
  WardenGrievance,
  GrievanceStatus,
} from './types'
import { determineAutoPriority } from './priority-helper'

const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Helpers to sync mock mutations across browser tabs and page navigations
const loadStoredComplaints = (): Complaint[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('smart_hostel_complaints_v2')
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  return [...COMPLAINTS]
}

const persistComplaints = (list: Complaint[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('smart_hostel_complaints_v2', JSON.stringify(list))
    } catch {
      // ignore
    }
  }
}

const loadStoredGrievances = (): WardenGrievance[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('smart_hostel_warden_grievances_v2')
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  return [...INITIAL_WARDEN_GRIEVANCES]
}

const persistGrievances = (list: WardenGrievance[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('smart_hostel_warden_grievances_v2', JSON.stringify(list))
    } catch {
      // ignore
    }
  }
}

const loadStoredNotices = (): Notice[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('smart_hostel_notices_v3')
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  return [...NOTICES]
}

const persistNotices = (list: Notice[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('smart_hostel_notices_v3', JSON.stringify(list))
    } catch {
      // ignore
    }
  }
}

const DEFAULT_LAUNDRY_RATES = [
  { id: 'rate-shirt', item_category: 'SHIRT', service_type: 'WASH_AND_IRON', rate_per_piece: 15, is_active: 'TRUE' },
  { id: 'rate-trouser', item_category: 'TROUSER', service_type: 'WASH_AND_IRON', rate_per_piece: 18, is_active: 'TRUE' },
  { id: 'rate-bedsheet', item_category: 'BEDSHEET', service_type: 'WASH_AND_IRON', rate_per_piece: 35, is_active: 'TRUE' },
  { id: 'rate-towel', item_category: 'TOWEL', service_type: 'WASH_AND_IRON', rate_per_piece: 12, is_active: 'TRUE' },
  { id: 'rate-jacket', item_category: 'JACKET', service_type: 'WASH_AND_IRON', rate_per_piece: 45, is_active: 'TRUE' },
]

export const loadStoredLaundryRates = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('smart_hostel_laundry_rates_v2')
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  return [...DEFAULT_LAUNDRY_RATES]
}

export const persistLaundryRates = (list: any[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('smart_hostel_laundry_rates_v2', JSON.stringify(list))
      window.dispatchEvent(new Event('storage-laundry-rates'))
    } catch {
      // ignore
    }
  }
}

const DEFAULT_VISITORS = [
  {
    id: 'vis-default-1',
    name: 'Rajesh Kumar Patel',
    phone: '+91 98201 00099',
    category: 'PARENT',
    host_student_id: 'STU101',
    host_student_name: 'Alex Johnson',
    host_student_room: '204',
    host_student_block: 'Block A',
    purpose: 'Delivering semester supplies and luggage',
    status: 'CHECKED_IN',
    created_at: '2026-10-29T08:00:00.000Z',
    passes: [
      {
        id: 'pass-default-1',
        visitor_id: 'vis-default-1',
        pass_code: 'VP-882910AA',
        valid_from: '2026-10-29T07:00:00.000Z',
        valid_until: '2026-10-29T18:00:00.000Z',
        is_revoked: 'FALSE',
      },
    ],
    events: [
      {
        id: 'evt-1',
        visitor_id: 'vis-default-1',
        event_type: 'CHECKED_IN',
        actor_id: 'SEC-GATE-1',
        actor_role: 'security',
        timestamp: '2026-10-29T08:15:00.000Z',
        details: 'Gate entry verified',
      },
    ],
  },
  {
    id: 'vis-default-2',
    name: 'Sunita Sharma',
    phone: '+91 98111 55667',
    category: 'FAMILY',
    host_student_id: 'STU102',
    host_student_name: 'Kabir Sen',
    host_student_room: '204',
    host_student_block: 'Block A',
    purpose: 'Weekend guardian meeting',
    status: 'CHECKED_IN',
    created_at: '2026-10-29T08:30:00.000Z',
    passes: [
      {
        id: 'pass-default-2',
        visitor_id: 'vis-default-2',
        pass_code: 'VP-771290BB',
        valid_from: '2026-10-29T08:00:00.000Z',
        valid_until: '2026-10-29T19:00:00.000Z',
        is_revoked: 'FALSE',
      },
    ],
    events: [
      {
        id: 'evt-2',
        visitor_id: 'vis-default-2',
        event_type: 'CHECKED_IN',
        actor_id: 'SEC-GATE-1',
        actor_role: 'security',
        timestamp: '2026-10-29T08:45:00.000Z',
        details: 'Gate entry verified',
      },
    ],
  },
  {
    id: 'vis-default-3',
    name: 'QuickBite Delivery Express',
    phone: '+91 99887 66554',
    category: 'DELIVERY_OFFICIAL',
    host_student_id: 'STU103',
    host_student_name: 'Dev Dixit',
    host_student_room: '204',
    host_student_block: 'Block A',
    purpose: 'Food delivery parcel',
    status: 'PENDING_APPROVAL',
    created_at: '2026-10-29T09:00:00.000Z',
    passes: [],
    events: [],
  },
]

export const loadStoredVisitors = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('smart_hostel_visitors_v2')
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  return [...DEFAULT_VISITORS]
}

export const persistVisitors = (list: any[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('smart_hostel_visitors_v2', JSON.stringify(list))
    } catch {
      // ignore
    }
  }
}

// In-Memory state for mock mutations
let mutableStudents: Student[] = [...STUDENTS]
let mutableRooms: Room[] = [...ROOMS]
let mutableComplaints: Complaint[] = loadStoredComplaints()
let mutableNotices: Notice[] = loadStoredNotices()
let mutableFees: FeeRecord[] = [...FEES]
let mutableWardens: WardenInfo[] = [...WARDENS]
let mutableWardenGrievances: WardenGrievance[] = loadStoredGrievances()
let mutableAttendance: Record<string, 'present' | 'absent' | 'leave'> = {}

// Helper for realistic network delay simulation in mock mode
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export const api = {
  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/stats`)
      if (!res.ok) throw new Error('Failed to fetch stats')

      return res.json()
    }
    await delay(150)
    const occupiedCount = mutableRooms.filter((r) => r.status === 'occupied').length
    const pendingCmp = mutableComplaints.filter((c) => c.status === 'pending').length
    const resolvedCmp = mutableComplaints.filter((c) => c.status === 'resolved').length

    return {
      ...DASHBOARD_STATS,
      occupiedRooms: occupiedCount,
      occupancyRate: Number(((occupiedCount / mutableRooms.length) * 100).toFixed(1)),
      pendingComplaints: pendingCmp,
      resolvedComplaints: resolvedCmp,
    }
  },

  // Students
  async getStudents(params?: {
    search?: string
    block?: string
    feeStatus?: string
  }): Promise<Student[]> {
    if (USE_API) {
      const query = new URLSearchParams()
      if (params?.search) query.set('search', params.search)
      if (params?.block) query.set('block', params.block)
      const res = await fetch(`${API_BASE_URL}/api/students?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch students')
      return res.json()
    }
    await delay(200)
    let list = [...mutableStudents]
    if (params?.search) {
      const s = params.search.toLowerCase()
      list = list.filter(
        (st) =>
          st.name.toLowerCase().includes(s) ||
          st.rollNo.toLowerCase().includes(s) ||
          st.roomNumber.toLowerCase().includes(s) ||
          st.course.toLowerCase().includes(s)
      )
    }
    if (params?.block && params.block !== 'all') {
      list = list.filter((st) => st.blockName.toLowerCase().includes(params.block!.toLowerCase()))
    }
    if (params?.feeStatus && params.feeStatus !== 'all') {
      list = list.filter((st) => st.feeStatus === params.feeStatus)
    }
    return list
  },

  async getStudentById(id: string): Promise<Student | undefined> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/students/${id}`)
      if (!res.ok) throw new Error('Failed to fetch student')
      return res.json()
    }
    await delay(100)
    return mutableStudents.find((s) => s.id === id)
  },

  // Blocks
  async getBlocks(): Promise<Block[]> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/blocks`)
      if (!res.ok) throw new Error('Failed to fetch blocks')
      return res.json()
    }
    await delay(100)
    return BLOCKS
  },

  // Rooms
  async getRooms(params?: {
    blockId?: string
    floor?: number
    status?: string
  }): Promise<Room[]> {
    if (USE_API) {
      const query = new URLSearchParams()
      if (params?.blockId) query.set('block_id', params.blockId)
      if (params?.status) query.set('status', params.status)
      const res = await fetch(`${API_BASE_URL}/api/rooms?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch rooms')
      return res.json()
    }
    await delay(200)
    let list = [...mutableRooms]
    if (params?.blockId && params.blockId !== 'all') {
      list = list.filter((r) => r.blockId === params.blockId)
    }
    if (params?.floor && params.floor !== 0) {
      list = list.filter((r) => r.floor === params.floor)
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter((r) => r.status === params.status)
    }
    return list
  },

  async getRoomById(id: string): Promise<Room | undefined> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${id}`)
      if (!res.ok) throw new Error('Failed to fetch room')
      return res.json()
    }
    await delay(100)
    return mutableRooms.find((r) => r.id === id || r.number === id)
  },

  async allocateRoom(roomId: string, studentId: string, bedNumber: string): Promise<Room> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, bed_number: bedNumber }),
      })
      if (!res.ok) throw new Error('Failed to allocate room')
      return res.json()
    }
    await delay(300)
    const roomIndex = mutableRooms.findIndex((r) => r.id === roomId || r.number === roomId)
    if (roomIndex === -1) throw new Error('Room not found')

    const student = mutableStudents.find((s) => s.id === studentId)
    if (!student) throw new Error('Student not found')

    const currentRoom = mutableRooms[roomIndex]
    const updatedOccupants = [
      ...currentRoom.occupants.filter((o) => o.id !== student.id),
      {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        bed: bedNumber,
        course: student.course,
        avatar: student.avatar,
      },
    ]

    const updatedRoom: Room = {
      ...currentRoom,
      occupied: updatedOccupants.length,
      status: updatedOccupants.length >= currentRoom.capacity ? 'occupied' : 'available',
      occupants: updatedOccupants,
    }

    mutableRooms[roomIndex] = updatedRoom

    // Update student's roomNumber and bedNumber
    const stdIdx = mutableStudents.findIndex((s) => s.id === studentId)
    if (stdIdx !== -1) {
      mutableStudents[stdIdx] = {
        ...mutableStudents[stdIdx],
        roomNumber: updatedRoom.number,
        blockName: updatedRoom.blockName,
        bedNumber,
      }
    }

    return updatedRoom
  },

  async deallocateRoom(roomId: string, studentId: string): Promise<Room> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/deallocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })
      if (!res.ok) throw new Error('Failed to deallocate room')
      return res.json()
    }
    await delay(250)
    const roomIndex = mutableRooms.findIndex((r) => r.id === roomId || r.number === roomId)
    if (roomIndex === -1) throw new Error('Room not found')

    const currentRoom = mutableRooms[roomIndex]
    const updatedOccupants = currentRoom.occupants.filter((o) => o.id !== studentId)

    const updatedRoom: Room = {
      ...currentRoom,
      occupied: updatedOccupants.length,
      status: updatedOccupants.length === 0 ? 'available' : 'available',
      occupants: updatedOccupants,
    }

    mutableRooms[roomIndex] = updatedRoom
    return updatedRoom
  },

  // Complaints
  async getComplaints(params?: {
    studentId?: string
    status?: string
    priority?: string
    blockName?: string
  }): Promise<Complaint[]> {
    if (USE_API) {
      const query = new URLSearchParams()
      if (params?.studentId) query.set('student_id', params.studentId)
      if (params?.status) query.set('status', params.status)
      if (params?.blockName) query.set('block_name', params.blockName)
      const res = await fetch(`${API_BASE_URL}/api/complaints?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch complaints')
      return res.json()
    }
    await delay(100)
    mutableComplaints = loadStoredComplaints()
    let list = [...mutableComplaints]
    if (params?.studentId) {
      list = list.filter((c) => c.studentId === params.studentId)
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter((c) => c.status === params.status)
    }
    if (params?.priority && params.priority !== 'all') {
      list = list.filter((c) => c.priority === params.priority)
    }
    if (params?.blockName && params.blockName !== 'all') {
      const target = params.blockName.toLowerCase()
      list = list.filter(
        (c) =>
          c.blockName.toLowerCase().includes(target) ||
          target.includes(c.blockName.toLowerCase())
      )
    }
    return list
  },

  async createComplaint(data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>): Promise<Complaint> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create complaint')
      return res.json()
    }
    await delay(200)
    mutableComplaints = loadStoredComplaints()
    const auto = determineAutoPriority(data.category, data.title, data.description)
    const newComplaint: Complaint = {
      ...data,
      priority: data.priority || auto.priority,
      id: `cmp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: `Complaint registered. Auto-classified as ${auto.priority.toUpperCase()} (${auto.reason})`,
        },
      ],
    }
    mutableComplaints.unshift(newComplaint)
    persistComplaints(mutableComplaints)
    return newComplaint
  },

  async updateComplaintStatus(
    id: string,
    status: ComplaintStatus,
    note?: string,
    assignedTo?: string,
    priority?: ComplaintPriority
  ): Promise<Complaint> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/complaints/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note, assigned_to: assignedTo, priority }),
      })
      if (!res.ok) throw new Error('Failed to update complaint')
      return res.json()
    }
    await delay(150)
    mutableComplaints = loadStoredComplaints()
    const index = mutableComplaints.findIndex((c) => c.id === id)
    if (index === -1) throw new Error('Complaint not found')

    const current = mutableComplaints[index]
    const updated: Complaint = {
      ...current,
      status,
      priority: priority || current.priority,
      assignedTo: assignedTo !== undefined ? assignedTo : current.assignedTo,
      resolutionNotes: status === 'resolved' ? note || 'Marked resolved by warden/admin' : current.resolutionNotes,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...current.timeline,
        {
          status,
          timestamp: new Date().toISOString(),
          note: note || (assignedTo ? `Assigned to ${assignedTo}` : `Status transitioned to ${status.replace('_', ' ')}`),
        },
      ],
    }
    mutableComplaints[index] = updated
    persistComplaints(mutableComplaints)
    return updated
  },

  async assignComplaint(
    id: string,
    assignedTo: string,
    priority?: ComplaintPriority,
    note?: string
  ): Promise<Complaint> {
    return this.updateComplaintStatus(id, 'in_progress', note || `Assigned to ${assignedTo}`, assignedTo, priority)
  },

  async approveComplaintResolution(id: string, note?: string): Promise<Complaint> {
    await delay(150)
    mutableComplaints = loadStoredComplaints()
    const index = mutableComplaints.findIndex((c) => c.id === id)
    if (index === -1) throw new Error('Complaint not found')

    const current = mutableComplaints[index]
    const updated: Complaint = {
      ...current,
      status: 'student_approved',
      studentApproved: true,
      studentApprovalNote: note || 'Student verified and confirmed defect resolved.',
      updatedAt: new Date().toISOString(),
      timeline: [
        ...current.timeline,
        {
          status: 'student_approved',
          timestamp: new Date().toISOString(),
          note: note || 'Student verified and approved resolution. Problem solved.',
        },
      ],
    }
    mutableComplaints[index] = updated
    persistComplaints(mutableComplaints)
    return updated
  },

  async reopenComplaint(id: string, reason?: string): Promise<Complaint> {
    await delay(150)
    mutableComplaints = loadStoredComplaints()
    const index = mutableComplaints.findIndex((c) => c.id === id)
    if (index === -1) throw new Error('Complaint not found')

    const current = mutableComplaints[index]
    const updated: Complaint = {
      ...current,
      status: 'in_progress',
      studentApproved: false,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...current.timeline,
        {
          status: 'in_progress',
          timestamp: new Date().toISOString(),
          note: `Student reported defect still persists: ${reason || 'Issue not resolved properly. Re-opened.'}`,
        },
      ],
    }
    mutableComplaints[index] = updated
    persistComplaints(mutableComplaints)
    return updated
  },

  async deleteComplaint(id: string): Promise<{ success: boolean; id: string }> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/complaints/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete complaint')
      return res.json()
    }
    await delay(150)
    mutableComplaints = loadStoredComplaints()
    mutableComplaints = mutableComplaints.filter((c) => c.id !== id)
    persistComplaints(mutableComplaints)
    return { success: true, id }
  },

  // Notices
  async getNotices(): Promise<Notice[]> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/notices`)
      if (!res.ok) throw new Error('Failed to fetch notices')
      return res.json()
    }
    await delay(150)
    mutableNotices = loadStoredNotices()
    return [...mutableNotices].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  },

  async createNotice(data: Omit<Notice, 'id' | 'publishedAt'>): Promise<Notice> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create notice')
      return res.json()
    }
    await delay(300)
    mutableNotices = loadStoredNotices()
    const newNotice: Notice = {
      ...data,
      id: `ntc-${Date.now()}`,
      publishedAt: new Date().toISOString(),
    }
    mutableNotices.unshift(newNotice)
    persistNotices(mutableNotices)
    return newNotice
  },

  async deleteNotice(id: string): Promise<{ success: boolean; id: string }> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/notices/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete notice')
      return res.json()
    }
    await delay(150)
    mutableNotices = loadStoredNotices()
    mutableNotices = mutableNotices.filter((n) => n.id !== id)
    persistNotices(mutableNotices)
    return { success: true, id }
  },

  // Fees
  async getFees(params?: { studentId?: string; status?: string }): Promise<FeeRecord[]> {
    if (USE_API) {
      const query = new URLSearchParams()
      if (params?.studentId) query.set('student_id', params.studentId)
      if (params?.status) query.set('status', params.status)
      const res = await fetch(`${API_BASE_URL}/api/fees?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch fees')
      return res.json()
    }
    await delay(200)
    let list = [...mutableFees]
    if (params?.studentId) {
      list = list.filter((f) => f.studentId === params.studentId)
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter((f) => f.status === params.status)
    }
    return list
  },

  async payFee(feeId: string, mode: string = 'Online Gateway (UPI)'): Promise<FeeRecord> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/fees/${feeId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      if (!res.ok) throw new Error('Failed to process payment')
      return res.json()
    }
    await delay(500)
    const idx = mutableFees.findIndex((f) => f.id === feeId)
    if (idx === -1) throw new Error('Fee record not found')

    const updated: FeeRecord = {
      ...mutableFees[idx],
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0],
      receiptNumber: `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      mode,
    }
    mutableFees[idx] = updated

    // Also update student's feeStatus if all fees are cleared
    const stdIdx = mutableStudents.findIndex((s) => s.id === updated.studentId)
    if (stdIdx !== -1) {
      const remainingUnpaid = mutableFees.filter(
        (f) => f.studentId === updated.studentId && f.status !== 'paid'
      )
      if (remainingUnpaid.length === 0) {
        mutableStudents[stdIdx] = {
          ...mutableStudents[stdIdx],
          feeStatus: 'paid',
          feeAmountDue: 0,
        }
      }
    }
    return updated
  },

  // Attendance
  async getAttendanceHistory(): Promise<AttendanceDaySummary[]> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/attendance/history`)
      if (!res.ok) throw new Error('Failed to fetch attendance history')
      return res.json()
    }
    await delay(150)
    return ATTENDANCE_HISTORY
  },

  async getAttendanceForToday(): Promise<Record<string, 'present' | 'absent' | 'leave'>> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/attendance/today`)
      if (!res.ok) throw new Error('Failed to fetch attendance')
      return res.json()
    }
    await delay(100)
    // Default: all present except a few
    if (Object.keys(mutableAttendance).length === 0) {
      STUDENTS.forEach((s, idx) => {
        if (idx === 5) mutableAttendance[s.id] = 'absent'
        else if (idx === 14) mutableAttendance[s.id] = 'leave'
        else mutableAttendance[s.id] = 'present'
      })
    }
    return { ...mutableAttendance }
  },

  async markAttendance(
    studentId: string,
    status: 'present' | 'absent' | 'leave'
  ): Promise<{ success: boolean; studentId: string; status: string }> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, status }),
      })
      if (!res.ok) throw new Error('Failed to record attendance')
      return res.json()
    }
    await delay(100)
    mutableAttendance[studentId] = status
    return { success: true, studentId, status }
  },

  // Wardens Directory & Block Assignments (Admin View)
  async getWardens(): Promise<WardenInfo[]> {
    await delay(100)
    return [...mutableWardens]
  },

  // Confidential Student Grievances against Wardens
  // SECURITY NOTICE: ADMIN ACCESS ONLY - EXCLUDED FROM WARDEN PORTAL
  async getWardenGrievances(): Promise<WardenGrievance[]> {
    await delay(100)
    mutableWardenGrievances = loadStoredGrievances()
    return [...mutableWardenGrievances].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  async createWardenGrievance(
    data: Omit<WardenGrievance, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<WardenGrievance> {
    await delay(250)
    mutableWardenGrievances = loadStoredGrievances()
    const newGrievance: WardenGrievance = {
      ...data,
      id: `grv-${Date.now()}`,
      status: 'under_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mutableWardenGrievances.unshift(newGrievance)
    persistGrievances(mutableWardenGrievances)
    return newGrievance
  },

  async updateWardenGrievanceStatus(
    id: string,
    status: GrievanceStatus,
    adminNotes?: string
  ): Promise<WardenGrievance> {
    await delay(200)
    mutableWardenGrievances = loadStoredGrievances()
    const index = mutableWardenGrievances.findIndex((g) => g.id === id)
    if (index === -1) throw new Error('Grievance report not found')
    const updated: WardenGrievance = {
      ...mutableWardenGrievances[index],
      status,
      adminNotes: adminNotes || mutableWardenGrievances[index].adminNotes,
      updatedAt: new Date().toISOString(),
    }
    mutableWardenGrievances[index] = updated
    persistGrievances(mutableWardenGrievances)
    return updated
  },

  async deleteWardenGrievance(id: string): Promise<{ success: boolean; id: string }> {
    await delay(150)
    mutableWardenGrievances = loadStoredGrievances()
    mutableWardenGrievances = mutableWardenGrievances.filter((g) => g.id !== id)
    persistGrievances(mutableWardenGrievances)
    return { success: true, id }
  },

  // Module 1: Visitor & Security Management
  async getVisitorStats(): Promise<{
    currently_inside: number
    expected_today: number
    pending_approvals: number
    overdue_count: number
    total_today: number
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/visitors/stats`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    const list = loadStoredVisitors()
    return {
      currently_inside: list.filter((v: any) => v.status === 'CHECKED_IN').length,
      expected_today: list.filter((v: any) => v.status === 'APPROVED').length,
      pending_approvals: list.filter((v: any) => v.status === 'PENDING_APPROVAL').length,
      overdue_count: list.filter((v: any) => v.status === 'OVERDUE').length,
      total_today: list.length,
    }
  },

  async getVisitors(params?: { status?: string; search?: string }): Promise<any[]> {
    try {
      const query = new URLSearchParams()
      if (params?.status && params.status !== 'all') query.set('status', params.status)
      if (params?.search) query.set('search', params.search)
      const res = await fetch(`${API_BASE_URL}/api/v1/visitors?${query.toString()}`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    let list = loadStoredVisitors()
    if (params?.status && params.status !== 'all') {
      list = list.filter((v: any) => v.status === params.status)
    }
    if (params?.search) {
      const s = params.search.toLowerCase()
      list = list.filter(
        (v: any) =>
          (v.name && v.name.toLowerCase().includes(s)) ||
          (v.phone && v.phone.includes(s)) ||
          (v.host_student_name && v.host_student_name.toLowerCase().includes(s)) ||
          (v.purpose && v.purpose.toLowerCase().includes(s))
      )
    }
    return list
  },

  async getVisitorsInside(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/visitors/live-inside`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return loadStoredVisitors().filter((v: any) => v.status === 'CHECKED_IN')
  },

  async getPendingVisitors(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/visitors/pending`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return loadStoredVisitors().filter((v: any) => v.status === 'PENDING_APPROVAL')
  },

  async registerVisitor(payload: any, role: string = 'admin'): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/visitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': role,
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        const list = loadStoredVisitors()
        list.unshift(data)
        persistVisitors(list)
        return data
      }
    } catch {
      // Fallback
    }

    const list = loadStoredVisitors()
    const autoApprove = payload.category === 'PARENT' || payload.category === 'FAMILY'
    const passCode = `VP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    const newVisitor: any = {
      ...payload,
      id: `vis-${Date.now()}`,
      status: autoApprove ? 'APPROVED' : 'PENDING_APPROVAL',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      passes: autoApprove
        ? [
            {
              id: `pass-${Date.now()}`,
              visitor_id: `vis-${Date.now()}`,
              pass_code: passCode,
              valid_from: payload.expected_arrival || new Date().toISOString(),
              valid_until: payload.expected_departure || new Date(Date.now() + 10800000).toISOString(),
              is_revoked: 'FALSE',
            },
          ]
        : [],
      events: [
        {
          id: `evt-${Date.now()}`,
          visitor_id: `vis-${Date.now()}`,
          event_type: 'REGISTERED',
          actor_id: role,
          actor_role: 'security',
          timestamp: new Date().toISOString(),
          details: `Visitor registered for ${payload.host_student_name || 'student'}. Policy auto_approved=${autoApprove}`,
        },
      ],
    }
    list.unshift(newVisitor)
    persistVisitors(list)
    return newVisitor
  },

  async reviewVisitor(visitorId: string, approved: boolean, reason?: string, role: string = 'warden'): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/visitors/${visitorId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': role,
        },
        body: JSON.stringify({
          approved,
          reviewer_id: role === 'admin' ? 'ADM01' : 'WAR01',
          reviewer_name: role === 'admin' ? 'Chief Admin' : 'Resident Warden',
          rejection_reason: reason,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const list = loadStoredVisitors()
        const idx = list.findIndex((v: any) => v.id === visitorId)
        if (idx !== -1) {
          list[idx] = data
          persistVisitors(list)
        }
        return data
      }
    } catch {
      // Fallback
    }

    const list = loadStoredVisitors()
    const idx = list.findIndex((v: any) => v.id === visitorId)
    if (idx !== -1) {
      const newStatus = approved ? 'APPROVED' : 'REJECTED'
      const passCode = `VP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      list[idx] = {
        ...list[idx],
        status: newStatus,
        reviewed_by: role === 'admin' ? 'Chief Admin' : 'Resident Warden',
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason || null,
        passes: approved
          ? [
              {
                id: `pass-${Date.now()}`,
                visitor_id: visitorId,
                pass_code: passCode,
                valid_from: new Date().toISOString(),
                valid_until: new Date(Date.now() + 10800000).toISOString(),
                is_revoked: 'FALSE',
              },
            ]
          : [],
      }
      persistVisitors(list)
      return list[idx]
    }
    throw new Error('Visitor not found')
  },

  async verifyVisitorPass(passCode: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/visitors/verify-pass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass_code: passCode }),
      })
      if (res.ok) return res.json()
    } catch {
      // Fallback
    }

    const clean = passCode.trim().toUpperCase()
    const list = loadStoredVisitors()
    for (const v of list) {
      const matchedPass = (v.passes || []).find(
        (p: any) => p.pass_code?.toUpperCase() === clean && p.is_revoked !== 'TRUE'
      )
      if (matchedPass) {
        return {
          pass_code: matchedPass.pass_code,
          visitor_id: v.id,
          visitor_name: v.name,
          category: v.category,
          status: v.status,
          host_student: `${v.host_student_name} (${v.host_student_block || 'Block A'} Rm ${v.host_student_room || '204'})`,
          purpose: v.purpose,
          valid_from: matchedPass.valid_from,
          valid_until: matchedPass.valid_until,
        }
      }
    }
    throw new Error('Invalid or expired gate pass code')
  },

  async checkInVisitor(visitorId: string, actorName: string = 'Gate Officer'): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/visitors/${visitorId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_id: 'SEC-GATE-1',
          actor_name: actorName,
          actor_role: 'security',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const list = loadStoredVisitors()
        const idx = list.findIndex((v: any) => v.id === visitorId)
        if (idx !== -1) {
          list[idx] = data
          persistVisitors(list)
        }
        return data
      }
    } catch {
      // Fallback
    }

    const list = loadStoredVisitors()
    const idx = list.findIndex((v: any) => v.id === visitorId)
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        status: 'CHECKED_IN',
        updated_at: new Date().toISOString(),
      }
      persistVisitors(list)
      return list[idx]
    }
    throw new Error('Visitor not found')
  },

  async checkOutVisitor(visitorId: string, actorName: string = 'Gate Officer'): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/visitors/${visitorId}/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_id: 'SEC-GATE-1',
          actor_name: actorName,
          actor_role: 'security',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const list = loadStoredVisitors()
        const idx = list.findIndex((v: any) => v.id === visitorId)
        if (idx !== -1) {
          list[idx] = data
          persistVisitors(list)
        }
        return data
      }
    } catch {
      // Fallback
    }

    const list = loadStoredVisitors()
    const idx = list.findIndex((v: any) => v.id === visitorId)
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        status: 'CHECKED_OUT',
        updated_at: new Date().toISOString(),
      }
      persistVisitors(list)
      return list[idx]
    }
    throw new Error('Visitor not found')
  },

  // Module 2: Inventory & Asset Management
  async getInventoryStats(): Promise<{
    total_assets: number
    damaged_assets: number
    under_repair_assets: number
    retired_assets: number
    low_stock_items: number
    total_asset_value: number
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/assets/stats`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return {
      total_assets: 142,
      damaged_assets: 4,
      under_repair_assets: 2,
      retired_assets: 1,
      low_stock_items: 3,
      total_asset_value: 324500.0,
    }
  },

  async getAssets(params?: { block?: string; room_number?: string; search?: string }): Promise<any[]> {
    try {
      const query = new URLSearchParams()
      if (params?.block && params.block !== 'all') query.set('block', params.block)
      if (params?.room_number) query.set('room_number', params.room_number)
      if (params?.search) query.set('search', params.search)
      const res = await fetch(`${API_BASE_URL}/api/v1/assets?${query.toString()}`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return []
  },

  async getRoomInventory(block: string, roomNumber: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/assets/room-inventory/${block}/${roomNumber}`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return []
  },

  async createAsset(payload: any, role: string = 'admin'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to create asset')
    }
    return res.json()
  },

  async transferAsset(assetId: string, payload: any, role: string = 'admin'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to transfer asset')
    }
    return res.json()
  },

  async reportAssetDamage(assetId: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}/damage-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to report asset damage')
    }
    return res.json()
  },

  async resolveAssetRepair(damageId: string, actualCost: number = 0): Promise<any> {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/assets/repairs/${damageId}/resolve?actual_cost=${actualCost}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to resolve asset repair')
    }
    return res.json()
  },

  async getConsumables(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/assets/consumables/list`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return []
  },

  async createConsumable(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/assets/consumables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to create consumable')
    }
    return res.json()
  },

  async transactConsumableStock(itemId: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/assets/consumables/${itemId}/transact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to update stock')
    }
    return res.json()
  },

  // Module 3: Parcel & Delivery Management
  async getParcelStats(): Promise<{
    awaiting_collection: number
    collected_today: number
    overdue_count: number
    total_received: number
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parcels/stats`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return {
      awaiting_collection: 8,
      collected_today: 14,
      overdue_count: 1,
      total_received: 22,
    }
  },

  async getParcels(params?: { status?: string; search?: string }): Promise<any[]> {
    try {
      const query = new URLSearchParams()
      if (params?.status && params.status !== 'all') query.set('status', params.status)
      if (params?.search) query.set('search', params.search)
      const res = await fetch(`${API_BASE_URL}/api/v1/parcels?${query.toString()}`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return []
  },

  async getStudentParcels(studentId: string = 'STU101'): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/parcels/student/my-parcels`, {
        headers: { 'X-User-Id': studentId },
      })
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return []
  },

  async registerParcel(payload: any, role: string = 'staff'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/parcels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to register delivery')
    }
    return res.json()
  },

  async verifyAndCollectParcel(parcelRef: string, pickupCode: string, staffName: string = 'Reception'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/parcels/verify-collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parcel_ref: parcelRef,
        pickup_code: pickupCode,
        staff_id: 'STF-RECEPT-1',
        staff_name: staffName,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Collection verification failed')
    }
    return res.json()
  },

  // Module 4: Laundry Management
  async getLaundryStats(): Promise<{
    today_pickups: number
    in_processing: number
    ready_for_delivery: number
    completed_orders: number
    total_revenue: number
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/laundry/stats`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return {
      today_pickups: 6,
      in_processing: 4,
      ready_for_delivery: 3,
      completed_orders: 48,
      total_revenue: 12450.0,
    }
  },

  async getLaundryRates(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/laundry/rates`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          persistLaundryRates(data)
          return data
        }
      }
    } catch {
      // fallback to stored
    }
    return loadStoredLaundryRates()
  },

  async updateLaundryRate(itemCategory: string, newRate: number, rateId?: string): Promise<any> {
    const cleanCat = itemCategory.trim().toUpperCase()
    let updatedObj: any = null

    // Attempt real backend call first if reachable
    try {
      const targetUrl = rateId
        ? `${API_BASE_URL}/api/v1/laundry/rates/${rateId}`
        : `${API_BASE_URL}/api/v1/laundry/rates`
      const method = rateId ? 'PUT' : 'POST'
      const body = rateId
        ? JSON.stringify({ rate_per_piece: newRate })
        : JSON.stringify({ item_category: cleanCat, rate_per_piece: newRate, service_type: 'WASH_AND_IRON' })

      const res = await fetch(targetUrl, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-User-Role': 'admin' },
        body,
      })
      if (res.ok) {
        updatedObj = await res.json()
      }
    } catch {
      // ignore
    }

    // Always update local persistent storage so it stays immediately responsive in all views
    const list = loadStoredLaundryRates()
    const idx = list.findIndex(
      (r) => r.item_category.toUpperCase() === cleanCat || (rateId && r.id === rateId)
    )
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        rate_per_piece: newRate,
      }
      if (!updatedObj) updatedObj = list[idx]
    } else {
      const newItem = {
        id: rateId || `rate-${cleanCat.toLowerCase()}`,
        item_category: cleanCat,
        service_type: 'WASH_AND_IRON',
        rate_per_piece: newRate,
        is_active: 'TRUE',
      }
      list.push(newItem)
      if (!updatedObj) updatedObj = newItem
    }
    persistLaundryRates(list)
    return updatedObj
  },

  async getLaundryOrders(role: string = 'student', studentId?: string): Promise<any[]> {
    try {
      const headers: Record<string, string> = { 'X-User-Role': role }
      if (studentId) headers['X-User-Id'] = studentId
      const res = await fetch(`${API_BASE_URL}/api/v1/laundry`, { headers })
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return []
  },

  async bookLaundryOrder(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/laundry/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to book laundry order')
    }
    return res.json()
  },

  async confirmLaundryCounts(orderId: string, confirmedCounts: any[]): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/laundry/${orderId}/confirm-counts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'staff',
      },
      body: JSON.stringify({
        confirmed_counts: confirmedCounts,
        staff_id: 'LND-TECH-1',
        staff_name: 'Laundry Operator',
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Intake count confirmation failed')
    }
    return res.json()
  },

  async updateLaundryStatus(orderId: string, status: string, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/laundry/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'staff',
      },
      body: JSON.stringify({
        status,
        actor_id: 'LND-TECH-1',
        actor_name: 'Laundry Operator',
        notes,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to update laundry status')
    }
    return res.json()
  },

  // Module 5: Room Inspection & Cleanliness Management
  async getInspectionStats(): Promise<{
    scheduled_count: number
    completed_count: number
    failed_count: number
    overdue_count: number
    average_cleanliness_score: number
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/inspections/stats`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return {
      scheduled_count: 5,
      completed_count: 28,
      failed_count: 3,
      overdue_count: 1,
      average_cleanliness_score: 87.5,
    }
  },

  async getInspections(params?: { block?: string; room_number?: string }): Promise<any[]> {
    try {
      const query = new URLSearchParams()
      if (params?.block && params.block !== 'all') query.set('block', params.block)
      if (params?.room_number) query.set('room_number', params.room_number)
      const res = await fetch(`${API_BASE_URL}/api/v1/inspections?${query.toString()}`)
      if (res.ok) return res.json()
    } catch {
      // fallback
    }
    return []
  },

  async scheduleInspection(payload: any, role: string = 'warden'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/inspections/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to schedule inspection')
    }
    return res.json()
  },

  async submitInspection(inspectionId: string, submission: any, role: string = 'warden'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/inspections/${inspectionId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify(submission),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to submit inspection')
    }
    return res.json()
  },
}

