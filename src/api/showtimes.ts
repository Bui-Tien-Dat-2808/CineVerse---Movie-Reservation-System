import { apiClient } from './client'
import type { ShowTime, ShowtimeSeatMap, SeatItem } from '../types'

// ── Backend Showtime API Response ────────────────────────
export interface ShowtimeAPIResponse {
  id: number
  movie_id: number
  room_id: number
  start_time: string     // ISO string "2026-07-31T10:30:00Z"
  end_time: string
  base_price: string | number
  vip_price?: string | number
  status: string
  available_seats?: number
  total_seats?: number
  room?: {
    id: number
    name: string
    room_type: string    // "imax", "3d", "standard", "vip"
  }
}

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

/** Convert backend room_type ("imax", "3d", "standard", "vip") -> Frontend label */
function mapRoomType(rt?: string): ShowTime['type'] {
  if (!rt) return 'Standard'
  const lower = rt.toLowerCase()
  if (lower.includes('imax')) return 'IMAX'
  if (lower.includes('4dx')) return '4DX'
  if (lower.includes('vip')) return 'VIP'
  if (lower.includes('3d')) return '3D'
  return 'Standard'
}

/** Convert backend ShowtimeAPIResponse -> Frontend ShowTime */
export function mapShowtimeResponse(st: ShowtimeAPIResponse): ShowTime {
  const dt = new Date(st.start_time)
  const hours = dt.getHours().toString().padStart(2, '0')
  const mins = dt.getMinutes().toString().padStart(2, '0')

  const basePrice = typeof st.base_price === 'string' ? parseFloat(st.base_price) : st.base_price
  const vipPrice = st.vip_price
    ? typeof st.vip_price === 'string' ? parseFloat(st.vip_price) : st.vip_price
    : undefined

  return {
    id: st.id,
    time: `${hours}:${mins}`,
    hall: st.room?.name ?? `Hall ${st.room_id}`,
    type: mapRoomType(st.room?.room_type),
    price: basePrice,
    vipPrice,
    date: st.start_time.split('T')[0],
    availableSeats: st.available_seats,
    totalSeats: st.total_seats,
  }
}

/** GET /api/v1/showtimes/?movie_id=X */
export async function fetchShowtimesByMovie(movieId: number, dateStr?: string): Promise<ShowTime[]> {
  let url = `/api/v1/showtimes/?movie_id=${movieId}&page_size=5000&upcoming_only=true`
  if (dateStr) {
    url += `&date=${dateStr}`
  }
  const { data } = await apiClient.get<PaginatedResponse<ShowtimeAPIResponse>>(url)
  return data.items.map(mapShowtimeResponse)
}

/** GET /api/v1/showtimes/{id}/seats */
export async function fetchSeatMap(
  showtimeId: number,
  basePrice?: number,
  vipPrice?: number,
): Promise<ShowtimeSeatMap> {
  const { data } = await apiClient.get<any>(`/api/v1/showtimes/${showtimeId}/seats`)

  // Transform seats list
  const seats: SeatItem[] = (data.seats ?? []).map((ss: any) => {
    const isCouple = ss.seat?.seat_type === 'couple'
    const isVip = ss.seat?.seat_type === 'vip'
    const defaultBase = basePrice ?? 90000
    const defaultVip = vipPrice ?? (basePrice ? basePrice * 1.3 : 120000)
    const defaultCouple = basePrice ? basePrice * 1.8 : 180000
    const price = isCouple ? defaultCouple : isVip ? defaultVip : defaultBase

    return {
      id: ss.id,                  // showtime_seat_id
      seat_id: ss.seat_id,
      row_label: ss.seat?.row_label ?? 'A',
      col_number: ss.seat?.col_number ?? 1,
      seat_type: ss.seat?.seat_type ?? 'standard',
      width: ss.seat?.width ?? (isCouple ? 2 : 1),
      status: ss.status ?? 'available',
      price,
    }
  })

  return {
    showtime_id: data.showtime_id,
    total_seats: data.total_seats,
    available_seats: data.available_seats,
    reserved_seats: data.reserved_seats,
    seats,
  }
}

/** POST /api/v1/showtimes/{id}/hold */
export async function holdSeatsAPI(showtimeId: number, seatIds: number[]): Promise<{ held_until: string }> {
  const { data } = await apiClient.post(`/api/v1/showtimes/${showtimeId}/hold`, {
    seat_ids: seatIds,
  })
  return data
}

/** POST /api/v1/reservations/ */
export async function createReservationAPI(
  showtimeId: number,
  seatIds: number[],
  voucherCode?: string,
  concessionOrders?: Array<{ concession_id: number; quantity: number }>,
): Promise<any> {
  const { data } = await apiClient.post('/api/v1/reservations/', {
    showtime_id: showtimeId,
    seat_ids: seatIds,
    voucher_code: voucherCode || undefined,
    concession_orders: concessionOrders?.length ? concessionOrders : undefined,
  })
  return data
}

export interface ReservationSeatItem {
  id: number
  showtime_seat_id: number
  price: string | number
  seat_label?: string
  seat_type?: string
  row_label?: string
  col_number?: number
}

export interface ReservationItem {
  id: number
  showtime_id: number
  user_id: number
  total_price: string | number
  status: 'confirmed' | 'cancelled' | string
  notes?: string
  reservation_seats: ReservationSeatItem[]
  showtime?: {
    id: number
    movie_title?: string
    movie_poster_url?: string
    room_name?: string
    start_time?: string
    end_time?: string
  }
  created_at: string
}

/** GET /api/v1/reservations/ */
export async function fetchMyReservationsAPI(): Promise<ReservationItem[]> {
  const { data } = await apiClient.get<PaginatedResponse<ReservationItem>>('/api/v1/reservations/')
  return data.items
}

/** DELETE /api/v1/reservations/{id} */
export async function cancelReservationAPI(reservationId: number): Promise<any> {
  const { data } = await apiClient.delete(`/api/v1/reservations/${reservationId}`)
  return data
}

/** POST /api/v1/reservations/{id}/exchange */
export async function exchangeReservationAPI(
  reservationId: number,
  newShowtimeId: number,
  newSeatIds: number[]
): Promise<any> {
  const { data } = await apiClient.post(`/api/v1/reservations/${reservationId}/exchange`, {
    new_showtime_id: newShowtimeId,
    new_seat_ids: newSeatIds,
  })
  return data
}
