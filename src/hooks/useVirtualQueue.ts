import { useState, useEffect, useRef, useCallback } from 'react'
import { apiClient } from '../api/client'

export interface QueueState {
  inQueue: boolean
  rank: number
  totalWaiting: number
  estimatedWaitSeconds: number
  passToken: string | null
  isLoading: boolean
}

export function useVirtualQueue() {
  const [queueState, setQueueState] = useState<QueueState>({
    inQueue: false,
    rank: 0,
    totalWaiting: 0,
    estimatedWaitSeconds: 0,
    passToken: sessionStorage.getItem('vq_pass_token'),
    isLoading: false,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)

  const clearQueueTimer = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const enterQueue = async (showtimeId: number): Promise<{ passToken: string | null; inQueue: boolean }> => {
    setQueueState((prev) => ({ ...prev, isLoading: true }))
    try {
      const res = await apiClient.post(`/api/v1/queue/join/${showtimeId}`)
      const data = res.data

      if (!data.in_queue && data.pass_token) {
        sessionStorage.setItem('vq_pass_token', data.pass_token)
        setQueueState({
          inQueue: false,
          rank: 0,
          totalWaiting: 0,
          estimatedWaitSeconds: 0,
          passToken: data.pass_token,
          isLoading: false,
        })
        return { passToken: data.pass_token, inQueue: false }
      }

      setQueueState({
        inQueue: true,
        rank: data.rank || 1,
        totalWaiting: data.total_waiting || 1,
        estimatedWaitSeconds: data.estimated_wait_seconds || 10,
        passToken: null,
        isLoading: false,
      })

      // Start SSE stream / Polling fallback
      startListening(showtimeId)
      return { passToken: null, inQueue: true }
    } catch (err) {
      console.error('Failed to join queue', err)
      setQueueState((prev) => ({ ...prev, isLoading: false }))
      return { passToken: null, inQueue: false }
    }
  }

  const startListening = (showtimeId: number) => {
    clearQueueTimer()

    const token = localStorage.getItem('access_token')
    const baseURL = apiClient.defaults.baseURL || ''
    const streamUrl = `${baseURL}/api/v1/queue/stream/${showtimeId}?token=${token || ''}`

    try {
      const es = new EventSource(streamUrl)
      eventSourceRef.current = es

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (!payload.in_queue && payload.pass_token) {
            sessionStorage.setItem('vq_pass_token', payload.pass_token)
            setQueueState({
              inQueue: false,
              rank: 0,
              totalWaiting: 0,
              estimatedWaitSeconds: 0,
              passToken: payload.pass_token,
              isLoading: false,
            })
            clearQueueTimer()
          } else {
            setQueueState((prev) => ({
              ...prev,
              inQueue: true,
              rank: payload.rank || 1,
              totalWaiting: payload.total_waiting || 1,
              estimatedWaitSeconds: payload.estimated_wait_seconds || 10,
            }))
          }
        } catch (e) {
          console.error('Error parsing SSE event data', e)
        }
      }

      es.onerror = () => {
        // Fallback to polling if SSE encounters an error
        es.close()
        startPollingFallback(showtimeId)
      }
    } catch (e) {
      startPollingFallback(showtimeId)
    }
  }

  const startPollingFallback = (showtimeId: number) => {
    if (pollTimerRef.current) return
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await apiClient.get(`/api/v1/queue/status/${showtimeId}`)
        const data = res.data

        if (!data.in_queue && data.pass_token) {
          sessionStorage.setItem('vq_pass_token', data.pass_token)
          setQueueState({
            inQueue: false,
            rank: 0,
            totalWaiting: 0,
            estimatedWaitSeconds: 0,
            passToken: data.pass_token,
            isLoading: false,
          })
          clearQueueTimer()
        } else {
          setQueueState((prev) => ({
            ...prev,
            inQueue: true,
            rank: data.rank || 1,
            totalWaiting: data.total_waiting || 1,
            estimatedWaitSeconds: data.estimated_wait_seconds || 10,
          }))
        }
      } catch (err) {
        console.error('Polling queue status failed', err)
      }
    }, 2500)
  }

  const leaveQueue = async (showtimeId: number) => {
    clearQueueTimer()
    sessionStorage.removeItem('vq_pass_token')
    try {
      await apiClient.post(`/api/v1/queue/leave/${showtimeId}`)
    } catch (err) {
      // Ignore leave errors
    }
    setQueueState({
      inQueue: false,
      rank: 0,
      totalWaiting: 0,
      estimatedWaitSeconds: 0,
      passToken: null,
      isLoading: false,
    })
  }

  useEffect(() => {
    return () => {
      clearQueueTimer()
    }
  }, [clearQueueTimer])

  return {
    ...queueState,
    enterQueue,
    leaveQueue,
  }
}
