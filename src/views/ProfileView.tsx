import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateProfileAPI } from '../api/auth'
import { fetchMyReservationsAPI, cancelReservationAPI, type ReservationItem } from '../api/showtimes'
import { fmt } from '../lib/utils'

export default function ProfileView() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

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
        className="flex items-center gap-1.5 bg-transparent border-0 text-[#a09e9a] text-sm cursor-pointer mb-6 hover:text-[#f0ede8] transition-colors"
      >
        ← Trang chủ
      </button>

      {/* User Header Profile Card */}
      <div className="bg-[#111118] border border-white/10 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#e8b84b]/15 border border-[#e8b84b]/40 flex items-center justify-center text-[#e8b84b] font-bold text-2xl">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-[#f0ede8]">
              {user?.full_name ?? 'Thành viên CineVerse'}
            </h2>
            <p className="text-xs text-[#a09e9a] font-mono-data mt-0.5">{user?.email}</p>
            <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono-data text-[#e8b84b] uppercase">
              {user?.role === 'admin' ? '⚡ Quản trị viên (Admin)' : ' Hạng Thành viên'}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="bg-white/5 hover:bg-[rgba(192,57,43,0.2)] text-[#a09e9a] hover:text-[#e07060] border border-white/10 hover:border-[rgba(192,57,43,0.4)] rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
        >
          Đăng xuất
        </button>
      </div>

      {/* Tab Controls */}
      <div className="flex border-b border-white/10 mb-8 gap-8">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'border-[#e8b84b] text-[#e8b84b]'
              : 'border-transparent text-[#a09e9a] hover:text-[#f0ede8]'
          }`}
        >
          👤 Thông tin cá nhân
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-[#e8b84b] text-[#e8b84b]'
              : 'border-transparent text-[#a09e9a] hover:text-[#f0ede8]'
          }`}
        >
          🎟️ Lịch sử đặt vé & Hủy vé
        </button>
      </div>

      {/* TAB 1: PROFILE INFO & EDIT FORM */}
      {activeTab === 'profile' && (
        <div className="bg-[#111118] border border-white/10 rounded-xl p-6 sm:p-8 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-display text-xl font-bold text-[#f0ede8] mb-1">
                Quản lý thông tin tài khoản
              </h3>
              <p className="text-xs text-[#a09e9a]">
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
                className="bg-[#e8b84b]/15 hover:bg-[#e8b84b]/30 text-[#e8b84b] border border-[#e8b84b]/30 rounded-lg px-4 py-2 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#09090e]/60 p-6 rounded-xl border border-white/5">
              <div>
                <span className="text-xs text-[#a09e9a] block mb-1 font-medium">Họ và tên</span>
                <p className="text-sm font-semibold text-[#f0ede8]">{user?.full_name || 'Chưa cập nhật'}</p>
              </div>

              <div>
                <span className="text-xs text-[#a09e9a] block mb-1 font-medium">Email</span>
                <p className="text-sm font-semibold text-[#f0ede8] font-mono-data">{user?.email || 'Chưa cập nhật'}</p>
              </div>

              <div>
                <span className="text-xs text-[#a09e9a] block mb-1 font-medium">Số điện thoại</span>
                <p className="text-sm font-semibold text-[#f0ede8] font-mono-data">
                  {user?.phone_number || 'Chưa cập nhật'}
                </p>
              </div>

              <div>
                <span className="text-xs text-[#a09e9a] block mb-1 font-medium">Ngày sinh</span>
                <p className="text-sm font-semibold text-[#f0ede8] font-mono-data">
                  {user?.date_of_birth || 'Chưa cập nhật'}
                </p>
              </div>

              <div>
                <span className="text-xs text-[#a09e9a] block mb-1 font-medium">Giới tính</span>
                <p className="text-sm font-semibold text-[#f0ede8]">{user?.gender || 'Chưa cập nhật'}</p>
              </div>

              <div>
                <span className="text-xs text-[#a09e9a] block mb-1 font-medium">Khu vực sinh sống</span>
                <p className="text-sm font-semibold text-[#f0ede8]">{user?.region || 'Chưa cập nhật'}</p>
              </div>
            </div>
          ) : (
            /* EDIT MODE FORM */
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none font-mono-data"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Số điện thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none font-mono-data"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Ngày sinh</label>
                  <input
                    type="date"
                    value={dob}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker()
                      } catch {}
                    }}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none font-mono-data cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none cursor-pointer"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Khu vực sinh sống</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none cursor-pointer"
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
                  className="bg-white/5 hover:bg-white/15 text-[#f0ede8] px-6 py-2.5 rounded-lg font-bold text-xs border border-white/10 cursor-pointer transition-all"
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
          <div className="flex justify-between items-center bg-[#111118] border border-white/10 rounded-xl p-4">
            <h3 className="font-display font-bold text-base text-[#f0ede8]">Danh sách vé đã đặt</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border transition-all ${
                  historyFilter === 'all'
                    ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b]'
                    : 'bg-white/5 border-white/10 text-[#a09e9a]'
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
                    : 'bg-white/5 border-white/10 text-[#a09e9a]'
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
                    : 'bg-white/5 border-white/10 text-[#a09e9a]'
                }`}
              >
                Đã hủy ({reservations.filter((r) => r.status === 'cancelled').length})
              </button>
            </div>
          </div>

          {/* Ticket List */}
          {historyLoading ? (
            <div className="text-center py-16 text-xs text-[#a09e9a] font-mono-data animate-pulse">
              Đang tải lịch sử đặt vé...
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="bg-[#111118] border border-white/10 rounded-xl p-12 text-center text-[#a09e9a]">
              <span className="text-4xl block mb-3">🎟️</span>
              <p className="font-display font-semibold text-lg text-[#f0ede8] mb-1">Chưa có lịch sử đặt vé</p>
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
                    className="bg-[#111118] border border-white/10 rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between gap-5 relative overflow-hidden"
                  >
                    {/* Status side bar indicator */}
                    <div
                      className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                        isCancelled ? 'bg-[#e07060]' : 'bg-[#2ecc71]'
                      }`}
                    />

                    <div className="flex gap-4 items-start pl-2">
                      {/* Movie poster thumbnail */}
                      <img
                        src={
                          item.showtime?.movie_poster_url ??
                          'https://images.unsplash.com/photo-1634733049839-0292be607569?w=120&h=180&fit=crop'
                        }
                        alt={item.showtime?.movie_title ?? 'Phim'}
                        className="w-16 h-24 object-cover rounded-lg border border-white/10 shrink-0"
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
                          <span className="text-[11px] text-[#6e6c68] font-mono-data">
                            Mã vé: #{item.id}
                          </span>
                        </div>

                        <h4 className="font-display font-bold text-lg text-[#f0ede8] mb-1">
                          {item.showtime?.movie_title ?? 'Xem phim trực tuyến'}
                        </h4>

                        <p className="text-xs text-[#a09e9a] mb-1">
                          🕒 {startTimeFormatted} · 🎬 {item.showtime?.room_name ?? 'Rạp CineVerse'}
                        </p>

                        <p className="text-xs text-[#e8b84b] font-medium">
                          💺 Ghế đã chọn: <span className="font-bold">{seatsList || 'N/A'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Price and Cancel action */}
                    <div className="flex flex-row md:flex-col justify-between items-end border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-5 shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-[#a09e9a] block font-mono-data">Tổng tiền</span>
                        <span className="font-mono-data text-xl font-bold text-[#e8b84b]">
                          {fmt(totalPriceNum)}
                        </span>
                      </div>

                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(item)}
                          className="bg-white/5 hover:bg-[rgba(192,57,43,0.2)] text-[#a09e9a] hover:text-[#e07060] border border-white/10 hover:border-[rgba(192,57,43,0.4)] rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
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
          <div className="bg-[#111118] border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-display text-xl font-bold text-[#f0ede8]">Xác nhận hủy vé xem phim</h3>
            <p className="text-xs text-[#a09e9a] leading-relaxed">
              Bạn có chắc chắn muốn hủy đơn đặt vé <strong className="text-[#f0ede8]">#{cancelTarget.id}</strong> cho phim{' '}
              <strong className="text-[#e8b84b]">{cancelTarget.showtime?.movie_title}</strong>? Ghế ngồi sẽ được giải phóng ngay sau khi hủy.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="bg-white/10 hover:bg-white/20 text-[#f0ede8] px-4 py-2 rounded-lg text-xs font-bold border-0 cursor-pointer"
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
