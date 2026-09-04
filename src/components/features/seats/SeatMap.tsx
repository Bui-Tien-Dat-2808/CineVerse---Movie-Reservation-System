import type { SeatItem } from '../../../types'
import { cn } from '../../../lib/utils'
import { useTheme } from '../../../context/ThemeContext'
import SeatLegend from './SeatLegend'

interface SeatMapProps {
  selectedSeats: Set<string>
  onToggle: (key: string) => void
  seats?: SeatItem[]
  isLoading?: boolean
  onRetry?: () => void
}

export default function SeatMap({ selectedSeats, onToggle, seats, isLoading }: SeatMapProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (isLoading) {
    return (
      <div className={`py-20 text-center text-xs font-mono-data ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'} animate-pulse`}>
        ⏳ Đang cập nhật sơ đồ ghế từ hệ thống...
      </div>
    )
  }

  if (!seats || seats.length === 0) {
    return (
      <div className="py-16 text-center text-xs font-mono-data text-[#e07060] bg-[rgba(192,57,43,0.1)] border border-[rgba(192,57,43,0.2)] rounded-xl my-6">
        ⚠ Không thể tải sơ đồ ghế cho suất chiếu này. Vui lòng chọn lại suất chiếu khác hoặc tải lại trang.
      </div>
    )
  }

  // Group seats by row_label
  const rowMap = new Map<string, SeatItem[]>()
  seats.forEach((seat) => {
    const row = seat.row_label
    if (!rowMap.has(row)) rowMap.set(row, [])
    rowMap.get(row)!.push(seat)
  })

  // Sort rows alphabetically
  const rows = Array.from(rowMap.keys()).sort()

  return (
    <div>
      {/* Screen indicator */}
      <div className="text-center mb-9">
        <div
          className="inline-block w-[70%] h-1.5 rounded-full mb-2"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(232,184,75,0.6), transparent)',
            boxShadow: '0 4px 30px rgba(232,184,75,0.2)',
          }}
        />
        <p className={`font-mono-data text-[10px] ${isDark ? 'text-[#6e6c68]' : 'text-slate-600 font-bold'} tracking-[3px] uppercase`}>
          Màn hình
        </p>
      </div>

      {/* Seat grid */}
      <div className="mb-9">
        {rows.map((row) => {
          const rowSeats = (rowMap.get(row) ?? []).sort((a, b) => a.col_number - b.col_number)

          return (
            <div key={row} className="flex justify-center items-center gap-1.5 mb-1.5">
              <span className={`font-mono-data text-[11px] ${isDark ? 'text-[#6e6c68]' : 'text-slate-600 font-bold'} w-5 text-right select-none`}>
                {row}
              </span>

              <div className="flex gap-1.5">
                {rowSeats.map((seat) => {
                  const key = `${seat.row_label}${seat.col_number}`
                  const taken = seat.status === 'booked' || seat.status === 'held'
                  const selected = selectedSeats.has(key)
                  const sType = (seat.seat_type || '').toLowerCase()
                  const isVip = sType === 'vip'
                  const isCouple = sType === 'couple'
                  const isKids = sType === 'kids'

                  return (
                    <button
                      key={seat.id}
                      id={`seat-${key}`}
                      onClick={() => onToggle(key)}
                      disabled={taken}
                      title={`${key}${isCouple ? ' (Ghế đôi)' : isKids ? ' (Ghế trẻ em)' : isVip ? ' (Ghế VIP)' : ''}${taken ? ' (Đã được giữ/đặt)' : ''}`}
                      className={cn(
                        'h-7 rounded-sm font-mono-data text-[9px] transition-all duration-[120ms] border font-bold flex items-center justify-center gap-0.5',
                        isCouple ? 'w-[70px]' : 'w-8',
                        taken
                          ? isDark
                            ? 'bg-[#2e1f1f] border-[#3a2a2a] text-[#5a3a3a] cursor-not-allowed'
                            : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-70'
                          : selected
                            ? 'bg-[#e8b84b] border-[#e8b84b] border-2 text-[#09090e] scale-105 shadow-sm font-extrabold'
                            : isCouple
                              ? isDark
                                ? 'bg-pink-950/40 border-pink-500/60 text-pink-300 cursor-pointer hover:bg-pink-900/60 shadow-xs'
                                : 'bg-pink-100 border-pink-400 text-pink-900 cursor-pointer hover:bg-pink-200 shadow-xs'
                              : isKids
                                ? isDark
                                  ? 'bg-teal-950/40 border-teal-500/60 text-teal-300 cursor-pointer hover:bg-teal-900/60 shadow-xs'
                                  : 'bg-teal-100 border-teal-400 text-teal-900 cursor-pointer hover:bg-teal-200 shadow-xs'
                                : isVip
                                  ? isDark
                                    ? 'bg-[rgba(232,184,75,0.15)] border-[rgba(232,184,75,0.5)] text-[#e8b84b] cursor-pointer hover:bg-[rgba(232,184,75,0.3)]'
                                    : 'bg-amber-100/90 border-amber-400 text-amber-900 cursor-pointer hover:bg-amber-200 shadow-xs'
                                  : isDark
                                    ? 'bg-[#2a2a3a] border-[rgba(240,237,232,0.3)] text-[#c0bdb8] cursor-pointer hover:bg-[#3e3e52]'
                                    : 'bg-slate-100 border-slate-300 text-slate-700 cursor-pointer hover:bg-slate-200 hover:border-slate-400 shadow-xs',
                      )}
                    >
                      {isCouple ? `💑 ${seat.col_number}` : isKids ? `🎈 ${seat.col_number}` : seat.col_number}
                    </button>
                  )
                })}
              </div>

              <span className={`font-mono-data text-[11px] ${isDark ? 'text-[#6e6c68]' : 'text-slate-600 font-bold'} w-5 select-none`}>
                {row}
              </span>
            </div>
          )
        })}
      </div>

      {/* Seat Legend (Filtered dynamically by room's seats) */}
      <SeatLegend seats={seats} />
    </div>
  )
}
