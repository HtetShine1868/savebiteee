import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from './src/App.jsx'
import { ToastProvider } from './src/context/ToastProvider.jsx'
import { AuthProvider } from './src/context/AuthProvider.jsx'
import { SessionProvider } from './src/context/SessionProvider.jsx'
import { ReserveProvider } from './src/context/ReserveProvider.jsx'
import OwnerDashboard from './src/pages/owner/OwnerDashboard.jsx'
import OwnerPromotions from './src/pages/owner/OwnerPromotions.jsx'
import PromotionForm from './src/pages/owner/PromotionForm.jsx'
import OwnerReservations from './src/pages/owner/OwnerReservations.jsx'
import OwnerShop from './src/pages/owner/OwnerShop.jsx'

const OWNER_PAGES = {
  OwnerDashboard,
  OwnerPromotions,
  PromotionForm,
  OwnerReservations,
  OwnerShop,
}

const ROUTES = [
  '/',
  '/login',
  '/register',
  '/register?role=owner',
  '/app',
  '/app/browse',
  '/app/browse?category=pizza&maxPrice=5000&endingSoon=1',
  '/app/chat',
  '/app/promotions/some-id',
  '/app/shops/some-shop',
  '/app/favorites',
  '/app/reservations',
  '/owner',
  '/nowhere',
]

let failed = 0

function attempt(label, element) {
  try {
    const html = renderToString(
      <MemoryRouter initialEntries={[label.startsWith('/') ? label : '/owner']}>
        <ToastProvider>
          <AuthProvider>
            <SessionProvider>
              <ReserveProvider>{element}</ReserveProvider>
            </SessionProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    )
    console.log(`PASS  ${label}  (${html.length} bytes)`)
  } catch (error) {
    failed += 1
    console.log(`FAIL  ${label}`)
    console.log(`      ${error.stack?.split('\n').slice(0, 4).join('\n      ')}`)
  }
}

for (const route of ROUTES) {
  attempt(route, <App />)
}

// The route guard redirects anonymous visitors, so render owner screens directly.
for (const [name, Page] of Object.entries(OWNER_PAGES)) {
  attempt(name, <Page />)
}

process.exit(failed ? 1 : 0)
