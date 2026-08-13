import { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { useTheme } from '../../context/ThemeContext'

export function formatVNFullDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  const dayName = days[dateObj.getDay()]
  return `${dayName}, ${d < 10 ? '0' + d : d}/${m < 10 ? '0' + m : m}/${y}`
}

interface CleanDatePickerProps {
  value: string
  onChange: (dateStr: string) => void
  minDate?: string
  maxDate?: string
  label?: string
  isDark?: boolean
  placeholder?: string
  align?: 'left' | 'right'
}

export function CleanDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  isDark: isDarkProp,
  placeholder = 'Chọn ngày...',
  align = 'left',
}: CleanDatePickerProps) {
  const { theme } = useTheme()
  const isDark = isDarkProp !== undefined ? isDarkProp : theme === 'dark'

  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      return new Date(y, m - 1, 1)
    }
    return new Date()
  })

  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      setViewDate(new Date(y, m - 1, 1))
    }
  }, [value])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const monthNames = [
    'Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu',
    'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'
  ]

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let firstDayIndex = new Date(year, month, 1).getDay() - 1
  if (firstDayIndex < 0) firstDayIndex = 6

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }

  function handleSelectDay(day: number) {
    const mStr = (month + 1).toString().padStart(2, '0')
    const dStr = day.toString().padStart(2, '0')
    const selectedStr = `${year}-${mStr}-${dStr}`
    if (minDate && selectedStr < minDate) return
    if (maxDate && selectedStr > maxDate) return
    onChange(selectedStr)
    setOpen(false)
  }

  const selectedYMD = value ? value : ''

  return (
    <div className="relative">
      {label && (
        <label className={cn('block mb-1 font-medium text-xs', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full px-3 py-2 border rounded-lg font-mono-data text-xs flex justify-between items-center cursor-pointer transition-all shadow-xs',
          isDark
            ? 'bg-[#111118] border-white/10 hover:border-[#e8b84b]/50 text-[#f0ede8]'
            : 'bg-white border-slate-300 hover:border-amber-500 text-slate-900 shadow-sm font-semibold'
        )}
      >
        <span>{value ? formatVNFullDate(value) : placeholder}</span>
        <span className={isDark ? 'text-[#a09e9a] text-sm' : 'text-amber-600 text-sm font-bold'}>📅</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute top-full mt-2 z-50 rounded-xl p-4 shadow-2xl w-[295px] space-y-3 border transition-colors',
              align === 'right' ? 'right-0' : 'left-0',
              isDark
                ? 'bg-[#111118] border-white/20 text-[#f0ede8]'
                : 'bg-white border-slate-200 text-slate-900 shadow-2xl ring-1 ring-black/5'
            )}
          >
            {/* Header */}
            <div className="flex justify-between items-center text-xs font-bold">
              <button
                type="button"
                onClick={prevMonth}
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer',
                  isDark ? 'hover:bg-white/10 text-[#e8b84b]' : 'hover:bg-slate-100 text-amber-700 font-bold'
                )}
              >
                ◀
              </button>
              <span className={isDark ? 'text-[#f0ede8]' : 'text-slate-900 font-extrabold'}>
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer',
                  isDark ? 'hover:bg-white/10 text-[#e8b84b]' : 'hover:bg-slate-100 text-amber-700 font-bold'
                )}
              >
                ▶
              </button>
            </div>

            {/* Weekday headers */}
            <div className={cn('grid grid-cols-7 text-center text-[11px] font-extrabold', isDark ? 'text-[#6e6c68]' : 'text-slate-600')}>
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span className="text-rose-500">CN</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono-data">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="w-8 h-8" />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1
                const mStr = (month + 1).toString().padStart(2, '0')
                const dStr = dayNum.toString().padStart(2, '0')
                const dayYMD = `${year}-${mStr}-${dStr}`
                const isSelected = dayYMD === selectedYMD
                const isDisabled = Boolean(
                  (minDate && dayYMD < minDate) || (maxDate && dayYMD > maxDate)
                )

                return (
                  <button
                    key={dayNum}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectDay(dayNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs font-semibold',
                      isSelected
                        ? isDark
                          ? 'bg-[#e8b84b] text-[#09090e] font-bold scale-105 shadow-md'
                          : 'bg-amber-500 text-slate-950 font-black scale-105 shadow-md ring-1 ring-amber-600'
                        : isDisabled
                          ? isDark
                            ? 'text-slate-500 bg-white/5 cursor-not-allowed font-medium'
                            : 'text-slate-500 bg-slate-200/70 border border-slate-300/40 cursor-not-allowed font-bold opacity-75'
                          : isDark
                            ? 'hover:bg-white/10 text-[#f0ede8]'
                            : 'hover:bg-amber-100 text-slate-900 hover:text-amber-950 font-bold bg-slate-50 border border-slate-200/60'
                    )}
                  >
                    {dayNum}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
