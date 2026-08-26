import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { updateProfileAPI, changePasswordAPI } from '../api/auth'
import { fetchMyReservationsAPI, cancelReservationAPI, exchangeReservationAPI, fetchShowtimesByMovie, fetchSeatMap, createPaymentUrlAPI, fetchMyTransactionsAPI, type ReservationItem, type PaymentTransactionItem } from '../api/showtimes'
import { apiClient } from '../api/client'
import { fmt, cn } from '../lib/utils'
import type { ShowTime, SeatItem } from '../types'

import { ETicketModal } from '../components/features/ticket/ETicketModal'
import { fetchMyLoyalty, type LoyaltyStatus } from '../api/loyalty'
import { CleanDatePicker } from '../components/common/CleanDatePicker'

export default function ProfileView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as 'profile' | 'history' | 'transactions' | 'vouchers' | 'loyalty' | null

  const { user, isAuthenticated, logout, updateUserProfile } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'transactions' | 'vouchers' | 'loyalty'>(tabParam || 'profile')
  const [ticketModalReservation, setTicketModalReservation] = useState<ReservationItem | null>(null)

  useEffect(() => {
    if (tabParam && (tabParam === 'profile' || tabParam === 'history' || tabParam === 'transactions' || tabParam === 'vouchers' || tabParam === 'loyalty')) {
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
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all')

  // Payment Transactions States (FEAT-02)
  const [transactions, setTransactions] = useState<PaymentTransactionItem[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState<string | null>(null)

  // User Vouchers States
  const [userVouchers, setUserVouchers] = useState<any[]>([])
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyStatus | null>(null)
  const [loyaltyLoading, setLoyaltyLoading] = useState(false)
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null)

  // Change Password States & Modal
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Payment Transactions Date Range & Pagination States
  const [txStartDate, setTxStartDate] = useState('')
  const [txEndDate, setTxEndDate] = useState('')
  const [txQuickPreset, setTxQuickPreset] = useState<'all' | 'today' | '7days' | '30days'>('all')
  const [txPage, setTxPage] = useState(1)
  const txPageSize = 8

  function handleTxPresetChange(preset: 'all' | 'today' | '7days' | '30days') {
    setTxQuickPreset(preset)
    const now = new Date()
    const formatDate = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    if (preset === 'all') {
      setTxStartDate('')
      setTxEndDate('')
    } else if (preset === 'today') {
      const todayStr = formatDate(now)
      setTxStartDate(todayStr)
      setTxEndDate(todayStr)
    } else if (preset === '7days') {
      const past7 = new Date(now)
      past7.setDate(now.getDate() - 7)
      setTxStartDate(formatDate(past7))
      setTxEndDate(formatDate(now))
    } else if (preset === '30days') {
      const past30 = new Date(now)
      past30.setDate(now.getDate() - 30)
      setTxStartDate(formatDate(past30))
      setTxEndDate(formatDate(now))
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdMsg(null)

    if (newPassword.length < 8) {
      setPwdMsg({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' })
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPwdMsg({ type: 'error', text: 'Xác nhận mật khẩu mới không khớp.' })
      return
    }

    if (oldPassword === newPassword) {
      setPwdMsg({ type: 'error', text: 'Mật khẩu mới không được trùng với mật khẩu hiện tại. Vui lòng chọn một mật khẩu khác.' })
      return
    }

    setPwdLoading(true)
    try {
      const res = await changePasswordAPI(oldPassword, newPassword)
      setPwdMsg({ type: 'success', text: res.message || 'Đổi mật khẩu thành công!' })
      setOldPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => {
        setIsChangePasswordOpen(false)
        setPwdMsg(null)
      }, 1500)
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.'
      setPwdMsg({ type: 'error', text: typeof msg === 'string' ? msg : JSON.stringify(msg) })
    } finally {
      setPwdLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions()
    }
    if (activeTab === 'vouchers') {
      loadUserVouchers()
    }
    if (activeTab === 'loyalty') {
      loadLoyalty()
    }
  }, [activeTab])

  async function loadTransactions() {
    setTxLoading(true)
    setTxError(null)
    try {
      const data = await fetchMyTransactionsAPI()
      setTransactions(data)
    } catch (err) {
      console.error('Failed to load transactions:', err)
      setTxError('Không thể tải lịch sử thanh toán từ máy chủ.')
    } finally {
      setTxLoading(false)
    }
  }

  async function loadLoyalty() {
    setLoyaltyLoading(true)
    setLoyaltyError(null)
    try {
      const data = await fetchMyLoyalty()
      setLoyaltyData(data)
    } catch (err) {
      console.error('Failed to load loyalty data:', err)
      setLoyaltyError('Không thể tải thông tin điểm thưởng thành viên từ máy chủ.')
    } finally {
      setLoyaltyLoading(false)
    }
  }

  async function loadUserVouchers() {
    setVoucherLoading(true)
    setVoucherError(null)
    try {
      const { data } = await apiClient.get<any[]>('/api/v1/vouchers/')
      setUserVouchers(data)
    } catch (err) {
      console.error('Failed to load user vouchers:', err)
      setVoucherError('Không thể tải danh sách voucher khuyến mãi của bạn.')
    } finally {
      setVoucherLoading(false)
    }
  }

  function handleCopyVoucher(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

const CANCELLATION_REASONS = [
  'Tôi không còn nhu cầu xem phim nữa',
  'Tôi muốn chọn lại ghế / phòng chiếu / phim',
  'Trùng lịch đột xuất / Bận việc cá nhân',
  'Thay đổi số lượng người xem',
  'Khác (Nhập lý do cụ thể)',
]

  // Cancel Confirmation Modal State
  const [cancelTarget, setCancelTarget] = useState<ReservationItem | null>(null)
  const [cancelReason, setCancelReason] = useState<string>(CANCELLATION_REASONS[0])
  const [customCancelReason, setCustomCancelReason] = useState<string>('')
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
      const newReservation = await exchangeReservationAPI(
        exchangeTarget.id,
        exchangeSelectedShowtime.id,
        Array.from(exchangeSelectedSeats)
      )

      // Vé mới đang ở trạng thái PENDING — BẮT BUỘC chuyển ngay sang thanh toán
      const paymentRes = await createPaymentUrlAPI(newReservation.id)
      if (paymentRes?.payment_url) {
        window.location.href = paymentRes.payment_url
        return
      }
      throw new Error('Không thể khởi tạo thanh toán cho vé mới.')
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
    setHistoryError(null)
    try {
      const items = await fetchMyReservationsAPI()
      setReservations(items)
    } catch (err) {
      console.error('Failed to load reservations:', err)
      setHistoryError('Không thể tải danh sách lịch sử đặt vé từ máy chủ. Vui lòng thử lại.')
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
      const updatedUser = await updateProfileAPI({
        full_name: fullName,
        email: email,
        phone_number: phone || undefined,
        date_of_birth: dob || undefined,
        gender: gender,
        region: region,
      })
      updateUserProfile(updatedUser)
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
    const finalReason = cancelReason.startsWith('Khác')
      ? (customCancelReason.trim() || 'Khác')
      : cancelReason

    setCancelLoading(true)
    try {
      await cancelReservationAPI(cancelTarget.id, finalReason)
      setCancelTarget(null)
      setCancelReason(CANCELLATION_REASONS[0])
      setCustomCancelReason('')
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

  // Filter & Pagination for Transactions
  const filteredTransactions = (transactions || []).filter((tx) => {
    const rawDate = tx.pay_date || tx.created_at
    if (!rawDate) return true
    const txDate = new Date(rawDate)

    if (txStartDate) {
      const start = new Date(txStartDate)
      start.setHours(0, 0, 0, 0)
      if (txDate < start) return false
    }

    if (txEndDate) {
      const end = new Date(txEndDate)
      end.setHours(23, 59, 59, 999)
      if (txDate > end) return false
    }

    return true
  })

  const totalTxPages = Math.max(1, Math.ceil(filteredTransactions.length / txPageSize))
  const paginatedTransactions = filteredTransactions.slice(
    (txPage - 1) * txPageSize,
    txPage * txPageSize
  )

  useEffect(() => {
    setTxPage(1)
  }, [txStartDate, txEndDate, txQuickPreset])

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

      {/* Profile Tab Navigation Bar (FEAT-02) */}
      <div className={`flex items-center gap-2 p-1.5 rounded-xl border mb-8 overflow-x-auto ${
        isDark ? 'bg-[#111118] border-white/10' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => { setActiveTab('profile'); setSearchParams({ tab: 'profile' }) }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#e8b84b] text-[#09090e] shadow-md font-extrabold'
              : isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          👤 Thông tin cá nhân
        </button>
        <button
          onClick={() => { setActiveTab('history'); setSearchParams({ tab: 'history' }) }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#e8b84b] text-[#09090e] shadow-md font-extrabold'
              : isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🎟️ Lịch sử đặt vé
        </button>
        <button
          onClick={() => { setActiveTab('transactions'); setSearchParams({ tab: 'transactions' }) }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-[#e8b84b] text-[#09090e] shadow-md font-extrabold'
              : isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          💳 Lịch sử thanh toán
        </button>
        <button
          onClick={() => { setActiveTab('vouchers'); setSearchParams({ tab: 'vouchers' }) }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'vouchers'
              ? 'bg-[#e8b84b] text-[#09090e] shadow-md font-extrabold'
              : isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🎁 Kho Voucher
        </button>
        <button
          onClick={() => { setActiveTab('loyalty'); setSearchParams({ tab: 'loyalty' }) }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'loyalty'
              ? 'bg-[#e8b84b] text-[#09090e] shadow-md font-extrabold'
              : isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ⭐ Điểm thưởng & Hạng
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

            {/* Action buttons when in View Mode */}
            {!isEditing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPwdMsg(null)
                    setOldPassword('')
                    setNewPassword('')
                    setConfirmNewPassword('')
                    setIsChangePasswordOpen(true)
                  }}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-[#f0ede8] border-white/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <span>🔒</span>
                  <span>Đổi mật khẩu</span>
                </button>

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
              </div>
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
                <p className={`text-sm font-semibold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>{user?.full_name ?? 'Chưa cập nhật'}</p>
              </div>

              <div>
                <span className={`text-xs block mb-1 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Email</span>
                <p className={`text-sm font-semibold font-mono-data ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>{user?.email}</p>
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
          ) : historyError ? (
            <div className={`rounded-xl p-12 text-center border space-y-3 transition-colors ${
              isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <span className="text-4xl block">⚠️</span>
              <p className="font-display font-bold text-base">{historyError}</p>
              <button
                type="button"
                onClick={loadReservations}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
              >
                🔄 Thử lại
              </button>
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

      {/* CANCEL RESERVATION CONFIRM MODAL WITH REASON SELECTION */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border ${
            isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}>
              <h3 className="font-display text-lg font-bold flex items-center gap-2 text-rose-500">
                <span>🛑</span>
                <span>Xác Nhận Hủy Vé Xem Phim</span>
              </h3>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className={`text-sm cursor-pointer border-0 bg-transparent transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                ✕
              </button>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-2 ${
              isDark ? 'bg-[#161622] border-white/5' : 'bg-slate-50 border-slate-200/80 text-slate-800'
            }`}>
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-500 font-medium'}>Mã vé:</span>
                <span className={`font-mono-data font-bold ${isDark ? 'text-[#e8b84b]' : 'text-amber-600'}`}>
                  {cancelTarget.ticket_code || `#${cancelTarget.id}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-500 font-medium'}>Bộ phim:</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{cancelTarget.showtime?.movie_title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-500 font-medium'}>Phương thức thanh toán:</span>
                <span className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  {cancelTarget.payment_method === 'cash' ? '💵 Tiền mặt tại rạp' : '💳 VNPay / Thẻ ngân hàng'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`block text-xs font-bold ${isDark ? 'text-[#e8b84b]' : 'text-amber-700'}`}>
                📝 Vui lòng chọn lý do hủy vé:
              </label>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {CANCELLATION_REASONS.map((r, idx) => {
                  const isSelected = cancelReason === r
                  return (
                    <label
                      key={idx}
                      onClick={() => setCancelReason(r)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? isDark
                            ? 'border-[#e8b84b] bg-[#e8b84b]/15 text-[#f0ede8] font-bold shadow-sm'
                            : 'border-amber-500 bg-amber-500/10 text-slate-900 font-bold shadow-sm ring-1 ring-amber-500/30'
                          : isDark
                          ? 'border-white/10 bg-[#161622]/60 hover:bg-white/5 text-[#a09e9a]'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        checked={isSelected}
                        onChange={() => setCancelReason(r)}
                        className="accent-[#e8b84b] cursor-pointer w-4 h-4"
                      />
                      <span>{r}</span>
                    </label>
                  )
                })}
              </div>

              {cancelReason.startsWith('Khác') && (
                <div className="pt-1">
                  <textarea
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Vui lòng nhập chi tiết lý do hủy vé của bạn..."
                    rows={2}
                    className={`w-full p-3 rounded-xl text-xs border outline-none transition-all ${
                      isDark
                        ? 'bg-[#161622] border-white/10 text-white focus:border-[#e8b84b]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-sm'
                    }`}
                  />
                </div>
              )}
            </div>

            <div className={`flex gap-3 justify-end pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer transition-colors ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-[#f0ede8]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Giữ lại vé
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="bg-[#c0392b] hover:bg-[#e74c3c] text-white px-5 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md"
              >
                <span>❌</span>
                <span>{cancelLoading ? 'Đang hủy...' : 'Xác nhận hủy vé'}</span>
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

                <div className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                  isDark ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' : 'bg-amber-50 border border-amber-300 text-amber-900'
                }`}>
                  <span className="text-base leading-none">⚠️</span>
                  <span>
                    Sau khi xác nhận, bạn sẽ được chuyển sang trang thanh toán cho vé mới. <strong>Vé cũ chỉ được hủy/đổi sau khi thanh toán vé mới thành công.</strong>
                  </span>
                </div>

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
            ) : loyaltyError ? (
              <div className={`py-10 text-center text-xs space-y-3 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                <p>⚠️ {loyaltyError}</p>
                <button
                  type="button"
                  onClick={loadLoyalty}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                >
                  🔄 Thử lại
                </button>
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

      {/* TAB: PAYMENT TRANSACTIONS (FEAT-02) */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className={`rounded-xl p-6 sm:p-8 border transition-colors ${
            isDark ? 'bg-[#111118] border-white/10 shadow-xl' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="mb-6">
              <h3 className={`font-display text-xl font-bold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                Lịch Sử Giao Dịch
              </h3>
            </div>

            {/* DATE RANGE FILTER BAR */}
            <div className={`p-4 rounded-xl border mb-6 transition-colors ${
              isDark ? 'bg-[#09090e]/80 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs font-medium mr-1 ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                    Lọc nhanh:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTxPresetChange('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                      txQuickPreset === 'all' && !txStartDate && !txEndDate
                        ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm font-bold'
                        : isDark ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTxPresetChange('today')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                      txQuickPreset === 'today'
                        ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm font-bold'
                        : isDark ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTxPresetChange('7days')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                      txQuickPreset === '7days'
                        ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm font-bold'
                        : isDark ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    7 ngày qua
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTxPresetChange('30days')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                      txQuickPreset === '30days'
                        ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm font-bold'
                        : isDark ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    30 ngày qua
                  </button>
                </div>

                {/* Custom Date Range CleanDatePickers */}
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <div className="w-[175px] sm:w-[195px]">
                    <CleanDatePicker
                      value={txStartDate}
                      onChange={(d) => {
                        setTxQuickPreset('all')
                        setTxStartDate(d)
                      }}
                      maxDate={txEndDate || undefined}
                      placeholder="Từ ngày..."
                      isDark={isDark}
                    />
                  </div>

                  <span className={`text-xs font-bold ${isDark ? 'text-[#6e6c68]' : 'text-slate-400'}`}>→</span>

                  <div className="w-[175px] sm:w-[195px]">
                    <CleanDatePicker
                      value={txEndDate}
                      onChange={(d) => {
                        setTxQuickPreset('all')
                        setTxEndDate(d)
                      }}
                      minDate={txStartDate || undefined}
                      placeholder="Đến ngày..."
                      isDark={isDark}
                    />
                  </div>

                  {(txStartDate || txEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTxStartDate('')
                        setTxEndDate('')
                        setTxQuickPreset('all')
                      }}
                      title="Xóa bộ lọc ngày"
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                        isDark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                      }`}
                    >
                      ✕ Bỏ lọc
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Statistics */}
              <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs font-mono-data ${
                isDark ? 'border-white/5 text-[#a09e9a]' : 'border-slate-200/80 text-slate-500'
              }`}>
                <span>
                  Tìm thấy <strong className={isDark ? 'text-[#e8b84b]' : 'text-amber-600'}>{filteredTransactions.length}</strong> giao dịch
                  {(txStartDate || txEndDate) && ` (từ ${txStartDate || 'trước đây'} đến ${txEndDate || 'nay'})`}
                </span>
                <span>
                  Tổng chi: <strong className={isDark ? 'text-[#2ecc71]' : 'text-emerald-600'}>
                    {fmt(filteredTransactions.reduce((acc, t) => acc + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0))}
                  </strong>
                </span>
              </div>
            </div>

            {txLoading ? (
              <div className={`py-16 text-center text-xs font-mono-data animate-pulse ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                ⏳ Đang tải lịch sử giao dịch...
              </div>
            ) : txError ? (
              <div className={`py-12 text-center text-xs border rounded-xl space-y-3 ${
                isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <p>⚠️ {txError}</p>
                <button
                  type="button"
                  onClick={loadTransactions}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                >
                  🔄 Thử lại
                </button>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className={`py-16 text-center text-xs italic border rounded-xl ${
                isDark ? 'text-[#a09e9a] bg-[#09090e] border-white/5' : 'text-slate-500 bg-slate-50 border-slate-200'
              }`}>
                💳 Không tìm thấy giao dịch nào trong khoảng thời gian đã chọn.
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b font-semibold uppercase tracking-wider ${
                        isDark ? 'border-white/10 text-[#a09e9a]' : 'border-slate-200 text-slate-500'
                      }`}>
                        <th className="py-3 px-3">Mã vé / Phim</th>
                        <th className="py-3 px-3">Số tiền</th>
                        <th className="py-3 px-3">Phương thức</th>
                        <th className="py-3 px-3">Ngân hàng / GD</th>
                        <th className="py-3 px-3">Trạng thái</th>
                        <th className="py-3 px-3 text-right">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                      {paginatedTransactions.map((tx) => (
                        <tr key={tx.id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/70'}`}>
                          <td className="py-3.5 px-3">
                            <div className="font-mono-data font-bold text-amber-500">{tx.ticket_code}</div>
                            <div className={`text-[11px] font-medium mt-0.5 max-w-[200px] truncate ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                              {tx.movie_title}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono-data font-bold text-sm">
                            {fmt(tx.amount)}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              tx.payment_method === 'cash'
                                ? isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800'
                                : isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}>
                              {tx.payment_method === 'cash' ? '💵 Tiền mặt' : '💳 VNPay'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-mono-data font-medium">
                              {tx.bank_code || 'VNPay'} {tx.card_type ? `(${tx.card_type})` : ''}
                            </div>
                            <div className={`text-[10px] font-mono-data mt-0.5 ${isDark ? 'text-[#6e6c68]' : 'text-slate-400'}`}>
                              {tx.transaction_no ? `Mã GD: ${tx.transaction_no}` : (tx.vnp_txn_ref ? `Ref: ${tx.vnp_txn_ref}` : '—')}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                              tx.status === 'success' || tx.status === 'completed'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : tx.status === 'pending'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            }`}>
                              {tx.status === 'success' || tx.status === 'completed'
                                ? '✓ Thành công'
                                : tx.status === 'pending'
                                ? '⏳ Đang chờ'
                                : '✕ Thất bại'}
                            </span>
                          </td>
                          <td className={`py-3.5 px-3 text-right font-mono-data text-[11px] ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                            {tx.pay_date ? new Date(tx.pay_date).toLocaleString('vi-VN') : (tx.created_at ? new Date(tx.created_at).toLocaleString('vi-VN') : '—')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION CONTROLS */}
                {totalTxPages > 1 && (
                  <div className={`mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
                    isDark ? 'border-white/10' : 'border-slate-200'
                  }`}>
                    <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-500'}>
                      Hiển thị {(txPage - 1) * txPageSize + 1} - {Math.min(txPage * txPageSize, filteredTransactions.length)} trên tổng {filteredTransactions.length} giao dịch
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={txPage === 1}
                        onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                        className={`px-3 py-1.5 rounded-lg border font-bold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          isDark ? 'bg-white/5 hover:bg-white/10 text-[#f0ede8] border-white/10' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        ← Trang trước
                      </button>

                      {Array.from({ length: totalTxPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setTxPage(pageNum)}
                          className={`w-8 h-8 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
                            txPage === pageNum
                              ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-md'
                              : isDark ? 'bg-white/5 hover:bg-white/10 text-[#a09e9a] border-white/10' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={txPage === totalTxPages}
                        onClick={() => setTxPage((p) => Math.min(totalTxPages, p + 1))}
                        className={`px-3 py-1.5 rounded-lg border font-bold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          isDark ? 'bg-white/5 hover:bg-white/10 text-[#f0ede8] border-white/10' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        Trang sau →
                      </button>
                    </div>
                  </div>
                )}
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
            ) : voucherError ? (
              <div className={`py-12 text-center text-xs border rounded-xl space-y-3 ${
                isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <p>⚠️ {voucherError}</p>
                <button
                  type="button"
                  onClick={loadUserVouchers}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                >
                  🔄 Thử lại
                </button>
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

      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsChangePasswordOpen(false)
              setPwdMsg(null)
            }
          }}
        >
          <div
            className={`w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border transition-all scale-100 ${
              isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔐</span>
                <h3 className="font-display font-bold text-lg">Đổi mật khẩu tài khoản</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangePasswordOpen(false)
                  setPwdMsg(null)
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  isDark ? 'hover:bg-white/10 text-[#a09e9a]' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                ✕
              </button>
            </div>

            <p className={`text-xs mb-5 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
              Mật khẩu mới phải có tối thiểu 8 ký tự và không được trùng với mật khẩu hiện tại.
            </p>

            {/* Notification Banner */}
            {pwdMsg && (
              <div
                className={`p-3.5 rounded-xl mb-5 text-xs flex items-center gap-2 font-medium ${
                  pwdMsg.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                }`}
              >
                <span>{pwdMsg.type === 'success' ? '✓' : '⚠'}</span>
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4" autoComplete="off">
              <div>
                <label className={`block text-xs mb-1.5 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-2.5 text-sm ${isDark ? 'text-[#6e6c68]' : 'text-slate-400'}`}>🔒</span>
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang sử dụng"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-xs outline-none transition-colors border ${
                      isDark
                        ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className={`absolute right-3 top-2.5 bg-transparent border-0 cursor-pointer text-xs ${isDark ? 'text-[#6e6c68]' : 'text-slate-400'}`}
                  >
                    {showOldPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs mb-1.5 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                  Mật khẩu mới (tối thiểu 8 ký tự)
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-2.5 text-sm ${isDark ? 'text-[#6e6c68]' : 'text-slate-400'}`}>🔒</span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới khác mật khẩu cũ"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-xs outline-none transition-colors border ${
                      isDark
                        ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-3 top-2.5 bg-transparent border-0 cursor-pointer text-xs ${isDark ? 'text-[#6e6c68]' : 'text-slate-400'}`}
                  >
                    {showNewPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs mb-1.5 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-2.5 text-sm ${isDark ? 'text-[#6e6c68]' : 'text-slate-400'}`}>🔒</span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none transition-colors border ${
                      isDark
                        ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordOpen(false)
                    setPwdMsg(null)
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isDark ? 'bg-white/5 hover:bg-white/10 text-[#f0ede8] border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex-1 bg-[#e8b84b] hover:bg-[#d4a338] text-[#09090e] py-2.5 rounded-xl font-bold text-xs cursor-pointer hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] transition-all disabled:opacity-50"
                >
                  {pwdLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu →'}
                </button>
              </div>
            </form>
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
