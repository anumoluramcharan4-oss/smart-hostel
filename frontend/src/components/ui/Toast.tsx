import React from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  title?: string
  message: string
  type: ToastType
}

export interface ToastProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-indigo-500 shrink-0" />,
  }

  const borders = {
    success: 'border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100',
    error: 'border-rose-500/20 bg-rose-50/90 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100',
    warning: 'border-amber-500/20 bg-amber-50/90 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100',
    info: 'border-indigo-500/20 bg-indigo-50/90 dark:bg-indigo-950/90 text-indigo-900 dark:text-indigo-100',
  }

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-200 animate-slide-up',
        borders[toast.type]
      )}
    >
      <div className="pt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 space-y-0.5 text-xs">
        {toast.title && <h5 className="font-semibold">{toast.title}</h5>}
        <p className="opacity-90">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
