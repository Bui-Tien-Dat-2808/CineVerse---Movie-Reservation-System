import { AlertCircle, RefreshCw, Heart, Sparkles } from 'lucide-react'
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
      <div
        className={cn(
          'py-20 text-center text-xs font-mono-data flex items-center justify-center gap-2 animate-pulse',
          isDark ? 'text-[#a09e9a]' : 'text-slate-500',
        )}
      >
        <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
        <span>Đang cập nhật sơ đồ ghế từ hệ thống...</span>
      </div>
    )
  }

  if (!seats || seats.length === 0) {
    return (
      <div
        className={cn(
          'py-14 px-4 text-center text-xs font-mono-data rounded-2xl my-6 flex flex-col items-center justify-center gap-2',
          isDark
            ? 'text-rose-300 bg-rose-500/10 border border-rose-500/20'
            : 'text-rose-800 bg-rose-50 border border-rose-200',
        )}
      >
        <AlertCircle className="w-5 h-5 text-rose-500" />
        <span>Không thể tải sơ đồ ghế cho suất chiếu này. Vui lòng chọn lại suất chiếu khác hoặc tải lại trang.</span>
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
    <div className="w-full select-none">
      {/* 3D Curved Cinema Screen with Ambient Light */}
      <div className="relative text-center mb-10 pt-2 px-6">
        {/* Screen Ambient Glow Fan */}
        <div
          className="mx-auto w-[85%] max-w-[560px] h-12 opacity-35 pointer-events-none transition-all duration-500"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at 50% 0%, rgba(232,184,75,0.45) 0%, rgba(232,184,75,0.08) 50%, transparent 80%)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.35) 0%, rgba(245,158,11,0.05) 50%, transparent 80%)',
          }}
        />

        {/* 3D Curved Screen Arc */}
        <div className="relative mx-auto w-[85%] max-w-[560px] -mt-4">
          <svg viewBox="0 0 500 40" className="w-full overflow-visible">
            <defs>
              <linearGradient id="curvedScreenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={isDark ? '#3a3a4c' : '#cbd5e1'} stopOpacity="0.2" />
                <stop offset="25%" stopColor={isDark ? '#e8b84b' : '#f59e0b'} stopOpacity="0.8" />
                <stop offset="50%" stopColor={isDark ? '#ffffff' : '#ffffff'} stopOpacity="1" />
                <stop offset="75%" stopColor={isDark ? '#e8b84b' : '#f59e0b'} stopOpacity="0.8" />
                <stop offset="100%" stopColor={isDark ? '#3a3a4c' : '#cbd5e1'} stopOpacity="0.2" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 10 32 Q 250 4 490 32"
              fill="none"
              stroke="url(#curvedScreenGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              filter="url(#glow)"
            />
          </svg>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span
              className={cn(
                'font-mono-data text-[10px] font-extrabold tracking-[4px] uppercase',
                isDark ? 'text-amber-400/90' : 'text-amber-700 font-black',
              )}
            >
              MÀN HÌNH CHÍNH
            </span>
          </div>
        </div>
      </div>

      {/* Seat grid */}
      <div className="mb-9 overflow-x-auto pb-4 scrollbar-thin">
        {rows.map((row) => {
          const rowSeats = (rowMap.get(row) ?? []).sort((a, b) => a.col_number - b.col_number)

          return (
            <div key={row} className="flex justify-center items-center gap-1.5 mb-1.5 min-w-max px-2">
              {/* Left Row Label */}
              <span
                className={cn(
                  'font-mono-data text-[11px] font-extrabold w-5 text-right select-none',
                  isDark ? 'text-[#6e6c68]' : 'text-slate-500',
                )}
              >
                {row}
              </span>

              {/* Seats in Row */}
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
                      type="button"
                      onClick={() => onToggle(key)}
                      disabled={taken}
                      title={`${key}${
                        isCouple
                          ? ' (Ghế Sweetbox)'
                          : isKids
                          ? ' (Ghế trẻ em)'
                          : isVip
                          ? ' (Ghế VIP)'
                          : ' (Ghế thường)'
                      }${taken ? ' - Đã có người giữ/đặt' : ''}`}
                      className={cn(
                        'h-7 rounded-lg font-mono-data text-[10px] transition-all duration-150 border font-bold flex items-center justify-center gap-1',
                        isCouple ? 'w-[72px]' : 'w-8',
                        taken
                          ? isDark
                            ? 'bg-[#1b1a24] border-white/5 text-[#444252] cursor-not-allowed opacity-50'
                            : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                          : selected
                          ? 'bg-[#e8b84b] border-[#e8b84b] text-[#09090e] scale-105 shadow-md shadow-[#e8b84b]/30 font-black'
                          : isCouple
                          ? isDark
                            ? 'bg-pink-950/40 border-pink-500/50 text-pink-300 cursor-pointer hover:bg-pink-900/60 shadow-xs'
                            : 'bg-pink-50 border-pink-400 text-pink-900 cursor-pointer hover:bg-pink-100 shadow-xs'
                          : isKids
                          ? isDark
                            ? 'bg-teal-950/40 border-teal-500/50 text-teal-300 cursor-pointer hover:bg-teal-900/60 shadow-xs'
                            : 'bg-teal-50 border-teal-400 text-teal-900 cursor-pointer hover:bg-teal-100 shadow-xs'
                          : isVip
                          ? isDark
                            ? 'bg-[#e8b84b]/15 border-[#e8b84b]/50 text-[#e8b84b] cursor-pointer hover:bg-[#e8b84b]/30 shadow-xs'
                            : 'bg-amber-50 border-amber-400 text-amber-900 cursor-pointer hover:bg-amber-100 shadow-xs'
                          : isDark
                          ? 'bg-[#1a1a26] border-white/15 text-[#c0bdb8] cursor-pointer hover:bg-[#28283a] hover:border-white/30'
                          : 'bg-white border-slate-300 text-slate-700 cursor-pointer hover:bg-slate-100 hover:border-slate-400 shadow-xs',
                      )}
                    >
                      {isCouple ? (
                        <>
                          <Heart className="w-2.5 h-2.5 fill-current opacity-70" />
                          <span>{seat.col_number}</span>
                        </>
                      ) : isKids ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5 opacity-70" />
                          <span>{seat.col_number}</span>
                        </>
                      ) : (
                        seat.col_number
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Right Row Label */}
              <span
                className={cn(
                  'font-mono-data text-[11px] font-extrabold w-5 select-none',
                  isDark ? 'text-[#6e6c68]' : 'text-slate-500',
                )}
              >
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
