import { useNavigate, useLocation } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { label: 'Phim đang chiếu', path: '/' },
  { label: 'Sắp ra mắt', path: '/sap-ra-mat' },
  { label: 'Rạp chiếu', path: '/rap-chieu' },
  { label: 'Khuyến mãi', path: '/khuyen-mai' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { reset } = useBooking()
  const { user, isAuthenticated, openAuthModal, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  function handleGoHome() {
    reset()
    navigate('/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleGoProfile() {
    navigate('/profile')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.07] backdrop-blur-xl bg-[#09090e]/85 navbar-header">
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          type="button"
          onClick={handleGoHome}
          className="flex items-center gap-2.5 bg-transparent border-0 cursor-pointer group select-none"
          aria-label="CineVerse Home"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#e8b84b" />
            <path
              d="M7 20 L14 8 L21 20"
              stroke="#09090e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line
              x1="9.5"
              y1="16"
              x2="18.5"
              y2="16"
              stroke="#09090e"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display font-bold text-xl text-[#f0ede8] tracking-tight group-hover:text-[#e8b84b] transition-colors">
            CineVerse
          </span>
        </button>

        {/* Nav links */}
        <div className="hidden md:flex gap-8 items-center">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  navigate(item.path)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={cn(
                  'bg-transparent border-0 cursor-pointer text-sm font-medium transition-colors duration-200',
                  isActive ? 'text-[#e8b84b] font-bold' : 'text-[#a09e9a] hover:text-[#f0ede8]',
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Right Section: Theme Toggle & Auth */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button (Always visible without login) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="bg-[#e8b84b]/15 hover:bg-[#e8b84b]/30 text-[#e8b84b] border border-[#e8b84b]/40 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
            title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
          >
            <span className="text-sm">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="inline-block font-bold text-xs">
              {theme === 'dark' ? 'Giao diện Tối' : 'Giao diện Sáng'}
            </span>
          </button>

          {/* Auth section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Admin Panel button if role === 'admin' */}
              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="bg-[#e8b84b]/15 hover:bg-[#e8b84b]/30 text-[#e8b84b] border border-[#e8b84b]/40 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                  title="Vào trang quản trị hệ thống"
                >
                  <span>⚡</span>
                  <span className="hidden sm:inline">Trang Quản Trị</span>
                </button>
              )}

              {/* User Profile Button */}
              <button
                type="button"
                onClick={handleGoProfile}
                className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer transition-all group text-left"
                title="Xem thông tin tài khoản và lịch sử đặt vé"
              >
                <div className="w-7 h-7 rounded-full bg-[#e8b84b]/20 text-[#e8b84b] font-bold text-xs flex items-center justify-center border border-[#e8b84b]/40">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-[#f0ede8] group-hover:text-[#e8b84b] transition-colors leading-tight">
                    {user?.full_name ?? user?.email.split('@')[0]}
                  </p>
                  <span className="font-mono-data text-[9px] text-[#a09e9a]">
                    {user?.role === 'admin' ? '⚡ Admin' : 'Vé của tôi 🎟️'}
                  </span>
                </div>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="bg-white/5 hover:bg-[rgba(192,57,43,0.2)] text-[#a09e9a] hover:text-[#e07060] border border-white/10 hover:border-[rgba(192,57,43,0.4)] rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="bg-[#e8b84b] text-[#09090e] border-0 rounded-lg px-5 py-2 text-[13px] font-bold cursor-pointer tracking-wide transition-all duration-150 hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] hover:-translate-y-px"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
