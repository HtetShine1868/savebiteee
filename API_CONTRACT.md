# API Contract — what the frontend calls

The React app in `frontend/` talks to the Express API in `backend/`. Every request the
frontend makes is defined in `frontend/src/lib/services.js`; this document is the
matching checklist for the backend.

- Base URL: `VITE_API_URL` (empty in dev → the Vite proxy forwards `/api/*` to `http://localhost:5000`).
- Auth: `Authorization: Bearer <token>` on every authenticated call. The token comes from the
  login/register response and is stored in `localStorage` under `fws.token`.
- Errors: respond with the matching HTTP status and a JSON body `{ "error": "Human readable message", "code": "MACHINE_CODE" }`.
  The `error` string is shown to the user, so keep it friendly (for example
  `"Only 2 portions left — reduce the quantity."`).
- `404` on any of these routes is treated as "not implemented yet" and the UI shows a
  waiting-on-API state instead of an error, so partial progress is safe to deploy.

## Naming

**Reads:** the frontend accepts either `snake_case` (rows straight from the
`promotion_listings` view) or `camelCase`. Returning the view rows as-is works.

**Writes:** the frontend sends `snake_case` bodies matching the columns in
`backend/supabase/schema.sql`.

Lists may be returned as a bare array or wrapped: `{ "promotions": [...] }`,
`{ "items": [...] }` and `{ "data": [...] }` all work. Single objects likewise:
`{ "promotion": {...} }` or the object itself.

## Auth

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{ role, fullName, email, password, city, shopName? }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| POST | `/api/auth/google` | `{ idToken, role? }` | `{ token, user }` |
| GET | `/api/auth/me` | — | `{ user }` |
| POST | `/api/auth/logout` | — | `204` |

`role` is `"customer"` or `"owner"`. `shopName` is only sent when registering an owner —
create the shop row (or a draft) at that point.

**User shape**

```json
{
  "id": "uuid",
  "email": "aye@example.com",
  "fullName": "Aye Chan",
  "role": "customer",
  "avatarUrl": null,
  "phone": "+95 9 ...",
  "city": "Yangon",
  "latitude": 16.8,
  "longitude": 96.15,
  "shopId": "uuid or null"
}
```

`shopId` on an owner lets the UI link straight to their shop.

## Promotions

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/promotions` | Public. Query params below. |
| GET | `/api/promotions/:id` | Public. |
| GET | `/api/owner/promotions` | Owner's own listings, any status. |
| POST | `/api/promotions` | Owner. Body = promotion write shape. |
| PATCH | `/api/promotions/:id` | Owner, own listing only. |
| DELETE | `/api/promotions/:id` | Owner, own listing only. |

**Query params on `GET /api/promotions`**

`query`, `category` (comma-separated slugs), `minPrice`, `maxPrice`, `endingSoon` (`1`),
`availableOnly` (`1`), `city`, `shopId`, `lat`, `lng`, `radiusKm`,
`sortBy` (`ending_soon` | `price_asc` | `price_desc` | `discount` | `distance` | `newest`), `limit`.

The frontend also filters and sorts client-side, so ignoring a param degrades gracefully —
but server-side filtering keeps payloads small.

**Promotion read shape** (the `promotion_listings` view already provides this)

```json
{
  "id": "uuid",
  "shop_id": "uuid",
  "product_name": "Butter Croissant Box",
  "description": "Baked this morning…",
  "image_url": "https://…",
  "original_price": 9000,
  "promo_price": 3600,
  "quantity_available": 4,
  "starts_at": "2026-08-29T09:00:00Z",
  "ends_at": "2026-08-29T13:00:00Z",
  "food_expires_at": null,
  "pickup_location": "42 Hledan Road",
  "status": "active",
  "distance_km": 1.4,
  "category_name": "Bakery",
  "category_slug": "bakery",
  "shop_name": "Sweet Crumb Bakery",
  "shop_slug": "sweet-crumb-bakery",
  "shop_city": "Yangon",
  "shop_address": "42 Hledan Road",
  "shop_latitude": 16.8218,
  "shop_longitude": 96.1352,
  "shop_image_url": "https://…",
  "shop_phone": "+95 9 …"
}
```

`status` is one of `active`, `upcoming`, `sold_out`, `expired`. If it is missing the frontend
computes it from the timestamps and quantity, but sending it keeps both sides in agreement.
`distance_km` is optional — when `lat`/`lng` are provided the frontend can also compute it.

**Promotion write shape**

```json
{
  "product_name": "Butter Croissant Box",
  "description": "Baked this morning…",
  "image_url": "https://…",
  "category_slug": "bakery",
  "original_price": 9000,
  "promo_price": 3600,
  "quantity_available": 4,
  "starts_at": "2026-08-29T09:00:00.000Z",
  "ends_at": "2026-08-29T13:00:00.000Z",
  "food_expires_at": null,
  "pickup_location": "42 Hledan Road"
}
```

Resolve `category_slug` to `category_id` server-side. Re-validate everything: the DB has
`promo_price <= original_price` and `ends_at > starts_at` checks, and the client validation
is only there for fast feedback.

## Shops

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/shops` | Public list, supports `query`. |
| GET | `/api/shops/:slug` | Public. Ideally `{ shop, promotions }` — if you only return the shop, the frontend fetches its promotions separately. |
| GET | `/api/owner/shop` | The signed-in owner's shop. `404` while none exists → the UI shows a "finish your profile" banner. |
| PUT | `/api/owner/shop` | Create or update (upsert) the owner's shop. |

**Shop write shape**: `name`, `description`, `profile_image_url`, `cover_image_url`,
`address`, `city`, `latitude`, `longitude`, `contact_phone`, `contact_email`,
`categories` (array of slugs), `opening_hours` (`{ "weekdays": "07:00 – 20:00", "weekends": "…" }`).

## Favourites

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/favorites` | `{ shops: [ …shop objects… ] }`. Full shop objects render nicer than bare IDs. |
| POST | `/api/favorites/:shopId` | Add. |
| DELETE | `/api/favorites/:shopId` | Remove. |

The UI updates optimistically and rolls back if the request fails.

## Reservations (walk-in pickup)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/reservations` | The signed-in customer's reservations, each with its `promotion`. |
| POST | `/api/reservations` | Body `{ promotion_id, quantity, note }`. |
| PATCH | `/api/reservations/:id` | Body `{ status }` — `picked_up`, `cancelled` or `expired`. |
| GET | `/api/owner/reservations` | Reservations across the owner's promotions. |

Use the `reserve_promotion`, `cancel_reservation` and `set_reservation_status` functions from
`schema.sql` so stock can never go negative and expired promotions cannot be reserved. Map
their exceptions to statuses the UI can explain:

| Exception | Status | Message the user sees |
| --- | --- | --- |
| `INSUFFICIENT_QUANTITY` | 409 | "Only N portions left — reduce the quantity." |
| `PROMOTION_EXPIRED` | 409 | "This promotion has just ended." |
| `PROMOTION_NOT_STARTED` | 409 | "This promotion has not started yet." |
| `INVALID_QUANTITY` | 400 | "Choose at least one portion." |
| `FORBIDDEN` | 403 | "You cannot change this reservation." |

**Reservation read shape**

```json
{
  "id": "uuid",
  "promotion_id": "uuid",
  "customer_id": "uuid",
  "customer_name": "Aye Chan",
  "customer_phone": "+95 9 …",
  "quantity": 2,
  "status": "reserved",
  "pickup_code": "FWS-7QK2",
  "pickup_by": "2026-08-29T13:00:00Z",
  "created_at": "2026-08-29T10:12:00Z",
  "promotion": { "…promotion read shape…": true }
}
```

`pickup_code` is what the customer shows at the counter and what the owner searches for in
the reservations inbox. A short random code (`FWS-XXXX`) is enough — the schema does not
store it yet, so add a column or derive it from the reservation id.

## AI chat

`POST /api/chat`

```json
{
  "message": "I have 5000 MMK. What sweet food can I get near me right now?",
  "history": [{ "role": "user", "content": "…" }, { "role": "assistant", "content": "…" }],
  "userLocation": { "latitude": 16.8661, "longitude": 96.1951 }
}
```

Response:

```json
{
  "message": "I found 2 dessert promotions under 5,000 MMK near you.",
  "criteria": {
    "intent": "SEARCH_PROMOTION",
    "category": "Desserts",
    "maxPrice": 5000,
    "location": "near_me",
    "radius": 5,
    "availableNow": true,
    "endingSoon": false,
    "sortBy": "price_asc"
  },
  "promotions": [{ "…promotion read shape…": true }]
}
```

`criteria` is optional but worth returning: the chat UI renders it as "Understood as" chips,
which makes the Gemini-extracts-then-database-answers architecture visible in a demo.

Flow to implement (see `chatbot.md`): Gemini extracts the criteria as JSON → the backend
validates and clamps the values → the database returns the real matching promotions → the
message is written from those rows. Return an empty `promotions` array when nothing matches;
the UI shows a "try a wider budget" hint rather than inventing anything.

## Optional extras

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/categories` | Category list. The frontend already ships the eight seeded categories with emoji and colours. |
| GET | `/api/stats/impact` | `{ mealsRescued, moneySaved, partnerShops, customers }` — renders a stats band on the landing page. Omitted entirely if the route is missing. |
| GET | `/api/owner/stats` | Not required; the owner overview computes its numbers from promotions and reservations. |

## Email notifications

No frontend work needed — the UI already tells customers that favouriting a shop opts them
into "new promotion" emails. Trigger the email on `POST /api/promotions` for users who
favourited that shop.
