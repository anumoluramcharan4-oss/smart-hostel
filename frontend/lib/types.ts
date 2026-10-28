export type Role = 'student' | 'warden' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar: string
  phone: string
  roomNumber?: string
  blockName?: string
  bedNumber?: string
  course?: string
  year?: number
  rollNo?: string
  department?: string
  designation?: string
  emergencyContact?: {
    name: string
    relation: string
    phone: string
  }
}

export interface Student {
  id: string
  name: string
  rollNo: string
  email: string
  phone: string
  roomNumber: string
  blockName: string
  bedNumber: string
  course: string
  year: number
  feeStatus: 'paid' | 'pending' | 'overdue'
  feeAmountDue: number
  attendancePercent: number
  avatar: string
  guardianName: string
  guardianPhone: string
  joinDate: string
}

export interface RoomOccupant {
  id: string
  name: string
  rollNo: string
  bed: string
  course: string
  avatar: string
}

export interface Room {
  id: string
  number: string
  blockId: string
  blockName: string
  floor: number
  type: 'single' | 'double' | 'triple'
  capacity: number
  occupied: number
  status: 'available' | 'occupied' | 'maintenance'
  occupants: RoomOccupant[]
  amenities: string[]
}

export interface Block {
  id: string
  name: string
  code: string
  floorsCount: number
  roomsCount: number
  capacity: number
  occupied: number
  wardenName: string
}

export type ComplaintCategory =
  | 'plumbing'
  | 'electrical'
  | 'wifi'
  | 'carpentry'
  | 'cleaning'
  | 'mess'
  | 'other'

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'student_approved'

export interface Complaint {
  id: string
  title: string
  description: string
  category: ComplaintCategory
  priority: ComplaintPriority
  status: ComplaintStatus
  studentId: string
  studentName: string
  roomNumber: string
  blockName: string
  createdAt: string
  updatedAt: string
  assignedTo?: string
  resolutionNotes?: string
  studentApproved?: boolean
  studentApprovalNote?: string
  timeline: {
    status: ComplaintStatus
    timestamp: string
    note: string
  }[]
}

export interface Notice {
  id: string
  title: string
  content: string
  priority: 'urgent' | 'important' | 'general'
  category: 'event' | 'maintenance' | 'mess' | 'admin' | 'rule'
  publishedAt: string
  author: string
  authorRole: string
  pinned: boolean
}

export interface FeeRecord {
  id: string
  studentId: string
  studentName: string
  rollNo: string
  roomNumber: string
  title: string
  semester: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'paid' | 'pending' | 'overdue'
  receiptNumber?: string
  mode?: string
}

export interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  rollNo: string
  roomNumber: string
  blockName: string
  date: string
  status: 'present' | 'absent' | 'leave'
  checkInTime?: string
}

export interface AttendanceDaySummary {
  date: string
  presentCount: number
  absentCount: number
  leaveCount: number
  percentage: number
}

export interface DashboardStats {
  totalStudents: number
  totalRooms: number
  occupiedRooms: number
  occupancyRate: number
  pendingComplaints: number
  resolvedComplaints: number
  totalFeesCollected: number
  totalFeesPending: number
  todayAttendancePercent: number
}

export interface WardenInfo {
  id: string
  name: string
  email: string
  phone: string
  assignedBlockId: string
  assignedBlockName: string
  designation: string
  status: 'active' | 'on_duty' | 'on_leave'
  avatar?: string
}

export type GrievanceCategory =
  | 'misconduct'
  | 'negligence'
  | 'harassment'
  | 'unresponsiveness'
  | 'bias'
  | 'corruption'
  | 'other'

export type GrievanceStatus = 'under_review' | 'investigating' | 'action_taken' | 'resolved'

export interface WardenGrievance {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  studentPhone: string
  blockName: string
  roomNumber: string
  wardenName: string
  category: GrievanceCategory
  subject: string
  description: string
  status: GrievanceStatus
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

