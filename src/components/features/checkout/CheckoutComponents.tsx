import {
  Calendar,
  Clock,
  Film,
  Popcorn,
  CupSoda,
  UtensilsCrossed,
  Cookie,
  Ticket,
  Plus,
  X,
  Check,
  Banknote,
  SlidersHorizontal,
  ArrowRight,
  Armchair,
  Building2,
  Tag,
  ShieldCheck,
  CreditCard,
} from 'lucide-react'
import type { Movie, ShowTime } from '../../../types'
import { fmt, cn, getDateList } from '../../../lib/utils'
import { useTheme } from '../../../context/ThemeContext'

// ─────────────────────────────────────────
// BookingSummary
// ─────────────────────────────────────────
interface BookingSummaryProps {
  movie: Movie
  showtime: ShowTime
  selectedDate: number
  selectedSeats: Set<string>
}

export function BookingSummary({
  movie,
  showtime,
  selectedDate,
  selectedSeats,
}: BookingSummaryProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const dates = getDateList(7)
  const dateObj = dates[selectedDate] || new Date()

  return (
    <div
      className={cn(
        'relative border rounded-3xl overflow-hidden mb-6 shadow-xl transition-colors',
        isDark ? 'bg-[#111118]/95 border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Movie Poster */}
        <div className="sm:w-[130px] aspect-[2/3] sm:aspect-auto overflow-hidden bg-[#14141e] shrink-0 relative">
          <img
            src={movie.img}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          {movie.rating && (
            <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-lg shadow-md font-mono-data">
              {movie.rating}
            </div>
          )}
        </div>

        {/* Screening Details */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn('font-mono-data text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider',
                isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-900 border border-amber-200'
              )}>
                {showtime.type || 'Standard'}
              </span>
              {showtime.hall && (
                <span className={cn('text-[11px] font-mono-data font-bold opacity-80', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  {showtime.hall}
                </span>
              )}
            </div>

            <h3 className={cn('font-display text-lg sm:text-xl font-black mb-2 leading-snug', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
              {movie.title}
            </h3>
          </div>

          <div className={cn('text-xs flex flex-col gap-1.5 font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
            <span className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {dateObj.toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-mono-data font-bold">{showtime.time}</span>
              {showtime.hall && <span>· {showtime.hall}</span>}
            </span>
            {movie.director && (
              <span className="flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{movie.director}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selected Seats Chips */}
      <div className={cn('border-t px-5 py-3.5 flex items-center justify-between gap-3', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/70')}>
        <div className="flex items-center gap-1.5">
          <Armchair className="w-4 h-4 text-amber-500" />
          <span className={cn('text-xs font-mono-data font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
            Ghế ({selectedSeats.size})
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {[...selectedSeats].sort().map((s) => (
            <span
              key={s}
              className={cn(
                'font-mono-data text-xs px-2.5 py-0.5 rounded-lg border font-black shadow-xs',
                isDark
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-amber-100 text-amber-950 border-amber-300'
              )}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// PriceBreakdown
// ─────────────────────────────────────────
export interface ConcessionItemDetail {
  id: number
  name: string
  price: number
  quantity: number
  category?: string
  key?: string
}

export interface AppliedVoucherDetail {
  code: string
  discount_amount: number
  message?: string
  title?: string
}

export interface PriceBreakdownProps {
  seatCount: number
  pricePerSeat?: number
  subtotal: number
  discountOverride?: number
  concessionTotal?: number
  concessionItems?: ConcessionItemDetail[]
  onRemoveConcession?: (keyOrId: string | number) => void
  onOpenConcessionModal?: () => void
  appliedVoucher?: AppliedVoucherDetail | null
  appliedVouchers?: AppliedVoucherDetail[]
  onOpenVoucherModal?: () => void
  onRemoveVoucher?: (code?: string) => void
}

export function PriceBreakdown({
  seatCount,
  pricePerSeat,
  subtotal,
  discountOverride,
  concessionTotal = 0,
  concessionItems = [],
  onRemoveConcession,
  onOpenConcessionModal,
  appliedVoucher,
  appliedVouchers = [],
  onOpenVoucherModal,
  onRemoveVoucher,
}: PriceBreakdownProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Consolidate vouchers list
  const voucherList = appliedVouchers.length > 0
    ? appliedVouchers
    : appliedVoucher
    ? [appliedVoucher]
    : []

  const totalVoucherDiscount = voucherList.reduce((sum, v) => sum + v.discount_amount, 0)
  const discount = discountOverride !== undefined ? discountOverride : totalVoucherDiscount
  const total = Math.max(0, subtotal - discount + concessionTotal)

  return (
    <div
      className={cn(
        'border rounded-3xl p-5 sm:p-6 mb-6 shadow-xl transition-colors',
        isDark ? 'bg-[#111118]/95 border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
      )}
    >
      <h4 className={cn('font-mono-data text-xs tracking-wider uppercase mb-4 font-bold flex items-center gap-2', isDark ? 'text-amber-400' : 'text-amber-800')}>
        <Ticket className="w-4 h-4 text-amber-500" />
        <span>Chi tiết giá thanh toán</span>
      </h4>

      {/* 1. Ticket Row */}
      <div className="flex justify-between py-2.5 text-xs sm:text-sm font-medium">
        <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-600'}>
          {pricePerSeat ? `${seatCount} vé xem phim × ${fmt(pricePerSeat)}` : `${seatCount} vé xem phim đã chọn`}
        </span>
        <span className={cn('font-mono-data font-bold', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
          {fmt(subtotal)}
        </span>
      </div>

      {/* 2. Concession Section */}
      {concessionItems.length === 0 ? (
        <div className={cn('flex items-center justify-between py-3.5 border-t border-dashed', isDark ? 'border-white/10' : 'border-slate-200')}>
          <div className="flex items-center gap-2">
            <Popcorn className="w-4 h-4 text-amber-500 shrink-0" />
            <span className={cn('text-xs sm:text-sm font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
              Bắp rang & Nước uống
            </span>
          </div>
          {onOpenConcessionModal && (
            <button
              type="button"
              onClick={onOpenConcessionModal}
              className={cn(
                'text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0',
                isDark
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/30'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm bắp nước</span>
            </button>
          )}
        </div>
      ) : (
        <div className={cn('my-2 py-3.5 border-t border-dashed space-y-3', isDark ? 'border-white/10' : 'border-slate-200')}>
          {concessionItems.map((item) => {
            const itemTotal = Number(item.price) * item.quantity
            const Icon =
              item.category === 'snack' ? Cookie :
              item.category === 'drink' ? CupSoda :
              item.category === 'food' ? UtensilsCrossed : Popcorn

            return (
              <div key={item.key || item.id} className="flex justify-between items-center text-xs sm:text-sm gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className={cn('font-medium truncate text-xs sm:text-sm', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                    {item.name}
                  </span>
                  <span className={cn(
                    'font-mono-data font-bold text-[11px] px-2 py-0.5 rounded-full shrink-0 border',
                    isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-100 text-amber-900 border-amber-300'
                  )}>
                    ×{item.quantity}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('font-mono-data font-bold text-xs sm:text-sm', isDark ? 'text-amber-400' : 'text-amber-800')}>
                    +{fmt(itemTotal)}
                  </span>
                  {onRemoveConcession && (
                    <button
                      type="button"
                      onClick={() => onRemoveConcession(item.key || item.id)}
                      className="w-6 h-6 rounded-full bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center transition-all cursor-pointer border border-rose-500/30 ml-1"
                      title={`Gỡ bỏ ${item.name}`}
                      aria-label={`Gỡ bỏ ${item.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {onOpenConcessionModal && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs opacity-60 font-mono-data">
                {concessionItems.reduce((acc, c) => acc + c.quantity, 0)} món bắp nước đã chọn
              </span>
              <button
                type="button"
                onClick={onOpenConcessionModal}
                className={cn(
                  'text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center gap-1.5',
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-amber-400 border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                )}
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Chỉnh sửa bắp nước</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Voucher Section */}
      {voucherList.length === 0 ? (
        <div className={cn('flex items-center justify-between py-3.5 border-t border-dashed', isDark ? 'border-white/10' : 'border-slate-200')}>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-500 shrink-0" />
            <span className={cn('text-xs sm:text-sm font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
              Mã giảm giá (Voucher)
            </span>
          </div>
          {onOpenVoucherModal && (
            <button
              type="button"
              onClick={onOpenVoucherModal}
              className={cn(
                'text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0',
                isDark
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/30'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Chọn hoặc nhập mã</span>
            </button>
          )}
        </div>
      ) : (
        <div className={cn('my-2 py-3.5 border-t border-dashed space-y-2.5', isDark ? 'border-white/10' : 'border-slate-200')}>
          {voucherList.map((v) => (
            <div key={v.code} className="flex justify-between items-center text-xs sm:text-sm gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={cn('font-medium text-xs sm:text-sm', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                    Voucher
                  </span>
                  <span className="font-mono-data font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    [{v.code}]
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-emerald-400 font-mono-data font-black text-xs sm:text-sm">
                  - {fmt(v.discount_amount)}
                </span>
                {onRemoveVoucher && (
                  <button
                    type="button"
                    onClick={() => onRemoveVoucher(v.code)}
                    className="w-6 h-6 rounded-full bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center cursor-pointer border border-rose-500/30 ml-1"
                    title={`Gỡ voucher ${v.code}`}
                    aria-label={`Gỡ voucher ${v.code}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {onOpenVoucherModal && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs opacity-60 font-mono-data">
                {voucherList.length} mã đã áp dụng
              </span>
              <button
                type="button"
                onClick={onOpenVoucherModal}
                className={cn(
                  'text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center gap-1.5',
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-amber-400 border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                )}
              >
                <Tag className="w-3 h-3" />
                <span>Đổi mã voucher</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Total Row */}
      <div className={cn('border-t pt-4 mt-2 flex justify-between items-baseline', isDark ? 'border-white/10' : 'border-slate-200')}>
        <span className={cn('text-sm sm:text-base font-black', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>Tổng thanh toán</span>
        <span className="font-display text-3xl sm:text-4xl font-black text-emerald-400">{fmt(total)}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Payment Brand Logos (Pixel-perfect Vector Logos)
// ─────────────────────────────────────────
export function VNPayLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 70" className={className} xmlns="http://www.w3.org/2000/svg">
      <g>
        {/* Blue Card */}
        <rect x="22" y="6" width="34" height="42" rx="7" transform="rotate(-28 39 27)" fill="#005BAA" />
        <path d="M42 16 A11 11 0 0 0 34 32" stroke="#00A8FF" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M46 19 A15 15 0 0 0 38 37" stroke="#00A8FF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Red Card */}
        <rect x="22" y="16" width="38" height="44" rx="7" transform="rotate(26 41 38)" fill="#ED1C24" />
      </g>

      {/* VNPAY Typography */}
      <text x="80" y="48" fill="#ED1C24" fontFamily="'Montserrat', 'Arial Black', sans-serif" fontWeight="900" fontSize="34" letterSpacing="-0.5">VN</text>
      <text x="132" y="48" fill="#005BAA" fontFamily="'Montserrat', 'Arial Black', sans-serif" fontWeight="900" fontSize="34" letterSpacing="-0.5">PAY</text>
    </svg>
  )
}

export function MoMoLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="22" fill="#A50064" />
      {/* Upper mo */}
      <path d="M18 26h9v26h-9V26zm14 0h8v5.5c2.2-4 6-6.5 11.5-6.5 8 0 12.5 5.5 12.5 14v13h-9V38c0-5-2.2-7.5-6.5-7.5s-7.5 2.5-7.5 7.5v14h-9V26z" fill="#FFFFFF" />
      <circle cx="76" cy="39" r="12.5" fill="none" stroke="#FFFFFF" strokeWidth="7" />
      {/* Lower mo */}
      <path d="M18 52h9v26h-9V52zm14 0h8v5.5c2.2-4 6-6.5 11.5-6.5 8 0 12.5 5.5 12.5 14v13h-9V64c0-5-2.2-7.5-6.5-7.5s-7.5 2.5-7.5 7.5v14h-9V52z" fill="#FFFFFF" />
      <circle cx="76" cy="65" r="12.5" fill="none" stroke="#FFFFFF" strokeWidth="7" />
    </svg>
  )
}

export function ZaloPayLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="166" height="60" rx="14" fill="#FFFFFF" stroke="#0068FF" strokeWidth="2.5" />
      <path d="M2 16C2 8 8 2 16 2h36L14 62H2V16z" fill="#0068FF" />
      <text x="68" y="41" fill="#0068FF" fontFamily="'Montserrat', 'Arial Black', sans-serif" fontWeight="900" fontSize="26" textAnchor="middle">Zalo</text>
      <rect x="106" y="14" width="54" height="36" rx="7" fill="#00C851" />
      <text x="133" y="39" fill="#FFFFFF" fontFamily="'Montserrat', 'Arial Black', sans-serif" fontWeight="900" fontSize="22" textAnchor="middle">Pay</text>
    </svg>
  )
}

// ─────────────────────────────────────────
// PaymentMethods
// ─────────────────────────────────────────
interface PaymentMethodsProps {
  selected: string
  onSelect: (m: string) => void
}

export function PaymentMethods({ selected, onSelect }: PaymentMethodsProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const methods = [
    {
      id: 'vnpay',
      title: 'VNPay / Thẻ ATM',
      subtitle: 'Quét QR & Internet Banking',
      logo: <VNPayLogo className="h-7 w-auto shrink-0" />,
      enabled: true,
    },
    {
      id: 'momo',
      title: 'Ví MoMo',
      subtitle: 'Sắp ra mắt',
      logo: <MoMoLogo className="h-7 w-7 shrink-0" />,
      enabled: false,
    },
    {
      id: 'zalopay',
      title: 'Ví ZaloPay',
      subtitle: 'Sắp ra mắt',
      logo: <ZaloPayLogo className="h-7 w-auto shrink-0" />,
      enabled: false,
    },
    {
      id: 'cash',
      title: 'Tiền mặt',
      subtitle: 'Thanh toán tại quầy vé',
      logo: null,
      enabled: true,
    },
  ]

  return (
    <div className="mb-7">
      <div className="flex items-center justify-between mb-3.5">
        <h4 className={cn('text-xs sm:text-sm font-bold uppercase font-mono-data flex items-center gap-2', isDark ? 'text-amber-400' : 'text-amber-800')}>
          <CreditCard className="w-4 h-4 text-amber-500" />
          <span>Phương thức thanh toán</span>
        </h4>
        <span className={cn('text-xs font-normal', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
          Chọn 1 phương thức
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {methods.map((m) => {
          const isSelected = selected === m.id || selected === 'Thẻ ngân hàng' || selected === m.title
          return (
            <button
              key={m.id}
              id={`payment-${m.id}`}
              type="button"
              onClick={() => m.enabled && onSelect(m.id)}
              disabled={!m.enabled}
              className={cn(
                'relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between items-start min-h-[105px] cursor-pointer group shadow-xs',
                !m.enabled && 'opacity-40 cursor-not-allowed border-dashed bg-slate-500/5',
                m.enabled && isSelected
                  ? isDark
                    ? 'border-amber-500 bg-amber-500/15 text-[#f0ede8] ring-2 ring-amber-500/40 shadow-lg'
                    : 'border-amber-500 bg-amber-50 text-slate-900 ring-2 ring-amber-500/40 shadow-md'
                  : m.enabled && (isDark
                  ? 'border-white/10 bg-[#111118] text-[#a09e9a] hover:border-white/20 hover:bg-[#161622]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs')
              )}
            >
              {/* Checkmark badge when selected */}
              {m.enabled && isSelected && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}

              {/* Logo Area */}
              <div className="h-8 flex items-center mb-2">
                {m.logo ? (
                  m.logo
                ) : (
                  <span className={cn('text-xs font-bold font-mono-data px-2.5 py-1 rounded-lg border flex items-center gap-1.5', isDark ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-emerald-200 text-emerald-800 bg-emerald-50')}>
                    <Banknote className="w-4 h-4 text-emerald-500" />
                    <span>Tiền mặt</span>
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="w-full">
                <span className={cn('font-bold text-xs block leading-tight', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                  {m.title}
                </span>
                {m.subtitle && (
                  <span
                    className={cn(
                      'text-[10px] mt-1 inline-block px-1.5 py-0.2 rounded font-medium',
                      !m.enabled
                        ? isDark ? 'bg-white/5 text-[#a09e9a]' : 'bg-slate-100 text-slate-500'
                        : isDark ? 'text-amber-400/90' : 'text-amber-700'
                    )}
                  >
                    {m.subtitle}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

