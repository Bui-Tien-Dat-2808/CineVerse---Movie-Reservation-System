import { useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { useMovie } from '../hooks/useMovies'
import { useSeatMap, useShowtimes, useHoldSeats } from '../hooks/useShowtimes'
import { useTheme } from '../context/ThemeContext'
import type { SeatItem, ShowTime } from '../types'
import { fmt, getDateList, cn } from '../lib/utils'
import SeatMap from '../components/features/seats/SeatMap'
import SeatLegend from '../components/features/seats/SeatLegend'
import { GenreBadge } from '../components/ui/Badge'

function formatYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CineVerseMovieView() {
  const { id } = useParams<{ id: string }>()
  const movieId = id ? Number(id) : null
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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

  // Fetch showtimes for this movie
  const {
    data: showtimes,
    isLoading: isLoadingShowtimes,
    isError: isErrorShowtimes,
    refetch: refetchShowtimes,
  } = useShowtimes(movieId)

  // Fetch real seat map from backend when showtime is selected
  const {
    data: seatMap,
    isLoading: isLoadingSeatMap,
    isError: isErrorSeatMap,
    refetch: refetchSeatMap,
  } = useSeatMap(state.selectedShowtime)

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

  function handleBackToHome() {
    reset()
    navigate('/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const holdSeatsMutation = useHoldSeats()

  async function handleContinueToCheckout() {
    if (!state.selectedShowtime || state.selectedSeats.size === 0) return

    if (seatMap && seatMap.seats) {
      const labelToIdMap = new Map<string, number>()
      seatMap.seats.forEach((s) => labelToIdMap.set(`${s.row_label}${s.col_number}`, s.seat_id))
      const seatIds = Array.from(state.selectedSeats)
        .map((label) => labelToIdMap.get(label))
        .filter((id): id is number => id !== undefined)

      if (seatIds.length > 0) {
        try {
          await holdSeatsMutation.mutateAsync({ showtimeId: state.selectedShowtime.id, seatIds })
        } catch (e) {
          // If not logged in yet or already held, proceed to checkout page safely
        }
      }
    }

    navigate(`/movie/${movie!.id}/checkout`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Loading state for movie detail
  if (isLoadingMovie) {
    return (
      <div className="max-w-[1340px] mx-auto px-4 py-20 text-center font-mono-data text-xs text-[#e8b84b] animate-pulse">
        ⏳ Đang tải thông tin phim và suất chiếu...
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
          <span className="text-5xl block">🎬</span>
          <h2 className={cn('font-display font-bold text-2xl', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
            Không Tìm Thấy Phim
          </h2>
          <p className={cn('text-xs', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
            Phim không tồn tại hoặc đã bị gỡ khỏi hệ thống.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full bg-[#e8b84b] text-[#09090e] py-3 rounded-xl font-bold text-xs cursor-pointer hover:bg-[#f5c759] transition-all"
          >
            Trở Về Trang Chủ
          </button>
        </div>
      </div>
    )
  }

  const todayStr = formatYYYYMMDD(new Date())

  return (
    <div className="max-w-[1340px] mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={handleBackToHome}
          className={cn(
            'inline-flex items-center gap-2 bg-transparent border-0 text-sm font-semibold cursor-pointer transition-colors w-fit',
            isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900'
          )}
        >
          ← Quay lại trang chủ
        </button>
      </div>

      {/* Main Unified Container */}
      <div className={cn(
        'rounded-3xl border p-5 sm:p-7 md:p-9 shadow-2xl transition-colors duration-200',
        isDark
          ? 'bg-[#0b0b12]/95 border-white/10 text-[#f0ede8] backdrop-blur-xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      )}>

        {/* Date Selector Header Bar (Top Row in CineVerse design) */}
        <section aria-label="Chọn ngày chiếu" className="mb-8 border-b pb-6 border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📅</span>
            <h2 className={cn('font-display text-sm font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
              Chọn ngày chiếu
            </h2>
          </div>

          <fieldset className="border-0 p-0 m-0">
            <legend className="sr-only">Danh sách ngày chiếu</legend>
            <div className="flex flex-wrap gap-2.5 sm:gap-3 py-1">
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
                      'flex-shrink-0 min-w-[76px] px-4 py-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer',
                      active
                        ? isDark
                          ? 'border-[#e8b84b] bg-[rgba(232,184,75,0.15)] text-[#e8b84b] font-bold shadow-[0_0_15px_rgba(232,184,75,0.25)] scale-105'
                          : 'border-amber-500 bg-amber-500/10 text-amber-700 font-bold shadow-md scale-105'
                        : isDark
                          ? 'border-white/10 bg-[#12121a] text-[#a09e9a] hover:border-white/20 hover:text-[#f0ede8] hover:bg-white/[0.04]'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    )}
                  >
                    <div className="text-[11px] font-medium uppercase tracking-wider mb-1 opacity-80">
                      {dayOfWeek}
                    </div>
                    <div className="font-mono-data text-xl font-extrabold leading-none">
                      {dayNum}
                    </div>
                  </button>
                )
              })}
            </div>
          </fieldset>
        </section>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* LEFT COLUMN: Movie Info + Showtime + Selected Tickets + Total & Buy */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            
            {/* 1. Movie Overview */}
            <article className="space-y-4">
              <div className="flex gap-5">
                {/* Poster */}
                <div className="flex-shrink-0 w-28 sm:w-36 rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-[#14141e] aspect-[2/3]">
                  <img
                    src={movie.img}
                    alt={`Poster phim ${movie.title}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {movie.genre.map((g) => (
                      <GenreBadge key={g} label={g} />
                    ))}
                  </div>

                  <h1 className={cn('font-display text-2xl sm:text-3xl font-black leading-tight tracking-tight', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    {movie.title}
                  </h1>

                  <div className={cn('flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono-data', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                    {movie.year > 0 && <span>{movie.year}</span>}
                    {movie.duration && movie.duration !== 'N/A' && <span>• {movie.duration}</span>}
                    {movie.director && <span>• Đạo diễn: {movie.director}</span>}
                  </div>

                  <p className={cn('text-xs leading-relaxed line-clamp-3 pt-1', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                    {movie.synopsis || 'Nội dung phim đang được cập nhật.'}
                  </p>
                </div>
              </div>
            </article>

            {/* 2. Showtime Picker (Selected Time) */}
            <section aria-label="Chọn giờ chiếu" className={cn(
              'p-5 rounded-2xl border space-y-3',
              isDark ? 'bg-[#12121c] border-white/10' : 'bg-slate-50 border-slate-200'
            )}>
              <div className="flex items-center justify-between">
                <h2 className={cn('font-display text-xs font-bold uppercase tracking-wider flex items-center gap-2', isDark ? 'text-[#e8b84b]' : 'text-amber-700')}>
                  <span>⏰ Suất chiếu</span>
                </h2>
                {isLoadingShowtimes && (
                  <span className="font-mono-data text-[11px] text-[#e8b84b] animate-pulse">
                    Đang tải...
                  </span>
                )}
              </div>

              {isLoadingShowtimes ? (
                <div className={cn('py-6 text-center text-xs font-mono-data animate-pulse', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  ⏳ Đang kiểm tra lịch chiếu...
                </div>
              ) : isErrorShowtimes ? (
                <div className={cn('py-4 px-3 text-center text-xs rounded-xl border space-y-2', isDark ? 'bg-red-950/20 border-red-800/40 text-red-400' : 'bg-red-50 border-red-200 text-red-700')}>
                  <p>⚠ Không thể tải suất chiếu từ máy chủ.</p>
                  <button
                    type="button"
                    onClick={() => refetchShowtimes()}
                    className="px-3 py-1 bg-[#e8b84b] text-[#09090e] rounded-lg font-bold text-xs cursor-pointer hover:bg-[#f5c759]"
                  >
                    🔄 Thử lại
                  </button>
                </div>
              ) : displayShowtimes.length === 0 ? (
                <div className={cn('py-6 px-3 text-center text-xs font-mono-data rounded-xl border', isDark ? 'bg-[#0e0e15] border-white/5 text-[#a09e9a]' : 'bg-white border-slate-200 text-slate-500')}>
                  🍿 Chưa có suất chiếu cho ngày này. Vui lòng chọn ngày khác.
                </div>
              ) : (
                <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2 scrollbar-thin">
                  {groupedShowtimes.map(({ type, list }) => (
                    <div key={type} className="space-y-2">
                      <div className={cn('text-[11px] font-mono-data font-bold uppercase tracking-wide flex items-center justify-between', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                        <span>Phòng {type}</span>
                        <span>{list.length} suất</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-0.5">
                        {list.map((st) => {
                          const isSelected = state.selectedShowtime?.id === st.id

                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => selectShowtime(st)}
                              aria-pressed={isSelected}
                              className={cn(
                                'flex flex-col items-center justify-center p-2.5 rounded-xl border text-center cursor-pointer transition-all duration-150',
                                isSelected
                                  ? isDark
                                    ? 'border-[#e8b84b] bg-[rgba(232,184,75,0.2)] text-[#e8b84b] font-bold shadow-[0_0_12px_rgba(232,184,75,0.3)] scale-[1.03]'
                                    : 'border-amber-500 bg-amber-100 text-amber-900 font-bold shadow-md scale-[1.03]'
                                  : isDark
                                    ? 'border-white/10 bg-[#181824] text-[#f0ede8] hover:border-white/20 hover:bg-white/[0.08]'
                                    : 'border-slate-200 bg-white text-slate-800 hover:border-amber-400 hover:bg-amber-50/60'
                              )}
                            >
                              <span className={cn(
                                'text-[10px] font-mono-data font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1',
                                isSelected
                                  ? isDark
                                    ? 'bg-[#e8b84b]/25 text-[#e8b84b] border border-[#e8b84b]/40'
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

            {/* 3. Selected Tickets List */}
            <section aria-label="Danh sách vé đã chọn" className={cn(
              'p-5 rounded-2xl border space-y-3',
              isDark ? 'bg-[#12121c] border-white/10' : 'bg-slate-50 border-slate-200'
            )}>
              <div className="flex items-center justify-between">
                <h2 className={cn('font-display text-xs font-bold uppercase tracking-wider flex items-center gap-2', isDark ? 'text-[#e8b84b]' : 'text-amber-700')}>
                  <span>🎟️ Vé đã chọn</span>
                </h2>
                <span className={cn('font-mono-data text-xs font-bold px-2 py-0.5 rounded', isDark ? 'bg-white/10 text-[#e8b84b]' : 'bg-amber-100 text-amber-900')}>
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
                        isDark ? 'bg-[#181826] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono-data font-extrabold text-sm text-[#e8b84b]">
                          {t.rowLabel}
                        </span>
                        <span className="font-mono-data font-bold">
                          ghế {t.colNumber}
                        </span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded uppercase font-bold',
                          t.seatType === 'couple'
                            ? 'bg-pink-500/20 text-pink-400'
                            : t.seatType === 'vip'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-white/10 text-[#a09e9a]'
                        )}>
                          {t.seatType === 'couple' ? 'Đôi 💑' : t.seatType === 'vip' ? 'VIP' : 'Thường'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono-data font-bold text-xs text-[#e8b84b]">
                          {fmt(t.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSeat(t.key)}
                          className="text-[#a09e9a] hover:text-red-400 text-sm font-bold cursor-pointer p-0.5 leading-none transition-colors"
                          title={`Bỏ chọn ghế ${t.key}`}
                          aria-label={`Bỏ chọn ghế ${t.key}`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 4. Total Price & Buy CTA */}
            <div className={cn(
              'pt-4 border-t flex items-center justify-between gap-4',
              isDark ? 'border-white/10' : 'border-slate-200'
            )}>
              <div>
                <span className={cn('text-[11px] font-mono-data uppercase tracking-wider block', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  Tổng tiền
                </span>
                <span className="font-display font-black text-2xl sm:text-3xl text-[#e8b84b]">
                  {fmt(currentTotalPrice)}
                </span>
              </div>

              <button
                type="button"
                id="buy-tickets-btn"
                onClick={handleContinueToCheckout}
                disabled={!state.selectedShowtime || state.selectedSeats.size === 0}
                className={cn(
                  'px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg',
                  state.selectedShowtime && state.selectedSeats.size > 0
                    ? 'bg-[#e8b84b] text-[#09090e] hover:bg-[#f5c759] hover:shadow-[0_6px_24px_rgba(232,184,75,0.4)] hover:-translate-y-0.5 active:translate-y-0'
                    : isDark
                      ? 'bg-white/10 text-[#6e6c68] cursor-not-allowed opacity-50'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                )}
              >
                Mua vé →
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Seat Map & Legend */}
          <div className="lg:col-span-7 flex flex-col space-y-4">

            {/* Seat Legend (Moved to Top for Easy Visibility) */}
            <div className={cn(
              'p-3.5 rounded-2xl border flex items-center justify-between shadow-xs',
              isDark ? 'bg-[#0f0f18] border-white/10' : 'bg-slate-50 border-slate-200'
            )}>
              <SeatLegend />
            </div>

            {/* Seat Map Container */}
            <section aria-label="Sơ đồ chọn ghế" className={cn(
              'p-4 sm:p-6 rounded-2xl border min-h-[380px] flex flex-col justify-center',
              isDark ? 'bg-[#0f0f18] border-white/10' : 'bg-slate-50 border-slate-200'
            )}>
              {!state.selectedShowtime ? (
                <div className={cn('py-20 text-center font-mono-data text-xs space-y-2', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  <span className="text-3xl block mb-2">👈</span>
                  <p>Vui lòng chọn một suất chiếu ở cột bên trái để hiển thị sơ đồ ghế.</p>
                </div>
              ) : isErrorSeatMap ? (
                <div className={cn('py-12 text-center text-xs space-y-3 rounded-xl border p-4', isDark ? 'bg-red-950/20 border-red-800/40 text-red-400' : 'bg-red-50 border-red-200 text-red-700')}>
                  <p>⚠ Không thể tải sơ đồ ghế từ hệ thống.</p>
                  <button
                    type="button"
                    onClick={() => refetchSeatMap()}
                    className="px-4 py-2 bg-[#e8b84b] text-[#09090e] rounded-lg font-bold text-xs cursor-pointer hover:bg-[#f5c759]"
                  >
                    🔄 Thử lại
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 pb-2">
                  <SeatMap
                    selectedSeats={state.selectedSeats}
                    onToggle={toggleSeat}
                    seats={seatMap?.seats}
                    isLoading={isLoadingSeatMap}
                  />
                </div>
              )}
            </section>

          </div>

        </div>

      </div>
    </div>
  )
}
