import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '../../context/auth-context.js'
import { useSession } from '../../context/session-context.js'
import { useToast } from '../../context/toast-context.js'
import { cn } from '../../lib/cn.js'

export function FavoriteButton({ shop, size = 'md', className, showLabel = false }) {
  const { status } = useAuth()
  const { isFavorite, toggleFavorite } = useSession()
  const { notify } = useToast()
  const [busy, setBusy] = useState(false)

  const shopId = typeof shop === 'string' ? shop : shop?.id
  const active = isFavorite(shopId)

  const onClick = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (status !== 'authenticated') {
      notify({
        tone: 'info',
        title: 'Sign in to save shops',
        description: 'Favourite a shop to get an email when they post a new rescue deal.',
      })
      return
    }

    setBusy(true)
    try {
      const nowFavorite = await toggleFavorite(shop)
      notify({
        tone: 'success',
        title: nowFavorite ? 'Added to favourites' : 'Removed from favourites',
        description: nowFavorite
          ? 'We will email you when this shop posts a new promotion.'
          : undefined,
      })
    } catch (error) {
      notify({ tone: 'error', title: 'Could not update favourites', description: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      aria-label={active ? 'Remove shop from favourites' : 'Add shop to favourites'}
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-200',
        showLabel ? 'px-4 py-2.5 text-sm' : size === 'sm' ? 'size-9 justify-center' : 'size-10 justify-center',
        active
          ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
          : 'glass text-ink ring-1 ring-white/40 hover:text-red-600',
        busy && 'opacity-60',
        className
      )}
    >
      <Heart
        className={cn(size === 'sm' ? 'size-4' : 'size-[18px]', active && 'fill-current')}
        aria-hidden="true"
      />
      {showLabel ? <span>{active ? 'Saved' : 'Save shop'}</span> : null}
    </button>
  )
}
