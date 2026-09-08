import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Play,
  X,
  Star,
  Film,
} from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import type { Movie } from '../../../types'
import { cn } from '../../../lib/utils'

interface HeroBannerProps {
  movies: Movie[]
  onBookNow: (movie: Movie) => void
}

const SLIDE_INTERVAL_MS = 5000 // tự động lướt sau 5 giây


function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null
  try {
    if (url.includes('youtube.com/embed/')) {
      return url.includes('autoplay') ? url : `${url}?autoplay=1&rel=0`
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`
    }
    return url
  } catch {
    return url
  }
}

export default function HeroBanner({ movies, onBookNow }: HeroBannerProps) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback(
    (index: number) => {
      if (index === current || isTransitioning) return
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrent(index)
        setIsTransitioning(false)
      }, 350)
    },
    [current, isTransitioning],
  )

  const goNext = useCallback(() => {
    const next = (current + 1) % movies.length
    goTo(next)
  }, [current, movies.length, goTo])

  // Auto-slide (pause when trailer modal is open)
  useEffect(() => {
    if (movies.length <= 1 || isTrailerOpen) return
    timerRef.current = setInterval(goNext, SLIDE_INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [goNext, movies.length, isTrailerOpen])

  function handleDotClick(index: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    goTo(index)
    if (!isTrailerOpen) {
      timerRef.current = setInterval(goNext, SLIDE_INTERVAL_MS)
    }
  }

  if (!movies.length) return null

  const movie = movies[current]
  const posterImg = movie.img.startsWith('https://image.tmdb.org')
    ? movie.img
    : 'https://images.unsplash.com/photo-1534996858221-380b92700493?w=800&h=1200&fit=crop&auto=format'

  const trailerEmbedUrl = getYouTubeEmbedUrl(movie.trailerUrl)

  return (
    <div
      className={cn(
        'relative h-[580px] overflow-hidden transition-colors duration-300',
        isLight ? 'bg-[#f8fafc]' : 'bg-[#09090e]',
      )}
    >
      {/* Ambient Blurred Background from Poster */}
      <img
        key={`bg-${movie.id}`}
        src={posterImg}
        alt=""
        aria-hidden="true"
        className={cn(
          'absolute inset-0 w-full h-full object-cover blur-3xl scale-125 transition-opacity duration-700',
          isLight ? 'opacity-35' : 'opacity-25',
        )}
      />

      {/* Gradient overlays — Theme adaptive */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: isLight
            ? 'linear-gradient(90deg, rgba(248,250,252,0.98) 0%, rgba(248,250,252,0.88) 55%, rgba(248,250,252,0.3) 100%)'
            : 'linear-gradient(90deg, rgba(9,9,14,0.98) 0%, rgba(9,9,14,0.85) 50%, rgba(9,9,14,0.4) 100%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-32 transition-all duration-300"
        style={{
          background: isLight
            ? 'linear-gradient(0deg, rgba(248,250,252,1) 0%, transparent 100%)'
            : 'linear-gradient(0deg, rgba(9,9,14,1) 0%, transparent 100%)',
        }}
      />

      {/* Content Grid */}
      <div
        className="absolute inset-0 flex items-center"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 350ms ease, transform 350ms ease',
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Movie Info & CTAs */}
          <div className="lg:col-span-7 z-10">
            {/* Badges row: Phim đang chiếu + Age Rating + Actual Rating */}
            <div className="flex gap-2.5 items-center mb-4 flex-wrap">
              <span
                className={cn(
                  'text-xs font-mono-data uppercase tracking-wider rounded px-2.5 py-1 font-bold border',
                  isLight
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-700'
                    : 'text-[#e8b84b] bg-[#e8b84b]/10 border-[#e8b84b]/30',
                )}
              >
                Phim đang chiếu
              </span>

              {movie.rating && movie.rating !== 'N/A' && (
                <span className="text-xs font-mono-data uppercase tracking-wider rounded px-2.5 py-1 font-black bg-[#e8b84b] text-[#09090e] shadow-sm">
                  {movie.rating}
                </span>
              )}

              {movie.avg_rating && movie.avg_rating > 0 && (
                <span
                  className={cn(
                    'text-xs font-mono-data rounded px-2.5 py-1 font-bold border flex items-center gap-1.5',
                    isLight
                      ? 'bg-white/80 border-slate-300 text-amber-700 shadow-sm'
                      : 'bg-white/5 border-white/15 text-[#e8b84b]',
                  )}
                >
                  <Star className="w-3.5 h-3.5 fill-[#e8b84b] text-[#e8b84b]" />
                  <span>{movie.avg_rating.toFixed(1)} / 5</span>
                </span>
              )}

              <span
                className={cn(
                  'text-[13px]',
                  isLight ? 'text-slate-600 font-semibold' : 'text-[#a09e9a]',
                )}
              >
                {movie.genre.join(' · ')}
              </span>

              {movie.duration && movie.duration !== 'N/A' && (
                <>
                  <span className={isLight ? 'text-slate-400' : 'text-white/25'}>·</span>
                  <span
                    className={cn(
                      'text-[13px]',
                      isLight ? 'text-slate-600 font-semibold' : 'text-[#a09e9a]',
                    )}
                  >
                    {movie.duration}
                  </span>
                </>
              )}
            </div>

            {/* Title - Đồng nhất 1 khối màu chuẩn điện ảnh, ngắt dòng tự nhiên */}
            <h1
              className={cn(
                'font-display font-black leading-[1.08] mb-5 tracking-tight max-w-[620px]',
                isLight ? 'text-slate-900' : 'text-[#f0ede8]',
              )}
              style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
            >
              {movie.title}
            </h1>

            {/* Synopsis */}
            {movie.synopsis && (
              <p
                className={cn(
                  'text-[15px] leading-relaxed max-w-[500px] mb-8 line-clamp-3',
                  isLight ? 'text-slate-600 font-medium' : 'text-[#a09e9a]',
                )}
              >
                {movie.synopsis}
              </p>
            )}

            {/* CTA Buttons: Đặt vé ngay & Xem Trailer (Hai chức năng hoàn toàn khác nhau) */}
            <div className="flex gap-3 flex-wrap items-center">
              <button
                id="hero-book-btn"
                type="button"
                onClick={() => onBookNow(movie)}
                className={cn(
                  'rounded-xl px-7 py-3.5 text-sm font-black cursor-pointer tracking-wide transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex items-center gap-2',
                  isLight
                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/25'
                    : 'bg-[#e8b84b] text-[#09090e] hover:shadow-[0_8px_24px_rgba(232,184,75,0.4)]',
                )}
              >
                <span>Đặt vé ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-trailer-btn"
                type="button"
                onClick={() => setIsTrailerOpen(true)}
                className={cn(
                  'rounded-xl px-6 py-3.5 text-sm font-bold cursor-pointer tracking-wide transition-all duration-200 border flex items-center gap-2 hover:-translate-y-0.5',
                  isLight
                    ? 'bg-white/80 hover:bg-white text-slate-800 border-slate-300 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/15 shadow-md',
                )}
              >
                <Play className="w-4 h-4 fill-current opacity-80" />
                <span>Xem Trailer</span>
              </button>
            </div>
          </div>

          {/* Right Column: Complete Full Vertical Poster Card & Centered Navigation Controls */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center items-center z-10 space-y-4">
            <div onClick={() => onBookNow(movie)} className="relative group cursor-pointer">
              {/* Outer Card Glow */}
              <div
                className={cn(
                  'absolute -inset-1 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition duration-500',
                  isLight
                    ? 'bg-gradient-to-r from-amber-400/50 to-amber-200/30'
                    : 'bg-gradient-to-r from-[#e8b84b]/40 to-[#e8b84b]/10',
                )}
              />

              {/* Main Poster Frame */}
              <div
                className={cn(
                  'relative w-[280px] xl:w-[310px] aspect-[2/3] rounded-2xl overflow-hidden border transition-transform duration-500 group-hover:scale-[1.03]',
                  isLight
                    ? 'border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white'
                    : 'border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.9)] bg-[#111118]',
                )}
              >
                <img
                  src={posterImg}
                  alt={movie.title}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* Desktop Slide Navigation Controls (Centered under Poster Card) */}
            {movies.length > 1 && (
              <div className="flex gap-2 items-center justify-center w-[280px] xl:w-[310px] pt-1">
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => handleDotClick((current - 1 + movies.length) % movies.length)}
                  className={cn(
                    'w-7 h-7 shrink-0 rounded-full flex items-center justify-center border cursor-pointer text-xs font-bold transition-all',
                    isLight
                      ? 'bg-white/80 hover:bg-white text-slate-800 border-slate-300 shadow-sm'
                      : 'bg-white/10 hover:bg-white/25 text-white/80 border-white/10',
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1.5 flex-1 overflow-hidden px-1">
                  {movies.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Phim ${i + 1}`}
                      onClick={() => handleDotClick(i)}
                      className="border-0 cursor-pointer p-0 rounded-full transition-all duration-300 shrink-0"
                      style={{
                        width: i === current ? '22px' : '6px',
                        height: '6px',
                        background:
                          i === current
                            ? isLight
                              ? '#d97706'
                              : '#e8b84b'
                            : isLight
                            ? 'rgba(15,23,42,0.25)'
                            : 'rgba(240,237,232,0.3)',
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => handleDotClick((current + 1) % movies.length)}
                  className={cn(
                    'w-7 h-7 shrink-0 rounded-full flex items-center justify-center border cursor-pointer text-xs font-bold transition-all',
                    isLight
                      ? 'bg-white/80 hover:bg-white text-slate-800 border-slate-300 shadow-sm'
                      : 'bg-white/10 hover:bg-white/25 text-white/80 border-white/10',
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Slide Navigation Controls (Centered at bottom) */}
      {movies.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex lg:hidden gap-2 items-center justify-center max-w-[90vw] px-4">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => handleDotClick((current - 1 + movies.length) % movies.length)}
            className={cn(
              'w-7 h-7 shrink-0 rounded-full flex items-center justify-center border cursor-pointer text-xs font-bold transition-all',
              isLight
                ? 'bg-white/80 hover:bg-white text-slate-800 border-slate-300 shadow-sm'
                : 'bg-white/10 hover:bg-white/25 text-white/80 border-white/10',
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-1.5 overflow-x-auto max-w-[200px] scrollbar-none py-1">
            {movies.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Phim ${i + 1}`}
                onClick={() => handleDotClick(i)}
                className="border-0 cursor-pointer p-0 rounded-full transition-all duration-300 shrink-0"
                style={{
                  width: i === current ? '20px' : '6px',
                  height: '6px',
                  background:
                    i === current
                      ? isLight
                        ? '#d97706'
                        : '#e8b84b'
                      : isLight
                      ? 'rgba(15,23,42,0.25)'
                      : 'rgba(240,237,232,0.3)',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next"
            onClick={() => handleDotClick((current + 1) % movies.length)}
            className={cn(
              'w-7 h-7 shrink-0 rounded-full flex items-center justify-center border cursor-pointer text-xs font-bold transition-all',
              isLight
                ? 'bg-white/80 hover:bg-white text-slate-800 border-slate-300 shadow-sm'
                : 'bg-white/10 hover:bg-white/25 text-white/80 border-white/10',
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Centered Trailer Modal (Chuẩn 16:9, Căn giữa 100%, Phù hợp cả 2 chế độ sáng/tối) */}
      {isTrailerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setIsTrailerOpen(false)}
        >
          <div
            className={cn(
              'relative w-full max-w-4xl rounded-2xl overflow-hidden border shadow-2xl transition-all',
              isLight ? 'bg-white border-slate-200' : 'bg-[#111118] border-white/20',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={cn(
                'flex items-center justify-between px-5 py-3.5 border-b',
                isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-[#161622]',
              )}
            >
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-[#e8b84b] fill-current" />
                <h3
                  className={cn(
                    'font-display font-bold text-sm truncate max-w-[400px] md:max-w-[600px]',
                    isLight ? 'text-slate-900' : 'text-white',
                  )}
                >
                  Trailer Chính Thức: {movie.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTrailerOpen(false)}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-white/80 hover:bg-white/10',
                )}
                aria-label="Đóng trailer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 16:9 Video Area */}
            <div className="relative aspect-video w-full bg-black">
              {trailerEmbedUrl ? (
                <iframe
                  src={trailerEmbedUrl}
                  title={`Trailer ${movie.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/70 p-6 text-center">
                  <Film className="w-12 h-12 mb-3 text-amber-500/80" />
                  <p className="font-semibold text-sm">Trailer chính thức đang được cập nhật</p>
                  <p className="text-xs text-white/40 mt-1">Vui lòng quay lại sau</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
