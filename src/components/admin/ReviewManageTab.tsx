import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquare,
  RefreshCw,
  Search,
  Film,
  CheckCircle2,
  EyeOff,
  Star,
  BadgeCheck,
  SlidersHorizontal,
  Trash2,
  X,
  User,
  Calendar,
  AlertCircle,
  Eye,
  Check,
} from 'lucide-react'
import {
  fetchAdminReviewsAPI,
  toggleApproveReviewAPI,
  deleteAdminReviewAPI,
  type AdminReviewItem,
} from '../../api/reviews'
import { cn } from '../../lib/utils'

interface ReviewManageTabProps {
  movies: Array<{ id: number; title: string }>
  notify: (type: 'success' | 'error' | 'warning', message: string) => void
}

export default function ReviewManageTab({ movies, notify }: ReviewManageTabProps) {
  const queryClient = useQueryClient()

  const [selectedMovieId, setSelectedMovieId] = useState<number | 'all'>('all')
  const [approvedFilter, setApprovedFilter] = useState<'all' | 'approved' | 'hidden' | 'verified'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  // Centered Modal State
  const [selectedReview, setSelectedReview] = useState<AdminReviewItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
        setSelectedReview(null)
        setConfirmDelete(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // API Query
  const isApprovedParam =
    approvedFilter === 'approved' ? true : approvedFilter === 'hidden' ? false : undefined

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-reviews', selectedMovieId, isApprovedParam, page],
    queryFn: () =>
      fetchAdminReviewsAPI({
        movie_id: selectedMovieId === 'all' ? undefined : selectedMovieId,
        is_approved: isApprovedParam,
        page,
        page_size: PAGE_SIZE,
      }),
    staleTime: 1000 * 30,
  })

  // Also query broad stats for KPIs
  const { data: statsData } = useQuery({
    queryKey: ['admin-reviews-stats', selectedMovieId],
    queryFn: () =>
      fetchAdminReviewsAPI({
        movie_id: selectedMovieId === 'all' ? undefined : selectedMovieId,
        page: 1,
        page_size: 100,
      }),
    staleTime: 1000 * 60,
  })

  // Calculate KPI stats
  const kpiStats = useMemo(() => {
    const list = statsData?.items || []
    let total = statsData?.total || list.length
    let approvedCount = 0
    let hiddenCount = 0
    let verifiedCount = 0

    list.forEach((rev) => {
      if (rev.is_approved) approvedCount++
      else hiddenCount++
      if (rev.is_verified_booking) verifiedCount++
    })

    return {
      total,
      approved: approvedCount,
      hidden: hiddenCount,
      verified: verifiedCount,
    }
  }, [statsData])

  // Mutations
  const toggleApproveMutation = useMutation({
    mutationFn: (vars: { reviewId: number; isApproved: boolean }) =>
      toggleApproveReviewAPI(vars.reviewId, vars.isApproved),
    onSuccess: (res, vars) => {
      notify('success', vars.isApproved ? 'Đã duyệt hiển thị bình luận thành công.' : 'Đã ẩn bình luận khỏi ứng dụng.')
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-stats'] })
      if (selectedReview && selectedReview.id === vars.reviewId) {
        setSelectedReview({ ...selectedReview, is_approved: vars.isApproved })
      }
    },
    onError: (err: any) => {
      notify('error', err?.response?.data?.detail || 'Không thể cập nhật trạng thái bình luận.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => deleteAdminReviewAPI(reviewId),
    onSuccess: () => {
      notify('success', 'Đã xóa vĩnh viễn bình luận thành công.')
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-stats'] })
      setIsModalOpen(false)
      setSelectedReview(null)
      setConfirmDelete(false)
    },
    onError: (err: any) => {
      notify('error', err?.response?.data?.detail || 'Không thể xóa bình luận.')
    },
  })

  const rawItems = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  // Client-side search and verified filter
  const filteredItems = useMemo(() => {
    let list = rawItems
    if (approvedFilter === 'verified') {
      list = list.filter((r) => r.is_verified_booking)
    }
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter((r) => {
      const u = (r.user_name || '').toLowerCase()
      const e = (r.user_email || '').toLowerCase()
      const m = (r.movie_title || '').toLowerCase()
      const c = (r.comment || '').toLowerCase()
      return u.includes(q) || e.includes(q) || m.includes(q) || c.includes(q)
    })
  }, [rawItems, searchQuery, approvedFilter])

  function handleOpenDetail(rev: AdminReviewItem) {
    setSelectedReview(rev)
    setConfirmDelete(false)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER CARD (DUY NHẤT 1 NÚT LÀM MỚI TRÊN TOÀN GIAO DIỆN) ── */}
      <div className="p-5 sm:p-6 rounded-2xl border transition-all shadow-sm bg-[#111118] border-white/10 dark:bg-[#111118]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="p-3 rounded-2xl flex items-center justify-center text-amber-500 bg-amber-500/10 border border-amber-500/20">
              <MessageSquare className="w-6 h-6 stroke-[2]" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-black text-xl sm:text-2xl text-[#f0ede8]">
                  Kiểm Duyệt Đánh Giá & Bình Luận
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Kiểm duyệt nội dung</span>
                </span>
              </div>
              <p className="text-xs mt-0.5 text-[#a09e9a]">
                Quản lý, phê duyệt hoặc ẩn các đánh giá, bình luận phim từ khán giả để đảm bảo tính văn minh cho cộng đồng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none shadow-xs bg-white/5 border-white/10 text-[#f0ede8] hover:bg-white/10"
              title="Làm mới danh sách đánh giá từ máy chủ"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
              <span>Làm Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 THẺ KPI TƯƠNG TÁC (ĐÓNG VAI TRÒ LÀ BỘ LỌC TRẠNG THÁI DUY NHẤT) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Tất Cả Đánh Giá */}
        <div
          onClick={() => {
            setApprovedFilter('all')
            setPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            approvedFilter === 'all'
              ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/10'
              : 'bg-[#111118] border-white/10 hover:border-amber-500/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-bold uppercase tracking-wider', approvedFilter === 'all' ? 'text-amber-500 font-black' : 'text-slate-300')}>
              Tất Cả Đánh Giá
            </span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', approvedFilter === 'all' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white/5 border-white/10 text-amber-500')}>
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-amber-500">
              {kpiStats.total}
            </div>
            <span className="text-[10px] font-semibold opacity-70">Toàn bộ</span>
          </div>
          <p className="text-[11px] mt-1 truncate text-[#a09e9a]">
            Tổng số đánh giá đã ghi nhận
          </p>
        </div>

        {/* KPI 2: Đang Hiển Thị (Đã Duyệt) */}
        <div
          onClick={() => {
            setApprovedFilter('approved')
            setPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            approvedFilter === 'approved'
              ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10'
              : 'bg-[#111118] border-white/10 hover:border-emerald-500/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
              Đang Hiển Thị
            </span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', approvedFilter === 'approved' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400')}>
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-emerald-400">
              {kpiStats.approved}
            </div>
            <span className="text-[10px] font-semibold text-emerald-400/80">Công khai</span>
          </div>
          <p className="text-[11px] mt-1 truncate text-[#a09e9a]">
            Xuất hiện trên ứng dụng
          </p>
        </div>

        {/* KPI 3: Đã Ẩn / Chờ Duyệt */}
        <div
          onClick={() => {
            setApprovedFilter('hidden')
            setPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            approvedFilter === 'hidden'
              ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-500/10'
              : 'bg-[#111118] border-white/10 hover:border-rose-500/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
              Đã Ẩn / Vi Phạm
            </span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', approvedFilter === 'hidden' ? 'bg-rose-500 text-slate-950 border-rose-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400')}>
              <EyeOff className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-rose-400">
              {kpiStats.hidden}
            </div>
            <span className="text-[10px] font-semibold text-rose-400/80">Không hiển thị</span>
          </div>
          <p className="text-[11px] mt-1 truncate text-[#a09e9a]">
            Nội dung bị ẩn hoặc chờ xem xét
          </p>
        </div>

        {/* KPI 4: Đã Xác Thực Mua Vé */}
        <div
          onClick={() => {
            setApprovedFilter('verified')
            setPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            approvedFilter === 'verified'
              ? 'ring-2 ring-sky-500 border-sky-500 bg-sky-500/10'
              : 'bg-[#111118] border-white/10 hover:border-sky-500/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-500">
              Đã Mua Vé
            </span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', approvedFilter === 'verified' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-sky-500/15 border-sky-500/30 text-sky-400')}>
              <BadgeCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-sky-400">
              {kpiStats.verified}
            </div>
            <span className="text-[10px] font-semibold text-sky-400/80">Xác thực</span>
          </div>
          <p className="text-[11px] mt-1 truncate text-[#a09e9a]">
            Đã thanh toán vé xem phim
          </p>
        </div>
      </div>

      {/* ── TOOLBAR: TÌM KIẾM VÀ LỌC THEO PHIM ── */}
      <div className="p-4 rounded-2xl border transition-colors shadow-xs bg-[#111118] border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a09e9a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên khán giả, email, phim, nội dung..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border text-xs outline-none transition-all bg-[#09090e] border-white/10 text-[#f0ede8] placeholder:text-[#6e6c68] focus:border-[#e8b84b]"
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

        {/* Movie Selector Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#a09e9a] flex items-center gap-1.5 whitespace-nowrap">
            <Film className="w-3.5 h-3.5 text-amber-500" />
            <span>Phim chiếu:</span>
          </span>
          <select
            value={selectedMovieId}
            onChange={(e) => {
              setSelectedMovieId(e.target.value === 'all' ? 'all' : Number(e.target.value))
              setPage(1)
            }}
            className="px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none cursor-pointer bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-amber-500 max-w-xs truncate"
          >
            <option value="all">Tất cả bộ phim</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── BẢNG DANH SÁCH ĐÁNH GIÁ (TABLE) ── */}
      <div className="border rounded-2xl overflow-hidden shadow-sm transition-colors bg-[#111118] border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="uppercase border-b text-[11px] font-bold tracking-wider bg-[#161622] text-[#f0ede8] border-white/10">
              <tr>
                <th className="p-3.5 min-w-[200px]">Khách Hàng</th>
                <th className="p-3.5 min-w-[170px] max-w-[220px]">Bộ Phim</th>
                <th className="p-3.5 min-w-[140px] text-center">Đánh Giá</th>
                <th className="p-3.5 min-w-[240px] max-w-[360px]">Nội Dung Nhận Xét</th>
                <th className="p-3.5 min-w-[130px] text-center">Trạng Thái</th>
                <th className="p-3.5 min-w-[150px] text-center">Thao Tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#a09e9a]">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
                    <p className="font-semibold text-xs">Đang tải danh sách đánh giá...</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#a09e9a]">
                    <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-amber-500 mb-2" />
                    <p className="text-sm font-bold text-slate-400">Không tìm thấy đánh giá nào phù hợp với bộ lọc</p>
                    <p className="text-xs opacity-70 mt-1">Hãy thử đổi trạng thái hoặc bộ phim đã chọn.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((rev: AdminReviewItem) => {
                  const formattedDate = new Date(rev.created_at).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <tr
                      key={rev.id}
                      className="transition-colors hover:bg-white/[0.02] text-[#f0ede8]"
                    >
                      {/* Khách hàng */}
                      <td className="p-3.5 align-middle">
                        <div className="font-bold text-xs">{rev.user_name || 'Khách xem phim'}</div>
                        <div className="text-[10px] font-mono-data text-[#a09e9a] mt-0.5">{rev.user_email}</div>
                        {rev.is_verified_booking && (
                          <span className="inline-flex items-center gap-1 mt-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/25">
                            <BadgeCheck className="w-3 h-3" />
                            <span>Đã mua vé</span>
                          </span>
                        )}
                      </td>

                      {/* Bộ phim */}
                      <td className="p-3.5 align-middle max-w-[220px]">
                        <p className="font-semibold text-xs truncate" title={rev.movie_title}>
                          {rev.movie_title}
                        </p>
                        <div className="text-[10px] font-mono-data text-[#a09e9a] mt-0.5">
                          {formattedDate}
                        </div>
                      </td>

                      {/* Đánh giá sao */}
                      <td className="p-3.5 align-middle text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-[#e8b84b]/15 text-[#e8b84b] font-mono-data font-black text-xs px-2.5 py-1 rounded-xl border border-[#e8b84b]/30">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  'w-3 h-3',
                                  s <= rev.rating ? 'fill-[#e8b84b] text-[#e8b84b]' : 'text-slate-600'
                                )}
                              />
                            ))}
                          </div>
                          <span>{rev.rating}/5</span>
                        </div>
                      </td>

                      {/* Nội dung nhận xét */}
                      <td className="p-3.5 align-middle max-w-[360px]">
                        {rev.comment ? (
                          <p className="line-clamp-2 leading-relaxed text-xs font-normal" title={rev.comment}>
                            {rev.comment}
                          </p>
                        ) : (
                          <span className="text-[#a09e9a] italic text-[11px]">(Chỉ chấm sao, không viết nhận xét)</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="p-3.5 align-middle text-center whitespace-nowrap">
                        {rev.is_approved ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Hiển thị</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            <EyeOff className="w-3 h-3" />
                            <span>Đã ẩn</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác: DUY NHẤT 1 NÚT CHO MỖI HÀNG */}
                      <td className="p-3.5 align-middle text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(rev)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#f0ede8] border border-white/10 font-bold text-xs cursor-pointer shadow-xs transition-all hover:border-[#e8b84b]/40"
                          title="Mở giao diện xem chi tiết và kiểm duyệt tại chính giữa màn hình"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                          <span>Kiểm Duyệt</span>
                        </button>
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
          <span className="text-xs font-medium text-[#a09e9a]">
            Hiển thị {(page - 1) * PAGE_SIZE + 1} – {Math.min(page * PAGE_SIZE, total)} trong tổng số{' '}
            <strong className="text-[#f0ede8]">{total}</strong> đánh giá
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white/5 border-white/10 text-[#f0ede8]"
            >
              Trước
            </button>

            <span className="text-xs font-semibold px-2 text-[#f0ede8]">
              Trang {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white/5 border-white/10 text-[#f0ede8]"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* ── CENTERED MODAL: CHI TIẾT & KIỂM DUYỆT ĐÁNH GIÁ (CHÍNH GIỮA MÀN HÌNH) ── */}
      {isModalOpen && selectedReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => {
              setIsModalOpen(false)
              setSelectedReview(null)
              setConfirmDelete(false)
            }}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border overflow-hidden animate-in zoom-in-95 fade-in duration-200 bg-[#111118] border-white/15 text-[#f0ede8]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl text-amber-500 bg-amber-500/10 border border-amber-500/20">
                  <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                </span>
                <div>
                  <h3 className="font-display font-black text-lg text-[#f0ede8]">
                    Chi Tiết & Kiểm Duyệt Đánh Giá
                  </h3>
                  <p className="text-xs mt-0.5 text-[#a09e9a]">
                    Mã đánh giá: <strong className="text-[#e8b84b] font-mono-data">#{selectedReview.id}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedReview(null)
                  setConfirmDelete(false)
                }}
                className="p-2 rounded-xl text-[#a09e9a] hover:text-[#f0ede8] hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Section 1: Thông tin người dùng & phim */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border space-y-1 bg-white/[0.02] border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>Khách Hàng Đánh Giá</span>
                  </span>
                  <p className="font-bold text-sm">{selectedReview.user_name || 'Khách xem phim'}</p>
                  <p className="text-xs font-mono-data text-[#a09e9a]">{selectedReview.user_email}</p>
                </div>

                <div className="p-3.5 rounded-xl border space-y-1 bg-white/[0.02] border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bộ Phim</span>
                  </span>
                  <p className="font-bold text-sm truncate">{selectedReview.movie_title}</p>
                  <p className="text-xs text-[#a09e9a]">
                    {new Date(selectedReview.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Section 2: Chấm sao & Huy hiệu xác thực */}
              <div className="p-4 rounded-xl border space-y-2 bg-amber-500/5 border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-[#e8b84b]/15 px-3 py-1.5 rounded-xl border border-[#e8b84b]/30">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          'w-4 h-4',
                          s <= selectedReview.rating ? 'fill-[#e8b84b] text-[#e8b84b]' : 'text-slate-600'
                        )}
                      />
                    ))}
                    <span className="font-mono-data font-black text-sm text-[#e8b84b] ml-1.5">
                      {selectedReview.rating} / 5
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-400">
                    {selectedReview.rating >= 4 ? 'Đánh giá tích cực' : selectedReview.rating >= 3 ? 'Đánh giá trung bình' : 'Đánh giá tiêu cực'}
                  </span>
                </div>

                {selectedReview.is_verified_booking ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <BadgeCheck className="w-4 h-4" />
                    <span>Đã mua vé tại CineVerse</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-400 border border-white/10">
                    <span>Đánh giá từ thành viên</span>
                  </span>
                )}
              </div>

              {/* Section 3: Toàn văn nhận xét của khán giả */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  <span>Nội Dung Bình Luận Của Khán Giả:</span>
                </span>
                <div className="p-4 rounded-xl border text-sm leading-relaxed font-normal bg-[#161622] border-white/10 text-[#f0ede8]">
                  {selectedReview.comment ? (
                    <p className="whitespace-pre-line">{selectedReview.comment}</p>
                  ) : (
                    <span className="text-[#a09e9a] italic">(Khách hàng chỉ xếp hạng sao, không để lại lời bình luận)</span>
                  )}
                </div>
              </div>

              {/* Section 4: Trạng thái duyệt hiện tại */}
              <div className="p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-white/[0.02] border-white/10">
                <div className="flex items-center gap-2.5">
                  {selectedReview.is_approved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-rose-400" />
                  )}
                  <div>
                    <p className="text-xs font-bold">
                      {selectedReview.is_approved ? 'Bình luận đang được hiển thị công khai' : 'Bình luận đang bị ẩn khỏi công chúng'}
                    </p>
                    <p className="text-[11px] text-[#a09e9a]">
                      {selectedReview.is_approved ? 'Khán giả vào trang chi tiết phim có thể đọc được đánh giá này.' : 'Chỉ có quản trị viên mới nhìn thấy đánh giá này.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 5: Xác nhận xóa (nếu bấm xóa) */}
              {confirmDelete && (
                <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Xác nhận xóa vĩnh viễn đánh giá này?</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Hành động này sẽ xóa dữ liệu đánh giá khỏi cơ sở dữ liệu và không thể hoàn tác.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(selectedReview.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? 'Đang xóa...' : 'Đồng Ý Xóa Vĩnh Viễn'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#f0ede8] font-bold text-xs cursor-pointer"
                    >
                      Hủy Bỏ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 flex items-center justify-between gap-2.5 flex-wrap">
              {/* Left Action: Xóa */}
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/30 text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Đánh Giá</span>
                </button>
              ) : <div />}

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setSelectedReview(null)
                    setConfirmDelete(false)
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all bg-white/10 hover:bg-white/15 text-[#a09e9a]"
                >
                  Đóng
                </button>

                {/* Nút Duyệt hoặc Ẩn duy nhất */}
                <button
                  type="button"
                  disabled={toggleApproveMutation.isPending}
                  onClick={() =>
                    toggleApproveMutation.mutate({
                      reviewId: selectedReview.id,
                      isApproved: !selectedReview.is_approved,
                    })
                  }
                  className={cn(
                    'flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50',
                    selectedReview.is_approved
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40'
                      : 'bg-[#e8b84b] hover:bg-[#dfad3e] text-[#09090e]'
                  )}
                >
                  {selectedReview.is_approved ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>{toggleApproveMutation.isPending ? 'Đang cập nhật...' : 'Ẩn Đánh Giá Này'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{toggleApproveMutation.isPending ? 'Đang cập nhật...' : 'Duyệt & Hiển Thị'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
