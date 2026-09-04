import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clapperboard,
  Search,
  Calendar,
  Play,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  Film,
} from 'lucide-react'
import { apiClient } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import type { Movie } from '../types'
import { cn } from '../lib/utils'

interface ComingSoonMovieItem {
  id: number
  title: string
  description?: string
  poster_url?: string
  duration_minutes?: number
  release_date?: string
  status: string
  rating?: string
}

export default function ComingSoonView() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const isDark = !isLight

  const [movies, setMovies] = useState<ComingSoonMovieItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [subscribedIds, setSubscribedIds] = useState<number[]>([])

  const fetchComingSoon = () => {
    setLoading(true)
    setError(null)
    apiClient
      .get<{ items: ComingSoonMovieItem[] }>('/api/v1/movies/coming-soon?page_size=5000')
      .then(({ data }) => setMovies(data.items ?? []))
      .catch((err) => {
        console.error('Failed to load coming soon movies:', err)
        setError('Không thể tải danh sách phim sắp ra mắt từ máy chủ. Vui lòng kiểm tra lại kết nối.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchComingSoon()
  }, [])

  function toggleSubscribe(id: number) {
    if (subscribedIds.includes(id)) {
      setSubscribedIds(subscribedIds.filter((item) => item !== id))
    } else {
      setSubscribedIds([...subscribedIds, id])
    }
  }

  const filteredMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 pb-20">
      {/* Header Banner */}
      <div
        className={cn(
          'relative border rounded-3xl p-8 mb-10 overflow-hidden shadow-2xl transition-colors',
          isLight
            ? 'bg-gradient-to-r from-amber-500/10 via-amber-50/80 to-amber-100/50 border-amber-500/30 text-slate-900 shadow-amber-500/5'
            : 'bg-gradient-to-r from-[#161622] via-[#111118] to-[#1a1405] border-[#e8b84b]/20 text-[#f0ede8]'
        )}
      >
        <div className="relative z-10 max-w-2xl">
          <span
            className={cn(
              'text-xs font-mono-data font-bold uppercase tracking-widest border rounded-full px-3 py-1 inline-flex items-center gap-1.5 mb-3',
              isLight
                ? 'text-amber-800 bg-amber-500/15 border-amber-500/30'
                : 'text-[#e8b84b] bg-[#e8b84b]/15 border-[#e8b84b]/30'
            )}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Bom Tấn Khởi Chiếu Rạp</span>
          </span>
          <h1
            className={cn(
              'font-display font-black text-3xl sm:text-4xl mb-3 tracking-tight',
              isLight ? 'text-slate-900' : 'text-[#f0ede8]'
            )}
          >
            Phim Sắp Ra Mắt
          </h1>
          <p className={cn('text-sm leading-relaxed', isLight ? 'text-slate-600 font-medium' : 'text-[#a09e9a]')}>
            Đón chờ những siêu phẩm điện ảnh bom tấn thế giới sắp đổ bộ rạp CineVerse. Đăng ký thông báo ngay để không bỏ lỡ ngày mở bán vé đầu tiên!
          </p>
        </div>

        {/* Decorative background ambient */}
        <div
          className={cn(
            'absolute top-0 right-0 bottom-0 w-1/2 bg-gradient-to-l pointer-events-none',
            isLight ? 'from-amber-400/20 to-transparent' : 'from-[#e8b84b]/10 to-transparent'
          )}
        />
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className={cn('w-4 h-4', isLight ? 'text-slate-400' : 'text-[#6e6c68]')} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm phim sắp chiếu..."
            className={cn(
              'w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-colors',
              isLight
                ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500'
                : 'bg-[#111118] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'
            )}
          />
        </div>

        <div className={cn('text-xs font-mono-data', isLight ? 'text-slate-600' : 'text-[#a09e9a]')}>
          Hiển thị{' '}
          <span className={cn('font-bold', isLight ? 'text-amber-700' : 'text-[#e8b84b]')}>
            {filteredMovies.length}
          </span>{' '}
          phim sắp khởi chiếu
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className={cn('text-center py-20 text-xs font-mono-data animate-pulse', isLight ? 'text-slate-500' : 'text-[#a09e9a]')}>
          Đang tải danh sách phim sắp ra mắt...
        </div>
      ) : error ? (
        <div
          className={cn(
            'border rounded-2xl p-12 text-center space-y-4',
            isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-500/10 border-red-500/30 text-red-300'
          )}
        >
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="font-display font-bold text-lg">{error}</h3>
          <button
            type="button"
            onClick={fetchComingSoon}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div
          className={cn(
            'border rounded-3xl p-16 text-center space-y-3',
            isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#111118] border-white/10 text-[#a09e9a]'
          )}
        >
          <Film className={cn('w-12 h-12 mx-auto', isLight ? 'text-slate-400' : 'text-zinc-600')} />
          <h3 className={cn('font-display font-bold text-xl', isLight ? 'text-slate-900' : 'text-[#f0ede8]')}>
            Chưa tìm thấy phim phù hợp
          </h3>
          <p className="text-xs">Vui lòng nhập từ khóa tìm kiếm khác.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMovies.map((m) => {
            const isSubscribed = subscribedIds.includes(m.id)
            const releaseDateFmt = m.release_date
              ? new Date(m.release_date).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : 'Sắp ra mắt'

            return (
              <div
                key={m.id}
                onClick={() => navigate(`/movie/${m.id}`)}
                className={cn(
                  'border rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col group cursor-pointer',
                  isLight
                    ? 'bg-white border-slate-200 hover:border-amber-500/50 shadow-slate-200/60 hover:shadow-amber-500/10'
                    : 'bg-[#111118] border-white/10 hover:border-[#e8b84b]/50 shadow-xl hover:shadow-[0_8px_30px_rgba(232,184,75,0.15)]'
                )}
              >
                {/* Poster Card */}
                <div className={cn('relative aspect-[2/3] overflow-hidden', isLight ? 'bg-slate-100' : 'bg-[#09090e]')}>
                  <img
                    src={
                      m.poster_url ??
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=1200&fit=crop'
                    }
                    alt={m.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Release Date Badge */}
                  <div
                    className={cn(
                      'absolute top-3 left-3 backdrop-blur-md border rounded-lg px-2.5 py-1 text-[11px] font-mono-data font-bold shadow-lg flex items-center gap-1.5',
                      isLight
                        ? 'bg-white/95 text-amber-800 border-amber-500/40'
                        : 'bg-[#09090e]/90 text-[#e8b84b] border-[#e8b84b]/40'
                    )}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{releaseDateFmt}</span>
                  </div>

                  {/* Age Rating Badge */}
                  {m.rating && (
                    <div className="absolute top-3 right-3 bg-[#e8b84b] text-[#09090e] font-black text-[11px] rounded-lg px-2 py-0.5 shadow-md">
                      {m.rating}
                    </div>
                  )}
                </div>

                {/* Info Container */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3
                      className={cn(
                        'font-display font-bold text-lg transition-colors line-clamp-1 mb-1.5',
                        isLight
                          ? 'text-slate-900 group-hover:text-amber-700'
                          : 'text-[#f0ede8] group-hover:text-[#e8b84b]'
                      )}
                    >
                      {m.title}
                    </h3>
                    <p className={cn('text-xs line-clamp-3 leading-relaxed', isLight ? 'text-slate-600' : 'text-[#a09e9a]')}>
                      {m.description || 'Siêu phẩm điện ảnh đáng mong chờ nhất năm tại rạp CineVerse.'}
                    </p>
                  </div>

                  <div className={cn('text-[11px] font-mono-data font-bold flex items-center justify-between pt-2.5 border-t',
                    isLight ? 'border-slate-100 text-amber-700' : 'border-white/5 text-[#e8b84b]'
                  )}>
                    <span className="flex items-center gap-1.5">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Xem chi tiết</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
