import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useCreateReservation, useHoldSeats, useSeatMap } from '../hooks/useShowtimes'
import { useMovie } from '../hooks/useMovies'
import { apiClient } from '../api/client'
import { createPaymentUrlAPI } from '../api/showtimes'
import { cn } from '../lib/utils'
import {
  BookingSummary,
  PriceBreakdown,
  PaymentMethods,
} from '../components/features/checkout/CheckoutComponents'
import ConcessionPicker from '../components/features/concessions/ConcessionPicker'

export default function CheckoutView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const {
    state,
    calculateTotalPrice,
    concessionTotal,
    clearSeats,
    setConcession,
    clearConcessions,
    setCreatedReservation,
  } = useBooking()

  const movieId = id ? Number(id) : null
  const { data: fetchedMovie } = useMovie(state.selectedMovie ? null : movieId)
  const movie = state.selectedMovie ?? fetchedMovie
  const showtime = state.selectedShowtime
  const { data: seatMap } = useSeatMap(showtime)

  function handleCancelBooking() {
    if (window.confirm('Bạn có chắc chắn muốn huỷ giữ chỗ không? Ghế đã giữ sẽ được giải phóng ngay lập tức.')) {
      if (showtime) {
        sessionStorage.removeItem(`cineverse_hold_start_${showtime.id}`)
      }
      clearSeats()
      clearConcessions()
      navigate(`/movie/${movie?.id}`)
    }
  }

  const { isAuthenticated, openAuthModal } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState('vnpay')
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

  const currentSubtotal = calculateTotalPrice(seatMap?.seats)

  // Countdown timer state persisted across page reloads
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!showtime) return 600
    const key = `cineverse_hold_start_${showtime.id}`
    const savedStart = sessionStorage.getItem(key)
    if (savedStart) {
      const startTime = parseInt(savedStart, 10)
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      const remaining = 600 - elapsedSeconds
      return remaining > 0 ? remaining : 0
    }
    const now = Date.now()
    sessionStorage.setItem(key, now.toString())
    return 600
  })

  // Guard: redirect safely if missing booking info
  useEffect(() => {
    if (!movie || !showtime || state.selectedSeats.size === 0) {
      navigate(movie ? `/movie/${movie.id}` : '/', { replace: true })
    }
  }, [movie, showtime, state.selectedSeats.size, navigate])

  // Countdown timer effect with reload persistence
  useEffect(() => {
    if (!showtime) return
    const key = `cineverse_hold_start_${showtime.id}`

    const updateTimer = () => {
      const savedStart = sessionStorage.getItem(key)
      if (savedStart) {
        const startTime = parseInt(savedStart, 10)
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = 600 - elapsed
        if (remaining <= 0) {
          setTimeLeft(0)
          sessionStorage.removeItem(key)
          alert('Thời gian giữ ghế 10 phút đã hết hạn! Vui lòng chọn lại ghế.')
          clearSeats()
          clearConcessions()
          navigate(`/movie/${movie?.id}`)
        } else {
          setTimeLeft(remaining)
        }
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [showtime, navigate, movie?.id, clearSeats, clearConcessions])

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

        const res = await createReservationMutation.mutateAsync({
          showtimeId: showtime.id,
          seatIds,
          voucherCode: appliedVoucher?.code,
          concessionOrders: Array.from(state.selectedConcessions.entries()).map(
            ([concession_id, { quantity }]) => ({ concession_id, quantity })
          ),
        })

        setCreatedReservation(res)

        // Call VNPay payment link creator & redirect browser
        const paymentRes = await createPaymentUrlAPI(res.id)
        if (paymentRes && paymentRes.payment_url) {
          window.location.href = paymentRes.payment_url
        } else {
          setErrorMsg('Không thể khởi tạo cổng thanh toán VNPay. Vui lòng thử lại.')
        }
      } else {
        setErrorMsg('Không tìm thấy thông tin suất chiếu. Vui lòng thử lại.')
      }
    } catch (err: any) {
      const rawDetail = err.response?.data?.detail
      let message = 'Đã xảy ra lỗi khi tạo đơn đặt vé. Vui lòng thử lại.'
      if (typeof rawDetail === 'string') {
        message = rawDetail
      } else if (Array.isArray(rawDetail)) {
        message = rawDetail.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
      } else if (rawDetail && typeof rawDetail === 'object') {
        message = rawDetail.message || JSON.stringify(rawDetail)
      } else if (err.message) {
        message = err.message
      }
      setErrorMsg(message)
    }
  }

  const isPending = createReservationMutation.isPending

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-10 pb-20">
      {/* Back */}
      <button
        onClick={() => navigate(`/movie/${movie.id}`)}
        className={cn(
          'flex items-center gap-1.5 bg-transparent border-0 text-sm cursor-pointer mb-8 transition-colors font-medium',
          isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900'
        )}
      >
        ← Quay lại
      </button>

      <h2 className={cn('font-display text-3xl sm:text-[32px] font-black tracking-tight mb-4', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
        Xác nhận đặt vé
      </h2>

      {/* Seat hold countdown timer banner (Sticky on scroll) */}
      <div
        className={cn(
          'sticky top-16 sm:top-20 z-40 backdrop-blur-md border rounded-2xl p-4 mb-6 flex items-center justify-between shadow-xl transition-all duration-200',
          isDark
            ? 'bg-[#111118]/90 border-[#e8b84b]/40 text-[#e8b84b]'
            : 'bg-amber-50/90 border-amber-300 text-amber-950 font-bold'
        )}
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
          <span className="animate-pulse text-base">⏳</span>
          <span>Thời gian giữ ghế còn lại:</span>
        </div>
        <span className={cn('font-mono-data font-black text-lg tracking-widest', isDark ? 'text-[#e8b84b]' : 'text-amber-600')}>
          {formattedTime}
        </span>
      </div>

      {/* Login prompt banner if not logged in */}
      {!isAuthenticated && (
        <div
          className={cn(
            'border rounded-2xl p-4 mb-6 flex justify-between items-center shadow-md',
            isDark ? 'bg-[#e8b84b]/10 border-[#e8b84b]/30' : 'bg-amber-50 border-amber-300'
          )}
        >
          <div>
            <p className={cn('text-sm font-black', isDark ? 'text-[#e8b84b]' : 'text-amber-900')}>Yêu cầu đăng nhập</p>
            <p className={cn('text-xs font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>Vui lòng đăng nhập tài khoản trước khi hoàn tất thanh toán.</p>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 border-0 rounded-xl px-4 py-2 text-xs font-black cursor-pointer shadow-md"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-2xl p-4 mb-6 text-xs text-red-500 font-bold shadow-md">
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
      <div
        className={cn(
          'border rounded-2xl p-5 mb-6 shadow-md transition-colors',
          isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
        )}
      >
        <h4 className={cn('font-mono-data text-[13px] tracking-wide uppercase mb-3 font-extrabold', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
          Mã giảm giá / Voucher (Nếu có)
        </h4>

        {appliedVoucher ? (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3.5 text-xs flex justify-between items-center text-emerald-500 font-bold">
            <div>
              <p className="font-black">✓ {appliedVoucher.message}</p>
              <p className="text-[11px] opacity-80">Mã: {appliedVoucher.code}</p>
            </div>
            <button
              onClick={handleRemoveVoucher}
              className="text-red-500 hover:underline bg-transparent border-0 cursor-pointer text-xs font-black"
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
                className={cn(
                  'flex-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none font-mono-data uppercase transition-all',
                  isDark
                    ? 'bg-[#09090e] border-white/10 text-[#f0ede8]'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 font-bold'
                )}
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                disabled={voucherLoading || !voucherCode.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 border-0 rounded-xl px-4 py-2.5 text-xs font-black cursor-pointer disabled:opacity-50 shadow-md"
              >
                {voucherLoading ? 'Đang áp dụng...' : 'Áp dụng'}
              </button>
            </div>
            {voucherError && (
              <p className="text-[11px] text-red-500 font-bold mt-2">⚠ {voucherError}</p>
            )}
          </div>
        )}
      </div>

      <ConcessionPicker />

      {/* Itemized concession detail for PriceBreakdown */}
      {(() => {
        const concessionItems = Array.from(
          (state.selectedConcessions as Map<number, { concession: any; quantity: number }>).values()
        ).map(({ concession, quantity }) => ({
          id: concession.id,
          name: concession.name,
          price: concession.price,
          quantity,
          category: concession.category,
        }))

        return (
          <PriceBreakdown
            seatCount={state.selectedSeats.size}
            subtotal={currentSubtotal}
            discountOverride={appliedVoucher?.discount_amount}
            concessionTotal={concessionTotal}
            concessionItems={concessionItems}
            onRemoveConcession={(concessionId) => {
              const item = state.selectedConcessions.get(concessionId)
              if (item && setConcession) {
                setConcession(item.concession, 0)
              }
            }}
          />
        )
      })()}

      <PaymentMethods selected={paymentMethod} onSelect={setPaymentMethod} />

      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={handleCancelBooking}
          className="w-full sm:w-1/3 py-4 px-4 bg-red-500/15 hover:bg-red-500/25 text-red-500 border border-red-500/30 rounded-2xl text-sm font-bold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          title="Huỷ giữ chỗ ngay để chọn vé khác"
        >
          <span>✕</span> Huỷ giữ chỗ
        </button>

        <button
          id="pay-now-btn"
          onClick={handleConfirm}
          disabled={isPending}
          className="w-full sm:w-2/3 bg-amber-500 hover:bg-amber-600 text-slate-950 border-0 rounded-2xl py-4 text-base font-black cursor-pointer tracking-wide transition-all duration-200 hover:shadow-lg hover:-translate-y-px disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
        >
          <span>💳</span>
          <span>{isPending ? 'Đang kết nối cổng thanh toán...' : 'Thanh toán qua VNPay'}</span>
        </button>
      </div>
    </div>
  )
}
