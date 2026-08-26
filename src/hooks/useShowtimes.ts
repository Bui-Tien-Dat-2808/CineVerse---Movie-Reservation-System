import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchShowtimesByMovie, fetchSeatMap, holdSeatsAPI, createReservationAPI } from '../api/showtimes'
import type { ShowTime } from '../types'

/**
 * Fetch showtimes for a movie from backend.
 */
export function useShowtimes(movieId: number | null) {
  return useQuery({
    queryKey: ['showtimes', movieId],
    queryFn: async () => {
      if (!movieId) return []
      return await fetchShowtimesByMovie(movieId)
    },
    enabled: !!movieId,
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch real-time seat map from backend for a showtime.
 */
export function useSeatMap(showtimeOrId: number | ShowTime | null) {
  const showtimeId = typeof showtimeOrId === 'number' ? showtimeOrId : showtimeOrId?.id ?? null
  const basePrice = typeof showtimeOrId === 'number' ? undefined : showtimeOrId?.price
  const vipPrice = typeof showtimeOrId === 'number' ? undefined : showtimeOrId?.vipPrice

  return useQuery({
    queryKey: ['seatMap', showtimeId],
    queryFn: () => fetchSeatMap(showtimeId!, basePrice, vipPrice),
    enabled: !!showtimeId,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  })
}

/**
 * Hook to hold seats (10 minutes TTL)
 */
export function useHoldSeats() {
  return useMutation({
    mutationFn: ({ showtimeId, seatIds }: { showtimeId: number; seatIds: number[] }) =>
      holdSeatsAPI(showtimeId, seatIds),
  })
}

/**
 * Hook to confirm reservation
 */
export function useCreateReservation() {
  return useMutation({
    mutationFn: ({
      showtimeId,
      seatIds,
      voucherCode,
      concessionOrders,
    }: {
      showtimeId: number
      seatIds: number[]
      voucherCode?: string
      concessionOrders?: Array<{ concession_id: number; quantity: number; custom_options?: string; unit_price?: number }>
    }) => createReservationAPI(showtimeId, seatIds, voucherCode, concessionOrders),
  })
}
