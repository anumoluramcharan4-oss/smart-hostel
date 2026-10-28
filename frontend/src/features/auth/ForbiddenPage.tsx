import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export const ForbiddenPage: React.FC = () => {
  const { user, activeRole } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
      <Card className="max-w-md p-8 flex flex-col items-center shadow-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold tracking-widest uppercase text-rose-600 dark:text-rose-400">
          403 Access Denied
        </span>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Restricted Permission Area
        </h1>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Your current account <strong>{user?.email}</strong> does not hold permission to access this workspace.
          Please switch to an authorized role or return to your allowed dashboard.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Go Back
          </Button>

          <Button
            className="flex-1"
            size="sm"
            onClick={() => navigate(`/${activeRole}/dashboard`)}
            leftIcon={<Home className="w-3.5 h-3.5" />}
          >
            Return to Dashboard
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 w-full text-[11px] text-slate-400">
          Logged in roles: <span className="font-semibold capitalize">{user?.roles.join(', ') || 'None'}</span>
        </div>
      </Card>
    </div>
  )
}
