# API reference — frontend ↔ backend

The React app in `frontend/` talks to the Express API in `backend/`. Every request the
frontend makes lives in `frontend/src/lib/services.js`; every route below is implemented in
`backend/src/routes/`. This file describes what is actually live, not a wishlist.

- Base URL: `VITE_API_URL`. Empty in development → the Vite proxy forwards `/api/*` to
  `http://localhost:5000`. In production it is set in `netlify.toml`.
- Auth: `Authorization: Bearer <token>` on authenticated calls. The token is a JWT issued by
  this API (not by Supabase) and is kept in `localStorage` under `fws.token`.
- Supabase is used **only as the database**. Accounts, password hashing and sessions are
  handled by the API; the browser never talks to Supabase.
- Errors: `{ "error": "Human readable message", "code": "MACHINE_CODE", "details": [...] }`
  with a matching HTTP status. The `error` string is shown to the user.
- Lists are `{ "items": [...] }`, paged lists add `{ "page": { limit, offset, total } }`, and
  single objects are wrapped by name (`{ "promotion": {...} }`).
- Reads are camelCase. Writes are camelCase too and validated with zod
  (`backend/src/validators.js`).

## Auth — `/api/auth`

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/register` | `{ email, password, role, fullName?, city?, shopName?, latitude?, longitude? }` | `201 { token, user, profile }` |
| POST | `/login` | `{ email, password }` | `{ token, user, profile }` |
| POST | `/google` | `{ idToken, role?, shopName? }` | `{ token, user, profile, isNewAccount }` |
| GET | `/me` | — | `{ user, profile }` |
| PATCH | `/me` | `{ fullName?, city?, latitude?, longitude?, emailNotificationsEnabled?, notifyFavoriteShops? }` | `{ user, profile }` |
| POST | `/logout` | — | `204` (the client discards the token) |

- `role` is `customer` or `owner`; passwords are at least 8 characters, hashed with bcrypt.
- `shopName` on an owner registration creates their shop immediately.
- `/google` verifies the ID token with Google. Set `GOOGLE_CLIENT_ID` (API) and
  `VITE_GOOGLE_CLIENT_ID` (frontend) to the same OAuth client, otherwise the button is hidden.
- `409 EMAIL_TAKEN`, `401 INVALID_CREDENTIALS` and `503 JWT_NOT_CONFIGURED` are the failures
  worth handling.

**User shape**

```json
{
  "id": "uuid",
  "email": "aye@example.com",
  "role": "customer",
  "fullName": "Aye Chan",
  "avatarUrl": null,
  "city": "Yangon",
  "latitude": 16.8,
  "longitude": 96.15,
  "emailNotificationsEnabled": true,
  "notifyFavoriteShops": true,
  "shopId": null,
  "shopName": null,
  "shopSlug": null
}
```

`shopId` is filled in for owners so the UI can link straight to their shop.

## Promotions — `/api/promotions`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/` | Public, paged. |
| GET | `/dashboard` | Public. Pre-grouped sections (`availableNow`, `endingSoon`, `byCategory`, `nearby`, `personalized`, `fromFavoriteShops`). |
| GET | `/:id` | Public. `{ promotion }`. |

Owner writes live under `/api/owner` (below).

**Query params:** `q`, `category` (slug), `city`, `minPrice`, `maxPrice`,
`endingSoon` (`true` = closing within 2 hours), `shopId`, `status`
(`active` default, or `upcoming` / `sold_out` / `expired`),
`sort` (`ending_soon` default, `lowest_price`, `newest`),
`latitude` + `longitude` (+ optional `radiusKm`), `limit` (max 50), `offset`.

Latitude and longitude must be sent together. When they are present the search uses the
nearby SQL function, which only returns shops that have coordinates — so the frontend only
sends them when the visitor filters by distance, and computes display distances in the
browser.

**Promotion shape**

```json
{
  "id": "uuid",
  "productName": "Butter croissant box",
  "description": "Baked this morning…",
  "imageUrl": null,
  "originalPrice": 9000,
  "promoPrice": 3600,
  "quantityAvailable": 4,
  "startsAt": "2026-08-29T09:00:00.000Z",
  "endsAt": "2026-08-29T13:00:00.000Z",
  "foodExpiresAt": null,
  "pickupLocation": "42 Hledan Road",
  "status": "active",
  "distanceKm": 1.4,
  "category": { "id": "uuid", "name": "Bakery", "slug": "bakery" },
  "shop": {
    "id": "uuid",
    "name": "Sweet Crumb Bakery",
    "slug": "sweet-crumb-bakery",
    "city": "Yangon",
    "address": "42 Hledan Road",
    "imageUrl": null,
    "phone": "+95 9 …",
    "latitude": 16.8218,
    "longitude": 96.1352
  }
}
```

`status` is computed in SQL (`active`, `upcoming`, `sold_out`, `expired`) and never stored.
`distanceKm` only appears on nearby searches.

## Owner console — `/api/owner`

Requires a signed-in profile with `role = "owner"`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/shops` | `{ items }` — the owner's shops (the UI uses the first). |
| POST | `/shops` | Create. Slug is generated server-side. |
| PATCH | `/shops/:id` | Update, own shop only. |
| GET | `/promotions` | All own listings, any status. Optional `?shopId=`. |
| POST | `/promotions` | Create; triggers favourite-shop emails when enabled. |
| PATCH | `/promotions/:id` | Update, own listing only. |
| DELETE | `/promotions/:id` | `409 HAS_ACTIVE_RESERVATIONS` while reservations are open. |
| GET | `/reservations` | Reservations across own promotions, with `customer` attached. Optional `?status=`. |
| PATCH | `/reservations/:id` | `{ status }` — `picked_up`, `cancelled` or `expired`. |

**Promotion write body**

```json
{
  "shopId": "uuid",
  "categoryId": "uuid or null",
  "productName": "Butter croissant box",
  "description": "Baked this morning…",
  "imageUrl": null,
  "originalPrice": 9000,
  "promoPrice": 3600,
  "quantityAvailable": 4,
  "startsAt": "2026-08-29T09:00:00.000Z",
  "endsAt": "2026-08-29T13:00:00.000Z",
  "foodExpiresAt": null,
  "pickupLocation": "42 Hledan Road"
}
```

`shopId` is omitted on PATCH. Categories come from `GET /api/categories`; the frontend maps
its category slug to the id before saving. The database also enforces
`promoPrice <= originalPrice` and `endsAt > startsAt`.

**Shop write body:** `name`, `description`, `profileImageUrl`, `coverImageUrl`, `address`,
`city`, `latitude`, `longitude`, `contactPhone`, `contactEmail`, `categories` (slug array),
`openingHours` (`{ "weekdays": "07:00 – 20:00", "weekends": "…" }`). Image and email fields
must be valid URLs / addresses or `null`.

## Shops — `/api/shops`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/:id` | Public. `{ shop, promotions }` — the shop plus its active listings. |

Shops are addressed by id, so the public page route is `/app/shops/:id`. There is no public
shop list endpoint: shops are discovered through promotions, search and favourites.

## Favourites — `/api/favorites`

Customers only.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/` | Paged `{ items: [{ shop, favoritedAt }] }`. |
| GET | `/promotions` | Active promotions from favourited shops, paged. |
| POST | `/:shopId` | `201 { shop, favoritedAt }`. Idempotent. |
| DELETE | `/:shopId` | `204`. |

The UI updates optimistically and rolls back if the request fails.

## Reservations (walk-in pickup) — `/api/reservations`

Customers only.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/me` | Own reservations, newest first, each with its `promotion`. |
| POST | `/` | `{ promotionId, quantity }` → `201 { reservation, pickupOnly, pickupNote }`. |
| POST | `/:id/cancel` | Returns the stock and cancels. |

Stock is changed only through the `reserve_promotion`, `cancel_reservation` and
`set_reservation_status` SQL functions, which lock the row so quantity can never go negative.
Their exceptions are mapped to friendly errors:

| Exception | Status | Meaning |
| --- | --- | --- |
| `INSUFFICIENT_QUANTITY` | 409 | Not enough left — reduce the quantity. |
| `PROMOTION_EXPIRED` | 409 | The promotion has just ended. |
| `PROMOTION_NOT_STARTED` | 409 | It has not started yet. |
| `INVALID_QUANTITY` | 400 | At least one portion. |
| `RESERVATION_NOT_ACTIVE` | 409 | It can no longer be changed. |
| `FORBIDDEN` | 403 | Not the reservation owner. |

**Reservation shape**

```json
{
  "id": "uuid",
  "promotionId": "uuid",
  "customerId": "uuid",
  "quantity": 2,
  "status": "reserved",
  "pickupBy": "2026-08-29T13:00:00.000Z",
  "createdAt": "2026-08-29T10:12:00.000Z",
  "promotion": { "…promotion shape…": true },
  "customer": { "…profile shape, owner views only…": true }
}
```

`status` is `reserved`, `picked_up`, `cancelled` or `expired`.

## AI chat — `POST /api/chat`

Works signed in or anonymously (a token personalises favourites).

```json
{
  "message": "I have 5000 MMK. What sweet food can I get near me right now?",
  "history": [{ "role": "user", "content": "…" }, { "role": "assistant", "content": "…" }],
  "latitude": 16.8661,
  "longitude": 96.1951,
  "radiusKm": 5,
  "city": "Yangon"
}
```

Response:

```json
{
  "reply": "I found 2 dessert promotions under 5,000 MMK near you. Pickup is walk-in only.",
  "criteria": { "intent": "search_promotions", "category": "desserts", "maxPrice": 5000, "nearMe": true },
  "promotions": [{ "…promotion shape…": true }],
  "pickupOnly": true,
  "meta": { "intentSource": "gemini", "geminiConfigured": true, "catalogAvailable": true }
}
```

Gemini only extracts the criteria and writes the sentence; the promotions always come from
the database. `meta.intentSource` is `fallback` when Gemini is unavailable and keyword parsing
was used instead — the answer is still real, just less clever. `criteria` is rendered as
"Understood as" chips in the chat UI.

## Categories and stats

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/categories` | `{ items: [{ id, name, slug }] }`. Eight seeded categories. |
| GET | `/api/stats/impact` | `{ stats: { mealsRescued, moneySaved, partnerShops, customers, activePromotions } }`. Measured from collected reservations; renders the landing page band. |
| GET | `/api/health` | `{ status, service, timestamp }`. |

## Email notifications

When `NOTIFICATIONS_ENABLED=true` and SMTP is configured, publishing a promotion emails
customers who favourited that shop (once per promotion, tracked in `notification_log`).
Customers can opt out with `PATCH /api/auth/me`.
