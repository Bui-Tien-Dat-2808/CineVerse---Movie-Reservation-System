export type View = 'home' | 'detail' | 'seats' | 'checkout' | 'confirmed'

export interface CastMember {
  name: string
  character?: string
  profile_url?: string
}

export interface Movie {
  id: number
  title: string
  genre: string[]
  duration: string
  rating: string
  score: string
  year: number
  director: string
  synopsis: string
  img: string
  trailerUrl?: string
  cast?: CastMember[]
  status?: string
  avg_rating?: number | null
  total_reviews?: number
}

export interface ShowTime {
  id?: number
  time: string
  hall: string
  type: 'Standard' | 'IMAX' | '4DX' | 'VIP' | '3D' | string
  price: number
  vipPrice?: number
  date?: string
  availableSeats?: number
  totalSeats?: number
}

export type SeatStatus = 'available' | 'vip' | 'selected' | 'taken'

export interface SeatItem {
  id: number               // showtime_seat_id
  seat_id: number          // database seat_id
  row_label: string        // "A", "B", etc.
  col_number: number       // 1, 2, etc.
  seat_type: 'standard' | 'vip' | 'couple' | 'kids' | string
  status: 'available' | 'held' | 'booked' | string
  price: number
}

export interface ShowtimeSeatMap {
  showtime_id: number
  total_seats: number
  available_seats: number
  reserved_seats: number
  seats: SeatItem[]
}

export interface AuthUser {
  id: number
  email: string
  full_name?: string
  phone_number?: string
  date_of_birth?: string
  gender?: string
  region?: string
  role: 'admin' | 'user' | string
  is_active: boolean
  loyalty_points?: number
  loyalty_tier?: string
  must_change_password?: boolean
}

export interface AppState {
  view: View
  selectedMovie: Movie | null
  selectedDate: number
  selectedShowtime: ShowTime | null
  selectedSeats: Set<string>
  searchQuery: string
  activeGenre: string
}
