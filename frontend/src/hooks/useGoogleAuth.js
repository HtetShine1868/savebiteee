import { useEffect, useRef, useState } from 'react'

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

function loadScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (window.google?.accounts?.id) return Promise.resolve()

  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

/**
 * Renders the official Google button when VITE_GOOGLE_CLIENT_ID is configured
 * and hands the ID token to `onCredential` for POST /api/auth/google.
 */
export function useGoogleAuth(onCredential) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const buttonRef = useRef(null)
  const callbackRef = useRef(onCredential)
  const [state, setState] = useState(clientId ? 'loading' : 'unconfigured')

  useEffect(() => {
    callbackRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false

    loadScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callbackRef.current?.(response.credential),
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 320,
        })
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [clientId])

  return { state, buttonRef, enabled: Boolean(clientId) }
}
