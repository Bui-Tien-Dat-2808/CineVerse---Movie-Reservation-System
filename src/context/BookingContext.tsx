import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { Movie, ShowTime, SeatItem } from '../types'
import type { Concession } from '../api/concessions'

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

export interface SelectedConcessionItem {
  concession: Concession
  quantity: number
  customOptions?: string
  unitPrice?: number
}

export interface SelectedConcessionItemWithKey extends SelectedConcessionItem {
  itemKey: string
}

// ── State shape ───────────────────────────────────────────
interface BookingState {
  selectedMovie: Movie | null
  selectedDate: number
  selectedShowtime: ShowTime | null
  selectedSeats: Set<string>
  selectedConcessions: Map<string, SelectedConcessionItem>
  createdReservation?: any
}

const initialState: BookingState = {
  selectedMovie: null,
  selectedDate: 0,
  selectedShowtime: null,
  selectedSeats: new Set(),
  selectedConcessions: new Map(),
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
        selectedConcessions: new Map(parsed.selectedConcessions || []),
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
  | {
      type: 'SET_CONCESSION'
      payload: {
        concession: Concession
        quantity: number
        customOptions?: string
        unitPrice?: number
        itemKey?: string
      }
    }
  | { type: 'REMOVE_CONCESSION_KEY'; payload: string }
  | { type: 'CLEAR_CONCESSIONS' }
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
    case 'SET_CONCESSION': {
      const next = new Map(state.selectedConcessions)
      const { concession, quantity, customOptions, unitPrice, itemKey } = action.payload
      const key = itemKey || (customOptions ? `${concession.id}::${customOptions}` : String(concession.id))
      if (quantity <= 0) {
        next.delete(key)
      } else {
        const existing = next.get(key)
        const newQty = itemKey ? quantity : (existing ? existing.quantity + quantity : quantity)
        next.set(key, {
          concession,
          quantity: newQty,
          customOptions,
          unitPrice: unitPrice ?? concession.price,
        })
      }
      return { ...state, selectedConcessions: next }
    }
    case 'REMOVE_CONCESSION_KEY': {
      const next = new Map(state.selectedConcessions)
      next.delete(action.payload)
      return { ...state, selectedConcessions: next }
    }
    case 'CLEAR_CONCESSIONS':
      return { ...state, selectedConcessions: new Map() }
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
export interface BookingContextValue {
  state: BookingState
  totalPrice: number
  concessionTotal: number
  concessionsTotal: number
  selectedConcessionsList: SelectedConcessionItemWithKey[]
  calculateTotalPrice: (seatMapSeats?: SeatItem[]) => number
  selectMovie: (movie: Movie) => void
  selectDate: (i: number) => void
  selectShowtime: (st: ShowTime) => void
  toggleSeat: (key: string) => void
  clearSeats: () => void
  setConcession: (
    concession: Concession,
    quantity: number,
    customOptions?: string,
    unitPrice?: number,
    itemKey?: string
  ) => void
  addConcession: (
    concession: Concession,
    quantity?: number,
    customOptions?: string,
    unitPrice?: number
  ) => void
  updateConcessionQuantity: (itemKey: string, quantity: number) => void
  removeConcession: (itemKey: string) => void
  removeConcessionKey: (key: string) => void
  clearConcessions: () => void
  setCreatedReservation: (reservation: any) => void
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
          selectedConcessions: Array.from(state.selectedConcessions.entries()),
          createdReservation: state.createdReservation,
        }),
      )
    } catch (e) {
      console.error('Failed to save booking state to sessionStorage:', e)
    }
  }, [state])

  const calcTotalPrice = (seatMapSeats?: SeatItem[]) =>
    calculateBookingTotalPrice(state.selectedSeats, state.selectedShowtime, seatMapSeats)

  const totalPrice = calcTotalPrice()

  const concessionTotal = useMemo(() => {
    return Array.from(state.selectedConcessions.values()).reduce(
      (sum, { concession, quantity, unitPrice }) => sum + (unitPrice ?? concession.price) * quantity,
      0,
    )
  }, [state.selectedConcessions])

  const selectedConcessionsList = useMemo<SelectedConcessionItemWithKey[]>(() => {
    return Array.from(state.selectedConcessions.entries()).map(([key, item]) => ({
      ...item,
      itemKey: key,
    }))
  }, [state.selectedConcessions])

  const value = useMemo<BookingContextValue>(
    () => ({
      state,
      totalPrice,
      concessionTotal,
      concessionsTotal: concessionTotal,
      selectedConcessionsList,
      calculateTotalPrice: calcTotalPrice,
      selectMovie: (movie) => dispatch({ type: 'SELECT_MOVIE', payload: movie }),
      selectDate: (i) => dispatch({ type: 'SELECT_DATE', payload: i }),
      selectShowtime: (st) => dispatch({ type: 'SELECT_SHOWTIME', payload: st }),
      toggleSeat: (key) => dispatch({ type: 'TOGGLE_SEAT', payload: key }),
      clearSeats: () => dispatch({ type: 'CLEAR_SEATS' }),
      setConcession: (concession, quantity, customOptions, unitPrice, itemKey) =>
        dispatch({
          type: 'SET_CONCESSION',
          payload: { concession, quantity, customOptions, unitPrice, itemKey },
        }),
      addConcession: (concession, quantity = 1, customOptions, unitPrice) =>
        dispatch({
          type: 'SET_CONCESSION',
          payload: { concession, quantity, customOptions, unitPrice },
        }),
      updateConcessionQuantity: (itemKey, quantity) => {
        const item = state.selectedConcessions.get(itemKey)
        if (item) {
          dispatch({
            type: 'SET_CONCESSION',
            payload: {
              concession: item.concession,
              quantity,
              customOptions: item.customOptions,
              unitPrice: item.unitPrice,
              itemKey,
            },
          })
        }
      },
      removeConcession: (itemKey) => dispatch({ type: 'REMOVE_CONCESSION_KEY', payload: itemKey }),
      removeConcessionKey: (key) => dispatch({ type: 'REMOVE_CONCESSION_KEY', payload: key }),
      clearConcessions: () => dispatch({ type: 'CLEAR_CONCESSIONS' }),
      setCreatedReservation: (reservation) =>
        dispatch({ type: 'SET_CREATED_RESERVATION', payload: reservation }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [state, totalPrice, concessionTotal, selectedConcessionsList, calcTotalPrice],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────
export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used inside <BookingProvider>')
  return ctx
}
