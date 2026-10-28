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
}

