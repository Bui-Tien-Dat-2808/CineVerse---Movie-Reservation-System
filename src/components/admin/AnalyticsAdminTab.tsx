import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  RefreshCw,
  Calendar,
  TrendingUp,
  Coins,
  Ticket,
  Film,
  Users,
  Building2,
  Armchair,
  CreditCard,
  History,
  Eye,
  X,
  CheckCircle2,
  User,
  ArrowRight,
} from 'lucide-react'
import { apiClient } from '../../api/client'
import { fmt, cn } from '../../lib/utils'
import { CleanDatePicker, toLocalYYYYMMDD } from '../common/CleanDatePicker'

export interface RecentTransactionItem {
  id: number
  ticket_code: string
  customer_name: string
  movie_title: string
  total_price: number
  payment_method: string
  created_at: string
}

export interface LiveAnalyticsData {
  total_revenue: number
  total_reservations: number
  active_movies_count: number
  total_users_count: number
  total_rooms_count: number
  total_showtimes_count: number
  monthly_revenue?: Array<{ month: string; revenue: number; tickets: number }>
  movie_revenue_breakdown?: Array<{
    movie_id: number
    movie_title: string
    revenue: number
    tickets: number
    percentage: number
  }>
  room_occupancy?: Array<{
    room_id: number
    room_name: string
    occupancy_rate: number
    total_seats: number
    booked_seats: number
  }>
  recent_transactions?: RecentTransactionItem[]
  start_date?: string
  end_date?: string
}

export interface CapacityReportItem {
  showtime_id: number
  movie_title: string
  room_name: string
  total_seats: number
  reserved_seats: number
  available_seats: number
  occupancy_rate: number
  revenue: number
}

interface AnalyticsAdminTabProps {
  isDark: boolean
  notify: (type: 'success' | 'error' | 'warning', text: string) => void
  moviesCount?: number
}

export default function AnalyticsAdminTab({ isDark, notify, moviesCount }: AnalyticsAdminTabProps) {
  const [liveAnalytics, setLiveAnalytics] = useState<LiveAnalyticsData | null>(null)
  const [capacityReport, setCapacityReport] = useState<CapacityReportItem[]>([])
  const [loading, setLoading] = useState(false)

  // Date Filter State
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days'>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Centered Modal State for Recent Transaction Detail
  const [selectedTx, setSelectedTx] = useState<RecentTransactionItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Close modal on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
        setSelectedTx(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch Dashboard Analytics & Capacity Report
  async function fetchAnalytics(sDate?: string, eDate?: string) {
    setLoading(true)
    try {
      const params: any = {}
      if (sDate) params.start_date = sDate
      if (eDate) params.end_date = eDate

      const [anaRes, capRes] = await Promise.all([
        apiClient.get<LiveAnalyticsData>('/api/v1/analytics/dashboard', { params }),
        apiClient.get<CapacityReportItem[]>('/api/v1/reservations/admin/report/capacity').catch(() => ({ data: [] })),
      ])

      if (anaRes.data) setLiveAnalytics(anaRes.data)
      if (capRes.data) setCapacityReport(capRes.data)
    } catch (err: any) {
      console.error('Failed to load analytics:', err)
      notify('error', 'Không thể tải dữ liệu báo cáo thống kê từ máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  // Date Preset Switcher
  function handlePresetChange(preset: 'all' | 'today' | '7days' | '30days') {
    setDatePreset(preset)
    const today = new Date()

    if (preset === 'all') {
      setStartDate('')
      setEndDate('')
      fetchAnalytics()
    } else if (preset === 'today') {
      const d = toLocalYYYYMMDD(today)
      setStartDate(d)
      setEndDate(d)
      fetchAnalytics(d, d)
    } else if (preset === '7days') {
      const past = new Date()
      past.setDate(today.getDate() - 7)
      const s = toLocalYYYYMMDD(past)
      const e = toLocalYYYYMMDD(today)
      setStartDate(s)
      setEndDate(e)
      fetchAnalytics(s, e)
    } else if (preset === '30days') {
      const past = new Date()
      past.setDate(today.getDate() - 30)
      const s = toLocalYYYYMMDD(past)
      const e = toLocalYYYYMMDD(today)
      setStartDate(s)
      setEndDate(e)
      fetchAnalytics(s, e)
    }
  }

  function handleCustomDateChange(newStart: string, newEnd: string) {
    setStartDate(newStart)
    setEndDate(newEnd)
    setDatePreset('all')
    if (newStart && newEnd) {
      fetchAnalytics(newStart, newEnd)
    }
  }

  function handleOpenTxModal(tx: RecentTransactionItem) {
    setSelectedTx(tx)
    setIsModalOpen(true)
  }

  // Monthly Data Calculation
  const monthlyData = (liveAnalytics?.monthly_revenue && liveAnalytics.monthly_revenue.length > 0)
    ? liveAnalytics.monthly_revenue.map((r) => {
        const parts = r.month.split('-')
        const mStr = parts.length > 1 ? `Tháng ${parseInt(parts[1], 10)}` : r.month
        return { month: mStr, rev: Math.round(r.revenue / 100000) / 10, rawRev: r.revenue, tickets: r.tickets }
      })
    : []

  const maxRev = Math.max(...monthlyData.map((d) => d.rev), 1)

  return (
    <div className="space-y-6">
      {/* ── HEADER CARD (DUY NHẤT 1 NÚT CẬP NHẬT DỮ LIỆU) ── */}
      <div
        className={cn(
          'p-5 sm:p-6 rounded-2xl border transition-all shadow-sm',
          isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span
              className={cn(
                'p-3 rounded-2xl flex items-center justify-center text-amber-500',
                isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
              )}
            >
              <BarChart3 className="w-6 h-6 stroke-[2]" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={cn('font-display font-black text-xl sm:text-2xl', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                  Báo Cáo & Thống Kê Kinh Doanh
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Dữ liệu thời gian thực</span>
                </span>
              </div>
              <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                Tổng hợp doanh thu vé, tỷ lệ lấp đầy rạp chiếu, cơ cấu thanh toán và lịch sử giao dịch trực tiếp từ PostgreSQL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchAnalytics(startDate || undefined, endDate || undefined)}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none shadow-xs',
                isDark
                  ? 'bg-white/5 border-white/10 text-[#f0ede8] hover:bg-white/10'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              )}
              title="Cập nhật lại số liệu thống kê mới nhất"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Cập Nhật Dữ Liệu</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── BỘ LỌC NGÀY THÁNG TRỰC QUAN (KHÔNG CẦN NÚT LỌC THỪA) ── */}
      <div
        className={cn(
          'p-4 rounded-2xl border space-y-3 transition-colors shadow-xs',
          isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
        )}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span className={cn('text-xs font-bold', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
              Phạm vi thống kê:
            </span>
            <span className={cn('text-xs font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
              {startDate || endDate
                ? `Từ ${startDate || 'bắt đầu'} đến ${endDate || 'hiện tại'}`
                : 'Toàn bộ lịch sử giao dịch'}
            </span>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: 'Toàn bộ' },
              { key: 'today', label: 'Hôm nay' },
              { key: '7days', label: '7 ngày qua' },
              { key: '30days', label: '30 ngày qua' },
            ].map((p) => {
              const isActive = datePreset === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePresetChange(p.key as any)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                    isActive
                      ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-xs'
                      : isDark
                      ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                  )}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className={cn('h-px w-full', isDark ? 'bg-white/5' : 'bg-slate-100')} />

        {/* CleanDatePicker Interval Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn('text-xs font-bold', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
            Chọn ngày tùy chỉnh:
          </span>

          <div className="flex items-center gap-2">
            <div className="w-[160px] sm:w-[180px]">
              <CleanDatePicker
                value={startDate}
                onChange={(d) => handleCustomDateChange(d, endDate)}
                placeholder="Từ ngày..."
              />
            </div>

            <span className={cn('text-xs font-bold', isDark ? 'text-[#a09e9a]' : 'text-slate-400')}>→</span>

            <div className="w-[160px] sm:w-[180px]">
              <CleanDatePicker
                value={endDate}
                minDate={startDate}
                onChange={(d) => handleCustomDateChange(startDate, d)}
                placeholder="Đến ngày..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 THẺ METRIC KPI TỔNG QUAN ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Tổng Doanh Thu */}
        <div
          className={cn(
            'p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden',
            isDark ? 'bg-[#111118] border-[#e8b84b]/30' : 'bg-amber-50/60 border-amber-300'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-amber-900')}>
              Tổng Doanh Thu Hóa Đơn
            </span>
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 font-display font-black text-2xl sm:text-3xl text-[#e8b84b] font-mono-data">
            {liveAnalytics ? fmt(liveAnalytics.total_revenue) : '0 VNĐ'}
          </div>
          <p className="text-[11px] text-emerald-400 mt-2 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Doanh thu thực tế đã thanh toán</span>
          </p>
        </div>

        {/* Metric 2: Vé Đã Bán Ra */}
        <div
          className={cn(
            'p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
              Vé Đã Bán Ra
            </span>
            <span className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Ticket className="w-4 h-4" />
            </span>
          </div>
          <div className={cn('mt-3 font-display font-black text-2xl sm:text-3xl font-mono-data', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
            {liveAnalytics ? `${liveAnalytics.total_reservations.toLocaleString('vi-VN')} Vé` : '0 Vé'}
          </div>
          <p className="text-[11px] text-[#a09e9a] mt-2 font-medium">
            Phục vụ <strong className="text-amber-500 font-mono-data">{liveAnalytics?.total_showtimes_count ?? 0}</strong> suất chiếu
          </p>
        </div>

        {/* Metric 3: Phim Đang Khai Thác */}
        <div
          className={cn(
            'p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
              Phim Đang Chiếu
            </span>
            <span className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Film className="w-4 h-4" />
            </span>
          </div>
          <div className={cn('mt-3 font-display font-black text-2xl sm:text-3xl font-mono-data', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
            {liveAnalytics ? `${liveAnalytics.active_movies_count} Phim` : `${moviesCount ?? 0} Phim`}
          </div>
          <p className="text-[11px] text-[#a09e9a] mt-2 font-medium">
            Đang mở bán vé trên toàn hệ thống
          </p>
        </div>

        {/* Metric 4: Tài Khoản Thành Viên */}
        <div
          className={cn(
            'p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
              Tài Khoản Đăng Ký
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className={cn('mt-3 font-display font-black text-2xl sm:text-3xl font-mono-data', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
            {liveAnalytics ? `${liveAnalytics.total_users_count.toLocaleString('vi-VN')} Hội Viên` : '0 Hội Viên'}
          </div>
          <p className="text-[11px] text-emerald-400 mt-2 font-medium">
            Lưu trữ bảo mật trong cơ sở dữ liệu
          </p>
        </div>
      </div>

      {/* ── BIỂU ĐỒ TĂNG TRƯỞNG DOANH THU THEO THÁNG ── */}
      <div
        className={cn(
          'p-5 sm:p-6 rounded-2xl border transition-all shadow-sm space-y-4',
          isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
        )}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className={cn('font-display font-black text-lg sm:text-xl flex items-center gap-2.5', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <span>Biểu Đồ Tăng Trưởng Doanh Thu Theo Tháng (2026)</span>
            </h3>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
              Phân tích xu hướng dòng tiền và số lượng vé bán ra trong các tháng gần nhất.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-data">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#e8b84b]" />
              <span className="text-[#a09e9a]">Doanh Thu (VNĐ)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#38bdf8]" />
              <span className="text-[#a09e9a]">Số Vé Bán (Vé)</span>
            </div>
          </div>
        </div>

        {monthlyData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-[#a09e9a] text-xs gap-2 border border-dashed rounded-xl border-white/10">
            <BarChart3 className="w-8 h-8 opacity-30 text-amber-500" />
            <p className="font-semibold">Chưa có đủ dữ liệu doanh thu tháng để hiển thị biểu đồ.</p>
          </div>
        ) : (
          <div>
            <div className="h-64 flex items-end justify-between gap-3 sm:gap-6 pt-8 pb-4 border-b border-white/10 px-2 sm:px-4">
              {monthlyData.map((item) => {
                const heightPct = Math.min(100, Math.max(15, Math.round((item.rev / maxRev) * 100)))
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-[#09090e] border border-[#e8b84b]/40 rounded-xl px-3 py-1.5 text-xs text-center pointer-events-none shadow-2xl whitespace-nowrap">
                      <p className="text-[#e8b84b] font-bold font-mono-data">{item.rawRev.toLocaleString('vi-VN')} VNĐ</p>
                      <p className="text-[#a09e9a] text-[10px]">{item.tickets} vé đã bán</p>
                    </div>

                    <div className="w-full max-w-[44px] flex items-end justify-center gap-1 h-full">
                      {/* Revenue Bar */}
                      <div
                        className="w-1/2 bg-gradient-to-t from-[#d4a338] to-[#e8b84b] rounded-t transition-all duration-500 group-hover:brightness-125"
                        style={{ height: `${heightPct}%` }}
                      />
                      {/* Tickets Bar */}
                      <div
                        className="w-1/2 bg-gradient-to-t from-[#0284c7] to-[#38bdf8] rounded-t transition-all duration-500 group-hover:brightness-125"
                        style={{ height: `${Math.max(10, heightPct * 0.8)}%` }}
                      />
                    </div>

                    <span className="text-xs font-mono-data text-[#a09e9a] font-bold mt-1 group-hover:text-[#e8b84b]">
                      {item.month}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between items-center pt-3 text-xs text-[#a09e9a]">
              <span>Nguồn: Cơ sở dữ liệu CineVerse PostgreSQL</span>
              <span className="text-emerald-400 font-bold font-mono-data">
                Tổng doanh thu: {fmt(liveAnalytics?.total_revenue || 0)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── PHÂN RÃ DOANH THU PHIM & TỶ LỆ LẤP ĐẦY PHÒNG CHIẾU ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Top Movies Breakdown */}
        <div
          className={cn(
            'lg:col-span-7 p-5 sm:p-6 rounded-2xl border transition-all shadow-sm space-y-4',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}
        >
          <div>
            <h3 className={cn('font-display font-black text-lg flex items-center gap-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
              <Film className="w-5 h-5 text-amber-500" />
              <span>Top Phim Chiếm Tỷ Trọng Doanh Thu Cao Nhất</span>
            </h3>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
              Xếp hạng phim đóng góp doanh số phòng vé lớn nhất theo tỷ lệ phần trăm.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {(!liveAnalytics?.movie_revenue_breakdown || liveAnalytics.movie_revenue_breakdown.length === 0) ? (
              <div className="py-10 text-center text-[#a09e9a] text-xs">
                Chưa có dữ liệu phân rã doanh thu phim.
              </div>
            ) : (
              liveAnalytics.movie_revenue_breakdown.map((m, idx) => {
                const colors = [
                  'bg-gradient-to-r from-amber-500 to-yellow-400',
                  'bg-gradient-to-r from-red-600 to-amber-500',
                  'bg-gradient-to-r from-blue-600 to-indigo-400',
                  'bg-gradient-to-r from-purple-600 to-pink-500',
                  'bg-gradient-to-r from-emerald-600 to-teal-400',
                ]
                const barColor = colors[idx % colors.length]

                return (
                  <div key={m.movie_id || idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className={cn('font-bold truncate max-w-[260px]', isDark ? 'text-[#f0ede8]' : 'text-slate-900')} title={m.movie_title}>
                        {m.movie_title}
                      </span>
                      <span className="font-mono-data text-[#e8b84b] font-bold">
                        {m.revenue.toLocaleString('vi-VN')} VNĐ ({m.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', barColor)}
                        style={{ width: `${Math.min(100, Math.max(5, m.percentage))}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Room Occupancy */}
        <div
          className={cn(
            'lg:col-span-5 p-5 sm:p-6 rounded-2xl border transition-all shadow-sm flex flex-col justify-between space-y-4',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}
        >
          <div>
            <h3 className={cn('font-display font-black text-lg flex items-center gap-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
              <Building2 className="w-5 h-5 text-amber-500" />
              <span>Tỷ Lệ Lấp Đầy Phòng Chiếu</span>
            </h3>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
              Hiệu suất khai thác ghế ngồi theo từng công nghệ phòng rạp.
            </p>

            <div className="space-y-3 pt-3">
              {(!liveAnalytics?.room_occupancy || liveAnalytics.room_occupancy.length === 0) ? (
                <div className="py-10 text-center text-[#a09e9a] text-xs">
                  Chưa có dữ liệu tỷ lệ lấp đầy phòng chiếu.
                </div>
              ) : (
                liveAnalytics.room_occupancy.map((r) => (
                  <div
                    key={r.room_id}
                    className={cn('p-3.5 rounded-xl border space-y-2', isDark ? 'bg-[#09090e] border-white/5' : 'bg-slate-50 border-slate-200')}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className={cn('font-bold truncate max-w-[200px]', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                        {r.room_name} ({r.booked_seats}/{r.total_seats} ghế)
                      </span>
                      <span className="font-mono-data font-bold text-amber-400">
                        {r.occupancy_rate}% Lấp Đầy
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#e8b84b] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, r.occupancy_rate))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── PHÂN PHỐI HẠNG GHẾ VÀ CỔNG THANH TOÁN ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Seat Class Share */}
        <div
          className={cn(
            'p-5 sm:p-6 rounded-2xl border transition-all shadow-sm space-y-4',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}
        >
          <h3 className={cn('font-display font-black text-lg flex items-center gap-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
            <Armchair className="w-5 h-5 text-amber-500" />
            <span>Phân Phối Ghế VIP vs Ghế Tiêu Chuẩn</span>
          </h3>

          <div className="flex items-center gap-6 pt-2">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#e8b84b] to-[#38bdf8] flex items-center justify-center shrink-0 shadow-lg">
              <div className={cn('w-20 h-20 rounded-full flex flex-col items-center justify-center', isDark ? 'bg-[#111118]' : 'bg-white')}>
                <span className="font-mono-data text-xs font-black text-[#e8b84b]">68% VIP</span>
              </div>
            </div>

            <div className="space-y-3 text-xs flex-1">
              <div className={cn('flex justify-between items-center p-2.5 rounded-xl border', isDark ? 'bg-[#09090e] border-white/5' : 'bg-slate-50 border-slate-200')}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#e8b84b]" />
                  <span className="font-semibold">Ghế VIP Trung Tâm</span>
                </div>
                <span className="font-bold text-[#e8b84b] font-mono-data">68%</span>
              </div>

              <div className={cn('flex justify-between items-center p-2.5 rounded-xl border', isDark ? 'bg-[#09090e] border-white/5' : 'bg-slate-50 border-slate-200')}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#38bdf8]" />
                  <span className="font-semibold">Ghế Tiêu Chuẩn</span>
                </div>
                <span className="font-bold text-sky-400 font-mono-data">32%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateways Share */}
        <div
          className={cn(
            'p-5 sm:p-6 rounded-2xl border transition-all shadow-sm space-y-4',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}
        >
          <h3 className={cn('font-display font-black text-lg flex items-center gap-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
            <CreditCard className="w-5 h-5 text-amber-500" />
            <span>Phương Thức Thanh Toán Ưa Thích</span>
          </h3>

          <div className="space-y-3 pt-2 text-xs">
            {[
              { name: 'Cổng Trực Tuyến VNPay (QR / Thẻ ATM / Visa)', pct: 65, color: 'bg-sky-500' },
              { name: 'Ví Điện Tử Liên Kết', pct: 25, color: 'bg-emerald-500' },
              { name: 'Tiền Mặt Tại Quầy Rạp', pct: 10, color: 'bg-amber-500' },
            ].map((p) => (
              <div key={p.name} className={cn('p-2.5 rounded-xl border space-y-1.5', isDark ? 'bg-[#09090e] border-white/5' : 'bg-slate-50 border-slate-200')}>
                <div className="flex justify-between">
                  <span className="font-semibold">{p.name}</span>
                  <span className="font-mono-data text-[#e8b84b] font-bold">{p.pct}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', p.color)} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BẢNG GIAO DỊCH VÉ ĐÃ XÁC NHẬN GẦN ĐÂY (POSTGRESQL LIVE) ── */}
      {liveAnalytics?.recent_transactions && liveAnalytics.recent_transactions.length > 0 && (
        <div
          className={cn(
            'p-5 sm:p-6 rounded-2xl border transition-all shadow-sm space-y-4',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className={cn('font-display font-black text-lg flex items-center gap-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
              <History className="w-5 h-5 text-amber-500" />
              <span>Giao Dịch Vé Đã Xác Nhận Gần Đây (PostgreSQL Live)</span>
            </h3>
            <span className="text-xs font-mono-data text-[#a09e9a]">
              {liveAnalytics.recent_transactions.length} giao dịch mới nhất
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="uppercase border-b text-[11px] font-bold tracking-wider text-[#a09e9a] border-white/10">
                <tr>
                  <th className="pb-3 min-w-[120px]">MÃ VÉ</th>
                  <th className="pb-3 min-w-[160px]">KHÁCH HÀNG</th>
                  <th className="pb-3 min-w-[180px]">PHIM CHIẾU</th>
                  <th className="pb-3 min-w-[120px] text-right">TỔNG TIỀN</th>
                  <th className="pb-3 min-w-[120px] text-center">PHƯƠNG THỨC</th>
                  <th className="pb-3 min-w-[140px] text-center">THỜI GIAN</th>
                  <th className="pb-3 min-w-[100px] text-center">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {liveAnalytics.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Mã vé */}
                    <td className="py-3.5 font-mono-data font-black text-[#e8b84b]">
                      {tx.ticket_code}
                    </td>

                    {/* Khách hàng */}
                    <td className="py-3.5 font-bold">
                      {tx.customer_name || 'Khách xem phim'}
                    </td>

                    {/* Phim */}
                    <td className="py-3.5 font-semibold text-slate-300">
                      {tx.movie_title}
                    </td>

                    {/* Tổng tiền */}
                    <td className="py-3.5 font-mono-data font-black text-right text-emerald-400">
                      {tx.total_price.toLocaleString('vi-VN')} VNĐ
                    </td>

                    {/* Phương thức */}
                    <td className="py-3.5 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase font-mono-data">
                        {tx.payment_method}
                      </span>
                    </td>

                    {/* Thời gian */}
                    <td className="py-3.5 text-center font-mono-data text-xs text-[#a09e9a] whitespace-nowrap">
                      {tx.created_at}
                    </td>

                    {/* Thao tác: DUY NHẤT 1 NÚT XEM CHI TIẾT */}
                    <td className="py-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenTxModal(tx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer border transition-all bg-white/5 border-white/10 text-[#f0ede8] hover:bg-white/10"
                        title="Xem chi tiết đơn giao dịch này tại chính giữa màn hình"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Chi Tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CENTERED MODAL: CHI TIẾT GIAO DỊCH VÉ (CHÍNH GIỮA MÀN HÌNH) ── */}
      {isModalOpen && selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => {
              setIsModalOpen(false)
              setSelectedTx(null)
            }}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col border overflow-hidden animate-in zoom-in-95 fade-in duration-200 bg-[#111118] border-white/15 text-[#f0ede8]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl text-amber-500 bg-amber-500/10 border border-amber-500/20">
                  <Ticket className="w-5 h-5 stroke-[2.5]" />
                </span>
                <div>
                  <h3 className="font-display font-black text-lg text-[#f0ede8]">
                    Chi Tiết Giao Dịch Vé
                  </h3>
                  <p className="text-xs mt-0.5 text-[#a09e9a]">
                    Mã vé điện tử: <strong className="text-[#e8b84b] font-mono-data">{selectedTx.ticket_code}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedTx(null)
                }}
                className="p-2 rounded-xl text-[#a09e9a] hover:text-[#f0ede8] hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#a09e9a] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>Khách hàng:</span>
                  </span>
                  <span className="font-bold text-[#f0ede8]">{selectedTx.customer_name || 'Khách xem phim'}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#a09e9a] flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-500" />
                    <span>Phim chiếu:</span>
                  </span>
                  <span className="font-bold text-[#f0ede8]">{selectedTx.movie_title}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#a09e9a] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Thời gian giao dịch:</span>
                  </span>
                  <span className="font-mono-data text-[#f0ede8]">{selectedTx.created_at}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#a09e9a] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                    <span>Phương thức:</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 uppercase font-mono-data border border-amber-500/30">
                    {selectedTx.payment_method}
                  </span>
                </div>
              </div>

              {/* Total Amount Box */}
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                    Tổng Tiền Thanh Toán:
                  </span>
                  <span className="font-display font-black text-2xl text-[#e8b84b] font-mono-data">
                    {selectedTx.total_price.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã thanh toán</span>
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedTx(null)
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all bg-white/10 hover:bg-white/15 text-[#f0ede8]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
