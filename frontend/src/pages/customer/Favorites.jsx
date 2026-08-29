import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, Search, Store } from 'lucide-react'
import { PromoGrid } from '../../components/promo/PromoGrid.jsx'
import { FavoriteButton } from '../../components/promo/FavoriteButton.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Surface.jsx'
import { CardGridSkeleton, EmptyState } from '../../components/ui/Feedback.jsx'
import { useSession } from '../../context/session-context.js'
import { useReserve } from '../../context/reserve-context.js'
import { usePromotionFeed } from '../../hooks/usePromotionFeed.js'
import { useNow } from '../../hooks/useNow.js'
import { filterPromotions, sortPromotions } from '../../lib/promotions.js'
import { initials } from '../../lib/format.js'

export default function Favorites() {
  const now = useNow(30_000)
  const { favoriteShops, favoriteShopIds, favoritesReady } = useSession()
  const { openReserve } = useReserve()
  const { promotions, loading } = usePromotionFeed({ availableOnly: 1, limit: 90 })

  const fromFavorites = useMemo(
    () =>
      sortPromotions(
        filterPromotions(promotions, { availableOnly: true, shopIds: favoriteShopIds }, now),
        'ending_soon'
      ),
    [promotions, favoriteShopIds, now]
  )

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Favourite shops</h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted">
          We email you when a saved shop posts a new rescue deal, so you get first pick.
        </p>
      </div>

      {!favoritesReady ? (
        <CardGridSkeleton count={3} />
      ) : favoriteShops.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favourite shops yet"
          description="Tap the heart on any listing or shop page to save it here and get notified about new deals."
          action={
            <Button as={Link} to="/app/browse" icon={Search}>
              Find shops nearby
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteShops.map((shop) => (
              <Card key={shop.id} className="flex items-center gap-4" hover>
                {shop.profileImageUrl ? (
                  <img src={shop.profileImageUrl} alt="" className="size-14 rounded-2xl object-cover" />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-100 font-display font-extrabold text-brand-700">
                    {initials(shop.name || 'Shop') || <Store className="size-6" />}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-base font-bold text-ink">
                    {shop.slug ? (
                      <Link to={`/app/shops/${shop.id}`} className="hover:text-brand-700">
                        {shop.name || 'Saved shop'}
                      </Link>
                    ) : (
                      (shop.name || 'Saved shop')
                    )}
                  </h2>
                  {shop.city ? (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {shop.city}
                    </p>
                  ) : null}
                </div>
                <FavoriteButton shop={shop} size="sm" />
              </Card>
            ))}
          </div>

          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold text-ink">
              Live deals from your shops ({fromFavorites.length})
            </h2>
            {loading ? (
              <CardGridSkeleton count={3} />
            ) : fromFavorites.length ? (
              <PromoGrid promotions={fromFavorites} onReserve={openReserve} now={now} />
            ) : (
              <EmptyState
                icon={Store}
                title="Nothing live from these shops right now"
                description="We will email you as soon as one of them posts a new promotion."
                action={
                  <Button as={Link} to="/app/browse" variant="secondary">
                    Browse everything
                  </Button>
                }
              />
            )}
          </section>
        </>
      )}
    </div>
  )
}
