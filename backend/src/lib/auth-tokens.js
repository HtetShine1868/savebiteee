import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AppError } from './errors.js'

const DEFAULT_EXPIRES_IN = '30d'
const SALT_ROUNDS = 10

function getSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new AppError(
      503,
      'JWT_SECRET is not configured. Add it to backend/.env',
      'JWT_NOT_CONFIGURED'
    )
  }

  return secret
}

export const isAuthConfigured = Boolean(process.env.JWT_SECRET)

export function hashPassword(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS)
}

export async function verifyPassword(plainText, passwordHash) {
  if (!passwordHash) return false
  return bcrypt.compare(plainText, passwordHash)
}

export function signToken(profile) {
  return jwt.sign(
    { sub: profile.id, email: profile.email, role: profile.role },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret())
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(401, 'Session expired. Please sign in again.', 'UNAUTHENTICATED')
  }
}

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'

export async function verifyGoogleIdToken(idToken) {
  const response = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`)

  if (!response.ok) {
    throw new AppError(401, 'Google sign-in could not be verified', 'GOOGLE_TOKEN_INVALID')
  }

  const payload = await response.json()
  const expectedAudience = process.env.GOOGLE_CLIENT_ID

  if (expectedAudience && payload.aud !== expectedAudience) {
    throw new AppError(401, 'Google sign-in was issued for another app', 'GOOGLE_TOKEN_AUDIENCE')
  }

  if (!payload.email) {
    throw new AppError(401, 'Google account did not share an email address', 'GOOGLE_TOKEN_EMAIL')
  }

  return {
    email: String(payload.email).toLowerCase(),
    emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
    fullName: payload.name || null,
    avatarUrl: payload.picture || null,
  }
}
