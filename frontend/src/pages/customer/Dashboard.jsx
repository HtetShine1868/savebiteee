import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bot, PackageOpen, Search, Sparkles } from 'lucide-react'
import { PromoRail } from '../../components/promo/PromoRail.jsx'
import { PromoGrid } from '../../components/promo/PromoGrid.jsx'
import { CategoryScroller } from '../../components/promo/CategoryScroller.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { CardGridSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx'
import { LocationChip } from '../../components/layout/LocationChip.jsx'
import { useAuth } from '../../context/auth-context.js'
import { useSession } from '../../context/session-context.js'
import { useReserve } from '../../context/reserve-context.js'
import { usePromotionFeed } from '../../hooks/usePromotionFeed.js'
import { useNow } from '../../hooks/useNow.js'
import { CATEGORIES, filterPromotions, sortPromotions } from '../../lib/promotions.js'

function Greeting() {
  const { user } = useAuth()
  const hour = new Date().getHours()
  const partOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const firstName = user?.fullName?.split(' ')[0]

  return (
    <div>
      <p className="text-sm font-semibold text-brand-700">
        Good {partOfDay}
        {firstName ? `, ${firstName}` : ''} 👋
      </p>
      <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        What are we rescuing today?
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        These listings expire today. Reserve what you like and collect it from the shop.
      </p>
    </div>
  )
}

function AiPromptCard() {
  return (
    <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-spark-600 to-spark-700 p-6 text-white sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-8 size-40 rounded-full bg-white/10 blur-2xl"
      />
      <span className="grid size-11 place-items-center rounded-2xl bg-white/15">
        <Bot className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-xl font-bold">Not sure what you want?</h2>
      <p className="mt-1.5 text-sm text-white/80">
        Tell the assistant your budget and craving — it searches live listings and answers with real cards.
      </p>
      <Button
        as={Link}
        to="/app/chat"
        className="mt-5 bg-white text-spark-700 hover:bg-spark-100"
        icon={Sparkles}
      >
        Ask the assistant
      </Button>
    </div>
  )
}

export default function Dashboard() {
  const now = useNow(30_000)
  const { openReserve } = useReserve()
  const { location, favoriteShopIds } = useSession()
  const [selectedCategories, setSelectedCategories] = useState([])

  const { promotions, loading, error, reload } = usePromotionFeed({ availableOnly: 1, limit: 60 })

  const toggleCategory = (slug) =>
    setSelectedCategories((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    )

  const counts = useMemo(() => {
    const result = {}
    for (const category of CATEGORIES) {
      result[category.slug] = promotions.filter(
        (promotion) => promotion.category?.slug === category.slug && promotion.status === 'active'
      ).length
    }
    return result
  }, [promotions])

  const sections = useMemo(() => {
    const active = filterPromotions(promotions, { availableOnly: true }, now)
    return {
      active,
      endingSoon: sortPromotions(
        filterPromotions(promotions, { availableOnly: true, endingSoon: true }, now),
        'ending_soon'
      ),
      nearby: location ? sortPromotions(active, 'distance').slice(0, 12) : [],
      favorites: active.filter((promotion) => favoriteShopIds.includes(promotion.shopId)),
      cheapest: sortPromotions(active, 'price_asc').slice(0, 12),
    }
  }, [promotions, now, location, favoriteShopIds])

  const filtered = useMemo(
    () =>
      selectedCategories.length
        ? sortPromotions(
            filterPromotions(promotions, { availableOnly: true, categorySlugs: selectedCategories }, now),
            'ending_soon'
          )
        : [],
    [promotions, selectedCategories, now]
  )

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <Greeting />
        <div className="flex items-center gap-2">
          <LocationChip />
          <Button as={Link} to="/app/browse" variant="secondary" icon={Search}>
            Search & filter
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold text-ink">Browse by category</h2>
        <CategoryScroller selected={selectedCategories} onToggle={toggleCategory} counts={counts} />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <CardGridSkeleton count={6} />
      ) : selectedCategories.length ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink">
              {filtered.length} result{filtered.length === 1 ? '' : 's'} in{' '}
              {selectedCategories
                .map((slug) => CATEGORIES.find((category) => category.slug === slug)?.name)
                .filter(Boolean)
                .join(', ')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategories([])}>
              Clear categories
            </Button>
          </div>
          {filtered.length ? (
            <PromoGrid promotions={filtered} onReserve={openReserve} now={now} />
          ) : (
            <EmptyState
              icon={PackageOpen}
              title="Nothing live in this category"
              description="Shops post new rescue deals through the day — try another category or ask the assistant."
              action={
                <Button as={Link} to="/app/chat" variant="spark" icon={Sparkles}>
                  Ask the assistant
                </Button>
              }
            />
          )}
        </section>
      ) : sections.active.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No live promotions right now"
          description="Nothing is available at this moment. Check back a little later — most shops list their surplus in the late afternoon."
          action={
            <Button as={Link} to="/app/chat" variant="spark" icon={Sparkles}>
              Ask what is coming up
            </Button>
          }
        />
      ) : (
        <>
          <PromoRail
            title="Ending soon"
            emoji="⏰"
            description="Last chance — these close within the next few hours."
            promotions={sections.endingSoon}
            onReserve={openReserve}
            now={now}
            seeAllHref="/app/browse?endingSoon=1"
          />

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <PromoRail
              title="Available now"
              emoji="🔥"
              description="Fresh listings you can reserve immediately."
              promotions={sections.active}
              onReserve={openReserve}
              now={now}
              seeAllHref="/app/browse"
            />
            <AiPromptCard />
          </div>

          {sections.nearby.length ? (
            <PromoRail
              title="Closest to you"
              emoji="📍"
              description="Sorted by walking distance from your location."
              promotions={sections.nearby}
              onReserve={openReserve}
              now={now}
              seeAllHref="/app/browse?sort=distance"
            />
          ) : null}

          {sections.favorites.length ? (
            <PromoRail
              title="From your favourite shops"
              emoji="⭐"
              promotions={sections.favorites}
              onReserve={openReserve}
              now={now}
              seeAllHref="/app/favorites"
            />
          ) : null}

          <PromoRail
            title="Biggest bargains"
            emoji="💸"
            description="The cheapest plates on the board right now."
            promotions={sections.cheapest}
            onReserve={openReserve}
            now={now}
            seeAllHref="/app/browse?sort=price_asc"
          />

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-4xl bg-surface p-6 ring-1 ring-line/80 shadow-card">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Looking for something specific?</h2>
              <p className="mt-1 text-sm text-muted">
                Use filters for category, budget and distance, or just ask in your own words.
              </p>
            </div>
            <Button as={Link} to="/app/browse" iconRight={ArrowRight}>
              Open search
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
