# Food Waste Solver — Frontend

React 19 + Vite + Tailwind CSS 4 client for the Food Waste Solver platform: shops list
surplus food before it expires, customers find it (by search or by asking the AI assistant),
reserve it, and collect it in person.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

`/api/*` is proxied to `http://localhost:5000`, so run the Express API from `../backend`
alongside it. Copy `.env.example` to `.env` if you need to point at a different API or enable
Google sign-in.

```bash
npm run build        # production bundle in dist/
npm run preview      # serve the built bundle
npm run lint         # oxlint
```

## How it talks to the backend

There is no mock data. Every screen reads from the API, and all requests live in one file:

- `src/lib/api.js` — fetch wrapper, bearer token, `ApiError` (`isOffline`, `isMissing`, `isAuth`)
- `src/lib/services.js` — one function per endpoint; the only place URLs appear
- `src/lib/normalize.js` — accepts `snake_case` (rows from the `promotion_listings` view) or
  `camelCase` and returns one consistent shape to components

Endpoints that are not built yet answer `404`, which the UI renders as a calm "this endpoint
is not live yet" state instead of a crash — so the frontend can be demoed while the API is
still being written. The full list of expected requests and responses is in
[`../API_CONTRACT.md`](../API_CONTRACT.md).

## Structure

```
src/
  components/
    auth/      route guard + split-screen auth shell
    chat/      AI assistant panel, floating widget, "understood as" chips
    layout/    navbar, mobile tab bar, footer, owner sidebar
    promo/     promotion cards, rails, category picker, reserve dialog
    ui/        buttons, fields, modal, badges, skeleton/empty/error states
  context/     auth, session (location + favourites), toasts, reserve dialog
  hooks/       useResource (fetch + loading/error/retry), useNow, usePromotionFeed, useGoogleAuth
  lib/         api client, services, normalizers, formatting, promotion rules
  pages/       landing, auth, customer/*, owner/*
```

Each context is split into a `*-context.js` (the context and its hook) and a
`*Provider.jsx` (the component), which keeps fast-refresh boundaries clean.

## Routes

| Path | Who | Screen |
| --- | --- | --- |
| `/` | public | Landing page |
| `/login`, `/register` | public | Auth with role selection and Google sign-in |
| `/app` | public | Discover dashboard: ending soon, nearby, favourites, bargains |
| `/app/browse` | public | Search with category, price, distance and ending-soon filters (URL-synced) |
| `/app/chat` | public | Full-page AI assistant |
| `/app/promotions/:id` | public | Listing detail with countdown, pickup info and reserve |
| `/app/shops/:slug` | public | Shop profile with live listings |
| `/app/favorites` | customer | Saved shops and their live deals |
| `/app/reservations` | customer | Pickup codes, cancel, rescued/saved totals |
| `/owner` | owner | Overview: live listings, ending soon, latest reservations |
| `/owner/promotions` | owner | Manage listings by status |
| `/owner/promotions/new`, `/owner/promotions/:id/edit` | owner | Promotion form with live customer preview |
| `/owner/reservations` | owner | Pickup inbox: search by code, mark collected / no-show |
| `/owner/shop` | owner | Public shop profile editor with completeness meter |

Reserving prompts anonymous visitors to sign in; owner routes redirect anyone else.

## Design system

Tokens live in `src/index.css` under `@theme`, so Tailwind utilities such as `bg-brand-600`,
`text-ink` and `rounded-4xl` come from one place:

- `brand` green for rescue actions, `flash` amber for urgency and countdowns, `spark` violet
  for anything AI
- `canvas` / `surface` / `line` / `ink` / `muted` for a warm, low-glare background
- Plus Jakarta Sans for headings, Inter for body text
- Custom utilities: `glass`, `skeleton`, `no-scrollbar`, `text-balance-pretty`

Promotion status (`active`, `upcoming`, `sold_out`, `expired`), countdown urgency, distance
and filtering rules are centralised in `src/lib/promotions.js` and mirror the SQL in
`backend/supabase/schema.sql`.

## Notes for the team

- A missing `image_url` is fine — cards fall back to a category-tinted illustration.
- Listings show live countdowns; `useNow` ticks once every 30 seconds instead of per card.
- Sharing location is optional everywhere. Without it, distance sorting is simply hidden.
- After a successful reservation, `ReserveProvider` bumps a counter that makes open lists
  refetch, so stock counts stay honest.
