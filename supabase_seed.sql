-- ========================================================
-- SMART HOSTEL COMPLETE DATABASE SCHEMA & IDEMPOTENT SEED SCRIPT
-- Single Transaction Seed for 1 Building (Block A), 5 Floors,
-- 30 Rooms, 120 Beds, 120 100% Allocated Indian Male Students.
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table Definitions
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'warden', 'admin')),
  avatar_url TEXT,
  room_number TEXT,
  block_name TEXT,
  bed_number TEXT,
  roll_no TEXT,
  course TEXT,
  year INT,
  guardian_name TEXT,
  guardian_phone TEXT,
  fee_status TEXT DEFAULT 'paid',
  fee_amount_due NUMERIC DEFAULT 0,
  attendance_percent NUMERIC DEFAULT 95,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blocks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  floors_count INT DEFAULT 5,
  rooms_count INT DEFAULT 30,
  capacity INT DEFAULT 120,
  occupied INT DEFAULT 120,
  warden_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  block_id TEXT REFERENCES public.blocks(id) ON DELETE SET NULL,
  block_name TEXT,
  floor INT DEFAULT 1,
  type TEXT DEFAULT 'quad',
  capacity INT DEFAULT 4,
  occupied INT DEFAULT 4,
  status TEXT DEFAULT 'occupied',
  amenities JSONB DEFAULT '[]'::jsonb,
  occupants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  room_number TEXT NOT NULL,
  bed_number TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  allocated_at TIMESTAMPTZ DEFAULT NOW(),
  deallocated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wardens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  assigned_block_id TEXT REFERENCES public.blocks(id) ON DELETE SET NULL,
  assigned_block_name TEXT,
  designation TEXT,
  status TEXT DEFAULT 'on_duty',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  student_id TEXT,
  student_name TEXT,
  room_number TEXT,
  block_name TEXT,
  assigned_to TEXT,
  resolution_notes TEXT,
  student_approved BOOLEAN DEFAULT FALSE,
  student_approval_note TEXT,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DB-Level Unique Constraints:
-- 1. One bed can hold only one active student
CREATE UNIQUE INDEX IF NOT EXISTS idx_allocations_active_bed 
ON public.allocations (room_number, bed_number) 
WHERE is_active = TRUE;

-- 2. One student can have only one active allocation
CREATE UNIQUE INDEX IF NOT EXISTS idx_allocations_active_student 
ON public.allocations (student_id) 
WHERE is_active = TRUE;

-- 3. Profile active bed unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_active_bed 
ON public.profiles (room_number, bed_number) 
WHERE room_number IS NOT NULL AND bed_number IS NOT NULL AND role = 'student';

-- ========================================================
-- SINGLE TRANSACTION IDEMPOTENT WIPE & SEED
-- ========================================================
BEGIN;

-- 1. Wipe Dummy Allocations & Students (KEEP Admin, Warden, Config/Settings)
DELETE FROM public.allocations;
DELETE FROM public.profiles WHERE role = 'student';
DELETE FROM public.rooms;
DELETE FROM public.blocks WHERE id <> 'blk-a';

-- 2. Ensure Admin & Warden Profiles Exist
INSERT INTO public.profiles (id, full_name, email, phone, role, avatar_url, course) VALUES
('usr-admin-1', 'Sarah Jenkins', 'sarah.jenkins@hostelos.edu', '+91 98765 43210', 'admin', 'https://api.dicebear.com/9.x/initials/svg?seed=Sarah%20Jenkins&backgroundColor=0284c7&textColor=ffffff', 'Chief Administrator'),
('usr-warden-1', 'Prof. Rajesh K. Sharma', 'rajesh.sharma@hostelos.edu', '+91 98111 22334', 'warden', 'https://api.dicebear.com/9.x/initials/svg?seed=Rajesh%20Sharma&backgroundColor=0284c7&textColor=ffffff', 'Senior Resident Warden')
ON CONFLICT (id) DO UPDATE SET 
  full_name=EXCLUDED.full_name, email=EXCLUDED.email, role=EXCLUDED.role;

-- 3. Seed Building Block A (Newton) - 5 Floors, 30 Rooms, 120 Capacity, 120 Occupied
INSERT INTO public.blocks (id, name, code, floors_count, rooms_count, capacity, occupied, warden_name) VALUES
('blk-a', 'Block A (Newton)', 'BLK-A', 5, 30, 120, 120, 'Prof. Rajesh K. Sharma')
ON CONFLICT (id) DO UPDATE SET 
  name=EXCLUDED.name, code=EXCLUDED.code, floors_count=EXCLUDED.floors_count, rooms_count=EXCLUDED.rooms_count, capacity=EXCLUDED.capacity, occupied=EXCLUDED.occupied, warden_name=EXCLUDED.warden_name;

INSERT INTO public.wardens (id, name, email, phone, assigned_block_id, assigned_block_name, designation, status, avatar_url) VALUES
('wrd-1', 'Prof. Rajesh K. Sharma', 'rajesh.sharma@hostelos.edu', '+91 98111 22334', 'blk-a', 'Block A (Newton)', 'Senior Resident Warden', 'on_duty', 'https://api.dicebear.com/9.x/initials/svg?seed=Rajesh%20Sharma&backgroundColor=0284c7&textColor=ffffff')
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, email=EXCLUDED.email, phone=EXCLUDED.phone, assigned_block_id=EXCLUDED.assigned_block_id, assigned_block_name=EXCLUDED.assigned_block_name;

-- 4. Seed 30 Rooms (6 per floor, 5 floors, quad occupancy)
INSERT INTO public.rooms (id, number, block_id, block_name, floor, type, capacity, occupied, status, amenities, occupants) VALUES
('rm-a-101', 'A-101', 'blk-a', 'Block A (Newton)', 1, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "usr-student-1", "name": "Aarav Patel", "rollNo": "21BCS001", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Aarav%20Sharma&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-2", "name": "Rohan Verma", "rollNo": "21BCS002", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Rohan%20Verma&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-3", "name": "Aditya Mishra", "rollNo": "21BCS003", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Aditya%20Mishra&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-4", "name": "Vivaan Tiwari", "rollNo": "21BCS004", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vivaan%20Tiwari&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-102', 'A-102', 'blk-a', 'Block A (Newton)', 1, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-5", "name": "Harsh Chauhan", "rollNo": "21BCS005", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Harsh%20Chauhan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-6", "name": "Kabir Bhatia", "rollNo": "21BCS006", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kabir%20Bhatia&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-7", "name": "Ayush Saxena", "rollNo": "21BCS007", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ayush%20Saxena&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-8", "name": "Kunal Kapoor", "rollNo": "21BCS008", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kunal%20Kapoor&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-103', 'A-103', 'blk-a', 'Block A (Newton)', 1, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-9", "name": "Mohit Gupta", "rollNo": "21BCS009", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Mohit%20Gupta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-10", "name": "Rahul Malhotra", "rollNo": "21BCS010", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Rahul%20Malhotra&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-11", "name": "Deepak Pandey", "rollNo": "21BCS011", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Deepak%20Pandey&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-12", "name": "Sanjay Shukla", "rollNo": "21BCS012", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sanjay%20Shukla&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-104', 'A-104', 'blk-a', 'Block A (Newton)', 1, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-13", "name": "Alok Yadav", "rollNo": "21BCS013", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Alok%20Yadav&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-14", "name": "Rajeev Singh", "rollNo": "21BCS014", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Rajeev%20Singh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-15", "name": "Naveen Rathore", "rollNo": "21BCS015", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Naveen%20Rathore&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-16", "name": "Vikas Nair", "rollNo": "21BCS016", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vikas%20Nair&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-105', 'A-105', 'blk-a', 'Block A (Newton)', 1, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-17", "name": "Abhishek Subramanian", "rollNo": "21BCS017", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Abhishek%20Subramanian&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-18", "name": "Gautam Iyer", "rollNo": "21BCS018", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Gautam%20Iyer&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-19", "name": "Neeraj Murthy", "rollNo": "21BCS019", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Neeraj%20Murthy&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-20", "name": "Tarun Reddy", "rollNo": "21BCS020", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Tarun%20Reddy&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-106', 'A-106', 'blk-a', 'Block A (Newton)', 1, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-21", "name": "Ankit Menon", "rollNo": "21BCS021", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ankit%20Menon&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-22", "name": "Sourabh Venkatesh", "rollNo": "21BCS022", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sourabh%20Venkatesh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-23", "name": "Mayank Swaminathan", "rollNo": "21BCS023", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Mayank%20Swaminathan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-24", "name": "Harshit Pillai", "rollNo": "21BCS024", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Harshit%20Pillai&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-201', 'A-201', 'blk-a', 'Block A (Newton)', 2, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-25", "name": "Utkarsh Rao", "rollNo": "21BCS025", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Utkarsh%20Rao&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-26", "name": "Kartik Nambiar", "rollNo": "21BCS026", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kartik%20Nambiar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-27", "name": "Lokesh Balaji", "rollNo": "21BCS027", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Lokesh%20Balaji&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-28", "name": "Raghav Krishnan", "rollNo": "21BCS028", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Raghav%20Krishnan&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-202', 'A-202', 'blk-a', 'Block A (Newton)', 2, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-29", "name": "Shubham Naidu", "rollNo": "21BCS029", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Shubham%20Naidu&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-30", "name": "Uday Shetty", "rollNo": "21BCS030", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Uday%20Shetty&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-31", "name": "Siddharth Banerjee", "rollNo": "21BCS031", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Siddharth%20Banerjee&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-32", "name": "Vignesh Mukherjee", "rollNo": "21BCS032", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vignesh%20Mukherjee&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-203', 'A-203', 'blk-a', 'Block A (Newton)', 2, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-33", "name": "Karthik Chatterjee", "rollNo": "21BCS033", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Karthik%20Chatterjee&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-34", "name": "Pranav Roy", "rollNo": "21BCS034", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Pranav%20Roy&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-35", "name": "Sai Sengupta", "rollNo": "21BCS035", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sai%20Sengupta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-36", "name": "Ashwin Das", "rollNo": "21BCS036", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ashwin%20Das&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-204', 'A-204', 'blk-a', 'Block A (Newton)', 2, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-37", "name": "Balakrishnan Dutta", "rollNo": "21BCS037", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Balakrishnan%20Dutta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-38", "name": "Dhanush Ghosh", "rollNo": "21BCS038", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Dhanush%20Ghosh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-39", "name": "Arvind Bhattacharya", "rollNo": "21BCS039", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Arvind%20Bhattacharya&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-40", "name": "Surya Bose", "rollNo": "21BCS040", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Surya%20Bose&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-205', 'A-205', 'blk-a', 'Block A (Newton)', 2, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-41", "name": "Manoj Majumdar", "rollNo": "21BCS041", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Manoj%20Majumdar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-42", "name": "Praveen Chakraborty", "rollNo": "21BCS042", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Praveen%20Chakraborty&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-43", "name": "Suresh Ganguly", "rollNo": "21BCS043", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Suresh%20Ganguly&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-44", "name": "Ramesh Mitra", "rollNo": "21BCS044", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ramesh%20Mitra&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-206', 'A-206', 'blk-a', 'Block A (Newton)', 2, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-45", "name": "Ganesh Saha", "rollNo": "21BCS045", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ganesh%20Saha&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-46", "name": "Venkat Patel", "rollNo": "21BCS046", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Venkat%20Patel&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-47", "name": "Hari Dixit", "rollNo": "21BCS047", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Hari%20Dixit&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-48", "name": "Vijay Mehta", "rollNo": "21BCS048", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vijay%20Mehta&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-301', 'A-301', 'blk-a', 'Block A (Newton)', 3, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-49", "name": "Kishore Shah", "rollNo": "21BCS049", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kishore%20Shah&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-50", "name": "Anand Kulkarni", "rollNo": "21BCS050", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Anand%20Kulkarni&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-51", "name": "Madhav Joshi", "rollNo": "21BCS051", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Madhav%20Joshi&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-52", "name": "Sriram Deshmukh", "rollNo": "21BCS052", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sriram%20Deshmukh&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-302', 'A-302', 'blk-a', 'Block A (Newton)', 3, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-53", "name": "Varun Marathe", "rollNo": "21BCS053", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Varun%20Marathe&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-54", "name": "Nikhil Pawar", "rollNo": "21BCS054", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Nikhil%20Pawar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-55", "name": "Vishnu Shinde", "rollNo": "21BCS055", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vishnu%20Shinde&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-56", "name": "Kalyan Patil", "rollNo": "21BCS056", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kalyan%20Patil&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-303', 'A-303', 'blk-a', 'Block A (Newton)', 3, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-57", "name": "Girish Chavan", "rollNo": "21BCS057", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Girish%20Chavan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-58", "name": "Shankar Gaikwad", "rollNo": "21BCS058", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Shankar%20Gaikwad&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-59", "name": "Dinesh Bhosale", "rollNo": "21BCS059", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Dinesh%20Bhosale&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-60", "name": "Ajay Deshpande", "rollNo": "21BCS060", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Ajay%20Deshpande&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-304', 'A-304', 'blk-a', 'Block A (Newton)', 3, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-61", "name": "Anirban Sharma", "rollNo": "21BCS061", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Anirban%20Sharma&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-62", "name": "Debashis Verma", "rollNo": "21BCS062", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Debashis%20Verma&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-63", "name": "Sourav Mishra", "rollNo": "21BCS063", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sourav%20Mishra&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-64", "name": "Subhash Tiwari", "rollNo": "21BCS064", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Subhash%20Tiwari&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-305', 'A-305', 'blk-a', 'Block A (Newton)', 3, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-65", "name": "Joydeep Chauhan", "rollNo": "21BCS065", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Joydeep%20Chauhan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-66", "name": "Pritam Bhatia", "rollNo": "21BCS066", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Pritam%20Bhatia&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-67", "name": "Abhijit Saxena", "rollNo": "21BCS067", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Abhijit%20Saxena&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-68", "name": "Tanmoy Kapoor", "rollNo": "21BCS068", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Tanmoy%20Kapoor&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-306', 'A-306', 'blk-a', 'Block A (Newton)', 3, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-69", "name": "Bikram Gupta", "rollNo": "21BCS069", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Bikram%20Gupta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-70", "name": "Indrajit Malhotra", "rollNo": "21BCS070", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Indrajit%20Malhotra&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-71", "name": "Prosenjit Pandey", "rollNo": "21BCS071", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Prosenjit%20Pandey&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-72", "name": "Arup Shukla", "rollNo": "21BCS072", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Arup%20Shukla&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-401', 'A-401', 'blk-a', 'Block A (Newton)', 4, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-73", "name": "Sujit Yadav", "rollNo": "21BCS073", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sujit%20Yadav&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-74", "name": "Dipankar Singh", "rollNo": "21BCS074", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Dipankar%20Singh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-75", "name": "Partha Rathore", "rollNo": "21BCS075", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Partha%20Rathore&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-76", "name": "Samir Nair", "rollNo": "21BCS076", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Samir%20Nair&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-402', 'A-402', 'blk-a', 'Block A (Newton)', 4, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-77", "name": "Nilanjan Subramanian", "rollNo": "21BCS077", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Nilanjan%20Subramanian&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-78", "name": "Kaushik Iyer", "rollNo": "21BCS078", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kaushik%20Iyer&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-79", "name": "Debabrata Murthy", "rollNo": "21BCS079", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Debabrata%20Murthy&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-80", "name": "Satyajit Reddy", "rollNo": "21BCS080", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Satyajit%20Reddy&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-403', 'A-403', 'blk-a', 'Block A (Newton)', 4, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-81", "name": "Tapas Menon", "rollNo": "21BCS081", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Tapas%20Menon&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-82", "name": "Prabir Venkatesh", "rollNo": "21BCS082", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Prabir%20Venkatesh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-83", "name": "Chandan Swaminathan", "rollNo": "21BCS083", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Chandan%20Swaminathan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-84", "name": "Shantanu Pillai", "rollNo": "21BCS084", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Shantanu%20Pillai&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-404', 'A-404', 'blk-a', 'Block A (Newton)', 4, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-85", "name": "Subrata Rao", "rollNo": "21BCS085", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Subrata%20Rao&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-86", "name": "Subir Nambiar", "rollNo": "21BCS086", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Subir%20Nambiar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-87", "name": "Chinmoy Balaji", "rollNo": "21BCS087", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Chinmoy%20Balaji&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-88", "name": "Bhabesh Krishnan", "rollNo": "21BCS088", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Bhabesh%20Krishnan&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-405', 'A-405', 'blk-a', 'Block A (Newton)', 4, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-89", "name": "Pradip Naidu", "rollNo": "21BCS089", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Pradip%20Naidu&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-90", "name": "Monojit Shetty", "rollNo": "21BCS090", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Monojit%20Shetty&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-91", "name": "Dev Banerjee", "rollNo": "21BCS091", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Dev%20Banerjee&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-92", "name": "Chirag Mukherjee", "rollNo": "21BCS092", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Chirag%20Mukherjee&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-406', 'A-406', 'blk-a', 'Block A (Newton)', 4, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-93", "name": "Harshil Chatterjee", "rollNo": "21BCS093", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Harshil%20Chatterjee&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-94", "name": "Parth Roy", "rollNo": "21BCS094", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Parth%20Roy&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-95", "name": "Tanmay Sengupta", "rollNo": "21BCS095", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Tanmay%20Sengupta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-96", "name": "Bhavesh Das", "rollNo": "21BCS096", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Bhavesh%20Das&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-501', 'A-501', 'blk-a', 'Block A (Newton)', 5, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-97", "name": "Omkar Dutta", "rollNo": "21BCS097", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Omkar%20Dutta&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-98", "name": "Chinmay Ghosh", "rollNo": "21BCS098", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Chinmay%20Ghosh&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-99", "name": "Darshan Bhattacharya", "rollNo": "21BCS099", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Darshan%20Bhattacharya&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-100", "name": "Eashan Bose", "rollNo": "21BCS100", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Eashan%20Bose&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-502', 'A-502', 'blk-a', 'Block A (Newton)', 5, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-101", "name": "Hardik Majumdar", "rollNo": "21BCS101", "bed": "Bed 1", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Hardik%20Majumdar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-102", "name": "Jaideep Chakraborty", "rollNo": "21BCS102", "bed": "Bed 2", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Jaideep%20Chakraborty&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-103", "name": "Chetan Ganguly", "rollNo": "21BCS103", "bed": "Bed 3", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Chetan%20Ganguly&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-104", "name": "Hemant Mitra", "rollNo": "21BCS104", "bed": "Bed 4", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Hemant%20Mitra&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-503', 'A-503', 'blk-a', 'Block A (Newton)', 5, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-105", "name": "Jitin Saha", "rollNo": "21BCS105", "bed": "Bed 1", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Jitin%20Saha&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-106", "name": "Kishan Patel", "rollNo": "21BCS106", "bed": "Bed 2", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Kishan%20Patel&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-107", "name": "Manav Dixit", "rollNo": "21BCS107", "bed": "Bed 3", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Manav%20Dixit&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-108", "name": "Nishant Mehta", "rollNo": "21BCS108", "bed": "Bed 4", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Nishant%20Mehta&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-504', 'A-504', 'blk-a', 'Block A (Newton)', 5, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-109", "name": "Vedant Shah", "rollNo": "21BCS109", "bed": "Bed 1", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Vedant%20Shah&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-110", "name": "Yuvraj Kulkarni", "rollNo": "21BCS110", "bed": "Bed 2", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Yuvraj%20Kulkarni&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-111", "name": "Sachin Joshi", "rollNo": "21BCS111", "bed": "Bed 3", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sachin%20Joshi&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-112", "name": "Tushar Deshmukh", "rollNo": "21BCS112", "bed": "Bed 4", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Tushar%20Deshmukh&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-505', 'A-505', 'blk-a', 'Block A (Newton)', 5, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-113", "name": "Akash Marathe", "rollNo": "21BCS113", "bed": "Bed 1", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Akash%20Marathe&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-114", "name": "Sameer Pawar", "rollNo": "21BCS114", "bed": "Bed 2", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sameer%20Pawar&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-115", "name": "Pankaj Shinde", "rollNo": "21BCS115", "bed": "Bed 3", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Pankaj%20Shinde&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-116", "name": "Sumit Patil", "rollNo": "21BCS116", "bed": "Bed 4", "course": "B.Tech CSE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sumit%20Patil&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb),
('rm-a-506', 'A-506', 'blk-a', 'Block A (Newton)', 5, 'quad', 4, 4, 'occupied', '["High-speed Wi-Fi", "Study Lamp", "Attached Balcony", "Geyser"]'::jsonb, '[{"id": "std-117", "name": "Milind Chavan", "rollNo": "21BCS117", "bed": "Bed 1", "course": "B.Tech ECE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Milind%20Chavan&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-118", "name": "Makarand Gaikwad", "rollNo": "21BCS118", "bed": "Bed 2", "course": "B.Tech ME", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Makarand%20Gaikwad&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-119", "name": "Sarang Bhosale", "rollNo": "21BCS119", "bed": "Bed 3", "course": "B.Tech CE", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Sarang%20Bhosale&backgroundColor=0284c7&textColor=ffffff"}, {"id": "std-120", "name": "Swapnil Deshpande", "rollNo": "21BCS120", "bed": "Bed 4", "course": "B.Tech IT", "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Swapnil%20Deshpande&backgroundColor=0284c7&textColor=ffffff"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET floor=EXCLUDED.floor, type=EXCLUDED.type, capacity=EXCLUDED.capacity, occupied=EXCLUDED.occupied, status=EXCLUDED.status, amenities=EXCLUDED.amenities, occupants=EXCLUDED.occupants;

-- 5. Seed 120 Unique Indian Male Students
INSERT INTO public.profiles (id, full_name, email, phone, role, avatar_url, room_number, block_name, bed_number, roll_no, course, year, guardian_name, guardian_phone, fee_status, fee_amount_due, attendance_percent) VALUES
('usr-student-1', 'Aarav Patel', 'aarav.sharma@hostelos.edu', '+91 98201 10000', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Aarav%20Sharma&backgroundColor=0284c7&textColor=ffffff', 'A-101', 'Block A (Newton)', 'Bed 1', '21BCS001', 'B.Tech CSE', 1, 'Sharma Senior', '+91 98200 20000', 'paid', 0, 85),
('std-2', 'Rohan Verma', 'rohan.verma@hostelos.edu', '+91 98201 10001', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Rohan%20Verma&backgroundColor=0284c7&textColor=ffffff', 'A-101', 'Block A (Newton)', 'Bed 2', '21BCS002', 'B.Tech ECE', 2, 'Verma Senior', '+91 98200 20001', 'paid', 0, 86),
('std-3', 'Aditya Mishra', 'aditya.mishra@hostelos.edu', '+91 98201 10002', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Aditya%20Mishra&backgroundColor=0284c7&textColor=ffffff', 'A-101', 'Block A (Newton)', 'Bed 3', '21BCS003', 'B.Tech ME', 3, 'Mishra Senior', '+91 98200 20002', 'pending', 4500, 87),
('std-4', 'Vivaan Tiwari', 'vivaan.tiwari@hostelos.edu', '+91 98201 10003', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Vivaan%20Tiwari&backgroundColor=0284c7&textColor=ffffff', 'A-101', 'Block A (Newton)', 'Bed 4', '21BCS004', 'B.Tech CE', 4, 'Tiwari Senior', '+91 98200 20003', 'partial', 2250, 88),
('std-5', 'Harsh Chauhan', 'harsh.chauhan@hostelos.edu', '+91 98201 10004', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Harsh%20Chauhan&backgroundColor=0284c7&textColor=ffffff', 'A-102', 'Block A (Newton)', 'Bed 1', '21BCS005', 'B.Tech IT', 1, 'Chauhan Senior', '+91 98200 20004', 'paid', 0, 89),
('std-6', 'Kabir Bhatia', 'kabir.bhatia@hostelos.edu', '+91 98201 10005', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Kabir%20Bhatia&backgroundColor=0284c7&textColor=ffffff', 'A-102', 'Block A (Newton)', 'Bed 2', '21BCS006', 'B.Tech CSE', 2, 'Bhatia Senior', '+91 98200 20005', 'paid', 0, 90),
('std-7', 'Ayush Saxena', 'ayush.saxena@hostelos.edu', '+91 98201 10006', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Ayush%20Saxena&backgroundColor=0284c7&textColor=ffffff', 'A-102', 'Block A (Newton)', 'Bed 3', '21BCS007', 'B.Tech ECE', 3, 'Saxena Senior', '+91 98200 20006', 'paid', 0, 91),
('std-8', 'Kunal Kapoor', 'kunal.kapoor@hostelos.edu', '+91 98201 10007', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Kunal%20Kapoor&backgroundColor=0284c7&textColor=ffffff', 'A-102', 'Block A (Newton)', 'Bed 4', '21BCS008', 'B.Tech ME', 4, 'Kapoor Senior', '+91 98200 20007', 'pending', 4500, 92),
('std-9', 'Mohit Gupta', 'mohit.gupta@hostelos.edu', '+91 98201 10008', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Mohit%20Gupta&backgroundColor=0284c7&textColor=ffffff', 'A-103', 'Block A (Newton)', 'Bed 1', '21BCS009', 'B.Tech CE', 1, 'Gupta Senior', '+91 98200 20008', 'partial', 2250, 93),
('std-10', 'Rahul Malhotra', 'rahul.malhotra@hostelos.edu', '+91 98201 10009', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Rahul%20Malhotra&backgroundColor=0284c7&textColor=ffffff', 'A-103', 'Block A (Newton)', 'Bed 2', '21BCS010', 'B.Tech IT', 2, 'Malhotra Senior', '+91 98200 20009', 'paid', 0, 94),
('std-11', 'Deepak Pandey', 'deepak.pandey@hostelos.edu', '+91 98201 10010', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Deepak%20Pandey&backgroundColor=0284c7&textColor=ffffff', 'A-103', 'Block A (Newton)', 'Bed 3', '21BCS011', 'B.Tech CSE', 3, 'Pandey Senior', '+91 98200 20010', 'paid', 0, 95),
('std-12', 'Sanjay Shukla', 'sanjay.shukla@hostelos.edu', '+91 98201 10011', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Sanjay%20Shukla&backgroundColor=0284c7&textColor=ffffff', 'A-103', 'Block A (Newton)', 'Bed 4', '21BCS012', 'B.Tech ECE', 4, 'Shukla Senior', '+91 98200 20011', 'paid', 0, 96),
('std-13', 'Alok Yadav', 'alok.yadav@hostelos.edu', '+91 98201 10012', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Alok%20Yadav&backgroundColor=0284c7&textColor=ffffff', 'A-104', 'Block A (Newton)', 'Bed 1', '21BCS013', 'B.Tech ME', 1, 'Yadav Senior', '+91 98200 20012', 'pending', 4500, 97),
('std-14', 'Rajeev Singh', 'rajeev.singh@hostelos.edu', '+91 98201 10013', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Rajeev%20Singh&backgroundColor=0284c7&textColor=ffffff', 'A-104', 'Block A (Newton)', 'Bed 2', '21BCS014', 'B.Tech CE', 2, 'Singh Senior', '+91 98200 20013', 'partial', 2250, 98),
('std-15', 'Naveen Rathore', 'naveen.rathore@hostelos.edu', '+91 98201 10014', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Naveen%20Rathore&backgroundColor=0284c7&textColor=ffffff', 'A-104', 'Block A (Newton)', 'Bed 3', '21BCS015', 'B.Tech IT', 3, 'Rathore Senior', '+91 98200 20014', 'paid', 0, 85),
('std-16', 'Vikas Nair', 'vikas.nair@hostelos.edu', '+91 98201 10015', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Vikas%20Nair&backgroundColor=0284c7&textColor=ffffff', 'A-104', 'Block A (Newton)', 'Bed 4', '21BCS016', 'B.Tech CSE', 4, 'Nair Senior', '+91 98200 20015', 'paid', 0, 86),
('std-17', 'Abhishek Subramanian', 'abhishek.subramanian@hostelos.edu', '+91 98201 10016', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Abhishek%20Subramanian&backgroundColor=0284c7&textColor=ffffff', 'A-105', 'Block A (Newton)', 'Bed 1', '21BCS017', 'B.Tech ECE', 1, 'Subramanian Senior', '+91 98200 20016', 'paid', 0, 87),
('std-18', 'Gautam Iyer', 'gautam.iyer@hostelos.edu', '+91 98201 10017', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Gautam%20Iyer&backgroundColor=0284c7&textColor=ffffff', 'A-105', 'Block A (Newton)', 'Bed 2', '21BCS018', 'B.Tech ME', 2, 'Iyer Senior', '+91 98200 20017', 'pending', 4500, 88),
('std-19', 'Neeraj Murthy', 'neeraj.murthy@hostelos.edu', '+91 98201 10018', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Neeraj%20Murthy&backgroundColor=0284c7&textColor=ffffff', 'A-105', 'Block A (Newton)', 'Bed 3', '21BCS019', 'B.Tech CE', 3, 'Murthy Senior', '+91 98200 20018', 'partial', 2250, 89),
('std-20', 'Tarun Reddy', 'tarun.reddy@hostelos.edu', '+91 98201 10019', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Tarun%20Reddy&backgroundColor=0284c7&textColor=ffffff', 'A-105', 'Block A (Newton)', 'Bed 4', '21BCS020', 'B.Tech IT', 4, 'Reddy Senior', '+91 98200 20019', 'paid', 0, 90),
('std-21', 'Ankit Menon', 'ankit.menon@hostelos.edu', '+91 98201 10020', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Ankit%20Menon&backgroundColor=0284c7&textColor=ffffff', 'A-106', 'Block A (Newton)', 'Bed 1', '21BCS021', 'B.Tech CSE', 1, 'Menon Senior', '+91 98200 20020', 'paid', 0, 91),
('std-22', 'Sourabh Venkatesh', 'sourabh.venkatesh@hostelos.edu', '+91 98201 10021', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Sourabh%20Venkatesh&backgroundColor=0284c7&textColor=ffffff', 'A-106', 'Block A (Newton)', 'Bed 2', '21BCS022', 'B.Tech ECE', 2, 'Venkatesh Senior', '+91 98200 20021', 'paid', 0, 92),
('std-23', 'Mayank Swaminathan', 'mayank.swaminathan@hostelos.edu', '+91 98201 10022', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Mayank%20Swaminathan&backgroundColor=0284c7&textColor=ffffff', 'A-106', 'Block A (Newton)', 'Bed 3', '21BCS023', 'B.Tech ME', 3, 'Swaminathan Senior', '+91 98200 20022', 'pending', 4500, 93),
('std-24', 'Harshit Pillai', 'harshit.pillai@hostelos.edu', '+91 98201 10023', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Harshit%20Pillai&backgroundColor=0284c7&textColor=ffffff', 'A-106', 'Block A (Newton)', 'Bed 4', '21BCS024', 'B.Tech CE', 4, 'Pillai Senior', '+91 98200 20023', 'partial', 2250, 94),
('std-25', 'Utkarsh Rao', 'utkarsh.rao@hostelos.edu', '+91 98201 10024', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Utkarsh%20Rao&backgroundColor=0284c7&textColor=ffffff', 'A-201', 'Block A (Newton)', 'Bed 1', '21BCS025', 'B.Tech IT', 1, 'Rao Senior', '+91 98200 20024', 'paid', 0, 95),
('std-26', 'Kartik Nambiar', 'kartik.nambiar@hostelos.edu', '+91 98201 10025', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Kartik%20Nambiar&backgroundColor=0284c7&textColor=ffffff', 'A-201', 'Block A (Newton)', 'Bed 2', '21BCS026', 'B.Tech CSE', 2, 'Nambiar Senior', '+91 98200 20025', 'paid', 0, 96),
('std-27', 'Lokesh Balaji', 'lokesh.balaji@hostelos.edu', '+91 98201 10026', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Lokesh%20Balaji&backgroundColor=0284c7&textColor=ffffff', 'A-201', 'Block A (Newton)', 'Bed 3', '21BCS027', 'B.Tech ECE', 3, 'Balaji Senior', '+91 98200 20026', 'paid', 0, 97),
('std-28', 'Raghav Krishnan', 'raghav.krishnan@hostelos.edu', '+91 98201 10027', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Raghav%20Krishnan&backgroundColor=0284c7&textColor=ffffff', 'A-201', 'Block A (Newton)', 'Bed 4', '21BCS028', 'B.Tech ME', 4, 'Krishnan Senior', '+91 98200 20027', 'pending', 4500, 98),
('std-29', 'Shubham Naidu', 'shubham.naidu@hostelos.edu', '+91 98201 10028', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Shubham%20Naidu&backgroundColor=0284c7&textColor=ffffff', 'A-202', 'Block A (Newton)', 'Bed 1', '21BCS029', 'B.Tech CE', 1, 'Naidu Senior', '+91 98200 20028', 'partial', 2250, 85),
('std-30', 'Uday Shetty', 'uday.shetty@hostelos.edu', '+91 98201 10029', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Uday%20Shetty&backgroundColor=0284c7&textColor=ffffff', 'A-202', 'Block A (Newton)', 'Bed 2', '21BCS030', 'B.Tech IT', 2, 'Shetty Senior', '+91 98200 20029', 'paid', 0, 86),
('std-31', 'Siddharth Banerjee', 'siddharth.banerjee@hostelos.edu', '+91 98201 10030', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Siddharth%20Banerjee&backgroundColor=0284c7&textColor=ffffff', 'A-202', 'Block A (Newton)', 'Bed 3', '21BCS031', 'B.Tech CSE', 3, 'Banerjee Senior', '+91 98200 20030', 'paid', 0, 87),
('std-32', 'Vignesh Mukherjee', 'vignesh.mukherjee@hostelos.edu', '+91 98201 10031', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Vignesh%20Mukherjee&backgroundColor=0284c7&textColor=ffffff', 'A-202', 'Block A (Newton)', 'Bed 4', '21BCS032', 'B.Tech ECE', 4, 'Mukherjee Senior', '+91 98200 20031', 'paid', 0, 88),
('std-33', 'Karthik Chatterjee', 'karthik.chatterjee@hostelos.edu', '+91 98201 10032', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Karthik%20Chatterjee&backgroundColor=0284c7&textColor=ffffff', 'A-203', 'Block A (Newton)', 'Bed 1', '21BCS033', 'B.Tech ME', 1, 'Chatterjee Senior', '+91 98200 20032', 'pending', 4500, 89),
('std-34', 'Pranav Roy', 'pranav.roy@hostelos.edu', '+91 98201 10033', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Pranav%20Roy&backgroundColor=0284c7&textColor=ffffff', 'A-203', 'Block A (Newton)', 'Bed 2', '21BCS034', 'B.Tech CE', 2, 'Roy Senior', '+91 98200 20033', 'partial', 2250, 90),
('std-35', 'Sai Sengupta', 'sai.sengupta@hostelos.edu', '+91 98201 10034', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Sai%20Sengupta&backgroundColor=0284c7&textColor=ffffff', 'A-203', 'Block A (Newton)', 'Bed 3', '21BCS035', 'B.Tech IT', 3, 'Sengupta Senior', '+91 98200 20034', 'paid', 0, 91),
('std-36', 'Ashwin Das', 'ashwin.das@hostelos.edu', '+91 98201 10035', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Ashwin%20Das&backgroundColor=0284c7&textColor=ffffff', 'A-203', 'Block A (Newton)', 'Bed 4', '21BCS036', 'B.Tech CSE', 4, 'Das Senior', '+91 98200 20035', 'paid', 0, 92),
('std-37', 'Balakrishnan Dutta', 'balakrishnan.dutta@hostelos.edu', '+91 98201 10036', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Balakrishnan%20Dutta&backgroundColor=0284c7&textColor=ffffff', 'A-204', 'Block A (Newton)', 'Bed 1', '21BCS037', 'B.Tech ECE', 1, 'Dutta Senior', '+91 98200 20036', 'paid', 0, 93),
('std-38', 'Dhanush Ghosh', 'dhanush.ghosh@hostelos.edu', '+91 98201 10037', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Dhanush%20Ghosh&backgroundColor=0284c7&textColor=ffffff', 'A-204', 'Block A (Newton)', 'Bed 2', '21BCS038', 'B.Tech ME', 2, 'Ghosh Senior', '+91 98200 20037', 'pending', 4500, 94),
('std-39', 'Arvind Bhattacharya', 'arvind.bhattacharya@hostelos.edu', '+91 98201 10038', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Arvind%20Bhattacharya&backgroundColor=0284c7&textColor=ffffff', 'A-204', 'Block A (Newton)', 'Bed 3', '21BCS039', 'B.Tech CE', 3, 'Bhattacharya Senior', '+91 98200 20038', 'partial', 2250, 95),
('std-40', 'Surya Bose', 'surya.bose@hostelos.edu', '+91 98201 10039', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Surya%20Bose&backgroundColor=0284c7&textColor=ffffff', 'A-204', 'Block A (Newton)', 'Bed 4', '21BCS040', 'B.Tech IT', 4, 'Bose Senior', '+91 98200 20039', 'paid', 0, 96),
('std-41', 'Manoj Majumdar', 'manoj.majumdar@hostelos.edu', '+91 98201 10040', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Manoj%20Majumdar&backgroundColor=0284c7&textColor=ffffff', 'A-205', 'Block A (Newton)', 'Bed 1', '21BCS041', 'B.Tech CSE', 1, 'Majumdar Senior', '+91 98200 20040', 'paid', 0, 97),
('std-42', 'Praveen Chakraborty', 'praveen.chakraborty@hostelos.edu', '+91 98201 10041', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Praveen%20Chakraborty&backgroundColor=0284c7&textColor=ffffff', 'A-205', 'Block A (Newton)', 'Bed 2', '21BCS042', 'B.Tech ECE', 2, 'Chakraborty Senior', '+91 98200 20041', 'paid', 0, 98),
('std-43', 'Suresh Ganguly', 'suresh.ganguly@hostelos.edu', '+91 98201 10042', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Suresh%20Ganguly&backgroundColor=0284c7&textColor=ffffff', 'A-205', 'Block A (Newton)', 'Bed 3', '21BCS043', 'B.Tech ME', 3, 'Ganguly Senior', '+91 98200 20042', 'pending', 4500, 85),
('std-44', 'Ramesh Mitra', 'ramesh.mitra@hostelos.edu', '+91 98201 10043', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Ramesh%20Mitra&backgroundColor=0284c7&textColor=ffffff', 'A-205', 'Block A (Newton)', 'Bed 4', '21BCS044', 'B.Tech CE', 4, 'Mitra Senior', '+91 98200 20043', 'partial', 2250, 86),
('std-45', 'Ganesh Saha', 'ganesh.saha@hostelos.edu', '+91 98201 10044', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Ganesh%20Saha&backgroundColor=0284c7&textColor=ffffff', 'A-206', 'Block A (Newton)', 'Bed 1', '21BCS045', 'B.Tech IT', 1, 'Saha Senior', '+91 98200 20044', 'paid', 0, 87),
('std-46', 'Venkat Patel', 'venkat.patel@hostelos.edu', '+91 98201 10045', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Venkat%20Patel&backgroundColor=0284c7&textColor=ffffff', 'A-206', 'Block A (Newton)', 'Bed 2', '21BCS046', 'B.Tech CSE', 2, 'Patel Senior', '+91 98200 20045', 'paid', 0, 88),
('std-47', 'Hari Dixit', 'hari.dixit@hostelos.edu', '+91 98201 10046', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Hari%20Dixit&backgroundColor=0284c7&textColor=ffffff', 'A-206', 'Block A (Newton)', 'Bed 3', '21BCS047', 'B.Tech ECE', 3, 'Dixit Senior', '+91 98200 20046', 'paid', 0, 89),
('std-48', 'Vijay Mehta', 'vijay.mehta@hostelos.edu', '+91 98201 10047', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Vijay%20Mehta&backgroundColor=0284c7&textColor=ffffff', 'A-206', 'Block A (Newton)', 'Bed 4', '21BCS048', 'B.Tech ME', 4, 'Mehta Senior', '+91 98200 20047', 'pending', 4500, 90),
('std-49', 'Kishore Shah', 'kishore.shah@hostelos.edu', '+91 98201 10048', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Kishore%20Shah&backgroundColor=0284c7&textColor=ffffff', 'A-301', 'Block A (Newton)', 'Bed 1', '21BCS049', 'B.Tech CE', 1, 'Shah Senior', '+91 98200 20048', 'partial', 2250, 91),
('std-50', 'Anand Kulkarni', 'anand.kulkarni@hostelos.edu', '+91 98201 10049', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Anand%20Kulkarni&backgroundColor=0284c7&textColor=ffffff', 'A-301', 'Block A (Newton)', 'Bed 2', '21BCS050', 'B.Tech IT', 2, 'Kulkarni Senior', '+91 98200 20049', 'paid', 0, 92),
('std-51', 'Madhav Joshi', 'madhav.joshi@hostelos.edu', '+91 98201 10050', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Madhav%20Joshi&backgroundColor=0284c7&textColor=ffffff', 'A-301', 'Block A (Newton)', 'Bed 3', '21BCS051', 'B.Tech CSE', 3, 'Joshi Senior', '+91 98200 20050', 'paid', 0, 93),
('std-52', 'Sriram Deshmukh', 'sriram.deshmukh@hostelos.edu', '+91 98201 10051', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Sriram%20Deshmukh&backgroundColor=0284c7&textColor=ffffff', 'A-301', 'Block A (Newton)', 'Bed 4', '21BCS052', 'B.Tech ECE', 4, 'Deshmukh Senior', '+91 98200 20051', 'paid', 0, 94),
('std-53', 'Varun Marathe', 'varun.marathe@hostelos.edu', '+91 98201 10052', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Varun%20Marathe&backgroundColor=0284c7&textColor=ffffff', 'A-302', 'Block A (Newton)', 'Bed 1', '21BCS053', 'B.Tech ME', 1, 'Marathe Senior', '+91 98200 20052', 'pending', 4500, 95),
('std-54', 'Nikhil Pawar', 'nikhil.pawar@hostelos.edu', '+91 98201 10053', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Nikhil%20Pawar&backgroundColor=0284c7&textColor=ffffff', 'A-302', 'Block A (Newton)', 'Bed 2', '21BCS054', 'B.Tech CE', 2, 'Pawar Senior', '+91 98200 20053', 'partial', 2250, 96),
('std-55', 'Vishnu Shinde', 'vishnu.shinde@hostelos.edu', '+91 98201 10054', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Vishnu%20Shinde&backgroundColor=0284c7&textColor=ffffff', 'A-302', 'Block A (Newton)', 'Bed 3', '21BCS055', 'B.Tech IT', 3, 'Shinde Senior', '+91 98200 20054', 'paid', 0, 97),
('std-56', 'Kalyan Patil', 'kalyan.patil@hostelos.edu', '+91 98201 10055', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Kalyan%20Patil&backgroundColor=0284c7&textColor=ffffff', 'A-302', 'Block A (Newton)', 'Bed 4', '21BCS056', 'B.Tech CSE', 4, 'Patil Senior', '+91 98200 20055', 'paid', 0, 98),
('std-57', 'Girish Chavan', 'girish.chavan@hostelos.edu', '+91 98201 10056', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Girish%20Chavan&backgroundColor=0284c7&textColor=ffffff', 'A-303', 'Block A (Newton)', 'Bed 1', '21BCS057', 'B.Tech ECE', 1, 'Chavan Senior', '+91 98200 20056', 'paid', 0, 85),
('std-58', 'Shankar Gaikwad', 'shankar.gaikwad@hostelos.edu', '+91 98201 10057', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Shankar%20Gaikwad&backgroundColor=0284c7&textColor=ffffff', 'A-303', 'Block A (Newton)', 'Bed 2', '21BCS058', 'B.Tech ME', 2, 'Gaikwad Senior', '+91 98200 20057', 'pending', 4500, 86),
('std-59', 'Dinesh Bhosale', 'dinesh.bhosale@hostelos.edu', '+91 98201 10058', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Dinesh%20Bhosale&backgroundColor=0284c7&textColor=ffffff', 'A-303', 'Block A (Newton)', 'Bed 3', '21BCS059', 'B.Tech CE', 3, 'Bhosale Senior', '+91 98200 20058', 'partial', 2250, 87),
('std-60', 'Ajay Deshpande', 'ajay.deshpande@hostelos.edu', '+91 98201 10059', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Ajay%20Deshpande&backgroundColor=0284c7&textColor=ffffff', 'A-303', 'Block A (Newton)', 'Bed 4', '21BCS060', 'B.Tech IT', 4, 'Deshpande Senior', '+91 98200 20059', 'paid', 0, 88),
('std-61', 'Anirban Sharma', 'anirban.sharma@hostelos.edu', '+91 98201 10060', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Anirban%20Sharma&backgroundColor=0284c7&textColor=ffffff', 'A-304', 'Block A (Newton)', 'Bed 1', '21BCS061', 'B.Tech CSE', 1, 'Sharma Senior', '+91 98200 20060', 'paid', 0, 89),
('std-62', 'Debashis Verma', 'debashis.verma@hostelos.edu', '+91 98201 10061', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Debashis%20Verma&backgroundColor=0284c7&textColor=ffffff', 'A-304', 'Block A (Newton)', 'Bed 2', '21BCS062', 'B.Tech ECE', 2, 'Verma Senior', '+91 98200 20061', 'paid', 0, 90),
('std-63', 'Sourav Mishra', 'sourav.mishra@hostelos.edu', '+91 98201 10062', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Sourav%20Mishra&backgroundColor=0284c7&textColor=ffffff', 'A-304', 'Block A (Newton)', 'Bed 3', '21BCS063', 'B.Tech ME', 3, 'Mishra Senior', '+91 98200 20062', 'pending', 4500, 91),
('std-64', 'Subhash Tiwari', 'subhash.tiwari@hostelos.edu', '+91 98201 10063', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Subhash%20Tiwari&backgroundColor=0284c7&textColor=ffffff', 'A-304', 'Block A (Newton)', 'Bed 4', '21BCS064', 'B.Tech CE', 4, 'Tiwari Senior', '+91 98200 20063', 'partial', 2250, 92),
('std-65', 'Joydeep Chauhan', 'joydeep.chauhan@hostelos.edu', '+91 98201 10064', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Joydeep%20Chauhan&backgroundColor=0284c7&textColor=ffffff', 'A-305', 'Block A (Newton)', 'Bed 1', '21BCS065', 'B.Tech IT', 1, 'Chauhan Senior', '+91 98200 20064', 'paid', 0, 93),
('std-66', 'Pritam Bhatia', 'pritam.bhatia@hostelos.edu', '+91 98201 10065', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Pritam%20Bhatia&backgroundColor=0284c7&textColor=ffffff', 'A-305', 'Block A (Newton)', 'Bed 2', '21BCS066', 'B.Tech CSE', 2, 'Bhatia Senior', '+91 98200 20065', 'paid', 0, 94),
('std-67', 'Abhijit Saxena', 'abhijit.saxena@hostelos.edu', '+91 98201 10066', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Abhijit%20Saxena&backgroundColor=0284c7&textColor=ffffff', 'A-305', 'Block A (Newton)', 'Bed 3', '21BCS067', 'B.Tech ECE', 3, 'Saxena Senior', '+91 98200 20066', 'paid', 0, 95),
('std-68', 'Tanmoy Kapoor', 'tanmoy.kapoor@hostelos.edu', '+91 98201 10067', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Tanmoy%20Kapoor&backgroundColor=0284c7&textColor=ffffff', 'A-305', 'Block A (Newton)', 'Bed 4', '21BCS068', 'B.Tech ME', 4, 'Kapoor Senior', '+91 98200 20067', 'pending', 4500, 96),
('std-69', 'Bikram Gupta', 'bikram.gupta@hostelos.edu', '+91 98201 10068', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Bikram%20Gupta&backgroundColor=0284c7&textColor=ffffff', 'A-306', 'Block A (Newton)', 'Bed 1', '21BCS069', 'B.Tech CE', 1, 'Gupta Senior', '+91 98200 20068', 'partial', 2250, 97),
('std-70', 'Indrajit Malhotra', 'indrajit.malhotra@hostelos.edu', '+91 98201 10069', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Indrajit%20Malhotra&backgroundColor=0284c7&textColor=ffffff', 'A-306', 'Block A (Newton)', 'Bed 2', '21BCS070', 'B.Tech IT', 2, 'Malhotra Senior', '+91 98200 20069', 'paid', 0, 98),
('std-71', 'Prosenjit Pandey', 'prosenjit.pandey@hostelos.edu', '+91 98201 10070', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Prosenjit%20Pandey&backgroundColor=0284c7&textColor=ffffff', 'A-306', 'Block A (Newton)', 'Bed 3', '21BCS071', 'B.Tech CSE', 3, 'Pandey Senior', '+91 98200 20070', 'paid', 0, 85),
('std-72', 'Arup Shukla', 'arup.shukla@hostelos.edu', '+91 98201 10071', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Arup%20Shukla&backgroundColor=0284c7&textColor=ffffff', 'A-306', 'Block A (Newton)', 'Bed 4', '21BCS072', 'B.Tech ECE', 4, 'Shukla Senior', '+91 98200 20071', 'paid', 0, 86),
('std-73', 'Sujit Yadav', 'sujit.yadav@hostelos.edu', '+91 98201 10072', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Sujit%20Yadav&backgroundColor=0284c7&textColor=ffffff', 'A-401', 'Block A (Newton)', 'Bed 1', '21BCS073', 'B.Tech ME', 1, 'Yadav Senior', '+91 98200 20072', 'pending', 4500, 87),
('std-74', 'Dipankar Singh', 'dipankar.singh@hostelos.edu', '+91 98201 10073', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Dipankar%20Singh&backgroundColor=0284c7&textColor=ffffff', 'A-401', 'Block A (Newton)', 'Bed 2', '21BCS074', 'B.Tech CE', 2, 'Singh Senior', '+91 98200 20073', 'partial', 2250, 88),
('std-75', 'Partha Rathore', 'partha.rathore@hostelos.edu', '+91 98201 10074', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Partha%20Rathore&backgroundColor=0284c7&textColor=ffffff', 'A-401', 'Block A (Newton)', 'Bed 3', '21BCS075', 'B.Tech IT', 3, 'Rathore Senior', '+91 98200 20074', 'paid', 0, 89),
('std-76', 'Samir Nair', 'samir.nair@hostelos.edu', '+91 98201 10075', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Samir%20Nair&backgroundColor=0284c7&textColor=ffffff', 'A-401', 'Block A (Newton)', 'Bed 4', '21BCS076', 'B.Tech CSE', 4, 'Nair Senior', '+91 98200 20075', 'paid', 0, 90),
('std-77', 'Nilanjan Subramanian', 'nilanjan.subramanian@hostelos.edu', '+91 98201 10076', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Nilanjan%20Subramanian&backgroundColor=0284c7&textColor=ffffff', 'A-402', 'Block A (Newton)', 'Bed 1', '21BCS077', 'B.Tech ECE', 1, 'Subramanian Senior', '+91 98200 20076', 'paid', 0, 91),
('std-78', 'Kaushik Iyer', 'kaushik.iyer@hostelos.edu', '+91 98201 10077', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Kaushik%20Iyer&backgroundColor=0284c7&textColor=ffffff', 'A-402', 'Block A (Newton)', 'Bed 2', '21BCS078', 'B.Tech ME', 2, 'Iyer Senior', '+91 98200 20077', 'pending', 4500, 92),
('std-79', 'Debabrata Murthy', 'debabrata.murthy@hostelos.edu', '+91 98201 10078', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Debabrata%20Murthy&backgroundColor=0284c7&textColor=ffffff', 'A-402', 'Block A (Newton)', 'Bed 3', '21BCS079', 'B.Tech CE', 3, 'Murthy Senior', '+91 98200 20078', 'partial', 2250, 93),
('std-80', 'Satyajit Reddy', 'satyajit.reddy@hostelos.edu', '+91 98201 10079', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Satyajit%20Reddy&backgroundColor=0284c7&textColor=ffffff', 'A-402', 'Block A (Newton)', 'Bed 4', '21BCS080', 'B.Tech IT', 4, 'Reddy Senior', '+91 98200 20079', 'paid', 0, 94),
('std-81', 'Tapas Menon', 'tapas.menon@hostelos.edu', '+91 98201 10080', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Tapas%20Menon&backgroundColor=0284c7&textColor=ffffff', 'A-403', 'Block A (Newton)', 'Bed 1', '21BCS081', 'B.Tech CSE', 1, 'Menon Senior', '+91 98200 20080', 'paid', 0, 95),
('std-82', 'Prabir Venkatesh', 'prabir.venkatesh@hostelos.edu', '+91 98201 10081', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Prabir%20Venkatesh&backgroundColor=0284c7&textColor=ffffff', 'A-403', 'Block A (Newton)', 'Bed 2', '21BCS082', 'B.Tech ECE', 2, 'Venkatesh Senior', '+91 98200 20081', 'paid', 0, 96),
('std-83', 'Chandan Swaminathan', 'chandan.swaminathan@hostelos.edu', '+91 98201 10082', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Chandan%20Swaminathan&backgroundColor=0284c7&textColor=ffffff', 'A-403', 'Block A (Newton)', 'Bed 3', '21BCS083', 'B.Tech ME', 3, 'Swaminathan Senior', '+91 98200 20082', 'pending', 4500, 97),
('std-84', 'Shantanu Pillai', 'shantanu.pillai@hostelos.edu', '+91 98201 10083', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Shantanu%20Pillai&backgroundColor=0284c7&textColor=ffffff', 'A-403', 'Block A (Newton)', 'Bed 4', '21BCS084', 'B.Tech CE', 4, 'Pillai Senior', '+91 98200 20083', 'partial', 2250, 98),
('std-85', 'Subrata Rao', 'subrata.rao@hostelos.edu', '+91 98201 10084', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Subrata%20Rao&backgroundColor=0284c7&textColor=ffffff', 'A-404', 'Block A (Newton)', 'Bed 1', '21BCS085', 'B.Tech IT', 1, 'Rao Senior', '+91 98200 20084', 'paid', 0, 85),
('std-86', 'Subir Nambiar', 'subir.nambiar@hostelos.edu', '+91 98201 10085', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Subir%20Nambiar&backgroundColor=0284c7&textColor=ffffff', 'A-404', 'Block A (Newton)', 'Bed 2', '21BCS086', 'B.Tech CSE', 2, 'Nambiar Senior', '+91 98200 20085', 'paid', 0, 86),
('std-87', 'Chinmoy Balaji', 'chinmoy.balaji@hostelos.edu', '+91 98201 10086', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Chinmoy%20Balaji&backgroundColor=0284c7&textColor=ffffff', 'A-404', 'Block A (Newton)', 'Bed 3', '21BCS087', 'B.Tech ECE', 3, 'Balaji Senior', '+91 98200 20086', 'paid', 0, 87),
('std-88', 'Bhabesh Krishnan', 'bhabesh.krishnan@hostelos.edu', '+91 98201 10087', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Bhabesh%20Krishnan&backgroundColor=0284c7&textColor=ffffff', 'A-404', 'Block A (Newton)', 'Bed 4', '21BCS088', 'B.Tech ME', 4, 'Krishnan Senior', '+91 98200 20087', 'pending', 4500, 88),
('std-89', 'Pradip Naidu', 'pradip.naidu@hostelos.edu', '+91 98201 10088', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Pradip%20Naidu&backgroundColor=0284c7&textColor=ffffff', 'A-405', 'Block A (Newton)', 'Bed 1', '21BCS089', 'B.Tech CE', 1, 'Naidu Senior', '+91 98200 20088', 'partial', 2250, 89),
('std-90', 'Monojit Shetty', 'monojit.shetty@hostelos.edu', '+91 98201 10089', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Monojit%20Shetty&backgroundColor=0284c7&textColor=ffffff', 'A-405', 'Block A (Newton)', 'Bed 2', '21BCS090', 'B.Tech IT', 2, 'Shetty Senior', '+91 98200 20089', 'paid', 0, 90),
('std-91', 'Dev Banerjee', 'dev.banerjee@hostelos.edu', '+91 98201 10090', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Dev%20Banerjee&backgroundColor=0284c7&textColor=ffffff', 'A-405', 'Block A (Newton)', 'Bed 3', '21BCS091', 'B.Tech CSE', 3, 'Banerjee Senior', '+91 98200 20090', 'paid', 0, 91),
('std-92', 'Chirag Mukherjee', 'chirag.mukherjee@hostelos.edu', '+91 98201 10091', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Chirag%20Mukherjee&backgroundColor=0284c7&textColor=ffffff', 'A-405', 'Block A (Newton)', 'Bed 4', '21BCS092', 'B.Tech ECE', 4, 'Mukherjee Senior', '+91 98200 20091', 'paid', 0, 92),
('std-93', 'Harshil Chatterjee', 'harshil.chatterjee@hostelos.edu', '+91 98201 10092', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Harshil%20Chatterjee&backgroundColor=0284c7&textColor=ffffff', 'A-406', 'Block A (Newton)', 'Bed 1', '21BCS093', 'B.Tech ME', 1, 'Chatterjee Senior', '+91 98200 20092', 'pending', 4500, 93),
('std-94', 'Parth Roy', 'parth.roy@hostelos.edu', '+91 98201 10093', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Parth%20Roy&backgroundColor=0284c7&textColor=ffffff', 'A-406', 'Block A (Newton)', 'Bed 2', '21BCS094', 'B.Tech CE', 2, 'Roy Senior', '+91 98200 20093', 'partial', 2250, 94),
('std-95', 'Tanmay Sengupta', 'tanmay.sengupta@hostelos.edu', '+91 98201 10094', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Tanmay%20Sengupta&backgroundColor=0284c7&textColor=ffffff', 'A-406', 'Block A (Newton)', 'Bed 3', '21BCS095', 'B.Tech IT', 3, 'Sengupta Senior', '+91 98200 20094', 'paid', 0, 95),
('std-96', 'Bhavesh Das', 'bhavesh.das@hostelos.edu', '+91 98201 10095', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Bhavesh%20Das&backgroundColor=0284c7&textColor=ffffff', 'A-406', 'Block A (Newton)', 'Bed 4', '21BCS096', 'B.Tech CSE', 4, 'Das Senior', '+91 98200 20095', 'paid', 0, 96),
('std-97', 'Omkar Dutta', 'omkar.dutta@hostelos.edu', '+91 98201 10096', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Omkar%20Dutta&backgroundColor=0284c7&textColor=ffffff', 'A-501', 'Block A (Newton)', 'Bed 1', '21BCS097', 'B.Tech ECE', 1, 'Dutta Senior', '+91 98200 20096', 'paid', 0, 97),
('std-98', 'Chinmay Ghosh', 'chinmay.ghosh@hostelos.edu', '+91 98201 10097', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Chinmay%20Ghosh&backgroundColor=0284c7&textColor=ffffff', 'A-501', 'Block A (Newton)', 'Bed 2', '21BCS098', 'B.Tech ME', 2, 'Ghosh Senior', '+91 98200 20097', 'pending', 4500, 98),
('std-99', 'Darshan Bhattacharya', 'darshan.bhattacharya@hostelos.edu', '+91 98201 10098', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Darshan%20Bhattacharya&backgroundColor=0284c7&textColor=ffffff', 'A-501', 'Block A (Newton)', 'Bed 3', '21BCS099', 'B.Tech CE', 3, 'Bhattacharya Senior', '+91 98200 20098', 'partial', 2250, 85),
('std-100', 'Eashan Bose', 'eashan.bose@hostelos.edu', '+91 98201 10099', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Eashan%20Bose&backgroundColor=0284c7&textColor=ffffff', 'A-501', 'Block A (Newton)', 'Bed 4', '21BCS100', 'B.Tech IT', 4, 'Bose Senior', '+91 98200 20099', 'paid', 0, 86),
('std-101', 'Hardik Majumdar', 'hardik.majumdar@hostelos.edu', '+91 98201 10100', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Hardik%20Majumdar&backgroundColor=0284c7&textColor=ffffff', 'A-502', 'Block A (Newton)', 'Bed 1', '21BCS101', 'B.Tech CSE', 1, 'Majumdar Senior', '+91 98200 20100', 'paid', 0, 87),
('std-102', 'Jaideep Chakraborty', 'jaideep.chakraborty@hostelos.edu', '+91 98201 10101', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Jaideep%20Chakraborty&backgroundColor=0284c7&textColor=ffffff', 'A-502', 'Block A (Newton)', 'Bed 2', '21BCS102', 'B.Tech ECE', 2, 'Chakraborty Senior', '+91 98200 20101', 'paid', 0, 88),
('std-103', 'Chetan Ganguly', 'chetan.ganguly@hostelos.edu', '+91 98201 10102', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Chetan%20Ganguly&backgroundColor=0284c7&textColor=ffffff', 'A-502', 'Block A (Newton)', 'Bed 3', '21BCS103', 'B.Tech ME', 3, 'Ganguly Senior', '+91 98200 20102', 'pending', 4500, 89),
('std-104', 'Hemant Mitra', 'hemant.mitra@hostelos.edu', '+91 98201 10103', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Hemant%20Mitra&backgroundColor=0284c7&textColor=ffffff', 'A-502', 'Block A (Newton)', 'Bed 4', '21BCS104', 'B.Tech CE', 4, 'Mitra Senior', '+91 98200 20103', 'partial', 2250, 90),
('std-105', 'Jitin Saha', 'jitin.saha@hostelos.edu', '+91 98201 10104', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Jitin%20Saha&backgroundColor=0284c7&textColor=ffffff', 'A-503', 'Block A (Newton)', 'Bed 1', '21BCS105', 'B.Tech IT', 1, 'Saha Senior', '+91 98200 20104', 'paid', 0, 91),
('std-106', 'Kishan Patel', 'kishan.patel@hostelos.edu', '+91 98201 10105', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Kishan%20Patel&backgroundColor=0284c7&textColor=ffffff', 'A-503', 'Block A (Newton)', 'Bed 2', '21BCS106', 'B.Tech CSE', 2, 'Patel Senior', '+91 98200 20105', 'paid', 0, 92),
('std-107', 'Manav Dixit', 'manav.dixit@hostelos.edu', '+91 98201 10106', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Manav%20Dixit&backgroundColor=0284c7&textColor=ffffff', 'A-503', 'Block A (Newton)', 'Bed 3', '21BCS107', 'B.Tech ECE', 3, 'Dixit Senior', '+91 98200 20106', 'paid', 0, 93),
('std-108', 'Nishant Mehta', 'nishant.mehta@hostelos.edu', '+91 98201 10107', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Nishant%20Mehta&backgroundColor=0284c7&textColor=ffffff', 'A-503', 'Block A (Newton)', 'Bed 4', '21BCS108', 'B.Tech ME', 4, 'Mehta Senior', '+91 98200 20107', 'pending', 4500, 94),
('std-109', 'Vedant Shah', 'vedant.shah@hostelos.edu', '+91 98201 10108', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Vedant%20Shah&backgroundColor=0284c7&textColor=ffffff', 'A-504', 'Block A (Newton)', 'Bed 1', '21BCS109', 'B.Tech CE', 1, 'Shah Senior', '+91 98200 20108', 'partial', 2250, 95),
('std-110', 'Yuvraj Kulkarni', 'yuvraj.kulkarni@hostelos.edu', '+91 98201 10109', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Yuvraj%20Kulkarni&backgroundColor=0284c7&textColor=ffffff', 'A-504', 'Block A (Newton)', 'Bed 2', '21BCS110', 'B.Tech IT', 2, 'Kulkarni Senior', '+91 98200 20109', 'paid', 0, 96),
('std-111', 'Sachin Joshi', 'sachin.joshi@hostelos.edu', '+91 98201 10110', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Sachin%20Joshi&backgroundColor=0284c7&textColor=ffffff', 'A-504', 'Block A (Newton)', 'Bed 3', '21BCS111', 'B.Tech CSE', 3, 'Joshi Senior', '+91 98200 20110', 'paid', 0, 97),
('std-112', 'Tushar Deshmukh', 'tushar.deshmukh@hostelos.edu', '+91 98201 10111', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Tushar%20Deshmukh&backgroundColor=0284c7&textColor=ffffff', 'A-504', 'Block A (Newton)', 'Bed 4', '21BCS112', 'B.Tech ECE', 4, 'Deshmukh Senior', '+91 98200 20111', 'paid', 0, 98),
('std-113', 'Akash Marathe', 'akash.marathe@hostelos.edu', '+91 98201 10112', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Akash%20Marathe&backgroundColor=0284c7&textColor=ffffff', 'A-505', 'Block A (Newton)', 'Bed 1', '21BCS113', 'B.Tech ME', 1, 'Marathe Senior', '+91 98200 20112', 'pending', 4500, 85),
('std-114', 'Sameer Pawar', 'sameer.pawar@hostelos.edu', '+91 98201 10113', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Sameer%20Pawar&backgroundColor=0284c7&textColor=ffffff', 'A-505', 'Block A (Newton)', 'Bed 2', '21BCS114', 'B.Tech CE', 2, 'Pawar Senior', '+91 98200 20113', 'partial', 2250, 86),
('std-115', 'Pankaj Shinde', 'pankaj.shinde@hostelos.edu', '+91 98201 10114', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Pankaj%20Shinde&backgroundColor=0284c7&textColor=ffffff', 'A-505', 'Block A (Newton)', 'Bed 3', '21BCS115', 'B.Tech IT', 3, 'Shinde Senior', '+91 98200 20114', 'paid', 0, 87),
('std-116', 'Sumit Patil', 'sumit.patil@hostelos.edu', '+91 98201 10115', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Sumit%20Patil&backgroundColor=0284c7&textColor=ffffff', 'A-505', 'Block A (Newton)', 'Bed 4', '21BCS116', 'B.Tech CSE', 4, 'Patil Senior', '+91 98200 20115', 'paid', 0, 88),
('std-117', 'Milind Chavan', 'milind.chavan@hostelos.edu', '+91 98201 10116', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Milind%20Chavan&backgroundColor=0284c7&textColor=ffffff', 'A-506', 'Block A (Newton)', 'Bed 1', '21BCS117', 'B.Tech ECE', 1, 'Chavan Senior', '+91 98200 20116', 'paid', 0, 89),
('std-118', 'Makarand Gaikwad', 'makarand.gaikwad@hostelos.edu', '+91 98201 10117', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Makarand%20Gaikwad&backgroundColor=0284c7&textColor=ffffff', 'A-506', 'Block A (Newton)', 'Bed 2', '21BCS118', 'B.Tech ME', 2, 'Gaikwad Senior', '+91 98200 20117', 'pending', 4500, 90),
('std-119', 'Sarang Bhosale', 'sarang.bhosale@hostelos.edu', '+91 98201 10118', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Sarang%20Bhosale&backgroundColor=0284c7&textColor=ffffff', 'A-506', 'Block A (Newton)', 'Bed 3', '21BCS119', 'B.Tech CE', 3, 'Bhosale Senior', '+91 98200 20118', 'partial', 2250, 91),
('std-120', 'Swapnil Deshpande', 'swapnil.deshpande@hostelos.edu', '+91 98201 10119', 'student', 'https://api.dicebear.com/9.x/initials/svg?seed=Swapnil%20Deshpande&backgroundColor=0284c7&textColor=ffffff', 'A-506', 'Block A (Newton)', 'Bed 4', '21BCS120', 'B.Tech IT', 4, 'Deshpande Senior', '+91 98200 20119', 'paid', 0, 92)
ON CONFLICT (id) DO UPDATE SET full_name=EXCLUDED.full_name, email=EXCLUDED.email, phone=EXCLUDED.phone, room_number=EXCLUDED.room_number, block_name=EXCLUDED.block_name, bed_number=EXCLUDED.bed_number, roll_no=EXCLUDED.roll_no, course=EXCLUDED.course, year=EXCLUDED.year, fee_status=EXCLUDED.fee_status, fee_amount_due=EXCLUDED.fee_amount_due, attendance_percent=EXCLUDED.attendance_percent;

-- 6. Seed Active Allocations
INSERT INTO public.allocations (student_id, room_id, room_number, bed_number, is_active) VALUES
('usr-student-1', 'rm-a-101', 'A-101', 'Bed 1', TRUE),
('std-2', 'rm-a-101', 'A-101', 'Bed 2', TRUE),
('std-3', 'rm-a-101', 'A-101', 'Bed 3', TRUE),
('std-4', 'rm-a-101', 'A-101', 'Bed 4', TRUE),
('std-5', 'rm-a-102', 'A-102', 'Bed 1', TRUE),
('std-6', 'rm-a-102', 'A-102', 'Bed 2', TRUE),
('std-7', 'rm-a-102', 'A-102', 'Bed 3', TRUE),
('std-8', 'rm-a-102', 'A-102', 'Bed 4', TRUE),
('std-9', 'rm-a-103', 'A-103', 'Bed 1', TRUE),
('std-10', 'rm-a-103', 'A-103', 'Bed 2', TRUE),
('std-11', 'rm-a-103', 'A-103', 'Bed 3', TRUE),
('std-12', 'rm-a-103', 'A-103', 'Bed 4', TRUE),
('std-13', 'rm-a-104', 'A-104', 'Bed 1', TRUE),
('std-14', 'rm-a-104', 'A-104', 'Bed 2', TRUE),
('std-15', 'rm-a-104', 'A-104', 'Bed 3', TRUE),
('std-16', 'rm-a-104', 'A-104', 'Bed 4', TRUE),
('std-17', 'rm-a-105', 'A-105', 'Bed 1', TRUE),
('std-18', 'rm-a-105', 'A-105', 'Bed 2', TRUE),
('std-19', 'rm-a-105', 'A-105', 'Bed 3', TRUE),
('std-20', 'rm-a-105', 'A-105', 'Bed 4', TRUE),
('std-21', 'rm-a-106', 'A-106', 'Bed 1', TRUE),
('std-22', 'rm-a-106', 'A-106', 'Bed 2', TRUE),
('std-23', 'rm-a-106', 'A-106', 'Bed 3', TRUE),
('std-24', 'rm-a-106', 'A-106', 'Bed 4', TRUE),
('std-25', 'rm-a-201', 'A-201', 'Bed 1', TRUE),
('std-26', 'rm-a-201', 'A-201', 'Bed 2', TRUE),
('std-27', 'rm-a-201', 'A-201', 'Bed 3', TRUE),
('std-28', 'rm-a-201', 'A-201', 'Bed 4', TRUE),
('std-29', 'rm-a-202', 'A-202', 'Bed 1', TRUE),
('std-30', 'rm-a-202', 'A-202', 'Bed 2', TRUE),
('std-31', 'rm-a-202', 'A-202', 'Bed 3', TRUE),
('std-32', 'rm-a-202', 'A-202', 'Bed 4', TRUE),
('std-33', 'rm-a-203', 'A-203', 'Bed 1', TRUE),
('std-34', 'rm-a-203', 'A-203', 'Bed 2', TRUE),
('std-35', 'rm-a-203', 'A-203', 'Bed 3', TRUE),
('std-36', 'rm-a-203', 'A-203', 'Bed 4', TRUE),
('std-37', 'rm-a-204', 'A-204', 'Bed 1', TRUE),
('std-38', 'rm-a-204', 'A-204', 'Bed 2', TRUE),
('std-39', 'rm-a-204', 'A-204', 'Bed 3', TRUE),
('std-40', 'rm-a-204', 'A-204', 'Bed 4', TRUE),
('std-41', 'rm-a-205', 'A-205', 'Bed 1', TRUE),
('std-42', 'rm-a-205', 'A-205', 'Bed 2', TRUE),
('std-43', 'rm-a-205', 'A-205', 'Bed 3', TRUE),
('std-44', 'rm-a-205', 'A-205', 'Bed 4', TRUE),
('std-45', 'rm-a-206', 'A-206', 'Bed 1', TRUE),
('std-46', 'rm-a-206', 'A-206', 'Bed 2', TRUE),
('std-47', 'rm-a-206', 'A-206', 'Bed 3', TRUE),
('std-48', 'rm-a-206', 'A-206', 'Bed 4', TRUE),
('std-49', 'rm-a-301', 'A-301', 'Bed 1', TRUE),
('std-50', 'rm-a-301', 'A-301', 'Bed 2', TRUE),
('std-51', 'rm-a-301', 'A-301', 'Bed 3', TRUE),
('std-52', 'rm-a-301', 'A-301', 'Bed 4', TRUE),
('std-53', 'rm-a-302', 'A-302', 'Bed 1', TRUE),
('std-54', 'rm-a-302', 'A-302', 'Bed 2', TRUE),
('std-55', 'rm-a-302', 'A-302', 'Bed 3', TRUE),
('std-56', 'rm-a-302', 'A-302', 'Bed 4', TRUE),
('std-57', 'rm-a-303', 'A-303', 'Bed 1', TRUE),
('std-58', 'rm-a-303', 'A-303', 'Bed 2', TRUE),
('std-59', 'rm-a-303', 'A-303', 'Bed 3', TRUE),
('std-60', 'rm-a-303', 'A-303', 'Bed 4', TRUE),
('std-61', 'rm-a-304', 'A-304', 'Bed 1', TRUE),
('std-62', 'rm-a-304', 'A-304', 'Bed 2', TRUE),
('std-63', 'rm-a-304', 'A-304', 'Bed 3', TRUE),
('std-64', 'rm-a-304', 'A-304', 'Bed 4', TRUE),
('std-65', 'rm-a-305', 'A-305', 'Bed 1', TRUE),
('std-66', 'rm-a-305', 'A-305', 'Bed 2', TRUE),
('std-67', 'rm-a-305', 'A-305', 'Bed 3', TRUE),
('std-68', 'rm-a-305', 'A-305', 'Bed 4', TRUE),
('std-69', 'rm-a-306', 'A-306', 'Bed 1', TRUE),
('std-70', 'rm-a-306', 'A-306', 'Bed 2', TRUE),
('std-71', 'rm-a-306', 'A-306', 'Bed 3', TRUE),
('std-72', 'rm-a-306', 'A-306', 'Bed 4', TRUE),
('std-73', 'rm-a-401', 'A-401', 'Bed 1', TRUE),
('std-74', 'rm-a-401', 'A-401', 'Bed 2', TRUE),
('std-75', 'rm-a-401', 'A-401', 'Bed 3', TRUE),
('std-76', 'rm-a-401', 'A-401', 'Bed 4', TRUE),
('std-77', 'rm-a-402', 'A-402', 'Bed 1', TRUE),
('std-78', 'rm-a-402', 'A-402', 'Bed 2', TRUE),
('std-79', 'rm-a-402', 'A-402', 'Bed 3', TRUE),
('std-80', 'rm-a-402', 'A-402', 'Bed 4', TRUE),
('std-81', 'rm-a-403', 'A-403', 'Bed 1', TRUE),
('std-82', 'rm-a-403', 'A-403', 'Bed 2', TRUE),
('std-83', 'rm-a-403', 'A-403', 'Bed 3', TRUE),
('std-84', 'rm-a-403', 'A-403', 'Bed 4', TRUE),
('std-85', 'rm-a-404', 'A-404', 'Bed 1', TRUE),
('std-86', 'rm-a-404', 'A-404', 'Bed 2', TRUE),
('std-87', 'rm-a-404', 'A-404', 'Bed 3', TRUE),
('std-88', 'rm-a-404', 'A-404', 'Bed 4', TRUE),
('std-89', 'rm-a-405', 'A-405', 'Bed 1', TRUE),
('std-90', 'rm-a-405', 'A-405', 'Bed 2', TRUE),
('std-91', 'rm-a-405', 'A-405', 'Bed 3', TRUE),
('std-92', 'rm-a-405', 'A-405', 'Bed 4', TRUE),
('std-93', 'rm-a-406', 'A-406', 'Bed 1', TRUE),
('std-94', 'rm-a-406', 'A-406', 'Bed 2', TRUE),
('std-95', 'rm-a-406', 'A-406', 'Bed 3', TRUE),
('std-96', 'rm-a-406', 'A-406', 'Bed 4', TRUE),
('std-97', 'rm-a-501', 'A-501', 'Bed 1', TRUE),
('std-98', 'rm-a-501', 'A-501', 'Bed 2', TRUE),
('std-99', 'rm-a-501', 'A-501', 'Bed 3', TRUE),
('std-100', 'rm-a-501', 'A-501', 'Bed 4', TRUE),
('std-101', 'rm-a-502', 'A-502', 'Bed 1', TRUE),
('std-102', 'rm-a-502', 'A-502', 'Bed 2', TRUE),
('std-103', 'rm-a-502', 'A-502', 'Bed 3', TRUE),
('std-104', 'rm-a-502', 'A-502', 'Bed 4', TRUE),
('std-105', 'rm-a-503', 'A-503', 'Bed 1', TRUE),
('std-106', 'rm-a-503', 'A-503', 'Bed 2', TRUE),
('std-107', 'rm-a-503', 'A-503', 'Bed 3', TRUE),
('std-108', 'rm-a-503', 'A-503', 'Bed 4', TRUE),
('std-109', 'rm-a-504', 'A-504', 'Bed 1', TRUE),
('std-110', 'rm-a-504', 'A-504', 'Bed 2', TRUE),
('std-111', 'rm-a-504', 'A-504', 'Bed 3', TRUE),
('std-112', 'rm-a-504', 'A-504', 'Bed 4', TRUE),
('std-113', 'rm-a-505', 'A-505', 'Bed 1', TRUE),
('std-114', 'rm-a-505', 'A-505', 'Bed 2', TRUE),
('std-115', 'rm-a-505', 'A-505', 'Bed 3', TRUE),
('std-116', 'rm-a-505', 'A-505', 'Bed 4', TRUE),
('std-117', 'rm-a-506', 'A-506', 'Bed 1', TRUE),
('std-118', 'rm-a-506', 'A-506', 'Bed 2', TRUE),
('std-119', 'rm-a-506', 'A-506', 'Bed 3', TRUE),
('std-120', 'rm-a-506', 'A-506', 'Bed 4', TRUE);

COMMIT;
