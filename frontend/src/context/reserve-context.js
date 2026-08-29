import { createContext, useContext } from 'react'

export const ReserveContext = createContext({
  openReserve: () => {},
  /** Bumped after every successful reservation so lists can refetch stock. */
  reservationVersion: 0,
})

export function useReserve() {
  return useContext(ReserveContext)
}
