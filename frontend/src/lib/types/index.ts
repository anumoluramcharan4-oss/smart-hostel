export type Role = 'student' | 'warden' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  roles: Role[]
  activeRole: Role
  studentId?: string
  roomNumber?: string
  blockName?: string
  phone?: string
  department?: string
  year?: number
  emergencyContact?: {
    name: string
    relation: string
    phone: string
  }
}

export interface Hostel {
  id: string
  name: string
  code: string
  gender: 'male' | 'female' | 'co-ed'
  totalCapacity: number
  occupiedCapacity: number
  chiefWarden: string
  contactPhone: string
  blocksCount: number
}

export interface Block {
  id: string
  hostelId: string
  name: string
  code: string
  floorsCount: number
  roomsCount: number
  wardenId: string
  wardenName: string
  capacity: number
  occupied: number
}

export interface RoomOccupant {
  id: string
  name: string
  studentId: string
  bedNumber: string
  joinedDate: string
  email: string
  phone: string
}

export interface RoomAmenity {
  name: string
  condition: 'good' | 'fair' | 'damaged'
}

export interface Room {
  id: string
  blockId: string
  blockName: string
  roomNumber: string
  floor: number
  capacity: number
  occupiedCount: number
  type: 'single' | 'double' | 'triple' | 'quad'
  status: 'available' | 'occupied' | 'maintenance' | 'partially_occupied'
  occupants: RoomOccupant[]
  amenities: RoomAmenity[]
}

export type ComplaintCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'Carpentry'
  | 'Internet/Wi-Fi'
  | 'Cleanliness'
  | 'Appliance'
  | 'Other'

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical'
export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'

export interface ComplaintTimelineItem {
  id: string
  status: ComplaintStatus
  note: string
  timestamp: string
  by: string
}

export interface ComplaintComment {
  id: string
  senderName: string
  senderRole: Role
  message: string
  timestamp: string
}

export interface Complaint {
  id: string
  ticketNumber: string
  studentId: string
  studentName: string
  roomNumber: string
  blockName: string
  category: ComplaintCategory
  subItem: string
  title: string
  description: string
  priority: ComplaintPriority
  status: ComplaintStatus
  assignedStaffId?: string
  assignedStaffName?: string
  assignedStaffContact?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  timeline: ComplaintTimelineItem[]
  comments: ComplaintComment[]
  aiConfidence?: number
  aiClassified?: boolean
  photoUrl?: string
}

export type LeaveType = 'day_outpass' | 'weekend_leave' | 'vacation' | 'emergency'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveRequest {
  id: string
  studentId: string
  studentName: string
  roomNumber: string
  blockName: string
  type: LeaveType
  startDate: string
  endDate: string
  reason: string
  destination: string
  parentContact: string
  parentInformed: boolean
  status: LeaveStatus
  rejectionReason?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
}

export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner'
export type MessCategory = 'food_quality' | 'hygiene' | 'taste' | 'service' | 'variety'

export interface MessFeedback {
  id: string
  studentId: string
  studentName: string
  date: string
  mealType: MealType
  rating: number
  category: MessCategory
  comment: string
  sentiment: 'positive' | 'neutral' | 'negative'
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  authorName: string
  authorRole: Role
  targetAudience: 'all' | 'students' | 'wardens' | 'block_specific'
  targetBlock?: string
  priority: 'normal' | 'urgent'
  isPinned: boolean
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'complaint' | 'leave' | 'announcement' | 'system' | 'mess'
  link?: string
  read: boolean
  createdAt: string
}

export interface MaintenanceStaff {
  id: string
  name: string
  category: ComplaintCategory
  phone: string
  activeTasks: number
  rating: number
  available: boolean
}

export interface AIInsight {
  id: string
  title: string
  description: string
  type: 'prediction' | 'anomaly' | 'summary' | 'recommendation'
  metric?: string
  timestamp: string
}

export interface FAQEntry {
  id: string
  question: string
  answer: string
  category: string
  source: string
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  citation?: string
  isError?: boolean
}

export interface HostelSettings {
  hostelName: string
  chiefWarden: string
  contactEmail: string
  contactPhone: string
  gateOpeningTime: string
  gateClosingTime: string
  nightCurfewTime: string
  guestVisitingHours: string
  complaintSlaHours: {
    critical: number
    high: number
    medium: number
    low: number
  }
}
