'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building,
  GraduationCap,
  ShieldCheck,
  Crown,
  ArrowRight,
  Lock,
  Mail,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('student')
  const [email, setEmail] = useState('aarav.patel@hostelos.edu')
  const [password, setPassword] = useState('••••••••••••')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()

  const roles = [
    {
      id: 'student' as Role,
      title: 'Student',
      description: 'Room pass, complaints, fees & campus notices',
      icon: GraduationCap,
      color: 'from-indigo-500 to-violet-600',
      badge: 'Resident',
      defaultEmail: 'aarav.patel@hostelos.edu',
    },
    {
      id: 'warden' as Role,
      title: 'Warden',
      description: 'Room allocations, roll-call & maintenance Kanban',
      icon: ShieldCheck,
      color: 'from-amber-500 to-orange-600',
      badge: 'Operations',
      defaultEmail: 'rajesh.sharma@hostelos.edu',
    },
    {
      id: 'admin' as Role,
      title: 'Admin',
      description: 'Campus occupancy, financial treasury & audit reports',
      icon: Crown,
      color: 'from-teal-500 to-emerald-600',
      badge: 'Executive',
      defaultEmail: 'admin@hostelos.edu',
    },
  ]

  const handleRoleSelect = (r: Role) => {
    setSelectedRole(r)
    const found = roles.find((item) => item.id === r)
    if (found) setEmail(found.defaultEmail)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await login(selectedRole, email, password)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#070B16] via-[#0B1020] to-[#121A33] relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary via-indigo-500 to-violet-500 text-white shadow-xl shadow-primary/25 mb-4">
            <Building className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Hostel<span className="text-primary font-black">OS</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
            Next-generation campus residential life & facilities management
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-white/10 bg-[#0F162B]/85 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          {/* Persona picker label */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Demo Persona
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-saffron-400 bg-saffron-500/10 px-2 py-0.5 rounded-full border border-saffron-500/20">
              <Sparkles className="h-3 w-3" /> 1-Click Access
            </span>
          </div>

          {/* 3 Persona Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {roles.map((item) => {
              const isSelected = selectedRole === item.id
              const Icon = item.icon

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRoleSelect(item.id)}
                  className={cn(
                    'relative flex flex-col items-start p-3.5 rounded-2xl text-left border transition-all duration-200 group',
                    isSelected
                      ? 'border-primary/80 bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary/40'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white mb-2 shadow-sm',
                      item.color
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-bold text-white">
                      {item.title}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                    {item.description}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-slate-500">
                  (Simulated in Demo)
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-violet-600/90 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Enter {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switch helper */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Fast Switch Mode:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => login('student')}
                className="hover:text-primary transition-colors font-medium underline underline-offset-4"
              >
                Student
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => login('warden')}
                className="hover:text-saffron-400 transition-colors font-medium underline underline-offset-4"
              >
                Warden
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => login('admin')}
                className="hover:text-teal-400 transition-colors font-medium underline underline-offset-4"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
