import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  MapPin,
  Film,
  Clock,
  Zap,
  Crown,
  Volume2,
  Tv,
  RotateCcw,
  AlertCircle,
  Info,
  Phone,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { apiClient } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { cn, getDateList } from '../lib/utils'

export interface CinemaLocation {
  id: string
  name: string
  city: 'Hà Nội' | 'TP. Hồ Chí Minh' | 'Đà Nẵng'
  address: string
  phone: string
  features: Array<'IMAX' | '4DX' | 'VIP' | '3D' | 'Kids'>
  totalHalls: number
}

export const CINEVERSE_CINEMAS: CinemaLocation[] = [
  {
    id: 'nguyen-trai',
    name: 'CineVerse Nguyễn Trãi',
    city: 'Hà Nội',
    address: '12 Nguyễn Trãi, Q. Thanh Xuân, Hà Nội',
    phone: '1900 1234',
    features: ['IMAX', '4DX', 'VIP', '3D'],
    totalHalls: 8,
  },
  {
    id: 'cau-giay',
    name: 'CineVerse Cầu Giấy',
    city: 'Hà Nội',
    address: '241 Xuân Thủy, Q. Cầu Giấy, Hà Nội',
    phone: '1900 1235',
    features: ['IMAX', '3D', 'VIP', 'Kids'],
    totalHalls: 6,
  },
  {
    id: 'tay-ho',
    name: 'CineVerse Tây Hồ',
    city: 'Hà Nội',
    address: '683 Lạc Long Quân, Q. Tây Hồ, Hà Nội',
    phone: '1900 1236',
    features: ['VIP', '3D', 'Kids'],
    totalHalls: 5,
  },
  {
    id: 'ben-thanh',
    name: 'CineVerse Bến Thành',
    city: 'TP. Hồ Chí Minh',
    address: '135 Nguyễn Huệ, Q. 1, TP. Hồ Chí Minh',
    phone: '1900 2345',
    features: ['IMAX', '4DX', 'VIP', '3D'],
    totalHalls: 10,
  },
  {
    id: 'thao-dien',
    name: 'CineVerse Thảo Điền',
    city: 'TP. Hồ Chí Minh',
    address: '159 Xa Lộ Hà Nội, Q. 2, TP. Hồ Chí Minh',
    phone: '1900 2346',
    features: ['IMAX', '3D', 'Kids'],
    totalHalls: 7,
  },
  {
    id: 'da-nang',
    name: 'CineVerse Đà Nẵng',
    city: 'Đà Nẵng',
    address: '90 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng',
    phone: '1900 3456',
    features: ['IMAX', '3D', 'VIP'],
    totalHalls: 6,
  },
]

const TECH_FEATURES = [
  {
    type: 'IMAX 3D Laser',
    badge: 'Đỉnh Cao Điện Ảnh',
    Icon: Tv,
    description: 'Màn hình siêu cong kích thước khổng lồ 25m với công nghệ chiếu Laser 4K kép đỉnh cao và âm thanh vòm Dolby Atmos 12.1 channels.',
    darkBg: 'from-amber-500/15 via-[#111118] to-[#111118]',
    darkBorder: 'border-[#e8b84b]/40',
    lightBg: 'from-amber-500/15 via-amber-50/60 to-white',
    lightBorder: 'border-amber-500/30',
  },
  {
    type: '4DX Motion',
    badge: 'Cảm Giác Mạnh',
    Icon: Zap,
    description: 'Ghế chuyển động đa chiều chân thực kết hợp các hiệu ứng môi trường như gió, mưa, sương mù, ánh sáng chớp và mùi hương sống động.',
    darkBg: 'from-blue-500/15 via-[#111118] to-[#111118]',
    darkBorder: 'border-blue-500/40',
    lightBg: 'from-blue-500/15 via-blue-50/60 to-white',
    lightBorder: 'border-blue-500/30',
  },
  {
    type: 'VIP Gold Lounge',
    badge: 'Sang Trọng 5 Sao',
    Icon: Crown,
    description: 'Ghế sofa da chỉnh điện Recliner 180°, cổng sạc điện thoại không dây, kèm dịch vụ phục vụ đồ ăn nhẹ và đồ uống cao cấp tận nơi.',
    darkBg: 'from-purple-500/15 via-[#111118] to-[#111118]',
    darkBorder: 'border-purple-500/40',
    lightBg: 'from-purple-500/15 via-purple-50/60 to-white',
    lightBorder: 'border-purple-500/30',
  },
  {
    type: 'Dolby Atmos Standard',
    badge: 'Chuẩn Quốc Tế',
    Icon: Volume2,
    description: 'Trang bị máy chiếu Laser độ tương phản cực cao, ghế ngồi êm ái chống mỏi và hệ thống âm thanh vòm không gian chân thực.',
    darkBg: 'from-emerald-500/15 via-[#111118] to-[#111118]',
    darkBorder: 'border-emerald-500/40',
    lightBg: 'from-emerald-500/15 via-emerald-50/60 to-white',
    lightBorder: 'border-emerald-500/30',
  },
]

interface RawShowtimeItem {
  id: number
  movie_id: number
  room_id: number
  start_time: string
  end_time: string
  base_price: number | string
  vip_price?: number | string
  status: string
  movie?: {
    id: number
    title: string
    poster_url?: string
    duration_minutes?: number
    rating?: string
    age_rating?: string
    status?: string
    movie_genres?: Array<{ genre: { name: string } }>
  }
  room?: {
    id: number
    name: string
    room_type: string
  }
}

function formatYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDisplayDate(d: Date): string {
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const dayName = dayNames[d.getDay()]
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${dayName} ${day}/${month}`
}

export default function TheatersView() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Cinema selection state
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả')
  const [selectedCinema, setSelectedCinema] = useState<CinemaLocation>(CINEVERSE_CINEMAS[0])

  // Date selection state
  const next7Days = useMemo(() => getDateList(7), [])
  const [selectedDateIdx, setSelectedDateIdx] = useState<number>(0)
  const selectedDate = next7Days[selectedDateIdx] || next7Days[0]
  const selectedDateStr = formatYYYYMMDD(selectedDate)

  // Showtimes State
  const [rawShowtimes, setRawShowtimes] = useState<RawShowtimeItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isError, setIsError] = useState<boolean>(false)

  // Filter Cinemas by City
  const filteredCinemas = useMemo(() => {
    if (selectedCity === 'Tất cả') return CINEVERSE_CINEMAS
    return CINEVERSE_CINEMAS.filter((c) => c.city === selectedCity)
  }, [selectedCity])

  // Fetch showtimes from backend
  const fetchShowtimes = () => {
    setLoading(true)
    setIsError(false)
    apiClient
      .get<{ items: RawShowtimeItem[] }>(`/api/v1/showtimes/?page_size=5000&upcoming_only=true&date=${selectedDateStr}`)
      .then(({ data }) => {
        setRawShowtimes(data.items || [])
      })
      .catch((err) => {
        console.error('Failed to load showtimes:', err)
        setIsError(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchShowtimes()
  }, [selectedDateStr])

  // Scroll to schedule section when selecting a cinema
  const handleSelectCinema = (cinema: CinemaLocation) => {
    setSelectedCinema(cinema)
    const el = document.getElementById('showtime-schedule')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Process and group showtimes by Movie for selected Cinema
  const movieGroupedShowtimes = useMemo(() => {
    if (!rawShowtimes.length) return []

    // Group showtimes by movie_id
    const movieMap = new Map<number, {
      movie: RawShowtimeItem['movie']
      formatsMap: Map<string, Array<{ id: number; time: string; room_type: string; price: number }>>
    }>()

    for (const st of rawShowtimes) {
      if (!st.movie) continue
      const mId = st.movie.id

      if (!movieMap.has(mId)) {
        movieMap.set(mId, {
          movie: st.movie,
          formatsMap: new Map(),
        })
      }

      const movieEntry = movieMap.get(mId)!
      const rType = (st.room?.room_type || 'standard').toLowerCase()

      // Map room_type to customer business format label
      let formatLabel = '2D Standard'
      if (rType.includes('imax')) formatLabel = 'IMAX 3D Laser'
      else if (rType.includes('4d')) formatLabel = '4DX Motion'
      else if (rType.includes('vip')) formatLabel = 'VIP Gold Lounge'
      else if (rType.includes('3d')) formatLabel = '3D Surround'
      else if (rType.includes('kids')) formatLabel = 'Kids / Gia Đình'

      if (!movieEntry.formatsMap.has(formatLabel)) {
        movieEntry.formatsMap.set(formatLabel, [])
      }

      const dt = new Date(st.start_time)
      const hours = dt.getHours().toString().padStart(2, '0')
      const mins = dt.getMinutes().toString().padStart(2, '0')
      const timeStr = `${hours}:${mins}`
      const basePrice = typeof st.base_price === 'string' ? parseFloat(st.base_price) : st.base_price

      movieEntry.formatsMap.get(formatLabel)!.push({
        id: st.id,
        time: timeStr,
        room_type: rType,
        price: basePrice,
      })
    }

    // Convert map to array and sort showtimes by time
    const result = Array.from(movieMap.values()).map((entry) => {
      const formats = Array.from(entry.formatsMap.entries()).map(([formatName, times]) => ({
        formatName,
        times: times.sort((a, b) => a.time.localeCompare(b.time)),
      }))
      return {
        movie: entry.movie!,
        formats,
      }
    })

    return result
  }, [rawShowtimes])

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 pb-20 space-y-12">
      {/* 1. HERO SECTION */}
      <div
        className={cn(
          'relative border rounded-3xl p-6 sm:p-8 shadow-2xl transition-all',
          isDark
            ? 'bg-gradient-to-r from-[#161622] via-[#111118] to-[#1c1808] border-[#e8b84b]/20 text-[#f0ede8]'
            : 'bg-gradient-to-r from-amber-500/15 via-amber-50/90 to-amber-100/50 border-amber-300 text-slate-900 shadow-md'
        )}
      >
        <div className="max-w-3xl">
          <span
            className={cn(
              'text-xs font-mono-data font-bold uppercase tracking-widest border rounded-full px-3 py-1 inline-block mb-3',
              isDark
                ? 'text-[#e8b84b] bg-[#e8b84b]/15 border-[#e8b84b]/30'
                : 'text-amber-900 bg-amber-200/80 border-amber-400 font-extrabold'
            )}
          >
            🏢 Cụm Rạp Chiếu CineVerse
          </span>
          <h1
            className={cn(
              'font-display font-black text-3xl sm:text-4xl mb-3 tracking-tight',
              isDark ? 'text-[#f0ede8]' : 'text-slate-900'
            )}
          >
            Rạp CineVerse
          </h1>
          <p className={cn('text-sm sm:text-base leading-relaxed mb-4', isDark ? 'text-[#a09e9a]' : 'text-slate-700 font-medium')}>
            Khám phá các cụm rạp CineVerse và tìm suất chiếu phù hợp với bạn.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold font-mono-data">
            <span className={cn('px-3 py-1 rounded-xl border flex items-center gap-1.5', isDark ? 'bg-white/5 border-white/10 text-amber-400' : 'bg-white border-slate-200 text-amber-900 shadow-xs')}>
              <MapPin className="w-3.5 h-3.5" />
              <span>Chọn rạp gần bạn</span>
            </span>
            <span className={cn('px-3 py-1 rounded-xl border flex items-center gap-1.5', isDark ? 'bg-white/5 border-white/10 text-emerald-400' : 'bg-white border-slate-200 text-emerald-900 shadow-xs')}>
              <Film className="w-3.5 h-3.5" />
              <span>Xem phim đang chiếu</span>
            </span>
            <span className={cn('px-3 py-1 rounded-xl border flex items-center gap-1.5', isDark ? 'bg-white/5 border-white/10 text-cyan-400' : 'bg-white border-slate-200 text-cyan-900 shadow-xs')}>
              <Clock className="w-3.5 h-3.5" />
              <span>Chọn suất chiếu đặt vé nhanh</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC CHỌN RẠP (CINEMA SELECTION) */}
      <section aria-label="Chọn rạp CineVerse" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-white/10">
          <div>
            <h2 className={cn('font-display font-black text-2xl flex items-center gap-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
              <MapPin className="w-6 h-6 text-amber-500" />
              <span>Chọn rạp CineVerse</span>
            </h2>
            <p className={cn('text-xs mt-1', isDark ? 'text-[#a09e9a]' : 'text-slate-600 font-medium')}>
              Vui lòng chọn cụm rạp để xem chi tiết địa điểm và danh sách suất chiếu mới nhất.
            </p>
          </div>

          {/* City Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {['Tất cả', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                  selectedCity === city
                    ? isDark
                      ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-md'
                      : 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-md'
                    : isDark
                    ? 'bg-white/5 text-[#f0ede8] border-white/10 hover:bg-white/10'
                    : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 font-bold'
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Cinema Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCinemas.map((cinema) => {
            const isSelected = selectedCinema.id === cinema.id
            return (
              <div
                key={cinema.id}
                className={cn(
                  'border rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between space-y-4 group',
                  isSelected
                    ? isDark
                      ? 'bg-[#181826] border-[#e8b84b] shadow-xl shadow-[#e8b84b]/10'
                      : 'bg-amber-50/90 border-amber-500 shadow-xl shadow-amber-500/10'
                    : isDark
                    ? 'bg-[#111118] border-white/10 hover:border-white/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={cn('font-display font-extrabold text-lg group-hover:text-[#e8b84b] transition-colors flex items-center gap-1.5', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                      <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{cinema.name}</span>
                    </h3>
                    <span className={cn('text-[10px] font-mono-data uppercase font-bold px-2 py-0.5 rounded border shrink-0', isDark ? 'bg-white/5 border-white/10 text-amber-400' : 'bg-slate-100 border-slate-300 text-slate-800')}>
                      {cinema.city}
                    </span>
                  </div>

                  <p className={cn('text-xs mb-3 font-medium leading-relaxed', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                    {cinema.address}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn('text-[10px] font-mono-data font-bold px-2 py-0.5 rounded border', isDark ? 'bg-white/5 border-white/10 text-[#a09e9a]' : 'bg-slate-100 border-slate-300 text-slate-700')}>
                      {cinema.totalHalls} phòng chiếu
                    </span>
                    {cinema.features.map((feat) => (
                      <span
                        key={feat}
                        className={cn(
                          'text-[10px] font-mono-data font-bold px-2 py-0.5 rounded border',
                          feat === 'IMAX'
                            ? isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-amber-100 border-amber-300 text-amber-900'
                            : feat === '4DX'
                            ? isDark ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-blue-100 border-blue-300 text-blue-900'
                            : feat === 'VIP'
                            ? isDark ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'bg-purple-100 border-purple-300 text-purple-900'
                            : isDark ? 'bg-teal-500/15 border-teal-500/30 text-teal-300' : 'bg-teal-100 border-teal-300 text-teal-900'
                        )}
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectCinema(cinema)}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-xs',
                    isSelected
                      ? isDark
                        ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b]'
                        : 'bg-amber-500 text-slate-950 border-amber-500'
                      : isDark
                      ? 'bg-white/5 hover:bg-white/10 text-[#f0ede8] border-white/10'
                      : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-900'
                  )}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'Đang xem lịch chiếu' : 'Xem lịch chiếu'}</span>
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. KHU VỰC LỊCH CHIẾU CHI TIẾT (SHOWTIME SCHEDULE) */}
      <section id="showtime-schedule" aria-label="Lịch chiếu phim" className="space-y-6 pt-4">
        {/* Selected Cinema Info Header */}
        <div
          className={cn(
            'border rounded-3xl p-6 sm:p-7 shadow-xl transition-all',
            isDark
              ? 'bg-[#111118] border-white/10 text-[#f0ede8]'
              : 'bg-white border-slate-200 text-slate-900 shadow-md'
          )}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h2 className={cn('font-display font-black text-2xl', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                  {selectedCinema.name}
                </h2>
              </div>
              <p className={cn('text-xs mt-1 font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                {selectedCinema.address} • Hotline đặt vé: <strong className="text-amber-500">{selectedCinema.phone}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-[11px] font-mono-data font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5', isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-amber-100 border-amber-300 text-amber-950')}>
                <Tv className="w-3.5 h-3.5" />
                <span>IMAX 3D Laser</span>
              </span>
              <span className={cn('text-[11px] font-mono-data font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5', isDark ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-blue-100 border-blue-300 text-blue-950')}>
                <Zap className="w-3.5 h-3.5" />
                <span>4DX Motion</span>
              </span>
              <span className={cn('text-[11px] font-mono-data font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5', isDark ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'bg-purple-100 border-purple-300 text-purple-950')}>
                <Crown className="w-3.5 h-3.5" />
                <span>VIP Gold Lounge</span>
              </span>
              <span className={cn('text-[11px] font-mono-data font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5', isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-950')}>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Dolby Atmos</span>
              </span>
            </div>
          </div>

          {/* Date Selector Horizontal Bar */}
          <div className="pt-5">
            <label className={cn('text-xs font-mono-data font-bold uppercase tracking-wider block mb-3 flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Chọn ngày chiếu:</span>
            </label>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {next7Days.map((d, idx) => {
                const isSelectedDate = selectedDateIdx === idx
                const isToday = idx === 0
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => setSelectedDateIdx(idx)}
                    className={cn(
                      'px-4 py-2.5 rounded-2xl text-xs transition-all cursor-pointer flex flex-col items-center shrink-0 border min-w-[100px]',
                      isSelectedDate
                        ? isDark
                          ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] font-black shadow-lg scale-105'
                          : 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-lg scale-105'
                        : isDark
                        ? 'bg-white/5 text-[#f0ede8] border-white/10 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 font-bold'
                    )}
                  >
                    <span className="text-[10px] uppercase font-mono-data opacity-80">
                      {isToday ? 'Hôm nay' : formatDisplayDate(d).split(' ')[0]}
                    </span>
                    <span className="text-sm font-black mt-0.5">
                      {formatDisplayDate(d).split(' ')[1]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Movies & Showtimes Listing Container */}
        <div>
          {isError ? (
            <div
              className={cn(
                'border rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto shadow-2xl',
                isDark ? 'bg-[#1a1112] border-red-500/30' : 'bg-red-50 border-red-200'
              )}
            >
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <div>
                <h3 className={cn('font-display font-bold text-lg', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                  Không thể tải lịch chiếu
                </h3>
                <p className={cn('text-xs mt-1', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                  Đã xảy ra lỗi khi truy vấn lịch chiếu rạp. Vui lòng thử lại.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchShowtimes}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : loading ? (
            /* Skeleton Loading State */
            <div className="space-y-6">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className={cn(
                    'border rounded-3xl p-6 animate-pulse flex flex-col md:flex-row gap-6',
                    isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
                  )}
                >
                  <div className="w-28 h-40 bg-white/10 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="w-1/3 h-6 bg-white/10 rounded-lg" />
                    <div className="w-1/4 h-4 bg-white/10 rounded-lg" />
                    <div className="flex gap-3 pt-4">
                      <div className="w-20 h-10 bg-white/10 rounded-xl" />
                      <div className="w-20 h-10 bg-white/10 rounded-xl" />
                      <div className="w-20 h-10 bg-white/10 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : movieGroupedShowtimes.length === 0 ? (
            /* Empty State */
            <div
              className={cn(
                'border rounded-3xl p-10 text-center space-y-3 shadow-xl',
                isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900 shadow-md'
              )}
            >
              <Info className="w-10 h-10 text-zinc-500 mx-auto" />
              <h3 className={cn('font-display font-extrabold text-xl', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                Hiện chưa có suất chiếu tại rạp này.
              </h3>
              <p className={cn('text-xs font-medium max-w-md mx-auto', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                Vui lòng chọn ngày khác hoặc chọn cụm rạp CineVerse khác để xem thông tin lịch chiếu.
              </p>
            </div>
          ) : (
            /* Showtimes grouped by Movie */
            <div className="space-y-6">
              {movieGroupedShowtimes.map(({ movie, formats }) => (
                <div
                  key={movie.id}
                  className={cn(
                    'border rounded-3xl p-6 sm:p-7 shadow-xl transition-all flex flex-col md:flex-row gap-6 items-start',
                    isDark
                      ? 'bg-[#111118] border-white/10 text-[#f0ede8]'
                      : 'bg-white border-slate-200 text-slate-900 shadow-md'
                  )}
                >
                  {/* Movie Poster */}
                  <img
                    src={movie.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80'}
                    alt={movie.title}
                    className="w-28 sm:w-32 h-40 sm:h-48 object-cover rounded-2xl shadow-md shrink-0 border border-white/10"
                  />

                  {/* Movie Info & Formatted Showtimes */}
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {(movie.rating || movie.age_rating) && (
                          <span className="bg-[#e8b84b] text-[#09090e] font-black text-[11px] rounded px-2 py-0.5 shadow-md">
                            {movie.rating || movie.age_rating}
                          </span>
                        )}
                        {movie.duration_minutes && (
                          <span className={cn('text-xs font-mono-data flex items-center gap-1', isDark ? 'text-[#a09e9a]' : 'text-slate-600 font-medium')}>
                            <Clock className="w-3 h-3" />
                            <span>{movie.duration_minutes} phút</span>
                          </span>
                        )}
                      </div>

                      <h3 className={cn('font-display font-black text-xl sm:text-2xl', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                        {movie.title}
                      </h3>

                      {movie.movie_genres && movie.movie_genres.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {movie.movie_genres.map((g, idx) => (
                            <span key={idx} className={cn('text-[11px] font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                              {g.genre.name}{idx < movie.movie_genres!.length - 1 ? ' •' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Showtimes by Format */}
                    <div className="space-y-4 pt-2 border-t border-white/10">
                      {formats.map(({ formatName, times }) => (
                        <div key={formatName} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-xs font-mono-data font-extrabold uppercase px-2.5 py-0.5 rounded-lg border',
                              formatName.includes('IMAX')
                                ? isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-950 border-amber-300'
                                : formatName.includes('4DX')
                                ? isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-950 border-blue-300'
                                : formatName.includes('VIP')
                                ? isDark ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-950 border-purple-300'
                                : isDark ? 'bg-white/10 text-[#f0ede8] border-white/15' : 'bg-slate-100 text-slate-800 border-slate-300'
                            )}>
                              {formatName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 flex-wrap">
                            {times.map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => navigate(`/movie/${movie.id}?showtime=${st.id}`)}
                                className={cn(
                                  'px-4 py-2 rounded-xl text-xs font-mono-data font-black border transition-all cursor-pointer flex flex-col items-center shadow-xs hover:scale-105',
                                  isDark
                                    ? 'bg-[#181824] hover:bg-[#e8b84b] hover:text-[#09090e] border-white/15 text-[#f0ede8]'
                                    : 'bg-slate-100 hover:bg-amber-500 hover:text-slate-950 border-slate-300 text-slate-900 font-extrabold'
                                )}
                                title={`Đặt vé suất ${st.time} - ${movie.title}`}
                              >
                                <span className="text-sm">{st.time}</span>
                                <span className="text-[9px] opacity-70 font-normal mt-0.5">
                                  {st.price ? `${(st.price / 1000).toFixed(0)}k` : '90k'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. CÔNG NGHỆ RẠP (CINEMA TECHNOLOGIES MARKETING SHOWCASE) */}
      <section aria-label="Các Công Nghệ Rạp Nổi Bật" className="pt-6">
        <h2 className={cn('font-display font-extrabold text-2xl mb-6 flex items-center gap-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
          <Tv className="w-6 h-6 text-amber-500" />
          <span>Các Công Nghệ Rạp Nổi Bật Tại CineVerse</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TECH_FEATURES.map((tech) => {
            const TechIcon = tech.Icon
            return (
              <div
                key={tech.type}
                className={cn(
                  'bg-gradient-to-br border rounded-2xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-1',
                  isDark ? `${tech.darkBg} ${tech.darkBorder}` : `${tech.lightBg} ${tech.lightBorder} shadow-slate-200/50`
                )}
              >
                <div className="flex justify-between items-center mb-3">
                  <TechIcon className="w-7 h-7 text-amber-400" />
                  <span
                    className={cn(
                      'text-[9px] font-mono-data uppercase font-bold border rounded px-2 py-0.5',
                      isDark
                        ? 'text-[#e8b84b] bg-[#e8b84b]/15 border-[#e8b84b]/30'
                        : 'text-amber-900 bg-amber-200/80 border-amber-400 font-extrabold'
                    )}
                  >
                    {tech.badge}
                  </span>
                </div>
                <h3 className={cn('font-display font-extrabold text-base mb-1.5', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                  {tech.type}
                </h3>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-[#a09e9a]' : 'text-slate-600 font-medium')}>
                  {tech.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
