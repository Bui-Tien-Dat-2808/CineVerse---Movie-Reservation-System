import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Ticket,
  ArrowLeft,
  ArrowRight,
  Play,
  Film,
  Heart,
  Sparkles,
  RotateCcw,
  AlertCircle,
  X,
  Armchair,
  Bell,
  Check,
  Clapperboard,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  Building2,
  Tag,
  ShieldCheck,
} from 'lucide-react'
import { useBooking } from '../context/BookingContext'
import { useAuth } from '../context/AuthContext'
import { useMovie } from '../hooks/useMovies'
import { useSeatMap, useShowtimes, useHoldSeats } from '../hooks/useShowtimes'
import { useTheme } from '../context/ThemeContext'
import type { SeatItem, ShowTime } from '../types'
import { fmt, getDateList, cn, normalizeInternationalName } from '../lib/utils'
import SeatMap from '../components/features/seats/SeatMap'
import SeatLegend from '../components/features/seats/SeatLegend'
import { GenreBadge } from '../components/ui/Badge'
import { useVirtualQueue } from '../hooks/useVirtualQueue'
import { WaitingRoomModal } from '../components/features/queue/WaitingRoomModal'
import { useRealtimeSeatMap, RealtimeSeatEvent } from '../hooks/useRealtimeSeatMap'
import MovieReviewsSection from '../components/features/reviews/MovieReviewsSection'

function formatYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildTrailerEmbedUrl(url: string): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('autoplay', '1')
    parsed.searchParams.set('rel', '0')
    return parsed.toString()
  } catch {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}autoplay=1&rel=0`
  }
}

export default function CineVerseMovieView() {
  const { id } = useParams<{ id: string }>()
  const movieId = id ? Number(id) : null
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { isAuthenticated, openAuthModal } = useAuth()

  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false)
  const synopsisRef = useRef<HTMLParagraphElement>(null)
  const [needsExpandButton, setNeedsExpandButton] = useState(false)
  const [holdError, setHoldError] = useState<string | null>(null)

  const {
    inQueue,
    rank,
    totalWaiting,
    estimatedWaitSeconds,
    enterQueue,
    leaveQueue,
  } = useVirtualQueue()

  const {
    state,
    selectMovie,
    selectDate,
    selectShowtime,
    toggleSeat,
    calculateTotalPrice,
    reset,
  } = useBooking()

  // Fetch real movie details
  const { data: apiMovie, isLoading: isLoadingMovie } = useMovie(movieId)
  const movie = apiMovie ?? state.selectedMovie

  useEffect(() => {
    if (synopsisRef.current) {
      const isOverflowing = synopsisRef.current.scrollHeight > synopsisRef.current.clientHeight + 2
      setNeedsExpandButton(isOverflowing)
    }
  }, [movie?.synopsis, isSynopsisExpanded])

  // Fetch showtimes for this movie
  const {
    data: showtimes,
    isLoading: isLoadingShowtimes,
    isError: isErrorShowtimes,
    refetch: refetchShowtimes,
  } = useShowtimes(movieId)

  const { user } = useAuth()

  // Fetch real seat map from backend when showtime is selected
  const {
    data: seatMap,
    isLoading: isLoadingSeatMap,
    isFetching: isFetchingSeatMap,
    isError: isErrorSeatMap,
    refetch: refetchSeatMap,
  } = useSeatMap(state.selectedShowtime)

  const isSeatMapMatching = seatMap?.showtime_id === state.selectedShowtime?.id
  const isSeatMapLoading = isLoadingSeatMap || isFetchingSeatMap || (!isSeatMapMatching && !!state.selectedShowtime)

  // Real-time seat map synchronization via WebSockets
  useRealtimeSeatMap(state.selectedShowtime?.id, (event: RealtimeSeatEvent) => {
    console.log('⚡ [CineVerseMovieView] Realtime seat event received:', event)
    refetchSeatMap()
  })

  // Calculate realtime total price
  const currentTotalPrice = calculateTotalPrice(seatMap?.seats)

  // Sync selectedMovie 1 time when movie changes
  useEffect(() => {
    if (apiMovie && state.selectedMovie?.id !== apiMovie.id) {
      selectMovie(apiMovie)
    }
  }, [apiMovie, state.selectedMovie?.id, selectMovie])

  // Auto-select showtime if passed in URL ?showtime=123
  const [searchParams] = useSearchParams()
  const urlShowtimeId = searchParams.get('showtime')

  useEffect(() => {
    if (urlShowtimeId && showtimes && showtimes.length > 0) {
      const targetId = Number(urlShowtimeId)
      const found = showtimes.find((st) => st.id === targetId)
      if (found && state.selectedShowtime?.id !== found.id) {
        selectShowtime(found)
      }
    }
  }, [urlShowtimeId, showtimes, selectShowtime, state.selectedShowtime?.id])

  // Extract valid date list from showtimes or default to next 7 days
  const { dateStrs, dateObjects } = useMemo(() => {
    const todayStr = formatYYYYMMDD(new Date())
    if (!showtimes || showtimes.length === 0) {
      const default7 = getDateList(7)
      return {
        dateStrs: default7.map(formatYYYYMMDD),
        dateObjects: default7,
      }
    }

    const set = new Set<string>()
    for (const st of showtimes) {
      if (st.date && st.date >= todayStr) {
        set.add(st.date)
      }
    }

    const sortedStrs = Array.from(set).sort()
    if (sortedStrs.length === 0) {
      const default7 = getDateList(7)
      return {
        dateStrs: default7.map(formatYYYYMMDD),
        dateObjects: default7,
      }
    }

    const objects = sortedStrs.map((dStr) => {
      const [y, m, d] = dStr.split('-').map(Number)
      return new Date(y, m - 1, d)
    })

    return {
      dateStrs: sortedStrs,
      dateObjects: objects,
    }
  }, [showtimes])

  // Ensure safe date index
  const safeDateIdx = state.selectedDate < dateObjects.length ? state.selectedDate : 0
  const selectedDateStr = dateStrs[safeDateIdx] || dateStrs[0]

  // Filter showtimes for the selected date & future times
  const displayShowtimes = useMemo(() => {
    const safeList = Array.isArray(showtimes) ? showtimes : []
    const nowMs = Date.now()

    return safeList.filter((st) => {
      if (st.date !== selectedDateStr) return false
      const stTimeMs = new Date(`${st.date}T${st.time}:00`).getTime()
      return stTimeMs > nowMs
    })
  }, [showtimes, selectedDateStr])

  // Auto-select first available showtime when date changes or if none selected
  useEffect(() => {
    if (displayShowtimes.length > 0) {
      const isCurrentValid = state.selectedShowtime && displayShowtimes.some((st) => st.id === state.selectedShowtime?.id)
      if (!isCurrentValid) {
        selectShowtime(displayShowtimes[0])
      }
    }
  }, [displayShowtimes, state.selectedShowtime, selectShowtime])

  // Group showtimes by room type
  const groupedShowtimes = useMemo(() => {
    const map = new Map<string, ShowTime[]>()
    const sorted = [...displayShowtimes].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    for (const st of sorted) {
      const typeKey = st.type || 'Standard'
      if (!map.has(typeKey)) {
        map.set(typeKey, [])
      }
      map.get(typeKey)!.push(st)
    }

    const priority = ['IMAX', '4DX', 'VIP', '3D', 'Kids', 'Standard']
    const result: Array<{ type: string; list: ShowTime[] }> = []

    for (const p of priority) {
      if (map.has(p)) {
        result.push({ type: p, list: map.get(p)! })
        map.delete(p)
      }
    }

    map.forEach((list, type) => {
      result.push({ type, list })
    })

    return result
  }, [displayShowtimes])

  // Map seat key ("B8", "C10", etc.) to SeatItem or price calculation
  const seatItemMap = useMemo(() => {
    const map = new Map<string, SeatItem>()
    if (seatMap?.seats) {
      seatMap.seats.forEach((s) => map.set(`${s.row_label}${s.col_number}`, s))
    }
    return map
  }, [seatMap?.seats])

  // Map selected seats to details for the "Selected Tickets" section
  const selectedTicketsList = useMemo(() => {
    const sortedKeys = Array.from(state.selectedSeats).sort()
    return sortedKeys.map((key) => {
      const item = seatItemMap.get(key)
      const rowLabel = key.charAt(0)
      const colNumber = key.slice(1)
      const seatType = item?.seat_type ?? (rowLabel === 'A' || rowLabel === 'B' ? 'vip' : 'standard')
      
      let price = item?.price
      if (!price && state.selectedShowtime) {
        const isVip = rowLabel === 'A' || rowLabel === 'B'
        price = isVip
          ? (state.selectedShowtime.vipPrice ?? (state.selectedShowtime.price ? state.selectedShowtime.price * 1.3 : 120000))
          : state.selectedShowtime.price
      }

      return {
        key,
        rowLabel,
        colNumber,
        seatType,
        price: price || 0,
      }
    })
  }, [state.selectedSeats, seatItemMap, state.selectedShowtime])

  function handleBack() {
    reset()
    if (movie?.status === 'coming_soon') {
      navigate('/sap-ra-mat')
    } else {
      navigate('/')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const holdSeatsMutation = useHoldSeats()

  async function handleContinueToCheckout() {
    if (!state.selectedShowtime || state.selectedSeats.size === 0) return

    if (!isAuthenticated) {
      openAuthModal('login', 'Vui lòng đăng ký hoặc đăng nhập tài khoản trước khi mua vé xem phim!')
      return
    }

    setHoldError(null)

    if (seatMap && seatMap.seats) {
      const labelToIdMap = new Map<string, number>()
      seatMap.seats.forEach((s) => labelToIdMap.set(`${s.row_label}${s.col_number}`, s.seat_id))
      const seatIds = Array.from(state.selectedSeats)
        .map((label) => labelToIdMap.get(label))
        .filter((id): id is number => id !== undefined)

      if (seatIds.length > 0) {
        const showtimeId = state.selectedShowtime.id
        if (showtimeId !== undefined) {
          try {
            await holdSeatsMutation.mutateAsync({ showtimeId, seatIds })
          } catch (e: unknown) {
            const rawDetail = (e as { response?: { data?: { detail?: any } } })?.response?.data?.detail
            let msg = 'Ghế bạn chọn đã được người khác giữ hoặc đặt. Vui lòng chọn ghế khác!'
            if (typeof rawDetail === 'string') {
              msg = rawDetail
            } else if (Array.isArray(rawDetail)) {
              msg = rawDetail.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
            } else if (rawDetail && typeof rawDetail === 'object') {
              msg = rawDetail.message || JSON.stringify(rawDetail)
            }
            setHoldError(msg)
            return // Block navigation — do NOT proceed to checkout
          }
        }
      }
    }

    navigate(`/movie/${movie!.id}/checkout`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Loading state for movie detail
  if (isLoadingMovie) {
    return (
      <div className="max-w-[1340px] mx-auto px-4 py-24 text-center font-mono-data text-xs text-amber-400 animate-pulse flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        <span>Đang tải thông tin phim và suất chiếu rạp CineVerse...</span>
      </div>
    )
  }

  // Not found state
  if (!movie) {
    return (
      <div className="max-w-[1340px] mx-auto px-4 py-20 text-center">
        <div className={cn(
          'p-12 max-w-md mx-auto rounded-3xl border shadow-2xl space-y-4',
          isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200 shadow-xl'
        )}>
          <Film className="w-14 h-14 mx-auto text-amber-500 opacity-60" />
          <h2 className={cn('font-display font-bold text-2xl', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
            Không Tìm Thấy Phim
          </h2>
          <p className={cn('text-xs', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
            Phim không tồn tại hoặc đã ngừng chiếu trên toàn hệ thống.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="w-full bg-amber-500 text-slate-950 py-3 rounded-xl font-bold text-xs cursor-pointer hover:bg-amber-400 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang chủ</span>
          </button>
        </div>
      </div>
    )
  }

  const todayStr = formatYYYYMMDD(new Date())

  return (
    <div className="max-w-[1340px] mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* Top Header Navigation Row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={handleBack}
          className={cn(
            'inline-flex items-center gap-2 bg-transparent border-0 text-xs font-bold cursor-pointer transition-colors w-fit px-3 py-1.5 rounded-xl',
            isDark ? 'text-[#a09e9a] hover:text-[#f0ede8] hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{movie.status === 'coming_soon' ? 'Quay lại Phim Sắp Chiếu' : 'Quay lại Danh Sách Phim'}</span>
        </button>
      </div>

      {/* Main Unified Container with Ambient Glow */}
      <div className={cn(
        'relative overflow-hidden rounded-3xl border p-5 sm:p-7 md:p-8 shadow-2xl transition-colors duration-200',
        isDark
          ? 'bg-[#0e0e16]/95 border-white/10 text-[#f0ede8] backdrop-blur-xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      )}>
        {/* Subtle Ambient Background Artwork Glow */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cover bg-center opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundImage: `url(${movie.img})` }}
        />

        {/* Main Content Layout: Dedicated Coming Soon View vs Now Showing View */}
        {movie.status === 'coming_soon' ? (
          <div className="space-y-8 relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Poster with Release Date overlay */}
              <div className="flex-shrink-0 w-48 sm:w-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#14141e] aspect-[2/3] relative group mx-auto md:mx-0">
                <img
                  src={movie.img}
                  alt={`Poster phim ${movie.title}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5 font-mono-data">
                  <Clapperboard className="w-3.5 h-3.5" />
                  <span>SẮP RA MẮT</span>
                </div>
              </div>

              {/* Detailed Coming Soon Content */}
              <div className="flex-1 space-y-5 w-full">
                <div className="flex gap-2 flex-wrap">
                  {movie.genre.map((g) => (
                    <GenreBadge key={g} label={g} />
                  ))}
                </div>

                <h1 className={cn('font-display text-3xl sm:text-4xl font-black leading-tight tracking-tight', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                  {movie.title}
                </h1>

                <div className={cn('flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono-data', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                  {movie.year > 0 && <span>Năm phát hành: {movie.year}</span>}
                  {movie.duration && movie.duration !== 'N/A' && <span>• Thời lượng: {movie.duration}</span>}
                  {movie.rating && <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">• Độ tuổi: {movie.rating}</span>}
                </div>

                {/* Director & Cast info box */}
                <div className={cn('space-y-3 p-4 rounded-2xl border text-xs', isDark ? 'bg-[#12121a] border-white/10' : 'bg-slate-50 border-slate-200')}>
                  {movie.director && (
                    <div>
                      <span className={cn('font-bold block mb-1 flex items-center gap-1.5', isDark ? 'text-amber-400' : 'text-amber-800')}>
                        <Clapperboard className="w-3.5 h-3.5 text-amber-500" />
                        <span>ĐẠO DIỄN:</span>
                      </span>
                      <span className={cn('font-semibold text-sm', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>{normalizeInternationalName(movie.director)}</span>
                    </div>
                  )}

                  {movie.cast && movie.cast.length > 0 && (
                    <div>
                      <span className={cn('font-bold block mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5', isDark ? 'text-amber-400' : 'text-amber-800')}>
                        <Users className="w-3.5 h-3.5 text-amber-500" />
                        <span>DIỄN VIÊN CHÍNH:</span>
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {movie.cast.map((actor, idx) => {
                          const rawName = typeof actor === 'string' ? actor : actor.name
                          const name = normalizeInternationalName(rawName)
                          const char = typeof actor === 'object' ? actor.character : null
                          const photo = typeof actor === 'object' ? actor.profile_url : null

                          return (
                            <div
                              key={name + idx}
                              className={cn(
                                'flex items-center gap-2.5 p-2 pr-3.5 rounded-2xl border transition-all shadow-xs',
                                isDark ? 'bg-[#181826] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-800'
                              )}
                            >
                              {photo ? (
                                <img
                                  src={photo}
                                  alt={name}
                                  className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                                  {name.charAt(0)}
                                </div>
                              )}
                              <div className="text-left leading-tight">
                                <div className="font-bold text-xs line-clamp-1">{name}</div>
                                {char && (
                                  <div className={cn('text-[10px] line-clamp-1 opacity-75 font-mono-data', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                                    {char}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Extended Synopsis */}
                <div className="space-y-2">
                  <h3 className={cn('font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                    <Film className="w-3.5 h-3.5 text-amber-500" />
                    <span>Nội dung phim</span>
                  </h3>
                  <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#f0ede8]/90' : 'text-slate-700')}>
                    {movie.synopsis || 'Nội dung bộ phim đang được cập nhật.'}
                  </p>
                </div>

                {/* Action Buttons Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                  {movie.trailerUrl ? (
                    <button
                      type="button"
                      onClick={() => setIsTrailerOpen(true)}
                      className="px-5 py-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 hover:scale-105 transition-all text-xs font-bold cursor-pointer flex items-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Xem Trailer HD</span>
                    </button>
                  ) : (
                    <div className={cn('px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 opacity-80', isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-500')}>
                      <Film className="w-4 h-4" />
                      <span>Trailer chưa được cập nhật</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsSubscribed(!isSubscribed)}
                    className={cn(
                      'px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 shadow-md',
                      isSubscribed
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-500 text-slate-950 border-amber-500 hover:bg-amber-400 hover:shadow-[0_4px_16px_rgba(232,184,75,0.3)]'
                    )}
                  >
                    {isSubscribed ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã đăng ký nhận thông báo</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        <span>Nhận thông báo mở bán vé</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full View for Now Showing Movies */
          <div className="space-y-8 relative z-10">
            
            {/* 1. EXPANDED MOVIE OVERVIEW (FULL WIDTH HERO CARD) */}
            <article className={cn('p-6 sm:p-7 rounded-3xl border space-y-6 shadow-xl transition-all', isDark ? 'bg-[#12121a]/90 border-white/10' : 'bg-white border-slate-200')}>
              {/* Top Meta Header: Large Poster + Details */}
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                {/* Poster */}
                <div className="flex-shrink-0 w-36 sm:w-44 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#14141e] aspect-[2/3] relative group mx-auto sm:mx-0">
                  <img
                    src={movie.img}
                    alt={`Poster phim ${movie.title}`}
                    className="w-full h-full object-cover"
                  />
                  {movie.rating && movie.rating !== 'N/A' && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-black text-xs rounded-lg px-2 py-0.5 shadow-lg z-10 font-mono-data">
                      {movie.rating}
                    </div>
                  )}
                </div>

                {/* Essential Meta: Title, Genres, Duration, Director, Cast, Trailer CTA */}
                <div className="flex-1 min-w-0 space-y-3 w-full text-center sm:text-left">
                  <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                    {movie.genre.map((g) => (
                      <GenreBadge key={g} label={g} />
                    ))}
                  </div>

                  <h1 className={cn('font-display text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    {movie.title}
                  </h1>

                  <div className={cn('flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs sm:text-sm font-mono-data', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                    {movie.duration && movie.duration !== 'N/A' && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-amber-500 inline" />
                        <span>{movie.duration}</span>
                      </span>
                    )}
                    {movie.year > 0 && <span className="text-slate-400">• Năm: {movie.year}</span>}
                  </div>

                  {movie.director && (
                    <div className={cn('text-xs sm:text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5', isDark ? 'text-zinc-300' : 'text-slate-700')}>
                      <Clapperboard className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-amber-500 font-bold">Đạo diễn:</span>
                      <span>{normalizeInternationalName(movie.director)}</span>
                    </div>
                  )}

                  {/* Cast Row */}
                  {movie.cast && movie.cast.length > 0 && (
                    <div className="pt-1.5 space-y-1.5">
                      <span className={cn('font-bold block text-xs uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5', isDark ? 'text-amber-400' : 'text-amber-800')}>
                        <Users className="w-3.5 h-3.5 text-amber-500" />
                        <span>DIỄN VIÊN CHÍNH:</span>
                      </span>
                      <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-amber-500/30">
                        {movie.cast.map((actor, idx) => {
                          const rawName = typeof actor === 'string' ? actor : actor.name
                          const name = normalizeInternationalName(rawName)
                          const char = typeof actor === 'object' ? actor.character : null
                          const photo = typeof actor === 'object' ? actor.profile_url : null

                          return (
                            <div
                              key={name + idx}
                              className={cn(
                                'flex-shrink-0 flex items-center gap-2.5 p-2 pr-3.5 rounded-2xl border transition-all text-xs shadow-sm',
                                isDark ? 'bg-[#181826] border-white/10 text-[#f0ede8]' : 'bg-slate-50 border-slate-200 text-slate-800'
                              )}
                            >
                              {photo ? (
                                <img
                                  src={photo}
                                  alt={name}
                                  className="w-9 h-9 rounded-xl object-cover border border-white/10 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                  {name.charAt(0)}
                                </div>
                              )}
                              <div className="text-left leading-tight">
                                <div className="font-bold text-xs whitespace-nowrap">{name}</div>
                                {char && (
                                  <div className={cn('text-[10px] whitespace-nowrap opacity-75 font-mono-data', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                                    {char}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {movie.trailerUrl && (
                    <div className="pt-2 flex justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => setIsTrailerOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 hover:scale-105 transition-all text-xs font-bold cursor-pointer shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Xem Trailer HD</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Synopsis Block (Full Width) */}
              {movie.synopsis && (
                <div className="pt-4 border-t border-white/10 space-y-1.5">
                  <span className={cn('font-bold block mb-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                    <Film className="w-3.5 h-3.5 text-amber-500" />
                    <span>NỘI DUNG PHIM:</span>
                  </span>
                  <p
                    ref={synopsisRef}
                    className={cn('text-xs sm:text-sm leading-relaxed transition-all', isDark ? 'text-[#f0ede8]/90' : 'text-slate-700', !isSynopsisExpanded && 'line-clamp-3')}
                  >
                    {movie.synopsis}
                  </p>
                  {(needsExpandButton || isSynopsisExpanded) && (
                    <button
                      type="button"
                      onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                      className="text-xs font-bold text-amber-400 hover:underline cursor-pointer pt-1 inline-flex items-center gap-1"
                    >
                      {isSynopsisExpanded ? (
                        <>
                          <span>Thu gọn</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Xem thêm</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </article>

            {/* 2. BOOKING WORKFLOW (2-COLUMN GRID: SHOWTIME PICKER & SEAT MAP SIDE-BY-SIDE) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

              {/* LEFT COLUMN: Date Picker + Showtime Picker + Selected Tickets + Total & Buy */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                
                {/* Date Selector Header Bar */}
                <section aria-label="Chọn ngày chiếu" className={cn(
                  'p-5 rounded-2xl border space-y-3',
                  isDark ? 'bg-[#12121c] border-white/10 shadow-lg' : 'bg-slate-50 border-slate-200'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <h2 className={cn('font-display text-xs font-bold uppercase tracking-wider', isDark ? 'text-amber-400' : 'text-amber-800')}>
                      Chọn ngày chiếu
                    </h2>
                  </div>

                  <fieldset className="border-0 p-0 m-0">
                    <legend className="sr-only">Danh sách ngày chiếu</legend>
                    <div className="flex flex-wrap gap-2.5 py-1">
                      {dateObjects.map((d, i) => {
                        const isToday = formatYYYYMMDD(d) === todayStr
                        const active = safeDateIdx === i
                        const dayNum = d.getDate()
                        const dayOfWeek = isToday ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' })

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectDate(i)}
                            aria-pressed={active}
                            className={cn(
                              'flex-shrink-0 min-w-[70px] px-3 py-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer',
                              active
                                ? isDark
                                  ? 'border-amber-500 bg-amber-500/20 text-amber-400 font-bold shadow-[0_0_15px_rgba(232,184,75,0.25)] scale-105'
                                  : 'border-amber-500 bg-amber-500/10 text-amber-800 font-bold shadow-md scale-105'
                                : isDark
                                  ? 'border-white/10 bg-[#12121a] text-[#a09e9a] hover:border-white/20 hover:text-[#f0ede8] hover:bg-white/[0.04]'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                            )}
                          >
                            <div className="text-[10px] font-medium uppercase tracking-wider mb-0.5 opacity-80">
                              {dayOfWeek}
                            </div>
                            <div className="font-mono-data text-lg font-extrabold leading-none">
                              {dayNum}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                </section>

                {/* Showtime Picker */}
                <section aria-label="Chọn giờ chiếu" className={cn(
                  'p-5 rounded-2xl border space-y-3',
                  isDark ? 'bg-[#12121c] border-white/10 shadow-lg' : 'bg-slate-50 border-slate-200'
                )}>
                  <div className="flex items-center justify-between">
                    <h2 className={cn('font-display text-xs font-bold uppercase tracking-wider flex items-center gap-2', isDark ? 'text-amber-400' : 'text-amber-800')}>
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Suất chiếu</span>
                    </h2>
                    {isLoadingShowtimes && (
                      <span className="font-mono-data text-[11px] text-amber-400 animate-pulse">
                        Đang tải...
                      </span>
                    )}
                  </div>

                  {isLoadingShowtimes ? (
                    <div className={cn('py-6 text-center text-xs font-mono-data animate-pulse', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                      Đang kiểm tra lịch chiếu...
                    </div>
                  ) : isErrorShowtimes ? (
                    <div className={cn('py-4 px-3 text-center text-xs rounded-xl border space-y-2', isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700')}>
                      <p>Không thể tải suất chiếu từ máy chủ.</p>
                      <button
                        type="button"
                        onClick={() => refetchShowtimes()}
                        className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold text-xs cursor-pointer hover:bg-amber-400 inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Thử lại</span>
                      </button>
                    </div>
                  ) : displayShowtimes.length === 0 ? (
                    <div className={cn('py-8 px-4 text-center text-xs font-mono-data rounded-xl border flex flex-col items-center justify-center gap-2', isDark ? 'bg-[#0e0e15] border-white/5 text-[#a09e9a]' : 'bg-white border-slate-200 text-slate-500')}>
                      <Film className="w-8 h-8 opacity-40 text-amber-500" />
                      <span>Chưa có suất chiếu cho ngày này. Vui lòng chọn ngày khác.</span>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2 scrollbar-thin">
                      {groupedShowtimes.map(({ type, list }) => (
                        <div key={type} className="space-y-2">
                          <div className={cn('text-[11px] font-mono-data font-bold uppercase tracking-wide flex items-center justify-between', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-amber-500" />
                              <span>Phòng {type}</span>
                            </span>
                            <span>{list.length} suất</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-0.5">
                            {list.map((st) => {
                              const isSelected = state.selectedShowtime?.id === st.id

                              return (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={async () => {
                                    selectShowtime(st)
                                    if (st.id) {
                                      await enterQueue(st.id)
                                    }
                                  }}
                                  aria-pressed={isSelected}
                                  className={cn(
                                    'flex flex-col items-center justify-center p-2.5 rounded-xl border text-center cursor-pointer transition-all duration-150',
                                    isSelected
                                      ? isDark
                                        ? 'border-amber-500 bg-amber-500/20 text-amber-400 font-bold shadow-[0_0_12px_rgba(232,184,75,0.3)] scale-[1.03]'
                                        : 'border-amber-500 bg-amber-100 text-amber-950 font-bold shadow-md scale-[1.03]'
                                      : isDark
                                        ? 'border-white/10 bg-[#181824] text-[#f0ede8] hover:border-white/20 hover:bg-white/[0.08]'
                                        : 'border-slate-200 bg-white text-slate-800 hover:border-amber-400 hover:bg-amber-50/60'
                                  )}
                                >
                                  <span className={cn(
                                    'text-[10px] font-mono-data font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1',
                                    isSelected
                                      ? isDark
                                        ? 'bg-amber-500/25 text-amber-400 border border-amber-500/40'
                                        : 'bg-amber-200 text-amber-950 font-extrabold'
                                      : isDark
                                        ? 'bg-white/10 text-[#a09e9a] border border-white/5'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  )}>
                                    {st.hall || `Phòng ${st.type}`}
                                  </span>

                                  <span className="font-mono-data text-sm sm:text-base font-extrabold">{st.time}</span>

                                  <span className={cn('text-[10px] opacity-80 font-mono-data mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                                    {fmt(st.price)}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Selected Tickets List */}
                <section aria-label="Danh sách vé đã chọn" className={cn(
                  'p-5 rounded-2xl border space-y-3',
                  isDark ? 'bg-[#12121c] border-white/10 shadow-lg' : 'bg-slate-50 border-slate-200'
                )}>
                  <div className="flex items-center justify-between">
                    <h2 className={cn('font-display text-xs font-bold uppercase tracking-wider flex items-center gap-2', isDark ? 'text-amber-400' : 'text-amber-800')}>
                      <Ticket className="w-4 h-4 text-amber-500" />
                      <span>Vé đã chọn</span>
                    </h2>
                    <span className={cn('font-mono-data text-xs font-bold px-2 py-0.5 rounded-full', isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-300')}>
                      {selectedTicketsList.length} ghế
                    </span>
                  </div>

                  {selectedTicketsList.length === 0 ? (
                    <div className={cn('py-4 text-center text-xs font-mono-data', isDark ? 'text-[#6e6c68]' : 'text-slate-500')}>
                      Vui lòng chọn ghế trên sơ đồ bên phải
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {selectedTicketsList.map((t) => (
                        <div
                          key={t.key}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-xl border transition-all text-xs',
                            isDark ? 'bg-[#181826] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono-data font-extrabold text-sm text-amber-400">
                              {t.rowLabel}
                            </span>
                            <span className="font-mono-data font-bold">
                              ghế {t.colNumber}
                            </span>
                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full uppercase font-bold flex items-center gap-1 border',
                              t.seatType === 'couple'
                                ? 'bg-pink-500/20 text-pink-400 border-pink-500/30'
                                : t.seatType === 'vip'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-white/10 text-[#a09e9a] border-white/5'
                            )}>
                              {t.seatType === 'couple' ? (
                                <>
                                  <span>Đôi</span>
                                  <Heart className="w-2.5 h-2.5 fill-current" />
                                </>
                              ) : t.seatType === 'vip' ? (
                                'VIP'
                              ) : (
                                'Thường'
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono-data font-bold text-xs text-emerald-400">
                              {fmt(t.price)}
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleSeat(t.key)}
                              className="text-[#a09e9a] hover:text-rose-400 text-sm font-bold cursor-pointer p-0.5 leading-none transition-colors"
                              title={`Bỏ chọn ghế ${t.key}`}
                              aria-label={`Bỏ chọn ghế ${t.key}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Hold Error Banner */}
                {holdError && (
                  <div className="flex items-start gap-2.5 bg-rose-950/30 border border-rose-500/40 text-rose-300 rounded-xl px-4 py-3 text-xs font-medium animate-pulse">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{holdError}</span>
                    <button
                      type="button"
                      onClick={() => setHoldError(null)}
                      className="ml-auto shrink-0 text-rose-400/60 hover:text-rose-300 font-bold cursor-pointer leading-none"
                      aria-label="Đóng thông báo lỗi"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Total Price & Buy CTA */}
                <div className={cn(
                  'pt-4 border-t flex items-center justify-between gap-4',
                  isDark ? 'border-white/10' : 'border-slate-200'
                )}>
                  <div>
                    <span className={cn('text-[11px] font-mono-data uppercase tracking-wider block', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                      Tổng tiền
                    </span>
                    <span className="font-display font-black text-2xl sm:text-3xl text-emerald-400">
                      {fmt(currentTotalPrice)}
                    </span>
                  </div>

                  <button
                    type="button"
                    id="buy-tickets-btn"
                    onClick={handleContinueToCheckout}
                    disabled={!state.selectedShowtime || state.selectedSeats.size === 0}
                    className={cn(
                      'px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg inline-flex items-center gap-2',
                      state.selectedShowtime && state.selectedSeats.size > 0
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 hover:shadow-[0_6px_24px_rgba(232,184,75,0.4)] hover:-translate-y-0.5 active:translate-y-0 font-black'
                        : isDark
                          ? 'bg-white/10 text-[#6e6c68] cursor-not-allowed opacity-50'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    )}
                  >
                    <span>Mua vé</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* RIGHT COLUMN: Interactive Seat Map (Aligned side-by-side with Left Column) */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                {/* Seat Map Container */}
                <section aria-label="Sơ đồ chọn ghế" className={cn(
                  'p-4 sm:p-6 rounded-3xl border min-h-[420px] flex flex-col justify-center shadow-xl',
                  isDark ? 'bg-[#0f0f18] border-white/10' : 'bg-slate-50 border-slate-200'
                )}>
                  {!state.selectedShowtime ? (
                    <div className={cn('py-24 text-center font-mono-data text-xs space-y-3', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                      <Armchair className="w-12 h-12 mx-auto text-zinc-600" />
                      <p>Vui lòng chọn một suất chiếu ở cột bên trái để hiển thị sơ đồ ghế.</p>
                    </div>
                  ) : isErrorSeatMap ? (
                    <div className={cn('py-12 text-center text-xs space-y-3 rounded-xl border p-4', isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700')}>
                      <p>Không thể tải sơ đồ ghế từ hệ thống.</p>
                      <button
                        type="button"
                        onClick={() => refetchSeatMap()}
                        className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg font-bold text-xs cursor-pointer hover:bg-amber-400 inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Thử lại</span>
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 pb-2">
                      <SeatMap
                        selectedSeats={state.selectedSeats}
                        onToggle={toggleSeat}
                        seats={isSeatMapMatching ? seatMap?.seats : undefined}
                        isLoading={isSeatMapLoading}
                        onRetry={() => refetchSeatMap()}
                      />
                    </div>
                  )}
                </section>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Movie Reviews & Community Ratings */}
      {movieId && movie && (
        <MovieReviewsSection movieId={movieId} movieTitle={movie.title} />
      )}

      {/* Trailer Modal */}
      {isTrailerOpen && movie?.trailerUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setIsTrailerOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#111118] border border-white/20 rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-[#f0ede8] flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span>Trailer: {movie.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTrailerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors text-xs font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10">
              <iframe
                src={buildTrailerEmbedUrl(movie.trailerUrl)}
                title={`Trailer ${movie.title}`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
      {/* Virtual Queue Waiting Room Modal */}
      <WaitingRoomModal
        isOpen={inQueue}
        rank={rank}
        totalWaiting={totalWaiting}
        estimatedWaitSeconds={estimatedWaitSeconds}
        movieTitle={movie?.title}
        showtimeStr={state.selectedShowtime ? `${state.selectedShowtime.hall || ''} (${state.selectedShowtime.time})` : undefined}
        onLeaveQueue={() => {
          if (state.selectedShowtime?.id) {
            leaveQueue(state.selectedShowtime.id)
          }
        }}
      />
    </div>
  )
}
