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

  return (
    <div
      className={cn(
        'border rounded-2xl overflow-hidden mb-6 shadow-md transition-colors',
        isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
      )}
    >
      <div className="flex">
        <img
          src={movie.img}
          alt={movie.title}
          className="w-[120px] object-cover flex-shrink-0"
        />
        <div className="p-5">
          <p className={cn('font-mono-data text-[10px] font-bold tracking-[2px] uppercase mb-1.5', isDark ? 'text-[#e8b84b]' : 'text-amber-800')}>
            {showtime.type}
          </p>
          <h3 className={cn('font-display text-xl font-bold mb-2.5 leading-tight', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
            {movie.title}
          </h3>
          <div className={cn('text-[13px] flex flex-col gap-1 font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
            <span>
              📅{' '}
              {dates[selectedDate].toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span>
              🕐 {showtime.time} · {showtime.hall}
            </span>
            <span>🎬 {movie.director}</span>
          </div>
        </div>
      </div>

      <div className={cn('border-t px-5 py-4', isDark ? 'border-white/10' : 'border-slate-200 bg-slate-50/50')}>
        <p className={cn('text-xs mb-2 font-mono-data font-bold uppercase', isDark ? 'text-[#6e6c68]' : 'text-slate-500')}>
          Ghế đã chọn
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {[...selectedSeats].sort().map((s) => (
            <span
              key={s}
              className={cn(
                'font-mono-data text-xs px-2.5 py-0.5 rounded border font-black',
                isDark
                  ? 'bg-[#e8b84b]/15 text-[#e8b84b] border-[#e8b84b]/30'
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
}

interface PriceBreakdownProps {
  seatCount: number
  pricePerSeat?: number
  subtotal: number
  discountOverride?: number
  concessionTotal?: number
  concessionItems?: ConcessionItemDetail[]
  onRemoveConcession?: (id: number) => void
}

export function PriceBreakdown({
  seatCount,
  pricePerSeat,
  subtotal,
  discountOverride,
  concessionTotal = 0,
  concessionItems = [],
  onRemoveConcession,
}: PriceBreakdownProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const discount = discountOverride !== undefined ? discountOverride : 0
  const total = Math.max(0, subtotal - discount + concessionTotal)

  return (
    <div
      className={cn(
        'border rounded-2xl p-5 mb-6 shadow-md transition-colors',
        isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
      )}
    >
      <h4 className={cn('font-mono-data text-[13px] tracking-wide uppercase mb-3.5 font-extrabold', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
        Chi tiết giá
      </h4>

      {/* Ticket Row */}
      <div className="flex justify-between mb-2.5 text-sm font-medium">
        <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-600'}>
          {pricePerSeat ? `${seatCount} vé × ${fmt(pricePerSeat)}` : `${seatCount} vé đã chọn`}
        </span>
        <span className={cn('font-mono-data font-bold', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
          {fmt(subtotal)}
        </span>
      </div>

      {/* List each selected concession item */}
      {concessionItems.length > 0 && (
        <div className={cn('my-2.5 py-2.5 border-t border-b space-y-2.5', isDark ? 'border-white/10' : 'border-slate-200')}>
          {concessionItems.map((item) => {
            const itemTotal = Number(item.price) * item.quantity
            const emoji =
              item.category === 'snack' ? '🧀' :
              item.category === 'drink' ? '🥤' :
              item.category === 'food' ? '🌭' : '🍿'

            return (
              <div key={item.id} className="flex justify-between items-center text-sm gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{emoji}</span>
                  <span className={cn('font-medium truncate', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>{item.name}</span>
                  <span className={cn(
                    'font-mono-data font-bold text-xs px-2 py-0.5 rounded-full shrink-0 border',
                    isDark ? 'bg-[#e8b84b]/15 text-[#e8b84b] border-[#e8b84b]/30' : 'bg-amber-100 text-amber-900 border-amber-300'
                  )}>
                    ×{item.quantity}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('font-mono-data font-semibold', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>{fmt(itemTotal)}</span>
                  {onRemoveConcession && (
                    <button
                      type="button"
                      onClick={() => onRemoveConcession(item.id)}
                      className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold text-xs flex items-center justify-center transition-all cursor-pointer border border-red-500/40"
                      title={`Gỡ bỏ ${item.name}`}
                      aria-label={`Gỡ bỏ ${item.name}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Discount */}
      {discount > 0 && (
        <div className="flex justify-between mb-2.5 text-sm font-medium">
          <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-600'}>Mã ưu đãi Voucher</span>
          <span className="text-emerald-500 font-mono-data font-bold">- {fmt(discount)}</span>
        </div>
      )}

      {/* Total */}
      <div className={cn('border-t pt-3.5 mt-1 flex justify-between items-baseline', isDark ? 'border-white/10' : 'border-slate-200')}>
        <span className={cn('text-sm font-black', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>Tổng cộng</span>
        <span className={cn('font-display text-[28px] font-black', isDark ? 'text-[#e8b84b]' : 'text-amber-600')}>{fmt(total)}</span>
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
      title: 'VNPay / ATM',
      subtitle: 'Cổng thanh toán online',
      logo: <VNPayLogo className="h-7 w-auto shrink-0" />,
      enabled: true,
    },
    {
      id: 'momo',
      title: 'Ví MoMo',
      subtitle: 'Sắp hỗ trợ',
      logo: <MoMoLogo className="h-7 w-7 shrink-0" />,
      enabled: false,
    },
    {
      id: 'zalopay',
      title: 'Ví ZaloPay',
      subtitle: 'Sắp hỗ trợ',
      logo: <ZaloPayLogo className="h-7 w-auto shrink-0" />,
      enabled: false,
    },
    {
      id: 'cash',
      title: 'Tiền mặt',
      subtitle: 'Thanh toán tại rạp chiếu',
      logo: null,
      enabled: true,
    },
  ]

  return (
    <div className="mb-7">
      <div className="flex items-center justify-between mb-3.5">
        <h4 className={cn('text-sm font-extrabold', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
          Phương thức thanh toán
        </h4>
        <span className={cn('text-xs font-normal', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
          Chọn 1 phương thức để tiếp tục
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
                'relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between items-start min-h-[100px] cursor-pointer group',
                !m.enabled && 'opacity-40 cursor-not-allowed border-dashed bg-slate-500/5',
                m.enabled && isSelected
                  ? isDark
                    ? 'border-[#e8b84b] bg-[#e8b84b]/15 text-[#f0ede8] ring-2 ring-[#e8b84b]/40 shadow-lg'
                    : 'border-amber-500 bg-amber-50 text-slate-900 ring-2 ring-amber-500/40 shadow-md'
                  : m.enabled && (isDark
                  ? 'border-white/10 bg-[#111118] text-[#a09e9a] hover:border-white/20 hover:bg-[#161622]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs')
              )}
            >
              {/* Checkmark badge when selected */}
              {m.enabled && isSelected && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-sm">
                  ✓
                </span>
              )}

              {/* Logo Area */}
              <div className="h-8 flex items-center mb-2">
                {m.logo ? (
                  m.logo
                ) : (
                  <span className={cn('text-xs font-bold font-mono-data px-2 py-0.5 rounded border', isDark ? 'border-white/10 text-[#a09e9a]' : 'border-slate-200 text-slate-500')}>
                    💵 Tiền mặt
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
