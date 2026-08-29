import { supabase, isSupabaseConfigured } from '../config/supabase.js'
import { AppError } from '../lib/errors.js'
import { verifyToken } from '../lib/auth-tokens.js'

export function requireSupabase(_req, _res, next) {
  if (!isSupabaseConfigured) {
    return next(
      new AppError(
        503,
        'Database is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env',
        'SUPABASE_NOT_CONFIGURED'
      )
    )
  }

  next()
}

function readBearerToken(req) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null

  const token = header.slice(7).trim()
  return token || null
}

async function loadProfile(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new AppError(500, error.message, 'PROFILE_LOOKUP_FAILED')
  }

  return data
}

export async function requireAuth(req, _res, next) {
  try {
    if (!isSupabaseConfigured) {
      throw new AppError(503, 'Database is not configured', 'SUPABASE_NOT_CONFIGURED')
    }

    const token = readBearerToken(req)
    if (!token) {
      throw new AppError(401, 'Missing access token', 'UNAUTHENTICATED')
    }

    const payload = verifyToken(token)
    const profile = await loadProfile(payload.sub)

    if (!profile) {
      throw new AppError(401, 'This account no longer exists', 'UNAUTHENTICATED')
    }

    req.user = { id: profile.id, email: profile.email, role: profile.role }
    req.profile = profile
    next()
  } catch (err) {
    next(err)
  }
}

export function requireProfile(req, _res, next) {
  if (!req.profile) {
    return next(
      new AppError(403, 'Create your profile and choose a role first', 'PROFILE_REQUIRED')
    )
  }

  next()
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return next(new AppError(403, 'You do not have access to this resource', 'FORBIDDEN'))
    }

    next()
  }
}

export async function optionalAuth(req, _res, next) {
  req.user = null
  req.profile = null

  const token = readBearerToken(req)
  if (!token || !isSupabaseConfigured) {
    return next()
  }

  try {
    const payload = verifyToken(token)
    const profile = await loadProfile(payload.sub)

    if (profile) {
      req.user = { id: profile.id, email: profile.email, role: profile.role }
      req.profile = profile
    }
  } catch {
    // Anonymous visitors can still use public endpoints such as chat.
  }

  next()
}
