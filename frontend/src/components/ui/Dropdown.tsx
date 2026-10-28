import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

export interface DropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  tooltip?: string
  divider?: boolean
  danger?: boolean
  active?: boolean
}

export interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-2 w-56 rounded-xl border bg-white p-1.5 shadow-lg ring-1 ring-black/5 transition-all duration-150',
            'border-slate-200 dark:border-slate-800 dark:bg-slate-900',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, idx) => (
            <React.Fragment key={item.id || idx}>
              {item.divider && (
                <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
              )}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                title={item.tooltip}
                onClick={() => {
                  if (!item.disabled && item.onClick) {
                    item.onClick()
                    setIsOpen(false)
                  }
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left',
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                    : item.danger
                    ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                  item.active && 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold'
                )}
              >
                <div className="flex items-center gap-2">
                  {item.icon && <span className="text-current shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                {item.tooltip && item.disabled && (
                  <span className="text-[10px] text-slate-400">Locked</span>
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
