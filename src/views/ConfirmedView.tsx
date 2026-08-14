import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { useAuth } from '../context/AuthContext'
import { getDateList } from '../lib/utils'
import { ETicketModal } from '../components/features/ticket/ETicketModal'

const BOOKING_CODE = 'CVN-' + Math.random().toString(36).slice(2, 8).toUpperCase()
const DATES = getDateList(7)

export default function ConfirmedView() {
  const navigate = useNavigate()
  const { state, reset } = useBooking()
  const { user } = useAuth()
  const [showQRModal, setShowQRModal] = useState(false)

  // Guard: must have a completed booking
  useEffect(() => {
    if (!state.selectedMovie || !state.selectedShowtime || state.selectedSeats.size === 0) {
      navigate('/', { replace: true })
    }
  }, [state.selectedMovie, state.selectedShowtime, state.selectedSeats.size, navigate])

  if (!state.selectedMovie || !state.selectedShowtime || state.selectedSeats.size === 0) {
    return null
  }

  const { selectedMovie: movie, selectedShowtime: showtime, selectedDate, selectedSeats, createdReservation } = state
  const bookingCode = createdReservation?.ticket_code || 'CVN-' + Math.random().toString(36).slice(2, 8).toUpperCase()

  const reservationForModal = createdReservation || {
    id: 1,
    showtime_id: showtime.id,
    user_id: user?.id || 1,
    ticket_code: bookingCode,
    total_price: 180000,
    status: 'confirmed',
    reservation_seats: [...selectedSeats].map((seatStr, idx) => ({
      id: idx + 1,
      showtime_seat_id: idx + 1,
      price: 90000,
      seat_label: seatStr,
    })),
    showtime: {
      id: showtime.id,
      movie_title: movie.title,
      movie_poster_url: movie.img,
      room_name: showtime.hall,
      start_time: `${DATES[selectedDate].toISOString().split('T')[0]}T${showtime.time}:00Z`,
      end_time: `${DATES[selectedDate].toISOString().split('T')[0]}T${showtime.time}:00Z`,
    },
    created_at: new Date().toISOString(),
  }

  const ticketInfo = [
    ['Ngày chiếu', DATES[selectedDate].toLocaleDateString('vi-VN')],
    ['Suất chiếu', showtime.time],
    ['Rạp / Phòng', showtime.hall],
    ['Loại phòng', showtime.type],
    ['Ghế', [...selectedSeats].sort().join(', ')],
    ['Mã đặt vé', bookingCode],
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
      <p className="text-[#a09e9a] text-[15px] leading-relaxed mb-6">
        Vé của bạn cho <strong className="text-[#f0ede8]">{movie.title}</strong> lúc{' '}
        <strong className="text-[#e8b84b]">{showtime.time}</strong> đã được xác nhận.
        <br />
        Mã vé đã gửi về email của bạn.
      </p>

      {/* Loyalty Points Earned Banner */}
      {createdReservation?.total_price && Math.floor(Number(createdReservation.total_price) / 1000) > 0 && (
        <div className="bg-[#e8b84b]/15 border border-[#e8b84b]/40 rounded-xl p-3.5 mb-6 flex items-center justify-center gap-2 text-sm text-[#e8b84b] font-medium">
          <span className="text-xl">🏆</span>
          <span>
            Chúc mừng! Bạn đã nhận được <strong className="font-bold">+{Math.floor(Number(createdReservation.total_price) / 1000)} điểm</strong> thành viên cho giao dịch này.
          </span>
        </div>
      )}

      {/* Ticket card */}
      <div className="bg-[#111118] border border-white/10 rounded-lg p-7 mb-8 relative overflow-hidden text-left shadow-xl">
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, #e8b84b, #c0392b, #e8b84b)' }}
        />

        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
          <h3 className="font-display font-bold text-xl text-[#e8b84b]">
            Thông tin vé đã thanh toán
          </h3>

          <button
            type="button"
            onClick={() => setShowQRModal(true)}
            className="bg-[#e8b84b] hover:bg-[#f0c868] text-[#09090e] font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 shadow-md"
          >
            <span>📱</span>
            <span>Xem Vé QR</span>
          </button>
        </div>

        <div className="space-y-3">
          {ticketInfo.map(([label, val]) => (
            <div key={label} className="flex justify-between items-center text-sm">
              <span className="text-[#a09e9a] font-mono-data uppercase text-xs">{label}</span>
              <span className="font-bold text-[#f0ede8] font-mono-data">{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setShowQRModal(true)}
          className="flex-1 bg-white/10 hover:bg-white/20 text-[#f0ede8] font-bold py-3.5 rounded text-sm transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>📱</span>
          <span>Mở Vé QR Vào Cổng</span>
        </button>

        <button
          onClick={handleReset}
          className="flex-1 bg-[#e8b84b] text-[#09090e] border-0 rounded py-3.5 text-sm font-bold cursor-pointer hover:shadow-[0_8px_30px_rgba(232,184,75,0.4)] transition-all"
        >
          Về trang chủ →
        </button>
      </div>

      {/* E-TICKET QR MODAL */}
      <ETicketModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        reservation={reservationForModal as any}
        userName={user?.full_name}
      />
    </div>
  )
}
