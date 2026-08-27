import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAdminReviewsAPI,
  toggleApproveReviewAPI,
  deleteAdminReviewAPI,
  type AdminReviewItem,
} from '../../api/reviews'
import { useTheme } from '../../context/ThemeContext'

interface ReviewManageTabProps {
  movies: Array<{ id: number; title: string }>
  notify: (type: 'success' | 'error', message: string) => void
}

export default function ReviewManageTab({ movies, notify }: ReviewManageTabProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const queryClient = useQueryClient()

  const [selectedMovieId, setSelectedMovieId] = useState<number | 'all'>('all')
  const [approvedFilter, setApprovedFilter] = useState<'all' | 'approved' | 'hidden'>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', selectedMovieId, approvedFilter, page],
    queryFn: () =>
      fetchAdminReviewsAPI({
        movie_id: selectedMovieId === 'all' ? undefined : selectedMovieId,
        is_approved: approvedFilter === 'all' ? undefined : approvedFilter === 'approved',
        page,
        page_size: 20,
      }),
    staleTime: 1000 * 60,
  })

  const toggleApproveMutation = useMutation({
    mutationFn: (vars: { reviewId: number; isApproved: boolean }) =>
      toggleApproveReviewAPI(vars.reviewId, vars.isApproved),
    onSuccess: (res) => {
      notify('success', res.message)
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
    onError: (err: any) => {
      notify('error', err?.response?.data?.detail || 'Không thể cập nhật trạng thái bình luận.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => deleteAdminReviewAPI(reviewId),
    onSuccess: (res) => {
      notify('success', res.message || 'Đã xóa bình luận')
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
    onError: (err: any) => {
      notify('error', err?.response?.data?.detail || 'Không thể xóa bình luận.')
    },
  })

  const items = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Bar */}
      <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className={`font-display font-black text-lg flex items-center gap-2 ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
              <span>💬</span>
              <span>Kiểm Duyệt Đánh Giá & Bình Luận Khán Giả</span>
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
              Quản lý, duyệt hoặc ẩn các đánh giá không phù hợp từ người dùng trên toàn hệ thống ({total} đánh giá)
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Movie Filter */}
            <select
              value={selectedMovieId}
              onChange={(e) => {
                setSelectedMovieId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                setPage(1)
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
                isDark ? 'bg-[#09090e] border-white/10 text-[#f0ede8]' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value="all">🎬 Tất cả bộ phim</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>

            {/* Approval Status Filter */}
            <div className={`flex rounded-xl border p-0.5 text-xs font-bold ${
              isDark ? 'bg-[#09090e] border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              {(['all', 'approved', 'hidden'] as const).map((st) => {
                const isActive = approvedFilter === st
                const label = st === 'all' ? 'Tất cả' : st === 'approved' ? '🟢 Đã duyệt' : '🔴 Đã ẩn'
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setApprovedFilter(st)
                      setPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#e8b84b] text-[#09090e] shadow-sm'
                          : 'bg-white text-slate-900 shadow-sm'
                        : isDark
                        ? 'text-[#a09e9a] hover:text-[#f0ede8]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
        {isLoading ? (
          <div className="text-center py-16 text-[#a09e9a]">
            <div className="text-2xl animate-spin inline-block">⏳</div>
            <p className="text-xs mt-2 font-medium">Đang tải danh sách đánh giá...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-xs text-[#a09e9a] space-y-2">
            <div className="text-3xl">💬</div>
            <p className={`font-semibold ${isDark ? 'text-[#f0ede8]' : 'text-slate-800'}`}>Không tìm thấy đánh giá nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b font-mono-data font-bold uppercase tracking-wider text-[11px] ${
                  isDark ? 'border-white/10 text-[#a09e9a] bg-[#09090e]/50' : 'border-slate-200 text-slate-500 bg-slate-50'
                }`}>
                  <th className="py-3.5 px-4">Khách hàng</th>
                  <th className="py-3.5 px-4">Bộ phim</th>
                  <th className="py-3.5 px-4 text-center">Đánh giá</th>
                  <th className="py-3.5 px-4">Nội dung nhận xét</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className={`font-medium ${isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-200'}`}>
                {items.map((rev: AdminReviewItem) => {
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
                      className={`transition-colors ${
                        isDark ? 'hover:bg-white/5 text-[#f0ede8]' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      {/* User */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold">{rev.user_name}</div>
                        <div className="text-[11px] font-mono-data text-[#a09e9a]">{rev.user_email}</div>
                        {rev.is_verified_booking && (
                          <span className="inline-block mt-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.2 rounded-full border border-emerald-500/20">
                            ✓ Đã mua vé
                          </span>
                        )}
                      </td>

                      {/* Movie */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-bold">{rev.movie_title}</span>
                        <div className="text-[10px] font-mono-data text-[#a09e9a]">{formattedDate}</div>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-[#e8b84b]/15 text-[#e8b84b] font-mono-data font-black text-xs px-2.5 py-1 rounded-xl border border-[#e8b84b]/30">
                          {rev.rating} ⭐
                        </span>
                      </td>

                      {/* Comment */}
                      <td className="py-4 px-4 max-w-xs sm:max-w-md">
                        {rev.comment ? (
                          <p className="line-clamp-2 leading-relaxed text-xs">
                            {rev.comment}
                          </p>
                        ) : (
                          <span className="text-[#a09e9a] italic text-[11px]">(Chỉ chấm sao, không viết nhận xét)</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {rev.is_approved ? (
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            🟢 Hiển thị
                          </span>
                        ) : (
                          <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            🔴 Đã ẩn
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleApproveMutation.mutate({
                                reviewId: rev.id,
                                isApproved: !rev.is_approved,
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              rev.is_approved
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {rev.is_approved ? 'Ẩn' : 'Duyệt'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN đánh giá của "${rev.user_name}" không?`)) {
                                deleteMutation.mutate(rev.id)
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all cursor-pointer border border-rose-500/30"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
