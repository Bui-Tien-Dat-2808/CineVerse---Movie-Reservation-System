import React, { useState, useEffect, useMemo } from 'react'
import {
  RotateCcw,
  RefreshCw,
  Search,
  Calendar,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  SlidersHorizontal,
  X,
  Check,
  FileText,
  User,
  Film,
  Ticket,
} from 'lucide-react'
import { apiClient } from '../../api/client'
import { fmt, cn } from '../../lib/utils'
import { CleanDatePicker, toLocalYYYYMMDD } from '../common/CleanDatePicker'

export interface RefundItem {
  id: number
  reservation_id: number
  payment_transaction_id: number
  amount: number
  vnp_request_id: string
  status: 'pending' | 'processing' | 'success' | 'failed' | 'manual_required'
  vnpay_response_code?: string
  vnpay_response_message?: string
  admin_note?: string
  resolved_by_admin_id?: number
  resolved_at?: string
  created_at: string
  ticket_code?: string
  user_email?: string
  user_full_name?: string
  movie_title?: string
  payment_method?: string
  cancellation_reason?: string
}

interface RefundsAdminTabProps {
  isDark: boolean
  notify: (type: 'success' | 'error' | 'warning', text: string) => void
}

export default function RefundsAdminTab({ isDark, notify }: RefundsAdminTabProps) {
  const [refunds, setRefunds] = useState<RefundItem[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pmFilter, setPmFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const PAGE_SIZE = 15

  // Stats across all records
  const [statsData, setStatsData] = useState<{
    total: number
    manual: number
    success: number
    processing: number
    failed: number
    totalAmount: number
  }>({
    total: 0,
    manual: 0,
    success: 0,
    processing: 0,
    failed: 0,
    totalAmount: 0,
  })

  // Centered Modal State
  const [selectedRefund, setSelectedRefund] = useState<RefundItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [adminNote, setAdminNote] = useState('Đã chuyển khoản ngân hàng ngoài hệ thống')
  const [isResolving, setIsResolving] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  // Close modal on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
        setSelectedRefund(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch KPI stats
  async function fetchStats() {
    try {
      const res = await apiClient.get<{ items: RefundItem[]; total: number }>(
        '/api/v1/admin/refunds?status=all&page=1&page_size=100'
      )
      const allItems = res.data.items || []
      let manual = 0
      let success = 0
      let processing = 0
      let failed = 0
      let totalAmount = 0

      allItems.forEach((item) => {
        totalAmount += Number(item.amount || 0)
        if (item.status === 'manual_required') manual++
        else if (item.status === 'success') success++
        else if (item.status === 'processing') processing++
        else if (item.status === 'failed') failed++
      })

      setStatsData({
        total: res.data.total || allItems.length,
        manual,
        success,
        processing,
        failed,
        totalAmount,
      })
    } catch {
      // ignore stats background error
    }
  }

  // Fetch paginated refunds
  async function loadRefunds() {
    setLoading(true)
    try {
      const res = await apiClient.get<{ items: RefundItem[]; total: number }>(
        `/api/v1/admin/refunds?status=${statusFilter}&payment_method=${pmFilter}&start_date=${startDate}&end_date=${endDate}&page=${currentPage}&page_size=${PAGE_SIZE}`
      )
      setRefunds(res.data.items || [])
      setTotalItems(res.data.total || 0)
    } catch (err: any) {
      console.error('Failed to load refunds:', err)
      notify('error', 'Không thể tải danh sách yêu cầu hoàn tiền từ máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRefunds()
  }, [statusFilter, pmFilter, startDate, endDate, currentPage])

  useEffect(() => {
    fetchStats()
  }, [])

  // Date Presets Handler
  function handleDatePreset(preset: 'today' | '7days' | '30days' | 'all') {
    const today = new Date()
    if (preset === 'all') {
      setStartDate('')
      setEndDate('')
    } else if (preset === 'today') {
      const d = toLocalYYYYMMDD(today)
      setStartDate(d)
      setEndDate(d)
    } else if (preset === '7days') {
      const past = new Date()
      past.setDate(today.getDate() - 7)
      setStartDate(toLocalYYYYMMDD(past))
      setEndDate(toLocalYYYYMMDD(today))
    } else if (preset === '30days') {
      const past = new Date()
      past.setDate(today.getDate() - 30)
      setStartDate(toLocalYYYYMMDD(past))
      setEndDate(toLocalYYYYMMDD(today))
    }
    setCurrentPage(1)
  }

  // Filter items in-memory by search query
  const filteredRefunds = useMemo(() => {
    if (!searchQuery.trim()) return refunds
    const q = searchQuery.toLowerCase()
    return refunds.filter((r) => {
      const ticket = (r.ticket_code || `r#${r.reservation_id}`).toLowerCase()
      const user = (r.user_full_name || '').toLowerCase()
      const email = (r.user_email || '').toLowerCase()
      const movie = (r.movie_title || '').toLowerCase()
      const reqId = (r.vnp_request_id || '').toLowerCase()
      return ticket.includes(q) || user.includes(q) || email.includes(q) || movie.includes(q) || reqId.includes(q)
    })
  }, [refunds, searchQuery])

  // Open Centered Modal for Action / Details
  function handleOpenModal(refund: RefundItem) {
    setSelectedRefund(refund)
    setAdminNote(refund.admin_note || 'Đã chuyển khoản ngân hàng ngoài hệ thống')
    setIsModalOpen(true)
  }

  // Handle Manual Resolve (Bank Transfer confirmed)
  async function handleConfirmResolve() {
    if (!selectedRefund) return
    setIsResolving(true)
    try {
      await apiClient.post(`/api/v1/admin/refunds/${selectedRefund.id}/resolve`, {
        admin_note: adminNote,
      })
      notify('success', `Đã đánh dấu hoàn tiền thủ công cho đơn vé #${selectedRefund.ticket_code || selectedRefund.reservation_id}`)
      setIsModalOpen(false)
      setSelectedRefund(null)
      await loadRefunds()
      await fetchStats()
    } catch (err: any) {
      notify('error', err.response?.data?.detail || 'Không thể cập nhật trạng thái hoàn tiền.')
    } finally {
      setIsResolving(false)
    }
  }

  // Handle Retry VNPay Refund API
  async function handleRetryVNPay() {
    if (!selectedRefund) return
    setIsRetrying(true)
    try {
      const res = await apiClient.post<RefundItem>(`/api/v1/admin/refunds/${selectedRefund.id}/retry`)
      if (res.data.status === 'success') {
        notify('success', 'Thử lại hoàn tiền tự động qua VNPay thành công!')
        setIsModalOpen(false)
        setSelectedRefund(null)
      } else {
        notify('error', res.data.vnpay_response_message || 'VNPay từ chối yêu cầu hoàn tiền tự động.')
        setSelectedRefund(res.data)
      }
      await loadRefunds()
      await fetchStats()
    } catch (err: any) {
      notify('error', err.response?.data?.detail || 'Lỗi khi gọi lại API cổng thanh toán VNPay.')
    } finally {
      setIsRetrying(false)
    }
  }

  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1

  return (
    <div className="space-y-6">
      {/* ── HEADER CARD (ONLY 1 REFRESH BUTTON ON ENTIRE PAGE) ── */}
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
              <RotateCcw className="w-6 h-6 stroke-[2]" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={cn('font-display font-black text-xl sm:text-2xl', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                  Quản Lý Hoàn Tiền Vé Đã Hủy
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Đối soát & Xử lý</span>
                </span>
              </div>
              <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                Theo dõi trạng thái hoàn trả giao dịch qua cổng VNPay và hỗ trợ chuyển khoản thủ công cho khách hủy vé xem phim.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                loadRefunds()
                fetchStats()
              }}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none shadow-xs',
                isDark
                  ? 'bg-white/5 border-white/10 text-[#f0ede8] hover:bg-white/10'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              )}
              title="Tải lại danh sách hoàn tiền mới nhất"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Làm Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 5 THẺ KPI TƯƠNG TÁC (ĐÓNG VAI TRÒ LÀ BỘ LỌC TRẠNG THÁI DUY NHẤT) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Tất Cả Yêu Cầu */}
        <div
          onClick={() => {
            setStatusFilter('all')
            setCurrentPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            statusFilter === 'all'
              ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/10'
              : isDark
              ? 'bg-[#111118] border-white/10 hover:border-amber-500/40'
              : 'bg-white border-slate-200 hover:border-amber-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-bold uppercase tracking-wider', statusFilter === 'all' ? 'text-amber-500 font-black' : isDark ? 'text-slate-300' : 'text-slate-700')}>
              Tất Cả Yêu Cầu
            </span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', statusFilter === 'all' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white/5 border-white/10 text-amber-500')}>
              <RotateCcw className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-amber-500">
              {statsData.total || totalItems}
            </div>
            <span className="text-[10px] font-semibold opacity-70">Tổng lượt</span>
          </div>
          <p className={cn('text-[11px] mt-1 truncate font-mono-data', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
            {fmt(statsData.totalAmount)}
          </p>
        </div>

        {/* KPI 2: Cần Xử Lý Thủ Công */}
        <div
          onClick={() => {
            setStatusFilter('manual_required')
            setCurrentPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            statusFilter === 'manual_required'
              ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/15'
              : isDark
              ? 'bg-[#111118] border-white/10 hover:border-amber-500/40'
              : 'bg-white border-slate-200 hover:border-amber-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Cần Xử Lý</span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', statusFilter === 'manual_required' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-400')}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-amber-400">
              {statsData.manual}
            </div>
            <span className="text-[10px] font-semibold text-amber-400/80">Cần can thiệp</span>
          </div>
          <p className={cn('text-[11px] mt-1 truncate', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
            Chuyển khoản thủ công
          </p>
        </div>

        {/* KPI 3: Đã Hoàn Tiền Thành Công */}
        <div
          onClick={() => {
            setStatusFilter('success')
            setCurrentPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            statusFilter === 'success'
              ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10'
              : isDark
              ? 'bg-[#111118] border-white/10 hover:border-emerald-500/40'
              : 'bg-white border-slate-200 hover:border-emerald-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Đã Hoàn Tiền</span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', statusFilter === 'success' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400')}>
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-emerald-400">
              {statsData.success}
            </div>
            <span className="text-[10px] font-semibold text-emerald-400/80">Hoàn tất</span>
          </div>
          <p className={cn('text-[11px] mt-1 truncate', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
            Đã thanh toán lại
          </p>
        </div>

        {/* KPI 4: Đang Xử Lý */}
        <div
          onClick={() => {
            setStatusFilter('processing')
            setCurrentPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            statusFilter === 'processing'
              ? 'ring-2 ring-sky-500 border-sky-500 bg-sky-500/10'
              : isDark
              ? 'bg-[#111118] border-white/10 hover:border-sky-500/40'
              : 'bg-white border-slate-200 hover:border-sky-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-500">Đang Xử Lý</span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', statusFilter === 'processing' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-sky-500/15 border-sky-500/30 text-sky-400')}>
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-sky-400">
              {statsData.processing}
            </div>
            <span className="text-[10px] font-semibold text-sky-400/80">Chờ cổng</span>
          </div>
          <p className={cn('text-[11px] mt-1 truncate', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
            Đang gọi hoàn tự động
          </p>
        </div>

        {/* KPI 5: Thất Bại */}
        <div
          onClick={() => {
            setStatusFilter('failed')
            setCurrentPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            statusFilter === 'failed'
              ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-500/10'
              : isDark
              ? 'bg-[#111118] border-white/10 hover:border-rose-500/40'
              : 'bg-white border-slate-200 hover:border-rose-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Thất Bại</span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', statusFilter === 'failed' ? 'bg-rose-500 text-slate-950 border-rose-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400')}>
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-rose-400">
              {statsData.failed}
            </div>
            <span className="text-[10px] font-semibold text-rose-400/80">Lỗi gọi API</span>
          </div>
          <p className={cn('text-[11px] mt-1 truncate', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
            Cần thử lại hoặc bù tiền
          </p>
        </div>
      </div>

      {/* ── TOOLBAR BỔ TRỢ: TÌM KIẾM, PHƯƠNG THỨC & NGÀY THÁNG ── */}
      <div
        className={cn(
          'p-4 rounded-2xl border space-y-3.5 transition-colors shadow-xs',
          isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
        )}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a09e9a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã vé, tên khách hàng, email, phim..."
              className={cn(
                'w-full pl-9 pr-8 py-2.5 rounded-xl border text-xs outline-none transition-all',
                isDark
                  ? 'bg-[#09090e] border-white/10 text-[#f0ede8] placeholder:text-[#6e6c68] focus:border-[#e8b84b]'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 shadow-2xs'
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a09e9a] hover:text-[#f0ede8] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn('text-xs font-bold mr-1', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
              Phương thức:
            </span>
            {[
              { key: 'all', label: 'Tất cả', icon: null },
              { key: 'vnpay', label: 'VNPay', icon: CreditCard },
              { key: 'cash', label: 'Tiền mặt', icon: Banknote },
            ].map((pm) => {
              const IconComp = pm.icon
              const isActive = pmFilter === pm.key
              return (
                <button
                  key={pm.key}
                  type="button"
                  onClick={() => {
                    setPmFilter(pm.key)
                    setCurrentPage(1)
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5',
                    isActive
                      ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-xs'
                      : isDark
                      ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                  )}
                >
                  {IconComp && <IconComp className="w-3.5 h-3.5" />}
                  <span>{pm.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className={cn('h-px w-full', isDark ? 'bg-white/5' : 'bg-slate-100')} />

        {/* Date Filter & Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={cn('text-xs font-bold flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Khoảng ngày:</span>
            </span>

            <div className="flex items-center gap-2">
              <div className="w-[160px] sm:w-[180px]">
                <CleanDatePicker
                  value={startDate}
                  onChange={(d) => {
                    setStartDate(d)
                    setCurrentPage(1)
                  }}
                  placeholder="Từ ngày..."
                />
              </div>

              <span className={cn('text-xs font-bold', isDark ? 'text-[#a09e9a]' : 'text-slate-400')}>→</span>

              <div className="w-[160px] sm:w-[180px]">
                <CleanDatePicker
                  value={endDate}
                  minDate={startDate}
                  onChange={(d) => {
                    setEndDate(d)
                    setCurrentPage(1)
                  }}
                  placeholder="Đến ngày..."
                />
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'today', label: 'Hôm nay' },
              { key: '7days', label: '7 ngày qua' },
              { key: '30days', label: '30 ngày qua' },
              { key: 'all', label: 'Tất cả ngày' },
            ].map((preset) => {
              const isActive =
                (preset.key === 'all' && !startDate && !endDate) ||
                (preset.key === 'today' && startDate === toLocalYYYYMMDD(new Date()) && endDate === toLocalYYYYMMDD(new Date()))
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleDatePreset(preset.key as any)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-xs'
                      : isDark
                      ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                  )}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── BẢNG DỮ LIỆU HOÀN TIỀN (TABLE) ── */}
      <div
        className={cn(
          'border rounded-2xl overflow-hidden shadow-sm transition-colors',
          isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead
              className={cn(
                'uppercase border-b text-[11px] font-bold tracking-wider',
                isDark ? 'bg-[#161622] text-[#f0ede8] border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200'
              )}
            >
              <tr>
                <th className="p-3.5 min-w-[190px]">Mã Vé & Khách Hàng</th>
                <th className="p-3.5 min-w-[170px] max-w-[220px]">Bộ Phim</th>
                <th className="p-3.5 min-w-[120px] text-center">Phương Thức</th>
                <th className="p-3.5 min-w-[180px] max-w-[240px]">Lý Do Hủy Vé</th>
                <th className="p-3.5 min-w-[120px] text-right">Số Tiền</th>
                <th className="p-3.5 min-w-[150px] text-center">Mã Đối Soát</th>
                <th className="p-3.5 min-w-[150px] text-center">Trạng Thái</th>
                <th className="p-3.5 min-w-[140px] text-center">Thời Điểm</th>
                <th className="p-3.5 min-w-[140px] text-center">Thao Tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[#a09e9a]">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
                    <p className="font-semibold text-xs">Đang tải danh sách yêu cầu hoàn tiền...</p>
                  </td>
                </tr>
              ) : filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[#a09e9a]">
                    <RotateCcw className="w-10 h-10 mx-auto opacity-30 text-amber-500 mb-2" />
                    <p className="text-sm font-bold text-slate-400">Không tìm thấy yêu cầu hoàn tiền nào phù hợp</p>
                    <p className="text-xs opacity-70 mt-1">Hãy thử thay đổi trạng thái, phương thức hoặc khoảng thời gian lọc.</p>
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((r) => {
                  const isManual = r.status === 'manual_required' || r.status === 'failed'
                  const isCash = r.payment_method === 'cash'
                  const createdDate = new Date(r.created_at)

                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        'transition-colors',
                        isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                      )}
                    >
                      {/* Mã Vé & Khách Hàng */}
                      <td className="p-3.5 align-middle">
                        <div className="font-mono-data font-black text-[#e8b84b] text-xs">
                          {r.ticket_code || `R#${r.reservation_id}`}
                        </div>
                        <div className={cn('font-bold text-xs mt-0.5 truncate', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                          {r.user_full_name || 'Khách xem phim'}
                        </div>
                        <div className={cn('text-[10px] font-mono-data mt-0.5 truncate', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                          {r.user_email}
                        </div>
                      </td>

                      {/* Bộ Phim */}
                      <td className="p-3.5 align-middle max-w-[220px]">
                        <p className={cn('font-semibold text-xs truncate', isDark ? 'text-[#f0ede8]' : 'text-slate-900')} title={r.movie_title || 'N/A'}>
                          {r.movie_title || 'N/A'}
                        </p>
                      </td>

                      {/* Phương Thức Thanh Toán */}
                      <td className="p-3.5 align-middle text-center whitespace-nowrap">
                        {isCash ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 inline-flex items-center gap-1.5 shadow-2xs">
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Tiền mặt</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 inline-flex items-center gap-1.5 shadow-2xs">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>VNPay</span>
                          </span>
                        )}
                      </td>

                      {/* Lý Do Hủy Vé */}
                      <td className="p-3.5 align-middle max-w-[240px]">
                        <div
                          className={cn(
                            'p-2 rounded-xl border text-xs leading-snug truncate',
                            isDark ? 'bg-[#161622]/80 border-white/5 text-[#f0ede8]' : 'bg-slate-100/80 border-slate-200 text-slate-800'
                          )}
                          title={r.cancellation_reason || 'Khách không còn nhu cầu xem phim'}
                        >
                          <span className="font-medium">{r.cancellation_reason || 'Khách không còn nhu cầu xem phim'}</span>
                        </div>
                      </td>

                      {/* Số Tiền */}
                      <td className="p-3.5 align-middle text-right font-mono-data font-black text-[#e8b84b] text-sm whitespace-nowrap">
                        {fmt(r.amount)}
                      </td>

                      {/* Mã Đối Soát VNPay */}
                      <td className="p-3.5 align-middle text-center font-mono-data text-xs">
                        <span className={cn('font-semibold', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                          {r.vnp_request_id || '—'}
                        </span>
                      </td>

                      {/* Trạng Thái */}
                      <td className="p-3.5 align-middle text-center whitespace-nowrap">
                        {r.status === 'manual_required' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Cần xử lý</span>
                          </span>
                        )}
                        {r.status === 'success' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã hoàn tiền</span>
                          </span>
                        )}
                        {r.status === 'processing' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Đang xử lý</span>
                          </span>
                        )}
                        {r.status === 'failed' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>Thất bại</span>
                          </span>
                        )}
                      </td>

                      {/* Thời Điểm */}
                      <td className="p-3.5 align-middle text-center font-mono-data text-xs text-[#a09e9a] whitespace-nowrap">
                        <div>{createdDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] opacity-70">{createdDate.toLocaleDateString('vi-VN')}</div>
                      </td>

                      {/* Thao Tác: DUY NHẤT 1 NÚT CHO MỖI HÀNG */}
                      <td className="p-3.5 align-middle text-center whitespace-nowrap">
                        {isManual ? (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(r)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#e8b84b] hover:bg-[#dfad3e] text-[#09090e] font-bold text-xs cursor-pointer shadow-xs transition-all"
                            title="Mở giao diện xử lý hoàn tiền tại chính giữa màn hình"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Xử Lý Hoàn Tiền</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(r)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer border transition-all',
                              isDark
                                ? 'bg-white/5 border-white/10 text-[#f0ede8] hover:bg-white/10'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            )}
                            title="Xem chi tiết giao dịch hoàn tiền"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem Chi Tiết</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PAGINATION FOOTER ── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className={cn('text-xs font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
            Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} – {Math.min(currentPage * PAGE_SIZE, totalItems)} trong tổng số{' '}
            <strong className={isDark ? 'text-[#f0ede8]' : 'text-slate-800'}>{totalItems}</strong> yêu cầu
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                isDark ? 'bg-white/5 border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-700'
              )}
            >
              Trước
            </button>

            <span className="text-xs font-semibold px-2">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                isDark ? 'bg-white/5 border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-700'
              )}
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* ── CENTERED MODAL: CHI TIẾT & XỬ LÝ HOÀN TIỀN (CHÍNH GIỮA MÀN HÌNH) ── */}
      {isModalOpen && selectedRefund && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => {
              setIsModalOpen(false)
              setSelectedRefund(null)
            }}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <div
            className={cn(
              'relative z-10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border overflow-hidden animate-in zoom-in-95 fade-in duration-200',
              isDark ? 'bg-[#111118] border-white/15 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className={cn('p-2.5 rounded-2xl text-amber-500', isDark ? 'bg-amber-500/10' : 'bg-amber-50')}>
                  <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                </span>
                <div>
                  <h3 className={cn('font-display font-black text-lg', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    Chi Tiết Yêu Cầu Hoàn Tiền Vé
                  </h3>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                    Đơn vé: <strong className="text-[#e8b84b] font-mono-data">{selectedRefund.ticket_code || `#${selectedRefund.reservation_id}`}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedRefund(null)
                }}
                className={cn('p-2 rounded-xl text-[#a09e9a] hover:text-[#f0ede8] transition-colors cursor-pointer', isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Section 1: Thông tin khách hàng & Phim */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className={cn('p-3.5 rounded-xl border space-y-1', isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200')}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>Khách Hàng</span>
                  </span>
                  <p className="font-bold text-sm">{selectedRefund.user_full_name || 'Khách xem phim'}</p>
                  <p className={cn('text-xs font-mono-data', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>{selectedRefund.user_email}</p>
                </div>

                <div className={cn('p-3.5 rounded-xl border space-y-1', isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200')}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bộ Phim</span>
                  </span>
                  <p className="font-bold text-sm truncate">{selectedRefund.movie_title || 'N/A'}</p>
                  <p className={cn('text-xs', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>Mã yêu cầu: #{selectedRefund.id}</p>
                </div>
              </div>

              {/* Section 2: Lý do hủy vé */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Lý Do Khách Hàng Yêu Cầu Hủy Vé:</span>
                </span>
                <div className={cn('p-3.5 rounded-xl border text-xs leading-relaxed font-medium', isDark ? 'bg-[#161622] border-white/10 text-[#f0ede8]' : 'bg-slate-100 border-slate-200 text-slate-800')}>
                  "{selectedRefund.cancellation_reason || 'Tôi không còn nhu cầu xem phim nữa'}"
                </div>
              </div>

              {/* Section 3: Thông tin tài chính & Cổng thanh toán */}
              <div className={cn('p-4 rounded-xl border space-y-3', isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/70 border-amber-200')}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500 block">
                      Số Tiền Cần Hoàn Trả:
                    </span>
                    <span className="font-display font-black text-2xl sm:text-3xl text-[#e8b84b] font-mono-data">
                      {fmt(selectedRefund.amount)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Phương thức thanh toán gốc:
                    </span>
                    {selectedRefund.payment_method === 'cash' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Tiền mặt tại rạp</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/40 inline-flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Cổng VNPay</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className={cn('pt-2.5 border-t text-xs font-mono-data space-y-1', isDark ? 'border-white/10 text-[#a09e9a]' : 'border-amber-200/60 text-slate-600')}>
                  <div className="flex justify-between">
                    <span>Mã VNPay Request ID:</span>
                    <span className="font-bold">{selectedRefund.vnp_request_id || '—'}</span>
                  </div>
                  {selectedRefund.vnpay_response_message && (
                    <div className="flex justify-between">
                      <span>Phản hồi từ VNPay:</span>
                      <span className="font-semibold text-rose-400">{selectedRefund.vnpay_response_message}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Thời điểm tạo yêu cầu:</span>
                    <span>{new Date(selectedRefund.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Xử lý thao tác (Nếu là đơn cần xử lý thủ công) */}
              {(selectedRefund.status === 'manual_required' || selectedRefund.status === 'failed') ? (
                <div className="space-y-3 pt-2">
                  <h4 className={cn('text-xs font-bold uppercase tracking-wider pb-1 border-b border-white/5 flex items-center gap-1.5', isDark ? 'text-amber-400' : 'text-amber-700')}>
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Thao Tác Xử Lý Dành Cho Quản Trị Viên</span>
                  </h4>

                  <div>
                    <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Ghi Chú Xác Nhận Chuyển Khoản Hoàn Tiền:
                    </label>
                    <input
                      type="text"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Ví dụ: Đã chuyển khoản qua ngân hàng Vietcombank mã GD 987654..."
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all',
                        isDark ? 'bg-[#09090e] border-white/15 text-[#f0ede8] focus:border-[#e8b84b]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      )}
                    />
                    <p className={cn('text-[11px] mt-1', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                      Ghi chú này sẽ được lưu vào lịch sử đối soát và gửi thông báo xác nhận đến email khách hàng.
                    </p>
                  </div>
                </div>
              ) : (
                /* Nếu đơn đã hoàn tiền thành công */
                <div className={cn('p-3.5 rounded-xl border space-y-1.5', isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Giao dịch hoàn tiền đã được hoàn tất thành công</span>
                  </div>
                  {selectedRefund.admin_note && (
                    <p className={cn('text-xs pl-6', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Ghi chú: <strong className="text-slate-300">{selectedRefund.admin_note}</strong>
                    </p>
                  )}
                  {selectedRefund.resolved_at && (
                    <p className={cn('text-[11px] pl-6 font-mono-data', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                      Thời điểm xác nhận: {new Date(selectedRefund.resolved_at).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 flex items-center justify-end gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedRefund(null)
                }}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all',
                  isDark ? 'bg-white/10 hover:bg-white/15 text-[#a09e9a]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                )}
              >
                Đóng
              </button>

              {/* Các nút hành động xử lý trong modal (chỉ hiện khi cần xử lý) */}
              {(selectedRefund.status === 'manual_required' || selectedRefund.status === 'failed') && (
                <>
                  {selectedRefund.payment_method !== 'cash' && (
                    <button
                      type="button"
                      disabled={isRetrying || isResolving}
                      onClick={handleRetryVNPay}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs disabled:opacity-50',
                        isDark ? 'bg-sky-500/15 border-sky-500/30 text-sky-400 hover:bg-sky-500/25' : 'bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100'
                      )}
                      title="Gọi lại cổng VNPay để thử hoàn tiền tự động"
                    >
                      <RotateCcw className={cn('w-3.5 h-3.5', isRetrying && 'animate-spin')} />
                      <span>{isRetrying ? 'Đang gọi VNPay...' : 'Thử Lại Qua VNPay'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isResolving || isRetrying}
                    onClick={handleConfirmResolve}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#e8b84b] hover:bg-[#dfad3e] text-[#09090e] transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Check className={cn('w-4 h-4 stroke-[2.5]', isResolving && 'animate-spin')} />
                    <span>{isResolving ? 'Đang cập nhật...' : 'Xác Nhận Đã Chuyển Khoản'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
