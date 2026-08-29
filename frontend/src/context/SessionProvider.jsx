import { useCallback, useEffect, useMemo, useState } from 'react'
import { favoriteService } from '../lib/services.js'
import { SessionContext } from './session-context.js'
import { useAuth } from './auth-context.js'

const LOCATION_KEY = 'fws.location'

function readStoredLocation() {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function storeLocation(location) {
  try {
    if (location) localStorage.setItem(LOCATION_KEY, JSON.stringify(location))
    else localStorage.removeItem(LOCATION_KEY)
  } catch {
    /* ignore storage failures */
  }
}

export function SessionProvider({ children }) {
  const { user, status } = useAuth()
  const [location, setLocation] = useState(readStoredLocation)
  const [locationStatus, setLocationStatus] = useState(() => (readStoredLocation() ? 'granted' : 'idle'))
  const [favoriteShops, setFavoriteShops] = useState([])
  const [favoritesReady, setFavoritesReady] = useState(false)

  const persistLocation = useCallback((next) => {
    setLocation(next)
    storeLocation(next)
  }, [])

  const requestLocation = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported')
      return null
    }
    setLocationStatus('requesting')
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = {
            latitude: Number(position.coords.latitude.toFixed(5)),
            longitude: Number(position.coords.longitude.toFixed(5)),
            label: 'Your location',
            source: 'gps',
          }
          persistLocation(next)
          setLocationStatus('granted')
          resolve(next)
        },
        () => {
          setLocationStatus('denied')
          resolve(null)
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
      )
    })
  }, [persistLocation])

  const setManualLocation = useCallback(
    (next) => {
      persistLocation(next ? { ...next, source: 'manual' } : null)
      setLocationStatus(next ? 'granted' : 'idle')
    },
    [persistLocation]
  )

  const clearLocation = useCallback(() => {
    persistLocation(null)
    setLocationStatus('idle')
  }, [persistLocation])

  useEffect(() => {
    if (status !== 'authenticated' || user?.role !== 'customer') {
      setFavoriteShops([])
      setFavoritesReady(status !== 'loading')
      return undefined
    }

    let active = true
    const controller = new AbortController()
    favoriteService
      .list(controller.signal)
      .then((shops) => {
        if (active) {
          setFavoriteShops(shops)
          setFavoritesReady(true)
        }
      })
      .catch(() => {
        if (active) setFavoritesReady(true)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [status, user?.role, user?.id])

  const favoriteShopIds = useMemo(() => favoriteShops.map((shop) => shop.id), [favoriteShops])

  const isFavorite = useCallback((shopId) => favoriteShopIds.includes(shopId), [favoriteShopIds])

  const toggleFavorite = useCallback(
    async (shop) => {
      const shopId = typeof shop === 'string' ? shop : shop?.id
      if (!shopId) return false
      const wasFavorite = favoriteShopIds.includes(shopId)

      setFavoriteShops((current) =>
        wasFavorite
          ? current.filter((entry) => entry.id !== shopId)
          : [...current, typeof shop === 'string' ? { id: shopId } : shop]
      )

      try {
        if (wasFavorite) await favoriteService.remove(shopId)
        else await favoriteService.add(shopId)
        return !wasFavorite
      } catch (error) {
        setFavoriteShops((current) =>
          wasFavorite
            ? [...current, typeof shop === 'string' ? { id: shopId } : shop]
            : current.filter((entry) => entry.id !== shopId)
        )
        throw error
      }
    },
    [favoriteShopIds]
  )

  const value = useMemo(
    () => ({
      location,
      locationStatus,
      requestLocation,
      setManualLocation,
      clearLocation,
      favoriteShopIds,
      favoriteShops,
      isFavorite,
      toggleFavorite,
      favoritesReady,
    }),
    [
      location,
      locationStatus,
      requestLocation,
      setManualLocation,
      clearLocation,
      favoriteShopIds,
      favoriteShops,
      isFavorite,
      toggleFavorite,
      favoritesReady,
    ]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
