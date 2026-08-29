import { useMemo } from 'react'
import { useResource } from './useResource.js'
import { useSession } from '../context/session-context.js'
import { useReserve } from '../context/reserve-context.js'
import { promotionService } from '../lib/services.js'
import { withDistance } from '../lib/promotions.js'

/**
 * Fetches promotions and annotates them with distance from the visitor.
 * Refetches whenever a reservation succeeds so stock counts stay honest.
 */
export function usePromotionFeed(params = {}) {
  const { location } = useSession()
  const { reservationVersion } = useReserve()
  const key = JSON.stringify(params)

  const query = useMemo(() => {
    const parsed = JSON.parse(key)
    if (location) {
      parsed.lat = location.latitude
      parsed.lng = location.longitude
    }
    return parsed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, location?.latitude, location?.longitude])

  const resource = useResource(
    (signal) => promotionService.list(query, signal),
    [key, location?.latitude, location?.longitude, reservationVersion]
  )

  const promotions = useMemo(
    () => withDistance(resource.data ?? [], location),
    [resource.data, location]
  )

  return { ...resource, promotions }
}
