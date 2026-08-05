import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import type { Movie } from '../types'

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
  const [movies, setMovies] = useState<ComingSoonMovieItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [subscribedIds, setSubscribedIds] = useState<number[]>([])

  useEffect(() => {
    setLoading(true)
    apiClient
      .get<{ items: ComingSoonMovieItem[] }>('/api/v1/movies/coming-soon')
      .then(({ data }) => setMovies(data.items ?? []))
      .catch((err) => console.error('Failed to load coming soon movies:', err))
      .finally(() => setLoading(false))
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
      <div className="relative bg-gradient-to-r from-[#161622] via-[#111118] to-[#1a1405] border border-[#e8b84b]/20 rounded-2xl p-8 mb-10 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-mono-data font-bold text-[#e8b84b] uppercase tracking-widest bg-[#e8b84b]/15 border border-[#e8b84b]/30 rounded-full px-3 py-1 inline-block mb-3">
            🎬 Bom Tấn Khởi Chiếu Rạp
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#f0ede8] mb-3 tracking-tight">
            Phim Sắp Ra Mắt
          </h1>
          <p className="text-sm text-[#a09e9a] leading-relaxed">
            Đón chờ những siêu phẩm điện ảnh bom tấn thế giới sắp đổ bộ rạp CineVerse. Đăng ký thông báo ngay để không bỏ lỡ ngày mở bán vé đầu tiên!
          </p>
        </div>

        {/* Decorative background ambient */}
        <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-gradient-to-l from-[#e8b84b]/10 to-transparent pointer-events-none" />
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3 top-2.5 text-[#6e6c68] text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm phim sắp chiếu..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#111118] border border-white/10 rounded-xl text-[#f0ede8] text-sm focus:border-[#e8b84b] outline-none"
          />
        </div>

        <div className="text-xs text-[#a09e9a] font-mono-data">
          Hiển thị <span className="text-[#e8b84b] font-bold">{filteredMovies.length}</span> phim sắp khởi chiếu
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="text-center py-20 text-xs text-[#a09e9a] font-mono-data animate-pulse">
          Đang tải danh sách phim sắp ra mắt...
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="bg-[#111118] border border-white/10 rounded-2xl p-16 text-center text-[#a09e9a]">
          <span className="text-5xl block mb-4">🎥</span>
          <h3 className="font-display font-bold text-xl text-[#f0ede8] mb-2">Chưa tìm thấy phim phù hợp</h3>
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
                className="bg-[#111118] border border-white/10 hover:border-[#e8b84b]/40 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col group"
              >
                {/* Poster Card */}
                <div className="relative aspect-[2/3] overflow-hidden bg-[#09090e]">
                  <img
                    src={
                      m.poster_url ??
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=1200&fit=crop'
                    }
                    alt={m.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Release Date Badge */}
                  <div className="absolute top-3 left-3 bg-[#09090e]/90 backdrop-blur-md border border-[#e8b84b]/40 rounded-lg px-2.5 py-1 text-[11px] font-mono-data text-[#e8b84b] font-bold shadow-lg">
                    📅 {releaseDateFmt}
                  </div>

                  {/* Age Rating Badge */}
                  {m.rating && (
                    <div className="absolute top-3 right-3 bg-[#e8b84b] text-[#09090e] font-black text-[11px] rounded px-2 py-0.5 shadow-md">
                      {m.rating}
                    </div>
                  )}
                </div>

                {/* Info Container */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#f0ede8] group-hover:text-[#e8b84b] transition-colors line-clamp-1 mb-1">
                      {m.title}
                    </h3>
                    <p className="text-xs text-[#a09e9a] line-clamp-2 leading-relaxed">
                      {m.description || 'Siêu phẩm điện ảnh đáng mong chờ nhất năm tại rạp CineVerse.'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => toggleSubscribe(m.id)}
                      title="Tính năng nhận thông báo qua email/trình duyệt khi phim bắt đầu mở bán vé"
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                        isSubscribed
                          ? 'bg-[#2ecc71]/15 text-[#2ecc71] border-[#2ecc71]/40'
                          : 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] hover:shadow-[0_4px_16px_rgba(232,184,75,0.3)]'
                      }`}
                    >
                      <span>{isSubscribed ? '✓ Đã đăng ký (Sắp ra mắt)' : '🔔 Nhận thông báo mở bán vé'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/movie/${m.id}`)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-[#a09e9a] hover:text-[#f0ede8] border border-white/10 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                    >
                      ▶ Xem thông tin chi tiết
                    </button>
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
