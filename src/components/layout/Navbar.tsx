import { useState, useRef, useEffect } from 'react'
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

const ADMIN_NAV_ITEMS = [
  { label: '🎬 Quản Lý Phim', tab: 'movies' },
  { label: '🕒 Quản Lý Suất Chiếu', tab: 'showtimes' },
  { label: '🏛️ Quản Lý Phòng Chiếu', tab: 'rooms' },
  { label: '🎟️ Quản Lý Voucher', tab: 'vouchers' },
  { label: '🍿 Quản Lý Bắp Nước', tab: 'concessions' },
  { label: '🔍 Soát Vé / QR', tab: 'scanner' },
  { label: '📊 Thống Kê & Báo Cáo', tab: 'analytics' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { reset } = useBooking()
  const { user, isAuthenticated, openAuthModal, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isAdminPage = location.pathname.startsWith('/admin')
  const searchParams = new URLSearchParams(location.search)
  const currentAdminTab = searchParams.get('tab') || 'movies'

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleGoHome() {
    reset()
    if (user?.role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleGoProfile() {
    if (user?.role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/profile')
    }
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
        <div className="hidden md:flex gap-6 items-center">
          {isAdminPage || user?.role === 'admin' ? (
            ADMIN_NAV_ITEMS.map((item) => {
              const isActive = currentAdminTab === item.tab
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => {
                    navigate(`/admin?tab=${item.tab}`)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={cn(
                    'bg-transparent border-0 cursor-pointer text-xs sm:text-sm font-medium transition-colors duration-200',
                    isActive ? 'text-[#e8b84b] font-bold border-b-2 border-[#e8b84b] pb-0.5' : 'text-[#a09e9a] hover:text-[#f0ede8]',
                  )}
                >
                  {item.label}
                </button>
              )
            })
          ) : (
            NAV_ITEMS.map((item) => {
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
            })
          )}
        </div>

        {/* Right Section: Auth & User Dropdown */}
        <div className="flex items-center gap-3">
          {/* Auth section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* User Profile Button with Dropdown Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer transition-all group text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-[#e8b84b]/20 text-[#e8b84b] font-bold text-xs flex items-center justify-center border border-[#e8b84b]/40">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-[#f0ede8] group-hover:text-[#e8b84b] transition-colors leading-tight">
                      {user?.full_name ?? user?.email.split('@')[0]}
                    </p>
                    <span className="font-mono-data text-[9px] text-[#a09e9a]">
                      {user?.role === 'admin' ? '⚡ Admin' : 'Khách hàng · Hạng Bạc 🎟️'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#a09e9a] ml-0.5">
                    {userMenuOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-[#111118] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Info Header */}
                    <div className="p-2.5 border-b border-white/10 mb-1">
                      <p className="font-bold text-[#f0ede8] truncate">{user?.full_name || 'System Administrator'}</p>
                      <p className="text-[10px] text-[#a09e9a] truncate mt-0.5">{user?.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono-data bg-[#e8b84b]/15 text-[#e8b84b] border border-[#e8b84b]/30">
                        {user?.role === 'admin' ? '⚡ Quyền Admin' : '🎟️ Khách Hàng · Thành Viên Bạc'}
                      </span>
                    </div>

                    {/* Menu Item 1: Thông Tin Cá Nhân (All Users & SA) */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate('/profile?tab=profile')
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-[#f0ede8] hover:bg-white/5 hover:text-[#e8b84b] font-medium transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>👤</span>
                      <span>Thông Tin Cá Nhân</span>
                    </button>

                    {/* Menu Item 2: Lịch Sử Mua Vé (Regular Users Only) */}
                    {user?.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate('/profile?tab=history')
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-[#f0ede8] hover:bg-white/5 hover:text-[#e8b84b] font-medium transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>🎟️</span>
                        <span>Lịch Sử Mua Vé</span>
                      </button>
                    )}

                    {/* Menu Item 3: Voucher Của Tôi (Regular Users Only) */}
                    {user?.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate('/profile?tab=vouchers')
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-[#f0ede8] hover:bg-white/5 hover:text-[#e8b84b] font-medium transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>🏷️</span>
                        <span>Voucher Của Tôi</span>
                      </button>
                    )}

                    {/* Menu Item 2: Theme Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme()
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-[#f0ede8] hover:bg-white/5 hover:text-[#e8b84b] font-medium transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
                        <span>Giao diện {theme === 'dark' ? 'Tối' : 'Sáng'}</span>
                      </div>
                      <span className="text-[10px] text-[#a09e9a] font-mono-data bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </span>
                    </button>

                    <div className="border-t border-white/10 my-1" />

                    {/* Menu Item 3: Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        logout()
                        navigate('/')
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-[#e07060] hover:bg-rose-500/10 font-bold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>🚪</span>
                      <span>Đăng Xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="bg-white/5 hover:bg-white/10 text-[#e8b84b] border border-white/10 rounded-lg p-2 text-xs font-bold cursor-pointer transition-all flex items-center justify-center"
                title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
              >
                <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="bg-[#e8b84b] text-[#09090e] border-0 rounded-lg px-5 py-2 text-[13px] font-bold cursor-pointer tracking-wide transition-all duration-150 hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] hover:-translate-y-px"
              >
                Đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
