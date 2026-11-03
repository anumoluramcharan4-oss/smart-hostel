'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Role } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeQuickRole, setActiveQuickRole] = useState<Role | null>(null)
  const { login, quickLogin } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        router.push(`/${result.role}`)
      } else {
        setErrorMessage(result.error || 'Invalid credentials. Please verify your email and password.')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickLaunch = async (targetRole: Role, studentId?: string) => {
    setActiveQuickRole(targetRole)
    try {
      await quickLogin(targetRole, studentId)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to switch portal')
      setActiveQuickRole(null)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#070B16] via-[#0B1020] to-[#121A33] relative overflow-x-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-8">
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary via-indigo-500 to-violet-500 text-white shadow-xl shadow-primary/25 mb-3">
            <Building className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Hostel<span className="text-primary font-black">OS</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 max-w-md mx-auto">
            Next-generation campus residential life &amp; facilities governance portal
          </p>
        </div>

        {/* 1-Click Multi-Portal Launcher */}
        <div className="rounded-3xl border border-white/10 bg-[#0F162B]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Instant 1-Click Portal Access
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Switch or enter any of the 3 portals instantly with full permissions.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Supabase Database
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Admin Portal Card */}
            <div className="group relative rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-slate-900/60 p-5 hover:border-indigo-400 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    Admin
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Admin Portal
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Campus-wide ticket oversight, technician dispatch, room allocation, and financial analytics.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickLaunch('admin')}
                disabled={activeQuickRole !== null}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {activeQuickRole === 'admin' ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Open Admin Portal
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Warden Portal Card */}
            <div className="group relative rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-950/40 to-slate-900/60 p-5 hover:border-violet-400 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                    Warden
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                    Warden Portal
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Dormitory floor triage, daily night attendance, gate pass verification, and block audits.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickLaunch('warden')}
                disabled={activeQuickRole !== null}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/30 transition-all disabled:opacity-50"
              >
                {activeQuickRole === 'warden' ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Open Warden Portal
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Student Portal Card */}
            <div className="group relative rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 to-slate-900/60 p-5 hover:border-blue-400 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    Student
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                    Student Portal
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Default: Kabir Sen (Room A-101, Pending Fee). View room, dues, receipts &amp; maintenance tickets.
                  </p>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <button
                  type="button"
                  onClick={() => handleQuickLaunch('student')}
                  disabled={activeQuickRole !== null}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {activeQuickRole === 'student' ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Open Student Portal (Kabir Sen)
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => handleQuickLaunch('student', 'usr-student-4')}
                    className="hover:text-white underline underline-offset-2"
                  >
                    Vihaan (Partial)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleQuickLaunch('student', 'usr-student-1')}
                    className="hover:text-white underline underline-offset-2"
                  >
                    Aarav (Paid)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Traditional Credentials Login (Collapsible / Bottom) */}
        <div className="w-full max-w-md mx-auto rounded-3xl border border-white/10 bg-[#0F162B]/85 backdrop-blur-2xl p-6 shadow-xl shadow-black/50">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white tracking-tight">Supabase Auth Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sign in with custom email credentials if registered in Supabase auth.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hostelos.edu"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Sign In With Credentials
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
