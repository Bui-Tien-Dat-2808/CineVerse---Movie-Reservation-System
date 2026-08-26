import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMovieReviewsAPI,
  fetchMyReviewAPI,
  submitReviewAPI,
  deleteMyReviewAPI,
  type ReviewItem,
} from '../../../api/reviews'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'

interface MovieReviewsSectionProps {
  movieId: number
  movieTitle: string
}

export default function MovieReviewsSection({ movieId, movieTitle }: MovieReviewsSectionProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { isAuthenticated, openAuthModal } = useAuth()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fetch movie reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['movie-reviews', movieId, page],
    queryFn: () => fetchMovieReviewsAPI(movieId, page, 10),
    staleTime: 1000 * 60 * 2,
  })

  // Fetch current user's review if logged in
  const { data: myReview } = useQuery({
    queryKey: ['my-review', movieId],
    queryFn: () => fetchMyReviewAPI(movieId),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  })

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: (vars: { rating: number; comment?: string }) =>
      submitReviewAPI(movieId, vars.rating, vars.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-reviews', movieId] })
      queryClient.invalidateQueries({ queryKey: ['my-review', movieId] })
      setIsWriteModalOpen(false)
      setErrorMsg(null)
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.detail || 'Không thể gửi đánh giá. Vui lòng thử lại.')
    },
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteMyReviewAPI(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-reviews', movieId] })
      queryClient.invalidateQueries({ queryKey: ['my-review', movieId] })
      setIsWriteModalOpen(false)
    },
  })

  function handleOpenWriteModal() {
    if (!isAuthenticated) {
      openAuthModal('login', 'Vui lòng đăng nhập để gửi đánh giá và nhận xét cho phim.')
      return
    }
    if (myReview) {
      setRating(myReview.rating)
      setComment(myReview.comment || '')
    } else {
      setRating(5)
      setComment('')
    }
    setErrorMsg(null)
    setIsWriteModalOpen(true)
  }

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    submitMutation.mutate({ rating, comment: comment.trim() || undefined })
  }

  const summary = reviewsData?.summary || {
    average_rating: 0,
    total_reviews: 0,
    rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    verified_reviews_count: 0,
  }

  const total = summary.total_reviews

  // Reorder reviews: Always pin current user's review at index 0 on top
  const displayReviews = useMemo(() => {
    if (!reviewsData?.items) return []
    const items = [...reviewsData.items]

    if (myReview) {
      const myIndex = items.findIndex((r) => r.id === myReview.id)
      if (myIndex > 0) {
        const [mine] = items.splice(myIndex, 1)
        return [mine, ...items]
      } else if (myIndex === -1 && page === 1) {
        return [myReview, ...items]
      }
    }
    return items
  }, [reviewsData?.items, myReview, page])

  return (
    <div className={`mt-10 p-6 sm:p-8 rounded-3xl border transition-colors ${
      isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Section Title */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
        isDark ? 'border-white/10' : 'border-slate-200'
      }`}>
        <div>
          <h3 className={`font-display font-black text-xl flex items-center gap-2.5 ${
            isDark ? 'text-[#f0ede8]' : 'text-slate-900'
          }`}>
            <span className="text-amber-500">⭐</span>
            <span>Đánh Giá & Nhận Xét Từ Khán Giả</span>
          </h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
            Được đóng góp và chia sẻ bởi cộng đồng người xem tại CineVerse
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenWriteModal}
          className="px-5 py-3 rounded-2xl bg-[#e8b84b] hover:bg-[#d8a83b] text-[#09090e] text-xs font-black transition-all cursor-pointer shadow-lg shadow-amber-500/15 uppercase tracking-wider flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span>✍️</span>
          <span>{myReview ? 'Sửa Đánh Giá Của Bạn' : 'Viết Đánh Giá'}</span>
        </button>
      </div>

      {/* Stats Breakdown Card */}
      <div className={`mt-6 p-6 rounded-2xl border grid grid-cols-1 md:grid-cols-12 gap-6 items-center transition-colors ${
        isDark ? 'bg-[#09090e] border-white/5' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Left: Big Score */}
        <div className={`md:col-span-4 text-center md:border-r md:pr-6 space-y-1 ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}>
          <div className="text-4xl font-display font-black text-[#e8b84b] flex items-center justify-center gap-1.5">
            <span>{summary.average_rating > 0 ? summary.average_rating.toFixed(1) : 'Chưa có'}</span>
            <span className="text-2xl text-amber-400">⭐</span>
          </div>
          <div className={`text-xs font-semibold ${
            isDark ? 'text-[#f0ede8]' : 'text-slate-700'
          }`}>
            {total > 0 ? `Dựa trên ${total} lượt đánh giá` : 'Hãy là người đầu tiên đánh giá!'}
          </div>
        </div>

        {/* Center: Rating Distribution Bars */}
        <div className="md:col-span-8 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.rating_distribution[star] || 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className={`w-8 font-mono-data font-bold flex items-center justify-end gap-0.5 shrink-0 ${
                  isDark ? 'text-[#f0ede8]' : 'text-slate-800'
                }`}>
                  {star} <span className="text-amber-400">★</span>
                </span>
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                  isDark ? 'bg-white/10' : 'bg-slate-200'
                }`}>
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`w-14 text-right text-[11px] font-mono-data shrink-0 ${
                  isDark ? 'text-[#a09e9a]' : 'text-slate-600 font-medium'
                }`}>
                  {count} ({pct}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="mt-8 space-y-4">
        {isLoading ? (
          <div className={`text-center py-12 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
            <div className="text-2xl animate-spin inline-block">⏳</div>
            <p className="text-xs mt-2">Đang tải đánh giá...</p>
          </div>
        ) : displayReviews.length === 0 ? (
          <div className={`text-center py-12 border border-dashed rounded-2xl text-xs space-y-2 ${
            isDark ? 'border-white/10 text-[#a09e9a]' : 'border-slate-300 text-slate-500'
          }`}>
            <div className="text-3xl">🎬</div>
            <p className={`font-semibold ${isDark ? 'text-[#f0ede8]' : 'text-slate-800'}`}>
              Chưa có bình luận nào cho bộ phim này.
            </p>
            <p className="text-[11px] opacity-75">Hãy là người đầu tiên chia sẻ cảm nhận của bạn sau khi xem phim!</p>
          </div>
        ) : (
          displayReviews.map((rev: ReviewItem) => {
            const isMine = myReview && rev.id === myReview.id
            const initial = rev.user?.full_name?.charAt(0).toUpperCase() || 'U'
            const formattedDate = new Date(rev.created_at).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            return (
              <div
                key={rev.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isMine
                    ? isDark
                      ? 'bg-amber-500/[0.04] border-amber-500/40 shadow-sm'
                      : 'bg-amber-50/70 border-amber-300 shadow-xs'
                    : isDark
                    ? 'bg-[#09090e] border-white/5 hover:border-white/10'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-[#09090e] font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                      {initial}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${
                          isDark ? 'text-[#f0ede8]' : 'text-slate-900'
                        }`}>
                          {rev.user?.full_name || 'Khán giả CineVerse'}
                        </span>
                        {isMine && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDark
                              ? 'bg-amber-500/20 text-[#e8b84b] border border-[#e8b84b]/40'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            Đánh giá của bạn
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] font-mono-data ${
                        isDark ? 'text-[#a09e9a]' : 'text-slate-500'
                      }`}>
                        {formattedDate}
                      </div>
                    </div>
                  </div>

                  {/* Stars Only (No duplicate edit button) */}
                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s}>{s <= rev.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className={`text-xs leading-relaxed pl-12 ${
                    isDark ? 'text-[#f0ede8]' : 'text-slate-700'
                  }`}>
                    {rev.comment}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Write/Edit Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-5 transition-colors ${
            isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}>
              <div>
                <h4 className="font-display font-bold text-base">
                  {myReview ? 'Chỉnh Sửa Đánh Giá' : 'Đánh Giá Phim'}
                </h4>
                <p className={`text-xs ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                  {movieTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                  isDark ? 'bg-white/5 hover:bg-white/15 text-[#a09e9a]' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div className="text-center space-y-2 py-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-[#e8b84b]' : 'text-amber-700'
                }`}>
                  Chọn số sao đánh giá:
                </label>
                <div className="flex items-center justify-center gap-2 text-3xl">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className={`transition-transform hover:scale-125 cursor-pointer ${
                          isFilled
                            ? 'text-amber-400'
                            : isDark
                            ? 'text-white/20'
                            : 'text-slate-300 hover:text-slate-400'
                        }`}
                      >
                        ★
                      </button>
                    )
                  })}
                </div>
                <div className={`text-xs font-mono-data font-bold ${
                  isDark ? 'text-amber-400' : 'text-amber-800'
                }`}>
                  {rating === 5 ? '⭐ 5.0 - Cực phẩm đỉnh cao' :
                   rating === 4 ? '⭐ 4.0 - Rất hay, đáng xem' :
                   rating === 3 ? '⭐ 3.0 - Bình thường, tạm ổn' :
                   rating === 2 ? '⭐ 2.0 - Dưới trung bình' : '⭐ 1.0 - Không đáng xem'}
                </div>
              </div>

              {/* Comment Text Area */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isDark ? 'text-[#a09e9a]' : 'text-slate-700'}`}>
                  Nhận xét của bạn (Tùy chọn):
                </label>
                <textarea
                  rows={4}
                  placeholder="Chia sẻ cảm nhận về diễn xuất, kịch bản, âm thanh, hình ảnh của bộ phim..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={2000}
                  className={`w-full p-3 rounded-2xl border text-xs outline-none transition-all resize-none ${
                    isDark
                      ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                />
                <div className={`text-right text-[10px] ${isDark ? 'text-[#a09e9a]' : 'text-slate-400'}`}>
                  {comment.length}/2000 ký tự
                </div>
              </div>

              {errorMsg && (
                <p className="text-rose-400 text-xs flex items-center gap-1">
                  <span>⚠️</span> {errorMsg}
                </p>
              )}

              <div className="flex gap-2.5 pt-2">
                {myReview && (
                  <button
                    type="button"
                    disabled={deleteMutation.isPending || submitMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá của mình cho bộ phim này không?')) {
                        deleteMutation.mutate()
                      }
                    }}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isDark
                        ? 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                        : 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700'
                    }`}
                  >
                    <span>🗑️</span>
                    <span>{deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDark
                      ? 'border-white/10 bg-white/5 hover:bg-white/10 text-[#a09e9a]'
                      : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending || deleteMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-[#e8b84b] hover:bg-[#d8a83b] text-[#09090e] text-xs font-black transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {submitMutation.isPending ? 'Đang lưu...' : myReview ? 'Cập Nhật' : 'Gửi Đánh Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
