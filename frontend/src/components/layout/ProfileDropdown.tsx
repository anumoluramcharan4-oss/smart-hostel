import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, LogOut, ChevronDown, User as UserIcon, Shield, Building, Lock } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { useToast } from '@/app/ToastContext'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { Badge } from '@/components/ui/Badge'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

export const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, activeRole, hasRole, switchRole, logout } = useAuth()
  const navigate = useNavigate()
  const { success, info } = useToast()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!user) return null

  const handleRoleSelect = async (role: Role) => {
    if (role === activeRole) {
      setIsOpen(false)
      return
    }
    if (!hasRole(role)) return

    try {
      await switchRole(role)
      setIsOpen(false)
      success(`Switched active workspace to ${role.toUpperCase()}`)
      navigate(`/${role}/dashboard`)
    } catch (e) {
      console.error(e)
    }
  }

  const handleLogout = () => {
    logout()
    info('Logged out of Smart Hostel session')
    navigate('/login')
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

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Avatar name={user.name} src={user.avatarUrl} size="sm" status="online" />
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 max-w-[120px] truncate">
            {user.name}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
            {activeRole}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900 z-50 animate-slide-up">
          {/* User Details Box */}
          <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800">
            <Avatar name={user.name} src={user.avatarUrl} size="md" />
            <div className="flex-1 overflow-hidden">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user.name}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant="pending" size="sm">
                  Active: {activeRole}
                </Badge>
              </div>
            </div>
          </div>

          {/* Role Switcher Section */}
          <div className="py-2">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Role Workspace
            </span>

            <div className="mt-1 space-y-1">
              {roleConfigs.map(({ role, label, icon, description }) => {
                const isAllowed = hasRole(role)
                const isActive = activeRole === role
                const tooltipMessage = `You don't have ${label} access`

                const buttonElement = (
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
                      {buttonElement}
                    </Tooltip>
                  )
                }

                return <div key={role}>{buttonElement}</div>
              })}
            </div>

            {user.roles.length > 1 && (
              <div className="pt-2 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/select-role')
                  }}
                  className="w-full text-center py-1.5 px-2 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 transition-colors"
                >
                  View All Role Portals →
                </button>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
