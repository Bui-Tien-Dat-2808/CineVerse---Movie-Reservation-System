import { useTheme } from '../../../context/ThemeContext'
import type { SeatItem } from '../../../types'

interface SeatLegendProps {
  seats?: SeatItem[]
}

export default function SeatLegend({ seats }: SeatLegendProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const hasStandard = !seats || seats.length === 0 || seats.some((s) => !s.seat_type || s.seat_type.toLowerCase() === 'standard')
  const hasVip = !seats || seats.length === 0 || seats.some((s) => s.seat_type?.toLowerCase() === 'vip')
  const hasCouple = !seats || seats.length === 0 || seats.some((s) => s.seat_type?.toLowerCase() === 'couple')
  const hasKids = !seats || seats.length === 0 || seats.some((s) => s.seat_type?.toLowerCase() === 'kids')

  const items: { bg: string; border: string; label: string; show: boolean }[] = [
    {
      bg: isDark ? '#2a2a3a' : '#f1f5f9',
      border: isDark ? 'rgba(240,237,232,0.3)' : '#cbd5e1',
      label: 'Ghế thường',
      show: hasStandard,
    },
    {
      bg: isDark ? 'rgba(232,184,75,0.15)' : '#fef3c7',
      border: isDark ? 'rgba(232,184,75,0.5)' : '#f59e0b',
      label: 'Ghế VIP',
      show: hasVip,
    },
    {
      bg: isDark ? 'rgba(236,72,153,0.15)' : '#fce7f3',
      border: isDark ? 'rgba(236,72,153,0.5)' : '#f472b6',
      label: 'Ghế đôi (💑)',
      show: hasCouple,
    },
    {
      bg: isDark ? 'rgba(20,184,166,0.15)' : '#ccfbf1',
      border: isDark ? 'rgba(20,184,166,0.5)' : '#2dd4bf',
      label: 'Ghế Trẻ em (🎈)',
      show: hasKids,
    },
    {
      bg: '#e8b84b',
      border: '#e8b84b',
      label: 'Đang chọn',
      show: true,
    },
    {
      bg: isDark ? '#2e1f1f' : '#e2e8f0',
      border: isDark ? '#3a2a2a' : '#cbd5e1',
      label: 'Đã đặt',
      show: true,
    },
  ]

  const visibleItems = items.filter((item) => item.show)

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap py-1">
      {visibleItems.map(({ bg, border, label }) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className="w-5 h-4 rounded-sm border shadow-xs"
            style={{ background: bg, borderColor: border }}
          />
          <span className={`text-xs ${isDark ? 'text-[#6e6c68]' : 'text-slate-700 font-semibold'}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
