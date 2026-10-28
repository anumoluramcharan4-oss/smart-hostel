import React, { createContext, useContext, useState, useCallback } from 'react'
import { Toast, type ToastMessage, type ToastType } from '@/components/ui/Toast'

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      const newToast: ToastMessage = { id, message, type, title }
      setToasts((prev) => [...prev, newToast])

      setTimeout(() => {
        dismissToast(id)
      }, 4500)
    },
    [dismissToast]
  )

  const success = useCallback((msg: string, title?: string) => showToast(msg, 'success', title), [showToast])
  const error = useCallback((msg: string, title?: string) => showToast(msg, 'error', title), [showToast])
  const warning = useCallback((msg: string, title?: string) => showToast(msg, 'warning', title), [showToast])
  const info = useCallback((msg: string, title?: string) => showToast(msg, 'info', title), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
