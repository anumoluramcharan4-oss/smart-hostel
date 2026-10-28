import {
  DEMO_USERS,
  INITIAL_HOSTEL,
  INITIAL_BLOCKS,
  INITIAL_STAFF,
  INITIAL_COMPLAINTS,
  INITIAL_LEAVES,
  INITIAL_MESS_FEEDBACK,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_INSIGHTS,
  INITIAL_FAQ,
  INITIAL_SETTINGS,
  generateSeedRoomsAndStudents,
} from './seed'
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

// In-Memory mutable storage
const { rooms: seedRooms, students: seedStudents } = generateSeedRoomsAndStudents()

let users: User[] = [...DEMO_USERS]
let hostel: Hostel = { ...INITIAL_HOSTEL }
let blocks: Block[] = [...INITIAL_BLOCKS]
let rooms: Room[] = [...seedRooms]
let students = [...seedStudents]
let staff: MaintenanceStaff[] = [...INITIAL_STAFF]
let complaints: Complaint[] = [...INITIAL_COMPLAINTS]
let leaveRequests: LeaveRequest[] = [...INITIAL_LEAVES]
let messFeedback: MessFeedback[] = [...INITIAL_MESS_FEEDBACK]
let announcements: Announcement[] = [...INITIAL_ANNOUNCEMENTS]
let notifications: Notification[] = [...INITIAL_NOTIFICATIONS]
const insights: AIInsight[] = [...INITIAL_INSIGHTS]
const faqList: FAQEntry[] = [...INITIAL_FAQ]
let settings: HostelSettings = { ...INITIAL_SETTINGS }

// Active simulated user
let currentUser: User = users[0] // Default to Dr. Vikram Malhotra (admin)

export const mockStore = {
  // Auth & Roles
  getCurrentUser: (): User => ({ ...currentUser }),
  setCurrentUser: (user: User) => {
    currentUser = { ...user }
    const idx = users.findIndex((u) => u.id === user.id)
    if (idx !== -1) users[idx] = { ...user }
  },
  login: (email: string): User | null => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (user) {
      currentUser = { ...user }
      return { ...currentUser }
    }
    return null
  },
  switchRole: (newRole: Role): User => {
    if (!currentUser.roles.includes(newRole)) {
      throw new Error(`Unauthorized: User does not have access to '${newRole}' role.`)
    }
    currentUser = { ...currentUser, activeRole: newRole }
    const idx = users.findIndex((u) => u.id === currentUser.id)
    if (idx !== -1) users[idx] = { ...currentUser }
    return { ...currentUser }
  },

  // Hostel & Blocks
  getHostel: (): Hostel => ({ ...hostel }),
  updateHostel: (updates: Partial<Hostel>): Hostel => {
    hostel = { ...hostel, ...updates }
    return { ...hostel }
  },
  getBlocks: (): Block[] => [...blocks],
  updateBlock: (blockId: string, updates: Partial<Block>): Block => {
    const idx = blocks.findIndex((b) => b.id === blockId)
    if (idx !== -1) {
      blocks[idx] = { ...blocks[idx], ...updates }
      return { ...blocks[idx] }
    }
    throw new Error('Block not found')
  },

  // Rooms
  getRooms: (blockId?: string): Room[] => {
    if (blockId) return rooms.filter((r) => r.blockId === blockId)
    return [...rooms]
  },
  getRoomByNumber: (roomNumber: string): Room | undefined => {
    return rooms.find((r) => r.roomNumber.toLowerCase() === roomNumber.toLowerCase())
  },
  updateRoomStatus: (roomId: string, status: Room['status']): Room => {
    const idx = rooms.findIndex((r) => r.id === roomId)
    if (idx !== -1) {
      rooms[idx] = { ...rooms[idx], status }
      return { ...rooms[idx] }
    }
    throw new Error('Room not found')
  },

  // Students
  getStudents: (params?: { search?: string; block?: string; year?: number }) => {
    let result = [...students]
    if (params?.search) {
      const q = params.search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.roomNumber.toLowerCase().includes(q)
      )
    }
    if (params?.block) {
      result = result.filter((s) => s.blockName.toLowerCase().includes(params.block!.toLowerCase()))
    }
    if (params?.year) {
      result = result.filter((s) => s.year === params.year)
    }
    return result
  },

  // Wardens
  getWardens: () => {
    return [
      {
        id: 'user-warden',
        name: 'Prof. Rajesh K. Sharma',
        email: 'demo.warden@hostel.dev',
        phone: '+91 98111 22334',
        blockAssigned: 'Block A (Newton) & Block B (Aryabhata)',
        experienceYears: 12,
        office: 'Admin Wing, Room 102',
      },
      {
        id: 'warden-2',
        name: 'Dr. Ananya Sen',
        email: 'ananya.sen@hostel.dev',
        phone: '+91 98222 33445',
        blockAssigned: 'Block B (Aryabhata)',
        experienceYears: 8,
        office: 'Block B Ground Floor',
      },
      {
        id: 'warden-3',
        name: 'Dr. Meenakshi Sundaram',
        email: 'meenakshi.s@hostel.dev',
        phone: '+91 98333 44556',
        blockAssigned: 'Block C (Curie)',
        experienceYears: 15,
        office: 'Block C Office 1',
      },
      {
        id: 'warden-4',
        name: 'Prof. K. Venkatesh',
        email: 'k.venkatesh@hostel.dev',
        phone: '+91 98444 55667',
        blockAssigned: 'Block D (Darwin)',
        experienceYears: 6,
        office: 'Block D Office 2',
      },
    ]
  },

  // Users Directory
  getAllUsers: (): User[] => [...users],

  // Maintenance Staff
  getStaff: (): MaintenanceStaff[] => [...staff],

  // Complaints
  getComplaints: (filters?: {
    studentId?: string
    status?: ComplaintStatus
    priority?: ComplaintPriority
    category?: ComplaintCategory
    search?: string
  }): Complaint[] => {
    let list = [...complaints]
    if (filters?.studentId) {
      list = list.filter((c) => c.studentId === filters.studentId)
    }
    if (filters?.status) {
      list = list.filter((c) => c.status === filters.status)
    }
    if (filters?.priority) {
      list = list.filter((c) => c.priority === filters.priority)
    }
    if (filters?.category) {
      list = list.filter((c) => c.category === filters.category)
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.ticketNumber.toLowerCase().includes(q) ||
          c.roomNumber.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getComplaintById: (id: string): Complaint | undefined => {
    return complaints.find((c) => c.id === id)
  },

  createComplaint: (data: {
    category: ComplaintCategory
    subItem: string
    title: string
    description: string
    priority?: ComplaintPriority
    photoUrl?: string
  }): Complaint => {
    // Simulated AI Auto-Triage
    let autoPriority: ComplaintPriority = data.priority || 'medium'
    const textLower = `${data.title} ${data.description}`.toLowerCase()
    if (textLower.includes('spark') || textLower.includes('shock') || textLower.includes('smoke') || textLower.includes('burning') || textLower.includes('fire')) {
      autoPriority = 'critical'
    } else if (textLower.includes('leak') || textLower.includes('geyser') || textLower.includes('wifi down') || textLower.includes('no water')) {
      autoPriority = 'high'
    } else if (textLower.includes('mesh') || textLower.includes('light') || textLower.includes('chair') || textLower.includes('paint')) {
      autoPriority = 'low'
    }

    const ticketNumber = `CMP-2026-${Math.floor(200 + Math.random() * 800)}`
    const newComplaint: Complaint = {
      id: `comp-${Date.now()}`,
      ticketNumber,
      studentId: currentUser.id,
      studentName: currentUser.name,
      roomNumber: currentUser.roomNumber || 'A-204',
      blockName: currentUser.blockName || 'Block A (Newton)',
      category: data.category,
      subItem: data.subItem,
      title: data.title,
      description: data.description,
      priority: autoPriority,
      status: 'pending',
      photoUrl: data.photoUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiConfidence: 0.96,
      aiClassified: true,
      timeline: [
        {
          id: `t-${Date.now()}`,
          status: 'pending',
          note: `Complaint registered. AI triaged as ${autoPriority.toUpperCase()} priority (${data.category}).`,
          timestamp: new Date().toISOString(),
          by: 'Smart Hostel AI Engine',
        },
      ],
      comments: [],
    }

    complaints.unshift(newComplaint)

    // Add alert notification for warden
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: 'user-warden',
      title: `${autoPriority.toUpperCase()} Complaint: ${newComplaint.ticketNumber}`,
      message: `${currentUser.name} (${currentUser.roomNumber}): ${data.title}`,
      type: 'complaint',
      link: '/warden/complaints',
      read: false,
      createdAt: new Date().toISOString(),
    })

    return newComplaint
  },

  updateComplaintStatus: (
    complaintId: string,
    status: ComplaintStatus,
    note?: string
  ): Complaint => {
    const idx = complaints.findIndex((c) => c.id === complaintId)
    if (idx === -1) throw new Error('Complaint not found')

    const c = complaints[idx]
    const updated: Complaint = {
      ...c,
      status,
      updatedAt: new Date().toISOString(),
      resolvedAt: status === 'resolved' || status === 'closed' ? new Date().toISOString() : c.resolvedAt,
      timeline: [
        ...c.timeline,
        {
          id: `t-${Date.now()}`,
          status,
          note: note || `Status updated to ${status.replace('_', ' ')}`,
          timestamp: new Date().toISOString(),
          by: currentUser.name,
        },
      ],
    }
    complaints[idx] = updated

    // Notify student
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: updated.studentId,
      title: `Complaint Status Updated: ${updated.ticketNumber}`,
      message: `Your complaint is now ${status.replace('_', ' ')}.`,
      type: 'complaint',
      link: '/student/complaints',
      read: false,
      createdAt: new Date().toISOString(),
    })

    return updated
  },

  assignStaffToComplaint: (complaintId: string, staffId: string): Complaint => {
    const idx = complaints.findIndex((c) => c.id === complaintId)
    if (idx === -1) throw new Error('Complaint not found')
    const staffMember = staff.find((s) => s.id === staffId)
    if (!staffMember) throw new Error('Staff member not found')

    const c = complaints[idx]
    const updated: Complaint = {
      ...c,
      status: 'in_progress',
      assignedStaffId: staffMember.id,
      assignedStaffName: staffMember.name,
      assignedStaffContact: staffMember.phone,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...c.timeline,
        {
          id: `t-${Date.now()}`,
          status: 'in_progress',
          note: `Assigned to ${staffMember.name} (${staffMember.phone})`,
          timestamp: new Date().toISOString(),
          by: currentUser.name,
        },
      ],
    }
    complaints[idx] = updated
    return updated
  },

  addComplaintComment: (complaintId: string, message: string): Complaint => {
    const idx = complaints.findIndex((c) => c.id === complaintId)
    if (idx === -1) throw new Error('Complaint not found')

    const c = complaints[idx]
    const comment = {
      id: `comm-${Date.now()}`,
      senderName: currentUser.name,
      senderRole: currentUser.activeRole,
      message,
      timestamp: new Date().toISOString(),
    }
    const updated: Complaint = {
      ...c,
      comments: [...c.comments, comment],
      updatedAt: new Date().toISOString(),
    }
    complaints[idx] = updated
    return updated
  },

  overridePriority: (complaintId: string, priority: ComplaintPriority, reason: string): Complaint => {
    const idx = complaints.findIndex((c) => c.id === complaintId)
    if (idx === -1) throw new Error('Complaint not found')

    const c = complaints[idx]
    const updated: Complaint = {
      ...c,
      priority,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...c.timeline,
        {
          id: `t-${Date.now()}`,
          status: c.status,
          note: `Priority overridden from ${c.priority} to ${priority}. Reason: ${reason}`,
          timestamp: new Date().toISOString(),
          by: currentUser.name,
        },
      ],
    }
    complaints[idx] = updated
    return updated
  },

  // Leave Requests
  getLeaves: (studentId?: string): LeaveRequest[] => {
    if (studentId) return leaveRequests.filter((l) => l.studentId === studentId)
    return [...leaveRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  createLeave: (data: Omit<LeaveRequest, 'id' | 'studentId' | 'studentName' | 'roomNumber' | 'blockName' | 'status' | 'createdAt'>): LeaveRequest => {
    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      roomNumber: currentUser.roomNumber || 'A-204',
      blockName: currentUser.blockName || 'Block A (Newton)',
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      destination: data.destination,
      parentContact: data.parentContact,
      parentInformed: data.parentInformed,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    leaveRequests.unshift(newLeave)

    // Notify warden
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: 'user-warden',
      title: 'New Leave / Outpass Request',
      message: `${currentUser.name} applied for ${data.type.replace('_', ' ')} (${data.startDate} to ${data.endDate}).`,
      type: 'leave',
      link: '/warden/leave',
      read: false,
      createdAt: new Date().toISOString(),
    })

    return newLeave
  },

  reviewLeave: (leaveId: string, status: 'approved' | 'rejected', reason?: string): LeaveRequest => {
    const idx = leaveRequests.findIndex((l) => l.id === leaveId)
    if (idx === -1) throw new Error('Leave request not found')

    const l = leaveRequests[idx]
    const updated: LeaveRequest = {
      ...l,
      status,
      rejectionReason: status === 'rejected' ? reason : undefined,
      reviewedBy: currentUser.name,
      reviewedAt: new Date().toISOString(),
    }
    leaveRequests[idx] = updated

    // Notify student
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: updated.studentId,
      title: `Leave Request ${status.toUpperCase()}`,
      message: `Your leave request for ${updated.startDate} has been ${status}${reason ? ': ' + reason : '.'}`,
      type: 'leave',
      link: '/student/leave',
      read: false,
      createdAt: new Date().toISOString(),
    })

    return updated
  },

  // Mess Feedback
  getMessFeedback: (): MessFeedback[] => {
    return [...messFeedback].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  createMessFeedback: (data: Omit<MessFeedback, 'id' | 'studentId' | 'studentName' | 'sentiment' | 'createdAt'>): MessFeedback => {
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
    if (data.rating >= 4) sentiment = 'positive'
    else if (data.rating <= 2) sentiment = 'negative'

    const newFeedback: MessFeedback = {
      id: `mf-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      date: data.date,
      mealType: data.mealType,
      rating: data.rating,
      category: data.category,
      comment: data.comment,
      sentiment,
      createdAt: new Date().toISOString(),
    }
    messFeedback.unshift(newFeedback)
    return newFeedback
  },

  // Announcements
  getAnnouncements: (): Announcement[] => {
    return [...announcements].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  },

  createAnnouncement: (data: Omit<Announcement, 'id' | 'authorName' | 'authorRole' | 'createdAt'>): Announcement => {
    const item: Announcement = {
      id: `ann-${Date.now()}`,
      ...data,
      authorName: currentUser.name,
      authorRole: currentUser.activeRole,
      createdAt: new Date().toISOString(),
    }
    announcements.unshift(item)

    // Notify students
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: 'user-student',
      title: `Hostel Notice: ${item.title}`,
      message: item.content.slice(0, 80) + '...',
      type: 'announcement',
      link: '/student/announcements',
      read: false,
      createdAt: new Date().toISOString(),
    })

    return item
  },

  togglePinAnnouncement: (id: string): Announcement => {
    const idx = announcements.findIndex((a) => a.id === id)
    if (idx === -1) throw new Error('Announcement not found')
    announcements[idx] = { ...announcements[idx], isPinned: !announcements[idx].isPinned }
    return announcements[idx]
  },

  deleteAnnouncement: (id: string) => {
    announcements = announcements.filter((a) => a.id !== id)
  },

  // Notifications
  getNotifications: (userId?: string): Notification[] => {
    const uid = userId || currentUser.id
    return notifications
      .filter((n) => n.userId === uid || n.userId === 'user-all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  markNotificationRead: (id: string) => {
    const n = notifications.find((item) => item.id === id)
    if (n) n.read = true
  },

  markAllNotificationsRead: (userId?: string) => {
    const uid = userId || currentUser.id
    notifications.forEach((n) => {
      if (n.userId === uid || n.userId === 'user-all') n.read = true
    })
  },

  // AI Insights
  getAIInsights: (): AIInsight[] => [...insights],

  // AI Hostel Assistant FAQ / Knowledge base
  queryAssistant: (query: string): { answer: string; citation?: string } => {
    const qLower = query.toLowerCase()
    
    // Stop words to ignore
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'what', 'are', 'how', 'can', 'into', 'from',
      'this', 'that', 'where', 'when', 'does', 'your', 'about', 'have', 'room',
      'hostel', 'please', 'tell', 'about', 'some', 'there', 'they', 'will', 'would',
      'bring', 'take', 'make', 'just'
    ])

    // Find best match in FAQ
    let bestMatch: FAQEntry | null = null
    let maxMatchWords = 0

    const words = qLower
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w))

    if (words.length > 0) {
      for (const faq of faqList) {
        let matches = 0
        const targetText = `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase()
        for (const word of words) {
          if (targetText.includes(word)) matches++
        }
        if (matches > maxMatchWords) {
          maxMatchWords = matches
          bestMatch = faq
        }
      }
    }

    if (bestMatch && maxMatchWords >= 1) {
      return {
        answer: bestMatch.answer,
        citation: bestMatch.source,
      }
    }

    // Default polite safe fallback
    return {
      answer: "I don't know, please contact the warden or the hostel administration office for assistance with this inquiry.",
      citation: 'Hostel Administration Central Helpdesk (Ext: 101)',
    }
  },

  getFAQList: (): FAQEntry[] => [...faqList],

  // Settings
  getSettings: (): HostelSettings => ({ ...settings }),
  updateSettings: (updates: Partial<HostelSettings>): HostelSettings => {
    settings = { ...settings, ...updates }
    return { ...settings }
  },
}
