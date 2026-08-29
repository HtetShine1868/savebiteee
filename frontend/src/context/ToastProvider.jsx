import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext } from './toast-context.js'
import { cn } from '../lib/cn.js'

const TONES = {
  success: { icon: CheckCircle2, ring: 'ring-brand-200', accent: 'text-brand-600' },
  error: { icon: AlertTriangle, ring: 'ring-red-200', accent: 'text-red-600' },
  info: { icon: Info, ring: 'ring-spark-200', accent: 'text-spark-600' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (toast) => {
      const id = Math.random().toString(36).slice(2)
      const entry = { id, tone: 'info', duration: 4200, ...toast }
      setToasts((current) => [...current.slice(-2), entry])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), entry.duration)
      )
      return id
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const tone = TONES[toast.tone] ?? TONES.info
            const Icon = tone.icon
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className={cn(
                  'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-surface p-4 shadow-lift ring-1',
                  tone.ring
                )}
                role="status"
              >
                <Icon className={cn('mt-0.5 size-5 shrink-0', tone.accent)} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-0.5 text-sm text-muted">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="rounded-lg p-1 text-muted transition hover:bg-canvas hover:text-ink"
                  aria-label="Dismiss notification"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
