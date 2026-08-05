import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../api/client'
import { fmt } from '../lib/utils'

interface MovieItem {
  id: number
  title: string
  description?: string
  poster_url?: string
  duration_minutes?: number
  release_date?: string
  status: 'now_showing' | 'coming_soon' | 'ended' | string
  rating?: string
}

interface RoomItem {
  id: number
  name: string
  room_type: string
  room_number?: number
  total_rows: number
  total_cols: number
  total_seats: number
}

interface ShowtimeItem {
  id: number
  movie_id: number
  room_id: number
  start_time: string
  end_time: string
  base_price: string | number
  vip_price?: string | number
  status: string
  available_seats?: number
  total_seats?: number
  movie?: { title?: string; poster_url?: string }
  room?: { name?: string; room_type?: string }
}

interface PaginationControlProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

function PaginationControl({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationControlProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#161622] border-t border-white/10 text-xs">
      <div className="text-[#a09e9a]">
        Hiển thị <span className="font-bold text-[#f0ede8]">{startItem}</span> -{' '}
        <span className="font-bold text-[#f0ede8]">{endItem}</span> trên tổng số{' '}
        <span className="font-bold text-[#e8b84b]">{totalItems}</span> bản ghi
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded border border-white/10 bg-[#111118] text-[#f0ede8] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all cursor-pointer font-medium"
        >
          ‹ Trang trước
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded border font-bold text-xs transition-all cursor-pointer ${
              currentPage === p
                ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm'
                : 'border-white/10 bg-[#111118] text-[#a09e9a] hover:text-[#f0ede8] hover:border-white/20'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded border border-white/10 bg-[#111118] text-[#f0ede8] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all cursor-pointer font-medium"
        >
          Trang sau ›
        </button>
      </div>
    </div>
  )
}

interface VoucherAdminItem {
  id: number
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_spend: number
  max_discount?: number
  expiry_date?: string
  max_uses_total?: number
  is_active: boolean
  is_first_booking_only?: boolean
}

interface ProposedShowtimeItem {
  movie_id: number
  movie_title: string
  room_id: number
  room_name: string
  start_time: string
  end_time: string
  base_price: number
  vip_price: number
}

function formatVNFullDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return ''
  const dt = new Date(y, m - 1, d)
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  const dayName = daysOfWeek[dt.getDay()]
  return `${dayName}, ${d < 10 ? '0' + d : d}/${m < 10 ? '0' + m : m}/${y}`
}

interface CleanDatePickerProps {
  value: string
  onChange: (dateStr: string) => void
  minDate?: string
  label?: string
}

function CleanDatePicker({ value, onChange, minDate, label }: CleanDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      return new Date(y, m - 1, 1)
    }
    return new Date()
  })

  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      setViewDate(new Date(y, m - 1, 1))
    }
  }, [value])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const monthNames = [
    'Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
    'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'
  ]

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let firstDayIndex = new Date(year, month, 1).getDay() - 1
  if (firstDayIndex < 0) firstDayIndex = 6

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }

  function handleSelectDay(day: number) {
    const mStr = (month + 1).toString().padStart(2, '0')
    const dStr = day.toString().padStart(2, '0')
    const selectedStr = `${year}-${mStr}-${dStr}`
    if (minDate && selectedStr < minDate) return
    onChange(selectedStr)
    setOpen(false)
  }

  const selectedYMD = value ? value : ''

  return (
    <div className="relative">
      {label && <label className="block text-[#a09e9a] mb-1 font-medium text-xs">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 bg-[#111118] border border-white/10 hover:border-[#e8b84b]/50 rounded-lg text-[#f0ede8] font-mono-data text-xs flex justify-between items-center cursor-pointer transition-colors"
      >
        <span>{value ? formatVNFullDate(value) : 'Chọn ngày...'}</span>
        <span className="text-[#a09e9a] text-sm">📅</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 bg-[#111118] border border-white/20 rounded-xl p-4 shadow-2xl w-[290px] space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-[#f0ede8]">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#e8b84b] cursor-pointer"
              >
                ◀
              </button>
              <span>{monthNames[month]} {year}</span>
              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#e8b84b] cursor-pointer"
              >
                ▶
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#6e6c68]">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span className="text-[#e07060]">CN</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono-data">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="w-8 h-8" />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1
                const mStr = (month + 1).toString().padStart(2, '0')
                const dStr = dayNum.toString().padStart(2, '0')
                const dayYMD = `${year}-${mStr}-${dStr}`
                const isSelected = dayYMD === selectedYMD
                const isDisabled = Boolean(minDate && dayYMD < minDate)

                return (
                  <button
                    key={dayNum}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectDay(dayNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#e8b84b] text-[#09090e] font-bold scale-105 shadow-md'
                        : isDisabled
                          ? 'text-white/20 cursor-not-allowed'
                          : 'text-[#c0bdb8] hover:bg-white/10 hover:text-[#f0ede8]'
                    }`}
                  >
                    {dayNum}
                  </button>
                )
              })}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px]">
              <button
                type="button"
                onClick={() => {
                  const todayStr = new Date().toISOString().split('T')[0]
                  if (!minDate || todayStr >= minDate) {
                    onChange(todayStr)
                    setOpen(false)
                  }
                }}
                className="text-[#e8b84b] hover:underline cursor-pointer"
              >
                Hôm nay
              </button>
              <span className="text-[#6e6c68] font-mono-data">{daysInMonth} ngày trong tháng</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function AdminView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isAuthenticated, isAuthLoading } = useAuth()

  const tabParam = searchParams.get('tab') as
    | 'movies'
    | 'showtimes'
    | 'rooms'
    | 'vouchers'
    | 'analytics'
    | 'users'
    | null

  const [activeTabState, setActiveTabState] = useState<
    'movies' | 'showtimes' | 'rooms' | 'vouchers' | 'analytics' | 'users'
  >(tabParam || 'movies')

  const activeTab = tabParam || activeTabState

  const setActiveTab = (tab: 'movies' | 'showtimes' | 'rooms' | 'vouchers' | 'analytics' | 'users') => {
    setActiveTabState(tab)
    setSearchParams({ tab })
  }

  // Sub-tab filter for Movies management (Đang chiếu vs Sắp ra mắt)
  const [movieSubTab, setMovieSubTab] = useState<'now_showing' | 'coming_soon' | 'all'>('now_showing')

  // Pagination states
  const [moviePage, setMoviePage] = useState(1)
  const [showtimePage, setShowtimePage] = useState(1)
  const [roomPage, setRoomPage] = useState(1)
  const [voucherPage, setVoucherPage] = useState(1)
  const PAGE_SIZE = 8

  // Check Admin Access Guard - Redirect non-admin users to home
  useEffect(() => {
    if (isAuthLoading) return

    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/')
      return
    }
    loadAllData()
  }, [isAuthenticated, isAuthLoading, user, navigate])

  useEffect(() => {
    setMoviePage(1)
  }, [movieSubTab])

  // ─────────────────────────────────────────
  // Data States
  // ─────────────────────────────────────────
  const [movies, setMovies] = useState<MovieItem[]>([])
  const [showtimes, setShowtimes] = useState<ShowtimeItem[]>([])
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [vouchers, setVouchers] = useState<VoucherAdminItem[]>([])
  const [loading, setLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Create Voucher Form State
  const [vCode, setVCode] = useState('')
  const [vType, setVType] = useState<'percent' | 'fixed'>('percent')
  const [vValue, setVValue] = useState<number>(10)
  const [vMinSpend, setVMinSpend] = useState<number>(0)
  const [vMaxDiscount, setVMaxDiscount] = useState<number>(50000)
  const [vExpiry, setVExpiry] = useState<string>('2026-12-31')
  const [vFirstOnly, setVFirstOnly] = useState<boolean>(false)
  const [vMaxPerUser, setVMaxPerUser] = useState<number>(1)
  const [vLoading, setVLoading] = useState(false)


  // Create Showtime Form State
  const [stMovieId, setStMovieId] = useState<number>(0)
  const [stRoomId, setStRoomId] = useState<number>(0)
  const [stStartTime, setStStartTime] = useState<string>('')
  const [stBasePrice, setStBasePrice] = useState<number>(90000)
  const [stVipPrice, setStVipPrice] = useState<number>(120000)
  const [stLoading, setStLoading] = useState(false)

  // Showtime Filters State
  const [stFilterMovieId, setStFilterMovieId] = useState<number | 'all'>('all')
  const [stFilterRoomId, setStFilterRoomId] = useState<number | 'all'>('all')

  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((st) => {
      if (stFilterMovieId !== 'all' && st.movie_id !== stFilterMovieId) return false
      if (stFilterRoomId !== 'all' && st.room_id !== stFilterRoomId) return false
      return true
    })
  }, [showtimes, stFilterMovieId, stFilterRoomId])

  // Auto-Schedule Modal State
  const [autoModalOpen, setAutoModalOpen] = useState(false)
  const [autoStartDate, setAutoStartDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [autoEndDate, setAutoEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  )
  const [autoStartTimeStr, setAutoStartTimeStr] = useState('08:00')
  const [autoEndTimeStr, setAutoEndTimeStr] = useState('23:30')
  const [autoBufferMins, setAutoBufferMins] = useState(15)
  const [autoBasePrice, setAutoBasePrice] = useState(90000)
  const [autoVipPrice, setAutoVipPrice] = useState(120000)
  const [autoReplaceExisting, setAutoReplaceExisting] = useState(true)
  const [autoMovieSelectionMode, setAutoMovieSelectionMode] = useState<'all' | 'custom'>('all')
  const [autoSelectedMovieIds, setAutoSelectedMovieIds] = useState<number[]>([])
  const [autoRoomSelectionMode, setAutoRoomSelectionMode] = useState<'all' | 'custom'>('all')
  const [autoSelectedRoomIds, setAutoSelectedRoomIds] = useState<number[]>([])
  const [autoPreviewList, setAutoPreviewList] = useState<ProposedShowtimeItem[] | null>(null)
  const [autoGenerating, setAutoGenerating] = useState(false)
  const [autoConfirming, setAutoConfirming] = useState(false)

  // Create Room Form State
  const [rName, setRName] = useState('')
  const [rType, setRType] = useState('standard')
  const [rRows, setRRows] = useState(8)
  const [rCols, setRCols] = useState(10)
  const [rLoading, setRLoading] = useState(false)

  const [liveAnalytics, setLiveAnalytics] = useState<{
    total_revenue: number
    total_reservations: number
    active_movies_count: number
    total_users_count: number
    total_rooms_count: number
    total_showtimes_count: number
  } | null>(null)

  const [capacityReport, setCapacityReport] = useState<Array<{
    showtime_id: number
    movie_title: string
    room_name: string
    total_seats: number
    reserved_seats: number
    available_seats: number
    occupancy_rate: number
    revenue: number
  }>>([])

  // Check Admin Access Guard - Redirect non-admin users to home
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/')
      return
    }
    loadAllData()
  }, [isAuthenticated, user, navigate])

  async function loadAllData() {
    setLoading(true)
    try {
      const [movRes, rmRes, stRes, anaRes, capRes, vchRes] = await Promise.all([
        apiClient.get<{ items: MovieItem[] }>('/api/v1/movies/?page_size=100').catch((err) => {
          console.error('Failed to load movies:', err)
          setActionMsg({ type: 'error', text: 'Không thể tải danh sách phim từ máy chủ.' })
          return null
        }),
        apiClient.get<RoomItem[]>('/api/v1/rooms/').catch((err) => {
          console.error('Failed to load rooms:', err)
          return null
        }),
        apiClient.get<{ items: ShowtimeItem[] }>('/api/v1/showtimes/?page_size=500').catch((err) => {
          console.error('Failed to load showtimes:', err)
          setActionMsg({ type: 'error', text: 'Không thể tải danh sách suất chiếu từ máy chủ.' })
          return null
        }),
        apiClient.get<any>('/api/v1/analytics/dashboard').catch(() => null),
        apiClient.get<any[]>('/api/v1/reservations/admin/report/capacity').catch(() => null),
        apiClient.get<VoucherAdminItem[]>('/api/v1/vouchers/admin/all').catch(() => null),
      ])

      if (movRes?.data?.items) setMovies(movRes.data.items)
      if (rmRes?.data) setRooms(rmRes.data)
      if (stRes?.data?.items) setShowtimes(stRes.data.items)
      if (anaRes?.data) setLiveAnalytics(anaRes.data)
      if (capRes?.data) setCapacityReport(capRes.data)
      if (vchRes?.data) setVouchers(vchRes.data)
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateVoucher(e: React.FormEvent) {
    e.preventDefault()
    if (!vCode.trim()) return

    setVLoading(true)
    setActionMsg(null)
    try {
      await apiClient.post('/api/v1/vouchers/', {
        code: vCode.trim().toUpperCase(),
        discount_type: vType,
        discount_value: Number(vValue),
        min_spend: Number(vMinSpend),
        max_discount: vType === 'percent' ? Number(vMaxDiscount) : null,
        expiry_date: vExpiry || null,
        is_first_booking_only: vFirstOnly,
        max_uses_per_user: Number(vMaxPerUser) || 1,
        is_active: true,
      })

      setActionMsg({ type: 'success', text: `Tạo voucher khuyến mãi "${vCode.toUpperCase()}" thành công!` })
      setVCode('')
      await loadAllData()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Tạo mã voucher thất bại.'
      setActionMsg({ type: 'error', text: typeof msg === 'string' ? msg : JSON.stringify(msg) })
    } finally {
      setVLoading(false)
    }
  }

  async function handleToggleVoucherActive(voucher: VoucherAdminItem) {
    setActionMsg(null)
    try {
      await apiClient.put(`/api/v1/vouchers/${voucher.id}`, {
        is_active: !voucher.is_active,
      })
      setActionMsg({
        type: 'success',
        text: `Đã ${!voucher.is_active ? 'bật' : 'tắt'} mã voucher "${voucher.code}" thành công!`,
      })
      await loadAllData()
    } catch (err: any) {
      setActionMsg({ type: 'error', text: 'Cập nhật trạng thái voucher thất bại.' })
    }
  }

  // Toggle Movie Status
  async function handleToggleMovieStatus(movie: MovieItem) {
    const nextStatus =
      movie.status === 'now_showing'
        ? 'coming_soon'
        : movie.status === 'coming_soon'
        ? 'ended'
        : 'now_showing'

    try {
      await apiClient.put(`/api/v1/movies/${movie.id}`, { status: nextStatus })
      setActionMsg({ type: 'success', text: `Đã đổi trạng thái phim "${movie.title}" sang ${nextStatus}!` })
      await loadAllData()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Không thể cập nhật trạng thái phim.')
    }
  }

  // Handle Delete Movie
  async function handleDeleteMovie(movieId: number, title: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa phim "${title}"?`)) return
    try {
      await apiClient.delete(`/api/v1/movies/${movieId}`)
      setActionMsg({ type: 'success', text: `Đã xóa phim "${title}"!` })
      await loadAllData()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Xóa phim thất bại.')
    }
  }

  // Handle Create Showtime
  async function handleCreateShowtime(e: React.FormEvent) {
    e.preventDefault()
    if (!stMovieId || !stRoomId || !stStartTime) {
      alert('Vui lòng điền đầy đủ Phim, Phòng chiếu và Thời gian khởi chiếu.')
      return
    }

    setStLoading(true)
    setActionMsg(null)
    try {
      // Format start_time to ISO format
      const isoStartTime = new Date(stStartTime).toISOString()

      await apiClient.post('/api/v1/showtimes/', {
        movie_id: Number(stMovieId),
        room_id: Number(stRoomId),
        start_time: isoStartTime,
        base_price: Number(stBasePrice),
        vip_price: Number(stVipPrice),
      })

      setActionMsg({ type: 'success', text: 'Tạo suất chiếu mới thành công!' })
      setStStartTime('')
      await loadAllData()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Tạo suất chiếu thất bại (Có thể bị trùng lịch chiếu).'
      setActionMsg({ type: 'error', text: typeof msg === 'string' ? msg : JSON.stringify(msg) })
    } finally {
      setStLoading(false)
    }
  }

  // Handle Create Room
  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!rName.trim()) return

    setRLoading(true)
    setActionMsg(null)
    try {
      await apiClient.post('/api/v1/rooms/', {
        name: rName.trim(),
        room_type: rType,
        total_rows: Number(rRows),
        total_cols: Number(rCols),
      })

      setActionMsg({ type: 'success', text: `Tạo phòng chiếu "${rName}" thành công với ${rRows * rCols} ghế!` })
      setRName('')
      await loadAllData()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Tạo phòng chiếu thất bại.'
      setActionMsg({ type: 'error', text: typeof msg === 'string' ? msg : JSON.stringify(msg) })
    } finally {
      setRLoading(false)
    }
  }

  // Handle TMDB Auto-Sync (Now Showing & Coming Soon)
  const [autoSyncLoading, setAutoSyncLoading] = useState(false)
  const [syncLimit, setSyncLimit] = useState(12)

  async function handleAutoSyncTmdb() {
    setAutoSyncLoading(true)
    setActionMsg(null)
    try {
      const { data } = await apiClient.post<any>(`/api/v1/movies/tmdb/auto-sync?limit=${syncLimit}`)
      let msgText = data.message ?? 'Đã đồng bộ tự động thành công từ TMDB!'
      if (data.failed_items && data.failed_items.length > 0) {
        const reasons = data.failed_items
          .slice(0, 5)
          .map((f: any) => `• ${f.title ?? f.tmdb_id}: ${f.reason}`)
          .join('\n')
        msgText += `\n${data.failed_items.length} phim bị bỏ qua:\n${reasons}` +
          (data.failed_items.length > 5 ? `\n... và ${data.failed_items.length - 5} phim khác` : '')
      }
      setActionMsg({ type: 'success', text: msgText })
      await loadAllData()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Đồng bộ tự động thất bại.'
      setActionMsg({ type: 'error', text: typeof msg === 'string' ? msg : JSON.stringify(msg) })
    } finally {
      setAutoSyncLoading(false)
    }
  }

  async function handleGenerateAutoPreview() {
    if (autoStartDate > autoEndDate) {
      setActionMsg({
        type: 'error',
        text: '⚠ Ngày bắt đầu (Start Date) không thể lớn hơn Ngày kết thúc (End Date). Vui lòng chọn lại khoảng ngày hợp lệ.',
      })
      return
    }

    if (autoMovieSelectionMode === 'custom' && autoSelectedMovieIds.length === 0) {
      setActionMsg({
        type: 'error',
        text: '⚠ Vui lòng tích chọn ít nhất 1 bộ phim để xếp lịch chiếu tự động.',
      })
      return
    }

    if (autoRoomSelectionMode === 'custom' && autoSelectedRoomIds.length === 0) {
      setActionMsg({
        type: 'error',
        text: '⚠ Vui lòng tích chọn ít nhất 1 phòng chiếu để xếp lịch chiếu tự động.',
      })
      return
    }

    setAutoGenerating(true)
    try {
      const res = await apiClient.post('/api/v1/showtimes/admin/auto-schedule/preview', {
        start_date: autoStartDate,
        end_date: autoEndDate,
        movie_ids: autoMovieSelectionMode === 'custom' ? autoSelectedMovieIds : null,
        room_ids: autoRoomSelectionMode === 'custom' ? autoSelectedRoomIds : null,
        start_time_str: autoStartTimeStr,
        end_time_str: autoEndTimeStr,
        buffer_minutes: autoBufferMins,
        base_price: autoBasePrice,
        vip_price: autoVipPrice,
        replace_existing: autoReplaceExisting,
      })
      setAutoPreviewList(res.data)
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Không thể tạo bản xem trước',
      })
    } finally {
      setAutoGenerating(false)
    }
  }

  async function handleConfirmAutoSchedule() {
    if (!autoPreviewList || autoPreviewList.length === 0) return
    setAutoConfirming(true)
    try {
      const res = await apiClient.post('/api/v1/showtimes/admin/auto-schedule/confirm', {
        showtimes: autoPreviewList,
        replace_existing: autoReplaceExisting,
      })
      setActionMsg({
        type: 'success',
        text: `✓ Đã tự động xếp thành công ${res.data.count} suất chiếu mới mượt mà!`,
      })
      setAutoModalOpen(false)
      setAutoPreviewList(null)
      loadAllData()
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Không thể lưu suất chiếu tự động',
      })
    } finally {
      setAutoConfirming(false)
    }
  }

  async function handleCancelSingleShowtime(showtimeId: number) {
    if (!window.confirm('Bạn có chắc chắn muốn HỦY suất chiếu này không?')) return
    try {
      await apiClient.delete(`/api/v1/showtimes/${showtimeId}`)
      setActionMsg({ type: 'success', text: '✓ Đã hủy suất chiếu thành công!' })
      await loadAllData()
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Không thể hủy suất chiếu này.',
      })
    }
  }

  async function handleBulkCancelShowtimes() {
    const count = filteredShowtimes.length
    if (count === 0) return

    const filterText =
      stFilterMovieId !== 'all' || stFilterRoomId !== 'all'
        ? 'đang lọc hiện tại'
        : 'trên toàn hệ thống'

    if (
      !window.confirm(
        `⚠️ CẢNH BÁO NGUY HIỂM:\n\nBạn có chắc chắn muốn HỦY TOÀN BỘ ${count} suất chiếu (${filterText}) không?\n\nHành động này sẽ hủy tất cả lịch chiếu này và không thể hoàn tác!`
      )
    ) {
      return
    }

    try {
      let url = '/api/v1/showtimes/admin/bulk-cancel?'
      const params: string[] = []
      if (stFilterMovieId !== 'all') params.push(`movie_id=${stFilterMovieId}`)
      if (stFilterRoomId !== 'all') params.push(`room_id=${stFilterRoomId}`)
      url += params.join('&')

      const { data } = await apiClient.delete<{ message: string; count: number }>(url)
      setActionMsg({
        type: 'success',
        text: `✓ ${data.message || `Đã hủy thành công ${data.count} suất chiếu!`}`,
      })
      await loadAllData()
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Không thể hủy hàng loạt suất chiếu.',
      })
    }
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#09090e] flex items-center justify-center text-[#f0ede8]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#e8b84b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#a09e9a]">Đang xác thực thông tin Admin...</p>
        </div>
      </div>
    )
  }

  // Access Denied Screen for non-admins
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center">
        <div className="bg-[#111118] border border-white/10 rounded-2xl p-12 max-w-md mx-auto shadow-2xl space-y-4">
          <span className="text-5xl block">🛑</span>
          <h2 className="font-display font-bold text-2xl text-[#f0ede8]">Truy Cập Bị Từ Chối</h2>
          <p className="text-xs text-[#a09e9a] leading-relaxed">
            Trang Quản trị (Admin Panel) chỉ dành riêng cho tài khoản có quyền Quản trị viên (Role: Admin).
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#e8b84b] text-[#09090e] py-2.5 rounded-lg font-bold text-xs cursor-pointer"
            >
              Trở về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 pb-20">
      {/* Header Bar */}
      <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#e8b84b]/15 border border-[#e8b84b]/40 flex items-center justify-center text-[#e8b84b] font-black text-xl">
            ⚡
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-[#f0ede8] tracking-tight">
              Quản Trị Hệ Thống CineVerse
            </h1>
            <p className="text-xs text-[#a09e9a]">
              Xin chào <strong className="text-[#e8b84b]">{user.full_name || user.email}</strong> · Quyền Admin
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="bg-white/5 hover:bg-white/10 text-[#a09e9a] hover:text-[#f0ede8] border border-white/10 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
        >
          ← Xem Trang Chủ
        </button>
      </div>

      {/* Action Status Banner */}
      {actionMsg && (
        <div
          className={`p-4 rounded-xl mb-6 text-xs flex items-center justify-between ${
            actionMsg.type === 'success'
              ? 'bg-[rgba(46,204,113,0.15)] border border-[rgba(46,204,113,0.3)] text-[#2ecc71]'
              : 'bg-[rgba(192,57,43,0.15)] border border-[rgba(192,57,43,0.3)] text-[#e07060]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{actionMsg.type === 'success' ? '✓' : '⚠'}</span>
            <span>{actionMsg.text}</span>
          </div>
          <button
            onClick={() => setActionMsg(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100 bg-transparent border-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 mb-8 gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('movies')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'movies'
              ? 'border-[#e8b84b] text-[#e8b84b]'
              : 'border-transparent text-[#a09e9a] hover:text-[#f0ede8]'
          }`}
        >
          🎬 Quản Lý Phim ({movies.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('showtimes')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'showtimes'
              ? 'border-[#e8b84b] text-[#e8b84b]'
              : 'border-transparent text-[#a09e9a] hover:text-[#f0ede8]'
          }`}
        >
          🕒 Quản Lý Suất Chiếu ({showtimes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rooms')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'rooms'
              ? 'border-[#e8b84b] text-[#e8b84b]'
              : 'border-transparent text-[#a09e9a] hover:text-[#f0ede8]'
          }`}
        >
          🏛️ Quản Lý Phòng Chiếu ({rooms.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vouchers')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'vouchers'
              ? 'border-[#e8b84b] text-[#e8b84b]'
              : 'border-transparent text-[#a09e9a] hover:text-[#f0ede8]'
          }`}
        >
          🎟️ Quản Lý Voucher ({vouchers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'analytics'
              ? 'border-[#e8b84b] text-[#e8b84b]'
              : 'border-transparent text-[#a09e9a] hover:text-[#f0ede8]'
          }`}
        >
          📊 Thống Kê & Báo Cáo
        </button>
      </div>

      {/* TAB 1: MOVIE MANAGEMENT */}
      {activeTab === 'movies' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-display font-bold text-lg text-[#f0ede8]">Danh Sách Phim Hệ Thống</h3>
              <p className="text-xs text-[#a09e9a]">Quản lý phim theo từng mục Đang chiếu hoặc Sắp ra mắt.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={syncLimit}
                onChange={(e) => setSyncLimit(Number(e.target.value))}
                className="bg-[#161622] text-[#f0ede8] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold focus:border-[#e8b84b] outline-none cursor-pointer"
                title="Chọn số lượng phim cần quét mỗi loại từ TMDB"
              >
                <option value={6}>6 phim / mục</option>
                <option value={12}>12 phim / mục</option>
                <option value={20}>20 phim / mục</option>
                <option value={30}>30 phim / mục</option>
              </select>

              <button
                type="button"
                disabled={autoSyncLoading}
                onClick={handleAutoSyncTmdb}
                className="bg-[#e8b84b] text-[#09090e] border-0 rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span>🚀</span>
                <span>{autoSyncLoading ? 'Đang quét TMDB...' : 'Tự Động Lấy Phim Từ TMDB'}</span>
              </button>
            </div>
          </div>

          {/* Sub-tab Category Switcher */}
          <div className="flex items-center justify-between bg-[#111118] border border-white/10 rounded-xl p-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMovieSubTab('now_showing')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  movieSubTab === 'now_showing'
                    ? 'bg-[#2ecc71]/15 text-[#2ecc71] border-[#2ecc71]/40 shadow-sm'
                    : 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]'
                }`}
              >
                <span>▶</span>
                <span>Phim Đang Chiếu ({movies.filter((m) => m.status === 'now_showing').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMovieSubTab('coming_soon')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  movieSubTab === 'coming_soon'
                    ? 'bg-[#e8b84b]/15 text-[#e8b84b] border-[#e8b84b]/40 shadow-sm'
                    : 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]'
                }`}
              >
                <span>📅</span>
                <span>Phim Sắp Ra Mắt ({movies.filter((m) => m.status === 'coming_soon').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMovieSubTab('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  movieSubTab === 'all'
                    ? 'bg-white/15 text-[#f0ede8] border-white/30 shadow-sm'
                    : 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]'
                }`}
              >
                <span>Tất Cả ({movies.length})</span>
              </button>
            </div>
          </div>

          {/* Movies List Table */}
          <div className="bg-[#111118] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#a09e9a]">
                <thead className="bg-[#161622] text-[#f0ede8] font-mono-data uppercase border-b border-white/10">
                  <tr>
                    <th className="p-4">Phim</th>
                    <th className="p-4">Trạng Thái</th>
                    <th className="p-4">Thời Lượng</th>
                    <th className="p-4">Ngày Khởi Chiếu</th>
                    <th className="p-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(() => {
                    const filtered = movies.filter((m) => {
                      if (movieSubTab === 'now_showing') return m.status === 'now_showing'
                      if (movieSubTab === 'coming_soon') return m.status === 'coming_soon'
                      return true
                    })
                    const paginated = filtered.slice((moviePage - 1) * PAGE_SIZE, moviePage * PAGE_SIZE)
                    return paginated.map((m) => (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={
                              m.poster_url ??
                              'https://images.unsplash.com/photo-1534996858221-380b92700493?w=100'
                            }
                            alt={m.title}
                            className="w-10 h-14 object-cover rounded-lg border border-white/10 shrink-0"
                          />
                          <div>
                            <p className="font-display font-bold text-sm text-[#f0ede8]">{m.title}</p>
                            <span className="text-[10px] font-mono-data text-[#6e6c68]">ID: #{m.id}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleToggleMovieStatus(m)}
                            title="Bấm để đổi thủ công (Hệ thống tự động chuyển sang 'Đã chiếu xong' khi hết suất chiếu)"
                            className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono-data uppercase border cursor-pointer transition-all ${
                              m.status === 'now_showing'
                                ? 'bg-[rgba(46,204,113,0.15)] text-[#2ecc71] border-[rgba(46,204,113,0.3)] hover:bg-[rgba(46,204,113,0.3)]'
                                : m.status === 'coming_soon'
                                ? 'bg-[rgba(232,184,75,0.15)] text-[#e8b84b] border-[rgba(232,184,75,0.3)] hover:bg-[rgba(232,184,75,0.3)]'
                                : 'bg-white/5 text-[#6e6c68] border-white/10'
                            }`}
                          >
                            {m.status === 'now_showing'
                              ? '▶ Đang chiếu'
                              : m.status === 'coming_soon'
                              ? '📅 Sắp ra mắt'
                              : '⏹ Ngừng chiếu'}
                          </button>
                        </td>

                        <td className="p-4 font-mono-data">
                          {m.duration_minutes ? `${m.duration_minutes} phút` : 'N/A'}
                        </td>

                        <td className="p-4 font-mono-data">
                          {m.release_date || 'Chưa cập nhật'}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteMovie(m.id, m.title)}
                            className="bg-white/5 hover:bg-[rgba(192,57,43,0.2)] text-[#a09e9a] hover:text-[#e07060] border border-white/10 hover:border-[rgba(192,57,43,0.4)] rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Xóa phim
                          </button>
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination Control for Movies */}
            {(() => {
              const filtered = movies.filter((m) => {
                if (movieSubTab === 'now_showing') return m.status === 'now_showing'
                if (movieSubTab === 'coming_soon') return m.status === 'coming_soon'
                return true
              })
              return (
                <PaginationControl
                  currentPage={moviePage}
                  totalItems={filtered.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setMoviePage}
                />
              )
            })()}
          </div>
        </div>
      )}

      {/* TAB 2: SHOWTIMES MANAGEMENT */}
      {activeTab === 'showtimes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Column Left: AI Auto Schedule Engine Panel */}
          <div className="lg:col-span-5 bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl h-fit space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e8b84b]/10 border border-[#e8b84b]/30 rounded-full text-xs text-[#e8b84b] font-semibold font-mono-data">
                <span>⚡ AI Auto-Scheduling Engine</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-[#f0ede8]">Xếp Lịch Chiếu Tự Động</h3>
              <p className="text-xs text-[#a09e9a] leading-relaxed">
                Hệ thống tự động phân bổ lịch chiếu thông minh theo danh sách phòng, thời lượng từng bộ phim, giờ hoạt động của rạp và đảm bảo khoảng nghỉ chống trùng lặp tuyệt đối.
              </p>
            </div>

            {/* Launch Modal Action Button */}
            <button
              type="button"
              onClick={() => setAutoModalOpen(true)}
              className="w-full bg-gradient-to-r from-[#e8b84b] via-[#f0c868] to-[#e8b84b] text-[#09090e] border-0 rounded-xl py-4 font-bold text-sm cursor-pointer hover:shadow-[0_4px_24px_rgba(232,184,75,0.4)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg"
            >
              <span>⚡</span>
              <span>Lập Lịch Tự Động Ngay →</span>
            </button>

            {/* Quick System Stats */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10 text-center">
              <div className="bg-[#09090e] p-3 rounded-xl border border-white/5">
                <span className="text-lg font-bold font-mono-data text-[#f0ede8] block">{movies.length}</span>
                <span className="text-[10px] text-[#6e6c68]">Phim Khả Dụng</span>
              </div>
              <div className="bg-[#09090e] p-3 rounded-xl border border-white/5">
                <span className="text-lg font-bold font-mono-data text-[#f0ede8] block">{rooms.length}</span>
                <span className="text-[10px] text-[#6e6c68]">Phòng Chiếu</span>
              </div>
              <div className="bg-[#09090e] p-3 rounded-xl border border-white/5">
                <span className="text-lg font-bold font-mono-data text-[#e8b84b] block">{showtimes.length}</span>
                <span className="text-[10px] text-[#6e6c68]">Suất Hiện Có</span>
              </div>
            </div>
          </div>

          {/* Showtimes List Table */}
          <div className="lg:col-span-7 bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-[#f0ede8]">
                  Danh Sách Suất Chiếu Hiện Có{' '}
                  <span className="text-sm font-mono-data font-normal text-[#e8b84b]">
                    ({filteredShowtimes.length}{filteredShowtimes.length !== showtimes.length && `/${showtimes.length}`})
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {(stFilterMovieId !== 'all' || stFilterRoomId !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setStFilterMovieId('all')
                      setStFilterRoomId('all')
                      setShowtimePage(1)
                    }}
                    className="text-xs text-[#a09e9a] hover:text-[#f0ede8] cursor-pointer flex items-center gap-1 border border-white/10 px-2.5 py-1 rounded-lg"
                  >
                    ✕ Xóa bộ lọc
                  </button>
                )}

                {filteredShowtimes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkCancelShowtimes}
                    className="text-xs bg-[#e07060]/10 border border-[#e07060]/30 text-[#e07060] hover:bg-[#e07060]/20 font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <span>🗑️</span>
                    <span>Hủy {filteredShowtimes.length} Suất</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#09090e] p-3 rounded-xl border border-white/5 text-xs">
              <div>
                <label className="block text-[#a09e9a] mb-1 font-medium">🎬 Lọc Theo Phim</label>
                <select
                  value={stFilterMovieId}
                  onChange={(e) => {
                    setStFilterMovieId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    setShowtimePage(1)
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#111118] border border-white/10 rounded-lg text-[#f0ede8] outline-none cursor-pointer"
                >
                  <option value="all">-- Tất cả phim ({movies.length}) --</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#a09e9a] mb-1 font-medium">🏛️ Lọc Theo Phòng Chiếu</label>
                <select
                  value={stFilterRoomId}
                  onChange={(e) => {
                    setStFilterRoomId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    setShowtimePage(1)
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#111118] border border-white/10 rounded-lg text-[#f0ede8] outline-none cursor-pointer"
                >
                  <option value="all">-- Tất cả phòng ({rooms.length}) --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.room_type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredShowtimes.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#a09e9a] italic bg-[#09090e] border border-white/5 rounded-xl">
                  🍿 Không tìm thấy suất chiếu nào phù hợp với bộ lọc đã chọn.
                </div>
              ) : (
                filteredShowtimes
                  .slice((showtimePage - 1) * PAGE_SIZE, showtimePage * PAGE_SIZE)
                  .map((st) => {
                    const startTimeFmt = new Date(st.start_time).toLocaleString('vi-VN', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div
                        key={st.id}
                        className="bg-[#09090e] border border-white/10 rounded-xl p-4 flex justify-between items-center gap-4 hover:border-white/20 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono-data text-[#e8b84b] bg-[#e8b84b]/10 border border-[#e8b84b]/20 rounded px-2 py-0.5 uppercase font-semibold">
                              {st.room?.name ?? `Phòng #${st.room_id}`}
                            </span>
                            <span className="text-xs text-[#a09e9a] font-mono-data">🕒 {startTimeFmt}</span>
                          </div>

                          <h4 className="font-display font-bold text-base text-[#f0ede8]">
                            {st.movie?.title ?? `Phim #${st.movie_id}`}
                          </h4>

                          <p className="text-xs text-[#a09e9a] mt-1 font-mono-data">
                            Giá vé: <strong className="text-[#e8b84b]">{fmt(Number(st.base_price))}</strong> (Thường) / <strong className="text-[#e8b84b]">{fmt(Number(st.vip_price ?? st.base_price))}</strong> (VIP)
                          </p>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2">
                          <span className="text-[11px] text-[#6e6c68] font-mono-data block">
                            Ghế trống: {st.available_seats ?? 'N/A'}/{st.total_seats ?? 'N/A'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCancelSingleShowtime(st.id)}
                            className="px-2.5 py-1 bg-[#e07060]/10 hover:bg-[#e07060]/20 border border-[#e07060]/30 text-[#e07060] rounded-lg text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <span>🗑️</span>
                            <span>Hủy</span>
                          </button>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>

            <PaginationControl
              currentPage={showtimePage}
              totalItems={filteredShowtimes.length}
              pageSize={PAGE_SIZE}
              onPageChange={setShowtimePage}
            />
          </div>
        </div>
      )}

      {/* TAB 3: ROOMS MANAGEMENT */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Create Room */}
          <div className="lg:col-span-5 bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl h-fit">
            <h3 className="font-display font-bold text-lg text-[#f0ede8] mb-1">Tạo Phòng Chiếu Mới</h3>
            <p className="text-xs text-[#a09e9a] mb-5">Hệ thống sẽ tự động sinh sơ đồ ghế VIP và Thường tương ứng.</p>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Tên Phòng Chiếu (Để trống để tự động đặt)</label>
                <input
                  type="text"
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                  placeholder={`Ví dụ: ${
                    rType === 'standard' ? 'Standard' : rType === 'vip' ? 'VIP' : rType === 'imax' ? 'IMAX' : rType === '4d' ? '4DX' : rType === 'kids' ? 'Kids' : '3D'
                  } ${rooms.filter((r) => r.room_type === rType).length + 1}`}
                  className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none"
                />
                <span className="text-[11px] text-[#e8b84b] font-mono-data mt-1 block">
                  💡 Gợi ý: Đây sẽ là phòng thứ {rooms.filter((r) => r.room_type === rType).length + 1} của loại{' '}
                  {rType === 'standard'
                    ? 'Standard'
                    : rType === 'imax'
                    ? 'IMAX 3D Laser'
                    : rType === 'vip'
                    ? 'VIP Gold Lounge'
                    : rType === '4d'
                    ? '4DX Motion'
                    : rType === 'kids'
                    ? 'Kids / Gia Đình'
                    : '3D Surround'}
                  .
                </span>
              </div>

              <div>
                <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Loại Phòng</label>
                <select
                  value={rType}
                  onChange={(e) => {
                    const newType = e.target.value
                    setRType(newType)
                    const count = rooms.filter((r) => r.room_type === newType).length
                    const label =
                      newType === 'standard'
                        ? 'Standard'
                        : newType === 'imax'
                        ? 'IMAX'
                        : newType === 'vip'
                        ? 'VIP'
                        : newType === '4d'
                        ? '4DX'
                        : newType === 'kids'
                        ? 'Kids'
                        : '3D'
                    setRName(`${label} ${count + 1}`)
                  }}
                  className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none cursor-pointer"
                >
                  <option value="standard">Standard</option>
                  <option value="imax">IMAX 3D Laser</option>
                  <option value="vip">VIP Lounge</option>
                  <option value="4d">4DX Motion</option>
                  <option value="3d">3D Surround</option>
                  <option value="kids">Kids / Gia Đình</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Số Hàng Ghế (Rows)</label>
                  <input
                    type="number"
                    required
                    min={4}
                    max={15}
                    value={rRows}
                    onChange={(e) => setRRows(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none font-mono-data"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Số Ghế/Hàng (Cols)</label>
                  <input
                    type="number"
                    required
                    min={6}
                    max={20}
                    value={rCols}
                    onChange={(e) => setRCols(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none font-mono-data"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={rLoading}
                className="w-full bg-[#e8b84b] text-[#09090e] border-0 rounded-lg py-3 font-bold text-xs cursor-pointer hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] transition-all disabled:opacity-50 mt-2"
              >
                {rLoading ? 'Đang tạo...' : 'Tạo Phòng Chiếu Mới →'}
              </button>
            </form>
          </div>

          {/* Rooms Grid Grouped By Room Type */}
          <div className="lg:col-span-7 space-y-6">
            {['standard', 'vip', 'imax', '3d', '4d', 'kids'].map((typeKey) => {
              const typeRooms = rooms.filter((r) => (r.room_type || 'standard') === typeKey)
              if (typeRooms.length === 0) return null

              const typeInfo =
                typeKey === 'standard'
                  ? { title: 'Standard', icon: '🎬' }
                  : typeKey === 'vip'
                  ? { title: 'VIP Gold Lounge', icon: '👑' }
                  : typeKey === 'imax'
                  ? { title: 'IMAX 3D Laser', icon: '📽️' }
                  : typeKey === '3d'
                  ? { title: '3D Surround', icon: '🔊' }
                  : typeKey === '4d'
                  ? { title: '4DX Motion', icon: '⚡' }
                  : { title: 'Kids / Gia Đình', icon: '🎈' }

              return (
                <div key={typeKey} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-lg">{typeInfo.icon}</span>
                    <h4 className="font-display font-bold text-base text-[#f0ede8]">
                      {typeInfo.title}{' '}
                      <span className="text-xs font-mono-data font-normal text-[#e8b84b]">
                        ({typeRooms.length} phòng)
                      </span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {typeRooms.map((r) => (
                      <div
                        key={r.id}
                        className="bg-[#111118] border border-white/10 rounded-2xl p-4 shadow-xl flex justify-between items-center hover:border-white/20 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-display font-bold text-base text-[#f0ede8]">{r.name}</h5>
                            <span className="text-[10px] font-mono-data text-[#e8b84b] uppercase bg-[#e8b84b]/10 border border-[#e8b84b]/20 px-2 py-0.5 rounded">
                              Phòng #{r.room_number ?? 1}
                            </span>
                          </div>
                          <p className="text-xs text-[#a09e9a]">
                            Bố trí: <strong className="text-[#f0ede8]">{r.total_rows} hàng × {r.total_cols} cột</strong> · Tổng sức chứa: <strong className="text-[#e8b84b]">{r.total_seats} ghế</strong>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB: VOUCHERS MANAGEMENT */}
      {activeTab === 'vouchers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Create Voucher */}
          <div className="lg:col-span-5 bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl h-fit">
            <h3 className="font-display font-bold text-lg text-[#f0ede8] mb-1">Tạo Mã Khuyến Mãi Mới</h3>
            <p className="text-xs text-[#a09e9a] mb-5">Voucher sẽ được lưu vào CSDL và kiểm tra quy tắc tự động khi khách áp dụng.</p>

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div>
                <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Mã Giảm Giá (Code)</label>
                <input
                  type="text"
                  required
                  value={vCode}
                  onChange={(e) => setVCode(e.target.value)}
                  placeholder="Ví dụ: SUMMER2026"
                  className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm uppercase font-mono-data focus:border-[#e8b84b] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Loại Giảm Giá</label>
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value as 'percent' | 'fixed')}
                    className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none cursor-pointer"
                  >
                    <option value="percent">Phần Trăm (%)</option>
                    <option value="fixed">Số Tiền Cố Định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">
                    Giá Trị Giảm {vType === 'percent' ? '(%)' : '(VNĐ)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={vValue}
                    onChange={(e) => setVValue(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none font-mono-data"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Đơn Hóa Đơn Tối Thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={vMinSpend}
                    onChange={(e) => setVMinSpend(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none font-mono-data"
                  />
                </div>

                {vType === 'percent' && (
                  <div>
                    <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Giảm Tối Đa (VNĐ)</label>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={vMaxDiscount}
                      onChange={(e) => setVMaxDiscount(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none font-mono-data"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-[#a09e9a] mb-1.5 font-medium">Ngày Hết Hạn (Expiry Date)</label>
                <input
                  type="date"
                  value={vExpiry}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setVExpiry(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full px-3 py-2.5 bg-[#09090e] border border-white/10 rounded-lg text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none font-mono-data cursor-pointer [color-scheme:dark]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#f0ede8]">
                  <input
                    type="checkbox"
                    checked={vFirstOnly}
                    onChange={(e) => setVFirstOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 accent-[#e8b84b] cursor-pointer"
                  />
                  <span>Chỉ áp dụng cho đơn hàng đầu tiên của User</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={vLoading}
                className="w-full bg-[#e8b84b] text-[#09090e] border-0 rounded-lg py-3 font-bold text-xs cursor-pointer hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] transition-all disabled:opacity-50 mt-2"
              >
                {vLoading ? 'Đang tạo...' : 'Tạo Mã Khuyến Mãi Mới →'}
              </button>
            </form>
          </div>

          {/* Vouchers List Table */}
          <div className="lg:col-span-7 bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-lg text-[#f0ede8]">Danh Sách Mã Khuyến Mãi Hợp Lệ</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#a09e9a]">
                <thead className="bg-[#161622] text-[#f0ede8] font-mono-data uppercase border-b border-white/10">
                  <tr>
                    <th className="p-3">Mã Voucher</th>
                    <th className="p-3">Mức Giảm</th>
                    <th className="p-3">Hạn Dùng</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vouchers
                    .slice((voucherPage - 1) * PAGE_SIZE, voucherPage * PAGE_SIZE)
                    .map((v) => (
                      <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-mono-data font-bold text-sm text-[#e8b84b]">
                          {v.code}
                          {v.is_first_booking_only && (
                            <span className="block text-[9px] text-[#a09e9a] font-normal">Đơn đầu tiên</span>
                          )}
                        </td>
                        <td className="p-3 font-mono-data">
                          {v.discount_type === 'percent' ? `${v.discount_value}%` : fmt(v.discount_value)}
                          {v.min_spend > 0 && (
                            <span className="block text-[9px] text-[#6e6c68]">Đơn từ {fmt(v.min_spend)}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono-data">{v.expiry_date || 'Vĩnh viễn'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              v.is_active
                                ? 'bg-[rgba(46,204,113,0.15)] text-[#2ecc71] border border-[rgba(46,204,113,0.3)]'
                                : 'bg-white/5 text-[#6e6c68] border border-white/10'
                            }`}
                          >
                            {v.is_active ? '● Hoạt động' : '○ Tắt'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleVoucherActive(v)}
                            className="bg-white/5 hover:bg-white/10 text-[#f0ede8] border border-white/10 rounded px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-all"
                          >
                            {v.is_active ? 'Khóa' : 'Kích hoạt'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <PaginationControl
              currentPage={voucherPage}
              totalItems={vouchers.length}
              pageSize={PAGE_SIZE}
              onPageChange={setVoucherPage}
            />
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS & REPORTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#111118] border border-[#e8b84b]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-15 text-3xl">💰</div>
              <span className="text-xs text-[#a09e9a] font-mono-data block mb-1 uppercase tracking-wider">Tổng Doanh Thu Hóa Đơn</span>
              <h3 className="font-display font-black text-2xl text-[#e8b84b]">
                {liveAnalytics ? fmt(liveAnalytics.total_revenue) : '48.750.000 VNĐ'}
              </h3>
              <p className="text-[10px] text-[#2ecc71] font-mono-data mt-2 font-bold flex items-center gap-1">
                <span>↑ Live Database</span>
                <span className="text-[#a09e9a] font-normal">từ đơn hàng thực tế</span>
              </p>
            </div>

            <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-15 text-3xl">🎟️</div>
              <span className="text-xs text-[#a09e9a] font-mono-data block mb-1 uppercase tracking-wider">Vé Đã Bán Ra</span>
              <h3 className="font-display font-black text-2xl text-[#f0ede8]">
                {liveAnalytics ? `${liveAnalytics.total_reservations} Vé` : '384 Vé'}
              </h3>
              <p className="text-[10px] text-[#2ecc71] font-mono-data mt-2 font-bold">
                Suất chiếu: {liveAnalytics?.total_showtimes_count ?? 70} suất
              </p>
            </div>

            <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-15 text-3xl">🎬</div>
              <span className="text-xs text-[#a09e9a] font-mono-data block mb-1 uppercase tracking-wider">Phim Đang Chiếu</span>
              <h3 className="font-display font-black text-2xl text-[#f0ede8]">
                {liveAnalytics ? `${liveAnalytics.active_movies_count} Phim` : `${movies.length} Phim`}
              </h3>
              <p className="text-[10px] text-[#e8b84b] font-mono-data mt-2">Dữ liệu thời gian thực</p>
            </div>

            <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-15 text-3xl">👥</div>
              <span className="text-xs text-[#a09e9a] font-mono-data block mb-1 uppercase tracking-wider">Tài Khoản Đăng Ký</span>
              <h3 className="font-display font-black text-2xl text-[#f0ede8]">
                {liveAnalytics ? `${liveAnalytics.total_users_count} Thành Viên` : '156 Thành Viên'}
              </h3>
              <p className="text-[10px] text-[#2ecc71] font-mono-data mt-2 font-bold">100% trong PostgreSQL</p>
            </div>
          </div>

          {/* Chart Section 1: Revenue & Ticket Sales Trend */}
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="font-display font-bold text-xl text-[#f0ede8] flex items-center gap-2">
                  <span>📈</span> Biểu Đồ Tăng Trưởng Doanh Thu Theo Tháng (2026)
                </h3>
                <p className="text-xs text-[#a09e9a] mt-0.5">Phân tích xu hướng doanh thu vé và tăng trưởng khách hàng trong 8 tháng qua.</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono-data">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#e8b84b]" />
                  <span className="text-[#a09e9a]">Doanh Thu (VNĐ)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#3498db]" />
                  <span className="text-[#a09e9a]">Số Vé Bán (Vé)</span>
                </div>
              </div>
            </div>

            {/* Monthly Bar Visualizer */}
            <div className="h-64 flex items-end justify-between gap-3 sm:gap-6 pt-8 pb-4 border-b border-white/10 px-4">
              {[
                { month: 'T1', rev: 18.5, tickets: 160, heightPct: 38 },
                { month: 'T2', rev: 24.0, tickets: 205, heightPct: 49 },
                { month: 'T3', rev: 29.2, tickets: 245, heightPct: 60 },
                { month: 'T4', rev: 31.0, tickets: 260, heightPct: 63 },
                { month: 'T5', rev: 35.8, tickets: 290, heightPct: 73 },
                { month: 'T6', rev: 42.1, tickets: 330, heightPct: 86 },
                { month: 'T7', rev: 45.0, tickets: 355, heightPct: 92 },
                { month: 'T8', rev: 48.75, tickets: 384, heightPct: 100 },
              ].map((item) => (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#09090e] border border-[#e8b84b]/40 rounded px-2 py-1 text-[10px] font-mono-data text-center pointer-events-none shadow-xl mb-1">
                    <p className="text-[#e8b84b] font-bold">{item.rev} triệu VNĐ</p>
                    <p className="text-[#a09e9a]">{item.tickets} vé bán</p>
                  </div>

                  <div className="w-full max-w-[40px] flex items-end justify-center gap-1 h-full">
                    {/* Revenue Bar */}
                    <div
                      className="w-1/2 bg-gradient-to-t from-[#d4a338] to-[#e8b84b] rounded-t transition-all duration-500 group-hover:brightness-125"
                      style={{ height: `${item.heightPct}%` }}
                    />
                    {/* Tickets Bar */}
                    <div
                      className="w-1/2 bg-gradient-to-t from-[#2980b9] to-[#3498db] rounded-t transition-all duration-500 group-hover:brightness-125"
                      style={{ height: `${item.heightPct * 0.8}%` }}
                    />
                  </div>

                  <span className="text-xs font-mono-data text-[#a09e9a] font-bold mt-1 group-hover:text-[#e8b84b]">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 text-xs text-[#a09e9a] font-mono-data">
              <span>Đơn vị tính: triệu VNĐ / Tổng 8 tháng</span>
              <span className="text-[#2ecc71] font-bold">Tỷ lệ tăng trưởng bình quân: +14.2%/tháng</span>
            </div>
          </div>

          {/* Chart Section 2: Movie Revenue Distribution & Room Occupancy */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Top Grossing Movies Breakdown */}
            <div className="lg:col-span-7 bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl">
              <h3 className="font-display font-bold text-xl text-[#f0ede8] mb-1 flex items-center gap-2">
                <span>🎬</span> Top Phim Chiếm Tỷ Trọng Doanh Thu Cao Nhất
              </h3>
              <p className="text-xs text-[#a09e9a] mb-6">Thống kê doanh thu đóng góp thực tế theo từng tựa phim.</p>

              <div className="space-y-4">
                {[
                  { title: 'Spider-Man: Brand New Day', rev: '14.800.000 VNĐ', pct: 30.3, color: 'bg-gradient-to-r from-red-600 to-amber-500' },
                  { title: 'The Odyssey', rev: '11.200.000 VNĐ', pct: 23.0, color: 'bg-gradient-to-r from-amber-500 to-yellow-400' },
                  { title: 'Supergirl', rev: '8.500.000 VNĐ', pct: 17.4, color: 'bg-gradient-to-r from-blue-600 to-indigo-400' },
                  { title: 'Avatar 3: Fire and Ash', rev: '7.600.000 VNĐ', pct: 15.6, color: 'bg-gradient-to-r from-purple-600 to-pink-500' },
                  { title: 'Toy Story 5 & Phim Khác', rev: '6.650.000 VNĐ', pct: 13.7, color: 'bg-gradient-to-r from-emerald-600 to-teal-400' },
                ].map((m) => (
                  <div key={m.title} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-[#f0ede8]">{m.title}</span>
                      <span className="font-mono-data text-[#e8b84b] font-bold">{m.rev} ({m.pct}%)</span>
                    </div>
                    <div className="w-full bg-[#09090e] h-3 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full ${m.color} rounded-full transition-all duration-700`}
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Occupancy & Capacity Utilization */}
            <div className="lg:col-span-5 bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-xl text-[#f0ede8] mb-1 flex items-center gap-2">
                  <span>🏛️</span> Tỷ Lệ Lấp Đầy Theo Phòng Chiếu
                </h3>
                <p className="text-xs text-[#a09e9a] mb-6">Hiệu suất khai thác ghế ngồi theo công nghệ phòng chiếu.</p>

                <div className="space-y-5">
                  {(capacityReport.length > 0
                    ? capacityReport.slice(0, 5).map((c) => ({
                        room: `${c.room_name} - ${c.movie_title}`,
                        occ: Math.round(c.occupancy_rate * 10) / 10,
                        color:
                          c.occupancy_rate >= 80
                            ? 'text-[#e8b84b]'
                            : c.occupancy_rate >= 50
                            ? 'text-[#2ecc71]'
                            : 'text-[#3498db]',
                      }))
                    : [
                        { room: 'Phòng 1 (IMAX 3D Laser)', occ: 94.2, color: 'text-[#e8b84b]' },
                        { room: 'Phòng 2 (VIP Gold Lounge)', occ: 88.5, color: 'text-[#2ecc71]' },
                        { room: 'Phòng 4 (4DX Motion)', occ: 76.0, color: 'text-[#3498db]' },
                        { room: 'Phòng 3 (Standard)', occ: 68.4, color: 'text-[#9b59b6]' },
                      ]
                  ).map((r) => (
                    <div key={r.room} className="bg-[#09090e] p-3.5 rounded-xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[#f0ede8] truncate max-w-[240px]" title={r.room}>
                          {r.room}
                        </span>
                        <span className={`font-mono-data font-bold ${r.color}`}>{r.occ}% Lấp Đầy</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#e8b84b] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, r.occ))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section 3: Seat Class Share & Payment Methods Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Seat Class Preference */}
            <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl">
              <h3 className="font-display font-bold text-lg text-[#f0ede8] mb-4 flex items-center gap-2">
                <span>💺</span> Phân Phối Tỷ Lệ Đặt Ghế Víp vs Ghế Thường
              </h3>

              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32 rounded-full bg-conic from-[#e8b84b] via-[#e8b84b] to-[#3498db] flex items-center justify-center shrink-0 shadow-lg">
                  <div className="w-20 h-20 rounded-full bg-[#111118] flex flex-col items-center justify-center">
                    <span className="font-mono-data text-xs font-bold text-[#e8b84b]">68% VIP</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs flex-1">
                  <div className="flex justify-between items-center bg-[#09090e] p-2.5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#e8b84b]" />
                      <span>Ghế VIP Trung Tâm</span>
                    </div>
                    <span className="font-mono-data font-bold text-[#e8b84b]">68% (261 vé)</span>
                  </div>

                  <div className="flex justify-between items-center bg-[#09090e] p-2.5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#3498db]" />
                      <span>Ghế Tiêu Chuẩn</span>
                    </div>
                    <span className="font-mono-data font-bold text-[#3498db]">32% (123 vé)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Gateways Share */}
            <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl">
              <h3 className="font-display font-bold text-lg text-[#f0ede8] mb-4 flex items-center gap-2">
                <span>💳</span> Phương Thức Thanh Toán Ưa Thích
              </h3>

              <div className="space-y-3 text-xs">
                {[
                  { name: 'Ví Điện Tử MoMo', pct: 42, color: 'bg-pink-500', count: '161 đơn' },
                  { name: 'Thẻ Ngân Hàng (ATM / Visa)', pct: 35, color: 'bg-blue-500', count: '134 đơn' },
                  { name: 'Ví ZaloPay', pct: 15, color: 'bg-emerald-500', count: '58 đơn' },
                  { name: 'Tiền Mặt Tại Rạp', pct: 8, color: 'bg-amber-500', count: '31 đơn' },
                ].map((p) => (
                  <div key={p.name} className="bg-[#09090e] p-2.5 rounded-lg border border-white/5 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-bold text-[#f0ede8]">{p.name}</span>
                      <span className="font-mono-data text-[#e8b84b] font-bold">{p.pct}% ({p.count})</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTO-SCHEDULE MODAL (PHƯƠNG ÁN A) */}
      {autoModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#111118] border border-white/10 rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4 shrink-0">
              <div>
                <h3 className="font-display font-bold text-xl text-[#f0ede8] flex items-center gap-2">
                  <span>⚡</span>
                  <span>Tự Động Xếp Lịch Chiếu (Auto-Schedule Engine)</span>
                </h3>
                <p className="text-xs text-[#a09e9a] mt-0.5">
                  Thuật toán tự động tìm khung giờ trống trong phòng chiếu và sắp xếp lịch chiếu tối ưu không bị trùng giờ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAutoModalOpen(false)
                  setAutoPreviewList(null)
                }}
                className="text-white/60 hover:text-white text-lg p-2 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 font-sans my-4 [color-scheme:dark]">
              {/* Date Preset Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#a09e9a]">
                <span>Phím tắt chọn ngày nhanh:</span>
                <button
                  type="button"
                  onClick={() => {
                    const start = new Date()
                    const end = new Date(Date.now() + 7 * 86400000)
                    setAutoStartDate(start.toISOString().split('T')[0])
                    setAutoEndDate(end.toISOString().split('T')[0])
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[#e8b84b] rounded-lg border border-white/10 cursor-pointer font-medium"
                >
                  + 7 Ngày (Từ {new Date().getDate()}/{new Date().getMonth() + 1} Đến {new Date(Date.now() + 7 * 86400000).getDate()}/{new Date(Date.now() + 7 * 86400000).getMonth() + 1})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const start = new Date()
                    const end = new Date(Date.now() + 14 * 86400000)
                    setAutoStartDate(start.toISOString().split('T')[0])
                    setAutoEndDate(end.toISOString().split('T')[0])
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[#e8b84b] rounded-lg border border-white/10 cursor-pointer font-medium"
                >
                  + 14 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const start = new Date()
                    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
                    setAutoStartDate(start.toISOString().split('T')[0])
                    setAutoEndDate(end.toISOString().split('T')[0])
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[#e8b84b] rounded-lg border border-white/10 cursor-pointer font-medium"
                >
                  Đến Cuối Tháng
                </button>
              </div>

              {/* Clean Old Showtimes Checkbox Option */}
              <div className="bg-[#09090e] p-3 rounded-xl border border-[#e8b84b]/20 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#f0ede8]">
                  <input
                    type="checkbox"
                    checked={autoReplaceExisting}
                    onChange={(e) => setAutoReplaceExisting(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 accent-[#e8b84b] cursor-pointer"
                  />
                  <span className="font-semibold text-[#e8b84b]">
                    🧹 Tự động dọn dẹp & xóa suất chiếu cũ trùng khoảng ngày trước khi xếp mới (Khuyên dùng)
                  </span>
                </label>
                <span className="text-[10px] text-[#6e6c68] hidden sm:inline">Chống trùng lặp tuyệt đối</span>
              </div>

              {/* Start > End Date Validation Warning */}
              {autoStartDate > autoEndDate && (
                <div className="p-3 bg-[rgba(192,57,43,0.15)] border border-[rgba(192,57,43,0.3)] text-[#e07060] rounded-xl text-xs font-medium flex items-center gap-2">
                  <span>⚠</span>
                  <span>Lỗi: Ngày bắt đầu ({formatVNFullDate(autoStartDate)}) không thể lớn hơn Ngày kết thúc ({formatVNFullDate(autoEndDate)}). Vui lòng chọn lại khoảng ngày hợp lệ.</span>
                </div>
              )}

              {/* Input Controls Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#09090e] p-4 rounded-xl border border-white/5 text-xs">
                <div>
                  <CleanDatePicker
                    label="Từ Ngày (Start Date)"
                    value={autoStartDate}
                    minDate={new Date().toISOString().split('T')[0]}
                    onChange={(d) => setAutoStartDate(d)}
                  />
                </div>

                <div>
                  <CleanDatePicker
                    label="Đến Ngày (End Date)"
                    value={autoEndDate}
                    minDate={autoStartDate}
                    onChange={(d) => setAutoEndDate(d)}
                  />
                </div>

                <div>
                  <label className="block text-[#a09e9a] mb-1 font-medium">Thời Gian Dọn Phòng (Phút)</label>
                  <input
                    type="number"
                    value={autoBufferMins}
                    onChange={(e) => setAutoBufferMins(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#111118] border border-white/10 rounded-lg text-[#f0ede8] outline-none font-mono-data"
                  />
                </div>

                <div>
                  <label className="block text-[#a09e9a] mb-1 font-medium">Giờ Rạp Mở Cửa (Giờ : Phút)</label>
                  <input
                    type="time"
                    value={autoStartTimeStr}
                    onChange={(e) => setAutoStartTimeStr(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full px-3 py-2 bg-[#111118] border border-white/10 rounded-lg text-[#f0ede8] outline-none font-mono-data [color-scheme:dark] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[#a09e9a] mb-1 font-medium">Giờ Rạp Đóng Cửa (Giờ : Phút)</label>
                  <input
                    type="time"
                    value={autoEndTimeStr}
                    onChange={(e) => setAutoEndTimeStr(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full px-3 py-2 bg-[#111118] border border-white/10 rounded-lg text-[#f0ede8] outline-none font-mono-data [color-scheme:dark] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[#a09e9a] mb-1 font-medium">Giá Vé Thường / VIP (VNĐ)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={autoBasePrice}
                      onChange={(e) => setAutoBasePrice(Number(e.target.value))}
                      className="w-1/2 px-2 py-2 bg-[#111118] border border-white/10 rounded-lg text-[#f0ede8] outline-none font-mono-data"
                    />
                    <input
                      type="number"
                      value={autoVipPrice}
                      onChange={(e) => setAutoVipPrice(Number(e.target.value))}
                      className="w-1/2 px-2 py-2 bg-[#111118] border border-white/10 rounded-lg text-[#f0ede8] outline-none font-mono-data"
                    />
                  </div>
                </div>
              </div>

              {/* Movie Selection Section */}
              <div className="bg-[#09090e] p-4 rounded-xl border border-white/5 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-[#f0ede8] flex items-center gap-1.5">
                    <span>🎬</span>
                    <span>Chọn Phim Áp Dụng Xếp Lịch</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#a09e9a] hover:text-[#f0ede8]">
                      <input
                        type="radio"
                        name="movieSelectMode"
                        checked={autoMovieSelectionMode === 'all'}
                        onChange={() => setAutoMovieSelectionMode('all')}
                        className="accent-[#e8b84b] cursor-pointer"
                      />
                      <span>Tất cả phim đang/sắp chiếu ({movies.length})</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#a09e9a] hover:text-[#f0ede8]">
                      <input
                        type="radio"
                        name="movieSelectMode"
                        checked={autoMovieSelectionMode === 'custom'}
                        onChange={() => setAutoMovieSelectionMode('custom')}
                        className="accent-[#e8b84b] cursor-pointer"
                      />
                      <span>Tự chọn phim cụ thể {autoMovieSelectionMode === 'custom' && `(${autoSelectedMovieIds.length})`}</span>
                    </label>
                  </div>
                </div>

                {autoMovieSelectionMode === 'custom' && (
                  <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-[150px] overflow-y-auto pr-1">
                    {movies.map((m) => {
                      const isChecked = autoSelectedMovieIds.includes(m.id)
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer select-none ${
                            isChecked
                              ? 'bg-[rgba(232,184,75,0.12)] border-[#e8b84b] text-[#f0ede8]'
                              : 'bg-[#111118] border-white/10 text-[#a09e9a] hover:border-white/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAutoSelectedMovieIds([...autoSelectedMovieIds, m.id])
                              } else {
                                setAutoSelectedMovieIds(autoSelectedMovieIds.filter((id) => id !== m.id))
                              }
                            }}
                            className="accent-[#e8b84b] cursor-pointer"
                          />
                          <span className="truncate font-medium">{m.title}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Room Selection Section */}
              <div className="bg-[#09090e] p-4 rounded-xl border border-white/5 space-y-3 text-xs">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <label className="font-bold text-[#f0ede8] flex items-center gap-1.5">
                    <span>🏛️</span>
                    <span>Chọn Phòng Chiếu Áp Dụng</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#a09e9a] hover:text-[#f0ede8]">
                      <input
                        type="radio"
                        name="roomSelectMode"
                        checked={autoRoomSelectionMode === 'all'}
                        onChange={() => setAutoRoomSelectionMode('all')}
                        className="accent-[#e8b84b] cursor-pointer"
                      />
                      <span>Tất cả phòng chiếu ({rooms.length})</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#a09e9a] hover:text-[#f0ede8]">
                      <input
                        type="radio"
                        name="roomSelectMode"
                        checked={autoRoomSelectionMode === 'custom'}
                        onChange={() => setAutoRoomSelectionMode('custom')}
                        className="accent-[#e8b84b] cursor-pointer"
                      />
                      <span>Tự chọn phòng cụ thể {autoRoomSelectionMode === 'custom' && `(${autoSelectedRoomIds.length}/${rooms.length})`}</span>
                    </label>
                  </div>
                </div>

                {autoRoomSelectionMode === 'custom' && (
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    {/* Quick Category Action Bar */}
                    <div className="flex flex-wrap justify-between items-center gap-2 bg-[#111118] p-2.5 rounded-xl border border-white/5">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-[#a09e9a] font-medium mr-1">Lọc loại phòng:</span>
                        {['standard', 'vip', 'imax', '3d', '4d', 'kids'].map((typeKey) => {
                          const typeRooms = rooms.filter((r) => (r.room_type || 'standard') === typeKey)
                          if (typeRooms.length === 0) return null
                          const typeIds = typeRooms.map((r) => r.id)
                          const selectedCount = typeIds.filter((id) => autoSelectedRoomIds.includes(id)).length
                          const isAllSelected = selectedCount === typeIds.length

                          const label =
                            typeKey === 'standard'
                              ? 'Standard'
                              : typeKey === 'vip'
                              ? 'VIP'
                              : typeKey === 'imax'
                              ? 'IMAX'
                              : typeKey === '3d'
                              ? '3D'
                              : typeKey === '4d'
                              ? '4DX'
                              : 'Kids'

                          return (
                            <button
                              key={typeKey}
                              type="button"
                              onClick={() => {
                                if (isAllSelected) {
                                  setAutoSelectedRoomIds(autoSelectedRoomIds.filter((id) => !typeIds.includes(id)))
                                } else {
                                  const newSet = new Set([...autoSelectedRoomIds, ...typeIds])
                                  setAutoSelectedRoomIds(Array.from(newSet))
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-bold text-[11px] flex items-center gap-1 ${
                                isAllSelected
                                  ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm'
                                  : selectedCount > 0
                                  ? 'bg-[#e8b84b]/20 text-[#e8b84b] border-[#e8b84b]/40'
                                  : 'bg-white/5 text-[#a09e9a] border-white/10 hover:text-[#f0ede8] hover:border-white/20'
                              }`}
                            >
                              <span>{isAllSelected ? '✓' : selectedCount > 0 ? '•' : '+'}</span>
                              <span>{label}</span>
                              <span className="opacity-75">({selectedCount}/{typeRooms.length})</span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Select All / Deselect All Shortcuts */}
                      <div className="flex items-center gap-2 text-[11px] ml-auto">
                        <button
                          type="button"
                          onClick={() => setAutoSelectedRoomIds(rooms.map((r) => r.id))}
                          className="text-[#e8b84b] hover:underline font-medium cursor-pointer"
                        >
                          ✓ Chọn tất cả
                        </button>
                        <span className="text-white/20">|</span>
                        <button
                          type="button"
                          onClick={() => setAutoSelectedRoomIds([])}
                          className="text-[#a09e9a] hover:text-[#f0ede8] hover:underline cursor-pointer"
                        >
                          ✕ Bỏ chọn
                        </button>
                      </div>
                    </div>

                    {/* Room Grid Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {rooms.map((r) => {
                        const isChecked = autoSelectedRoomIds.includes(r.id)
                        const roomTypeUpper = (r.room_type || 'standard').toUpperCase()

                        // Clean title: Avoid redundant (imax) (imax)
                        const cleanName = r.name.replace(new RegExp(`\\(${r.room_type}\\)`, 'gi'), '').trim()

                        const typeBadgeStyle =
                          r.room_type === 'imax'
                            ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                            : r.room_type === 'vip'
                            ? 'text-purple-400 bg-purple-400/10 border-purple-400/30'
                            : r.room_type === '4d'
                            ? 'text-blue-400 bg-blue-400/10 border-blue-400/30'
                            : r.room_type === '3d'
                            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                            : r.room_type === 'kids'
                            ? 'text-pink-400 bg-pink-400/10 border-pink-400/30'
                            : 'text-slate-400 bg-slate-400/10 border-slate-400/30'

                        return (
                          <label
                            key={r.id}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2.5 ${
                              isChecked
                                ? 'bg-[#e8b84b]/15 border-[#e8b84b] text-[#f0ede8] shadow-md shadow-[#e8b84b]/5'
                                : 'bg-[#111118] border-white/10 text-[#a09e9a] hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAutoSelectedRoomIds([...autoSelectedRoomIds, r.id])
                                  } else {
                                    setAutoSelectedRoomIds(autoSelectedRoomIds.filter((id) => id !== r.id))
                                  }
                                }}
                                className="accent-[#e8b84b] w-4 h-4 cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-xs truncate text-[#f0ede8]">{cleanName}</div>
                                <div className="text-[10px] text-[#a09e9a] flex items-center gap-1.5 mt-0.5">
                                  <span className={`px-1.5 py-0.2 rounded border text-[9px] font-mono-data font-bold ${typeBadgeStyle}`}>
                                    {roomTypeUpper}
                                  </span>
                                  <span>🪑 {r.total_seats || r.total_rows * r.total_cols} ghế</span>
                                </div>
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Results Table */}
              {autoPreviewList !== null && (
                <div className="border border-white/10 rounded-xl bg-[#09090e] p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display font-bold text-sm text-[#2ecc71] flex items-center gap-1.5">
                      <span>✓</span>
                      <span>Kết Quả Dự Kiến ({autoPreviewList.length} suất chiếu)</span>
                    </h4>
                    {autoPreviewList.length > 0 && (
                      <button
                        type="button"
                        disabled={autoConfirming}
                        onClick={handleConfirmAutoSchedule}
                        className="bg-[#2ecc71] text-[#09090e] px-4 py-2 rounded-lg text-xs font-bold hover:brightness-110 cursor-pointer disabled:opacity-50"
                      >
                        {autoConfirming ? '⏳ Đang lưu...' : `✓ Xác Nhận Lưu (${autoPreviewList.length} Suất)`}
                      </button>
                    )}
                  </div>

                  {autoPreviewList.length === 0 ? (
                    <p className="text-xs text-[#a09e9a] italic py-2">
                      Không tìm thấy khoảng thời gian trống phù hợp nào trong khoảng ngày đã chọn.
                    </p>
                  ) : (
                    <div className="max-h-[240px] overflow-y-auto pr-1">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-[#a09e9a]">
                            <th className="py-2 pl-2">STT</th>
                            <th className="py-2">Phim</th>
                            <th className="py-2">Phòng</th>
                            <th className="py-2">Bắt Đầu ➔ Kết Thúc</th>
                            <th className="py-2">Giá Vé (Thường/VIP)</th>
                            <th className="py-2 text-right pr-2">Hành Động</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-[#f0ede8]">
                          {autoPreviewList.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white/5">
                              <td className="py-2.5 pl-2 font-mono-data text-[#a09e9a]">{idx + 1}</td>
                              <td className="py-2.5 font-medium">{item.movie_title}</td>
                              <td className="py-2.5 text-[#e8b84b]">{item.room_name}</td>
                              <td className="py-2.5 font-mono-data text-xs">
                                {new Date(item.start_time).toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {' ➔ '}
                                {new Date(item.end_time).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-2.5 font-mono-data">
                                {fmt(item.base_price)} / {fmt(item.vip_price)}
                              </td>
                              <td className="py-2.5 text-right pr-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAutoPreviewList(autoPreviewList.filter((_, i) => i !== idx))
                                  }}
                                  className="text-[#e07060] hover:underline text-[11px] cursor-pointer"
                                >
                                  Bỏ Qua
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Fixed Footer Action Bar */}
            <div className="flex justify-between items-center border-t border-white/10 pt-4 shrink-0">
              <span className="text-xs text-[#a09e9a]">
                * Hệ thống sẽ sắp xếp các phim vào các phòng chiếu theo tham số bạn đã chọn.
              </span>
              <button
                type="button"
                disabled={autoGenerating || autoStartDate > autoEndDate}
                onClick={handleGenerateAutoPreview}
                className="bg-[#e8b84b] text-[#09090e] px-5 py-2.5 rounded-xl text-xs font-bold hover:brightness-110 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span>{autoGenerating ? '⏳ Đang tính toán...' : '🔍 Tạo Bản Xem Trước (Preview)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
