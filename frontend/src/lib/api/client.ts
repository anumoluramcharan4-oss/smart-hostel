import type {
  User,
  Role,
  Hostel,
  Block,
  Room,
  Complaint,
  LeaveRequest,
  MessFeedback,
  Announcement,
  Notification,
  MaintenanceStaff,
  AIInsight,
  FAQEntry,
  HostelSettings,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintCategory,
} from '../types'

export interface ApiClient {
  // Auth
  getCurrentUser(): Promise<User>
  login(email: string): Promise<User>
  switchRole(role: Role): Promise<User>

  // Hostel & Rooms
  getHostel(): Promise<Hostel>
  updateHostel(updates: Partial<Hostel>): Promise<Hostel>
  getBlocks(): Promise<Block[]>
  updateBlock(blockId: string, updates: Partial<Block>): Promise<Block>
  getRooms(blockId?: string): Promise<Room[]>
  getRoomByNumber(roomNumber: string): Promise<Room | undefined>
  updateRoomStatus(roomId: string, status: Room['status']): Promise<Room>

  // People
  getStudents(params?: { search?: string; block?: string; year?: number }): Promise<Array<{
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
  }>>
  getWardens(): Promise<Array<{
    id: string
    name: string
    email: string
    phone: string
    blockAssigned: string
    experienceYears: number
    office: string
  }>>
  getAllUsers(): Promise<User[]>
  getStaff(): Promise<MaintenanceStaff[]>

  // Complaints
  getComplaints(filters?: {
    studentId?: string
    status?: ComplaintStatus
    priority?: ComplaintPriority
    category?: ComplaintCategory
    search?: string
  }): Promise<Complaint[]>
  getComplaintById(id: string): Promise<Complaint | undefined>
  createComplaint(data: {
    category: ComplaintCategory
    subItem: string
    title: string
    description: string
    priority?: ComplaintPriority
    photoUrl?: string
  }): Promise<Complaint>
  updateComplaintStatus(id: string, status: ComplaintStatus, note?: string): Promise<Complaint>
  assignStaffToComplaint(complaintId: string, staffId: string): Promise<Complaint>
  addComplaintComment(complaintId: string, message: string): Promise<Complaint>
  overridePriority(complaintId: string, priority: ComplaintPriority, reason: string): Promise<Complaint>

  // Leave / Outpass
  getLeaves(studentId?: string): Promise<LeaveRequest[]>
  createLeave(data: Omit<LeaveRequest, 'id' | 'studentId' | 'studentName' | 'roomNumber' | 'blockName' | 'status' | 'createdAt'>): Promise<LeaveRequest>
  reviewLeave(leaveId: string, status: 'approved' | 'rejected', reason?: string): Promise<LeaveRequest>

  // Mess
  getMessFeedback(): Promise<MessFeedback[]>
  createMessFeedback(data: Omit<MessFeedback, 'id' | 'studentId' | 'studentName' | 'sentiment' | 'createdAt'>): Promise<MessFeedback>

  // Announcements
  getAnnouncements(): Promise<Announcement[]>
  createAnnouncement(data: Omit<Announcement, 'id' | 'authorName' | 'authorRole' | 'createdAt'>): Promise<Announcement>
  togglePinAnnouncement(id: string): Promise<Announcement>
  deleteAnnouncement(id: string): Promise<void>

  // Notifications
  getNotifications(userId?: string): Promise<Notification[]>
  markNotificationRead(id: string): Promise<void>
  markAllNotificationsRead(userId?: string): Promise<void>

  // AI & Assistant
  getAIInsights(): Promise<AIInsight[]>
  queryAssistant(query: string): Promise<{ answer: string; citation?: string }>
  getFAQList(): Promise<FAQEntry[]>

  // Settings
  getSettings(): Promise<HostelSettings>
  updateSettings(updates: Partial<HostelSettings>): Promise<HostelSettings>
}
