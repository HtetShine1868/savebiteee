import { useLocation } from 'react-router-dom'
import { Bot, Database, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react'
import { ChatPanel } from '../../components/chat/ChatPanel.jsx'
import { Dot } from '../../components/ui/Badge.jsx'
import { useReserve } from '../../context/reserve-context.js'

const PIPELINE = [
  {
    icon: MessageSquareText,
    title: 'You ask naturally',
    body: 'Budget, craving, area, timing — however you would say it to a friend.',
  },
  {
    icon: Bot,
    title: 'Gemini extracts criteria',
    body: 'Category, price ceiling, distance and availability become a structured search.',
  },
  {
    icon: Database,
    title: 'The database answers',
    body: 'Only active, in-stock listings from real shops are returned.',
  },
  {
    icon: ShieldCheck,
    title: 'No invented food',
    body: 'If nothing matches, the assistant says so instead of making something up.',
  },
]

export default function ChatPage() {
  const { state } = useLocation()
  const { openReserve } = useReserve()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="flex h-[calc(100svh-13rem)] min-h-[520px] flex-col overflow-hidden rounded-4xl bg-canvas ring-1 ring-line shadow-card">
          <div className="flex items-center gap-3 bg-gradient-to-r from-spark-600 to-spark-700 px-5 py-4 text-white">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/15">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-bold">Food assistant</h1>
              <p className="flex items-center gap-1.5 text-xs text-white/80">
                <Dot tone="brand" pulse />
                Answers from live listings only
              </p>
            </div>
          </div>
          <ChatPanel
            onReserve={openReserve}
            autoFocus
            initialPrompt={state?.prompt}
            className="min-h-0 flex-1"
          />
        </div>

        <aside className="space-y-4">
          <div className="rounded-4xl bg-surface p-6 ring-1 ring-line/80 shadow-card">
            <h2 className="font-display text-base font-bold text-ink">How this works</h2>
            <p className="mt-1.5 text-sm text-muted">
              The AI handles language. Your database stays the single source of truth for what is
              available.
            </p>
            <ol className="mt-5 space-y-4">
              {PIPELINE.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-spark-100 text-spark-700">
                    <step.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-4xl bg-brand-50 p-6 ring-1 ring-brand-200">
            <h2 className="font-display text-base font-bold text-brand-900">Tip</h2>
            <p className="mt-1.5 text-sm text-brand-800">
              Share your location from the header and the assistant can rank answers by how far you have
              to walk.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
