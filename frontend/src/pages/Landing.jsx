import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  Clock,
  Database,
  Leaf,
  MapPin,
  MessageSquareText,
  PiggyBank,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
} from 'lucide-react'
import { Logo } from '../components/layout/Logo.jsx'
import { Footer } from '../components/layout/Footer.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { SectionHeading } from '../components/ui/Surface.jsx'
import { useAuth } from '../context/auth-context.js'
import { useResource } from '../hooks/useResource.js'
import { statsService } from '../lib/services.js'
import { CATEGORIES } from '../lib/promotions.js'
import { cn } from '../lib/cn.js'

const CUSTOMER_STEPS = [
  {
    icon: MessageSquareText,
    title: 'Ask, don’t scroll',
    body: 'Tell the assistant your craving, budget and area. It reads your intent and searches live listings.',
  },
  {
    icon: ShoppingBag,
    title: 'Reserve in a tap',
    body: 'Pick your quantity and hold the food. Stock updates instantly so nothing is double-sold.',
  },
  {
    icon: MapPin,
    title: 'Walk in and collect',
    body: 'Show your pickup code at the counter and pay there. No delivery, no waste, no fuss.',
  },
]

const AI_PIPELINE = [
  { icon: MessageSquareText, label: 'You ask', detail: '“Sweet food under 5,000 MMK near me”' },
  { icon: Bot, label: 'Gemini reads intent', detail: 'Extracts category, budget, area and timing' },
  { icon: Database, label: 'Database answers', detail: 'Only real, active, in-stock promotions' },
  { icon: Sparkles, label: 'You get cards', detail: 'Reserve straight from the chat' },
]

const OWNER_POINTS = [
  'Post surplus stock in under a minute, with expiry and pickup window.',
  'Reservations arrive with quantity, customer and pickup code.',
  'Favourite customers get an email the moment you publish.',
  'Sold-out and expired listings drop off the customer app automatically.',
]

function LandingHeader() {
  const { status, user } = useAuth()

  return (
    <header className="sticky top-0 z-50 glass border-b border-line/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="ml-auto flex items-center gap-2">
          <Link
            to="/register?role=owner"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:text-ink sm:block"
          >
            For shops
          </Link>
          {status === 'authenticated' ? (
            <Button as={Link} to={user?.role === 'owner' ? '/owner' : '/app'} size="sm" iconRight={ArrowRight}>
              Open app
            </Button>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm">
                Sign in
              </Button>
              <Button as={Link} to="/register" size="sm">
                Get started
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

function AskBox() {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  const submit = (event) => {
    event.preventDefault()
    navigate('/app/chat', { state: { prompt: value.trim() || undefined } })
  }

  return (
    <form onSubmit={submit} className="mt-8 w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-full bg-surface p-2 pl-5 shadow-lift ring-1 ring-line">
        <Sparkles className="size-5 shrink-0 text-spark-500" aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="What can I eat for 3,000 MMK tonight?"
          aria-label="Ask the food assistant"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none sm:text-base"
        />
        <Button type="submit" size="sm" variant="spark" iconRight={ArrowRight}>
          Ask
        </Button>
      </div>
      <p className="mt-2.5 pl-5 text-xs text-muted">
        Powered by Gemini for understanding — answers always come from real listings.
      </p>
    </form>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 -left-24 size-96 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute top-16 right-0 size-80 rounded-full bg-flash-200/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-72 rounded-full bg-spark-200/40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge tone="brand" icon={Leaf}>
              Same-day food rescue · Yangon
            </Badge>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Perfectly good food,
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-brand-700"> up to 70% off</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-1.5 z-0 h-3 rounded-full bg-flash-200/80"
                />
              </span>
              <br />
              before it goes to waste.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted text-balance-pretty sm:text-lg">
              Bakeries, restaurants and supermarkets near you list what they cannot sell today. Ask our
              assistant what you feel like eating, reserve it, and pick it up on your way home.
            </p>

            <AskBox />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button as={Link} to="/app" size="lg" icon={Search}>
                Browse today’s rescues
              </Button>
              <Button as={Link} to="/register?role=owner" size="lg" variant="secondary" icon={Store}>
                I have surplus food
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-muted">
              {['Walk-in pickup only', 'No delivery fees', 'Pay at the shop', 'Live stock counts'].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                    {item}
                  </span>
                )
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="absolute inset-0 -z-10 rotate-6 rounded-5xl bg-gradient-to-br from-brand-500 to-brand-700 opacity-10" />
            <div className="rounded-4xl bg-surface p-6 shadow-lift ring-1 ring-line">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-spark-600 text-white">
                  <Bot className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-ink">Food assistant</p>
                  <p className="text-xs text-muted">Understands, then searches</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
                  I have 5,000 MMK. Anything sweet near me?
                </p>
                <div className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-canvas px-4 py-2.5 text-sm text-ink ring-1 ring-line">
                  Checking live listings within 5 km…
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Desserts', 'Under 5,000 MMK', 'Near me', 'Available now'].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-spark-100 px-2 py-0.5 text-[11px] font-semibold text-spark-700"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-2.5 rounded-3xl bg-canvas p-4">
                {AI_PIPELINE.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-xl text-white',
                        index === 2 ? 'bg-brand-600' : 'bg-ink/80'
                      )}
                    >
                      <step.icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink">{step.label}</p>
                      <p className="truncate text-[11px] text-muted">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -right-4 -bottom-6 hidden rotate-3 rounded-3xl bg-surface px-4 py-3 shadow-lift ring-1 ring-line sm:block">
              <p className="flex items-center gap-2 text-xs font-bold text-ink">
                <Clock className="size-4 text-flash-600" aria-hidden="true" />
                Ends in 42 min
              </p>
              <p className="mt-0.5 text-[11px] text-muted">Stock is checked in real time</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function ImpactStrip() {
  const { data } = useResource((signal) => statsService.impact(signal), [])
  if (!data) return null

  const tiles = [
    { icon: ShoppingBag, label: 'Meals rescued', value: data.mealsRescued ?? data.meals_rescued },
    { icon: PiggyBank, label: 'Saved by customers', value: data.moneySaved ?? data.money_saved },
    { icon: Store, label: 'Partner shops', value: data.partnerShops ?? data.partner_shops },
    { icon: Users, label: 'Community members', value: data.customers ?? data.users },
  ].filter((tile) => tile.value != null)

  if (tiles.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-4 rounded-4xl bg-ink p-6 text-white sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
        {tiles.map((tile) => (
          <div key={tile.label}>
            <tile.icon className="size-5 text-brand-300" aria-hidden="true" />
            <p className="mt-3 font-display text-3xl font-extrabold tracking-tight">
              {Number(tile.value).toLocaleString('en-US')}
            </p>
            <p className="mt-1 text-sm text-white/70">{tile.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="For customers"
        title="Three steps from craving to collected"
        description="Everything happens the same day, because that is when the food needs a home."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {CUSTOMER_STEPS.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            className="relative overflow-hidden rounded-3xl bg-surface p-6 ring-1 ring-line/80 shadow-card"
          >
            <span className="absolute -top-4 -right-2 font-display text-7xl font-extrabold text-canvas">
              {index + 1}
            </span>
            <span className="relative grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <step.icon className="size-6" aria-hidden="true" />
            </span>
            <h3 className="relative mt-4 font-display text-lg font-bold text-ink">{step.title}</h3>
            <p className="relative mt-2 text-sm text-muted">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function AiSection() {
  return (
    <section className="bg-ink py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-spark-200 uppercase">
              <Sparkles className="size-3.5" aria-hidden="true" />
              The AI, done responsibly
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              The assistant understands you. The database decides what exists.
            </h2>
            <p className="mt-4 max-w-lg text-white/70">
              Gemini turns everyday language into search criteria — category, budget, distance, timing.
              The backend then queries live promotions and returns only what is genuinely active and in
              stock. The model never invents a dish, a price, or a shop.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button as={Link} to="/app/chat" variant="spark" size="lg" icon={Bot}>
                Try the assistant
              </Button>
              <Button
                as={Link}
                to="/app/browse"
                size="lg"
                variant="secondary"
                className="bg-white/10 text-white ring-white/20 hover:bg-white/15"
              >
                Search manually instead
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {AI_PIPELINE.map((step, index) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10"
              >
                <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-spark-200">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-3.5 font-display text-sm font-bold">
                  {index + 1}. {step.label}
                </p>
                <p className="mt-1 text-xs text-white/60">{step.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CategoryStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Categories"
        title="Whatever you are in the mood for"
        description="Filter by the food types shops list most — or let the assistant pick for you."
      />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CATEGORIES.filter((category) => category.slug !== 'other').map((category) => (
          <Link
            key={category.slug}
            to={`/app/browse?category=${category.slug}`}
            className="group flex items-center gap-3 rounded-3xl bg-surface p-4 ring-1 ring-line/80 shadow-card transition hover:-translate-y-1 hover:ring-brand-300"
          >
            <span
              className={cn(
                'grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-2xl',
                category.tint
              )}
              aria-hidden="true"
            >
              {category.emoji}
            </span>
            <span className="font-display text-sm font-bold text-ink group-hover:text-brand-700">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function OwnerSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-4xl bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge tone="inverse" icon={Store}>
              For food businesses
            </Badge>
            <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Turn tonight’s surplus into tomorrow’s regulars.
            </h2>
            <p className="mt-4 max-w-lg text-white/80">
              Instead of writing off unsold stock, list it with a discount and a pickup window. Customers
              come to you — there is no delivery to manage.
            </p>
            <Button
              as={Link}
              to="/register?role=owner"
              size="lg"
              className="mt-7 bg-white text-brand-800 hover:bg-brand-50"
              iconRight={ArrowRight}
            >
              Create a shop account
            </Button>
          </div>
          <ul className="space-y-3">
            {OWNER_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 text-sm ring-1 ring-white/15"
              >
                <Leaf className="mt-0.5 size-4 shrink-0 text-brand-200" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <div className="min-h-svh">
      <LandingHeader />
      <Hero />
      <ImpactStrip />
      <HowItWorks />
      <AiSection />
      <CategoryStrip />
      <OwnerSection />
      <Footer />
    </div>
  )
}
