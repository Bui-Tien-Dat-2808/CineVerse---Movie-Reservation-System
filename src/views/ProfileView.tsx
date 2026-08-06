import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { updateProfileAPI } from '../api/auth'
import { fetchMyReservationsAPI, cancelReservationAPI, type ReservationItem } from '../api/showtimes'
import { fmt } from '../lib/utils'

export default function ProfileView() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile')
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
  const [historyFilter, setHistoryFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all')

  // Cancel Confirmation Modal State
  const [cancelTarget, setCancelTarget] = useState<ReservationItem | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

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
    return true
  })

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10 pb-20">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className={`flex items-center gap-1.5 bg-transparent border-0 text-sm cursor-pointer mb-6 transition-colors ${
          isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        ← Trang chủ
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
              {user?.role === 'admin' ? '⚡ Quản trị viên (Admin)' : ' Hạng Thành viên'}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all border cursor-pointer ${
            isDark
              ? 'bg-white/5 hover:bg-[rgba(192,57,43,0.2)] text-[#a09e9a] hover:text-[#e07060] border-white/10 hover:border-[rgba(192,57,43,0.4)]'
              : 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border-slate-200 hover:border-red-200'
          }`}
        >
          Đăng xuất
        </button>
      </div>

      {/* Tab Controls */}
      <div className={`flex border-b mb-8 gap-8 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? isDark ? 'border-[#e8b84b] text-[#e8b84b]' : 'border-amber-500 text-amber-600'
              : isDark ? 'border-transparent text-[#a09e9a] hover:text-[#f0ede8]' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          👤 Thông tin cá nhân
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? isDark ? 'border-[#e8b84b] text-[#e8b84b]' : 'border-amber-500 text-amber-600'
              : isDark ? 'border-transparent text-[#a09e9a] hover:text-[#f0ede8]' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          🎟️ Lịch sử đặt vé & Hủy vé
        </button>
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
          <div className={`flex justify-between items-center rounded-xl p-4 border transition-colors ${
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <h3 className={`font-display font-bold text-base ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>Danh sách vé đã đặt</h3>
            <div className="flex gap-2">
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
                        isCancelled ? 'bg-[#e07060]' : 'bg-[#2ecc71]'
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
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono-data ${
                              isCancelled
                                ? 'bg-[rgba(224,112,96,0.15)] text-[#e07060] border border-[rgba(224,112,96,0.3)]'
                                : 'bg-[rgba(46,204,113,0.15)] text-[#2ecc71] border border-[rgba(46,204,113,0.3)]'
                            }`}
                          >
                            {isCancelled ? 'Đã hủy' : 'Đã xác nhận'}
                          </span>
                          <span className={`text-[11px] font-mono-data ${isDark ? 'text-[#6e6c68]' : 'text-slate-400'}`}>
                            Mã vé: #{item.id}
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

                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(item)}
                          className={`border rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                            isDark
                              ? 'bg-white/5 hover:bg-[rgba(192,57,43,0.2)] text-[#a09e9a] hover:text-[#e07060] border-white/10'
                              : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                          }`}
                        >
                          Hủy vé này
                        </button>
                      )}
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
    </div>
  )
}
