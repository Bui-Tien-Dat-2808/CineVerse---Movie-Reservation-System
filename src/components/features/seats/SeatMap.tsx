import type { SeatItem } from '../../../types'
import { cn } from '../../../lib/utils'

interface SeatMapProps {
  selectedSeats: Set<string>
  onToggle: (key: string) => void
  seats?: SeatItem[]
  isLoading?: boolean
}

export default function SeatMap({ selectedSeats, onToggle, seats, isLoading }: SeatMapProps) {
  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs font-mono-data text-[#a09e9a] animate-pulse">
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
        <p className="font-mono-data text-[10px] text-[#6e6c68] tracking-[3px] uppercase">
          Màn hình
        </p>
      </div>

      {/* Seat grid */}
      <div className="mb-9">
        {rows.map((row) => {
          const rowSeats = (rowMap.get(row) ?? []).sort((a, b) => a.col_number - b.col_number)

          return (
            <div key={row} className="flex justify-center items-center gap-1.5 mb-1.5">
              <span className="font-mono-data text-[11px] text-[#6e6c68] w-5 text-right select-none">
                {row}
              </span>

              <div className="flex gap-1.5">
                {rowSeats.map((seat) => {
                  const key = `${seat.row_label}${seat.col_number}`
                  const taken = seat.status === 'booked' || seat.status === 'held'
                  const selected = selectedSeats.has(key)
                  const isVip = seat.seat_type === 'vip'

                  return (
                    <button
                      key={seat.id}
                      id={`seat-${key}`}
                      onClick={() => onToggle(key)}
                      disabled={taken}
                      title={`${key}${isVip ? ' (VIP)' : ''}${taken ? ' (Đã được giữ/đặt)' : ''}`}
                      className={cn(
                        'w-8 h-7 rounded-sm font-mono-data text-[9px] transition-all duration-[120ms] border',
                        taken
                          ? 'bg-[#2e1f1f] border-[#3a2a2a] text-[#5a3a3a] cursor-not-allowed'
                          : selected
                            ? 'bg-[#e8b84b] border-[#e8b84b] border-2 text-[#09090e] scale-105'
                            : isVip
                              ? 'bg-[rgba(232,184,75,0.15)] border-[rgba(232,184,75,0.5)] text-[#e8b84b] cursor-pointer hover:bg-[rgba(232,184,75,0.3)]'
                              : 'bg-[#2a2a3a] border-[rgba(240,237,232,0.3)] text-[#c0bdb8] cursor-pointer hover:bg-[#3e3e52]',
                      )}
                    >
                      {seat.col_number}
                    </button>
                  )
                })}
              </div>

              <span className="font-mono-data text-[11px] text-[#6e6c68] w-5 select-none">
                {row}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
