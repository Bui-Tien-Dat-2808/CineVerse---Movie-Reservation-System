import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BookingProvider } from './context/BookingContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import AuthModal from './components/features/auth/AuthModal'
import HomeView from './views/HomeView'
import { ThemeProvider } from './context/ThemeContext'

// Lazy-loaded routes for code splitting
const DetailView = lazy(() => import('./views/DetailView'))
const CheckoutView = lazy(() => import('./views/CheckoutView'))
const ConfirmedView = lazy(() => import('./views/ConfirmedView'))
const ProfileView = lazy(() => import('./views/ProfileView'))
const ComingSoonView = lazy(() => import('./views/ComingSoonView'))
const TheatersView = lazy(() => import('./views/TheatersView'))
const PromotionsView = lazy(() => import('./views/PromotionsView'))
const PaymentResultView = lazy(() => import('./views/PaymentResultView'))
const AdminView = lazy(() => import('./views/AdminView'))

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#e8b84b] border-t-transparent rounded-full animate-spin" />
        <span className="font-mono-data text-xs text-[#a09e9a] tracking-wider uppercase">Đang tải...</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <BookingProvider>
            <AppShell />
          </BookingProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

/**
 * AppShell: layout wrapper + single Routes tree.
 * Separated from App so it can consume contexts + router hooks.
 */
function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAuthLoading } = useAuth()

  const isHome = location.pathname === '/'
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'ADMIN')

  // Admin Guard: Admins live strictly in /admin interface.
  useEffect(() => {
    if (!isAuthLoading) {
      if (isAdmin && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/profile')) {
        navigate('/admin', { replace: true })
      } else if (!isAdmin && location.pathname.startsWith('/admin')) {
        navigate('/', { replace: true })
      }
    }
  }, [isAdmin, isAuthLoading, location.pathname, navigate])

  return (
    <div className="min-h-screen relative bg-cinema-pattern text-[#f0ede8] selection:bg-[#e8b84b] selection:text-[#09090e]">
      {/* Decorative subtle ambient cinema ceiling glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#e8b84b]/8 to-transparent rounded-full blur-3xl opacity-60" />
      </div>

      <Navbar />

      <main className="relative pt-16">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <HomeView />} />
            <Route path="/admin" element={isAdmin ? <AdminView /> : <Navigate to="/" replace />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/sap-ra-mat" element={isAdmin ? <Navigate to="/admin" replace /> : <ComingSoonView />} />
            <Route path="/rap-chieu" element={isAdmin ? <Navigate to="/admin" replace /> : <TheatersView />} />
            <Route path="/khuyen-mai" element={isAdmin ? <Navigate to="/admin" replace /> : <PromotionsView />} />
            <Route path="/movie/:id" element={isAdmin ? <Navigate to="/admin" replace /> : <DetailView />} />
            <Route path="/movie/:id/checkout" element={isAdmin ? <Navigate to="/admin" replace /> : <CheckoutView />} />
            <Route path="/confirmed" element={isAdmin ? <Navigate to="/admin" replace /> : <ConfirmedView />} />
            <Route path="/payment-result" element={<PaymentResultView />} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/"} replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Auth Modal popup */}
      <AuthModal />

      {/* Footer chỉ hiện trên trang chủ cho khách hàng */}
      {isHome && !isAdmin && <Footer />}
    </div>
  )
}
