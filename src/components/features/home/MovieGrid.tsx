import { Film } from 'lucide-react'
import type { Movie } from '../../../types'
import MovieCard from './MovieCard'
import { useTheme } from '../../../context/ThemeContext'
import { cn } from '../../../lib/utils'

// ── Skeleton card khi đang loading ──
function SkeletonCard({ isDark }: { isDark: boolean }) {
  return (
    <div className={cn(
      'rounded-2xl overflow-hidden border animate-pulse flex flex-col',
      isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
    )}>
      <div className={cn('w-full aspect-[2/3]', isDark ? 'bg-white/5' : 'bg-slate-200')} />
      <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className={cn('h-4 rounded-md w-3/4', isDark ? 'bg-white/10' : 'bg-slate-200')} />
          <div className={cn('h-3 rounded-md w-1/2', isDark ? 'bg-white/5' : 'bg-slate-100')} />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <div className={cn('h-3 rounded-md w-1/4', isDark ? 'bg-white/5' : 'bg-slate-100')} />
          <div className={cn('h-3 rounded-md w-1/4', isDark ? 'bg-white/5' : 'bg-slate-100')} />
        </div>
      </div>
    </div>
  )
}

interface MovieGridProps {
  movies: Movie[]
  onSelect: (m: Movie) => void
  isLoading?: boolean
}

export default function MovieGrid({ movies, onSelect, isLoading }: MovieGridProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Hiển thị skeleton khi đang load
  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 pb-20">
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} isDark={isDark} />
          ))}
        </div>
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 pb-20">
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <Film className={cn('w-12 h-12', isDark ? 'text-zinc-600' : 'text-slate-400')} />
          <p className={cn('font-display text-lg font-bold', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
            Không tìm thấy phim phù hợp
          </p>
          <p className={cn('text-xs font-mono-data', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
            Thử tìm kiếm với từ khóa hoặc bộ lọc thể loại khác
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 pb-20">
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
      >
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
