import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { useAuth } from '../context/AuthContext'
import { useCreateReservation, useHoldSeats, useSeatMap } from '../hooks/useShowtimes'
import { useMovie } from '../hooks/useMovies'
import { apiClient } from '../api/client'
import {
  BookingSummary,
  PriceBreakdown,
  PaymentMethods,
} from '../components/features/checkout/CheckoutComponents'
import ConcessionPicker from '../components/features/concessions/ConcessionPicker'

export default function CheckoutView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { state, calculateTotalPrice, concessionTotal, dispatch } = useBooking() as any
  const { isAuthenticated, openAuthModal } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState('Thẻ ngân hàng')
  const [errorMsg, setErrorMsg] = useState('')

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string
    discount_amount: number
    message: string
  } | null>(null)
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherError, setVoucherError] = useState('')

  const holdSeatsMutation = useHoldSeats()
  const createReservationMutation = useCreateReservation()

  const movieId = id ? Number(id) : null
  const { data: fetchedMovie } = useMovie(state.selectedMovie ? null : movieId)
  const movie = state.selectedMovie ?? fetchedMovie
  const showtime = state.selectedShowtime
  const { data: seatMap } = useSeatMap(showtime)

  const currentSubtotal = calculateTotalPrice(seatMap?.seats)

  const [timeLeft, setTimeLeft] = useState(600)

  // Guard: redirect safely if missing booking info
  useEffect(() => {
    if (!movie || !showtime || state.selectedSeats.size === 0) {
      navigate(movie ? `/movie/${movie.id}` : '/', { replace: true })
    }
  }, [movie, showtime, state.selectedSeats.size, navigate])

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      alert('Thời gian giữ ghế 10 phút đã hết hạn! Vui lòng chọn lại ghế.')
      navigate(`/movie/${movie?.id}/seats`)
      return
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, navigate, movie?.id])

  if (!movie || !showtime || state.selectedSeats.size === 0) {
    return null
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  async function handleApplyVoucher() {
    if (!voucherCode.trim()) return
    setVoucherError('')
    setVoucherLoading(true)

    try {
      const { data } = await apiClient.post<{
        valid: boolean
        code: string
        discount_amount: number
        final_amount: number
        message: string
      }>('/api/v1/vouchers/apply', {
        code: voucherCode.trim(),
        total_amount: currentSubtotal,
      })

      setAppliedVoucher({
        code: data.code,
        discount_amount: data.discount_amount,
        message: data.message,
      })
      setVoucherError('')
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Mã giảm giá không hợp lệ.'
      setVoucherError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setAppliedVoucher(null)
    } finally {
      setVoucherLoading(false)
    }
  }

  function handleRemoveVoucher() {
    setAppliedVoucher(null)
    setVoucherCode('')
    setVoucherError('')
  }

  async function handleConfirm() {
    setErrorMsg('')

    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }

    try {
      let seatIds: number[] = []
      if (seatMap && seatMap.seats) {
        const labelToSeatIdMap = new Map<string, number>()
        seatMap.seats.forEach((s) => {
          labelToSeatIdMap.set(`${s.row_label}${s.col_number}`, s.seat_id)
        })

        seatIds = Array.from(state.selectedSeats)
          .map((label) => labelToSeatIdMap.get(label))
          .filter((id): id is number => id !== undefined)
      }

      if (showtime?.id) {
        if (seatIds.length !== state.selectedSeats.size) {
          setErrorMsg('Không thể xác định thông tin một số ghế đã chọn. Vui lòng thử chọn lại ghế.')
          return
        }

        await holdSeatsMutation.mutateAsync({
          showtimeId: showtime.id,
          seatIds,
        })

        const res = await createReservationMutation.mutateAsync({
          showtimeId: showtime.id,
          seatIds,
          voucherCode: appliedVoucher?.code,
          concessionOrders: Array.from(state.selectedConcessions.entries()).map(
            ([concession_id, { quantity }]) => ({ concession_id, quantity })
          ),
        })

        dispatch({ type: 'SET_CREATED_RESERVATION', payload: res })

        navigate('/confirmed')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        navigate('/confirmed')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail ?? 'Đã xảy ra lỗi khi tạo đơn đặt vé. Vui lòng thử lại.'
      setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail))
    }
  }

  const isPending = createReservationMutation.isPending || holdSeatsMutation.isPending

  return (
    <div className="max-w-[640px] mx-auto px-6 py-10 pb-20">
      {/* Back */}
      <button
        onClick={() => navigate(`/movie/${movie.id}/seats`)}
        className="flex items-center gap-1.5 bg-transparent border-0 text-[#a09e9a] text-sm cursor-pointer mb-8 hover:text-[#f0ede8] transition-colors"
      >
        ← Quay lại
      </button>

      <h2 className="font-display text-[32px] font-black tracking-tight mb-4">Xác nhận đặt vé</h2>

      {/* Seat hold countdown timer banner */}
      <div className="bg-[#e8b84b]/10 border border-[#e8b84b]/30 rounded-xl p-4 mb-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2 text-xs text-[#e8b84b] font-medium">
          <span className="animate-pulse text-base">⏳</span>
          <span>Thời gian giữ ghế tạm thời còn lại:</span>
        </div>
        <span className="font-mono-data font-bold text-lg text-[#e8b84b] tracking-widest">{formattedTime}</span>
      </div>

      {/* Login prompt banner if not logged in */}
      {!isAuthenticated && (
        <div className="bg-[#e8b84b]/10 border border-[#e8b84b]/30 rounded p-4 mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-[#e8b84b]">Yêu cầu đăng nhập</p>
            <p className="text-xs text-[#a09e9a]">Vui lòng đăng nhập tài khoản trước khi hoàn tất thanh toán.</p>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="bg-[#e8b84b] text-[#09090e] border-0 rounded px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-[rgba(192,57,43,0.15)] border border-[rgba(192,57,43,0.3)] rounded p-4 mb-6 text-xs text-[#e07060]">
          ⚠ {errorMsg}
        </div>
      )}

      <BookingSummary
        movie={movie}
        showtime={showtime}
        selectedDate={state.selectedDate}
        selectedSeats={state.selectedSeats}
      />

      {/* Voucher Input Box */}
      <div className="bg-[#111118] border border-white/[0.08] rounded-md p-5 mb-6">
        <h4 className="font-mono-data text-[13px] text-[#6e6c68] tracking-wide uppercase mb-3">
          Mã giảm giá / Voucher (Nếu có)
        </h4>

        {appliedVoucher ? (
          <div className="bg-[rgba(46,204,113,0.12)] border border-[rgba(46,204,113,0.3)] rounded p-3 text-xs flex justify-between items-center text-[#2ecc71]">
            <div>
              <p className="font-bold">✓ {appliedVoucher.message}</p>
              <p className="text-[11px] opacity-80">Mã: {appliedVoucher.code}</p>
            </div>
            <button
              onClick={handleRemoveVoucher}
              className="text-[#e07060] hover:underline bg-transparent border-0 cursor-pointer text-xs font-bold"
            >
              Gỡ bỏ
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã voucher"
                className="flex-1 px-3 py-2 bg-[#09090e] border border-white/10 rounded text-xs text-[#f0ede8] focus:border-[#e8b84b] outline-none font-mono-data uppercase"
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                disabled={voucherLoading || !voucherCode.trim()}
                className="bg-[#e8b84b] text-[#09090e] border-0 rounded px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {voucherLoading ? 'Đang áp dụng...' : 'Áp dụng'}
              </button>
            </div>
            {voucherError && (
              <p className="text-[11px] text-[#e07060] mt-2">⚠ {voucherError}</p>
            )}
          </div>
        )}
      </div>

      <ConcessionPicker />

      <PriceBreakdown
        seatCount={state.selectedSeats.size}
        subtotal={currentSubtotal}
        discountOverride={appliedVoucher?.discount_amount}
        concessionTotal={concessionTotal}
      />

      <PaymentMethods selected={paymentMethod} onSelect={setPaymentMethod} />

      <button
        id="pay-now-btn"
        onClick={handleConfirm}
        disabled={isPending}
        className="w-full bg-[#e8b84b] text-[#09090e] border-0 rounded py-4 text-base font-bold cursor-pointer tracking-wide transition-all duration-200 hover:shadow-[0_8px_30px_rgba(232,184,75,0.4)] hover:-translate-y-px disabled:opacity-50"
      >
        {isPending ? 'Đang xử lý đặt vé...' : 'Thanh toán ngay'}
      </button>
    </div>
  )
}
