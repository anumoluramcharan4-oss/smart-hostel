import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Sparkles } from 'lucide-react'

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Smart Hostel</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 italic">One smart platform for a better hostel experience.</span>
          </div>
          <div className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Smart Hostel Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
