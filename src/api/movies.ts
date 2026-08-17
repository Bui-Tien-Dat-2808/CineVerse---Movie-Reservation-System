import { apiClient } from './client'
import type { Movie, CastMember } from '../types'

// ── Response shape từ backend (/api/v1/movies/now-showing) ──
export interface MovieListItem {
  id: number
  title: string
  description: string | null
  poster_url: string | null
  duration_minutes: number | null
  release_date: string | null   // "YYYY-MM-DD"
  language?: string | null
  rating: string | null
  director?: string | null
  status: string
  trailer_url?: string | null
  cast?: CastMember[] | null
  genres: { id: number; name: string; description: string | null; created_at: string }[]
  created_at: string
}

// Backend trả về dạng paginated: { items: [...], meta: {...} }
interface PaginatedResponse<T> {
  items: T[]
  meta: {
    page: number
    page_size: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

// ── Detail response (/api/v1/movies/{id}) ──
export interface MovieDetailAPIResponse extends MovieListItem {
  tmdb_id: number | null
  is_active: boolean
  updated_at: string
}

// ── Genre API response ──
export interface GenreItem {
  id: number
  name: string
  description: string | null
}

/** Transform backend schema → Frontend Movie type */
export function mapMovieItem(m: MovieListItem): Movie {
  return {
    id: m.id,
    title: m.title,
    genre: m.genres ? m.genres.map((g) => g.name.replace(/^Phim\s+/i, '')) : [],
    duration: m.duration_minutes
      ? `${Math.floor(m.duration_minutes / 60)}h ${m.duration_minutes % 60}m`
      : '1h 45m',
    rating: m.rating && m.rating !== 'N/A' ? m.rating : '',
    score: '8.5',
    year: m.release_date ? new Date(m.release_date).getFullYear() : 2026,
    director: m.director ?? '',
    synopsis: m.description || 'Nội dung bộ phim đang được cập nhật. Vui lòng theo dõi thêm thông tin chi tiết.',
    img: m.poster_url
      ?? `https://placehold.co/480x680/111118/f0ede8?text=${encodeURIComponent(m.title)}`,
    trailerUrl: m.trailer_url || undefined,
    cast: m.cast || undefined,
    status: m.status,
  }
}

/** GET /api/v1/movies/now-showing — returns { items, meta } */
export async function fetchNowShowingMovies(): Promise<Movie[]> {
  const { data } = await apiClient.get<PaginatedResponse<MovieListItem>>(
    '/api/v1/movies/now-showing',
  )
  return data.items.map(mapMovieItem)
}

/** GET /api/v1/movies/{id} */
export async function fetchMovieById(id: number): Promise<Movie> {
  const { data } = await apiClient.get<MovieDetailAPIResponse>(`/api/v1/movies/${id}`)
  return mapMovieItem(data)
}

/** GET /api/v1/genres/ */
export async function fetchGenres(): Promise<GenreItem[]> {
  const { data } = await apiClient.get<GenreItem[]>('/api/v1/genres/')
  return data
}
