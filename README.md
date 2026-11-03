# HostelOS — Modern SaaS Hostel Management System

HostelOS is an enterprise-grade, modern SaaS platform engineered for university student housing and residential life operations. It provides a Linear/Vercel/Stripe-grade dashboard for **Chief Administrators**, **Resident Wardens**, and **Students**.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router) + TypeScript
- **Styling**: Tailwind CSS + Custom Design System tokens + Glassmorphism-lite
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Data Visualizations**: Recharts (Composed Inflow Area/Bar Timeline, Issue Category Donut, Block Occupancy Gauges)
- **Data Tables**: TanStack Table (Sorting, Filtering, Pagination, Skeleton Loaders)
- **Forms & Validation**: React Hook Form + Zod
- **Notifications**: Sonner Toasts
- **Theming**: Next-Themes (Light / Deep Navy Dark Mode)
- **API Client**: Modular client (`frontend/lib/api.ts`) supporting mock data and toggleable FastAPI backend (`NEXT_PUBLIC_USE_API=true`)
- **Backend API**: Python FastAPI (`backend/app/main.py`) with CORS enabled for `http://localhost:3000`

---

## Quick Start (Single Command)

To run the entire app (both FastAPI backend on port 8000 and Next.js frontend on port 3000) with a single command:

```bash
./start.sh
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Core**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- Press **Ctrl+C** to shut down both servers cleanly.

---

## Mac Manual Start Guide

### 1. Prerequisites
Ensure Node.js 18+ and Python 3.10+ are installed on your Mac:
```bash
node -v
python3 --version
```

### 2. Run the Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

To verify a production build:
```bash
cd frontend
npm run build
```

### 3. Run the FastAPI Backend (Alongside Frontend)
In a second terminal window from the project root:
```bash
source .venv/bin/activate   # or source venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```
- API Docs: **[http://localhost:8000/docs](http://localhost:8000/docs)**
- Health Check: **[http://localhost:8000/health](http://localhost:8000/health)**

---

## Role Portals & Routes

HostelOS features a role switcher in the top bar and `/login` page:

### 1. Chief Administrator / Management Console (`/admin`)
- **Management Console Dashboard**: Matches the enterprise reference UI with 6 top KPI cards, 10-month Inflow Timeline chart, Issue Category Donut, Block Occupancy ratios, Urgent Maintenance Queue with SLA indicators, Student turnstile movements, and IoT sensor utilities.
- **Users**: `/admin/users` (TanStack Table directory of residents and staff).
- **Occupancy**: `/admin/occupancy` (Block-by-block and floor capacity analytics).
- **Treasury & Fees**: `/admin/fees` (Invoice ledger and collection tracking).
- **Reports**: `/admin/reports` (Audit reports & certified data exports).
- **Settings**: `/admin/settings` (Curfew cutoffs, biometric rules, mess timings).

### 2. Resident Warden (`/warden`)
- **Triage Dashboard**: `/warden` (Urgent attention cards & quick roll-call).
- **Students**: `/warden/students` (Resident roster with filters).
- **Room Allocation**: `/warden/rooms` (Visual floor map tile grid with slide-over assignment drawer).
- **Complaints Kanban**: `/warden/complaints` (Pending, In Progress, Resolved columns with status actions).
- **Attendance**: `/warden/attendance` (14-day turnout heatmap & daily roll-call scanner).
- **Notices**: `/warden/notices` (Circular publisher with rich composer modal).

### 3. Student Resident (`/student`)
- **Overview Dashboard**: `/student` (Greeting, Room & Bed card with roommates avatars, active tickets).
- **Complaints**: `/student/complaints` (Progress stepper timeline and new ticket modal).
- **Notices**: `/student/notices` (Circular feed with priority and pinned badges).
- **Fees**: `/student/fees` (Invoice list, instant checkout simulation, receipt download).
- **Profile**: `/student/profile` (Academic info, emergency contacts, room allocation).

---

## Demo Credentials & Portals

HostelOS provides instant quick-switch buttons as well as credential authentication:

| Role | Name | Email | Password | Assigned Unit / Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Administrator** | Chief Administrator | `admin@hostelos.edu` | `password123` | Full Campus HQ (`/admin`) |
| **Resident Warden** | Prof. Rajesh K. Sharma | `rajesh.sharma@hostelos.edu` | `password123` | Block A (Newton) (`/warden`) |
| **Student Resident 1** | Aarav Patel | `aarav.patel@hostelos.edu` | `password123` | Room A-101 · Bed 1 (`/student`) |
| **Student Resident 2** | Kabir Sen | `kabir.sen@hostelos.edu` | `password123` | Room A-101 · Bed 2 (`/student`) |
| **Student Resident 3** | Dev Dixit | `dev.dixit@hostelos.edu` | `password123` | Room A-101 · Bed 3 (`/student`) |

---

## Hostel Architecture & Seeding

The hostel structure has been standardized to a single high-density building with 100% full allocation:
- **1 Building**: Block A (Newton), Undergrad Men's Wing
- **5 Floors**, 6 quad rooms per floor = **30 rooms total** (`A-101` to `A-506`)
- **4 beds per room** (`Bed 1` to `Bed 4`) = **120 beds total**
- **120 Students**, all allocated (100.0% occupancy rate, 0 vacant beds)
- 120 unique, realistic Indian male names spread across academic Years 1–4 and engineering streams (BCS, BEC, BME, BCE, BIT)
- 25 maintenance complaint tickets with room and block tagging
- 120 fee records (70% Paid, 20% Pending, 10% Partial)

### How to Re-run Database Seed (Idempotent)
To re-seed the SQLite database idempotently in a single transaction:
```bash
PYTHONPATH=. ./venv/bin/python backend/seed.py
```
To seed Supabase directly:
```bash
# Execute supabase_seed.sql in your Supabase SQL Editor
```

### Database Migrations (Alembic)
```bash
PYTHONPATH=. ./venv/bin/alembic upgrade head
```

### Running Test Suite
Execute the pytest suite covering double-booking rejection, single active allocation constraint, deallocate/re-allocate flow, atomic transfers, and floor filtering:
```bash
PYTHONPATH=. ./venv/bin/pytest tests/ -v
```

### How to Restore Database from Backup
Backups are archived in the `backups/` directory:
```bash
cp backups/smart_hostel_backup_20261102_231651.db smart_hostel.db
```

---

## License & Copyright

© 2026 HostelOS Systems Inc. All rights reserved.
