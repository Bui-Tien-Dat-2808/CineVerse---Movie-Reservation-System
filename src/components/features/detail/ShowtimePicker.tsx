import { useMemo } from 'react'
import type { ShowTime } from '../../../types'
import { fmt, getDateList } from '../../../lib/utils'
import { cn } from '../../../lib/utils'
import { ShowtimeTypeBadge } from '../../ui/Badge'
import DatePicker from './DatePicker'
import { useTheme } from '../../../context/ThemeContext'

interface ShowtimePickerProps {
  selectedDate: number
  selectedShowtime: ShowTime | null
  showtimes?: ShowTime[]
  onDateChange: (i: number) => void
  onShowtimeChange: (st: ShowTime) => void
  onSelectSeats: () => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
}

function formatYYYYMMDD(d: Date): string {
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ShowtimePicker({
  selectedDate,
  selectedShowtime,
  showtimes = [],
  onDateChange,
  onShowtimeChange,
  onSelectSeats,
  isLoading,
  isError,
  onRetry,
}: ShowtimePickerProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Lấy danh sách ngày có suất chiếu thực tế từ backend
  const { dateStrs, dateObjects } = useMemo(() => {
    const todayStr = formatYYYYMMDD(new Date())
    if (!showtimes || showtimes.length === 0) {
      const default7 = getDateList(7)
      return {
        dateStrs: default7.map(formatYYYYMMDD),
        dateObjects: default7,
      }
    }

    const set = new Set<string>()
    for (const st of showtimes) {
      if (st.date && st.date >= todayStr) {
        set.add(st.date)
      }
    }

    const sortedStrs = Array.from(set).sort()
    if (sortedStrs.length === 0) {
      const default7 = getDateList(7)
      return {
        dateStrs: default7.map(formatYYYYMMDD),
        dateObjects: default7,
      }
    }

    const objects = sortedStrs.map((dStr) => {
      const [y, m, d] = dStr.split('-').map(Number)
      return new Date(y, m - 1, d)
    })

    return {
      dateStrs: sortedStrs,
      dateObjects: objects,
    }
  }, [showtimes])

  // Đảm bảo chỉ số ngày hợp lệ
  const safeDateIdx = selectedDate < dateObjects.length ? selectedDate : 0
  const selectedDateStr = dateStrs[safeDateIdx] || dateStrs[0]

  // Lọc suất chiếu CHÍNH XÁC theo ngày được chọn & loại bỏ các suất đã chiếu (quá giờ)
  const displayShowtimes = useMemo(() => {
    const safeList = Array.isArray(showtimes) ? showtimes : []
    const nowMs = Date.now()

    return safeList.filter((st) => {
      if (st.date !== selectedDateStr) return false
      // Exclude showtimes that have already started / passed
      const stTimeMs = new Date(`${st.date}T${st.time}:00`).getTime()
      return stTimeMs > nowMs
    })
  }, [showtimes, selectedDateStr])

  // Group showtimes by room type and sort chronologically by time (HH:MM)
  const groupedShowtimes = useMemo(() => {
    const map = new Map<string, ShowTime[]>()

    // Sort showtimes chronologically ascending (08:00 -> 10:30 -> 13:30 -> 17:30 -> 20:15)
    const sorted = [...displayShowtimes].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    for (const st of sorted) {
      const typeKey = st.type || 'Standard'
      if (!map.has(typeKey)) {
        map.set(typeKey, [])
      }
      map.get(typeKey)!.push(st)
    }

    // Desired display priority for room types
    const priority = ['IMAX', '4DX', 'VIP', '3D', 'Kids', 'Standard']
    const result: Array<{ type: string; list: ShowTime[] }> = []

    for (const p of priority) {
      if (map.has(p)) {
        result.push({ type: p, list: map.get(p)! })
        map.delete(p)
      }
    }

    // Any remaining types
    map.forEach((list, type) => {
      result.push({ type, list })
    })

    return result
  }, [displayShowtimes])

  return (
    <div>
      {/* Date picker */}
      <DatePicker dates={dateObjects} selectedDate={safeDateIdx} onDateChange={onDateChange} />

      {/* Showtime header */}
      <div className="flex justify-between items-baseline mb-4 mt-8">
        <h3 className={`font-display text-lg font-semibold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>Suất chiếu</h3>
        {isLoading && (
          <span className={`font-mono-data text-xs animate-pulse ${isDark ? 'text-[#6e6c68]' : 'text-slate-500'}`}>
            Đang tải suất chiếu...
          </span>
        )}
      </div>

      {isLoading ? (
        <div className={`py-8 text-center text-xs font-mono-data animate-pulse ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
          ⏳ Đang kiểm tra lịch chiếu...
        </div>
      ) : isError ? (
        <div className={`py-8 px-4 text-center text-xs border rounded-xl my-4 space-y-3 ${
          isDark ? 'bg-[rgba(192,57,43,0.12)] border-[rgba(192,57,43,0.3)]' : 'bg-red-50 border-red-200'
        }`}>
          <p className={isDark ? 'text-[#e07060] font-medium' : 'text-red-700 font-semibold'}>⚠ Không thể tải danh sách suất chiếu từ máy chủ.</p>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry()}
              className="px-3.5 py-1.5 bg-[#e8b84b] text-[#09090e] font-bold rounded-lg text-xs cursor-pointer hover:brightness-110 shadow-md"
            >
              🔄 Thử lại
            </button>
          )}
        </div>
      ) : displayShowtimes.length === 0 ? (
        <div className={`py-8 px-4 text-center text-xs border rounded-xl my-4 ${
          isDark ? 'text-[#a09e9a] bg-[#111118] border-white/10' : 'text-slate-500 bg-white border-slate-200 shadow-sm'
        }`}>
          🍿 Chưa có suất chiếu nào được lên lịch cho ngày này. Vui lòng chọn ngày khác.
        </div>
      ) : (
        <div className="space-y-6 mb-9">
          {groupedShowtimes.map(({ type, list }) => {
            const typeLabel =
              type === 'IMAX'
                ? '📽️ PHÒNG IMAX 3D'
                : type === '4DX'
                ? '⚡ PHÒNG 4DX MOTION'
                : type === 'VIP'
                ? '👑 PHÒNG VIP GOLD LOUNGE'
                : type === '3D'
                ? '🔊 PHÒNG 3D SURROUND'
                : type === 'Kids'
                ? '🎈 PHÒNG KIDS FAMILY'
                : '🎬 PHÒNG STANDARD'

            return (
              <div key={type} className={`p-4 rounded-xl space-y-3 border transition-colors ${
                isDark ? 'bg-[#09090e]/80 border-white/10' : 'bg-white border-slate-200 shadow-md'
              }`}>
                <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  <h4 className={`text-xs font-bold font-mono-data uppercase tracking-wider flex items-center gap-2 ${
                    isDark ? 'text-[#e8b84b]' : 'text-amber-600'
                  }`}>
                    <span>{typeLabel}</span>
                  </h4>
                  <span className={`text-[11px] font-mono-data ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>{list.length} suất chiếu</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {list.map((st) => {
                    const isSelected = selectedShowtime?.id === st.id

                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onShowtimeChange(st)}
                        className={cn(
                          'flex flex-col items-start gap-1 p-3 rounded-lg border text-left cursor-pointer transition-all duration-150',
                          isSelected
                            ? isDark
                              ? 'border-[#e8b84b] bg-[rgba(232,184,75,0.12)] shadow-[0_0_16px_rgba(232,184,75,0.2)] font-semibold scale-[1.02]'
                              : 'border-amber-500 bg-amber-50 shadow-md font-semibold scale-[1.02]'
                            : isDark
                              ? 'border-white/10 bg-[#111118] hover:border-white/20 hover:bg-white/[0.06]'
                              : 'border-slate-200 bg-slate-50 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-sm'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-mono-data text-sm font-bold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>{st.time}</span>
                          <ShowtimeTypeBadge type={st.type} price={fmt(st.price)} />
                        </div>

                        <div className={`flex items-center justify-between w-full text-[11px] mt-0.5 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                          <span>{st.hall}</span>
                          <span className={`font-mono-data font-semibold ${isDark ? 'text-[#e8b84b]' : 'text-amber-600'}`}>
                            {fmt(st.price)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Select Seats Action */}
      <button
        onClick={onSelectSeats}
        disabled={!selectedShowtime}
        className="w-full bg-[#e8b84b] text-[#09090e] border-0 rounded-lg py-4 text-sm font-bold cursor-pointer transition-all duration-150 hover:shadow-[0_4px_24px_rgba(232,184,75,0.4)] disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider shadow-md"
      >
        {selectedShowtime ? `Chọn ghế cho suất ${selectedShowtime.time} (${selectedShowtime.hall}) →` : 'Vui lòng chọn suất chiếu'}
      </button>
    </div>
  )
}
