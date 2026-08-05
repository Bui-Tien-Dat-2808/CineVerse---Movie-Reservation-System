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
interface PriceBreakdownProps {
  seatCount: number
  pricePerSeat?: number
  subtotal: number
  discountOverride?: number
}

export function PriceBreakdown({ seatCount, pricePerSeat, subtotal, discountOverride }: PriceBreakdownProps) {
  const discount = discountOverride !== undefined ? discountOverride : 0
  const total = Math.max(0, subtotal - discount)

  const rows = [
    {
      label: pricePerSeat
        ? `${seatCount} vé × ${fmt(pricePerSeat)}`
        : `${seatCount} vé đã chọn`,
      value: fmt(subtotal),
    },
  ]

  if (discount > 0) {
    rows.push({
      label: 'Mã ưu đãi Voucher',
      value: '- ' + fmt(discount),
    })
  }

  return (
    <div className="bg-[#111118] border border-white/[0.08] rounded-md p-5 mb-6">
      <h4 className="font-mono-data text-[13px] text-[#6e6c68] tracking-wide uppercase mb-3.5">
        Chi tiết giá
      </h4>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between mb-2.5 text-sm">
          <span className="text-[#a09e9a]">{label}</span>
          <span className="text-[#f0ede8] font-mono-data">{value}</span>
        </div>
      ))}
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
