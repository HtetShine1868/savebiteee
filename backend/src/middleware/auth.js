import { supabase, isSupabaseConfigured } from '../config/supabase.js'
import { AppError } from '../lib/errors.js'

export function requireSupabase(_req, _res, next) {
  if (!isSupabaseConfigured) {
    return next(
      new AppError(
        503,
        'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env',
        'SUPABASE_NOT_CONFIGURED'
      )
    )
  }

  next()
}

export async function requireAuth(req, _res, next) {
  try {
    if (!isSupabaseConfigured) {
      throw new AppError(503, 'Supabase is not configured', 'SUPABASE_NOT_CONFIGURED')
    }

    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Missing access token', 'UNAUTHENTICATED')
    }

    const token = header.slice(7)
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      throw new AppError(401, 'Invalid or expired access token', 'UNAUTHENTICATED')
    }

    req.user = data.user

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError) {
      throw new AppError(500, profileError.message, 'PROFILE_LOOKUP_FAILED')
    }

    req.profile = profile
    next()
  } catch (err) {
    next(err)
  }
}

export function requireProfile(req, _res, next) {
  if (!req.profile) {
    return next(
      new AppError(
        403,
        'Create your profile and choose a role first',
        'PROFILE_REQUIRED'
      )
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

  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ') || !isSupabaseConfigured) {
    return next()
  }

  try {
    const token = header.slice(7)
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      return next()
    }

    req.user = data.user
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()
    req.profile = profile || null
  } catch {
    // Chat still works without a signed-in user.
  }

  next()
}
