import { cn } from '../../../lib/utils'
import { getDateList } from '../../../lib/utils'

interface DatePickerProps {
  selectedDate: number
  onDateChange: (i: number) => void
}

const DATES = getDateList(7)

export default function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold mb-4">Chọn ngày chiếu</h3>
      <div className="flex gap-2 flex-wrap">
        {DATES.map((d, i) => {
          const isToday = i === 0
          const active = selectedDate === i
          return (
            <button
              key={i}
              onClick={() => onDateChange(i)}
              className={cn(
                'px-3.5 py-2.5 rounded text-center min-w-[64px] cursor-pointer border transition-all duration-150',
                active
                  ? 'border-[#e8b84b] bg-[rgba(232,184,75,0.12)] text-[#e8b84b]'
                  : 'border-white/[0.08] bg-[#111118] text-[#a09e9a] hover:border-white/20',
              )}
            >
              <div className="font-mono-data text-lg font-semibold leading-none">
                {d.getDate()}
              </div>
              <div className="text-[10px] mt-1 uppercase tracking-wide">
                {isToday ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' })}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
