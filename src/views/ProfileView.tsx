import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { updateProfileAPI } from '../api/auth'
import { fetchMyReservationsAPI, cancelReservationAPI, exchangeReservationAPI, fetchShowtimesByMovie, fetchSeatMap, type ReservationItem } from '../api/showtimes'
import { apiClient } from '../api/client'
import { fmt, cn } from '../lib/utils'
import type { ShowTime, SeatItem } from '../types'

import { ETicketModal } from '../components/features/ticket/ETicketModal'
import { fetchMyLoyalty, type LoyaltyStatus } from '../api/loyalty'

export default function ProfileView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as 'profile' | 'history' | 'vouchers' | 'loyalty' | null

  const { user, isAuthenticated, logout } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'vouchers' | 'loyalty'>(tabParam || 'profile')
  const [ticketModalReservation, setTicketModalReservation] = useState<ReservationItem | null>(null)

  useEffect(() => {
    if (tabParam && (tabParam === 'profile' || tabParam === 'history' || tabParam === 'vouchers' || tabParam === 'loyalty')) {
      setActiveTab(tabParam)
    }
  }, [tabParam])
  const [isEditing, setIsEditing] = useState(false) // Toggle view vs edit mode

  // Profile Form States
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone_number ?? '')
  const [dob, setDob] = useState(user?.date_of_birth ?? '')
  const [gender, setGender] = useState(user?.gender ?? 'Nam')
  const [region, setRegion] = useState(user?.region ?? 'TP. Hồ Chí Minh')

  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Booking History States
  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all')

  // User Vouchers States
  const [userVouchers, setUserVouchers] = useState<any[]>([])
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyStatus | null>(null)
  const [loyaltyLoading, setLoyaltyLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'vouchers') {
      loadUserVouchers()
    }
    if (activeTab === 'loyalty') {
      loadLoyalty()
    }
  }, [activeTab])

  async function loadLoyalty() {
    setLoyaltyLoading(true)
    try {
      const data = await fetchMyLoyalty()
      setLoyaltyData(data)
    } catch (err) {
      console.error('Failed to load loyalty data:', err)
    } finally {
      setLoyaltyLoading(false)
    }
  }

  async function loadUserVouchers() {
    setVoucherLoading(true)
    try {
      const { data } = await apiClient.get<any[]>('/api/v1/vouchers/')
      setUserVouchers(data)
    } catch (err) {
      console.error('Failed to load user vouchers:', err)
    } finally {
      setVoucherLoading(false)
    }
  }

  function handleCopyVoucher(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  // Cancel Confirmation Modal State
  const [cancelTarget, setCancelTarget] = useState<ReservationItem | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelPendingTarget, setCancelPendingTarget] = useState<ReservationItem | null>(null)
  const [cancelPendingLoading, setCancelPendingLoading] = useState(false)

  // Exchange Ticket Modal State
  const [exchangeTarget, setExchangeTarget] = useState<ReservationItem | null>(null)
  const [exchangeStep, setExchangeStep] = useState<'showtime' | 'seats'>('showtime')
  const [exchangeShowtimes, setExchangeShowtimes] = useState<ShowTime[]>([])
  const [exchangeSelectedShowtime, setExchangeSelectedShowtime] = useState<ShowTime | null>(null)
  const [exchangeSeatsMap, setExchangeSeatsMap] = useState<SeatItem[]>([])
  const [exchangeSelectedSeats, setExchangeSelectedSeats] = useState<Set<number>>(new Set())
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [exchangeError, setExchangeError] = useState<string | null>(null)

  const handleStartExchange = async (item: ReservationItem) => {
    setExchangeTarget(item)
    setExchangeStep('showtime')
    setExchangeError(null)
    setExchangeLoading(true)
    setExchangeSelectedShowtime(null)
    setExchangeSelectedSeats(new Set())

    try {
      if (item.showtime) {
        // Fetch showtimes for movie
        const movieId = (item.showtime as any).movie_id || item.showtime.id
        const list = await fetchShowtimesByMovie(movieId)
        const nowMs = Date.now()
        const available = list.filter((st) => {
          const stMs = new Date(`${st.date}T${st.time}`).getTime()
          return st.id !== item.showtime_id && (stMs - nowMs >= 30 * 60 * 1000)
        })
        setExchangeShowtimes(available)
      }
    } catch (err: any) {
      setExchangeError(err.response?.data?.detail || 'Không thể tải danh sách suất chiếu mới.')
    } finally {
      setExchangeLoading(false)
    }
  }

  const handleSelectExchangeShowtime = async (st: ShowTime) => {
    setExchangeSelectedShowtime(st)
    setExchangeStep('seats')
    setExchangeLoading(true)
    setExchangeError(null)
    try {
      if (st.id) {
        const mapRes = await fetchSeatMap(st.id, st.price, st.vipPrice)
        setExchangeSeatsMap(mapRes.seats)
      }
    } catch (err: any) {
      setExchangeError(err.response?.data?.detail || 'Không thể tải sơ đồ ghế.')
    } finally {
      setExchangeLoading(false)
    }
  }

  const handleConfirmExchange = async () => {
    if (!exchangeTarget || !exchangeSelectedShowtime?.id || exchangeSelectedSeats.size === 0) return
    setExchangeLoading(true)
    setExchangeError(null)
    try {
      await exchangeReservationAPI(
        exchangeTarget.id,
        exchangeSelectedShowtime.id,
        Array.from(exchangeSelectedSeats)
      )
      setExchangeTarget(null)
      loadHistory()
      setUpdateMsg({ type: 'success', text: 'Đổi suất chiếu thành công! Thông tin vé mới đã được cập nhật.' })
    } catch (err: any) {
      setExchangeError(err.response?.data?.detail || 'Đổi suất chiếu thất bại. Vui lòng thử lại.')
    } finally {
      setExchangeLoading(false)
    }
  }

  // Hydrate user data when user object changes
  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? '')
      setEmail(user.email ?? '')
      setPhone(user.phone_number ?? '')
      setDob(user.date_of_birth ?? '')
      setGender(user.gender ?? 'Nam')
      setRegion(user.region ?? 'TP. Hồ Chí Minh')
    }
  }, [user])

  // Load reservations when switching to history tab
  useEffect(() => {
    if (isAuthenticated && activeTab === 'history') {
      loadReservations()
    }
  }, [isAuthenticated, activeTab])

  async function loadReservations() {
    setHistoryLoading(true)
    try {
      const items = await fetchMyReservationsAPI()
      setReservations(items)
    } catch (err) {
      console.error('Failed to load reservations:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Cancel Edit Mode
  function handleCancelEdit() {
    if (user) {
      setFullName(user.full_name ?? '')
      setEmail(user.email ?? '')
      setPhone(user.phone_number ?? '')
      setDob(user.date_of_birth ?? '')
      setGender(user.gender ?? 'Nam')
      setRegion(user.region ?? 'TP. Hồ Chí Minh')
    }
    setIsEditing(false)
    setUpdateMsg(null)
  }

  // Handle Profile Update Submit
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setUpdateMsg(null)
    setUpdateLoading(true)

    try {
      await updateProfileAPI({
        full_name: fullName,
        email: email,
        phone_number: phone || undefined,
        date_of_birth: dob || undefined,
        gender: gender,
        region: region,
      })
      setUpdateMsg({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công!' })
      setIsEditing(false) // Exit edit mode after successful update
    } catch (err: any) {
      const detail = err.response?.data?.detail ?? 'Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.'
      setUpdateMsg({ type: 'error', text: typeof detail === 'string' ? detail : JSON.stringify(detail) })
    } finally {
      setUpdateLoading(false)
    }
  }

  // Handle Cancel Reservation Confirm
  async function handleConfirmCancel() {
    if (!cancelTarget) return
    setCancelLoading(true)
    try {
      await cancelReservationAPI(cancelTarget.id)
      setCancelTarget(null)
      await loadReservations()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Hủy vé thất bại. Vui lòng thử lại.')
    } finally {
      setCancelLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-20 text-center">
        <p className="text-[#a09e9a] mb-4">Vui lòng đăng nhập để xem thông tin cá nhân và lịch sử đặt vé.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#e8b84b] text-[#09090e] px-6 py-2.5 rounded font-bold text-xs"
        >
          Trở về Trang chủ
        </button>
      </div>
    )
  }

  const filteredReservations = reservations.filter((r) => {
    if (historyFilter === 'confirmed') return r.status === 'confirmed'
    if (historyFilter === 'cancelled') return r.status === 'cancelled'
    if (historyFilter === 'pending') return r.status === 'pending'
    return true
  })

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10 pb-20">
      {/* Back button */}
      <button
        onClick={() => (user?.role === 'admin' ? navigate('/admin') : navigate('/'))}
        className={`flex items-center gap-1.5 bg-transparent border-0 text-sm cursor-pointer mb-6 transition-colors ${
          isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        {user?.role === 'admin' ? '← Trang Quản Trị' : '← Trang Chủ'}
      </button>

      {/* User Header Profile Card */}
      <div className={`rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors ${
        isDark ? 'bg-[#111118] border border-white/10 shadow-xl' : 'bg-white border border-slate-200 shadow-lg'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl border ${
            isDark ? 'bg-[#e8b84b]/15 border-[#e8b84b]/40 text-[#e8b84b]' : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
          }`}>
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <h2 className={`font-display text-2xl font-bold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
              {user?.full_name ?? 'Thành viên CineVerse'}
            </h2>
            <p className={`text-xs font-mono-data mt-0.5 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>{user?.email}</p>
            <div className={`mt-2 inline-block px-2.5 py-0.5 rounded text-[10px] font-mono-data uppercase border ${
              isDark ? 'bg-white/5 border-white/10 text-[#e8b84b]' : 'bg-amber-500/10 border-amber-500/20 text-amber-700 font-semibold'
            }`}>
              {user?.role === 'admin' ? '⚡ Quản trị viên (Admin)' : ' Hạng Thành viên Bạc'}
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: PROFILE INFO & EDIT FORM */}
      {activeTab === 'profile' && (
        <div className={`rounded-xl p-6 sm:p-8 border transition-colors ${
          isDark ? 'bg-[#111118] border-white/10 shadow-xl' : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className={`font-display text-xl font-bold mb-1 ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                Quản lý thông tin tài khoản
              </h3>
              <p className={`text-xs ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                {isEditing
                  ? 'Chỉnh sửa các thông tin cá nhân dưới đây và nhấn Lưu.'
                  : 'Xem thông tin tài khoản cá nhân của bạn.'}
              </p>
            </div>

            {/* Edit toggle button when in View Mode */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => {
                  setUpdateMsg(null)
                  setIsEditing(true)
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-[#e8b84b]/15 hover:bg-[#e8b84b]/30 text-[#e8b84b] border-[#e8b84b]/30'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border-amber-500/30'
                }`}
              >
                <span>✏️</span>
                <span>Chỉnh sửa thông tin</span>
              </button>
            )}
          </div>

          {/* Success / Error Banner */}
          {updateMsg && (
            <div
              className={`p-4 rounded-lg mb-6 text-xs flex items-center gap-2 ${
                updateMsg.type === 'success'
                  ? 'bg-[rgba(46,204,113,0.15)] border border-[rgba(46,204,113,0.3)] text-[#2ecc71]'
                  : 'bg-[rgba(192,57,43,0.15)] border border-[rgba(192,57,43,0.3)] text-[#e07060]'
              }`}
            >
              <span>{updateMsg.type === 'success' ? '✓' : '⚠'}</span>
              <span>{updateMsg.text}</span>
            </div>
          )}

          {/* VIEW MODE */}
          {!isEditing ? (
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-xl border transition-colors ${
              isDark ? 'bg-[#09090e]/60 border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className={`text-xs block mb-1 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Họ và tên</span>
                <p className={`text-sm font-semibold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>{user?.full_name || 'Chưa cập nhật'}</p>
              </div>

              <div>
                <span className={`text-xs block mb-1 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Email</span>
                <p className={`text-sm font-semibold font-mono-data ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>{user?.email || 'Chưa cập nhật'}</p>
              </div>

              <div>
                <span className={`text-xs block mb-1 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Số điện thoại</span>
                <p className={`text-sm font-semibold font-mono-data ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                  {user?.phone_number || 'Chưa cập nhật'}
                </p>
              </div>

              <div>
                <span className={`text-xs block mb-1 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Ngày sinh</span>
                <p className={`text-sm font-semibold font-mono-data ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                  {user?.date_of_birth || 'Chưa cập nhật'}
                </p>
              </div>

              <div>
                <span className={`text-xs block mb-1 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Giới tính</span>
                <p className={`text-sm font-semibold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>{user?.gender || 'Chưa cập nhật'}</p>
              </div>

              <div>
                <span className={`text-xs block mb-1 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Khu vực sinh sống</span>
                <p className={`text-sm font-semibold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>{user?.region || 'Chưa cập nhật'}</p>
              </div>
            </div>
          ) : (
            /* EDIT MODE FORM */
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs mb-1.5 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors border ${
                      isDark
                        ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs mb-1.5 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono-data transition-colors border ${
                      isDark
                        ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs mb-1.5 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>Số điện thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0987654321"
                    className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono-data transition-colors border ${
                      isDark
                        ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs mb-1.5 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>Ngày sinh</label>
                  <input
                    type="date"
                    value={dob}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker()
                      } catch {}
                    }}
                    onChange={(e) => setDob(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono-data cursor-pointer transition-colors border ${
                      isDark
                        ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs mb-1.5 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer transition-colors border ${
                      isDark
                        ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                    }`}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs mb-1.5 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>Khu vực sinh sống</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer transition-colors border ${
                      isDark
                        ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                    }`}
                  >
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`px-6 py-2.5 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                    isDark ? 'bg-white/5 hover:bg-white/15 text-[#f0ede8] border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="bg-[#e8b84b] text-[#09090e] px-8 py-2.5 rounded-lg font-bold text-xs cursor-pointer hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] transition-all disabled:opacity-50"
                >
                  {updateLoading ? 'Đang lưu...' : 'Lưu thông tin →'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: BOOKING HISTORY & CANCELLATION */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Sub-filter */}
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-xl p-4 border transition-colors ${
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <h3 className={`font-display font-bold text-base ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>Danh sách vé đã đặt</h3>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border transition-all ${
                  historyFilter === 'all'
                    ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b]'
                    : isDark ? 'bg-white/5 border-white/10 text-[#a09e9a]' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({reservations.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('confirmed')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border transition-all ${
                  historyFilter === 'confirmed'
                    ? 'bg-[#2ecc71] text-[#09090e] border-[#2ecc71]'
                    : isDark ? 'bg-white/5 border-white/10 text-[#a09e9a]' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đã xác nhận ({reservations.filter((r) => r.status === 'confirmed').length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('pending')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border transition-all ${
                  historyFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                    : isDark ? 'bg-white/5 border-white/10 text-[#a09e9a]' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Chờ thanh toán ({reservations.filter((r) => r.status === 'pending').length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('cancelled')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border transition-all ${
                  historyFilter === 'cancelled'
                    ? 'bg-[#e07060] text-white border-[#e07060]'
                    : isDark ? 'bg-white/5 border-white/10 text-[#a09e9a]' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đã hủy ({reservations.filter((r) => r.status === 'cancelled').length})
              </button>
            </div>
          </div>

          {/* Ticket List */}
          {historyLoading ? (
            <div className={`text-center py-16 text-xs font-mono-data animate-pulse ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
              Đang tải lịch sử đặt vé...
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className={`rounded-xl p-12 text-center border transition-colors ${
              isDark ? 'bg-[#111118] border-white/10 text-[#a09e9a]' : 'bg-white border-slate-200 text-slate-500 shadow-md'
            }`}>
              <span className="text-4xl block mb-3">🎟️</span>
              <p className={`font-display font-semibold text-lg mb-1 ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>Chưa có lịch sử đặt vé</p>
              <p className="text-xs">Bạn chưa có đơn đặt vé nào phù hợp với bộ lọc này.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((item) => {
                const seatsList = item.reservation_seats
                  .map((s) => s.seat_label ?? `R${s.row_label}C${s.col_number}`)
                  .join(', ')

                const isCancelled = item.status === 'cancelled'
                const isExchanged = item.status === 'exchanged'
                const isConfirmed = item.status === 'confirmed'
                const isPending = item.status === 'pending'
                const startTimeMs = item.showtime?.start_time ? new Date(item.showtime.start_time).getTime() : 0
                const isUpcoming = isConfirmed && startTimeMs > 0 && (startTimeMs - Date.now() >= 30 * 60 * 1000)
                const totalPriceNum =
                  typeof item.total_price === 'string' ? parseFloat(item.total_price) : item.total_price

                const startTimeFormatted = item.showtime?.start_time
                  ? new Date(item.showtime.start_time).toLocaleString('vi-VN', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between gap-5 relative overflow-hidden border transition-colors ${
                      isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div
                      className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                        isCancelled
                          ? 'bg-[#e07060]'
                          : isExchanged
                          ? 'bg-purple-500'
                          : isPending
                          ? 'bg-amber-500'
                          : 'bg-[#2ecc71]'
                      }`}
                    />

                    <div className="flex gap-4 items-start pl-2">
                      <img
                        src={
                          item.showtime?.movie_poster_url ??
                          'https://images.unsplash.com/photo-1634733049839-0292be607569?w=120&h=180&fit=crop'
                        }
                        alt={item.showtime?.movie_title ?? 'Phim'}
                        className="w-16 h-24 object-cover rounded-lg border border-slate-200/20 shrink-0 shadow-sm"
                      />

                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono-data ${
                              isCancelled
                                ? 'bg-[rgba(224,112,96,0.15)] text-[#e07060] border border-[rgba(224,112,96,0.3)]'
                                : isExchanged
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                : isPending
                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 font-black'
                                : 'bg-[rgba(46,204,113,0.15)] text-[#2ecc71] border border-[rgba(46,204,113,0.3)]'
                            }`}
                          >
                            {isCancelled
                              ? 'Đã hủy'
                              : isExchanged
                              ? 'Đã đổi suất'
                              : isPending
                              ? 'Chờ thanh toán'
                              : 'Đã xác nhận'}
                          </span>

                          {isCancelled && item.refund_status && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-data border ${
                                item.refund_status === 'success'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : item.refund_status === 'failed'
                                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {item.refund_status === 'success'
                                ? '✓ Đã hoàn tiền'
                                : item.refund_status === 'failed'
                                ? '⚠️ Hoàn tiền thất bại (Cần hỗ trợ)'
                                : '⏳ Đang xử lý hoàn tiền'}
                            </span>
                          )}

                          <span className={`text-[11px] font-mono-data font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            Mã vé: {item.ticket_code || `#${item.id}`}
                          </span>
                        </div>

                        <h4 className={`font-display font-bold text-lg mb-1 ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                          {item.showtime?.movie_title ?? 'Xem phim trực tuyến'}
                        </h4>

                        <p className={`text-xs mb-1 ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                          🕒 {startTimeFormatted} · 🎬 {item.showtime?.room_name ?? 'Rạp CineVerse'}
                        </p>

                        <p className={`text-xs font-medium ${isDark ? 'text-[#e8b84b]' : 'text-amber-700'}`}>
                          💺 Ghế đã chọn: <span className="font-bold">{seatsList || 'N/A'}</span>
                        </p>
                      </div>
                    </div>

                    <div className={`flex flex-row md:flex-col justify-between items-end border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-5 shrink-0 ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}>
                      <div className="text-left md:text-right">
                        <span className={`text-[10px] block font-mono-data ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Tổng tiền</span>
                        <span className={`font-mono-data text-xl font-bold ${isDark ? 'text-[#e8b84b]' : 'text-amber-600'}`}>
                          {fmt(totalPriceNum)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const payRes = await createPaymentUrlAPI(item.id)
                                  if (payRes?.payment_url) {
                                    window.location.href = payRes.payment_url
                                  } else {
                                    alert('Không nhận được đường dẫn thanh toán từ máy chủ.')
                                  }
                                } catch (e: any) {
                                  console.error('Lỗi tạo link thanh toán VNPay:', e)
                                  const detail = e.response?.data?.detail
                                  alert(
                                    detail
                                      ? `Không thể kết nối tới cổng thanh toán: ${detail}`
                                      : 'Không thể kết nối tới cổng thanh toán. Vui lòng thử lại hoặc chọn "Huỷ thanh toán".'
                                  )
                                }
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 shadow-md"
                            >
                              <span>💳</span>
                              <span>Thanh toán ngay</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCancelPendingTarget(item)}
                              className={`border rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                isDark
                                  ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/30'
                                  : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                              }`}
                            >
                              <span>✕</span>
                              <span>Huỷ thanh toán</span>
                            </button>
                          </>
                        )}
                        {isConfirmed && (
                          <button
                            type="button"
                            onClick={() => setTicketModalReservation(item)}
                            className="bg-[#e8b84b] hover:bg-[#f0c868] text-[#09090e] font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <span>🎟️</span>
                            <span>Xem Mã Vé</span>
                          </button>
                        )}
                        {isUpcoming && (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(item)}
                            className={`border rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                              isDark
                                ? 'bg-white/5 hover:bg-[rgba(192,57,43,0.2)] text-[#a09e9a] hover:text-[#e07060] border-white/10'
                                : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                            }`}
                          >
                            Hủy vé
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* CANCEL RESERVATION CONFIRM MODAL */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 border ${
            isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className={`font-display text-xl font-bold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>Xác nhận hủy vé xem phim</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
              Bạn có chắc chắn muốn hủy đơn đặt vé <strong className={isDark ? 'text-[#f0ede8]' : 'text-slate-900'}>#{cancelTarget.id}</strong> cho phim{' '}
              <strong className={isDark ? 'text-[#e8b84b]' : 'text-amber-600'}>{cancelTarget.showtime?.movie_title}</strong>? Ghế ngồi sẽ được giải phóng ngay sau khi hủy.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className={`px-4 py-2 rounded-lg text-xs font-bold border-0 cursor-pointer ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-[#f0ede8]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Giữ vé
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="bg-[#c0392b] hover:bg-[#e74c3c] text-white px-5 py-2 rounded-lg text-xs font-bold border-0 cursor-pointer disabled:opacity-50"
              >
                {cancelLoading ? 'Đang hủy...' : 'Xác nhận hủy vé'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCHANGE TICKET MODAL */}
      {exchangeTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`rounded-xl p-6 max-w-xl w-full shadow-2xl space-y-4 border max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b pb-3 border-white/10">
              <h3 className="font-display text-lg font-bold flex items-center gap-2 text-[#e8b84b]">
                <span>🔄</span>
                <span>Đổi Suất Chiếu Sang Suất Khác</span>
              </h3>
              <button
                type="button"
                onClick={() => setExchangeTarget(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {exchangeError && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{exchangeError}</span>
              </div>
            )}

            {/* STEP 1: SELECT NEW SHOWTIME */}
            {exchangeStep === 'showtime' && (
              <div className="space-y-3">
                <p className={`text-xs ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                  Chọn suất chiếu mới cho phim <strong className="text-[#e8b84b]">{exchangeTarget.showtime?.movie_title}</strong>:
                </p>

                {exchangeLoading ? (
                  <p className="text-xs text-amber-500 animate-pulse py-4 text-center">⏳ Đang tải danh sách suất chiếu...</p>
                ) : exchangeShowtimes.length === 0 ? (
                  <p className="text-xs italic text-slate-400 py-4 text-center">Không có suất chiếu nào khác sắp diễn ra cho phim này.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {exchangeShowtimes.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelectExchangeShowtime(st)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                          isDark
                            ? 'bg-[#09090e] border-white/10 hover:border-[#e8b84b] hover:bg-white/5'
                            : 'bg-slate-50 border-slate-200 hover:border-amber-400 hover:bg-amber-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-[#e8b84b]">🎬 {st.hall}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-400 font-mono-data font-bold">
                            {st.type}
                          </span>
                        </div>
                        <div className="text-sm font-mono-data font-bold text-emerald-400">
                          📅 {st.date} · 🕒 {st.time}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono-data">
                          Giá vé: {fmt(st.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SELECT NEW SEATS */}
            {exchangeStep === 'seats' && exchangeSelectedShowtime && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setExchangeStep('showtime')}
                    className="text-xs text-amber-400 hover:underline cursor-pointer font-bold"
                  >
                    ← Chọn lại suất chiếu
                  </button>
                  <span className="text-xs font-mono-data text-emerald-400 font-bold">
                    Suất chiếu: {exchangeSelectedShowtime.date} ({exchangeSelectedShowtime.time})
                  </span>
                </div>

                <p className={`text-xs ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                  Chọn ghế mới trong phòng <strong className="text-[#e8b84b]">{exchangeSelectedShowtime.hall}</strong>:
                </p>

                {exchangeLoading ? (
                  <p className="text-xs text-amber-500 animate-pulse py-4 text-center">⏳ Đang tải sơ đồ ghế...</p>
                ) : (
                  <div className="max-h-[280px] overflow-y-auto p-3 border rounded-xl bg-black/30 border-white/10">
                    <div className="grid grid-cols-8 gap-1.5 max-w-sm mx-auto">
                      {exchangeSeatsMap.map((seat) => {
                        const isTaken = seat.status === 'booked' || seat.status === 'held'
                        const isSelected = exchangeSelectedSeats.has(seat.seat_id)

                        return (
                          <button
                            key={seat.id}
                            type="button"
                            disabled={isTaken}
                            onClick={() => {
                              const newSet = new Set(exchangeSelectedSeats)
                              if (newSet.has(seat.seat_id)) {
                                newSet.delete(seat.seat_id)
                              } else {
                                newSet.add(seat.seat_id)
                              }
                              setExchangeSelectedSeats(newSet)
                            }}
                            className={`p-1.5 rounded text-[10px] font-mono-data font-bold border transition-all cursor-pointer ${
                              isTaken
                                ? 'bg-red-950/40 border-red-900 text-red-700 cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#2ecc71] border-[#2ecc71] text-black font-extrabold scale-105'
                                : 'bg-slate-800 border-white/20 text-slate-200 hover:border-amber-400'
                            }`}
                          >
                            {seat.row_label}{seat.col_number}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="text-xs font-mono-data">
                    Đã chọn: <strong className="text-emerald-400">{exchangeSelectedSeats.size}</strong> ghế
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setExchangeTarget(null)}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmExchange}
                      disabled={exchangeLoading || exchangeSelectedSeats.size === 0}
                      className="px-5 py-2 rounded-lg text-xs font-bold bg-[#2ecc71] text-black hover:brightness-110 cursor-pointer disabled:opacity-50"
                    >
                      {exchangeLoading ? '⏳ Đang xử lý...' : '✓ Xác Nhận Đổi Suất'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LOYALTY */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          <div className={`rounded-xl p-6 sm:p-8 border transition-colors ${
            isDark ? 'bg-[#111118] border-white/10 shadow-xl' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className={`font-display text-xl font-bold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                  🏆 Điểm Thưởng & Phân Hạng
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                  Điểm tích lũy từ mỗi lần đặt vé và các mức hạng thành viên.
                </p>
              </div>
            </div>

            {loyaltyLoading ? (
              <div className={`py-10 text-center text-xs ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                ⏳ Đang tải thông tin điểm thưởng...
              </div>
            ) : loyaltyData ? (
              <div className="space-y-6">
                <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#09090e] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Hạng hiện tại</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl">{loyaltyData.tier_icon}</span>
                        <span className="font-display text-2xl font-bold" style={{ color: loyaltyData.tier_color }}>
                          {loyaltyData.tier_label}
                        </span>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Tổng điểm</p>
                      <p className={`font-display text-3xl font-black ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                        {loyaltyData.points.toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={`${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Tiến độ lên hạng tiếp theo</span>
                      <span className={`font-bold ${isDark ? 'text-[#e8b84b]' : 'text-amber-700'}`}>
                        {loyaltyData.points_to_next_tier > 0 ? `${loyaltyData.points_to_next_tier} điểm nữa` : 'Đã đạt hạng cao nhất'}
                      </span>
                    </div>
                    <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                      <div className="h-full rounded-full" style={{ width: '100%', background: loyaltyData.tier_color }} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={`font-bold text-sm mb-3 ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>Lịch sử giao dịch điểm</h4>
                  {loyaltyData.transactions.length === 0 ? (
                    <div className={`rounded-xl border py-8 text-center text-xs ${isDark ? 'text-[#a09e9a] border-white/10' : 'text-slate-500 border-slate-200'}`}>
                      Chưa có giao dịch điểm nào.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {loyaltyData.transactions.map((tx) => (
                        <div key={tx.id} className={`rounded-xl border p-3 flex items-center justify-between ${isDark ? 'border-white/10 bg-[#09090e]' : 'border-slate-200 bg-white'}`}>
                          <div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                              {tx.reason === 'booking' ? 'Đặt vé thành công' : tx.reason === 'admin_adjust' ? 'Điều chỉnh bởi admin' : tx.reason || 'Giao dịch'}
                            </p>
                            <p className={`text-[11px] mt-1 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                              {tx.created_at ? new Date(tx.created_at).toLocaleString('vi-VN') : '—'}
                            </p>
                          </div>
                          <span className={`font-bold ${tx.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tx.points >= 0 ? '+' : ''}{tx.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`py-10 text-center text-xs ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                Không thể tải dữ liệu điểm thưởng.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: USER VOUCHERS */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          <div className={`rounded-xl p-6 sm:p-8 border transition-colors ${
            isDark ? 'bg-[#111118] border-white/10 shadow-xl' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className={`font-display text-xl font-bold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                  Kho Voucher & Mã Giảm Giá Của Tôi
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                  Các mã khuyến mãi độc quyền đang có hiệu lực dành cho tài khoản của bạn.
                </p>
              </div>
            </div>

            {copiedCode && (
              <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-semibold flex items-center justify-between animate-in fade-in">
                <span>✓ Đã sao chép mã <strong className="font-mono-data underline">{copiedCode}</strong> vào khay nhớ tạm!</span>
                <span className="text-[10px] opacity-80">Áp dụng khi thanh toán</span>
              </div>
            )}

            {voucherLoading ? (
              <div className={`py-12 text-center text-xs font-mono-data animate-pulse ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                ⏳ Đang kiểm tra kho voucher...
              </div>
            ) : userVouchers.length === 0 ? (
              <div className={`py-12 text-center text-xs italic border rounded-xl ${
                isDark ? 'text-[#a09e9a] bg-[#09090e] border-white/5' : 'text-slate-500 bg-slate-50 border-slate-200'
              }`}>
                🏷️ Hiện chưa có mã voucher nào trong kho. Hãy đón chờ các chương trình khuyến mãi mới nhất!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userVouchers.map((v) => {
                  const discountDisplay =
                    v.discount_type === 'percent'
                      ? `Giảm ${v.discount_value}%`
                      : `Giảm ${fmt(v.discount_value)}`

                  const minSpendDisplay =
                    v.min_spend > 0 ? `Đơn từ ${fmt(v.min_spend)}` : 'Mọi đơn hàng'

                  return (
                    <div
                      key={v.id}
                      className={`relative border rounded-2xl p-5 flex flex-col justify-between gap-4 overflow-hidden transition-all duration-200 hover:scale-[1.01] ${
                        isDark
                          ? 'bg-[#09090e] border-white/10 hover:border-[#e8b84b]/40 shadow-lg'
                          : 'bg-white border-slate-200 hover:border-amber-400 shadow-md'
                      }`}
                    >
                      {/* Left color bar decorative accent */}
                      <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-b from-[#e8b84b] to-[#c0392b]" />

                      <div className="pl-2 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-mono-data font-bold text-sm text-[#e8b84b] bg-[#e8b84b]/10 border border-[#e8b84b]/30 px-3 py-1 rounded-lg tracking-wider">
                            {v.code}
                          </span>
                          <span className="text-[10px] font-bold font-mono-data uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Sẵn sàng dùng
                          </span>
                        </div>

                        <div className="pt-1">
                          <p className={`font-display font-bold text-base ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                            {discountDisplay}
                          </p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                            {minSpendDisplay} {v.max_discount ? `(Giảm tối đa ${fmt(v.max_discount)})` : ''}
                          </p>
                        </div>

                        {v.is_first_booking_only && (
                          <span className="inline-block text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded font-semibold">
                            ✨ Dành riêng cho đơn hàng đầu tiên
                          </span>
                        )}
                      </div>

                      <div className={`pl-2 pt-3 border-t flex items-center justify-between text-xs ${
                        isDark ? 'border-white/5' : 'border-slate-100'
                      }`}>
                        <span className={`text-[11px] font-mono-data ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                          📅 {v.expiry_date ? `Hạn dùng: ${v.expiry_date}` : 'Vô thời hạn'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyVoucher(v.code)}
                          className="bg-[#e8b84b]/15 hover:bg-[#e8b84b]/30 text-[#e8b84b] border border-[#e8b84b]/40 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95"
                        >
                          {copiedCode === v.code ? '✓ Đã chép' : '📋 Sao chép mã'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CANCEL PENDING CONFIRMATION MODAL */}
      {cancelPendingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div
            className={cn(
              'w-full max-w-md rounded-2xl p-6 shadow-2xl border space-y-5',
              isDark ? 'bg-[#111118] border-white/15 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-display font-bold text-lg">Xác nhận huỷ thanh toán</h3>
                <p className={cn('text-xs', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  Mã vé: <span className="font-mono-data font-bold text-amber-500">{cancelPendingTarget.ticket_code || `#${cancelPendingTarget.id}`}</span>
                </p>
              </div>
            </div>

            <p className={cn('text-xs leading-relaxed p-3.5 rounded-xl border', isDark ? 'bg-[#181824] border-white/10 text-[#a09e9a]' : 'bg-slate-50 border-slate-200 text-slate-700')}>
              Bạn có chắc muốn huỷ thanh toán cho vé <strong className="text-amber-500">{cancelPendingTarget.ticket_code || `#${cancelPendingTarget.id}`}</strong>? Ghế đã chọn sẽ được giải phóng và bạn sẽ không thể tiếp tục thanh toán đơn này.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={cancelPendingLoading}
                onClick={() => setCancelPendingTarget(null)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer',
                  isDark ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                )}
              >
                Quay lại
              </button>

              <button
                type="button"
                disabled={cancelPendingLoading}
                onClick={async () => {
                  setCancelPendingLoading(true)
                  try {
                    await apiClient.post(`/api/v1/reservations/${cancelPendingTarget.id}/cancel`)
                    setCancelPendingTarget(null)
                    await loadReservations()
                    setActiveTab('history')
                    setHistoryFilter('cancelled')
                  } catch (err: any) {
                    alert(err.response?.data?.detail ?? 'Không thể huỷ thanh toán cho vé này.')
                  } finally {
                    setCancelPendingLoading(false)
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all disabled:opacity-50"
              >
                {cancelPendingLoading ? 'Đang huỷ...' : 'Huỷ thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E-TICKET QR MODAL */}
      <ETicketModal
        isOpen={!!ticketModalReservation}
        onClose={() => setTicketModalReservation(null)}
        reservation={ticketModalReservation}
        userName={user?.full_name}
      />
    </div>
  )
}
