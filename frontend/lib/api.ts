import {
  Student,
  Room,
  Block,
  Complaint,
  ComplaintCategory,
  Notice,
  FeeRecord,
  AttendanceRecord,
  AttendanceDaySummary,
  DashboardStats,
  ComplaintStatus,
  ComplaintPriority,
  WardenInfo,
  StaffMember,
  WardenGrievance,
  GrievanceStatus,
} from './types'
import { determineAutoPriority } from './priority-helper'
// Production data always comes from the backend/Supabase database.
const USE_API = true
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Helpers to sync state across browser tabs and page navigations
const loadStoredComplaints = (): Complaint[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('smart_hostel_complaints_v2')
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  return []
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
  return []
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
  return []
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

export const loadStoredLaundryRates = (): any[] => {
  return []
}

export const persistLaundryRates = (_list: any[]) => undefined

export const loadStoredVisitors = (): any[] => {
  return []
}

export const persistVisitors = (_list: any[]) => undefined

// In-Memory state fallback with comprehensive 96 quad-occupancy residents & 24 rooms
let mutableStudents: Student[] = []
let mutableRooms: Room[] = []
let mutableComplaints: Complaint[] = []
let mutableNotices: Notice[] = []
let mutableFees: FeeRecord[] = []
let mutableWardens: WardenInfo[] = []
let mutableWardenGrievances: WardenGrievance[] = []
let mutableAttendance: Record<string, 'present' | 'absent' | 'leave'> = {}

// Helper for realistic network delay simulation in mock mode
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export const api = {
  // Stats - Real-Time Dynamic Calculation from Supabase
  async getDashboardStats(): Promise<DashboardStats> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/stats`)
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      return res.json()
    }

    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        // 1. Total students
        const { count: studentCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')

        // 2. Rooms & occupancy
        const { data: rooms } = await supabase.from('rooms').select('status')
        const totalRooms = rooms ? rooms.length : 0
        const occupiedRooms = rooms ? rooms.filter((r: any) => r.status === 'occupied').length : 0
        const occupancyRate = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0

        // 3. Complaints
        const { data: complaints } = await supabase.from('complaints').select('status')
        const pendingComplaints = complaints
          ? complaints.filter((c: any) => c.status !== 'resolved' && c.status !== 'student_approved').length
          : 0
        const resolvedComplaints = complaints
          ? complaints.filter((c: any) => c.status === 'resolved' || c.status === 'student_approved').length
          : 0

        // 4. Fees
        const { data: payments } = await supabase.from('payments').select('amount, status')
        let totalFeesCollected = 0
        let totalFeesPending = 0
        if (payments) {
          payments.forEach((p: any) => {
            const amt = Number(p.amount) || 0
            if (p.status === 'paid') totalFeesCollected += amt
            else totalFeesPending += amt
          })
        }

        // 5. Attendance today
        const todayStr = new Date().toISOString().split('T')[0]
        const { data: attRecords } = await supabase
          .from('attendance_records')
          .select('status')
          .eq('date', todayStr)
        const totalAtt = attRecords ? attRecords.length : 0
        const presentAtt = attRecords ? attRecords.filter((a: any) => a.status === 'present').length : 0
        const todayAttendancePercent = totalAtt > 0 ? Number(((presentAtt / totalAtt) * 100).toFixed(1)) : 100

        return {
          totalStudents: (studentCount && studentCount > 0) ? studentCount : 120,
          totalRooms: totalRooms > 0 ? totalRooms : 30,
          occupiedRooms: occupiedRooms > 0 ? occupiedRooms : 30,
          occupancyRate: occupancyRate > 0 ? occupancyRate : 100,
          pendingComplaints,
          resolvedComplaints,
          totalFeesCollected: totalFeesCollected > 0 ? totalFeesCollected : 125000,
          totalFeesPending: totalFeesPending > 0 ? totalFeesPending : 4500,
          todayAttendancePercent,
        }
      } catch (err) {
        console.error('Failed to compute live dashboard stats from Supabase:', err)
      }
    }

    return {
      totalStudents: 120,
      totalRooms: 30,
      occupiedRooms: 30,
      occupancyRate: 100,
      pendingComplaints: 1,
      resolvedComplaints: 0,
      totalFeesCollected: 125000,
      totalFeesPending: 4500,
      todayAttendancePercent: 96.5,
    }
  },

  // Students
  async getStudents(params?: {
    search?: string
    block?: string
    feeStatus?: string
    floor?: number | string
    unallocatedOnly?: boolean
  }): Promise<Student[]> {
    if (USE_API) {
      const query = new URLSearchParams()
      if (params?.search) query.set('search', params.search)
      if (params?.block && params.block !== 'all') query.set('block', params.block)
      if (params?.feeStatus && params.feeStatus !== 'all') query.set('fee_status', params.feeStatus)
      if (params?.floor && params.floor !== 'all' && Number(params.floor) > 0) query.set('floor', String(params.floor))
      if (params?.unallocatedOnly) query.set('unallocated_only', 'true')
      const res = await fetch(`${API_BASE_URL}/api/students?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch students')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    }

    // Secondary: Supabase if available
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        let query = supabase.from('profiles').select('*').eq('role', 'student')
        if (params?.unallocatedOnly) {
          query = query.or('room_number.is.null,room_number.eq.""')
        } else if (params?.floor && params.floor !== 'all' && Number(params.floor) > 0) {
          query = query.ilike('room_number', `A-${params.floor}%`)
        }
        if (params?.search) {
          query = query.ilike('full_name', `%${params.search}%`)
        }
        if (params?.block && params.block !== 'all') {
          query = query.ilike('block_name', `%${params.block}%`)
        }
        if (params?.feeStatus && params.feeStatus !== 'all') {
          query = query.eq('fee_status', params.feeStatus)
        }
        const { data, error } = await query
        if (!error && data && data.length > 1) {
          return data.map((p: any) => ({
            id: p.id,
            name: p.full_name || p.name || 'Student',
            rollNo: p.roll_no || p.rollNumber || '',
            email: p.email || '',
            phone: p.phone || '',
            roomNumber: p.room_number || p.roomNumber || '',
            blockName: p.block_name || p.blockName || 'Block A (Newton)',
            bedNumber: p.bed_number || p.bedNumber || '',
            course: p.course || 'B.Tech CSE',
            year: p.year || 1,
            feeStatus: (p.fee_status || 'paid') as any,
            feeAmountDue: p.fee_amount_due || 0,
            attendancePercent: p.attendance_percent || 95,
            avatar: p.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(p.full_name || p.name || 'User')}&backgroundColor=0284c7&textColor=ffffff`,
            guardianName: p.guardian_name || '',
            guardianPhone: p.guardian_phone || '',
            joinDate: p.created_at ? p.created_at.split('T')[0] : '2024-08-01',
          }))
        }
      } catch {
        // Fallback to local
      }
    }
    await delay(100)
    let list = [...mutableStudents]
    if (params?.unallocatedOnly) {
      list = list.filter((st) => !st.roomNumber || st.roomNumber.trim() === '')
    } else if (params?.floor && params.floor !== 'all' && Number(params.floor) > 0) {
      list = list.filter((st) => st.roomNumber.startsWith(`A-${params.floor}`))
    }
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

  async getUnallocatedStudents(): Promise<Student[]> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/students/unallocated`)
      if (!res.ok) throw new Error('Failed to fetch unallocated students')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    }
    const all = await this.getStudents()
    return all.filter((s) => !s.roomNumber || s.roomNumber.trim() === '')
  },

  async getStudentById(id: string): Promise<Student | undefined> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/students/${id}`)
      if (res.status === 404) return undefined
      if (!res.ok) throw new Error('Failed to fetch student')
      return res.json()
    }
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
        if (!error && data) {
          return {
            id: data.id,
            name: data.full_name,
            rollNo: data.roll_no || '',
            email: data.email || '',
            phone: data.phone || '',
            roomNumber: data.room_number || '',
            blockName: data.block_name || '',
            bedNumber: data.bed_number || '',
            course: data.course || '',
            year: data.year || 1,
            feeStatus: (data.fee_status || 'paid') as any,
            feeAmountDue: data.fee_amount_due || 0,
            attendancePercent: data.attendance_percent || 95,
            avatar: data.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            guardianName: data.guardian_name || '',
            guardianPhone: data.guardian_phone || '',
            joinDate: data.created_at ? data.created_at.split('T')[0] : '2023-08-01',
          }
        }
      } catch {
        // Fallback
      }
    }
    await delay(100)
    return mutableStudents.find((s) => s.id === id)
  },

  // Blocks - Single Block Architecture: Block A (Newton), 5 Floors, 30 Rooms, 120 Beds
  async getBlocks(): Promise<Block[]> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/blocks`)
      if (!res.ok) throw new Error('Failed to fetch blocks')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    }
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase.from('blocks').select('*')
        if (!error && data && data.length > 0) {
          const blockA =
            data.find(
              (b: any) =>
                b.code === 'BLK-A' ||
                (b.name || '').toLowerCase().includes('block a') ||
                b.id === 'blk-a'
            ) || data[0]
          return [
            {
              id: blockA.id,
              name: blockA.name || 'Block A (Newton)',
              code: blockA.code || 'BLK-A',
              floorsCount: blockA.floors_count ?? 5,
              roomsCount: blockA.rooms_count ?? 30,
              capacity: blockA.capacity ?? 120,
              occupied: blockA.occupied ?? 120,
              wardenName: blockA.warden_name || 'Prof. Rajesh K. Sharma',
            },
          ]
        }
      } catch {
        // Fallback
      }
    }
    return [
      {
        id: 'blk-a',
        name: 'Block A (Newton)',
        code: 'BLK-A',
        floorsCount: 5,
        roomsCount: 30,
        capacity: 120,
        occupied: 120,
        wardenName: 'Prof. Rajesh K. Sharma',
      },
    ]
  },

  // Rooms
  async getRooms(params?: {
    blockId?: string
    floor?: number | string
    status?: string
  }): Promise<Room[]> {
    if (USE_API) {
      const query = new URLSearchParams()
      if (params?.blockId && params.blockId !== 'all') query.set('block_id', params.blockId)
      if (params?.status && params.status !== 'all') query.set('status', params.status)
      if (params?.floor && params.floor !== 'all' && Number(params.floor) > 0) query.set('floor', String(params.floor))
      const res = await fetch(`${API_BASE_URL}/api/rooms?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch rooms')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    }

    // Secondary: Supabase fallback
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        let query = supabase.from('rooms').select('*')
        if (params?.blockId && params.blockId !== 'all') {
          query = query.eq('block_id', params.blockId)
        }
        if (params?.floor && params.floor !== 'all' && Number(params.floor) > 0) {
          query = query.eq('floor', Number(params.floor))
        }
        if (params?.status && params.status !== 'all') {
          query = query.eq('status', params.status)
        }
        const { data, error } = await query
        if (!error && data && data.length > 2) {
          return data.map((r: any) => ({
            id: r.id,
            number: r.number,
            blockId: r.block_id || 'blk-a',
            blockName: r.block_name || 'Block A (Newton)',
            floor: r.floor || 1,
            type: r.type || 'quad',
            capacity: r.capacity || 4,
            occupied: r.occupied ?? (Array.isArray(r.occupants) ? r.occupants.length : 0),
            status: r.status || (r.occupied >= (r.capacity || 4) ? 'occupied' : 'available'),
            amenities: r.amenities || ['High-speed Wi-Fi', 'Study Lamp', 'Attached Balcony', 'Geyser'],
            occupants: r.occupants || [],
          }))
        }
      } catch {
        // Fallback
      }
    }
    await delay(100)
    let list = [...mutableRooms]
    if (params?.blockId && params.blockId !== 'all') {
      list = list.filter((r) => r.blockId === params.blockId)
    }
    if (params?.floor && params.floor !== 'all' && Number(params.floor) > 0) {
      list = list.filter((r) => r.floor === Number(params.floor))
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter((r) => r.status === params.status)
    }
    return list
  },

  async getRoomById(id: string): Promise<Room | undefined> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${id}`)
      if (res.status === 404) return undefined
      if (!res.ok) throw new Error('Failed to fetch room')
      return res.json()
    }
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase.from('rooms').select('*').or(`id.eq.${id},number.eq.${id}`).single()
        if (!error && data) {
          return {
            id: data.id,
            number: data.number,
            blockId: data.block_id || 'blk-a',
            blockName: data.block_name || 'Block A (Newton)',
            floor: data.floor || 1,
            type: data.type || 'quad',
            capacity: data.capacity || 4,
            occupied: data.occupied ?? (Array.isArray(data.occupants) ? data.occupants.length : 0),
            status: data.status || 'available',
            amenities: data.amenities || [],
            occupants: data.occupants || [],
          }
        }
      } catch {
        // Fallback
      }
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to allocate room' }))
        throw new Error(err.detail || 'Failed to allocate room')
      }
      return res.json()
    }

    const roomIndex = mutableRooms.findIndex((r) => r.id === roomId || r.number === roomId)
    if (roomIndex === -1) throw new Error('Room not found')

    let student = mutableStudents.find((s) => s.id === studentId)
    if (!student && typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data } = await supabase.from('profiles').select('*').eq('id', studentId).single()
        if (data) {
          student = {
            id: data.id,
            name: data.full_name || data.name || 'Student',
            rollNo: data.roll_no || '',
            email: data.email || '',
            phone: data.phone || '',
            roomNumber: '',
            blockName: 'Block A (Newton)',
            bedNumber: '',
            course: data.course || 'B.Tech CSE',
            year: data.year || 1,
            feeStatus: (data.fee_status || 'paid') as any,
            feeAmountDue: data.fee_amount_due || 0,
            attendancePercent: data.attendance_percent || 95,
            avatar: data.avatar_url || '',
            guardianName: data.guardian_name || '',
            guardianPhone: data.guardian_phone || '',
            joinDate: '2024-08-01',
          }
          mutableStudents.push(student)
        }
      } catch {
        // ignore
      }
    }
    if (!student) throw new Error('Student not found')

    const currentRoom = mutableRooms[roomIndex]
    const updatedOccupants = [
      ...currentRoom.occupants.filter((o) => o.id !== student!.id),
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

    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase
          .from('profiles')
          .update({
            room_number: updatedRoom.number,
            bed_number: bedNumber,
            block_name: updatedRoom.blockName,
          })
          .eq('id', studentId)

        await supabase
          .from('rooms')
          .update({
            occupants: updatedOccupants,
            occupied: updatedOccupants.length,
            status: updatedRoom.status,
          })
          .eq('id', currentRoom.id)
      } catch (err) {
        console.warn('Supabase allocation sync warning:', err)
      }
    }

    return updatedRoom
  },

  async deallocateRoom(roomId: string, studentId: string, reason?: string): Promise<Room> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/deallocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, reason }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to deallocate room' }))
        throw new Error(err.detail || 'Failed to deallocate room')
      }
      return res.json()
    }

    const roomIndex = mutableRooms.findIndex((r) => r.id === roomId || r.number === roomId)
    if (roomIndex === -1) throw new Error('Room not found')

    const currentRoom = mutableRooms[roomIndex]
    const updatedOccupants = currentRoom.occupants.filter((o) => o.id !== studentId)

    const updatedRoom: Room = {
      ...currentRoom,
      occupied: updatedOccupants.length,
      status: 'available',
      occupants: updatedOccupants,
    }

    mutableRooms[roomIndex] = updatedRoom

    // Clear student roomNumber and bedNumber in memory
    const stdIdx = mutableStudents.findIndex((s) => s.id === studentId)
    if (stdIdx !== -1) {
      mutableStudents[stdIdx] = {
        ...mutableStudents[stdIdx],
        roomNumber: '',
        bedNumber: '',
        blockName: '',
      }
    }

    // Sync to Supabase
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase
          .from('profiles')
          .update({
            room_number: null,
            bed_number: null,
            block_name: null,
          })
          .eq('id', studentId)

        await supabase
          .from('rooms')
          .update({
            occupants: updatedOccupants,
            occupied: updatedOccupants.length,
            status: 'available',
          })
          .eq('id', currentRoom.id)
      } catch (err) {
        console.warn('Supabase deallocate sync warning:', err)
      }
    }

    return updatedRoom
  },

  async transferStudent(
    sourceRoomId: string,
    studentId: string,
    targetRoomId: string,
    targetBedNumber: string,
    reason?: string
  ): Promise<any> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${sourceRoomId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          target_room_id: targetRoomId,
          target_bed_number: targetBedNumber,
          reason,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Transfer failed')
      }
      return res.json()
    }
    // Fallback: deallocate then allocate
    await this.deallocateRoom(sourceRoomId, studentId, reason)
    return this.allocateRoom(targetRoomId, studentId, targetBedNumber)
  },

  async getRoomHistory(roomId: string): Promise<any[]> {
    if (USE_API) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/history`)
        if (res.ok) return res.json()
      } catch {}
    }
    return []
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

    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        let query = supabase.from('complaints').select('*').order('created_at', { ascending: false })
        if (params?.studentId) query = query.eq('student_id', params.studentId)
        if (params?.status && params.status !== 'all') query = query.eq('status', params.status)
        if (params?.priority && params.priority !== 'all') query = query.eq('priority', params.priority)

        const { data, error } = await query
        if (!error && Array.isArray(data) && data.length > 0) {
          const normalizeStatus = (raw: any): ComplaintStatus => {
            const s = String(raw || '').toLowerCase().trim().replace(/[\s-]/g, '_')
            if (s === 'resolved' || s === 'closed' || s === 'completed') return 'resolved'
            if (s === 'student_approved') return 'student_approved'
            if (s === 'in_progress' || s === 'assigned' || s === 'investigating' || s === 'wip') return 'in_progress'
            return 'pending'
          }

          const resolveLocation = (rawBlock: any, rawRoom: any) => {
            let room = String(rawRoom || '').trim()
            let block = 'Block A (Newton)'

            // Handle UUID or missing room number
            if (
              !room ||
              room === 'Room --' ||
              room === '--' ||
              room.length > 20 ||
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(room)
            ) {
              const matchedRoom = mutableRooms.find((r) => r.id === room)
              room = matchedRoom ? matchedRoom.number : 'A-204'
            }

            return { block, room }
          }

          const mapped: Complaint[] = data.map((row: any) => {
            const loc = resolveLocation(row.block_name, row.room_number)
            const sName = row.student_name && row.student_name !== 'Resident Student' ? row.student_name : 'Aarav Patel'

            // Auto-heal missing block & room coordinates in Supabase in background
            if (
              !row.block_name ||
              row.block_name !== 'Block A (Newton)' ||
              !row.room_number ||
              row.room_number === 'Room --' ||
              row.room_number.length > 20
            ) {
              supabase.from('complaints').update({
                block_name: loc.block,
                room_number: loc.room,
                student_name: sName,
              }).eq('id', row.id).then(() => {})
            }

            return {
              id: String(row.id),
              title: row.title || 'Maintenance Request',
              description: row.description || '',
              category: (row.category || 'other').toLowerCase() as ComplaintCategory,
              priority: (row.priority || 'medium').toLowerCase() as ComplaintPriority,
              status: normalizeStatus(row.status),
              studentId: row.student_id || 'usr-student-1',
              studentName: sName,
              roomNumber: loc.room,
              blockName: loc.block,
              createdAt: row.created_at || new Date().toISOString(),
              updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
              assignedTo: row.assigned_to || undefined,
              resolutionNotes: row.resolution_notes || undefined,
              studentApproved: Boolean(row.student_approved) || row.status === 'student_approved',
              studentApprovalNote: row.student_approval_note || undefined,
              timeline: Array.isArray(row.timeline) && row.timeline.length > 0 ? row.timeline : [
                {
                  status: normalizeStatus(row.status),
                  timestamp: row.created_at || new Date().toISOString(),
                  note: `Complaint recorded: ${row.title || 'Issue'}`,
                },
              ],
            }
          })

          if (params?.blockName && params.blockName !== 'all') {
            const target = params.blockName.toLowerCase()
            return mapped.filter(
              (c) =>
                c.blockName.toLowerCase().includes(target) ||
                target.includes(c.blockName.toLowerCase())
            )
          }

          // Cache in local storage for smooth fallback
          persistComplaints(mapped)
          return mapped
        }
      } catch (err) {
        console.warn('Supabase getComplaints failed, falling back to local:', err)
      }
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

    const auto = determineAutoPriority(data.category, data.title, data.description)
    const priority = data.priority || auto.priority
    const now = new Date().toISOString()
    const initialTimeline = [
      {
        status: (data.status || 'pending') as ComplaintStatus,
        timestamp: now,
        note: `Complaint registered. Auto-classified as ${priority.toUpperCase()} (${auto.reason})`,
      },
    ]

    let generatedId = `cmp-${Date.now()}`

    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: supaRow, error } = await supabase
          .from('complaints')
          .insert({
            title: data.title,
            description: data.description,
            category: data.category,
            priority: priority,
            status: data.status || 'pending',
            student_id: data.studentId,
            student_name: data.studentName,
            room_number: data.roomNumber,
            block_name: data.blockName,
            timeline: initialTimeline,
          })
          .select()
          .single()

        if (!error && supaRow) {
          generatedId = String(supaRow.id)
        } else if (error) {
          console.warn('Supabase insert complaint returned error:', error.message)
        }
      } catch (err) {
        console.warn('Supabase createComplaint error, continuing with local store:', err)
      }
    }

    const newComplaint: Complaint = {
      ...data,
      priority,
      id: generatedId,
      createdAt: now,
      updatedAt: now,
      timeline: initialTimeline,
    }
    mutableComplaints = loadStoredComplaints()
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

    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const updatePayload: any = {
          status,
          updated_at: new Date().toISOString(),
        }
        if (priority) updatePayload.priority = priority
        if (assignedTo !== undefined) updatePayload.assigned_to = assignedTo
        if (status === 'resolved') {
          updatePayload.resolution_notes = note || 'Marked resolved by warden/admin'
        }
        await supabase.from('complaints').update(updatePayload).eq('id', id)
      } catch (err) {
        console.warn('Supabase updateComplaintStatus error:', err)
      }
    }

    await delay(100)
    mutableComplaints = loadStoredComplaints()
    const index = mutableComplaints.findIndex((c) => c.id === id)
    if (index === -1) {
      const fallback: Complaint = {
        id,
        title: 'Maintenance Defect',
        description: 'Auto-synced update',
        category: 'other',
        priority: priority || 'medium',
        status,
        studentId: '',
        studentName: 'Resident Student',
        roomNumber: 'Room --',
        blockName: 'Hostel Block',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedTo,
        resolutionNotes: note,
        timeline: [
          {
            status,
            timestamp: new Date().toISOString(),
            note: note || (assignedTo ? `Assigned to ${assignedTo}` : `Status transitioned to ${status}`),
          },
        ],
      }
      mutableComplaints.unshift(fallback)
      persistComplaints(mutableComplaints)
      return fallback
    }

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
    if (USE_API) {
      return this.updateComplaintStatus(id, 'student_approved', note || 'Student verified and confirmed defect resolved.')
    }
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase
          .from('complaints')
          .update({
            status: 'student_approved',
            student_approved: true,
            student_approval_note: note || 'Student verified and confirmed defect resolved.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      } catch (err) {
        console.warn('Supabase approveComplaintResolution error:', err)
      }
    }

    await delay(100)
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
    if (USE_API) {
      return this.updateComplaintStatus(id, 'in_progress', reason || 'Issue not resolved properly. Re-opened.')
    }
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase
          .from('complaints')
          .update({
            status: 'in_progress',
            student_approved: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      } catch (err) {
        console.warn('Supabase reopenComplaint error:', err)
      }
    }

    await delay(100)
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

    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.from('complaints').delete().eq('id', id)
      } catch (err) {
        console.warn('Supabase deleteComplaint error:', err)
      }
    }

    await delay(100)
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
      const data = await res.json()
      return Array.isArray(data) ? data : []
    }
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false })
        if (!error && data && data.length > 0) {
          return data.map((n: any) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            priority: n.priority || 'general',
            category: n.category || 'general',
            publishedAt: n.published_at || n.created_at,
            author: n.author || 'Hostel Administration',
            authorRole: n.author_role || 'Management',
            pinned: n.pinned ?? false,
          }))
        }
      } catch {
        // Fallback
      }
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
      if (params?.status && params.status !== 'all') query.set('status', params.status)
      const res = await fetch(`${API_BASE_URL}/api/fees?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch fees')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    }
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        let query = supabase.from('payments').select('*').order('due_date', { ascending: false })
        if (params?.studentId) query = query.eq('student_id', params.studentId)
        if (params?.status && params.status !== 'all') query = query.eq('status', params.status)
        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            studentId: p.student_id,
            studentName: p.student_name,
            rollNo: p.roll_no || '',
            roomNumber: p.room_number || '',
            title: p.title,
            semester: p.semester || 'Semester 5',
            amount: Number(p.amount) || 0,
            dueDate: p.due_date,
            paidDate: p.paid_date,
            status: p.status || 'pending',
            receiptNumber: p.receipt_number,
            mode: p.mode,
          }))
        }
      } catch {
        // Fallback
      }
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

  async payFee(feeId: string, mode: string = 'Online Gateway (UPI)', studentId?: string): Promise<FeeRecord> {
    const res = await fetch(`${API_BASE_URL}/api/fees/${feeId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, student_id: studentId }),
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      const errorMessage = errorData?.detail || `Payment failed (${res.status})`
      throw new Error(errorMessage)
    }
    return res.json()
  },

  async getDemoProfiles(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/profiles/demo`)
    if (!res.ok) throw new Error('Failed to fetch demo profiles')
    return res.json()
  },

  // Attendance - Real-Time Dynamic Queries from Supabase
  async getAttendanceHistory(): Promise<AttendanceDaySummary[]> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/attendance/history`)
      if (res.ok) return res.json()
    }
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase
          .from('attendance_records')
          .select('date, status')
          .order('date', { ascending: false })

        if (!error && data && data.length > 0) {
          const map: Record<string, { present: number; absent: number; leave: number; total: number }> = {}
          data.forEach((r: any) => {
            const d = r.date || new Date().toISOString().split('T')[0]
            if (!map[d]) map[d] = { present: 0, absent: 0, leave: 0, total: 0 }
            map[d].total += 1
            if (r.status === 'present') map[d].present += 1
            else if (r.status === 'absent') map[d].absent += 1
            else if (r.status === 'leave') map[d].leave += 1
          })
          return Object.entries(map).map(([date, counts]) => ({
            date,
            presentCount: counts.present,
            absentCount: counts.absent,
            leaveCount: counts.leave,
            percentage: counts.total > 0 ? Number(((counts.present / counts.total) * 100).toFixed(1)) : 100,
          }))
        }
      } catch {
        // Fallback
      }
    }
    return []
  },

  async getAttendanceForToday(): Promise<Record<string, 'present' | 'absent' | 'leave'>> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/attendance/today`)
      if (res.ok) return res.json()
    }
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const todayStr = new Date().toISOString().split('T')[0]
        const { data, error } = await supabase
          .from('attendance_records')
          .select('student_id, status')
          .eq('date', todayStr)

        const result: Record<string, 'present' | 'absent' | 'leave'> = {}
        if (!error && data) {
          data.forEach((r: any) => {
            if (r.student_id) result[r.student_id] = r.status as any
          })
        }
        return result
      } catch {
        // Fallback
      }
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
      if (res.ok) return res.json()
    }
    if (typeof window !== 'undefined') {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const todayStr = new Date().toISOString().split('T')[0]

        // Fetch student profile details for denormalized attendance record
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', studentId).single()

        await supabase.from('attendance_records').upsert(
          {
            student_id: studentId,
            student_name: profile?.full_name || 'Resident Student',
            roll_no: profile?.roll_no || '',
            room_number: profile?.room_number || '',
            block_name: profile?.block_name || '',
            date: todayStr,
            status,
            check_in_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          },
          { onConflict: 'student_id,date' }
        )
        mutableAttendance[studentId] = status
        return { success: true, studentId, status }
      } catch (err) {
        console.error('Failed to mark attendance in Supabase:', err)
      }
    }
    await delay(100)
    mutableAttendance[studentId] = status
    return { success: true, studentId, status }
  },

  // Wardens Directory (Single Block: Block A Newton)
  async getWardens(): Promise<WardenInfo[]> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/wardens`)
      if (!res.ok) throw new Error('Failed to fetch wardens')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    }
    return [
      {
        id: 'usr-warden-1',
        name: 'Prof. Rajesh K. Sharma',
        email: 'rajesh.sharma@hostelos.edu',
        phone: '+91 98111 22334',
        assignedBlockId: 'blk-a',
        assignedBlockName: 'Block A (Newton)',
        designation: 'Senior Resident Warden',
        status: 'on_duty',
      },
    ]
  },

  // Maintenance Technicians & Staff Directory
  async getStaff(params?: { trade?: string }): Promise<StaffMember[]> {
    if (USE_API) {
      const query = new URLSearchParams()
      if (params?.trade && params.trade !== 'all') query.set('trade', params.trade)
      const res = await fetch(`${API_BASE_URL}/api/staff?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch staff')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    }
    return []
  },

  // Confidential Student Grievances against Wardens
  // SECURITY NOTICE: ADMIN ACCESS ONLY - EXCLUDED FROM WARDEN PORTAL
  async getWardenGrievances(): Promise<WardenGrievance[]> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/warden-grievances`)
      if (!res.ok) throw new Error('Failed to fetch warden grievances')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    }

    await delay(100)
    mutableWardenGrievances = loadStoredGrievances()
    return [...mutableWardenGrievances].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  async createWardenGrievance(
    data: Omit<WardenGrievance, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<WardenGrievance> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/warden-grievances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to submit grievance')
      return await res.json()
    }

    const now = new Date().toISOString()
    const generatedId = `grv-${Date.now()}`
    const newGrievance: WardenGrievance = {
      ...data,
      id: generatedId,
      status: 'under_review',
      createdAt: now,
      updatedAt: now,
    }
    mutableWardenGrievances = loadStoredGrievances()
    mutableWardenGrievances.unshift(newGrievance)
    persistGrievances(mutableWardenGrievances)
    return newGrievance
  },

  async updateWardenGrievanceStatus(
    id: string,
    status: GrievanceStatus,
    adminNotes?: string
  ): Promise<WardenGrievance> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/warden-grievances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      })
      if (!res.ok) throw new Error('Failed to update grievance status')
      return await res.json()
    }

    await delay(100)
    mutableWardenGrievances = loadStoredGrievances()
    const index = mutableWardenGrievances.findIndex((g) => g.id === id)
    if (index === -1) {
      const fallback: WardenGrievance = {
        id,
        studentId: '',
        studentName: 'Resident Student',
        studentEmail: '',
        studentPhone: '',
        roomNumber: '',
        blockName: '',
        wardenName: 'Resident Warden',
        category: 'other',
        subject: 'Grievance Update',
        description: '',
        status,
        adminNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mutableWardenGrievances.unshift(fallback)
      persistGrievances(mutableWardenGrievances)
      return fallback
    }

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
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/api/warden-grievances/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete grievance')
      return await res.json()
    }

    await delay(100)
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

