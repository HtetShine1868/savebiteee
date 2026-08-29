import { createContext, useContext } from 'react'

export const SessionContext = createContext({
  location: null,
  locationStatus: 'idle', // 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
  requestLocation: async () => {},
  setManualLocation: () => {},
  clearLocation: () => {},
  favoriteShopIds: [],
  favoriteShops: [],
  isFavorite: () => false,
  toggleFavorite: async () => {},
  favoritesReady: false,
})

export function useSession() {
  return useContext(SessionContext)
}
