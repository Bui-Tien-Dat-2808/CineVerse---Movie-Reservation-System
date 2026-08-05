import type { Movie } from '../../../types'
import MovieCard from './MovieCard'

// ── Skeleton card khi đang loading ──
function SkeletonCard() {
  return (
    <div className="rounded overflow-hidden bg-[#111118] border border-white/[0.06] animate-pulse">
      <div className="bg-[#1a1a28]" style={{ aspectRatio: '2/3' }} />
      <div className="px-3.5 py-3 space-y-2">
        <div className="h-4 bg-[#1a1a28] rounded w-3/4" />
        <div className="h-3 bg-[#1a1a28] rounded w-1/2" />
        <div className="h-3 bg-[#1a1a28] rounded w-1/3" />
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
  // Hiển thị skeleton khi đang load
  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 pb-20">
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 pb-20">
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <span className="text-4xl">🎬</span>
          <p className="font-display text-xl text-[#6e6c68]">Không tìm thấy phim phù hợp</p>
          <p className="text-sm text-[#4e4c48]">Thử tìm kiếm với từ khóa khác</p>
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
