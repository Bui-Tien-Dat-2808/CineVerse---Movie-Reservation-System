import type { ShowTime } from '../../../types'
import { fmt } from '../../../lib/utils'
import { cn } from '../../../lib/utils'

interface SeatSummaryBarProps {
  selectedSeats: Set<string>
  showtime: ShowTime
  totalPrice: number
  onContinue: () => void
}

export default function SeatSummaryBar({
  selectedSeats,
  showtime,
  totalPrice,
  onContinue,
}: SeatSummaryBarProps) {
  const sorted = [...selectedSeats].sort()
  const hasSeats = selectedSeats.size > 0

  return (
    <div className="bg-[#111118] border border-white/[0.08] rounded-md px-6 py-5 flex justify-between items-center gap-6 flex-wrap">
      {/* Selected seats list */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[#6e6c68] mb-1">Ghế đã chọn</p>
        {hasSeats ? (
          <div className="flex gap-1.5 flex-wrap">
            {sorted.map((s) => (
              <span
                key={s}
                className="font-mono-data text-xs bg-[rgba(232,184,75,0.15)] text-[#e8b84b] px-2 py-0.5 rounded-sm"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#4e4c48]">Chưa chọn ghế nào</p>
        )}
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p className="text-[13px] text-[#6e6c68] mb-0.5">
          {selectedSeats.size} ghế đã chọn
        </p>
        <p className="font-display text-[28px] font-bold text-[#e8b84b] leading-none">
          {fmt(totalPrice)}
        </p>
      </div>

      {/* CTA */}
      <button
        id="continue-to-checkout-btn"
        onClick={onContinue}
        disabled={!hasSeats}
        className={cn(
          'flex-shrink-0 px-8 py-3.5 rounded border-0 text-sm font-bold tracking-wide transition-all duration-200 whitespace-nowrap',
          hasSeats
            ? 'bg-[#e8b84b] text-[#09090e] cursor-pointer hover:shadow-[0_6px_20px_rgba(232,184,75,0.35)] hover:-translate-y-px'
            : 'bg-[#2a2a38] text-[#6e6c68] cursor-not-allowed',
        )}
      >
        Tiếp tục →
      </button>
    </div>
  )
}
