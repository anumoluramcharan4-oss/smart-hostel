import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, Shield, User, Building, ArrowRight, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { useToast } from '@/app/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'demo.all@hostel.dev',
      password: 'Demo123!',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null)
    setLoading(true)
    try {
      const loggedUser = await login(data.email)
      success(`Welcome back, ${loggedUser.name}!`)
      if (from) {
        navigate(from, { replace: true })
      } else if (loggedUser.roles.length > 1) {
        navigate('/select-role', { replace: true })
      } else {
        const singleRole = loggedUser.roles[0] || loggedUser.activeRole || 'student'
        navigate(`/${singleRole}/dashboard`, { replace: true })
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Invalid credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAccount = (email: string) => {
    setValue('email', email)
    setValue('password', 'Demo123!')
    setErrorMsg(null)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <Link to="/" className="flex items-center gap-2 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Smart Hostel
          </span>
        </Link>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          AI-Powered Residential & Facilities Management Platform
        </p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-slate-200/80 dark:border-slate-800">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Sign in to your account</CardTitle>
          <CardDescription>
            Enter your credentials or use a one-click demo profile below
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@hostel.dev"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick-Fill Demo Profiles */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Quick-Fill Demo Accounts (Mock Mode)
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('demo.all@hostel.dev')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      All Roles (Admin, Warden, Student)
                    </p>
                    <p className="text-[10px] text-slate-400">demo.all@hostel.dev</p>
                  </div>
                </div>
                <span className="text-[10px] text-indigo-600 font-semibold">Select</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('demo.warden@hostel.dev')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Warden + Student (No Admin)
                    </p>
                    <p className="text-[10px] text-slate-400">demo.warden@hostel.dev</p>
                  </div>
                </div>
                <span className="text-[10px] text-indigo-600 font-semibold">Select</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('demo.student@hostel.dev')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Student Only (Strictly Restricted)
                    </p>
                    <p className="text-[10px] text-slate-400">demo.student@hostel.dev</p>
                  </div>
                </div>
                <span className="text-[10px] text-indigo-600 font-semibold">Select</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-xs text-slate-400">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          ← Back to Marketing Landing Page
        </Link>
      </div>
    </div>
  )
}
