export default function SeatLegend() {
  const items = [
    { bg: '#2a2a3a', border: 'rgba(240,237,232,0.3)', label: 'Ghế trống' },
    { bg: 'rgba(232,184,75,0.15)', border: 'rgba(232,184,75,0.5)', label: 'Ghế VIP' },
    { bg: '#e8b84b', border: '#e8b84b', label: 'Đang chọn' },
    { bg: '#2e1f1f', border: '#3a2a2a', label: 'Đã đặt' },
  ]

  return (
    <div className="flex justify-center gap-6 mb-9 flex-wrap">
      {items.map(({ bg, border, label }) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className="w-5 h-4 rounded-sm border"
            style={{ background: bg, borderColor: border }}
          />
          <span className="text-xs text-[#6e6c68]">{label}</span>
        </div>
      ))}
    </div>
  )
}
