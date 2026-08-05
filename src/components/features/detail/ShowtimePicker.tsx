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

const DATES = getDateList(7)

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
  // Lấy chuỗi ngày YYYY-MM-DD cho ngày đang chọn
  const selectedDateStr = formatYYYYMMDD(DATES[selectedDate])

  // Lọc suất chiếu theo ngày đang chọn
  const dateFiltered = showtimes.filter((st) => !st.date || st.date === selectedDateStr)
  const displayShowtimes = dateFiltered.length > 0 ? dateFiltered : showtimes

  return (
    <div>
      {/* Date picker */}
      <DatePicker selectedDate={selectedDate} onDateChange={onDateChange} />

      {/* Showtime grid */}
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
        <div className="flex gap-2.5 flex-wrap mb-9">
          {displayShowtimes.map((st, i) => {
            const isSelected = selectedShowtime?.id === st.id || selectedShowtime?.time === st.time

            return (
              <button
                key={st.id ?? i}
                onClick={() => onShowtimeChange(st)}
                className={cn(
                  'flex flex-col items-start gap-1 p-3.5 rounded-lg border text-left cursor-pointer transition-all duration-150',
                  isSelected
                    ? 'border-[#e8b84b] bg-[rgba(232,184,75,0.08)] shadow-[0_0_16px_rgba(232,184,75,0.15)]'
                    : 'border-white/10 bg-[#111118] hover:border-white/20 hover:bg-white/[0.04]',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-sm font-bold text-[#f0ede8]">{st.time}</span>
                  <ShowtimeTypeBadge type={st.type} price={fmt(st.price)} />
                </div>

                <span className="text-[11px] text-[#a09e9a]">{st.hall}</span>

                <span className="font-mono-data text-xs font-semibold text-[#e8b84b] mt-0.5">
                  {fmt(st.price)}
                </span>
              </button>
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
        {selectedShowtime ? `Chọn ghế cho suất ${selectedShowtime.time} →` : 'Vui lòng chọn suất chiếu'}
      </button>
    </div>
  )
}
