import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Sparkles, X } from 'lucide-react'
import { ChatPanel } from './ChatPanel.jsx'
import { Dot } from '../ui/Badge.jsx'

export function ChatWidget({ onReserve }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // The dedicated chat page already has the assistant front and centre.
  if (pathname.startsWith('/app/chat')) return null

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-x-3 bottom-20 z-[70] flex h-[min(74vh,620px)] flex-col overflow-hidden rounded-4xl bg-canvas shadow-lift ring-1 ring-line sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[420px]"
          >
            <div className="flex items-center gap-3 bg-gradient-to-r from-spark-600 to-spark-700 px-4 py-3.5 text-white">
              <span className="grid size-9 place-items-center rounded-xl bg-white/15">
                <Bot className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold">Food assistant</p>
                <p className="flex items-center gap-1.5 text-xs text-white/80">
                  <Dot tone="brand" pulse />
                  Searching live listings
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="grid size-8 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <ChatPanel onReserve={onReserve} compact autoFocus className="min-h-0 flex-1" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? 'Close food assistant' : 'Ask the food assistant'}
        className="fixed right-4 bottom-20 z-[71] inline-flex items-center gap-2 rounded-full bg-spark-600 py-3.5 pr-5 pl-4 font-display text-sm font-bold text-white shadow-lift transition hover:bg-spark-700 sm:right-6 sm:bottom-6"
      >
        {open ? <X className="size-5" /> : <Sparkles className="size-5" />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Ask AI'}</span>
      </motion.button>
    </>
  )
}
