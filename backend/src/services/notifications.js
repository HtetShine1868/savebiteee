import nodemailer from 'nodemailer'
import { supabase } from '../config/supabase.js'
import { unwrap } from '../lib/errors.js'

let transporter

export function notificationsEnabled() {
  return process.env.NOTIFICATIONS_ENABLED === 'true'
}

function mailTransporter() {
  if (transporter) return transporter

  const port = Number(process.env.SMTP_PORT) || 587
  const options = {
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
  }

  if (process.env.SMTP_USER || process.env.SMTP_PASS) {
    options.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  }

  transporter = nodemailer.createTransport(options)
  return transporter
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function promotionUrl(promotionId) {
  const base = (process.env.APP_PUBLIC_URL || process.env.CLIENT_URL || 'http://localhost:5173')
    .replace(/\/$/, '')
  return `${base}/promotions/${promotionId}`
}

function messageFor(listing) {
  const subject = `New promotion from ${listing.shop_name}: ${listing.product_name}`
  const url = promotionUrl(listing.id)
  const text = [
    `${listing.shop_name} has a new food promotion.`,
    `${listing.product_name}: ${listing.promo_price} MMK`,
    `Available until ${new Date(listing.ends_at).toLocaleString()}.`,
    'Walk-in pickup only.',
    url,
  ].join('\n')
  const html = `
    <h2>New food promotion from ${escapeHtml(listing.shop_name)}</h2>
    <p><strong>${escapeHtml(listing.product_name)}</strong> is available for
      ${escapeHtml(listing.promo_price)} MMK.</p>
    <p>Available until ${escapeHtml(new Date(listing.ends_at).toLocaleString())}.</p>
    <p>Walk-in pickup only.</p>
    <p><a href="${escapeHtml(url)}">View promotion</a></p>
  `

  return { subject, text, html }
}

async function setLogStatus(logId, status, errorMessage = null) {
  unwrap(
    await supabase
      .from('notification_log')
      .update({
        status,
        error_message: errorMessage,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      })
      .eq('id', logId)
  )
}

async function reserveNotification(userId, promotionId) {
  const existing = unwrap(
    await supabase
      .from('notification_log')
      .select('id, status')
      .eq('user_id', userId)
      .eq('promotion_id', promotionId)
      .eq('channel', 'email')
      .maybeSingle()
  )

  if (existing) return null

  return unwrap(
    await supabase
      .from('notification_log')
      .insert({
        user_id: userId,
        promotion_id: promotionId,
        channel: 'email',
        status: 'pending',
      })
      .select('id')
      .single()
  )
}

export async function notifyFavoriteShopPromotion(listing) {
  if (!notificationsEnabled()) {
    return { sent: 0, failed: 0, skipped: 0, disabled: true }
  }
  if (!process.env.SMTP_HOST || !process.env.EMAIL_FROM) {
    throw new Error('SMTP_HOST and EMAIL_FROM are required when notifications are enabled')
  }
  if (listing.status !== 'active') {
    return { sent: 0, failed: 0, skipped: 0, inactive: true }
  }

  const favorites = unwrap(
    await supabase
      .from('shop_favorites')
      .select(
        'user_id, profile:profiles!shop_favorites_user_id_fkey(email_notifications_enabled, notify_favorite_shops)'
      )
      .eq('shop_id', listing.shop_id)
  ) || []
  const eligible = favorites.filter(
    (row) =>
      row.profile?.email_notifications_enabled !== false
      && row.profile?.notify_favorite_shops !== false
  )
  const summary = { sent: 0, failed: 0, skipped: favorites.length - eligible.length }

  await Promise.all(
    eligible.map(async ({ user_id: userId }) => {
      let log
      try {
        log = await reserveNotification(userId, listing.id)
        if (!log) {
          summary.skipped += 1
          return
        }

        const { data, error } = await supabase.auth.admin.getUserById(userId)
        if (error) throw error
        if (!data.user?.email) {
          await setLogStatus(log.id, 'skipped', 'User has no email address')
          summary.skipped += 1
          return
        }

        await mailTransporter().sendMail({
          from: process.env.EMAIL_FROM,
          to: data.user.email,
          ...messageFor(listing),
        })
        await setLogStatus(log.id, 'sent')
        summary.sent += 1
      } catch (error) {
        if (log?.id) {
          try {
            await setLogStatus(log.id, 'failed', String(error.message || error).slice(0, 1000))
          } catch (logError) {
            console.error('Could not update notification failure log:', logError)
          }
        }
        summary.failed += 1
      }
    })
  )

  return summary
}
