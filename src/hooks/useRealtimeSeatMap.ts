import { useEffect, useRef } from 'react'

export interface RealtimeSeatEvent {
  event: 'SEATS_HELD' | 'SEATS_BOOKED' | 'SEATS_RELEASED'
  showtime_id: number
  seat_ids?: number[]
  held_by_user_id?: number
  held_until?: string
}

export function useRealtimeSeatMap(
  showtimeId: number | null | undefined,
  onSeatEvent: (event: RealtimeSeatEvent) => void
) {
  const wsRef = useRef<WebSocket | null>(null)
  const callbackRef = useRef(onSeatEvent)

  useEffect(() => {
    callbackRef.current = onSeatEvent
  }, [onSeatEvent])

  useEffect(() => {
    if (!showtimeId) return

    const apiBaseUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}`
    const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws')
    const wsUrl = `${wsBaseUrl}/api/v1/showtimes/ws/${showtimeId}`

    let isComponentMounted = true
    let reconnectTimeout: any = null

    function connect() {
      if (!isComponentMounted) return
      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log(`⚡ [RealtimeSeatMap] Connected to WebSocket for showtime #${showtimeId}`)
        }

        ws.onmessage = (messageEvent) => {
          try {
            const data: RealtimeSeatEvent = JSON.parse(messageEvent.data)
            if (data && data.event) {
              callbackRef.current(data)
            }
          } catch (err) {
            console.error('[RealtimeSeatMap] Failed to parse WebSocket message:', err)
          }
        }

        ws.onerror = (err) => {
          console.warn('[RealtimeSeatMap] WebSocket error:', err)
        }

        ws.onclose = () => {
          console.log(`⚡ [RealtimeSeatMap] Connection closed for showtime #${showtimeId}`)
          if (isComponentMounted) {
            reconnectTimeout = setTimeout(connect, 3000)
          }
        }
      } catch (err) {
        console.error('[RealtimeSeatMap] Could not initialize WebSocket:', err)
      }
    }

    connect()

    return () => {
      isComponentMounted = false
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [showtimeId])
}
