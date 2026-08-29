import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout.jsx'
import { RequireAuth } from './components/auth/RequireAuth.jsx'
import { Spinner } from './components/ui/Feedback.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import NotFound from './pages/NotFound.jsx'
import Dashboard from './pages/customer/Dashboard.jsx'
import Browse from './pages/customer/Browse.jsx'
import ChatPage from './pages/customer/ChatPage.jsx'
import PromotionDetail from './pages/customer/PromotionDetail.jsx'
import ShopProfile from './pages/customer/ShopProfile.jsx'
import Favorites from './pages/customer/Favorites.jsx'
import Reservations from './pages/customer/Reservations.jsx'

// The owner console is a separate audience — keep it out of the customer bundle.
const OwnerLayout = lazy(() =>
  import('./components/layout/OwnerLayout.jsx').then((module) => ({ default: module.OwnerLayout }))
)
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard.jsx'))
const OwnerPromotions = lazy(() => import('./pages/owner/OwnerPromotions.jsx'))
const PromotionForm = lazy(() => import('./pages/owner/PromotionForm.jsx'))
const OwnerReservations = lazy(() => import('./pages/owner/OwnerReservations.jsx'))
const OwnerShop = lazy(() => import('./pages/owner/OwnerShop.jsx'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function RouteFallback() {
  return (
    <div className="grid min-h-svh place-items-center">
      <Spinner className="size-7" />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="browse" element={<Browse />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="promotions/:id" element={<PromotionDetail />} />
          <Route path="shops/:slug" element={<ShopProfile />} />
          <Route
            path="favorites"
            element={
              <RequireAuth>
                <Favorites />
              </RequireAuth>
            }
          />
          <Route
            path="reservations"
            element={
              <RequireAuth>
                <Reservations />
              </RequireAuth>
            }
          />
        </Route>

        <Route
          path="/owner"
          element={
            <RequireAuth role="owner">
              <Suspense fallback={<RouteFallback />}>
                <OwnerLayout />
              </Suspense>
            </RequireAuth>
          }
        >
          <Route index element={<OwnerDashboard />} />
          <Route path="promotions" element={<OwnerPromotions />} />
          <Route path="promotions/new" element={<PromotionForm />} />
          <Route path="promotions/:id/edit" element={<PromotionForm />} />
          <Route path="reservations" element={<OwnerReservations />} />
          <Route path="shop" element={<OwnerShop />} />
        </Route>

        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
