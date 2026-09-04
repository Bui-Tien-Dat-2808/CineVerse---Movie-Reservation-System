import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Star,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Film,
  AlertCircle,
  X,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import {
  fetchMovieReviewsAPI,
  fetchMyReviewAPI,
  submitReviewAPI,
  deleteMyReviewAPI,
  type ReviewItem,
} from '../../../api/reviews'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { cn } from '../../../lib/utils'

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

  const totalPages = Math.ceil(total / 10) || 1

  return (
    <section aria-label="Đánh giá từ khán giả" className={cn(
      'mt-10 p-6 sm:p-8 rounded-3xl border transition-colors shadow-xl',
      isDark ? 'bg-[#0e0e16]/95 border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
    )}>
      {/* Section Header */}
      <div className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b',
        isDark ? 'border-white/10' : 'border-slate-200'
      )}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <h3 className={cn('font-display font-black text-xl tracking-tight', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
              Đánh Giá & Nhận Xét Từ Khán Giả
            </h3>
          </div>
          <p className={cn('text-xs', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
            Được đóng góp và chia sẻ bởi cộng đồng người xem tại CineVerse
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenWriteModal}
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-lg shadow-amber-500/20 uppercase tracking-wider flex items-center justify-center gap-2 self-start sm:self-auto hover:-translate-y-0.5 active:translate-y-0"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>{myReview ? 'Sửa Đánh Giá Của Bạn' : 'Viết Đánh Giá'}</span>
        </button>
      </div>

      {/* Stats Breakdown Card */}
      <div className={cn(
        'mt-6 p-6 rounded-2xl border grid grid-cols-1 md:grid-cols-12 gap-6 items-center transition-colors shadow-xs',
        isDark ? 'bg-[#12121a] border-white/5' : 'bg-slate-50 border-slate-200'
      )}>
        {/* Left: Big Score */}
        <div className={cn(
          'md:col-span-4 text-center md:border-r md:pr-6 space-y-1.5',
          isDark ? 'border-white/10' : 'border-slate-200'
        )}>
          <div className="text-5xl font-display font-black text-amber-400 flex items-center justify-center gap-2">
            <span>{summary.average_rating > 0 ? summary.average_rating.toFixed(1) : 'Chưa có'}</span>
            <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
          </div>
          <div className={cn('text-xs font-semibold', isDark ? 'text-[#f0ede8]' : 'text-slate-700')}>
            {total > 0 ? `Dựa trên ${total} lượt đánh giá thực tế` : 'Hãy là người đầu tiên đánh giá bộ phim!'}
          </div>
          {summary.verified_reviews_count > 0 && (
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{summary.verified_reviews_count} người xem đã mua vé</span>
            </div>
          )}
        </div>

        {/* Center: Rating Distribution Bars */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.rating_distribution[star] || 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className={cn(
                  'w-10 font-mono-data font-bold flex items-center justify-end gap-1 shrink-0',
                  isDark ? 'text-[#f0ede8]' : 'text-slate-800'
                )}>
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className={cn(
                  'flex-1 h-2 rounded-full overflow-hidden',
                  isDark ? 'bg-white/10' : 'bg-slate-200'
                )}>
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={cn(
                  'w-16 text-right text-[11px] font-mono-data shrink-0',
                  isDark ? 'text-[#a09e9a]' : 'text-slate-600 font-medium'
                )}>
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
          <div className={cn('text-center py-14 font-mono-data text-xs space-y-3 animate-pulse', isDark ? 'text-amber-400' : 'text-amber-700')}>
            <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
            <p>Đang tải danh sách đánh giá từ khán giả...</p>
          </div>
        ) : displayReviews.length === 0 ? (
          <div className={cn(
            'text-center py-14 border border-dashed rounded-2xl text-xs space-y-3',
            isDark ? 'border-white/10 text-[#a09e9a]' : 'border-slate-300 text-slate-500'
          )}>
            <Film className="w-10 h-10 mx-auto text-amber-500 opacity-40" />
            <p className={cn('font-bold text-sm', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
              Chưa có bình luận nào cho bộ phim này.
            </p>
            <p className="text-[11px] opacity-75">Hãy là người đầu tiên chia sẻ cảm nhận của bạn sau khi thưởng thức phim!</p>
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
                className={cn(
                  'p-4 sm:p-5 rounded-2xl border transition-all text-xs',
                  isMine
                    ? isDark
                      ? 'bg-amber-500/[0.06] border-amber-500/40 shadow-sm'
                      : 'bg-amber-50/80 border-amber-300 shadow-xs'
                    : isDark
                    ? 'bg-[#12121a] border-white/5 hover:border-white/15'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                )}
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                      {initial}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn('font-bold text-xs', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                          {rev.user?.full_name || 'Khán giả CineVerse'}
                        </span>
                        {isMine && (
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border',
                            isDark
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          )}>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đánh giá của bạn</span>
                          </span>
                        )}
                      </div>
                      <div className={cn('text-[11px] font-mono-data flex items-center gap-1 mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                        <Calendar className="w-3 h-3 text-amber-500 inline" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Star Rating Badge */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          'w-3.5 h-3.5',
                          s <= rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : isDark
                            ? 'text-white/20'
                            : 'text-slate-300'
                        )}
                      />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className={cn('text-xs leading-relaxed pl-12 pt-1 font-normal', isDark ? 'text-[#f0ede8]/90' : 'text-slate-700')}>
                    "{rev.comment}"
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 mt-6 border-t border-white/10">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cn(
              'px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1',
              page <= 1
                ? 'opacity-40 cursor-not-allowed border-transparent'
                : isDark
                ? 'border-white/10 bg-white/5 hover:bg-white/10 text-[#f0ede8]'
                : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-800'
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Trước</span>
          </button>
          <span className="font-mono-data text-xs px-3 font-bold text-amber-400">
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cn(
              'px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1',
              page >= totalPages
                ? 'opacity-40 cursor-not-allowed border-transparent'
                : isDark
                ? 'border-white/10 bg-white/5 hover:bg-white/10 text-[#f0ede8]'
                : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-800'
            )}
          >
            <span>Sau</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Write / Edit Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={cn(
            'w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-5 transition-colors',
            isDark ? 'bg-[#111118] border-white/15 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
          )}>
            <div className={cn('flex items-center justify-between border-b pb-4', isDark ? 'border-white/10' : 'border-slate-200')}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base">
                    {myReview ? 'Chỉnh Sửa Đánh Giá' : 'Đánh Giá Phim'}
                  </h4>
                  <p className={cn('text-xs line-clamp-1', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                    {movieTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors',
                  isDark ? 'bg-white/5 hover:bg-white/15 text-[#a09e9a]' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                )}
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div className="text-center space-y-2.5 py-2">
                <label className={cn('text-xs font-bold uppercase tracking-wider block', isDark ? 'text-amber-400' : 'text-amber-800')}>
                  Chọn số sao đánh giá:
                </label>
                <div className="flex items-center justify-center gap-2.5 text-3xl">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-125 cursor-pointer p-1"
                        aria-label={`Đánh giá ${star} sao`}
                      >
                        <Star
                          className={cn(
                            'w-8 h-8 transition-colors',
                            isFilled
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                              : isDark
                              ? 'text-white/20'
                              : 'text-slate-300 hover:text-slate-400'
                          )}
                        />
                      </button>
                    )
                  })}
                </div>
                <div className={cn('text-xs font-mono-data font-bold py-1 px-3 rounded-full inline-block border',
                  isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-900 border-amber-200'
                )}>
                  {rating === 5 ? '5.0 ★ Cực phẩm đỉnh cao' :
                   rating === 4 ? '4.0 ★ Rất hay, đáng xem' :
                   rating === 3 ? '3.0 ★ Bình thường, tạm ổn' :
                   rating === 2 ? '2.0 ★ Dưới trung bình' : '1.0 ★ Không đáng xem'}
                </div>
              </div>

              {/* Comment Text Area */}
              <div className="space-y-1.5">
                <label className={cn('text-xs font-bold flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  <span>Nhận xét của bạn (Tùy chọn):</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Chia sẻ cảm nhận về diễn xuất, kịch bản, âm thanh, hình ảnh của bộ phim..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={2000}
                  className={cn(
                    'w-full p-3.5 rounded-2xl border text-xs outline-none transition-all resize-none leading-relaxed',
                    isDark
                      ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-amber-400'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  )}
                />
                <div className={cn('text-right text-[10px] font-mono-data', isDark ? 'text-[#a09e9a]' : 'text-slate-400')}>
                  {comment.length}/2000 ký tự
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 bg-rose-950/30 border border-rose-500/40 text-rose-300 p-3 rounded-xl text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
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
                    className={cn(
                      'px-4 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
                      isDark
                        ? 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                        : 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700'
                    )}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className={cn(
                    'flex-1 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                    isDark
                      ? 'border-white/10 bg-white/5 hover:bg-white/10 text-[#a09e9a]'
                      : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                  )}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending || deleteMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{submitMutation.isPending ? 'Đang lưu...' : myReview ? 'Cập Nhật' : 'Gửi Đánh Giá'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
