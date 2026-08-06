import type { ShowTime } from '../../../types'
import { fmt } from '../../../lib/utils'
import { cn } from '../../../lib/utils'
import { useTheme } from '../../../context/ThemeContext'

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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const sorted = [...selectedSeats].sort()
  const hasSeats = selectedSeats.size > 0

  return (
    <div
      className={cn(
        'rounded-xl px-6 py-5 flex justify-between items-center gap-6 flex-wrap transition-colors duration-200 border',
        isDark
          ? 'bg-[#111118] border-white/[0.08]'
          : 'bg-white border-slate-200 shadow-xl text-slate-900',
      )}
    >
      {/* Selected seats list */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-[13px] mb-1 font-semibold', isDark ? 'text-[#6e6c68]' : 'text-slate-500')}>
          Ghế đã chọn
        </p>
        {hasSeats ? (
          <div className="flex gap-1.5 flex-wrap">
            {sorted.map((s) => (
              <span
                key={s}
                className={cn(
                  'font-mono-data text-xs px-2.5 py-0.5 rounded-md font-bold border',
                  isDark
                    ? 'bg-[rgba(232,184,75,0.15)] border-amber-500/30 text-[#e8b84b]'
                    : 'bg-amber-100 border-amber-300 text-amber-900',
                )}
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className={cn('text-sm font-medium', isDark ? 'text-[#4e4c48]' : 'text-slate-400')}>
            Chưa chọn ghế nào
          </p>
        )}
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p className={cn('text-[13px] mb-0.5 font-semibold', isDark ? 'text-[#6e6c68]' : 'text-slate-500')}>
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
          'flex-shrink-0 px-8 py-3.5 rounded-lg border-0 text-sm font-bold tracking-wide transition-all duration-200 whitespace-nowrap',
          hasSeats
            ? 'bg-[#e8b84b] text-[#09090e] cursor-pointer hover:shadow-[0_6px_20px_rgba(232,184,75,0.35)] hover:-translate-y-px font-bold'
            : isDark
            ? 'bg-[#2a2a38] text-[#6e6c68] cursor-not-allowed'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed',
        )}
      >
        Tiếp tục →
      </button>
    </div>
  )
}
