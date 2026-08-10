import { useState } from 'react'
import type { Movie, ShowTime } from '../../../types'
import { fmt } from '../../../lib/utils'
import { cn } from '../../../lib/utils'
import { getDateList } from '../../../lib/utils'

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
  const dates = getDateList(7)
  return (
    <div className="bg-[#111118] border border-white/[0.08] rounded-md overflow-hidden mb-6">
      <div className="flex">
        <img
          src={movie.img}
          alt={movie.title}
          className="w-[120px] object-cover flex-shrink-0"
        />
        <div className="p-5">
          <p className="font-mono-data text-[10px] text-[#6e6c68] tracking-[2px] uppercase mb-1.5">
            {showtime.type}
          </p>
          <h3 className="font-display text-xl font-bold mb-2.5 leading-tight">{movie.title}</h3>
          <div className="text-[13px] text-[#a09e9a] flex flex-col gap-1">
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

      <div className="border-t border-white/[0.06] px-5 py-4">
        <p className="text-xs text-[#6e6c68] mb-2">Ghế đã chọn</p>
        <div className="flex gap-1.5 flex-wrap">
          {[...selectedSeats].sort().map((s) => (
            <span
              key={s}
              className="font-mono-data text-xs bg-[rgba(232,184,75,0.12)] text-[#e8b84b] px-2.5 py-0.5 rounded-sm"
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
  const discount = discountOverride !== undefined ? discountOverride : 0
  const total = Math.max(0, subtotal - discount + concessionTotal)

  return (
    <div className="bg-[#111118] border border-white/[0.08] rounded-md p-5 mb-6">
      <h4 className="font-mono-data text-[13px] text-[#6e6c68] tracking-wide uppercase mb-3.5">
        Chi tiết giá
      </h4>

      {/* Ticket Row */}
      <div className="flex justify-between mb-2.5 text-sm">
        <span className="text-[#a09e9a]">
          {pricePerSeat ? `${seatCount} vé × ${fmt(pricePerSeat)}` : `${seatCount} vé đã chọn`}
        </span>
        <span className="text-[#f0ede8] font-mono-data">{fmt(subtotal)}</span>
      </div>

      {/* List each selected concession item */}
      {concessionItems.length > 0 && (
        <div className="my-2.5 py-2.5 border-t border-b border-white/[0.06] space-y-2.5">
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
                  <span className="text-[#a09e9a] font-medium truncate">{item.name}</span>
                  <span className="font-mono-data font-bold text-xs text-[#e8b84b] bg-[#e8b84b]/15 px-2 py-0.5 rounded-full shrink-0">
                    ×{item.quantity}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[#f0ede8] font-mono-data font-semibold">{fmt(itemTotal)}</span>
                  {onRemoveConcession && (
                    <button
                      type="button"
                      onClick={() => onRemoveConcession(item.id)}
                      className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-200 font-bold text-xs flex items-center justify-center transition-all cursor-pointer border border-red-500/40"
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
        <div className="flex justify-between mb-2.5 text-sm">
          <span className="text-[#a09e9a]">Mã ưu đãi Voucher</span>
          <span className="text-[#2ecc71] font-mono-data">- {fmt(discount)}</span>
        </div>
      )}

      {/* Total */}
      <div className="border-t border-white/[0.08] pt-3.5 mt-1 flex justify-between items-baseline">
        <span className="text-sm font-semibold">Tổng cộng</span>
        <span className="font-display text-[28px] font-black text-[#e8b84b]">{fmt(total)}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// PaymentMethods
// ─────────────────────────────────────────
const METHODS = ['Thẻ ngân hàng', 'MoMo', 'ZaloPay', 'Tiền mặt']

interface PaymentMethodsProps {
  selected: string
  onSelect: (m: string) => void
}

export function PaymentMethods({ selected, onSelect }: PaymentMethodsProps) {
  return (
    <div className="mb-7">
      <h4 className="text-sm font-semibold mb-3.5">Phương thức thanh toán</h4>
      <div className="grid grid-cols-4 gap-2.5">
        {METHODS.map((m) => (
          <button
            key={m}
            id={`payment-${m.toLowerCase().replace(/\s/g, '-')}`}
            onClick={() => onSelect(m)}
            className={cn(
              'py-3 px-2 rounded text-xs font-medium cursor-pointer border transition-all duration-150',
              selected === m
                ? 'border-[#e8b84b] bg-[rgba(232,184,75,0.1)] text-[#e8b84b]'
                : 'border-white/[0.08] bg-[#111118] text-[#a09e9a] hover:border-white/20',
            )}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
