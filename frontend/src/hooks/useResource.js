import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Loads data from a service function with loading/error state, abort on
 * unmount, and a `reload` for retries after a failed request.
 */
export function useResource(loader, deps = [], { enabled = true, initialData = null } = {}) {
  const [state, setState] = useState({ data: initialData, error: null, loading: enabled })
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    if (!enabled) {
      setState({ data: initialData, error: null, loading: false })
      return undefined
    }

    const controller = new AbortController()
    let active = true
    setState((prev) => ({ ...prev, loading: true, error: null }))

    Promise.resolve(loaderRef.current(controller.signal))
      .then((data) => {
        if (active) setState({ data, error: null, loading: false })
      })
      .catch((error) => {
        if (active && error?.name !== 'AbortError') {
          setState({ data: initialData, error, loading: false })
        }
      })

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])
  const setData = useCallback((update) => {
    setState((prev) => ({
      ...prev,
      data: typeof update === 'function' ? update(prev.data) : update,
    }))
  }, [])

  return { ...state, reload, setData }
}
