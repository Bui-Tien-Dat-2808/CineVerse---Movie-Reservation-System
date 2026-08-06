import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BookingProvider } from './context/BookingContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import AuthModal from './components/features/auth/AuthModal'
import HomeView from './views/HomeView'
import DetailView from './views/DetailView'
import SeatsView from './views/SeatsView'
import CheckoutView from './views/CheckoutView'
import ConfirmedView from './views/ConfirmedView'
import ProfileView from './views/ProfileView'
import ComingSoonView from './views/ComingSoonView'
import TheatersView from './views/TheatersView'
import PromotionsView from './views/PromotionsView'

import AdminView from './views/AdminView'

import { ThemeProvider } from './context/ThemeContext'

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
  const isAdmin = isAuthenticated && user?.role === 'admin'

  // Admin Guard: Admins live strictly in /admin interface.
  // Any attempt to open public client routes redirects to /admin.
  useEffect(() => {
    if (!isAuthLoading && isAdmin && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/profile')) {
      navigate('/admin', { replace: true })
    }
  }, [isAdmin, isAuthLoading, location.pathname, navigate])

  return (
    <div className="min-h-screen relative bg-cinema-pattern text-[#f0ede8] selection:bg-[#e8b84b] selection:text-[#09090e]">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-radial from-[#e8b84b]/10 via-[#e8b84b]/2 to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute top-[30%] -left-[10%] w-[600px] h-[600px] bg-radial from-[#c0392b]/6 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[60%] -right-[10%] w-[700px] h-[700px] bg-radial from-[#8e44ad]/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <Navbar />

      <main className="relative z-10 pt-16">
        <Routes>
          <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <HomeView />} />
          <Route path="/admin" element={<AdminView />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/sap-ra-mat" element={isAdmin ? <Navigate to="/admin" replace /> : <ComingSoonView />} />
          <Route path="/rap-chieu" element={isAdmin ? <Navigate to="/admin" replace /> : <TheatersView />} />
          <Route path="/khuyen-mai" element={isAdmin ? <Navigate to="/admin" replace /> : <PromotionsView />} />
          <Route path="/movie/:id" element={isAdmin ? <Navigate to="/admin" replace /> : <DetailView />} />
          <Route path="/movie/:id/seats" element={isAdmin ? <Navigate to="/admin" replace /> : <SeatsView />} />
          <Route path="/movie/:id/checkout" element={isAdmin ? <Navigate to="/admin" replace /> : <CheckoutView />} />
          <Route path="/confirmed" element={isAdmin ? <Navigate to="/admin" replace /> : <ConfirmedView />} />
          {/* Catch-all: redirect về admin nếu là Admin, hoặc home nếu là User */}
          <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/"} replace />} />
        </Routes>
      </main>

      {/* Auth Modal popup */}
      <AuthModal />

      {/* Footer chỉ hiện trên trang chủ cho khách hàng */}
      {isHome && !isAdmin && <Footer />}
    </div>
  )
}
