import type { ApiClient } from './client'
import { mockStore } from '../mock/data'
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

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

export class MockAdapter implements ApiClient {
  async getCurrentUser(): Promise<User> {
    await delay(60)
    return mockStore.getCurrentUser()
  }

  async login(email: string): Promise<User> {
    await delay(120)
    const user = mockStore.login(email)
    if (!user) throw new Error('Invalid email or password.')
    return user
  }

  async switchRole(role: Role): Promise<User> {
    await delay(80)
    return mockStore.switchRole(role)
  }

  async getHostel(): Promise<Hostel> {
    await delay(60)
    return mockStore.getHostel()
  }

  async updateHostel(updates: Partial<Hostel>): Promise<Hostel> {
    await delay(100)
    return mockStore.updateHostel(updates)
  }

  async getBlocks(): Promise<Block[]> {
    await delay(80)
    return mockStore.getBlocks()
  }

  async updateBlock(blockId: string, updates: Partial<Block>): Promise<Block> {
    await delay(100)
    return mockStore.updateBlock(blockId, updates)
  }

  async getRooms(blockId?: string): Promise<Room[]> {
    await delay(90)
    return mockStore.getRooms(blockId)
  }

  async getRoomByNumber(roomNumber: string): Promise<Room | undefined> {
    await delay(60)
    return mockStore.getRoomByNumber(roomNumber)
  }

  async updateRoomStatus(roomId: string, status: Room['status']): Promise<Room> {
    await delay(100)
    return mockStore.updateRoomStatus(roomId, status)
  }

  async getStudents(params?: { search?: string; block?: string; year?: number }) {
    await delay(100)
    return mockStore.getStudents(params)
  }

  async getWardens() {
    await delay(70)
    return mockStore.getWardens()
  }

  async getAllUsers(): Promise<User[]> {
    await delay(80)
    return mockStore.getAllUsers()
  }

  async getStaff(): Promise<MaintenanceStaff[]> {
    await delay(70)
    return mockStore.getStaff()
  }

  async getComplaints(filters?: {
    studentId?: string
    status?: ComplaintStatus
    priority?: ComplaintPriority
    category?: ComplaintCategory
    search?: string
  }): Promise<Complaint[]> {
    await delay(120)
    return mockStore.getComplaints(filters)
  }

  async getComplaintById(id: string): Promise<Complaint | undefined> {
    await delay(60)
    return mockStore.getComplaintById(id)
  }

  async createComplaint(data: {
    category: ComplaintCategory
    subItem: string
    title: string
    description: string
    priority?: ComplaintPriority
    photoUrl?: string
  }): Promise<Complaint> {
    await delay(150)
    return mockStore.createComplaint(data)
  }

  async updateComplaintStatus(id: string, status: ComplaintStatus, note?: string): Promise<Complaint> {
    await delay(120)
    return mockStore.updateComplaintStatus(id, status, note)
  }

  async assignStaffToComplaint(complaintId: string, staffId: string): Promise<Complaint> {
    await delay(120)
    return mockStore.assignStaffToComplaint(complaintId, staffId)
  }

  async addComplaintComment(complaintId: string, message: string): Promise<Complaint> {
    await delay(90)
    return mockStore.addComplaintComment(complaintId, message)
  }

  async overridePriority(complaintId: string, priority: ComplaintPriority, reason: string): Promise<Complaint> {
    await delay(120)
    return mockStore.overridePriority(complaintId, priority, reason)
  }

  async getLeaves(studentId?: string): Promise<LeaveRequest[]> {
    await delay(100)
    return mockStore.getLeaves(studentId)
  }

  async createLeave(data: Omit<LeaveRequest, 'id' | 'studentId' | 'studentName' | 'roomNumber' | 'blockName' | 'status' | 'createdAt'>): Promise<LeaveRequest> {
    await delay(140)
    return mockStore.createLeave(data)
  }

  async reviewLeave(leaveId: string, status: 'approved' | 'rejected', reason?: string): Promise<LeaveRequest> {
    await delay(120)
    return mockStore.reviewLeave(leaveId, status, reason)
  }

  async getMessFeedback(): Promise<MessFeedback[]> {
    await delay(90)
    return mockStore.getMessFeedback()
  }

  async createMessFeedback(data: Omit<MessFeedback, 'id' | 'studentId' | 'studentName' | 'sentiment' | 'createdAt'>): Promise<MessFeedback> {
    await delay(120)
    return mockStore.createMessFeedback(data)
  }

  async getAnnouncements(): Promise<Announcement[]> {
    await delay(80)
    return mockStore.getAnnouncements()
  }

  async createAnnouncement(data: Omit<Announcement, 'id' | 'authorName' | 'authorRole' | 'createdAt'>): Promise<Announcement> {
    await delay(120)
    return mockStore.createAnnouncement(data)
  }

  async togglePinAnnouncement(id: string): Promise<Announcement> {
    await delay(80)
    return mockStore.togglePinAnnouncement(id)
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await delay(90)
    mockStore.deleteAnnouncement(id)
  }

  async getNotifications(userId?: string): Promise<Notification[]> {
    await delay(60)
    return mockStore.getNotifications(userId)
  }

  async markNotificationRead(id: string): Promise<void> {
    await delay(50)
    mockStore.markNotificationRead(id)
  }

  async markAllNotificationsRead(userId?: string): Promise<void> {
    await delay(60)
    mockStore.markAllNotificationsRead(userId)
  }

  async getAIInsights(): Promise<AIInsight[]> {
    await delay(90)
    return mockStore.getAIInsights()
  }

  async queryAssistant(query: string): Promise<{ answer: string; citation?: string }> {
    await delay(250) // simulate typing/search
    return mockStore.queryAssistant(query)
  }

  async getFAQList(): Promise<FAQEntry[]> {
    await delay(70)
    return mockStore.getFAQList()
  }

  async getSettings(): Promise<HostelSettings> {
    await delay(60)
    return mockStore.getSettings()
  }

  async updateSettings(updates: Partial<HostelSettings>): Promise<HostelSettings> {
    await delay(120)
    return mockStore.updateSettings(updates)
  }
}
