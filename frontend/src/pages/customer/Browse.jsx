import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Filter, PackageOpen, Search, Sparkles, X } from 'lucide-react'
import { PromoGrid } from '../../components/promo/PromoGrid.jsx'
import { CategoryScroller } from '../../components/promo/CategoryScroller.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Chip, Select, Switch } from '../../components/ui/Field.jsx'
import { CardGridSkeleton, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx'
import { LocationChip } from '../../components/layout/LocationChip.jsx'
import { useReserve } from '../../context/reserve-context.js'
import { useSession } from '../../context/session-context.js'
import { usePromotionFeed } from '../../hooks/usePromotionFeed.js'
import { useNow } from '../../hooks/useNow.js'
import { CATEGORIES, SORT_OPTIONS, filterPromotions, sortPromotions } from '../../lib/promotions.js'
import { formatPrice } from '../../lib/format.js'
import { cn } from '../../lib/cn.js'

const PRICE_STEPS = [2000, 3000, 5000, 10000]
const RADIUS_STEPS = [1, 3, 5, 10]

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const now = useNow(30_000)
  const { openReserve } = useReserve()
  const { location } = useSession()
  const [showFilters, setShowFilters] = useState(false)

  const query = searchParams.get('q') ?? ''
  const categorySlugs = (searchParams.get('category') ?? '').split(',').filter(Boolean)
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null
  const endingSoon = searchParams.get('endingSoon') === '1'
  const radiusKm = searchParams.get('radius') ? Number(searchParams.get('radius')) : null
  const sort = searchParams.get('sort') ?? 'ending_soon'
  const [searchDraft, setSearchDraft] = useState(query)

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value == null || value === '' || value === false) next.delete(key)
    else next.set(key, String(value))
    setSearchParams(next, { replace: true })
  }

  const toggleCategory = (slug) => {
    const next = categorySlugs.includes(slug)
      ? categorySlugs.filter((item) => item !== slug)
      : [...categorySlugs, slug]
    setParam('category', next.join(','))
  }

  const clearAll = () => {
    setSearchDraft('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const { promotions, loading, error, reload } = usePromotionFeed({
    query: query || undefined,
    category: categorySlugs.join(',') || undefined,
    maxPrice: maxPrice ?? undefined,
    endingSoon: endingSoon ? 1 : undefined,
    radiusKm: radiusKm ?? undefined,
    sortBy: sort,
    availableOnly: 1,
    limit: 90,
  })

  const results = useMemo(
    () =>
      sortPromotions(
        filterPromotions(
          promotions,
          {
            query,
            categorySlugs,
            maxPrice,
            endingSoon,
            availableOnly: true,
            maxDistanceKm: radiusKm,
          },
          now
        ),
        sort
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [promotions, query, categorySlugs.join(','), maxPrice, endingSoon, radiusKm, sort, now]
  )

  const activeFilters = [
    query ? { key: 'q', label: `“${query}”` } : null,
    ...categorySlugs.map((slug) => ({
      key: `category:${slug}`,
      label: CATEGORIES.find((category) => category.slug === slug)?.name ?? slug,
    })),
    maxPrice ? { key: 'maxPrice', label: `Under ${formatPrice(maxPrice)}` } : null,
    endingSoon ? { key: 'endingSoon', label: 'Ending soon' } : null,
    radiusKm ? { key: 'radius', label: `Within ${radiusKm} km` } : null,
  ].filter(Boolean)

  const removeFilter = (key) => {
    if (key === 'q') {
      setSearchDraft('')
      setParam('q', '')
    } else if (key.startsWith('category:')) {
      toggleCategory(key.split(':')[1])
    } else if (key === 'endingSoon') {
      setParam('endingSoon', false)
    } else {
      setParam(key === 'radius' ? 'radius' : key, '')
    }
  }

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-ink">Maximum price</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PRICE_STEPS.map((step) => (
            <Chip
              key={step}
              active={maxPrice === step}
              onClick={() => setParam('maxPrice', maxPrice === step ? '' : step)}
            >
              ≤ {step.toLocaleString('en-US')}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-ink">Distance</p>
        {location ? (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {RADIUS_STEPS.map((step) => (
              <Chip
                key={step}
                active={radiusKm === step}
                onClick={() => setParam('radius', radiusKm === step ? '' : step)}
              >
                {step} km
              </Chip>
            ))}
          </div>
        ) : (
          <div className="mt-2.5 flex items-center gap-3 rounded-2xl bg-canvas p-3">
            <p className="flex-1 text-xs text-muted">Share your location to filter by distance.</p>
            <LocationChip />
          </div>
        )}
      </div>

      <Switch
        checked={endingSoon}
        onChange={(value) => setParam('endingSoon', value ? '1' : '')}
        label="Ending within 3 hours"
        description="Deepest discounts, shortest window."
      />
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Search rescue deals
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Filter by food type, budget and distance — or ask the assistant in plain language.
          </p>
        </div>
        <Button as={Link} to="/app/chat" variant="spark" icon={Sparkles}>
          Ask instead
        </Button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          setParam('q', searchDraft.trim())
        }}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted" />
          <input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Pizza, bakery, shop name, city…"
            aria-label="Search promotions"
            className="w-full rounded-full bg-surface py-3.5 pr-4 pl-12 text-sm text-ink ring-1 ring-line transition placeholder:text-muted/70 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="md">
            Search
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={Filter}
            onClick={() => setShowFilters((value) => !value)}
            className="lg:hidden"
          >
            Filters
          </Button>
        </div>
      </form>

      <div className="mt-5">
        <CategoryScroller selected={categorySlugs} onToggle={toggleCategory} />
      </div>

      {activeFilters.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => removeFilter(filter.key)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-100"
            >
              {filter.label}
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-ink"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
        <aside className="hidden rounded-3xl bg-surface p-5 ring-1 ring-line/80 shadow-card lg:sticky lg:top-24 lg:block">
          <h2 className="font-display text-base font-bold text-ink">Filters</h2>
          <div className="mt-5">{filterPanel}</div>
        </aside>

        <div
          className={cn(
            'rounded-3xl bg-surface p-5 ring-1 ring-line/80 lg:hidden',
            showFilters ? 'block' : 'hidden'
          )}
        >
          {filterPanel}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-muted">
              {loading ? 'Searching…' : `${results.length} live listing${results.length === 1 ? '' : 's'}`}
            </p>
            <div className="w-48">
              <Select
                aria-label="Sort results"
                value={sort}
                onChange={(event) => setParam('sort', event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-5">
            {error ? (
              <ErrorState error={error} onRetry={reload} />
            ) : loading ? (
              <CardGridSkeleton count={6} />
            ) : results.length ? (
              <PromoGrid promotions={results} onReserve={openReserve} now={now} />
            ) : (
              <EmptyState
                icon={PackageOpen}
                title="No matches right now"
                description="Try removing a filter, widening your budget, or asking the assistant what is available nearby."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="secondary" onClick={clearAll}>
                      Clear filters
                    </Button>
                    <Button as={Link} to="/app/chat" variant="spark" icon={Sparkles}>
                      Ask the assistant
                    </Button>
                  </div>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
