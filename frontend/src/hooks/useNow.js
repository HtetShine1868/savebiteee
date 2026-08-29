import { useEffect, useState } from 'react'

/** Ticking clock so countdown labels stay fresh without a timer per card. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
