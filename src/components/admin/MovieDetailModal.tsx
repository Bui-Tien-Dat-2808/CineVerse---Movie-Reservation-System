import React, { useEffect } from 'react'
import {
  X,
  Clock,
  Calendar,
  Film,
  Clapperboard,
  Users,
  FileText,
  Play,
  CheckCircle2,
  AlertCircle,
  Hash,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { cn, normalizeInternationalName } from '../../lib/utils'

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

function renderAgeRatingBadge(rating?: string, isDark: boolean = true) {
  if (!rating || rating === 'N/A') return null
  const r = rating.toUpperCase().trim()
  if (r.includes('18') || r === 'T18' || r === 'C18' || r === 'R' || r === 'NC-17') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-tight bg-rose-500/15 text-rose-500 border border-rose-500/30 shadow-2xs">
        T18
      </span>
    )
  }
  if (r.includes('16') || r === 'T16' || r === 'C16') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-tight bg-orange-500/15 text-orange-500 border border-orange-500/30 shadow-2xs">
        T16
      </span>
    )
  }
  if (r.includes('13') || r === 'T13' || r === 'C13' || r === 'PG-13') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-tight bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-2xs">
        T13
      </span>
    )
  }
  if (r === 'K' || r.includes('PG')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-tight bg-sky-500/15 text-sky-500 border border-sky-500/30 shadow-2xs">
        K
      </span>
    )
  }
  if (r === 'P' || r === 'G') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-tight bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-2xs">
        P
      </span>
    )
  }
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border',
      isDark ? 'bg-white/5 text-[#f0ede8] border-white/15' : 'bg-slate-100 text-slate-700 border-slate-200'
    )}>
      {rating}
    </span>
  )
}

interface MovieDetailModalProps {
  movie: MovieItem | null
  onClose: () => void
}

export default function MovieDetailModal({ movie, onClose }: MovieDetailModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!movie) return null

  const internationalDirector = normalizeInternationalName(movie.director)

  return (
    <div
      className={cn(
        'fixed inset-0 backdrop-blur-xl flex items-center justify-center z-[99999] p-3 sm:p-6 animate-in fade-in duration-200',
        isDark ? 'bg-black/85' : 'bg-slate-950/50'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'border rounded-3xl max-w-5xl w-full p-5 sm:p-7 space-y-5 shadow-2xl relative text-left max-h-[90vh] flex flex-col overflow-hidden transition-colors',
          isDark
            ? 'bg-[#111118] border-white/10 text-[#f0ede8]'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-950/20'
        )}
      >
        {/* Header: Status badges, Title, and Close Button */}
        <div className={cn(
          'flex items-start justify-between gap-4 pb-4 border-b shrink-0 pr-12 relative',
          isDark ? 'border-white/10' : 'border-slate-200'
        )}>
          <div className="space-y-2 min-w-0 flex-1">
            {/* Badges bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Release Status Badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono-data uppercase border',
                  movie.status === 'now_showing'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : movie.status === 'coming_soon'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : isDark
                    ? 'bg-white/5 text-[#a09e9a] border-white/10'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    movie.status === 'now_showing'
                      ? 'bg-emerald-500 animate-pulse'
                      : movie.status === 'coming_soon'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  )}
                />
                <span>
                  {movie.status === 'now_showing'
                    ? 'Đang chiếu'
                    : movie.status === 'coming_soon'
                    ? 'Sắp ra mắt'
                    : 'Ngừng chiếu'}
                </span>
              </span>

              {/* Age Rating Badge */}
              {renderAgeRatingBadge(movie.rating, isDark)}

              {/* Genre Badges */}
              {movie.genres?.map((g) => (
                <span
                  key={g.name}
                  className={cn(
                    'px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-colors',
                    isDark
                      ? 'bg-white/5 border-white/10 text-[#a09e9a]'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  )}
                >
                  {g.name?.replace(/^Phim\s+/i, '').trim()}
                </span>
              ))}
            </div>

            {/* Movie Title (High contrast, never dark-on-dark) */}
            <h2 className={cn(
              'font-display text-xl sm:text-2xl lg:text-3xl font-black leading-tight tracking-tight',
              isDark ? 'text-white' : 'text-slate-900'
            )}>
              {movie.title}
            </h2>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'absolute top-0 right-0 w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border shadow-sm active:scale-95 shrink-0',
              isDark
                ? 'bg-white/10 hover:bg-rose-500/20 text-[#a09e9a] hover:text-rose-300 border-white/15'
                : 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200 hover:border-rose-200'
            )}
            title="Đóng (ESC)"
            aria-label="Đóng chi tiết phim"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto pr-2 space-y-6 flex-1 scrollbar-thin scrollbar-thumb-amber-500/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Poster + Metadata + Synopsis + Cast (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Poster and Quick Meta Card */}
              <div className={cn(
                'flex gap-4 items-start border p-3.5 rounded-2xl shadow-xs transition-colors',
                isDark ? 'bg-white/[0.025] border-white/10' : 'bg-slate-50 border-slate-200'
              )}>
                {/* Poster */}
                <div className={cn(
                  'w-24 sm:w-28 aspect-[2/3] rounded-xl overflow-hidden shadow-md border shrink-0',
                  isDark ? 'border-white/10 bg-[#161622]' : 'border-slate-200 bg-slate-200'
                )}>
                  <img
                    src={
                      movie.poster_url ||
                      'https://images.unsplash.com/photo-1534996858221-380b92700493?w=300'
                    }
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1534996858221-380b92700493?w=300'
                    }}
                  />
                </div>

                {/* Metadata List */}
                <div className="flex-1 space-y-2.5 text-xs min-w-0">
                  {/* Director (Normalized to International Latin Name) */}
                  {internationalDirector && (
                    <div>
                      <span className={cn(
                        'text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5',
                        isDark ? 'text-amber-400' : 'text-amber-700'
                      )}>
                        <Clapperboard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Đạo diễn:</span>
                      </span>
                      <span className={cn('font-semibold text-sm', isDark ? 'text-white' : 'text-slate-900')}>
                        {internationalDirector}
                      </span>
                    </div>
                  )}

                  {/* Duration */}
                  {movie.duration_minutes ? (
                    <div>
                      <span className={cn(
                        'text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5',
                        isDark ? 'text-amber-400' : 'text-amber-700'
                      )}>
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Thời lượng:</span>
                      </span>
                      <span className={cn('font-mono-data font-semibold', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                        {movie.duration_minutes} phút
                      </span>
                    </div>
                  ) : null}

                  {/* Release Date */}
                  {movie.release_date ? (
                    <div>
                      <span className={cn(
                        'text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5',
                        isDark ? 'text-amber-400' : 'text-amber-700'
                      )}>
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Khởi chiếu:</span>
                      </span>
                      <span className={cn('font-mono-data font-semibold', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                        {movie.release_date}
                      </span>
                    </div>
                  ) : null}

                  {/* TMDB ID */}
                  {movie.tmdb_id ? (
                    <div>
                      <span className={cn(
                        'text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5',
                        isDark ? 'text-amber-400' : 'text-amber-700'
                      )}>
                        <Film className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>TMDB ID:</span>
                      </span>
                      <span className="font-mono-data font-bold text-sky-500">
                        #{movie.tmdb_id}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Synopsis Box */}
              {movie.description && (
                <div className={cn(
                  'space-y-2 border p-4 rounded-2xl shadow-xs transition-colors',
                  isDark ? 'bg-white/[0.025] border-white/10' : 'bg-slate-50 border-slate-200'
                )}>
                  <span className={cn(
                    'font-display font-black block text-xs uppercase tracking-wider flex items-center gap-1.5',
                    isDark ? 'text-amber-400' : 'text-amber-700'
                  )}>
                    <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Nội dung / Tóm tắt:</span>
                  </span>
                  <p className={cn(
                    'font-sans text-xs leading-relaxed text-justify',
                    isDark ? 'text-[#f0ede8]/90' : 'text-slate-700'
                  )}>
                    {normalizeInternationalName(movie.description)}
                  </p>
                </div>
              )}

              {/* Cast Box (Fully Normalized International Names) */}
              {movie.cast && movie.cast.length > 0 && (
                <div className={cn(
                  'space-y-2.5 border p-4 rounded-2xl shadow-xs transition-colors',
                  isDark ? 'bg-white/[0.025] border-white/10' : 'bg-slate-50 border-slate-200'
                )}>
                  <span className={cn(
                    'font-display font-black block text-xs uppercase tracking-wider flex items-center gap-1.5',
                    isDark ? 'text-amber-400' : 'text-amber-700'
                  )}>
                    <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Diễn viên chính:</span>
                  </span>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-500/30">
                    {movie.cast.map((actor, idx) => {
                      const normalizedName = normalizeInternationalName(actor.name)
                      const normalizedChar = normalizeInternationalName(actor.character)

                      return (
                        <div
                          key={actor.name + idx}
                          className={cn(
                            'flex-shrink-0 flex items-center gap-2.5 p-2 pr-3.5 rounded-xl border transition-all text-xs shadow-xs',
                            isDark
                              ? 'bg-[#161622] border-white/10 hover:border-white/25 text-[#f0ede8]'
                              : 'bg-white border-slate-200 hover:border-amber-400 text-slate-800'
                          )}
                        >
                          {actor.profile_url ? (
                            <img
                              src={actor.profile_url}
                              alt={normalizedName}
                              className={cn(
                                'w-9 h-9 rounded-lg object-cover flex-shrink-0 border',
                                isDark ? 'border-white/10' : 'border-slate-200'
                              )}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className={cn(
                              'w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center flex-shrink-0',
                              isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                            )}>
                              {normalizedName.charAt(0)}
                            </div>
                          )}
                          <div className="text-left leading-tight">
                            <div className={cn(
                              'font-bold text-[11px] whitespace-nowrap',
                              isDark ? 'text-[#f0ede8]' : 'text-slate-900'
                            )}>
                              {normalizedName}
                            </div>
                            {normalizedChar && (
                              <div className={cn(
                                'text-[9px] whitespace-nowrap font-mono-data mt-0.5',
                                isDark ? 'text-[#a09e9a]' : 'text-slate-500'
                              )}>
                                {normalizedChar}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Trailer Video Player (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className={cn(
                  'font-display font-black block text-xs uppercase tracking-wider flex items-center gap-1.5',
                  isDark ? 'text-amber-400' : 'text-amber-700'
                )}>
                  <Play className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
                  <span>Trailer Phim (YouTube HD):</span>
                </span>
              </div>

              {movie.trailer_url ? (
                <div className={cn(
                  'aspect-video w-full rounded-2xl overflow-hidden border shadow-xl relative transition-colors',
                  isDark ? 'border-white/15 bg-black' : 'border-slate-300 bg-slate-950'
                )}>
                  <iframe
                    src={buildTrailerEmbedUrl(movie.trailer_url)}
                    title={`Trailer ${movie.title}`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className={cn(
                  'aspect-video w-full rounded-2xl border flex flex-col items-center justify-center text-center p-6 space-y-2',
                  isDark
                    ? 'border-white/10 bg-white/5 text-[#a09e9a]'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                )}>
                  <Film className="w-10 h-10 stroke-[1.5] text-amber-500 opacity-60" />
                  <span className="text-xs font-medium">Chưa có link trailer HD cho bộ phim này.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
