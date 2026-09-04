import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  Check,
  X,
  Banknote,
  Sparkles,
} from 'lucide-react'
import { useBooking } from '../context/BookingContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useCreateReservation, useHoldSeats, useSeatMap } from '../hooks/useShowtimes'
import { useMovie } from '../hooks/useMovies'
import { apiClient } from '../api/client'
import { createPaymentUrlAPI, releaseSeatsAPI } from '../api/showtimes'
import { cn, fmt } from '../lib/utils'
import {
  BookingSummary,
  PriceBreakdown,
  PaymentMethods,
  VNPayLogo,
  type AppliedVoucherDetail,
} from '../components/features/checkout/CheckoutComponents'
import VoucherSelectorModal, { type AppliedVoucherItem } from '../components/features/vouchers/VoucherSelectorModal'
import ConcessionSelectorModal from '../components/features/concessions/ConcessionSelectorModal'

export default function CheckoutView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const {
    state,
    calculateTotalPrice,
    concessionTotal,
    selectedConcessionsList,
    removeConcession,
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

  const performReleaseSeats = useCallback(async () => {
    if (showtime && showtime.id && state.selectedSeats.size > 0) {
      try {
        const labelToSeatIdMap = new Map<string, number>()
        const labelToShowtimeSeatIdMap = new Map<string, number>()
        if (seatMap?.seats) {
          seatMap.seats.forEach((s) => {
            if (s.seat_id) labelToSeatIdMap.set(`${s.row_label}${s.col_number}`, s.seat_id)
            if (s.id) labelToShowtimeSeatIdMap.set(`${s.row_label}${s.col_number}`, s.id)
          })
        }
        const numericSeatIds = Array.from(state.selectedSeats)
          .map((s) => labelToSeatIdMap.get(s) ?? labelToShowtimeSeatIdMap.get(s) ?? Number(s))
          .filter((n) => !isNaN(n))

        if (numericSeatIds.length > 0) {
          await releaseSeatsAPI(showtime.id, numericSeatIds)
        }
        await queryClient.invalidateQueries({ queryKey: ['seatMap', showtime.id] })
      } catch (err) {
        console.error('Failed to release seats on backend:', err)
      }
      sessionStorage.removeItem(`cineverse_hold_start_${showtime.id}`)
    }
  }, [showtime, state.selectedSeats, seatMap, queryClient])

  async function handleCancelBooking() {
    if (window.confirm('Bạn có chắc chắn muốn huỷ giữ chỗ không? Ghế đã giữ sẽ được giải phóng ngay lập tức.')) {
      await performReleaseSeats()
      clearSeats()
      clearConcessions()
      navigate(`/movie/${movie?.id}`)
    }
  }

  async function handleBackToSeats() {
    await performReleaseSeats()
    clearSeats()
    navigate(`/movie/${movie?.id}`)
  }

  const { isAuthenticated, isAuthLoading, openAuthModal } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState('vnpay')
  const [errorMsg, setErrorMsg] = useState('')

  // Modal selector states (Shopee style)
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)
  const [isConcessionModalOpen, setIsConcessionModalOpen] = useState(false)

  // Multiple vouchers state
  const [appliedVouchers, setAppliedVouchers] = useState<AppliedVoucherItem[]>([])
  const [voucherError, setVoucherError] = useState('')

  const holdSeatsMutation = useHoldSeats()
  const createReservationMutation = useCreateReservation()

  const currentSubtotal = calculateTotalPrice(seatMap?.seats)

  const HOLD_DURATION_SECONDS = 900 // 15 minutes hold window synchronized with backend

  // Countdown timer state persisted across page reloads
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!showtime) return HOLD_DURATION_SECONDS
    const key = `cineverse_hold_start_${showtime.id}`
    const savedStart = sessionStorage.getItem(key)
    if (savedStart) {
      const startTime = parseInt(savedStart, 10)
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      const remaining = HOLD_DURATION_SECONDS - elapsedSeconds
      return remaining > 0 ? remaining : 0
    }
    const now = Date.now()
    sessionStorage.setItem(key, now.toString())
    return HOLD_DURATION_SECONDS
  })

  // Guard: redirect safely if unauthenticated or missing booking info
  useEffect(() => {
    if (isAuthLoading) return

    if (!isAuthenticated) {
      openAuthModal('login', 'Vui lòng đăng ký hoặc đăng nhập tài khoản trước khi mua vé xem phim!')
      navigate(movie ? `/movie/${movie.id}` : '/', { replace: true })
      return
    }

    if (!movie || !showtime || state.selectedSeats.size === 0) {
      navigate(movie ? `/movie/${movie.id}` : '/', { replace: true })
    }
  }, [isAuthenticated, isAuthLoading, movie, showtime, state.selectedSeats, navigate, openAuthModal])

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Handle timeout: notify and release held seats safely
  useEffect(() => {
    if (timeLeft === 0 && showtime) {
      alert('Hết thời gian giữ chỗ! Ghế của bạn đã được giải phóng để nhường cho khách hàng khác.')
      performReleaseSeats().finally(() => {
        clearSeats()
        clearConcessions()
        navigate(movie ? `/movie/${movie.id}` : '/')
      })
    }
  }, [timeLeft, showtime, navigate, movie?.id, clearSeats, clearConcessions, performReleaseSeats])

  if (!movie || !showtime || state.selectedSeats.size === 0) {
    return null
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  function handleRemoveVoucher(codeToRemove?: string) {
    if (!codeToRemove) {
      setAppliedVouchers([])
    } else {
      setAppliedVouchers((prev) => prev.filter((v) => v.code !== codeToRemove))
    }
    setVoucherError('')
  }

  // Auto recalculate multiple vouchers when currentSubtotal changes
  useEffect(() => {
    if (appliedVouchers.length === 0) return
    let isMounted = true

    const revalidateVouchers = async () => {
      let runningAmount = currentSubtotal
      const updatedList: AppliedVoucherItem[] = []

      for (const v of appliedVouchers) {
        try {
          const { data } = await apiClient.post<{
            valid: boolean
            code: string
            discount_amount: number
            final_amount: number
            message: string
          }>('/api/v1/vouchers/apply', {
            code: v.code,
            total_amount: runningAmount,
          })

          if (data.valid && data.discount_amount > 0) {
            updatedList.push({
              code: data.code,
              discount_amount: data.discount_amount,
              message: data.message,
              title: v.title,
            })
            runningAmount = Math.max(0, runningAmount - data.discount_amount)
          }
        } catch {
          // If a voucher is no longer valid due to subtotal decrease, drop it gracefully
        }
      }

      if (isMounted) {
        setAppliedVouchers(updatedList)
      }
    }

    revalidateVouchers()

    return () => {
      isMounted = false
    }
  }, [currentSubtotal])

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

        if (movie?.id) {
          sessionStorage.setItem('last_booking_movie_id', movie.id.toString())
        }

        const res = await createReservationMutation.mutateAsync({
          showtimeId: showtime.id,
          seatIds,
          voucherCode: appliedVouchers.length > 0 ? appliedVouchers.map((v) => v.code).join(',') : undefined,
          paymentMethod: paymentMethod,
          concessionOrders: Array.from(state.selectedConcessions.values()).map(
            ({ concession, quantity, customOptions, unitPrice }) => ({
              concession_id: concession.id,
              quantity,
              custom_options: customOptions,
              unit_price: unitPrice,
            })
          ),
        })

        setCreatedReservation(res)

        if (paymentMethod === 'cash') {
          // Cash payment: Reservation created in PENDING state to be paid at cinema counter
          if (showtime) {
            sessionStorage.removeItem(`cineverse_hold_start_${showtime.id}`)
          }
          navigate(`/payment-result?status=cash_pending&reservation_id=${res.id}`)
          return
        }

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
    <div className="max-w-[660px] mx-auto px-4 sm:px-6 py-8 pb-24">
      {/* 4-Step Booking Stepper */}
      <nav aria-label="Tiến trình đặt vé" className={cn(
        'flex items-center justify-between mb-8 px-4 py-3.5 rounded-3xl border shadow-md transition-colors',
        isDark ? 'bg-[#111118]/90 border-white/10' : 'bg-white border-slate-200'
      )}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-xs font-bold text-emerald-500">1. Ghế</span>
        </div>
        <div className="h-[2px] flex-1 mx-2 bg-emerald-500/50" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-xs font-bold text-emerald-500">2. Combo</span>
        </div>
        <div className="h-[2px] flex-1 mx-2 bg-amber-500" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center ring-4 ring-amber-500/20 shadow-md">3</div>
          <span className="text-xs font-black text-amber-400">3. Thanh toán</span>
        </div>
        <div className="h-[2px] flex-1 mx-2 bg-white/10 dark:bg-white/10 bg-slate-200" />
        <div className="flex items-center gap-2 opacity-50">
          <div className={cn('w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center', isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-600')}>4</div>
          <span className="text-xs font-medium hidden sm:inline">4. Vé QR</span>
        </div>
      </nav>

      {/* Back to Movie details */}
      <button
        onClick={handleBackToSeats}
        className={cn(
          'inline-flex items-center gap-2 bg-transparent border-0 text-xs font-bold cursor-pointer mb-6 transition-colors px-3 py-1.5 rounded-xl',
          isDark ? 'text-[#a09e9a] hover:text-[#f0ede8] hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        )}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại chọn suất chiếu & ghế</span>
      </button>

      <div className="flex items-center justify-between mb-4">
        <h2 className={cn('font-display text-2xl sm:text-3xl font-black tracking-tight', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
          Xác nhận đơn đặt vé
        </h2>
      </div>

      {/* Seat hold countdown timer banner (Sticky on scroll) */}
      <div
        className={cn(
          'sticky top-16 sm:top-20 z-40 backdrop-blur-xl border rounded-2xl p-3.5 sm:p-4 mb-6 flex items-center justify-between shadow-2xl transition-all duration-200',
          isDark
            ? 'bg-[#111118]/95 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(232,184,75,0.15)]'
            : 'bg-amber-50/95 border-amber-300 text-amber-950 font-bold shadow-lg'
        )}
      >
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
          <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Thời gian giữ ghế còn lại:</span>
        </div>
        <span className={cn('font-mono-data font-black text-xl sm:text-2xl tracking-widest', isDark ? 'text-amber-400' : 'text-amber-700')}>
          {formattedTime}
        </span>
      </div>

      {/* Login prompt banner if not logged in */}
      {!isAuthenticated && (
        <div
          className={cn(
            'border rounded-2xl p-4 mb-6 flex justify-between items-center shadow-md',
            isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-300'
          )}
        >
          <div className="text-xs">
            <p className={cn('font-bold', isDark ? 'text-amber-400' : 'text-amber-900')}>Bạn chưa đăng nhập</p>
            <p className={isDark ? 'text-[#a09e9a]' : 'text-slate-600'}>Đăng nhập để tích luỹ điểm thưởng và áp dụng voucher</p>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 border-0 rounded-xl px-4 py-2 text-xs font-black cursor-pointer shadow-sm transition-all"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-4 mb-6 text-xs text-rose-400 font-bold shadow-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <BookingSummary
        movie={movie}
        showtime={showtime}
        selectedDate={state.selectedDate}
        selectedSeats={state.selectedSeats}
      />

      {/* Itemized concession detail for PriceBreakdown with embedded Concessions & Voucher selector rows */}
      {(() => {
        const concessionItems = Array.from(state.selectedConcessions.entries()).map(([key, { concession, quantity, customOptions, unitPrice }]) => ({
          id: concession.id,
          name: customOptions ? `${concession.name} (${customOptions})` : concession.name,
          price: unitPrice ?? concession.price,
          quantity,
          category: concession.category,
          key,
        }))

        return (
          <PriceBreakdown
            seatCount={state.selectedSeats.size}
            subtotal={currentSubtotal}
            concessionTotal={concessionTotal}
            concessionItems={concessionItems}
            onRemoveConcession={(keyOrId) => {
              if (typeof keyOrId === 'string') {
                removeConcession(keyOrId)
              } else {
                const foundEntry = Array.from(state.selectedConcessions.entries()).find(
                  ([, val]) => val.concession.id === keyOrId
                )
                if (foundEntry) {
                  removeConcession(foundEntry[0])
                }
              }
            }}
            onOpenConcessionModal={() => setIsConcessionModalOpen(true)}
            appliedVouchers={appliedVouchers}
            onOpenVoucherModal={() => setIsVoucherModalOpen(true)}
            onRemoveVoucher={handleRemoveVoucher}
          />
        )
      })()}

      <PaymentMethods selected={paymentMethod} onSelect={setPaymentMethod} />

      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={handleCancelBooking}
          className={cn(
            'w-full sm:w-1/3 py-4 px-4 border rounded-2xl text-xs sm:text-sm font-bold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-xs',
            isDark
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
          )}
          title="Huỷ giữ chỗ ngay để chọn vé khác"
        >
          <X className="w-4 h-4" />
          <span>Huỷ giữ chỗ</span>
        </button>

        <button
          id="pay-now-btn"
          onClick={handleConfirm}
          disabled={isPending}
          className="w-full sm:w-2/3 bg-amber-500 hover:bg-amber-400 text-slate-950 border-0 rounded-2xl py-4 px-6 text-sm sm:text-base font-black cursor-pointer tracking-wide transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 shadow-lg flex items-center justify-center gap-3"
        >
          {paymentMethod === 'vnpay' ? (
            <>
              <div className="bg-white px-2 py-0.5 rounded-lg flex items-center shadow-xs">
                <VNPayLogo className="h-4.5 w-auto shrink-0" />
              </div>
              <span>{isPending ? 'Đang kết nối cổng VNPay...' : 'Thanh toán qua VNPay'}</span>
            </>
          ) : (
            <>
              <Banknote className="w-5 h-5" />
              <span>{isPending ? 'Đang xác nhận đặt vé...' : 'Xác nhận đặt vé (Tiền mặt)'}</span>
            </>
          )}
        </button>
      </div>

      {/* Shopee-style Multi-Voucher Selector Modal */}
      <VoucherSelectorModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        currentSubtotal={currentSubtotal}
        appliedVouchers={appliedVouchers}
        onApplyVouchers={(vouchers) => {
          setAppliedVouchers(vouchers)
          setVoucherError('')
        }}
        onRemoveAllVouchers={() => setAppliedVouchers([])}
        isDark={isDark}
      />

      {/* Shopee-style Concession Selector Modal */}
      <ConcessionSelectorModal
        isOpen={isConcessionModalOpen}
        onClose={() => setIsConcessionModalOpen(false)}
        isDark={isDark}
      />
    </div>
  )
}
