import { Search } from 'lucide-react'
import { useGenres } from '../../../hooks/useMovies'
import { useTheme } from '../../../context/ThemeContext'
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
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
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className={cn('w-4 h-4', isDark ? 'text-[#6e6c68]' : 'text-slate-400')} />
          </span>
          <input
            id="movie-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Tìm kiếm tên phim, đạo diễn..."
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all border',
              isDark
                ? 'bg-[#111118] border-white/10 text-[#f0ede8] placeholder:text-[#6e6c68] focus:border-[#e8b84b]/60'
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 shadow-xs'
            )}
          />
        </div>

        {/* Genre pills */}
        <div className="flex gap-2 flex-wrap items-center">
          {uniqueGenres.map((g) => (
            <button
              key={g}
              onClick={() => onGenre(g)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all duration-150',
                activeGenre === g
                  ? isDark
                    ? 'border-[#e8b84b] bg-[#e8b84b]/15 text-[#e8b84b] shadow-sm'
                    : 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                  : isDark
                    ? 'border-white/10 bg-[#111118] text-[#a09e9a] hover:border-white/20 hover:text-[#f0ede8]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-2xs'
              )}
            >
              {g === 'All' ? 'Tất cả thể loại' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Results header / count */}
      <div className={cn('flex justify-between items-center text-xs font-mono-data mb-6', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
        <span>
          {isLoading
            ? 'Đang tải danh sách phim...'
            : `Hiển thị ${resultCount} phim ${activeGenre !== 'All' ? `thuộc thể loại "${activeGenre}"` : ''}`}
        </span>
      </div>
    </div>
  )
}
