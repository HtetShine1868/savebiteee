import { useCallback, useMemo, useState } from 'react'
import { ReserveContext } from './reserve-context.js'
import { ReserveDialog } from '../components/promo/ReserveDialog.jsx'

export function ReserveProvider({ children }) {
  const [promotion, setPromotion] = useState(null)
  const [open, setOpen] = useState(false)
  const [reservationVersion, setReservationVersion] = useState(0)

  const openReserve = useCallback((nextPromotion) => {
    setPromotion(nextPromotion)
    setOpen(true)
  }, [])

  const value = useMemo(() => ({ openReserve, reservationVersion }), [openReserve, reservationVersion])

  return (
    <ReserveContext.Provider value={value}>
      {children}
      <ReserveDialog
        promotion={promotion}
        open={open}
        onClose={() => setOpen(false)}
        onReserved={() => setReservationVersion((version) => version + 1)}
      />
    </ReserveContext.Provider>
  )
}
