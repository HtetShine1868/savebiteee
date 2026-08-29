import { GoogleGenAI } from '@google/genai'
import { emptyCriteria, fallbackExtractCriteria } from './intent.js'

const CRITERIA_SCHEMA = {
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      enum: ['search_promotions', 'general_question', 'help'],
    },
    product: { type: 'string', nullable: true },
    category: {
      type: 'string',
      nullable: true,
      enum: [
        'bakery',
        'pizza',
        'asian',
        'drinks',
        'groceries',
        'desserts',
        'vegetarian',
        'other',
        null,
      ],
    },
    location: { type: 'string', nullable: true },
    nearMe: { type: 'boolean' },
    radiusKm: { type: 'number', nullable: true },
    minPrice: { type: 'number', nullable: true },
    maxPrice: { type: 'number', nullable: true },
    availableNow: { type: 'boolean' },
    endingSoon: { type: 'boolean' },
    sortBy: {
      type: 'string',
      nullable: true,
      enum: ['lowest_price', 'ending_soon', 'newest', null],
    },
    shopPreference: {
      type: 'string',
      nullable: true,
      enum: ['favorites', null],
    },
    vegetarian: { type: 'boolean' },
  },
  required: ['intent'],
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  return new GoogleGenAI({ apiKey })
}

function modelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash'
}

function parseJson(text) {
  if (!text) return null
  const cleaned = text.replace(/^```json\s*|```$/g, '').trim()
  return JSON.parse(cleaned)
}

function mergeCriteria(parsed, message) {
  const fallback = fallbackExtractCriteria(message)
  return {
    ...emptyCriteria(),
    ...fallback,
    ...parsed,
    product: parsed?.product || fallback.product,
    category: parsed?.category || fallback.category,
    location: parsed?.location || fallback.location,
  }
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY)
}

export async function extractSearchCriteria(message, history = [], context = {}) {
  const client = getClient()
  if (!client) {
    return {
      criteria: fallbackExtractCriteria(message),
      source: 'fallback',
    }
  }

  const historyText = history
    .slice(-6)
    .map((item) => `${item.role}: ${item.content}`)
    .join('\n')

  const prompt = `You extract search filters for a food-waste promotion app in Myanmar.
Never invent products, shops, prices, or stock.
Return only JSON matching the schema.

Known categories: bakery, pizza, asian, drinks, groceries, desserts, vegetarian, other.
Currency is MMK.
If the user says "near me" or "nearby", set nearMe=true.
If the user gives a distance in kilometers, put it in radiusKm.
If they name a city such as Yangon, put it in location.
If they ask for their favorite shops, set shopPreference="favorites".
If they say cheap or affordable, sortBy=lowest_price.
If they say ending soon, endingSoon=true.

User city if known: ${context.city || 'unknown'}

Recent chat:
${historyText || '(none)'}

Current user message:
${message}`

  try {
    const response = await client.models.generateContent({
      model: modelName(),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: CRITERIA_SCHEMA,
      },
    })

    const parsed = parseJson(response.text)
    return {
      criteria: mergeCriteria(parsed, message),
      source: 'gemini',
    }
  } catch (err) {
    console.warn('Gemini extract failed, using fallback:', err.message)
    return {
      criteria: fallbackExtractCriteria(message),
      source: 'fallback',
    }
  }
}

export async function composeChatReply({ message, criteria, promotions, catalogAvailable }) {
  const names = promotions.map((item) => ({
    id: item.id,
    productName: item.productName,
    shopName: item.shop?.name,
    promoPrice: item.promoPrice,
    originalPrice: item.originalPrice,
    city: item.shop?.city,
    quantityAvailable: item.quantityAvailable,
    endsAt: item.endsAt,
  }))

  const client = getClient()
  if (!client) {
    return templateReply({ promotions, catalogAvailable, criteria })
  }

  const prompt = `You are the Food Waste Solver assistant.
Write a short, friendly reply (2-4 sentences).
You may ONLY mention promotions from this JSON list. Never invent food, shops, or prices.
If the list is empty, say nothing matching was found and suggest a broader search.
Mention that pickup is walk-in only if you show results.
Do not use markdown tables.

User message: ${message}
Search criteria: ${JSON.stringify(criteria)}
Catalog available: ${catalogAvailable}
Matching promotions: ${JSON.stringify(names)}`

  try {
    const response = await client.models.generateContent({
      model: modelName(),
      contents: prompt,
    })
    const text = (response.text || '').trim()
    return text || templateReply({ promotions, catalogAvailable, criteria })
  } catch (err) {
    console.warn('Gemini reply failed, using template:', err.message)
    return templateReply({ promotions, catalogAvailable, criteria })
  }
}

export function templateReply({ promotions, catalogAvailable, criteria }) {
  if (!catalogAvailable) {
    return 'I understood your request, but the promotion catalog is offline right now. Try again once the database is connected.'
  }

  if (!promotions.length) {
    const bits = [criteria.product, criteria.category, criteria.location]
      .filter(Boolean)
      .join(', ')
    return bits
      ? `I could not find active promotions matching ${bits}. Try another food type, city, or price range.`
      : 'I could not find active promotions right now. Try a food type such as pizza or bakery, or a city such as Yangon.'
  }

  const preview = promotions
    .slice(0, 3)
    .map((item) => `${item.productName} at ${item.shop?.name || 'a local shop'} for ${item.promoPrice} MMK`)
    .join('; ')

  return `I found ${promotions.length} real promotion${promotions.length === 1 ? '' : 's'} from the catalog. Pickup is walk-in only. ${preview}.`
}
