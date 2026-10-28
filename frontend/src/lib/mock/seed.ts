import type {
  User,
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
  ComplaintCategory,
} from '../types'

export const DEMO_USERS: User[] = [
  {
    id: 'user-all',
    name: 'Dr. Vikram Malhotra',
    email: 'demo.all@hostel.dev',
    roles: ['student', 'warden', 'admin'],
    activeRole: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98765 43210',
    department: 'Computer Science & Engineering',
    year: 4,
    studentId: 'CS2023-999',
    roomNumber: 'A-302',
    blockName: 'Block A (Newton)',
    emergencyContact: {
      name: 'Ramesh Malhotra',
      relation: 'Father',
      phone: '+91 98765 00001',
    },
  },
  {
    id: 'user-warden',
    name: 'Prof. Rajesh K. Sharma',
    email: 'demo.warden@hostel.dev',
    roles: ['student', 'warden'],
    activeRole: 'warden',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98111 22334',
    department: 'Hostel Administration',
    studentId: 'PG2024-101',
    roomNumber: 'B-101',
    blockName: 'Block B (Aryabhata)',
    emergencyContact: {
      name: 'Sunita Sharma',
      relation: 'Spouse',
      phone: '+91 98111 22335',
    },
  },
  {
    id: 'user-student',
    name: 'Aarav Patel',
    email: 'demo.student@hostel.dev',
    roles: ['student'],
    activeRole: 'student',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    phone: '+91 91234 56789',
    department: 'Information Technology',
    year: 3,
    studentId: 'IT2023-042',
    roomNumber: 'A-204',
    blockName: 'Block A (Newton)',
    emergencyContact: {
      name: 'Mukesh Patel',
      relation: 'Father',
      phone: '+91 91234 56700',
    },
  },
]

export const INITIAL_HOSTEL: Hostel = {
  id: 'hostel-1',
  name: 'Apex Residential Towers',
  code: 'APX-HOSTEL',
  gender: 'co-ed',
  totalCapacity: 360,
  occupiedCapacity: 312,
  chiefWarden: 'Prof. Rajesh K. Sharma',
  contactPhone: '+91 11 2345 6789',
  blocksCount: 4,
}

export const INITIAL_BLOCKS: Block[] = [
  {
    id: 'block-a',
    hostelId: 'hostel-1',
    name: 'Block A (Newton)',
    code: 'BLK-A',
    floorsCount: 4,
    roomsCount: 24,
    wardenId: 'user-warden',
    wardenName: 'Prof. Rajesh K. Sharma',
    capacity: 96,
    occupied: 86,
  },
  {
    id: 'block-b',
    hostelId: 'hostel-1',
    name: 'Block B (Aryabhata)',
    code: 'BLK-B',
    floorsCount: 4,
    roomsCount: 24,
    wardenId: 'warden-2',
    wardenName: 'Dr. Ananya Sen',
    capacity: 96,
    occupied: 84,
  },
  {
    id: 'block-c',
    hostelId: 'hostel-1',
    name: 'Block C (Curie)',
    code: 'BLK-C',
    floorsCount: 4,
    roomsCount: 20,
    wardenId: 'warden-3',
    wardenName: 'Dr. Meenakshi Sundaram',
    capacity: 80,
    occupied: 72,
  },
  {
    id: 'block-d',
    hostelId: 'hostel-1',
    name: 'Block D (Darwin)',
    code: 'BLK-D',
    floorsCount: 4,
    roomsCount: 22,
    wardenId: 'warden-4',
    wardenName: 'Prof. K. Venkatesh',
    capacity: 88,
    occupied: 70,
  },
]

// Generate realistic students and rooms
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Kabir', 'Rohan', 'Dhruv', 'Ananya', 'Diya', 'Gauri', 'Isha', 'Kavya',
  'Meera', 'Navya', 'Pooja', 'Riya', 'Saanvi', 'Tanvi', 'Veda', 'Zoya', 'Aditi', 'Tara',
  'Dev', 'Kunal', 'Manish', 'Nikhil', 'Pranav', 'Rahul', 'Samar', 'Tushar', 'Utkarsh', 'Yash'
]

const lastNames = [
  'Patel', 'Sharma', 'Verma', 'Gupta', 'Iyer', 'Menon', 'Reddy', 'Chopra', 'Kapoor', 'Singh',
  'Mehta', 'Nair', 'Deshmukh', 'Joshi', 'Bhat', 'Rao', 'Kulkarni', 'Bansal', 'Agarwal', 'Chatterjee'
]

const departments = [
  'Computer Science & Eng', 'Information Technology', 'Electronics & Comm',
  'Mechanical Eng', 'Civil Eng', 'Biotechnology', 'Electrical & Electronics'
]

export function generateSeedRoomsAndStudents() {
  const rooms: Room[] = []
  const students: {
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
  }[] = []

  let studentCounter = 100

  // Block A, B, C, D
  const blockDefs = [
    { id: 'block-a', name: 'Block A (Newton)', prefix: 'A' },
    { id: 'block-b', name: 'Block B (Aryabhata)', prefix: 'B' },
    { id: 'block-c', name: 'Block C (Curie)', prefix: 'C' },
    { id: 'block-d', name: 'Block D (Darwin)', prefix: 'D' },
  ]

  blockDefs.forEach((blk) => {
    for (let floor = 1; floor <= 4; floor++) {
      for (let roomIdx = 1; roomIdx <= 6; roomIdx++) {
        const roomNum = `${blk.prefix}-${floor}0${roomIdx}`
        const capacity = roomIdx % 3 === 0 ? 2 : (roomIdx % 2 === 0 ? 3 : 4)
        const isMaintenance = roomNum === 'C-203' || roomNum === 'B-404'
        const isAvailable = roomNum === 'D-405' || roomNum === 'A-106'
        
        let occupiedCount = isMaintenance ? 0 : (isAvailable ? 0 : capacity)
        if (roomNum === 'A-204') occupiedCount = 2 // Demo student room (capacity 3)

        const occupants = []
        if (!isMaintenance && !isAvailable) {
          // If demo student room
          if (roomNum === 'A-204') {
            occupants.push({
              id: 'user-student',
              name: 'Aarav Patel',
              studentId: 'IT2023-042',
              bedNumber: 'Bed-1',
              joinedDate: '2023-08-01',
              email: 'demo.student@hostel.dev',
              phone: '+91 91234 56789',
            })
            // Add roommate
            const roommate = {
              id: 'stu-roommate-1',
              name: 'Kabir Verma',
              studentId: 'CS2023-088',
              bedNumber: 'Bed-2',
              joinedDate: '2023-08-01',
              email: 'kabir.verma@hostel.dev',
              phone: '+91 98765 11223',
            }
            occupants.push(roommate)
            students.push({
              id: 'stu-roommate-1',
              name: 'Kabir Verma',
              email: 'kabir.verma@hostel.dev',
              studentId: 'CS2023-088',
              phone: '+91 98765 11223',
              department: 'Computer Science & Eng',
              year: 3,
              blockName: blk.name,
              roomNumber: roomNum,
              status: 'active',
            })
          } else {
            for (let b = 1; b <= occupiedCount; b++) {
              studentCounter++
              const fName = firstNames[(studentCounter * 7) % firstNames.length]
              const lName = lastNames[(studentCounter * 11) % lastNames.length]
              const fullName = `${fName} ${lName}`
              const sId = `STU202${(studentCounter % 4) + 1}-${String(studentCounter).padStart(3, '0')}`
              const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${studentCounter % 10}@hostel.dev`
              const phone = `+91 98${String(10000000 + studentCounter * 23).slice(0, 8)}`
              const dept = departments[studentCounter % departments.length]
              const year = (studentCounter % 4) + 1

              occupants.push({
                id: `stu-${studentCounter}`,
                name: fullName,
                studentId: sId,
                bedNumber: `Bed-${b}`,
                joinedDate: `202${4 - year}-08-01`,
                email,
                phone,
              })

              students.push({
                id: `stu-${studentCounter}`,
                name: fullName,
                email,
                studentId: sId,
                phone,
                department: dept,
                year,
                blockName: blk.name,
                roomNumber: roomNum,
                status: 'active',
              })
            }
          }
        }

        const roomStatus = isMaintenance
          ? 'maintenance'
          : occupiedCount === 0
          ? 'available'
          : occupiedCount < capacity
          ? 'partially_occupied'
          : 'occupied'

        rooms.push({
          id: `room-${blk.prefix.toLowerCase()}-${floor}0${roomIdx}`,
          blockId: blk.id,
          blockName: blk.name,
          roomNumber: roomNum,
          floor,
          capacity,
          occupiedCount,
          type: capacity === 2 ? 'double' : (capacity === 3 ? 'triple' : 'quad'),
          status: roomStatus,
          occupants,
          amenities: [
            { name: 'Ceiling Fan', condition: roomNum === 'A-204' ? 'fair' : 'good' },
            { name: 'Study Desks', condition: 'good' },
            { name: 'LAN Ports (Gigabit)', condition: roomNum === 'C-203' ? 'damaged' : 'good' },
            { name: 'Wardrobes', condition: 'good' },
            { name: 'Attached Balcony', condition: floor >= 3 ? 'good' : 'fair' },
          ],
        })
      }
    }
  })

  // Ensure demo student is in students directory
  students.unshift({
    id: 'user-student',
    name: 'Aarav Patel',
    email: 'demo.student@hostel.dev',
    studentId: 'IT2023-042',
    phone: '+91 91234 56789',
    department: 'Information Technology',
    year: 3,
    blockName: 'Block A (Newton)',
    roomNumber: 'A-204',
    status: 'active',
  })

  return { rooms, students }
}

export const INITIAL_STAFF: MaintenanceStaff[] = [
  { id: 'staff-1', name: 'Suresh Kumar', category: 'Electrical', phone: '+91 98765 12001', activeTasks: 3, rating: 4.8, available: true },
  { id: 'staff-2', name: 'Ramesh Yadav', category: 'Plumbing', phone: '+91 98765 12002', activeTasks: 4, rating: 4.6, available: true },
  { id: 'staff-3', name: 'Gopal Carpenter', category: 'Carpentry', phone: '+91 98765 12003', activeTasks: 2, rating: 4.9, available: true },
  { id: 'staff-4', name: 'Imran Khan', category: 'Internet/Wi-Fi', phone: '+91 98765 12004', activeTasks: 5, rating: 4.7, available: false },
  { id: 'staff-5', name: 'Manish Housekeeping', category: 'Cleanliness', phone: '+91 98765 12005', activeTasks: 1, rating: 4.5, available: true },
  { id: 'staff-6', name: 'Devendra Tech', category: 'Appliance', phone: '+91 98765 12006', activeTasks: 2, rating: 4.6, available: true },
]

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'comp-101',
    ticketNumber: 'CMP-2026-101',
    studentId: 'user-student',
    studentName: 'Aarav Patel',
    roomNumber: 'A-204',
    blockName: 'Block A (Newton)',
    category: 'Electrical',
    subItem: 'Ceiling Fan',
    title: 'Ceiling fan making loud clicking noise at speed 4',
    description: 'The regulator works, but when set to speed 4 or 5, the motor makes a distinct knocking vibration. Requesting bearing lubrication or replacement.',
    priority: 'medium',
    status: 'in_progress',
    assignedStaffId: 'staff-1',
    assignedStaffName: 'Suresh Kumar',
    assignedStaffContact: '+91 98765 12001',
    createdAt: '2026-09-28T09:30:00Z',
    updatedAt: '2026-09-29T11:00:00Z',
    aiConfidence: 0.94,
    aiClassified: true,
    timeline: [
      { id: 't-1', status: 'pending', note: 'Complaint logged via student portal. AI prioritized Medium.', timestamp: '2026-09-28T09:30:00Z', by: 'System AI' },
      { id: 't-2', status: 'in_progress', note: 'Warden reviewed and assigned to Electrician Suresh Kumar.', timestamp: '2026-09-29T11:00:00Z', by: 'Prof. Rajesh K. Sharma' },
    ],
    comments: [
      { id: 'c-1', senderName: 'Prof. Rajesh K. Sharma', senderRole: 'warden', message: 'Suresh will visit your room between 3 PM and 5 PM today.', timestamp: '2026-09-29T11:05:00Z' },
      { id: 'c-2', senderName: 'Aarav Patel', senderRole: 'student', message: 'Thank you, I will be present in the room.', timestamp: '2026-09-29T11:12:00Z' },
    ],
  },
  {
    id: 'comp-102',
    ticketNumber: 'CMP-2026-102',
    studentId: 'stu-roommate-1',
    studentName: 'Kabir Verma',
    roomNumber: 'A-204',
    blockName: 'Block A (Newton)',
    category: 'Internet/Wi-Fi',
    subItem: 'LAN Port',
    title: 'LAN port ethernet jack loose and frequent dropouts',
    description: 'The physical RJ45 clip in wall socket #2 does not snap securely. Connection drops whenever the cable moves slightly.',
    priority: 'low',
    status: 'pending',
    createdAt: '2026-09-29T14:15:00Z',
    updatedAt: '2026-09-29T14:15:00Z',
    aiConfidence: 0.91,
    aiClassified: true,
    timeline: [
      { id: 't-10', status: 'pending', note: 'Complaint registered. Ticket CMP-2026-102 assigned.', timestamp: '2026-09-29T14:15:00Z', by: 'System AI' },
    ],
    comments: [],
  },
  {
    id: 'comp-103',
    ticketNumber: 'CMP-2026-103',
    studentId: 'stu-102',
    studentName: 'Rohan Gupta',
    roomNumber: 'B-301',
    blockName: 'Block B (Aryabhata)',
    category: 'Electrical',
    subItem: 'Switchboard Sparks',
    title: 'Electric sparks and burning smell from 16A geyser switchboard',
    description: 'Urgent! Heavy buzzing and visible sparks when turning on the bathroom switch. We have flipped the local room MCB down as a precaution.',
    priority: 'critical',
    status: 'in_progress',
    assignedStaffId: 'staff-1',
    assignedStaffName: 'Suresh Kumar',
    assignedStaffContact: '+91 98765 12001',
    createdAt: '2026-09-30T07:10:00Z',
    updatedAt: '2026-09-30T07:25:00Z',
    aiConfidence: 0.98,
    aiClassified: true,
    timeline: [
      { id: 't-20', status: 'pending', note: 'CRITICAL alert raised by AI due to keywords "sparks" & "burning smell". SLA: 2 hours.', timestamp: '2026-09-30T07:10:00Z', by: 'System AI' },
      { id: 't-21', status: 'in_progress', note: 'Auto-dispatched emergency alert to warden and senior electrician.', timestamp: '2026-09-30T07:25:00Z', by: 'System AI' },
    ],
    comments: [
      { id: 'c-3', senderName: 'Prof. Rajesh K. Sharma', senderRole: 'warden', message: 'Do not touch the panel. Suresh is running to your floor right now.', timestamp: '2026-09-30T07:26:00Z' },
    ],
  },
  {
    id: 'comp-104',
    ticketNumber: 'CMP-2026-104',
    studentId: 'stu-110',
    studentName: 'Ananya Sen',
    roomNumber: 'C-102',
    blockName: 'Block C (Curie)',
    category: 'Plumbing',
    subItem: 'Water Leakage',
    title: 'Continuous water leakage beneath washbasin pipe',
    description: 'The PVC drain coupling underneath the basin has cracked and water is pooling across the washroom floor.',
    priority: 'high',
    status: 'resolved',
    assignedStaffId: 'staff-2',
    assignedStaffName: 'Ramesh Yadav',
    assignedStaffContact: '+91 98765 12002',
    createdAt: '2026-09-25T11:00:00Z',
    updatedAt: '2026-09-26T16:30:00Z',
    resolvedAt: '2026-09-26T16:30:00Z',
    aiConfidence: 0.95,
    aiClassified: true,
    timeline: [
      { id: 't-30', status: 'pending', note: 'Complaint logged.', timestamp: '2026-09-25T11:00:00Z', by: 'System AI' },
      { id: 't-31', status: 'in_progress', note: 'Ramesh Yadav assigned.', timestamp: '2026-09-25T13:00:00Z', by: 'Warden Sen' },
      { id: 't-32', status: 'resolved', note: 'Replaced cracked connector gasket. Tested flow, no leaks.', timestamp: '2026-09-26T16:30:00Z', by: 'Ramesh Yadav' },
    ],
    comments: [
      { id: 'c-4', senderName: 'Ananya Sen', senderRole: 'student', message: 'Fixed and verified clean. Thanks!', timestamp: '2026-09-26T17:00:00Z' },
    ],
  },
  {
    id: 'comp-105',
    ticketNumber: 'CMP-2026-105',
    studentId: 'stu-125',
    studentName: 'Pranav Joshi',
    roomNumber: 'D-304',
    blockName: 'Block D (Darwin)',
    category: 'Carpentry',
    subItem: 'Wardrobe Lock',
    title: 'Wardrobe key jammed inside lock cylinder',
    description: 'The internal tumbler mechanism failed when locking. The key is stuck and cannot be rotated or removed.',
    priority: 'medium',
    status: 'pending',
    createdAt: '2026-09-30T09:45:00Z',
    updatedAt: '2026-09-30T09:45:00Z',
    aiConfidence: 0.89,
    aiClassified: true,
    timeline: [
      { id: 't-40', status: 'pending', note: 'Complaint logged. Awaiting staff assignment.', timestamp: '2026-09-30T09:45:00Z', by: 'System AI' },
    ],
    comments: [],
  },
]

// Generate 55 more realistic complaints to satisfy 60+ requirements
const complaintTemplates: {
  cat: ComplaintCategory
  sub: string
  title: string
  desc: string
  pri: 'low' | 'medium' | 'high' | 'critical'
}[] = [
  { cat: 'Plumbing', sub: 'Shower Head', title: 'Low water pressure from overhead shower', desc: 'Calcium buildup seems to block the shower nozzles in 2nd floor bathroom.', pri: 'low' },
  { cat: 'Electrical', sub: 'Tube Light', title: 'Tube light flickering in study area', desc: 'The LED battens blink rapidly and cause eye strain during study hours.', pri: 'medium' },
  { cat: 'Internet/Wi-Fi', sub: 'Access Point', title: 'Corridor Wi-Fi access point showing blinking red', desc: 'No connectivity in rooms 201-206. Signal disappears completely.', pri: 'high' },
  { cat: 'Cleanliness', sub: 'Common Washroom', title: 'Floor drain clogged and standing water in wing B', desc: 'Water from the communal showers is not draining into the main stack.', pri: 'medium' },
  { cat: 'Carpentry', sub: 'Window Mesh', title: 'Mosquito mesh torn on sliding window', desc: 'Insects and mosquitoes entering room in the evening due to torn corner.', pri: 'low' },
  { cat: 'Appliance', sub: 'Water Cooler', title: 'Floor 3 water cooler not chilling water', desc: 'The compressor is humming continuously but outlet water is warm.', pri: 'medium' },
  { cat: 'Electrical', sub: 'Geyser', title: 'Water heater not warming up despite switch ON', desc: 'Thermostat might have tripped. Red indicator lamp remains OFF.', pri: 'high' },
  { cat: 'Plumbing', sub: 'Flush Tank', title: 'Toilet flush valve continuously running', desc: 'Water valve float stuck, leading to gallons of continuous water waste.', pri: 'medium' },
  { cat: 'Carpentry', sub: 'Study Chair', title: 'Hydraulic cylinder sinking on study chair', desc: 'Ergonomic chair drops to minimum height when sitting down.', pri: 'low' },
  { cat: 'Other', sub: 'Pest Control', title: 'Ant infestation along window ledge', desc: 'A line of ants coming through exterior brick cracks after yesterday’s rain.', pri: 'low' },
]

for (let i = 1; i <= 55; i++) {
  const tmpl = complaintTemplates[i % complaintTemplates.length]
  const blockIdx = i % 4
  const blockNames = ['Block A (Newton)', 'Block B (Aryabhata)', 'Block C (Curie)', 'Block D (Darwin)']
  const blockLetters = ['A', 'B', 'C', 'D']
  const floor = (i % 4) + 1
  const room = `${blockLetters[blockIdx]}-${floor}0${(i % 6) + 1}`
  const isResolved = i % 3 === 0
  const isInProg = i % 3 === 1
  const stat = isResolved ? 'resolved' : (isInProg ? 'in_progress' : 'pending')
  const staff = INITIAL_STAFF[i % INITIAL_STAFF.length]

  INITIAL_COMPLAINTS.push({
    id: `comp-gen-${i}`,
    ticketNumber: `CMP-2026-${110 + i}`,
    studentId: `stu-${150 + i}`,
    studentName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    roomNumber: room,
    blockName: blockNames[blockIdx],
    category: tmpl.cat,
    subItem: tmpl.sub,
    title: `${tmpl.title} (${room})`,
    description: tmpl.desc,
    priority: tmpl.pri,
    status: stat,
    assignedStaffId: stat !== 'pending' ? staff.id : undefined,
    assignedStaffName: stat !== 'pending' ? staff.name : undefined,
    assignedStaffContact: stat !== 'pending' ? staff.phone : undefined,
    createdAt: new Date(Date.now() - (60 - i) * 3600 * 1000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - (60 - i) * 3600 * 1000 * 4).toISOString(),
    resolvedAt: isResolved ? new Date(Date.now() - (60 - i) * 3600 * 1000 * 2).toISOString() : undefined,
    aiConfidence: 0.88 + (i % 10) * 0.01,
    aiClassified: true,
    timeline: [
      { id: `t-g-${i}-1`, status: 'pending', note: 'Complaint logged into queue.', timestamp: new Date(Date.now() - (60 - i) * 3600 * 1000 * 8).toISOString(), by: 'System AI' },
      ...(stat !== 'pending' ? [{ id: `t-g-${i}-2`, status: 'in_progress' as const, note: `Assigned to ${staff.name}`, timestamp: new Date(Date.now() - (60 - i) * 3600 * 1000 * 5).toISOString(), by: 'Warden' }] : []),
      ...(isResolved ? [{ id: `t-g-${i}-3`, status: 'resolved' as const, note: 'Work completed and confirmed.', timestamp: new Date(Date.now() - (60 - i) * 3600 * 1000 * 2).toISOString(), by: staff.name }] : []),
    ],
    comments: [],
  })
}

export const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'leave-1',
    studentId: 'user-student',
    studentName: 'Aarav Patel',
    roomNumber: 'A-204',
    blockName: 'Block A (Newton)',
    type: 'weekend_leave',
    startDate: '2026-10-02',
    endDate: '2026-10-04',
    reason: 'Family gathering and sister’s ring ceremony in Pune.',
    destination: '42 Lotus Enclave, Shivaji Nagar, Pune',
    parentContact: '+91 91234 56700',
    parentInformed: true,
    status: 'pending',
    createdAt: '2026-09-29T10:00:00Z',
  },
  {
    id: 'leave-2',
    studentId: 'user-student',
    studentName: 'Aarav Patel',
    roomNumber: 'A-204',
    blockName: 'Block A (Newton)',
    type: 'day_outpass',
    startDate: '2026-09-22',
    endDate: '2026-09-22',
    reason: 'Passport biometric verification appointment at PSK centre.',
    destination: 'Regional Passport Office, Camp',
    parentContact: '+91 91234 56700',
    parentInformed: true,
    status: 'approved',
    reviewedBy: 'Prof. Rajesh K. Sharma',
    reviewedAt: '2026-09-21T16:00:00Z',
    createdAt: '2026-09-21T12:00:00Z',
  },
  {
    id: 'leave-3',
    studentId: 'stu-102',
    studentName: 'Rohan Gupta',
    roomNumber: 'B-301',
    blockName: 'Block B (Aryabhata)',
    type: 'vacation',
    startDate: '2026-10-10',
    endDate: '2026-10-18',
    reason: 'Dussehra mid-term semester break vacation.',
    destination: 'Jaipur, Rajasthan',
    parentContact: '+91 98220 12345',
    parentInformed: true,
    status: 'pending',
    createdAt: '2026-09-30T08:00:00Z',
  },
  {
    id: 'leave-4',
    studentId: 'stu-110',
    studentName: 'Ananya Sen',
    roomNumber: 'C-102',
    blockName: 'Block C (Curie)',
    type: 'emergency',
    startDate: '2026-09-26',
    endDate: '2026-09-29',
    reason: 'Grandfather hospital admission.',
    destination: 'Kolkata, WB',
    parentContact: '+91 98300 45678',
    parentInformed: true,
    status: 'approved',
    reviewedBy: 'Dr. Meenakshi Sundaram',
    reviewedAt: '2026-09-26T06:30:00Z',
    createdAt: '2026-09-26T06:00:00Z',
  },
  {
    id: 'leave-5',
    studentId: 'stu-125',
    studentName: 'Pranav Joshi',
    roomNumber: 'D-304',
    blockName: 'Block D (Darwin)',
    type: 'day_outpass',
    startDate: '2026-09-27',
    endDate: '2026-09-27',
    reason: 'Casual movie outing past gate curfew hours.',
    destination: 'Phoenix Mall',
    parentContact: '+91 98199 87654',
    parentInformed: false,
    status: 'rejected',
    rejectionReason: 'Parent consent was not confirmed via call and purpose falls outside allowed late curfew permissions.',
    reviewedBy: 'Prof. K. Venkatesh',
    reviewedAt: '2026-09-27T11:00:00Z',
    createdAt: '2026-09-27T09:30:00Z',
  },
]

export const INITIAL_MESS_FEEDBACK: MessFeedback[] = [
  {
    id: 'mf-1',
    studentId: 'user-student',
    studentName: 'Aarav Patel',
    date: '2026-09-30',
    mealType: 'breakfast',
    rating: 4,
    category: 'taste',
    comment: 'Poha and sambar were fresh and hot. Chutney consistency was very good today.',
    sentiment: 'positive',
    createdAt: '2026-09-30T09:15:00Z',
  },
  {
    id: 'mf-2',
    studentId: 'stu-102',
    studentName: 'Rohan Gupta',
    date: '2026-09-29',
    mealType: 'dinner',
    rating: 2,
    category: 'food_quality',
    comment: 'Paneer gravy had way too much food coloring and was excessively salty. Rice was undercooked.',
    sentiment: 'negative',
    createdAt: '2026-09-29T21:30:00Z',
  },
  {
    id: 'mf-3',
    studentId: 'stu-110',
    studentName: 'Ananya Sen',
    date: '2026-09-29',
    mealType: 'lunch',
    rating: 4,
    category: 'variety',
    comment: 'Great seasonal salad spread and curd was fresh. Rotis served warm at counter.',
    sentiment: 'positive',
    createdAt: '2026-09-29T13:45:00Z',
  },
  {
    id: 'mf-4',
    studentId: 'stu-125',
    studentName: 'Pranav Joshi',
    date: '2026-09-28',
    mealType: 'snacks',
    rating: 3,
    category: 'service',
    comment: 'Tea was cold by 5:15 PM and samosas ran out within 20 minutes.',
    sentiment: 'neutral',
    createdAt: '2026-09-28T17:40:00Z',
  },
  {
    id: 'mf-5',
    studentId: 'stu-130',
    studentName: 'Gauri Iyer',
    date: '2026-09-28',
    mealType: 'dinner',
    rating: 5,
    category: 'taste',
    comment: 'Wednesday special Dal Makhani and Jeera Rice was delicious! Best meal of the week.',
    sentiment: 'positive',
    createdAt: '2026-09-28T21:10:00Z',
  },
]

export const INITIAL_ANNOUNCEMENTS: Announcement[] = []

export const INITIAL_NOTIFICATIONS: Notification[] = []

export const INITIAL_INSIGHTS: AIInsight[] = [
  {
    id: 'ai-1',
    title: 'Predictive Alert: 3rd Floor Block B Geysers',
    description: '4 electrical geyser thermostat faults reported in Block B within 14 days. Analysis indicates potential voltage spikes on Phase 2 busbar.',
    type: 'prediction',
    metric: '4x Failure Frequency',
    timestamp: '2026-09-30T06:00:00Z',
  },
  {
    id: 'ai-2',
    title: 'Mess Sentiment Dip: Tuesday Dinners',
    description: 'Negative sentiment in mess reviews spiked 42% on Tuesday dinners over the last 3 weeks, primarily citing salt imbalance and undercooked lentils.',
    type: 'anomaly',
    metric: '71% Negative Sentiment',
    timestamp: '2026-09-29T18:00:00Z',
  },
  {
    id: 'ai-3',
    title: 'Leave Demand Surge Forecast',
    description: 'Anticipated 65% occupancy dip over the upcoming long weekend (Oct 2 - Oct 5). Recommend adjusting catering volumes to minimize mess food waste.',
    type: 'recommendation',
    metric: '~180 Students Departing',
    timestamp: '2026-09-28T12:00:00Z',
  },
]

export const INITIAL_FAQ: FAQEntry[] = [
  {
    id: 'faq-1',
    question: 'What are the main hostel gate timings and curfew rules?',
    answer: 'The hostel gates open daily at 6:00 AM and close strictly at 10:00 PM. Any entry after 10:00 PM requires an approved Day Outpass or emergency clearance signed by your Block Warden.',
    category: 'Hostel Rules & Timings',
    source: 'Hostel Handbook 2026, Section 2.1 (Gate Regulations)',
  },
  {
    id: 'faq-2',
    question: 'How do I apply for a weekend leave or outpass?',
    answer: 'Navigate to "Leave / Outpass" in your student portal. Submit your request at least 24 hours prior to departure, providing your destination address and verified parent contact number.',
    category: 'Leave Rules',
    source: 'Student Leave Policy, Section 4.3',
  },
  {
    id: 'faq-3',
    question: 'What is the average resolution time for room complaints?',
    answer: 'Complaints are triaged by AI into 4 SLA tiers: Critical (sparks, gas, major leaks) is handled within 2 hours; High priority within 12 hours; Medium priority within 24-48 hours; and Low priority within 72 hours.',
    category: 'Maintenance & Complaints',
    source: 'Maintenance Service Level Agreement (SLA) Matrix',
  },
  {
    id: 'faq-4',
    question: 'What items and appliances are strictly prohibited in hostel rooms?',
    answer: 'High-wattage heating coils, immersion water heaters, induction cookers, air conditioners, pets, and hazardous materials are strictly prohibited. Laptops, desktop monitors, mobile chargers, and electric kettles (up to 500W) are permitted.',
    category: 'Safety & Equipment',
    source: 'Safety Code of Conduct, Rule 8',
  },
  {
    id: 'faq-5',
    question: 'What are the hostel mess timings for meals?',
    answer: 'Breakfast: 7:30 AM - 9:30 AM | Lunch: 12:30 PM - 2:30 PM | Evening Snacks: 4:30 PM - 5:45 PM | Dinner: 7:45 PM - 9:45 PM. Timings are extended by 30 minutes on Sundays.',
    category: 'Dining & Mess',
    source: 'Catering Operations Schedule 2026',
  },
  {
    id: 'faq-6',
    question: 'How do guest stays or parents visiting work?',
    answer: 'Parents and immediate family can visit between 4:00 PM and 7:00 PM in the central reception lounge. Overnight stays for male guests in girls blocks or female guests in boys blocks are not permitted under any circumstances.',
    category: 'Visitors',
    source: 'Visitor Regulations, Section 3',
  },
]

export const INITIAL_SETTINGS: HostelSettings = {
  hostelName: 'Apex Residential Towers',
  chiefWarden: 'Prof. Rajesh K. Sharma',
  contactEmail: 'administration@hostel.dev',
  contactPhone: '+91 11 2345 6789',
  gateOpeningTime: '06:00 AM',
  gateClosingTime: '10:00 PM',
  nightCurfewTime: '10:30 PM',
  guestVisitingHours: '04:00 PM - 07:00 PM',
  complaintSlaHours: {
    critical: 2,
    high: 12,
    medium: 48,
    low: 72,
  },
}
