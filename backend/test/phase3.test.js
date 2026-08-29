import test from 'node:test'
import assert from 'node:assert/strict'
import { haversineKm } from '../src/lib/location.js'
import { fallbackExtractCriteria, criteriaToSearchParams } from '../src/services/intent.js'
import {
  applyPromotionFilters,
  parseLocationParams,
  rankPersonalizedRows,
} from '../src/services/promotions.js'
import { notificationsEnabled } from '../src/services/notifications.js'
import { chatSchema } from '../src/validators.js'

test('haversine distance follows the great-circle calculation', () => {
  assert.equal(haversineKm(16.8661, 96.1951, 16.8661, 96.1951), 0)
  assert.ok(Math.abs(haversineKm(0, 0, 0, 1) - 111.195) < 0.01)
})

test('location parsing validates coordinate pairs and radius', () => {
  assert.equal(parseLocationParams({}), null)
  assert.deepEqual(
    parseLocationParams({ latitude: '16.8', longitude: '96.1', radiusKm: '5' }),
    { latitude: 16.8, longitude: 96.1, radiusKm: 5 }
  )
  assert.throws(
    () => parseLocationParams({ latitude: 16.8 }),
    (error) => error.code === 'INVALID_LOCATION'
  )
  assert.throws(
    () => parseLocationParams({ latitude: 16.8, longitude: 96.1, radiusKm: 1000 }),
    (error) => error.code === 'INVALID_RADIUS'
  )
})

test('promotion filters include favorite shops and reserved categories', () => {
  const calls = []
  const query = new Proxy(
    {},
    {
      get: (_target, method) => (...args) => {
        calls.push([method, ...args])
        return query
      },
    }
  )

  applyPromotionFilters(query, {
    status: 'active',
    shopIds: ['shop-1'],
    categoryIds: ['category-1'],
  })

  assert.deepEqual(calls, [
    ['eq', 'status', 'active'],
    ['in', 'shop_id', ['shop-1']],
    ['in', 'category_id', ['category-1']],
  ])
})

test('personalization ranks favorites first and removes duplicates', () => {
  const result = rankPersonalizedRows(
    [{ id: 'favorite' }, { id: 'duplicate' }],
    [{ id: 'duplicate' }, { id: 'category' }],
    { limit: 10, offset: 0 }
  )

  assert.deepEqual(result.rows.map((row) => row.id), [
    'favorite',
    'duplicate',
    'category',
  ])
  assert.equal(result.count, 3)
})

test('fallback intent maps favorite and nearby language to search parameters', () => {
  const criteria = fallbackExtractCriteria(
    'Show pizza from my favorite shops within 5 km near me'
  )
  const params = criteriaToSearchParams(criteria, {
    latitude: 16.8661,
    longitude: 96.1951,
    favoriteShopIds: ['shop-1'],
  })

  assert.equal(criteria.shopPreference, 'favorites')
  assert.equal(params.radiusKm, 5)
  assert.deepEqual(params.shopIds, ['shop-1'])
  assert.equal(params.latitude, 16.8661)
})

test('chat location validation requires latitude and longitude together', () => {
  assert.equal(
    chatSchema.safeParse({ message: 'near me', latitude: 16.8 }).success,
    false
  )
  assert.equal(
    chatSchema.safeParse({
      message: 'near me',
      latitude: 16.8,
      longitude: 96.1,
      radiusKm: 5,
    }).success,
    true
  )
})

test('email notifications remain disabled unless explicitly enabled', () => {
  const previous = process.env.NOTIFICATIONS_ENABLED
  delete process.env.NOTIFICATIONS_ENABLED
  assert.equal(notificationsEnabled(), false)
  process.env.NOTIFICATIONS_ENABLED = 'true'
  assert.equal(notificationsEnabled(), true)

  if (previous === undefined) delete process.env.NOTIFICATIONS_ENABLED
  else process.env.NOTIFICATIONS_ENABLED = previous
})
