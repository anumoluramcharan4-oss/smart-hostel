import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Sparkles,
  User as UserIcon,
  Shield,
  Building,
  Lock,
  ArrowRight,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { useToast } from '@/app/ToastContext'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

export const RoleSelectPage: React.FC = () => {
  const { user, hasRole, switchRole, logout, login } = useAuth()
  const navigate = useNavigate()
  const { success } = useToast()

  const handleSelectRole = async (role: Role) => {
    if (!user || !hasRole(role)) return

    try {
      await switchRole(role)
      success(`Entering ${role.toUpperCase()} workspace`)
      navigate(`/${role}/dashboard`)
    } catch (e) {
      console.error(e)
    }
  }

  const handleQuickDemoSwitch = async (email: string) => {
    try {
      const logged = await login(email)
      success(`Switched to demo account: ${logged.name}`)
      if (logged.roles.length === 1) {
        navigate(`/${logged.roles[0]}/dashboard`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleDefinitions: Array<{
    role: Role
    title: string
    category: string
    description: string
    features: string[]
    icon: React.ReactNode
    accentColor: string
    themeBorder: string
    btnClass: string
  }> = [
    {
      role: 'student',
      title: 'Student Portal',
      category: 'Residential Living',
      description:
        'Access your room details, submit AI-triaged maintenance complaints, apply for overnight outpasses, review mess meals, and chat with the 24/7 handbook assistant.',
      features: [
        'Room 360° & Roommate Details',
        'Raise Complaints with AI SLA Triage',
        'Digital Leave & Outpass Applications',
        'Mess Quality Ratings & AI Assistant',
      ],
      icon: <UserIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      accentColor: 'bg-indigo-50 dark:bg-indigo-950/50',
      themeBorder: 'hover:border-indigo-500 hover:shadow-indigo-500/10',
      btnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    {
      role: 'warden',
      title: 'Warden Console',
      category: 'Block Supervision',
      description:
        'Supervise hostel blocks, review real-time occupancy grids, dispatch maintenance technicians, approve or reject leave requests with audit notes, and monitor catering sentiment.',
      features: [
        'Interactive Floor & Occupancy Grids',
        'Complaint Triage & Staff Assignment',
        'Leave Reviews (Approve / Reject)',
        'Dining Sentiment Health & AI Alerts',
      ],
      icon: <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      accentColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      themeBorder: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      role: 'admin',
      title: 'Admin Operations',
      category: 'Campus Governance',
      description:
        'Oversee multi-hostel residential capacity, manage student records and warden assignments, analyze cross-facility SLA trends, and configure gate timings and hostel policies.',
      features: [
        'Multi-Hostel & Block Allocations',
        'Campus-wide Analytics & SLA Trends',
        'Certified CSV Audit Registers',
        'Gate Curfew & Policy Configuration',
      ],
      icon: <Building className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      accentColor: 'bg-purple-50 dark:bg-purple-950/50',
      themeBorder: 'hover:border-purple-500 hover:shadow-purple-500/10',
      btnClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-12 transition-colors">
      {/* Top Header */}
      <div className="mx-auto w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Smart Hostel
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              One smart platform for a better hostel experience
            </p>
          </div>
        </Link>

        {user && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 shadow-sm">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" status="online" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400">
                {user.email} • Roles: <strong className="text-indigo-600 dark:text-indigo-400 capitalize">{user.roles.join(', ')}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Role Selection Section */}
      <div className="mx-auto w-full max-w-6xl py-8 sm:py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Select Your Workspace
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Your authenticated account holds specific permissions. Choose an authorized workspace below to launch your session.
          </p>
        </div>

        {/* 3 Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleDefinitions.map(
            ({
              role,
              title,
              category,
              description,
              features,
              icon,
              accentColor,
              themeBorder,
              btnClass,
            }) => {
              const isAllowed = hasRole(role)
              const tooltipMessage = `You don't have ${role === 'admin' ? 'Admin' : role === 'warden' ? 'Warden' : 'Student'} access`

              const cardContent = (
                <div
                  className={cn(
                    'relative flex flex-col justify-between h-full rounded-2xl border p-6 transition-all duration-200',
                    isAllowed
                      ? cn(
                          'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl',
                          themeBorder
                        )
                      : 'bg-slate-50/70 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                  )}
                >
                  <div>
                    {/* Top Row: Icon + Permission Pill */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn('p-3 rounded-2xl shadow-inner', accentColor)}>
                        {icon}
                      </div>

                      {isAllowed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authorized
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-full">
                          <Lock className="w-3.5 h-3.5" /> Restricted
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                      {category}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {description}
                    </p>

                    {/* Features list */}
                    <ul className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                      {features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {isAllowed ? (
                      <button
                        type="button"
                        onClick={() => handleSelectRole(role)}
                        className={cn(
                          'w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2',
                          btnClass
                        )}
                      >
                        <span>Enter {title}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-400 flex items-center justify-center gap-2 cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{tooltipMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              )

              if (!isAllowed) {
                return (
                  <Tooltip key={role} content={tooltipMessage} position="top" className="h-full">
                    {cardContent}
                  </Tooltip>
                )
              }

              return <div key={role} className="h-full">{cardContent}</div>
            }
          )}
        </div>

        {/* Demo Account Switcher Ribbon */}
        <div className="mt-12 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Demo Role Testing Controls
            </span>
            <span className="text-[11px] text-slate-400">
              Click any profile below to instantly test role permissions & disabled tooltips
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleQuickDemoSwitch('demo.all@hostel.dev')}
              className={cn(
                'p-3 rounded-xl border text-left transition-colors text-xs flex items-center justify-between',
                user?.email === 'demo.all@hostel.dev'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              )}
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">All Roles Account</p>
                <p className="text-[11px] text-slate-400 font-mono">demo.all@hostel.dev</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold">Student + Warden + Admin</p>
              </div>
              <span className="text-xs text-indigo-600 font-bold">Try →</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoSwitch('demo.warden@hostel.dev')}
              className={cn(
                'p-3 rounded-xl border text-left transition-colors text-xs flex items-center justify-between',
                user?.email === 'demo.warden@hostel.dev'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              )}
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Warden Account</p>
                <p className="text-[11px] text-slate-400 font-mono">demo.warden@hostel.dev</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Student + Warden (No Admin)</p>
              </div>
              <span className="text-xs text-indigo-600 font-bold">Try →</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoSwitch('demo.student@hostel.dev')}
              className={cn(
                'p-3 rounded-xl border text-left transition-colors text-xs flex items-center justify-between',
                user?.email === 'demo.student@hostel.dev'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              )}
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Student Account</p>
                <p className="text-[11px] text-slate-400 font-mono">demo.student@hostel.dev</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">Student Only (Direct Skip)</p>
              </div>
              <span className="text-xs text-indigo-600 font-bold">Try →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Smart Hostel • <span className="italic">One smart platform for a better hostel experience.</span>
        </div>
        <div>
          Role-Based Access Control • Active Session: <strong className="font-mono text-slate-600 dark:text-slate-300">{user?.id}</strong>
        </div>
      </footer>
    </div>
  )
}
