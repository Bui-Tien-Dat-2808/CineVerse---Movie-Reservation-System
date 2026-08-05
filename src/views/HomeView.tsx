import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useBooking } from '../context/BookingContext'
import { useNowShowingMovies } from '../hooks/useMovies'
import type { Movie } from '../types'
import HeroBanner from '../components/features/home/HeroBanner'
import SearchBar from '../components/features/home/SearchBar'
import MovieGrid from '../components/features/home/MovieGrid'

export default function HomeView() {
  const navigate = useNavigate()
  const { selectMovie } = useBooking()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')

  // Fetch từ backend API
  const { data: movies = [], isLoading, isError } = useNowShowingMovies()

  const filteredMovies = movies.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchGenre = activeGenre === 'All' || m.genre.includes(activeGenre)
    return matchSearch && matchGenre
  })

  function handleSelectMovie(movie: Movie) {
    selectMovie(movie)
    navigate(`/movie/${movie.id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Hero carousel — lướt qua các phim đang chiếu */}
      <HeroBanner movies={movies} onBookNow={handleSelectMovie} />

      <SearchBar
        searchQuery={searchQuery}
        activeGenre={activeGenre}
        onSearch={setSearchQuery}
        onGenre={setActiveGenre}
        resultCount={filteredMovies.length}
        isLoading={isLoading}
      />

      <MovieGrid movies={filteredMovies} onSelect={handleSelectMovie} isLoading={isLoading} />

      {isError && (
        <div className="max-w-[1280px] mx-auto px-6 py-8 text-center">
          <div className="bg-[rgba(192,57,43,0.1)] border border-[rgba(192,57,43,0.3)] text-[#e07060] rounded-xl p-6 text-xs font-mono-data inline-block">
            ⚠ Không thể tải danh sách phim từ máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.
          </div>
        </div>
      )}
    </>
  )
}
