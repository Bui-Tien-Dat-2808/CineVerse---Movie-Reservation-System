import { useGenres } from '../../../hooks/useMovies'
import { cn } from '../../../lib/utils'

interface SearchBarProps {
  searchQuery: string
  activeGenre: string
  onSearch: (q: string) => void
  onGenre: (g: string) => void
  resultCount: number
  isLoading?: boolean
}

export default function SearchBar({
  searchQuery,
  activeGenre,
  onSearch,
  onGenre,
  resultCount,
  isLoading,
}: SearchBarProps) {
  const { data: apiGenres } = useGenres()

  const genreList = ['All', ...(apiGenres ? apiGenres.map((g) => g.name.replace(/^Phim\s+/i, '')) : [])]

  // Deduplicate genres list while keeping order
  const uniqueGenres = Array.from(new Set(genreList))

  return (
    <div className="max-w-[1280px] mx-auto px-6 pt-12">
      {/* Search + Genre filter row */}
      <div className="flex gap-3 mb-7 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[280px] max-w-[400px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6e6c68] text-base pointer-events-none">
            ⌕
          </span>
          <input
            id="movie-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Tìm kiếm phim..."
            className="w-full pl-10 pr-4 py-[11px] bg-[#111118] border border-white/[0.08] rounded text-[#f0ede8] text-sm outline-none placeholder:text-[#4e4c48] focus:border-[rgba(232,184,75,0.35)] transition-colors"
          />
        </div>

        {/* Genre pills */}
        <div className="flex gap-2 flex-wrap items-center">
          {uniqueGenres.map((g) => (
            <button
              key={g}
              onClick={() => onGenre(g)}
              className={cn(
                'px-4 py-[9px] rounded text-[13px] font-medium cursor-pointer border transition-all duration-150',
                activeGenre === g
                  ? 'border-[#e8b84b] bg-[rgba(232,184,75,0.12)] text-[#e8b84b]'
                  : 'border-white/[0.08] bg-[#111118] text-[#a09e9a] hover:border-white/20 hover:text-[#f0ede8]',
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Results header / count */}
      <div className="flex justify-between items-center text-xs text-[#a09e9a] font-mono-data mb-6">
        <span>
          {isLoading
            ? 'Đang tải danh sách phim...'
            : `Hiển thị ${resultCount} phim ${activeGenre !== 'All' ? `thuộc thể loại "${activeGenre}"` : ''}`}
        </span>
      </div>
    </div>
  )
}
