import { useQuery } from '@tanstack/react-query'
import { fetchNowShowingMovies, fetchMovieById, fetchGenres } from '../api/movies'

/**
 * Fetch list of now-showing movies from backend.
 */
export function useNowShowingMovies() {
  return useQuery({
    queryKey: ['movies', 'now-showing'],
    queryFn: fetchNowShowingMovies,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Fetch detail of a single movie by ID.
 */
export function useMovie(id: number | null) {
  return useQuery({
    queryKey: ['movies', id],
    queryFn: () => fetchMovieById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Fetch list of movie genres from backend.
 */
export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  })
}
