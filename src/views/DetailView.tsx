import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useBooking } from '../context/BookingContext'
import { useMovie } from '../hooks/useMovies'
import { useShowtimes } from '../hooks/useShowtimes'
import type { ShowTime } from '../types'
import MovieInfo from '../components/features/detail/MovieInfo'
import ShowtimePicker from '../components/features/detail/ShowtimePicker'

export default function DetailView() {
  const { id } = useParams<{ id: string }>()
  const movieId = id ? Number(id) : null
  const navigate = useNavigate()
  const { state, selectMovie, selectDate, selectShowtime, clearSeats, reset } = useBooking()

  // Fetch movie detail from API
  const { data: apiMovie, isLoading: isLoadingMovie, isError } = useMovie(movieId)
  const movie = apiMovie ?? state.selectedMovie

  // Fetch showtimes for this movie
  const { data: showtimes, isLoading: isLoadingShowtimes, isError: isErrorShowtimes, refetch: refetchShowtimes } = useShowtimes(movieId)

  // Chỉ set selectedMovie 1 lần khi chuyển sang phim mới (tránh reset selectedShowtime)
  useEffect(() => {
    if (apiMovie && state.selectedMovie?.id !== apiMovie.id) {
      selectMovie(apiMovie)
    }
  }, [apiMovie, state.selectedMovie?.id, selectMovie])

  if (isLoadingMovie) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center font-mono-data text-xs text-[#a09e9a] animate-pulse">
        ⏳ Đang tải thông tin phim...
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center">
        <div className="bg-[#111118] border border-white/10 rounded-2xl p-12 max-w-md mx-auto shadow-2xl space-y-4">
          <span className="text-5xl block">🎬</span>
          <h2 className="font-display font-bold text-2xl text-[#f0ede8]">Không Tìm Thấy Phim</h2>
          <p className="text-xs text-[#a09e9a]">Phim không tồn tại hoặc đã bị gỡ khỏi hệ thống.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#e8b84b] text-[#09090e] py-2.5 rounded-lg font-bold text-xs cursor-pointer"
          >
            Trở Về Trang Chủ
          </button>
        </div>
      </div>
    )
  }

  function handleSelectSeats() {
    if (!state.selectedShowtime) return
    clearSeats()
    navigate(`/movie/${movie!.id}/seats`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleShowtimeChange(st: ShowTime) {
    selectShowtime(st)
  }

  function handleBackToHome() {
    reset()
    navigate('/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 pb-20">
      {/* Back */}
      <button
        type="button"
        onClick={handleBackToHome}
        className="flex items-center gap-1.5 bg-transparent border-0 text-[#a09e9a] text-sm cursor-pointer mb-8 hover:text-[#f0ede8] transition-colors"
      >
        ← Quay lại
      </button>

      {/* Movie info */}
      <div className="mb-10">
        <MovieInfo movie={movie} />
      </div>

      {/* Showtime picker */}
      <div className="max-w-[700px]">
        <ShowtimePicker
          selectedDate={state.selectedDate}
          selectedShowtime={state.selectedShowtime}
          showtimes={showtimes}
          onDateChange={selectDate}
          onShowtimeChange={handleShowtimeChange}
          onSelectSeats={handleSelectSeats}
          isLoading={isLoadingShowtimes}
          isError={isErrorShowtimes}
          onRetry={refetchShowtimes}
        />
      </div>
    </div>
  )
}
