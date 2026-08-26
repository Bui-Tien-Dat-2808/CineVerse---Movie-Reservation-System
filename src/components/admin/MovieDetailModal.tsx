interface MovieItem {
  id: number
  title: string
  description?: string
  poster_url?: string
  duration_minutes?: number
  release_date?: string
  status: 'now_showing' | 'coming_soon' | 'ended' | string
  rating?: string
  director?: string
  trailer_url?: string
  cast?: Array<{ name: string; character?: string; profile_url?: string }>
  genres?: Array<{ id?: number; name: string }>
  tmdb_id?: number
}

function buildTrailerEmbedUrl(url: string): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('autoplay', '1')
    parsed.searchParams.set('rel', '0')
    return parsed.toString()
  } catch {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}autoplay=1&rel=0`
  }
}

interface MovieDetailModalProps {
  movie: MovieItem | null
  onClose: () => void
}

export default function MovieDetailModal({ movie, onClose }: MovieDetailModalProps) {
  if (!movie) return null

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-[99999] p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#11111a] border border-white/15 rounded-3xl max-w-5xl w-full p-5 sm:p-7 space-y-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative text-left max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header: Title + Status + Close Button */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10 shrink-0 pr-10 relative">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono-data uppercase border ${
                  movie.status === 'now_showing'
                    ? 'bg-[#2ecc71]/15 text-[#2ecc71] border-[#2ecc71]/30'
                    : movie.status === 'coming_soon'
                    ? 'bg-[#e8b84b]/15 text-[#e8b84b] border-[#e8b84b]/30'
                    : 'bg-white/5 text-[#a09e9a] border-white/10'
                }`}
              >
                {movie.status === 'now_showing'
                  ? '▶ Đang chiếu'
                  : movie.status === 'coming_soon'
                  ? '📅 Sắp ra mắt'
                  : '⏹ Ngừng chiếu'}
              </span>

              {movie.rating && movie.rating !== 'N/A' && (
                <span className="bg-[#e8b84b] text-[#09090e] font-black text-[10px] rounded px-2 py-0.5 shadow-sm">
                  {movie.rating}
                </span>
              )}

              {movie.genres?.map((g) => (
                <span
                  key={g.name}
                  className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-[#a09e9a]"
                >
                  {g.name}
                </span>
              ))}
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#f0ede8] leading-tight truncate">
              {movie.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-0 right-0 w-9 h-9 rounded-full bg-white/10 hover:bg-rose-500/25 text-[#a09e9a] hover:text-white flex items-center justify-center text-base font-bold transition-all cursor-pointer border border-white/15 shrink-0 shadow-md"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-2 space-y-6 flex-1 scrollbar-thin scrollbar-thumb-amber-500/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Poster + Meta + Synopsis + Cast (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex gap-4 items-start bg-white/[0.02] border border-white/10 p-3.5 rounded-2xl">
                <div className="w-24 sm:w-28 aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/10 bg-[#181824] shrink-0">
                  <img
                    src={
                      movie.poster_url ||
                      'https://images.unsplash.com/photo-1534996858221-380b92700493?w=300'
                    }
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2 text-xs text-[#a09e9a] min-w-0">
                  {movie.director && (
                    <div>
                      <span className="text-[#e8b84b] font-bold block">🎬 Đạo diễn:</span>
                      <span className="text-[#f0ede8] font-medium">{movie.director}</span>
                    </div>
                  )}
                  {movie.duration_minutes ? (
                    <div>
                      <span className="text-[#e8b84b] font-bold block">⏱️ Thời lượng:</span>
                      <span className="text-[#f0ede8] font-mono-data">
                        {movie.duration_minutes} phút
                      </span>
                    </div>
                  ) : null}
                  {movie.release_date ? (
                    <div>
                      <span className="text-[#e8b84b] font-bold block">📅 Khởi chiếu:</span>
                      <span className="text-[#f0ede8] font-mono-data">{movie.release_date}</span>
                    </div>
                  ) : null}
                  {movie.tmdb_id ? (
                    <div>
                      <span className="text-[#e8b84b] font-bold block">🎬 TMDB ID:</span>
                      <span className="text-[#f0ede8] font-mono-data">#{movie.tmdb_id}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Synopsis Box */}
              {movie.description && (
                <div className="space-y-2 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
                  <span className="font-bold block text-xs text-[#e8b84b] uppercase tracking-wider flex items-center gap-1.5">
                    <span>📖</span> Nội dung / Tóm tắt:
                  </span>
                  <p className="text-xs leading-relaxed text-[#f0ede8]/90">
                    {movie.description}
                  </p>
                </div>
              )}

              {/* Cast Box */}
              {movie.cast && movie.cast.length > 0 && (
                <div className="space-y-2 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
                  <span className="font-bold block text-xs text-[#e8b84b] uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎭</span> Diễn viên chính:
                  </span>
                  <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-amber-500/30">
                    {movie.cast.map((actor, idx) => (
                      <div
                        key={actor.name + idx}
                        className="flex-shrink-0 flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-white/10 bg-[#161622] text-xs shadow-xs"
                      >
                        {actor.profile_url ? (
                          <img
                            src={actor.profile_url}
                            alt={actor.name}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-white/10"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#e8b84b]/20 text-[#e8b84b] font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {actor.name.charAt(0)}
                          </div>
                        )}
                        <div className="text-left leading-tight">
                          <div className="font-bold text-[11px] whitespace-nowrap text-[#f0ede8]">
                            {actor.name}
                          </div>
                          {actor.character && (
                            <div className="text-[9px] whitespace-nowrap text-[#a09e9a] font-mono-data opacity-75">
                              {actor.character}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Trailer Player (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold block text-xs text-[#e8b84b] uppercase tracking-wider flex items-center gap-1.5">
                  <span>▶</span> Trailer Phim (YouTube HD):
                </span>
              </div>

              {movie.trailer_url ? (
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl relative">
                  <iframe
                    src={buildTrailerEmbedUrl(movie.trailer_url)}
                    title={`Trailer ${movie.title}`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video w-full rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center p-6 text-[#a09e9a] space-y-2">
                  <span className="text-3xl">🎬</span>
                  <span className="text-xs italic">Chưa có link trailer HD cho phim này.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
