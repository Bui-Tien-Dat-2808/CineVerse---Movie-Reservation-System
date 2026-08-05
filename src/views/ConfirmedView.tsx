import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { getDateList } from '../lib/utils'

const BOOKING_CODE = 'CVN-' + Math.random().toString(36).slice(2, 8).toUpperCase()
const DATES = getDateList(7)

export default function ConfirmedView() {
  const navigate = useNavigate()
  const { state, reset } = useBooking()

  // Guard: must have a completed booking
  useEffect(() => {
    if (!state.selectedMovie || !state.selectedShowtime || state.selectedSeats.size === 0) {
      navigate('/', { replace: true })
    }
  }, [state.selectedMovie, state.selectedShowtime, state.selectedSeats.size, navigate])

  if (!state.selectedMovie || !state.selectedShowtime || state.selectedSeats.size === 0) {
    return null
  }

  const { selectedMovie: movie, selectedShowtime: showtime, selectedDate, selectedSeats } = state

  const ticketInfo = [
    ['Ngày chiếu', DATES[selectedDate].toLocaleDateString('vi-VN')],
    ['Suất chiếu', showtime.time],
    ['Rạp / Phòng', showtime.hall],
    ['Loại phòng', showtime.type],
    ['Ghế', [...selectedSeats].sort().join(', ')],
    ['Mã đặt vé', BOOKING_CODE],
  ]

  function handleReset() {
    reset()
    navigate('/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-[560px] mx-auto px-6 py-20 text-center">
      {/* Success icon */}
      <div
        className="rounded-full bg-[rgba(232,184,75,0.15)] border-2 border-[#e8b84b] flex items-center justify-center mx-auto mb-7 text-3xl"
        style={{ width: 72, height: 72 }}
      >
        ✓
      </div>

      <h2 className="font-display text-[36px] font-black tracking-tight mb-3">
        Đặt vé thành công!
      </h2>
      <p className="text-[#a09e9a] text-[15px] leading-relaxed mb-8">
        Vé của bạn cho <strong className="text-[#f0ede8]">{movie.title}</strong> lúc{' '}
        <strong className="text-[#e8b84b]">{showtime.time}</strong> đã được xác nhận.
        <br />
        Mã vé đã gửi về email của bạn.
      </p>

      {/* Ticket card */}
      <div className="bg-[#111118] border border-white/10 rounded-lg p-7 mb-8 relative overflow-hidden text-left">
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, #e8b84b, #c0392b, #e8b84b)' }}
        />

        <h3 className="font-display font-bold text-xl mb-6 pb-4 border-b border-white/10 text-[#e8b84b]">
          Thông tin vé đã thanh toán
        </h3>

        <div className="space-y-3">
          {ticketInfo.map(([label, val]) => (
            <div key={label} className="flex justify-between items-center text-sm">
              <span className="text-[#a09e9a] font-mono-data uppercase text-xs">{label}</span>
              <span className="font-bold text-[#f0ede8] font-mono-data">{val}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleReset}
        className="w-full bg-[#e8b84b] text-[#09090e] border-0 rounded py-3.5 text-sm font-bold cursor-pointer hover:shadow-[0_8px_30px_rgba(232,184,75,0.4)] transition-all"
      >
        Về trang chủ →
      </button>
    </div>
  )
}
