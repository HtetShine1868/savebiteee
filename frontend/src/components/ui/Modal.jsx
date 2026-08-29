import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn.js'

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-4xl bg-surface shadow-lift sm:rounded-4xl',
              widths[size]
            )}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div>
                {title ? <h2 className="font-display text-xl font-bold text-ink">{title}</h2> : null}
                {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-canvas hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? <div className="border-t border-line bg-canvas/60 px-6 py-4">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}
