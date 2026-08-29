import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Bot, RotateCcw, Sparkles, User } from 'lucide-react'
import { CriteriaChips } from './CriteriaChips.jsx'
import { PromoCardCompact } from '../promo/PromoCard.jsx'
import { cn } from '../../lib/cn.js'
import { useSession } from '../../context/session-context.js'
import { chatService } from '../../lib/services.js'

const SUGGESTIONS = [
  'What food promotions are available now?',
  'Show me cheap food near me',
  'Any discounted pizza?',
  'Bakery items under 5,000 MMK',
  'What food is ending soon?',
  'Something sweet for under 3,000 MMK',
]

const GREETING = {
  id: 'greeting',
  role: 'assistant',
  content:
    "Hi! Tell me what you feel like eating and how much you want to spend — I'll search today's rescue deals and show you what is actually still available.",
}

function Avatar({ role }) {
  const isBot = role === 'assistant'
  return (
    <span
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-xl',
        isBot ? 'bg-spark-600 text-white' : 'bg-brand-100 text-brand-700'
      )}
    >
      {isBot ? <Bot className="size-4" aria-hidden="true" /> : <User className="size-4" aria-hidden="true" />}
    </span>
  )
}

function TypingBubble() {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar role="assistant" />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-surface px-4 py-3 ring-1 ring-line">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="size-1.5 rounded-full bg-spark-400"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: dot * 0.16 }}
          />
        ))}
      </div>
    </div>
  )
}

export function ChatPanel({
  onReserve,
  className,
  compact = false,
  autoFocus = false,
  initialPrompt,
}) {
  const { location } = useSession()
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const seeded = useRef(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const send = async (raw) => {
    const message = raw.trim()
    if (!message || pending) return

    const userMessage = { id: `u-${Date.now()}`, role: 'user', content: message }
    const history = messages.filter((entry) => entry.id !== 'greeting')

    setMessages((current) => [...current, userMessage])
    setInput('')
    setPending(true)

    try {
      const reply = await chatService.send({
        message,
        history,
        userLocation: location ? { latitude: location.latitude, longitude: location.longitude } : null,
      })
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: reply.message || 'Here is what I found.',
          criteria: reply.criteria,
          promotions: reply.promotions,
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          isError: true,
          content: error?.isMissing
            ? 'The chat endpoint (POST /api/chat) is not live yet. Once the backend connects Gemini, your question will be answered with real promotions from the database.'
            : error?.isOffline
              ? 'I cannot reach the server right now. Start the API and try again.'
              : (error?.message ?? 'Something went wrong. Please try again.'),
        },
      ])
    } finally {
      setPending(false)
    }
  }

  useEffect(() => {
    if (initialPrompt && !seeded.current) {
      seeded.current = true
      send(initialPrompt)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt])

  const reset = () => {
    setMessages([GREETING])
    setInput('')
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div
        ref={scrollRef}
        className={cn('min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4', compact ? 'text-sm' : 'sm:px-6')}
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
              className={cn('flex items-start gap-2.5', message.role === 'user' && 'flex-row-reverse')}
            >
              <Avatar role={message.role} />
              <div className={cn('min-w-0 max-w-[85%] space-y-2.5', message.role === 'user' && 'items-end')}>
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed text-balance-pretty',
                    message.role === 'user'
                      ? 'rounded-tr-sm bg-brand-600 text-white'
                      : message.isError
                        ? 'rounded-tl-sm bg-flash-50 text-flash-800 ring-1 ring-flash-200'
                        : 'rounded-tl-sm bg-surface text-ink ring-1 ring-line'
                  )}
                >
                  {message.content}
                </div>

                {message.criteria ? <CriteriaChips criteria={message.criteria} /> : null}

                {message.promotions?.length ? (
                  <div className="space-y-2">
                    {message.promotions.map((promotion) => (
                      <PromoCardCompact
                        key={promotion.id}
                        promotion={promotion}
                        onReserve={onReserve}
                      />
                    ))}
                  </div>
                ) : null}

                {message.role === 'assistant' &&
                message.promotions &&
                message.promotions.length === 0 &&
                !message.isError ? (
                  <p className="rounded-2xl bg-canvas px-4 py-3 text-xs text-muted ring-1 ring-line">
                    Nothing matched that search right now. Try a wider budget, another category, or ask
                    what is available near you.
                  </p>
                ) : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {pending ? <TypingBubble /> : null}

        {messages.length === 1 ? (
          <div className="space-y-2 pt-2">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted uppercase">
              <Sparkles className="size-3.5 text-spark-500" aria-hidden="true" />
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.slice(0, compact ? 4 : 6).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full bg-surface px-3 py-2 text-left text-xs font-semibold text-ink ring-1 ring-line transition hover:-translate-y-px hover:ring-spark-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-line bg-surface/80 p-3 sm:p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            send(input)
          }}
          className="flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  send(input)
                }
              }}
              rows={1}
              placeholder="e.g. I have 5,000 MMK — what sweet food is near me?"
              aria-label="Ask the food assistant"
              className="max-h-32 w-full resize-none rounded-2xl bg-canvas px-4 py-3 pr-12 text-sm text-ink ring-1 ring-line transition placeholder:text-muted/70 focus:ring-2 focus:ring-spark-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || pending}
              aria-label="Send message"
              className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-xl bg-spark-600 text-white transition hover:bg-spark-700 disabled:bg-line disabled:text-muted"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
          {messages.length > 1 ? (
            <button
              type="button"
              onClick={reset}
              aria-label="Start a new chat"
              className="grid size-11 shrink-0 place-items-center rounded-2xl text-muted ring-1 ring-line transition hover:text-ink"
            >
              <RotateCcw className="size-4" />
            </button>
          ) : null}
        </form>
        <p className="mt-2 px-1 text-[11px] text-muted">
          Answers only use live listings from the database — the AI never invents food.
        </p>
      </div>
    </div>
  )
}
