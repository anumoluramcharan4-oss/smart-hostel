import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  Shield,
  Bot,
  Zap,
  CheckCircle2,
  Users,
  Building,
  Utensils,
  Calendar,
  AlertCircle,
  BarChart3,
  Moon,
  Sun,
  FileCheck,
  ChevronDown,
} from 'lucide-react'
import { useTheme } from '@/app/ThemeContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'

export const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [rolePreviewTab, setRolePreviewTab] = useState<'student' | 'warden' | 'admin'>('student')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  const features = [
    {
      icon: <AlertCircle className="w-5 h-5 text-indigo-600" />,
      title: 'AI Complaint Triage',
      desc: 'Automatic category identification, priority detection (SLA-based), and smart routing to electricians and plumbers in seconds.',
    },
    {
      icon: <Building className="w-5 h-5 text-emerald-600" />,
      title: 'Dynamic Room Management',
      desc: 'Real-time occupancy grids across blocks, floors, and rooms. Monitor check-ins, vacant beds, and asset inventories.',
    },
    {
      icon: <Calendar className="w-5 h-5 text-purple-600" />,
      title: 'Digital Outpass & Leave',
      desc: 'Seamless student leave applications with automated date validation, guardian contact verification, and one-tap warden approvals.',
    },
    {
      icon: <Utensils className="w-5 h-5 text-amber-600" />,
      title: 'Mess Feedback & AI Sentiment',
      desc: 'Meal-by-meal ratings and natural language sentiment processing to highlight quality dips and eliminate food waste.',
    },
    {
      icon: <Bot className="w-5 h-5 text-sky-600" />,
      title: '24/7 AI Hostel Assistant',
      desc: 'Instant answers to rules, curfew timings, and policies grounded in verified handbook citations with strict safety boundaries.',
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-rose-600" />,
      title: 'Predictive Analytics & Reports',
      desc: 'Spot recurring equipment failures before breakdowns occur, track SLA compliance, and export certified CSV summaries.',
    },
  ]

  const faqs = [
    {
      q: 'How does the AI auto-classify maintenance complaints?',
      a: 'The system uses natural language embeddings to parse student text, extract keywords (like sparks, leaks, or tripping), assign urgency levels (Critical, High, Medium, Low), and route the ticket directly to the appropriate staff with SLA countdowns.',
    },
    {
      q: 'How are roles and permissions isolated between students and wardens?',
      a: 'Smart Hostel enforces strict Role-Based Access Control (RBAC). Students only have access to their personal room, outpasses, and complaints. Wardens manage block allocations and triage, while administrators oversee the entire multi-hostel estate.',
    },
    {
      q: 'Does the application work offline or during network outages?',
      a: 'Yes, the client architecture features an intelligent in-memory state engine and graceful offline fallbacks that sync once connectivity is restored.',
    },
    {
      q: 'Can parents receive notifications for late leave approvals?',
      a: 'Yes, leave requests can trigger SMS/Email notifications upon warden approval or rejection, complete with digital gate entry timestamps.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-500/20 selection:text-indigo-600">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Smart Hostel
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Features
            </a>
            <a href="#roles" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Roles
            </a>
            <a href="#ai" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              AI Intelligence
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              How it Works
            </a>
            <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>

            <Link to="/login">
              <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 mb-6 animate-fade-in">
            <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Next-Generation Residential Operations</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900 dark:text-slate-50 max-w-4xl mx-auto leading-tight">
            Smart Hostel Management,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600">
              Powered by AI
            </span>
          </h1>

          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            One intelligent platform for students, wardens, and hostel administrators.
            Accelerate maintenance, automate outpasses, analyze dining quality, and prevent equipment downtime.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Get Started Now
            </Button>
            <a href="#features">
              <Button size="lg" variant="outline">
                Explore Features
              </Button>
            </a>
          </div>

          {/* Realistic Dashboard Mockup built with real components */}
          <div className="mt-16 mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="ml-3 text-xs font-semibold text-slate-400">
                  smart-hostel.app / live-dashboard-preview
                </span>
              </div>
              <Badge variant="success" dot size="sm">
                Live AI Triage Active
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Hostel Occupancy"
                value="312 / 360"
                subtext="86.7% capacity occupied"
                trend={{ value: '+4.2%', isPositive: true, label: 'vs last term' }}
                icon={<Building className="w-5 h-5 text-indigo-600" />}
              />
              <StatCard
                title="Active Complaints"
                value="18"
                subtext="Avg SLA resolution: 3.2 hrs"
                trend={{ value: '-22%', isPositive: true, label: 'turnaround time' }}
                icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
                iconColor="amber"
              />
              <StatCard
                title="Mess Satisfaction"
                value="4.1 / 5.0"
                subtext="142 meal reviews this week"
                trend={{ value: '+0.3', isPositive: true, label: 'rating boost' }}
                icon={<Utensils className="w-5 h-5 text-emerald-600" />}
                iconColor="emerald"
              />
            </div>

            {/* Quick Live Preview Table */}
            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recent Auto-Triaged Tickets
                </span>
                <span className="text-xs text-indigo-600 font-semibold cursor-pointer">
                  View Full Queue →
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <Badge variant="critical">Critical</Badge>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Sparks from geyser switchboard (Room B-301)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>Electrician सुरेश कुमार assigned</span>
                    <Badge variant="warning">In Progress</Badge>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <Badge variant="warning">Medium</Badge>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Ceiling fan clicking noise (Room A-204)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>AI Confidence: 94%</span>
                    <Badge variant="pending">Pending Visit</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">98.4%</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">SLA Compliance Rate</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">&lt; 2 Hrs</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Critical Fault Turnaround</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">300+</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Students Managed</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">Zero</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Paper Forms or Manual Slips</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge variant="pending" size="sm" className="mb-3">
              Commercial Quality Architecture
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              Everything Your Institution Needs in One System
            </h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Engineered with strict TypeScript contracts, modular domain workflows, and enterprise design standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <Card key={idx} className="hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
                  {feat.icon}
                </div>
                <CardTitle className="text-base">{feat.title}</CardTitle>
                <CardDescription className="mt-2 text-xs leading-relaxed">
                  {feat.desc}
                </CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Every Role Section */}
      <section id="roles" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Built for Every Role in Campus Life
            </h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Dedicated interfaces tailored for students, wardens, and administrators.
            </p>

            {/* Role Tabs */}
            <div className="mt-6 inline-flex rounded-xl bg-slate-200 p-1 dark:bg-slate-800">
              {(['student', 'warden', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRolePreviewTab(r)}
                  className={`px-5 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                    rolePreviewTab === r
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {r} Experience
                </button>
              ))}
            </div>
          </div>

          {/* Role Preview Card */}
          <div className="mx-auto max-w-4xl">
            {rolePreviewTab === 'student' && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Student Experience (/student/*)</h3>
                    <p className="text-xs text-slate-500">Autonomous room, outpass, complaints, and AI assistant portal.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Instant Outpass Submissions</p>
                    <p className="text-slate-500">No physical paperwork. Date pickers, parent contact confirmation, and real-time approval status.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">AI Interactive Assistant</p>
                    <p className="text-slate-500">Ask questions about mess timings, laundry days, and handbook rules with cited sources.</p>
                  </div>
                </div>
              </Card>
            )}

            {rolePreviewTab === 'warden' && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Warden Console (/warden/*)</h3>
                    <p className="text-xs text-slate-500">High-efficiency triage, room grids, and leave approval workflows.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Visual Occupancy Grid</p>
                    <p className="text-slate-500">Inspect room capacity, occupants, and maintenance status across all 4 floors at a glance.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">One-Click Staff Dispatch</p>
                    <p className="text-slate-500">Assign complaints to electricians and plumbers with automated updates sent to students.</p>
                  </div>
                </div>
              </Card>
            )}

            {rolePreviewTab === 'admin' && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Administrator Operations (/admin/*)</h3>
                    <p className="text-xs text-slate-500">Campus-wide KPIs, mess caterer oversight, and settings configuration.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Cross-Hostel Analytics</p>
                    <p className="text-slate-500">Track resolution times, SLA bottlenecks, and equipment wear patterns over time.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Role & Permission Control</p>
                    <p className="text-slate-500">Granularly manage users, wardens, block assignments, and campus broadcast notices.</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* AI Intelligence Section */}
      <section id="ai" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="pending" size="sm" className="mb-3">
                Built-in Intelligence
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Deterministic Safety Meets Generative AI
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Powered by the Google Gemini API with fallback keyword classification and scikit-learn models.
                The system provides continuous reliability even if API quotas or keys expire.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Predictive Equipment Failure</h4>
                    <p className="text-slate-500 mt-0.5">Identifies geyser and electrical busbar anomalies before outages hit students.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Mess Sentiment Analytics</h4>
                    <p className="text-slate-500 mt-0.5">Unsupervised meal feedback clustering to alert caterers on spice and freshness issues.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Grounded Hostel Q&A</h4>
                    <p className="text-slate-500 mt-0.5">Cites exact handbook rule numbers and safely refuses prompt injections.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 dark:border-indigo-900/50 dark:from-indigo-950/20 dark:to-purple-950/20">
              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-md dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Live AI Inference Demo
                  </span>
                  <Badge variant="success" size="sm">Gemini 1.5 Flash</Badge>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60 text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Input Text</span>
                  <p className="italic text-slate-700 dark:text-slate-300">
                    "Water heater in 3rd floor washroom tripping the main MCB with sparks"
                  </p>
                </div>

                <div className="rounded-lg bg-indigo-50/80 p-3 dark:bg-indigo-950/40 text-xs space-y-1.5 border border-indigo-100 dark:border-indigo-900">
                  <span className="text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-bold block">
                    Structured Classification Output
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Category:</span>
                    <strong className="text-slate-900 dark:text-slate-100">Electrical / Geyser</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Urgency:</span>
                    <Badge variant="critical">CRITICAL (2hr SLA)</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Confidence Score:</span>
                    <strong className="text-emerald-600">98.2%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="pending" size="sm" className="mb-3">Simplicity First</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            How Smart Hostel Works in 3 Steps
          </h2>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm mb-4">
                1
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Student Logs Request</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Students report a room issue, request leave, or rate today's lunch through their responsive mobile or web dashboard.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm mb-4">
                2
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">AI Triage & Routing</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                The AI engine tags category, verifies outpass dates, flags urgent risks, and immediately alerts the relevant block warden.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm mb-4">
                3
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Resolution & Audit Trail</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Staff completes maintenance, wardens confirm outpasses, and administrators inspect real-time SLA completion reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Got questions about implementation, data privacy, or roles?
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between p-4 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="p-4 pt-0 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight">
            Ready to Modernize Your Hostel Operations?
          </h2>
          <p className="mt-3 text-sm text-indigo-200 max-w-xl mx-auto leading-relaxed">
            Experience the full multi-role platform with zero friction. Explore pre-seeded student, warden, and admin accounts now.
          </p>
          <div className="mt-8">
            <Link to="/login">
              <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold">
                Launch Live Prototype
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Smart Hostel</span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-500 italic">One smart platform for a better hostel experience.</span>
          </div>
          <div className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Smart Hostel. Enterprise-grade residential intelligence.
          </div>
        </div>
      </footer>
    </div>
  )
}
