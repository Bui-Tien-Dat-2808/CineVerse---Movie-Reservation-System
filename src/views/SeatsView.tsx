import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { useSeatMap } from '../hooks/useShowtimes'
import { useMovie } from '../hooks/useMovies'
import { useTheme } from '../context/ThemeContext'
import SeatMap from '../components/features/seats/SeatMap'
import SeatLegend from '../components/features/seats/SeatLegend'
import SeatSummaryBar from '../components/features/seats/SeatSummaryBar'

export default function SeatsView() {
  const { id } = useParams<{ id: string }>()
  const movieId = id ? Number(id) : null
  const navigate = useNavigate()
  const { state, calculateTotalPrice, toggleSeat } = useBooking()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { data: fetchedMovie } = useMovie(state.selectedMovie ? null : movieId)
  const movie = state.selectedMovie ?? fetchedMovie
  const showtime = state.selectedShowtime

  // Fetch real seat map from backend when showtime is available
  const { data: seatMap, isLoading: isLoadingSeatMap } = useSeatMap(showtime)

  const currentTotalPrice = calculateTotalPrice(seatMap?.seats)

  // Guard: redirect safely if showtime or movie is missing
  useEffect(() => {
    if (!movie || !showtime) {
      navigate(movie ? `/movie/${movie.id}` : '/', { replace: true })
    }
  }, [movie, showtime, navigate])

  if (!movie || !showtime) {
    return null
  }

  function handleContinue() {
    if (state.selectedSeats.size === 0) return
    navigate(`/movie/${movie!.id}/checkout`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10 pb-20">
      {/* Back */}
      <button
        onClick={() => navigate(`/movie/${movie.id}`)}
        className={`flex items-center gap-1.5 bg-transparent border-0 text-sm cursor-pointer mb-6 transition-colors ${
          isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900 font-bold'
        }`}
      >
        ← Quay lại
      </button>

      {/* Heading */}
      <div className="text-center mb-10">
        <p className={`font-mono-data text-[11px] tracking-[2px] uppercase mb-2 ${isDark ? 'text-[#6e6c68]' : 'text-slate-600 font-bold'}`}>
          {movie.title} · {showtime.time} · {showtime.hall}
        </p>
        <h2 className={`font-display text-[28px] font-bold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>Chọn ghế ngồi</h2>
      </div>

      <SeatMap
        selectedSeats={state.selectedSeats}
        onToggle={toggleSeat}
        seats={seatMap?.seats}
        isLoading={isLoadingSeatMap}
      />

      <SeatLegend />

      <SeatSummaryBar
        selectedSeats={state.selectedSeats}
        showtime={showtime}
        totalPrice={currentTotalPrice}
        onContinue={handleContinue}
      />
    </div>
  )
}
