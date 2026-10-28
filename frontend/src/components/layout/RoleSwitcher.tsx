import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Lock, User as UserIcon, Shield, Building } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { useToast } from '@/app/ToastContext'
import { Tooltip } from '@/components/ui/Tooltip'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

export interface RoleSwitcherProps {
  onRoleSwitched?: (role: Role) => void
  layout?: 'compact' | 'cards' | 'dropdown'
  className?: string
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  onRoleSwitched,
  layout = 'compact',
  className,
}) => {
  const { user, activeRole, hasRole, switchRole } = useAuth()
  const navigate = useNavigate()
  const { success } = useToast()

  if (!user) return null

  const handleRoleSelect = async (role: Role) => {
    if (role === activeRole) return
    if (!hasRole(role)) return

    try {
      await switchRole(role)
      success(`Switched active workspace to ${role.toUpperCase()}`)
      onRoleSwitched?.(role)
      navigate(`/${role}/dashboard`)
    } catch (e) {
      console.error(e)
    }
  }

  const roleConfigs: Array<{
    role: Role
    label: string
    icon: React.ReactNode
    description: string
  }> = [
    {
      role: 'student',
      label: 'Student Portal',
      icon: <UserIcon className="w-4 h-4" />,
      description: 'Room, complaints, outpasses & mess',
    },
    {
      role: 'warden',
      label: 'Warden Console',
      icon: <Shield className="w-4 h-4" />,
      description: 'Block management, triage & leaves',
    },
    {
      role: 'admin',
      label: 'Admin Operations',
      icon: <Building className="w-4 h-4" />,
      description: 'Hostels, analytics & system settings',
    },
  ]

  if (layout === 'cards') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
        {roleConfigs.map(({ role, label, icon, description }) => {
          const isAllowed = hasRole(role)
          const isActive = activeRole === role
          const tooltipMessage = `You don't have ${label} access`

          const cardContent = (
            <div
              onClick={() => isAllowed && handleRoleSelect(role)}
              role="button"
              tabIndex={isAllowed ? 0 : -1}
              onKeyDown={(e) => {
                if (isAllowed && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  handleRoleSelect(role)
                }
              }}
              className={cn(
                'relative flex flex-col justify-between p-5 rounded-2xl border transition-all text-left h-full',
                !isAllowed
                  ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800'
                  : isActive
                  ? 'border-indigo-600 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30 ring-2 ring-indigo-600 shadow-md cursor-default'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 cursor-pointer'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={cn(
                      'p-2.5 rounded-xl',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    )}
                  >
                    {icon}
                  </div>

                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 stroke-[3]" /> Active
                    </span>
                  ) : !isAllowed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">
                      Available
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {label}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                {isActive ? (
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Currently Selected →
                  </span>
                ) : isAllowed ? (
                  <span className="text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:text-slate-300 transition-colors">
                    Switch to Workspace →
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Access Denied
                  </span>
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
        })}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {roleConfigs.map(({ role, label, icon, description }) => {
        const isAllowed = hasRole(role)
        const isActive = activeRole === role
        const tooltipMessage = `You don't have ${label} access`

        const itemElement = (
          <button
            type="button"
            disabled={!isAllowed}
            onClick={() => handleRoleSelect(role)}
            className={cn(
              'flex w-full items-center justify-between px-3 py-2 rounded-xl text-left transition-colors',
              !isAllowed
                ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                : isActive
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'p-1.5 rounded-lg',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                {icon}
              </div>
              <div>
                <div className="text-xs font-medium flex items-center gap-1.5">
                  <span>{label}</span>
                  {!isAllowed && <Lock className="w-3 h-3 text-slate-400" />}
                </div>
                <p className="text-[10px] text-slate-400 font-normal">
                  {description}
                </p>
              </div>
            </div>

            {isActive && (
              <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
          </button>
        )

        if (!isAllowed) {
          return (
            <Tooltip key={role} content={tooltipMessage} position="left" className="w-full">
              {itemElement}
            </Tooltip>
          )
        }

        return <div key={role}>{itemElement}</div>
      })}
    </div>
  )
}
