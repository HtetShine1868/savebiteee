import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAuthToken, setAuthToken } from '../lib/api.js'
import { authService } from '../lib/services.js'
import { AuthContext } from './auth-context.js'

const USER_CACHE_KEY = 'fws.user'

function readCachedUser() {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCachedUser(user) {
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_CACHE_KEY)
  } catch {
    /* ignore storage failures */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getAuthToken() ? readCachedUser() : null))
  const [status, setStatus] = useState(() => (getAuthToken() ? 'loading' : 'anonymous'))

  const applySession = useCallback((token, nextUser) => {
    if (token) setAuthToken(token)
    setUser(nextUser)
    writeCachedUser(nextUser)
    setStatus(nextUser ? 'authenticated' : 'anonymous')
  }, [])

  const clearSession = useCallback(() => {
    setAuthToken(null)
    writeCachedUser(null)
    setUser(null)
    setStatus('anonymous')
  }, [])

  const refresh = useCallback(async () => {
    if (!getAuthToken()) {
      clearSession()
      return null
    }
    try {
      const fresh = await authService.me()
      applySession(null, fresh)
      return fresh
    } catch (error) {
      // Only a rejected token ends the session; an unreachable or unfinished
      // API keeps the cached user so the app stays usable.
      if (error?.isAuth) clearSession()
      else setStatus(user ? 'authenticated' : 'anonymous')
      return null
    }
  }, [applySession, clearSession, user])

  useEffect(() => {
    if (getAuthToken()) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(
    async (credentials) => {
      const { token, user: nextUser } = await authService.login(credentials)
      applySession(token, nextUser)
      return nextUser
    },
    [applySession]
  )

  const register = useCallback(
    async (payload) => {
      const { token, user: nextUser } = await authService.register(payload)
      applySession(token, nextUser)
      return nextUser
    },
    [applySession]
  )

  const loginWithGoogle = useCallback(
    async (payload) => {
      const { token, user: nextUser } = await authService.loginWithGoogle(payload)
      applySession(token, nextUser)
      return nextUser
    },
    [applySession]
  )

  const logout = useCallback(async () => {
    await authService.logout()
    clearSession()
  }, [clearSession])

  const patchUser = useCallback((patch) => {
    setUser((current) => {
      if (!current) return current
      const next = { ...current, ...patch }
      writeCachedUser(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      isCustomer: user?.role === 'customer',
      isOwner: user?.role === 'owner',
      login,
      register,
      loginWithGoogle,
      logout,
      refresh,
      patchUser,
    }),
    [user, status, login, register, loginWithGoogle, logout, refresh, patchUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
