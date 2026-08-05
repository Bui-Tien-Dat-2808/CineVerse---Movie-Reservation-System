import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import { useTheme } from '../context/ThemeContext'

interface RoomItem {
  id: number
  name: string
  room_type: string
  description?: string
  total_rows: number
  total_cols: number
  total_seats: number
  is_active: boolean
}

const TECH_FEATURES = [
  {
    type: 'IMAX 3D Laser',
    badge: 'Đỉnh Cao Điện Ảnh',
    icon: '📽️',
    description: 'Màn hình siêu cong kích thước khổng lồ 25m với công nghệ chiếu Laser 4K kép đỉnh cao và âm thanh vòm Dolby Atmos 12.1 channels.',
    darkBg: 'from-amber-500/15 via-[#111118] to-[#111118]',
    darkBorder: 'border-[#e8b84b]/40',
    lightBg: 'from-amber-500/15 via-amber-50/60 to-white',
    lightBorder: 'border-amber-500/30',
  },
  {
    type: '4DX Motion',
    badge: 'Cảm Giác Mạnh',
    icon: '⚡',
    description: 'Ghế chuyển động đa chiều chân thực kết hợp các hiệu ứng môi trường như gió, mưa, sương mù, ánh sáng chớp và mùi hương sống động.',
    darkBg: 'from-blue-500/15 via-[#111118] to-[#111118]',
    darkBorder: 'border-blue-500/40',
    lightBg: 'from-blue-500/15 via-blue-50/60 to-white',
    lightBorder: 'border-blue-500/30',
  },
  {
    type: 'VIP Gold Lounge',
    badge: 'Sang Trọng 5 Sao',
    icon: '👑',
    description: 'Ghế sofa da chỉnh điện Recliner 180°, cổng sạc điện thoại không dây, kèm dịch vụ phục vụ đồ ăn nhẹ và đồ uống cao cấp tận nơi.',
    darkBg: 'from-purple-500/15 via-[#111118] to-[#111118]',
    darkBorder: 'border-purple-500/40',
    lightBg: 'from-purple-500/15 via-purple-50/60 to-white',
    lightBorder: 'border-purple-500/30',
  },
  {
    type: 'Dolby Atmos Standard',
    badge: 'Chuẩn Quốc Tế',
    icon: '🔊',
    description: 'Trang bị máy chiếu Laser độ tương phản cực cao, ghế ngồi êm ái chống mỏi và hệ thống âm thanh vòm không gian chân thực.',
    darkBg: 'from-emerald-500/15 via-[#111118] to-[#111118]',
    darkBorder: 'border-emerald-500/40',
    lightBg: 'from-emerald-500/15 via-emerald-50/60 to-white',
    lightBorder: 'border-emerald-500/30',
  },
]

export default function TheatersView() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null)

  const fetchRooms = () => {
    setLoading(true)
    setIsError(false)
    apiClient
      .get<RoomItem[]>('/api/v1/rooms/')
      .then(({ data }) => {
        setRooms(data)
        if (data.length) setSelectedRoom(data[0])
      })
      .catch((err) => {
        console.error('Failed to load rooms:', err)
        setIsError(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 pb-20">
      {/* Header Banner */}
      <div
        className={`relative border rounded-2xl p-8 mb-12 shadow-2xl transition-colors ${
          isLight
            ? 'bg-gradient-to-r from-amber-500/10 via-amber-50/80 to-amber-100/50 border-amber-500/30 text-slate-900 shadow-amber-500/5'
            : 'bg-gradient-to-r from-[#161622] via-[#111118] to-[#1c1808] border-[#e8b84b]/20 text-[#f0ede8]'
        }`}
      >
        <div className="max-w-2xl">
          <span
            className={`text-xs font-mono-data font-bold uppercase tracking-widest border rounded-full px-3 py-1 inline-block mb-3 ${
              isLight
                ? 'text-amber-800 bg-amber-500/15 border-amber-500/30'
                : 'text-[#e8b84b] bg-[#e8b84b]/15 border-[#e8b84b]/30'
            }`}
          >
            🏢 Công Nghệ Rạp Chiếu CineVerse
          </span>
          <h1
            className={`font-display font-black text-3xl sm:text-4xl mb-3 tracking-tight ${
              isLight ? 'text-slate-900' : 'text-[#f0ede8]'
            }`}
          >
            Hệ Thống Phòng Chiếu Hiện Đại
          </h1>
          <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-[#a09e9a]'}`}>
            Trải nghiệm không gian điện ảnh thế hệ mới với công nghệ chiếu phim hàng đầu thế giới: IMAX 3D Laser, 4DX cảm giác mạnh và VIP Gold Lounge sang trọng.
          </p>
        </div>
      </div>

      {/* Technology Showcase Section */}
      <div className="mb-14">
        <h2 className={`font-display font-bold text-2xl mb-6 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-[#f0ede8]'}`}>
          <span>🎬</span> Các Công Nghệ Rạp Nổi Bật
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TECH_FEATURES.map((tech) => (
            <div
              key={tech.type}
              className={`bg-gradient-to-br border rounded-2xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                isLight ? `${tech.lightBg} ${tech.lightBorder} shadow-slate-200/50` : `${tech.darkBg} ${tech.darkBorder}`
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{tech.icon}</span>
                  <h3 className={`font-display font-bold text-xl ${isLight ? 'text-slate-900' : 'text-[#f0ede8]'}`}>
                    {tech.type}
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-mono-data uppercase font-bold border rounded px-2.5 py-1 ${
                    isLight
                      ? 'text-amber-800 bg-amber-500/15 border-amber-500/30'
                      : 'text-[#e8b84b] bg-[#e8b84b]/15 border-[#e8b84b]/30'
                  }`}
                >
                  {tech.badge}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-[#a09e9a]'}`}>
                {tech.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Rooms & Layout Specs Section */}
      <div>
        <h2 className={`font-display font-bold text-2xl mb-6 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-[#f0ede8]'}`}>
          <span>🏛️</span> Danh Sách Phòng Chiếu Thực Tế ({rooms.length})
        </h2>

        {isError ? (
          <div
            className={`border rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto shadow-2xl ${
              isLight ? 'bg-red-50 border-red-200' : 'bg-[#1a1112] border-[#e07060]/30'
            }`}
          >
            <div className="text-3xl">⚠️</div>
            <div>
              <h3 className={`font-display font-bold text-lg ${isLight ? 'text-slate-900' : 'text-[#f0ede8]'}`}>
                Không thể tải danh sách phòng chiếu
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-[#a09e9a]'}`}>
                Đã xảy ra lỗi kết nối với máy chủ khi tải dữ liệu rạp chiếu.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchRooms}
              className="px-5 py-2.5 bg-[#e07060]/20 hover:bg-[#e07060]/30 text-[#e07060] border border-[#e07060]/40 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-lg"
            >
              <span>🔄</span>
              <span>Thử lại</span>
            </button>
          </div>
        ) : loading ? (
          <div className={`text-center py-16 text-xs font-mono-data animate-pulse ${isLight ? 'text-slate-500' : 'text-[#a09e9a]'}`}>
            Đang tải dữ liệu danh sách phòng chiếu...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Rooms Selector list grouped by type */}
            <div className="lg:col-span-5 space-y-5">
              {['standard', 'vip', 'imax', '3d', '4d', 'kids'].map((typeKey) => {
                const groupRooms = rooms.filter((r) => (r.room_type || 'standard') === typeKey)
                if (groupRooms.length === 0) return null

                const typeTitle =
                  typeKey === 'standard'
                    ? '🎬 Standard'
                    : typeKey === 'vip'
                    ? '👑 VIP Gold Lounge'
                    : typeKey === 'imax'
                    ? '📽️ IMAX 3D Laser'
                    : typeKey === '3d'
                    ? '🔊 3D Surround'
                    : typeKey === '4d'
                    ? '⚡ 4DX Motion'
                    : '🎈 Kids / Gia Đình'

                return (
                  <div key={typeKey} className="space-y-2">
                    <div
                      className={`text-xs font-mono-data font-bold uppercase tracking-wider px-1 ${
                        isLight ? 'text-amber-800' : 'text-[#e8b84b]'
                      }`}
                    >
                      {typeTitle} ({groupRooms.length})
                    </div>

                    <div className="space-y-2.5">
                      {groupRooms.map((r) => {
                        const isSelected = selectedRoom?.id === r.id
                        return (
                          <div
                            key={r.id}
                            onClick={() => setSelectedRoom(r)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex justify-between items-center ${
                              isSelected
                                ? isLight
                                  ? 'bg-amber-50 border-amber-500 shadow-md text-slate-900'
                                  : 'bg-[#181826] border-[#e8b84b] shadow-lg shadow-[#e8b84b]/10 text-[#f0ede8]'
                                : isLight
                                ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                                : 'bg-[#111118] border-white/10 hover:border-white/20 text-[#f0ede8]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-display font-bold text-base ${isLight ? 'text-slate-900' : 'text-[#f0ede8]'}`}>
                                  {r.name}
                                </h4>
                                <span
                                  className={`text-[10px] font-mono-data uppercase px-2 py-0.5 rounded border ${
                                    isLight
                                      ? 'text-amber-800 bg-amber-100 border-amber-300'
                                      : 'text-[#e8b84b] bg-[#e8b84b]/10 border-[#e8b84b]/20'
                                  }`}
                                >
                                  {r.room_type}
                                </span>
                              </div>
                              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-[#a09e9a]'}`}>
                                Sức chứa:{' '}
                                <strong className={isLight ? 'text-slate-900' : 'text-[#f0ede8]'}>
                                  {r.total_seats} ghế
                                </strong>{' '}
                                ({r.total_rows} hàng × {r.total_cols} cột)
                              </p>
                            </div>

                            <span
                              className={`text-lg transition-transform ${
                                isSelected
                                  ? isLight
                                    ? 'translate-x-1 text-amber-600'
                                    : 'translate-x-1 text-[#e8b84b]'
                                  : isLight
                                  ? 'text-slate-300'
                                  : 'text-white/20'
                              }`}
                            >
                              →
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Room Details & Seat Layout Preview Box */}
            <div
              className={`lg:col-span-7 border rounded-2xl p-6 flex flex-col justify-between shadow-xl ${
                isLight ? 'bg-white border-slate-200 shadow-slate-200/60' : 'bg-[#111118] border-white/10'
              }`}
            >
              {selectedRoom ? (
                <div>
                  <div
                    className={`flex justify-between items-start mb-6 pb-4 border-b ${
                      isLight ? 'border-slate-200' : 'border-white/10'
                    }`}
                  >
                    <div>
                      <span
                        className={`text-[10px] font-mono-data font-bold uppercase tracking-widest ${
                          isLight ? 'text-amber-700' : 'text-[#e8b84b]'
                        }`}
                      >
                        Chi Tiết Sơ Đồ Phòng Chiếu
                      </span>
                      <h3 className={`font-display font-bold text-2xl mt-1 ${isLight ? 'text-slate-900' : 'text-[#f0ede8]'}`}>
                        {selectedRoom.name}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs block font-mono-data ${isLight ? 'text-slate-500' : 'text-[#a09e9a]'}`}>
                        Sơ đồ tổng quan
                      </span>
                      <span className={`font-mono-data text-lg font-bold ${isLight ? 'text-amber-700' : 'text-[#e8b84b]'}`}>
                        {selectedRoom.total_seats} Ghế ngồi
                      </span>
                    </div>
                  </div>

                  {/* Cinema Curved Screen visual */}
                  <div className="w-full text-center mb-8">
                    <div className="w-3/4 mx-auto h-2 bg-gradient-to-r from-transparent via-[#e8b84b] to-transparent rounded-full shadow-[0_4px_20px_rgba(232,184,75,0.8)]" />
                    <span className={`text-[10px] font-mono-data uppercase tracking-widest mt-2 block ${isLight ? 'text-slate-500' : 'text-[#6e6c68]'}`}>
                      Màn hình chiếu {selectedRoom.room_type.toUpperCase()}
                    </span>
                  </div>

                  {/* Sample Seat Grid Preview */}
                  <div
                    className={`p-6 rounded-xl border overflow-x-auto flex flex-col items-center ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#09090e] border-white/5'
                    }`}
                  >
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedRoom.total_cols}, minmax(0, 1fr))` }}>
                      {Array.from({ length: selectedRoom.total_rows }).map((_, rIdx) => {
                        const rowChar = String.fromCharCode(65 + rIdx)
                        const isVipRow = selectedRoom.total_rows // 3 <= rIdx && rIdx < 2 * selectedRoom.total_rows // 3
                        return Array.from({ length: selectedRoom.total_cols }).map((_, cIdx) => (
                          <div
                            key={`${rowChar}-${cIdx}`}
                            title={`Ghế ${rowChar}${cIdx + 1}`}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-mono-data font-bold transition-all ${
                              isVipRow
                                ? isLight
                                  ? 'bg-amber-100 border border-amber-500 text-amber-900'
                                  : 'bg-[#e8b84b]/20 border border-[#e8b84b] text-[#e8b84b]'
                                : isLight
                                ? 'bg-white border border-slate-300 text-slate-700 shadow-sm'
                                : 'bg-white/5 border border-white/15 text-[#a09e9a]'
                            }`}
                          >
                            {rowChar}{cIdx + 1}
                          </div>
                        ))
                      })}
                    </div>

                    <div className={`flex gap-6 justify-center mt-6 text-xs ${isLight ? 'text-slate-600' : 'text-[#a09e9a]'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded ${isLight ? 'bg-white border border-slate-300' : 'bg-white/5 border border-white/20'}`} />
                        <span>Ghế Thường</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded ${isLight ? 'bg-amber-100 border border-amber-500' : 'bg-[#e8b84b]/20 border border-[#e8b84b]'}`} />
                        <span>Ghế VIP Trung Tâm</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
