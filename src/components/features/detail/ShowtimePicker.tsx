import { useMemo } from 'react'
import type { ShowTime } from '../../../types'
import { fmt, getDateList } from '../../../lib/utils'
import { cn } from '../../../lib/utils'
import { ShowtimeTypeBadge } from '../../ui/Badge'
import DatePicker from './DatePicker'

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

  // Lọc suất chiếu CHÍNH XÁC theo ngày được chọn
  const displayShowtimes = useMemo(() => {
    const safeList = Array.isArray(showtimes) ? showtimes : []
    return safeList.filter((st) => st.date === selectedDateStr)
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
        <h3 className="font-display text-lg font-semibold">Suất chiếu</h3>
        {isLoading && (
          <span className="font-mono-data text-xs text-[#6e6c68] animate-pulse">
            Đang tải suất chiếu...
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono-data text-[#a09e9a] animate-pulse">
          ⏳ Đang kiểm tra lịch chiếu...
        </div>
      ) : isError ? (
        <div className="py-8 px-4 text-center text-xs bg-[rgba(192,57,43,0.12)] border border-[rgba(192,57,43,0.3)] rounded-xl my-4 space-y-3">
          <p className="text-[#e07060] font-medium">⚠ Không thể tải danh sách suất chiếu từ máy chủ.</p>
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
        <div className="py-8 px-4 text-center text-xs text-[#a09e9a] bg-[#111118] border border-white/10 rounded-xl my-4">
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
              <div key={type} className="bg-[#09090e]/80 border border-white/10 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold font-mono-data text-[#e8b84b] uppercase tracking-wider flex items-center gap-2">
                    <span>{typeLabel}</span>
                  </h4>
                  <span className="text-[11px] text-[#a09e9a] font-mono-data">{list.length} suất chiếu</span>
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
                            ? 'border-[#e8b84b] bg-[rgba(232,184,75,0.12)] shadow-[0_0_16px_rgba(232,184,75,0.2)] font-semibold scale-[1.02]'
                            : 'border-white/10 bg-[#111118] hover:border-white/20 hover:bg-white/[0.06]',
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono-data text-sm font-bold text-[#f0ede8]">{st.time}</span>
                          <ShowtimeTypeBadge type={st.type} price={fmt(st.price)} />
                        </div>

                        <div className="flex items-center justify-between w-full text-[11px] text-[#a09e9a] mt-0.5">
                          <span>{st.hall}</span>
                          <span className="font-mono-data font-semibold text-[#e8b84b]">
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
        className="w-full bg-[#e8b84b] text-[#09090e] border-0 rounded-lg py-4 text-sm font-bold cursor-pointer transition-all duration-150 hover:shadow-[0_4px_24px_rgba(232,184,75,0.4)] disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
      >
        {selectedShowtime ? `Chọn ghế cho suất ${selectedShowtime.time} (${selectedShowtime.hall}) →` : 'Vui lòng chọn suất chiếu'}
      </button>
    </div>
  )
}
