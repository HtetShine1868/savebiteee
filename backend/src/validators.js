import { z } from 'zod'

const role = z.enum(['customer', 'owner'])
const uuid = z.string().uuid()
const optionalText = z.string().trim().max(2000).optional().nullable()
const url = z.string().trim().url().max(2000).optional().nullable()

export const createProfileSchema = z.object({
  role,
  fullName: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().max(120).optional(),
})

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().max(120).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  emailNotificationsEnabled: z.boolean().optional(),
  notifyFavoriteShops: z.boolean().optional(),
})

const shopFields = {
  name: z.string().trim().min(1).max(160),
  description: optionalText,
  profileImageUrl: url,
  coverImageUrl: url,
  address: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  contactPhone: z.string().trim().max(40).optional().nullable(),
  contactEmail: z.string().trim().email().max(160).optional().nullable(),
  categories: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  openingHours: z.record(z.string(), z.string()).optional().nullable(),
}

export const createShopSchema = z.object(shopFields)

export const updateShopSchema = z.object(shopFields).partial()

const promotionFields = {
  shopId: uuid,
  categoryId: uuid.optional().nullable(),
  productName: z.string().trim().min(1).max(160),
  description: optionalText,
  imageUrl: url,
  originalPrice: z.number().min(0),
  promoPrice: z.number().min(0),
  quantityAvailable: z.number().int().min(0),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  foodExpiresAt: z.string().datetime().optional().nullable(),
  pickupLocation: z.string().trim().max(300).optional().nullable(),
}

export const createPromotionSchema = z
  .object(promotionFields)
  .refine((data) => data.promoPrice <= data.originalPrice, {
    message: 'Promo price cannot be higher than the original price',
    path: ['promoPrice'],
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'End time must be after start time',
    path: ['endsAt'],
  })

export const updatePromotionSchema = z
  .object(promotionFields)
  .partial()
  .omit({ shopId: true })
  .refine(
    (data) =>
      data.promoPrice === undefined ||
      data.originalPrice === undefined ||
      data.promoPrice <= data.originalPrice,
    {
      message: 'Promo price cannot be higher than the original price',
      path: ['promoPrice'],
    }
  )

export const createReservationSchema = z.object({
  promotionId: uuid,
  quantity: z.number().int().min(1),
})

export const ownerReservationStatusSchema = z.object({
  status: z.enum(['picked_up', 'cancelled', 'expired']),
})

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  city: z.string().trim().max(120).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().min(0.1).max(50).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .max(12)
    .optional(),
}).refine(
  (data) => (data.latitude === undefined) === (data.longitude === undefined),
  {
    message: 'Latitude and longitude must be provided together',
    path: ['latitude'],
  }
)

export function parseBody(schema, body) {
  const result = schema.safeParse(body)

  if (!result.success) {
    const issue = result.error.issues[0]
    const error = new Error(issue?.message || 'Invalid request')
    error.status = 400
    error.code = 'VALIDATION_ERROR'
    error.details = result.error.issues
    throw error
  }

  return result.data
}
