import { Crosshair, MapPin, X } from 'lucide-react'
import { useSession } from '../../context/session-context.js'
import { useToast } from '../../context/toast-context.js'
import { cn } from '../../lib/cn.js'

export function LocationChip({ className }) {
  const { location, locationStatus, requestLocation, clearLocation } = useSession()
  const { notify } = useToast()

  const onEnable = async () => {
    const next = await requestLocation()
    if (next) {
      notify({
        tone: 'success',
        title: 'Sorting by distance',
        description: 'Nearby shops will now appear first.',
      })
    } else {
      notify({
        tone: 'info',
        title: 'Location not shared',
        description: 'No problem — you can still search by city or shop name.',
      })
    }
  }

  if (location) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1.5 pr-1.5 pl-3 text-sm font-semibold text-brand-700 ring-1 ring-brand-200',
          className
        )}
      >
        <MapPin className="size-4" aria-hidden="true" />
        <span className="max-w-28 truncate">{location.label ?? 'Nearby'}</span>
        <button
          type="button"
          onClick={clearLocation}
          aria-label="Stop using my location"
          className="grid size-6 place-items-center rounded-full text-brand-700 transition hover:bg-brand-100"
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onEnable}
      disabled={locationStatus === 'requesting'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-sm font-semibold text-muted ring-1 ring-line transition hover:text-ink hover:ring-brand-200 disabled:opacity-60',
        className
      )}
    >
      <Crosshair className={cn('size-4', locationStatus === 'requesting' && 'animate-spin')} aria-hidden="true" />
      {locationStatus === 'requesting' ? 'Locating…' : 'Near me'}
    </button>
  )
}
