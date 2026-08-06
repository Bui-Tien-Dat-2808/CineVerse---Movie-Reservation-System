import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Movie, ShowTime, SeatItem } from '../types'

// ── Helper: Calculate total price considering seat types (Standard vs VIP) ──
export function calculateBookingTotalPrice(
  selectedSeats: Set<string>,
  showtime: ShowTime | null,
  seatMapSeats?: SeatItem[],
): number {
  if (!showtime || selectedSeats.size === 0) return 0
  let total = 0
  const map = new Map<string, SeatItem>()
  if (seatMapSeats) {
    seatMapSeats.forEach((s) => map.set(`${s.row_label}${s.col_number}`, s))
  }

  selectedSeats.forEach((key) => {
    const item = map.get(key)
    if (item && item.price) {
      total += item.price
    } else {
      const row = key.charAt(0)
      const isVip = row === 'A' || row === 'B'
      const price = isVip
        ? (showtime.vipPrice ?? (showtime.price ? showtime.price * 1.3 : 120000))
        : showtime.price
      total += price
    }
  })

  return total
}

// ── State shape ───────────────────────────────────────────
interface BookingState {
  selectedMovie: Movie | null
  selectedDate: number
  selectedShowtime: ShowTime | null
  selectedSeats: Set<string>
  createdReservation?: any
}

const initialState: BookingState = {
  selectedMovie: null,
  selectedDate: 0,
  selectedShowtime: null,
  selectedSeats: new Set(),
  createdReservation: null,
}

function getInitialBookingState(): BookingState {
  try {
    const saved = sessionStorage.getItem('cineverse_booking_state')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        selectedMovie: parsed.selectedMovie || null,
        selectedDate: parsed.selectedDate || 0,
        selectedShowtime: parsed.selectedShowtime || null,
        selectedSeats: new Set(parsed.selectedSeats || []),
        createdReservation: parsed.createdReservation || null,
      }
    }
  } catch (e) {
    console.error('Failed to restore booking state from sessionStorage:', e)
  }
  return initialState
}

// ── Actions ───────────────────────────────────────────────
type BookingAction =
  | { type: 'SELECT_MOVIE'; payload: Movie }
  | { type: 'SELECT_DATE'; payload: number }
  | { type: 'SELECT_SHOWTIME'; payload: ShowTime }
  | { type: 'TOGGLE_SEAT'; payload: string }
  | { type: 'CLEAR_SEATS' }
  | { type: 'SET_CREATED_RESERVATION'; payload: any }
  | { type: 'RESET' }

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SELECT_MOVIE':
      if (state.selectedMovie?.id === action.payload.id) {
        return { ...state, selectedMovie: action.payload }
      }
      return {
        ...state,
        selectedMovie: action.payload,
        selectedShowtime: null,
        selectedDate: 0,
        selectedSeats: new Set(),
      }
    case 'SELECT_DATE':
      if (state.selectedDate === action.payload) return state
      return {
        ...state,
        selectedDate: action.payload,
        selectedShowtime: null,
        selectedSeats: new Set(),
      }
    case 'SELECT_SHOWTIME':
      return {
        ...state,
        selectedShowtime: action.payload,
        selectedSeats: new Set(),
      }
    case 'TOGGLE_SEAT': {
      const next = new Set(state.selectedSeats)
      if (next.has(action.payload)) next.delete(action.payload)
      else next.add(action.payload)
      return { ...state, selectedSeats: next }
    }
    case 'CLEAR_SEATS':
      return { ...state, selectedSeats: new Set() }
    case 'SET_CREATED_RESERVATION':
      return { ...state, createdReservation: action.payload }
    case 'RESET':
      try {
        sessionStorage.removeItem('cineverse_booking_state')
      } catch (e) {}
      return initialState
    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────
interface BookingContextValue {
  state: BookingState
  totalPrice: number
  calculateTotalPrice: (seatMapSeats?: SeatItem[]) => number
  selectMovie: (movie: Movie) => void
  selectDate: (i: number) => void
  selectShowtime: (st: ShowTime) => void
  toggleSeat: (key: string) => void
  clearSeats: () => void
  reset: () => void
}

const BookingContext = createContext<BookingContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────
export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState, getInitialBookingState)

  useEffect(() => {
    try {
      sessionStorage.setItem(
        'cineverse_booking_state',
        JSON.stringify({
          selectedMovie: state.selectedMovie,
          selectedDate: state.selectedDate,
          selectedShowtime: state.selectedShowtime,
          selectedSeats: Array.from(state.selectedSeats),
        }),
      )
    } catch (e) {
      console.error('Failed to save booking state to sessionStorage:', e)
    }
  }, [state])

  const calcTotalPrice = (seatMapSeats?: SeatItem[]) =>
    calculateBookingTotalPrice(state.selectedSeats, state.selectedShowtime, seatMapSeats)

  const totalPrice = calcTotalPrice()

  const value: BookingContextValue = {
    state,
    totalPrice,
    calculateTotalPrice: calcTotalPrice,
    selectMovie: (movie) => dispatch({ type: 'SELECT_MOVIE', payload: movie }),
    selectDate: (i) => dispatch({ type: 'SELECT_DATE', payload: i }),
    selectShowtime: (st) => dispatch({ type: 'SELECT_SHOWTIME', payload: st }),
    toggleSeat: (key) => dispatch({ type: 'TOGGLE_SEAT', payload: key }),
    clearSeats: () => dispatch({ type: 'CLEAR_SEATS' }),
    reset: () => dispatch({ type: 'RESET' }),
  }

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────
export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used inside <BookingProvider>')
  return ctx
}
