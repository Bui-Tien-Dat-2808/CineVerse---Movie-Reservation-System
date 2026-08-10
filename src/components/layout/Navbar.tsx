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

// Primary Admin Nav Items (Shown directly on Navbar)
const PRIMARY_ADMIN_NAV_ITEMS = [
  { label: 'Phim', icon: '🎬', tab: 'movies' },
  { label: 'Suất chiếu', icon: '🕐', tab: 'showtimes' },
  { label: 'Phòng chiếu', icon: '🏛️', tab: 'rooms' },
  { label: 'Bắp nước', icon: '🍿', tab: 'concessions' },
]

// Secondary Admin Nav Items (Inside "Thêm" Dropdown Menu)
const MORE_ADMIN_NAV_ITEMS = [
  { label: 'Voucher', icon: '🎟️', tab: 'vouchers', desc: 'Quản lý mã giảm giá' },
  { label: 'Tích điểm', icon: '🏆', tab: 'loyalty', desc: 'Điểm thưởng thành viên' },
  { label: 'Soát vé', icon: '🔍', tab: 'scanner', desc: 'Quét QR & check-in' },
  { label: 'Báo cáo', icon: '📊', tab: 'analytics', desc: 'Thống kê & báo cáo' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { reset } = useBooking()
  const { user, isAuthenticated, openAuthModal, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  const isAdminPage = location.pathname.startsWith('/admin') && user?.role === 'admin'
  const searchParams = new URLSearchParams(location.search)
  const currentAdminTab = searchParams.get('tab') || 'movies'

  const activeMoreItem = MORE_ADMIN_NAV_ITEMS.find((item) => item.tab === currentAdminTab)
  const isMoreTabActive = !!activeMoreItem

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false)
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

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl transition-colors duration-200 navbar-header',
      isDark
        ? 'bg-[#09090e]/90 border-white/[0.08] text-[#f0ede8]'
        : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
    )}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <button
          type="button"
          onClick={handleGoHome}
          className="flex items-center gap-2.5 bg-transparent border-0 cursor-pointer group select-none shrink-0"
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
          <span className={cn(
            'font-display font-bold text-xl tracking-tight transition-colors',
            isDark ? 'text-[#f0ede8] group-hover:text-[#e8b84b]' : 'text-slate-900 group-hover:text-amber-600'
          )}>
            CineVerse
          </span>
        </button>

        {/* Nav links */}
        <div className="hidden md:flex gap-1 lg:gap-2.5 items-center">
          {isAdminPage ? (
            <>
              {/* Primary 4 Admin Tabs */}
              {PRIMARY_ADMIN_NAV_ITEMS.map((item) => {
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
                      'bg-transparent border-0 cursor-pointer text-xs lg:text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap',
                      isActive
                        ? isDark
                          ? 'text-[#e8b84b] font-bold border-b-2 border-[#e8b84b] bg-white/5'
                          : 'text-amber-900 font-black border-b-2 border-amber-500 bg-amber-50'
                        : isDark
                        ? 'text-[#a09e9a] hover:text-[#f0ede8] hover:bg-white/5'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-bold',
                    )}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                )
              })}

              {/* Dropdown "Thêm" for secondary admin tools */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={cn(
                    'bg-transparent border-0 cursor-pointer text-xs lg:text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap',
                    isMoreTabActive
                      ? isDark
                        ? 'text-[#e8b84b] font-bold border-b-2 border-[#e8b84b] bg-white/5'
                        : 'text-amber-900 font-black border-b-2 border-amber-500 bg-amber-50'
                      : isDark
                      ? 'text-[#a09e9a] hover:text-[#f0ede8] hover:bg-white/5'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-bold',
                  )}
                >
                  <span className="text-sm">⋯</span>
                  <span>{activeMoreItem ? activeMoreItem.label : 'Thêm'}</span>
                  <span className="text-[9px] opacity-70">{moreMenuOpen ? '▲' : '▼'}</span>
                </button>

                {/* Dropdown Menu Panel */}
                {moreMenuOpen && (
                  <div className={cn(
                    'absolute left-0 mt-2 w-56 rounded-2xl border shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150',
                    isDark
                      ? 'bg-[#111118] border-white/10 text-[#f0ede8]'
                      : 'bg-white border-slate-200 text-slate-900 shadow-xl'
                  )}>
                    <div className={cn(
                      'px-3 py-1.5 text-[10px] font-mono-data uppercase font-bold border-b mb-1',
                      isDark ? 'text-[#a09e9a] border-white/5' : 'text-slate-500 border-slate-100'
                    )}>
                      Công cụ Quản lý khác
                    </div>
                    {MORE_ADMIN_NAV_ITEMS.map((subItem) => {
                      const isSubActive = currentAdminTab === subItem.tab
                      return (
                        <button
                          key={subItem.tab}
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false)
                            navigate(`/admin?tab=${subItem.tab}`)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer mb-0.5',
                            isSubActive
                              ? isDark
                                ? 'bg-[#e8b84b]/15 text-[#e8b84b] font-bold border border-[#e8b84b]/30'
                                : 'bg-amber-100 text-amber-950 font-black border border-amber-300'
                              : isDark
                              ? 'text-[#f0ede8] hover:bg-white/5 hover:text-[#e8b84b]'
                              : 'text-slate-800 hover:bg-amber-50 hover:text-amber-900'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{subItem.icon}</span>
                            <div>
                              <p className="leading-tight">{subItem.label}</p>
                              <p className={cn('text-[10px] font-normal font-mono-data', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>{subItem.desc}</p>
                            </div>
                          </div>
                          {isSubActive && <span className="text-xs text-amber-500 font-bold">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
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
                    'bg-transparent border-0 cursor-pointer text-sm font-medium transition-colors duration-200 px-3 py-1.5 rounded-xl',
                    isActive
                      ? isDark
                        ? 'text-[#e8b84b] font-bold'
                        : 'text-amber-800 font-black'
                      : isDark
                      ? 'text-[#a09e9a] hover:text-[#f0ede8]'
                      : 'text-slate-700 hover:text-slate-900 font-bold',
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
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* User Profile Button with Dropdown Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    'flex items-center gap-2.5 border rounded-xl px-3 py-1.5 cursor-pointer transition-all group text-left shadow-xs',
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-[#e8b84b]/20 text-[#e8b84b] font-bold text-xs flex items-center justify-center border border-[#e8b84b]/40">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
                  </div>
                  <div className="hidden sm:block">
                    <p className={cn(
                      'text-xs font-bold leading-tight group-hover:text-[#e8b84b] transition-colors',
                      isDark ? 'text-[#f0ede8]' : 'text-slate-900'
                    )}>
                      {user?.full_name ?? user?.email.split('@')[0]}
                    </p>
                    <span className={cn('font-mono-data text-[9px]', isDark ? 'text-[#a09e9a]' : 'text-slate-600 font-medium')}>
                      {user?.role === 'admin' ? '⚡ Admin' : 'Khách hàng · Hạng Bạc 🎟️'}
                    </span>
                  </div>
                  <span className={cn('text-[10px] ml-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                    {userMenuOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className={cn(
                    'absolute right-0 mt-2 w-60 border rounded-2xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150',
                    isDark
                      ? 'bg-[#111118] border-white/10 text-[#f0ede8]'
                      : 'bg-white border-slate-200 text-slate-900 shadow-xl'
                  )}>
                    {/* User Info Header */}
                    <div className={cn('p-2.5 border-b mb-1', isDark ? 'border-white/10' : 'border-slate-200')}>
                      <p className={cn('font-bold truncate', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>{user?.full_name || 'System Administrator'}</p>
                      <p className={cn('text-[10px] truncate mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>{user?.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono-data bg-[#e8b84b]/15 text-[#e8b84b] border border-[#e8b84b]/30">
                        {user?.role === 'admin' ? '⚡ Quyền Admin' : '🎟️ Khách Hàng · Thành Viên Bạc'}
                      </span>
                    </div>

                    {/* Menu Item 1: Thông Tin Cá Nhân */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate('/profile?tab=profile')
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 cursor-pointer',
                        isDark ? 'text-[#f0ede8] hover:bg-white/5 hover:text-[#e8b84b]' : 'text-slate-800 hover:bg-amber-50 hover:text-amber-900'
                      )}
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
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 cursor-pointer',
                          isDark ? 'text-[#f0ede8] hover:bg-white/5 hover:text-[#e8b84b]' : 'text-slate-800 hover:bg-amber-50 hover:text-amber-900'
                        )}
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
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 cursor-pointer',
                          isDark ? 'text-[#f0ede8] hover:bg-white/5 hover:text-[#e8b84b]' : 'text-slate-800 hover:bg-amber-50 hover:text-amber-900'
                        )}
                      >
                        <span>🏷️</span>
                        <span>Voucher Của Tôi</span>
                      </button>
                    )}

                    {/* Menu Item 4: Loyalty Points (Regular Users Only) */}
                    {user?.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate('/profile?tab=loyalty')
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 cursor-pointer',
                          isDark ? 'text-[#f0ede8] hover:bg-white/5 hover:text-[#e8b84b]' : 'text-slate-800 hover:bg-amber-50 hover:text-amber-900'
                        )}
                      >
                        <span>🏆</span>
                        <span>Điểm Thưởng</span>
                      </button>
                    )}

                    {/* Menu Item: Theme Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme()
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-xl font-bold transition-colors flex items-center justify-between cursor-pointer',
                        isDark ? 'text-[#f0ede8] hover:bg-white/5 hover:text-[#e8b84b]' : 'text-slate-800 hover:bg-amber-50 hover:text-amber-900'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
                        <span>Giao diện {theme === 'dark' ? 'Tối' : 'Sáng'}</span>
                      </div>
                      <span className={cn(
                        'text-[10px] font-mono-data rounded px-1.5 py-0.5 border',
                        isDark ? 'bg-white/5 border-white/10 text-[#a09e9a]' : 'bg-slate-100 border-slate-300 text-slate-700'
                      )}>
                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </span>
                    </button>

                    <div className={cn('border-t my-1', isDark ? 'border-white/10' : 'border-slate-200')} />

                    {/* Menu Item: Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        logout()
                        navigate('/')
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-red-500 hover:bg-red-500/10 font-bold transition-colors flex items-center gap-2 cursor-pointer"
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
                className={cn(
                  'border rounded-xl p-2 text-xs font-bold cursor-pointer transition-all flex items-center justify-center',
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-[#e8b84b] border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-amber-700 border-slate-300'
                )}
                title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
              >
                <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="bg-[#e8b84b] hover:bg-[#f5c759] text-[#09090e] border-0 rounded-xl px-5 py-2 text-[13px] font-bold cursor-pointer tracking-wide transition-all duration-150 shadow-md"
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
