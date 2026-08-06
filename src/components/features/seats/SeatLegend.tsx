import { useTheme } from '../../../context/ThemeContext'

export default function SeatLegend() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const items = [
    {
      bg: isDark ? '#2a2a3a' : '#f1f5f9',
      border: isDark ? 'rgba(240,237,232,0.3)' : '#cbd5e1',
      label: 'Ghế thường',
    },
    {
      bg: isDark ? 'rgba(232,184,75,0.15)' : '#fef3c7',
      border: isDark ? 'rgba(232,184,75,0.5)' : '#f59e0b',
      label: 'Ghế VIP',
    },
    {
      bg: isDark ? 'rgba(236,72,153,0.15)' : '#fce7f3',
      border: isDark ? 'rgba(236,72,153,0.5)' : '#f472b6',
      label: 'Ghế đôi (💑)',
    },
    {
      bg: '#e8b84b',
      border: '#e8b84b',
      label: 'Đang chọn',
    },
    {
      bg: isDark ? '#2e1f1f' : '#e2e8f0',
      border: isDark ? '#3a2a2a' : '#cbd5e1',
      label: 'Đã đặt',
    },
  ]

  return (
    <div className="flex justify-center gap-6 mb-9 flex-wrap">
      {items.map(({ bg, border, label }) => (
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
