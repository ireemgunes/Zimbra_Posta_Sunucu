'use client'
import React, { createContext, useContext, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  title: string
  message?: string
  type: ToastType
}

interface ToastContextType {
  toasts: ToastMessage[]
  addToast: (title: string, message?: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (title: string, message?: string, type: ToastType = 'success') => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, title, message, type }])

      setTimeout(() => {
        removeToast(id)
      }, 4000)
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-sm max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success'
          const isError = toast.type === 'error'
          const isWarning = toast.type === 'warning'
          const isInfo = toast.type === 'info'

          const borderColors = {
            success: 'border-secondary/40 bg-[#0f241a]/95 text-secondary',
            error: 'border-error/40 bg-[#291114]/95 text-error',
            warning: 'border-tertiary/40 bg-[#281b0a]/95 text-tertiary',
            info: 'border-primary/40 bg-[#0e2130]/95 text-primary',
          }

          const iconNames = {
            success: 'check_circle',
            error: 'cancel',
            warning: 'warning',
            info: 'info',
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-md p-md rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 transform translate-y-0 ${borderColors[toast.type]}`}
            >
              <span className="material-symbols-outlined text-[22px] flex-shrink-0">
                {iconNames[toast.type]}
              </span>
              <div className="flex-1 flex flex-col gap-[2px]">
                <div className="text-body-sm font-bold text-on-surface">{toast.title}</div>
                {toast.message && (
                  <div className="text-code-sm text-on-surface-variant leading-relaxed">
                    {toast.message}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-xs"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
