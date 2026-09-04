import { useState } from 'react'
import { Star, Clock, Ticket } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import type { Movie } from '../../../types'
import { cn } from '../../../lib/utils'

interface MovieCardProps {
  movie: Movie
  onSelect: (m: Movie) => void
}

export default function MovieCard({ movie, onSelect }: MovieCardProps) {
  const [hovered, setHovered] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      onClick={() => onSelect(movie)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col',
        isDark
          ? 'bg-[#111118] border-white/10 hover:border-[#e8b84b]/40 hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)]'
          : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10',
        hovered ? '-translate-y-1.5' : ''
      )}
    >
      {/* Poster */}
      <div className="relative bg-slate-900 aspect-[2/3] overflow-hidden">
        <img
          src={movie.img}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Age Rating Badge */}
        {movie.rating && movie.rating !== 'N/A' && (
          <div className="absolute top-2.5 right-2.5 bg-[#e8b84b] text-[#09090e] font-black text-[11px] rounded-lg px-2 py-0.5 shadow-md z-10">
            {movie.rating}
          </div>
        )}

        {/* Hover overlay CTA */}
        <div
          className={cn(
            'absolute inset-0 flex items-end p-3 transition-opacity duration-200',
            hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          style={{
            background: 'linear-gradient(0deg, rgba(9,9,14,0.95) 0%, rgba(9,9,14,0.4) 60%, transparent 100%)',
          }}
        >
          <button
            type="button"
            className="w-full bg-[#e8b84b] hover:bg-[#f5c759] text-[#09090e] font-black py-2.5 px-3 rounded-xl text-xs cursor-pointer tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Đặt vé ngay</span>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className={cn(
            'font-display text-sm sm:text-[15px] font-bold leading-snug mb-1.5 line-clamp-2 transition-colors',
            isDark ? 'text-[#f0ede8] group-hover:text-[#e8b84b]' : 'text-slate-900 group-hover:text-amber-600'
          )}>
            {movie.title}
          </h3>

          <div className="flex gap-1.5 flex-wrap mb-2.5">
            {movie.genre.slice(0, 3).map((g) => (
              <span
                key={g}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-md font-medium',
                  isDark ? 'bg-white/5 text-[#a09e9a]' : 'bg-slate-100 text-slate-600'
                )}
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        <div className={cn('flex justify-between items-center text-xs pt-2 border-t font-medium', isDark ? 'border-white/5 text-[#a09e9a]' : 'border-slate-100 text-slate-500')}>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 opacity-70" />
            <span>{movie.duration}</span>
          </span>
          <span className="flex items-center gap-1 font-mono-data text-[#e8b84b] font-bold">
            <Star className="w-3 h-3 fill-[#e8b84b] text-[#e8b84b]" />
            <span>{movie.avg_rating ? movie.avg_rating.toFixed(1) : (movie.score || '5.0')}</span>
            {movie.total_reviews !== undefined && movie.total_reviews > 0 && (
              <span className={cn('text-[10px] font-normal', isDark ? 'text-[#a09e9a]' : 'text-slate-400')}>
                ({movie.total_reviews})
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
