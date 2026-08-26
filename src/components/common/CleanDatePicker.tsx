import { useState, useEffect } from 'react'

export function toLocalYYYYMMDD(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatVNFullDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return ''
  const dt = new Date(y, m - 1, d)
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  const dayName = daysOfWeek[dt.getDay()]
  return `${dayName}, ${d < 10 ? '0' + d : d}/${m < 10 ? '0' + m : m}/${y}`
}

export interface CleanDatePickerProps {
  value: string
  onChange: (dateStr: string) => void
  minDate?: string
  maxDate?: string
  label?: string
  placeholder?: string
  className?: string
  isDark?: boolean
}

export function CleanDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  placeholder = 'Chọn ngày...',
  className,
  isDark = true,
}: CleanDatePickerProps) {
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
    'Tháng Một',
    'Tháng Hai',
    'Tháng Ba',
    'Tháng Tư',
    'Tháng Năm',
    'Tháng Sáu',
    'Tháng Bảy',
    'Tháng Tám',
    'Tháng Chín',
    'Tháng Mười',
    'Tháng Mười Một',
    'Tháng Mười Hai',
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
        <label className={`block mb-1 font-medium text-xs ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={
          className ||
          `w-full px-3 py-2 border rounded-xl font-mono-data text-xs flex justify-between items-center cursor-pointer transition-colors ${
            isDark
              ? 'bg-[#111118] border-white/10 hover:border-[#e8b84b]/50 text-[#f0ede8]'
              : 'bg-white border-slate-300 hover:border-amber-500 text-slate-900 shadow-sm'
          }`
        }
      >
        <span className={!value ? (isDark ? 'text-[#6e6c68]' : 'text-slate-400') : ''}>
          {value ? formatVNFullDate(value) : placeholder}
        </span>
        <span className="text-sm ml-2">📅</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute left-0 top-full mt-2 z-50 border rounded-2xl p-4 shadow-2xl w-[290px] space-y-3 animate-in fade-in duration-150 ${
              isDark ? 'bg-[#111118] border-white/20 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-bold">
              <button
                type="button"
                onClick={prevMonth}
                className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer ${
                  isDark ? 'hover:bg-white/10 text-[#e8b84b]' : 'hover:bg-slate-100 text-amber-600'
                }`}
              >
                ◀
              </button>
              <span>
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer ${
                  isDark ? 'hover:bg-white/10 text-[#e8b84b]' : 'hover:bg-slate-100 text-amber-600'
                }`}
              >
                ▶
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#6e6c68]">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span className="text-[#e07060]">CN</span>
            </div>

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
                const isDisabled = Boolean((minDate && dayYMD < minDate) || (maxDate && dayYMD > maxDate))

                return (
                  <button
                    key={dayNum}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectDay(dayNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#e8b84b] text-[#09090e] font-bold scale-105 shadow-md'
                        : isDisabled
                        ? isDark
                          ? 'text-white/20 cursor-not-allowed'
                          : 'text-slate-300 cursor-not-allowed'
                        : isDark
                        ? 'text-[#c0bdb8] hover:bg-white/10 hover:text-[#f0ede8]'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {dayNum}
                  </button>
                )
              })}
            </div>

            <div className={`pt-2 border-t flex justify-between items-center text-[11px] ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => {
                  const todayStr = toLocalYYYYMMDD(new Date())
                  if ((!minDate || todayStr >= minDate) && (!maxDate || todayStr <= maxDate)) {
                    onChange(todayStr)
                    setOpen(false)
                  }
                }}
                className={`cursor-pointer font-bold ${isDark ? 'text-[#e8b84b] hover:underline' : 'text-amber-600 hover:underline'}`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
                className={`cursor-pointer ${isDark ? 'text-[#a09e9a] hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Xóa ngày
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

