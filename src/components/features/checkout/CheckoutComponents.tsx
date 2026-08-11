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
// PaymentMethods
// ─────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'vnpay', label: '💳 VNPay / ATM', enabled: true },
  { id: 'momo', label: '📱 MoMo (Sắp hỗ trợ)', enabled: false },
  { id: 'zalopay', label: '👛 ZaloPay (Sắp hỗ trợ)', enabled: false },
  { id: 'cash', label: '💵 Tiền mặt (Tại rạp)', enabled: false },
]

interface PaymentMethodsProps {
  selected: string
  onSelect: (m: string) => void
}

export function PaymentMethods({ selected, onSelect }: PaymentMethodsProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="mb-7">
      <h4 className={cn('text-sm font-extrabold mb-3.5', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
        Phương thức thanh toán
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PAYMENT_METHODS.map((m) => {
          const isSelected = selected === m.id || selected === 'Thẻ ngân hàng' || selected === m.label
          return (
            <button
              key={m.id}
              id={`payment-${m.id}`}
              type="button"
              onClick={() => m.enabled && onSelect(m.id)}
              disabled={!m.enabled}
              className={cn(
                'py-3 px-2 rounded-xl text-xs font-bold cursor-pointer border transition-all duration-150 shadow-xs flex flex-col items-center justify-center gap-1',
                !m.enabled && 'opacity-40 cursor-not-allowed border-slate-200/20 bg-slate-500/5',
                m.enabled && isSelected
                  ? isDark
                    ? 'border-[#e8b84b] bg-[#e8b84b]/15 text-[#e8b84b] font-black ring-1 ring-[#e8b84b]/30'
                    : 'border-amber-500 bg-amber-50 text-amber-950 font-black shadow-md ring-1 ring-amber-400'
                  : m.enabled && (isDark
                  ? 'border-white/10 bg-[#111118] text-[#a09e9a] hover:border-white/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')
              )}
            >
              <span>{m.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
