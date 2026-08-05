import axios from 'axios'

const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim() ?? ''

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function resolveApiBaseUrl(): string {
  if (!rawApiBaseUrl) return ''

  // When the app is opened from a remote host, a localhost API URL would
  // point to the viewer's machine instead of the app server. Fall back to
  // same-origin requests so Vite can proxy them server-side.
  if (typeof window !== 'undefined') {
    try {
      const configuredUrl = new URL(rawApiBaseUrl, window.location.origin)
      if (!isLoopbackHost(window.location.hostname) && isLoopbackHost(configuredUrl.hostname)) {
        return ''
      }
    } catch {
      // Keep the configured value if it is already a relative URL or otherwise
      // valid for the current runtime.
    }
  }

  return rawApiBaseUrl.replace(/\/+$/, '')
}

export const API_BASE_URL = resolveApiBaseUrl()

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Automatically attach JWT access_token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Automatic token refresh interceptor on 401
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config

    if (err.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        return Promise.reject(err)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(buildApiUrl('/api/v1/auth/refresh'), {
          refresh_token: refreshToken,
        })

        const newAccessToken = data.access_token
        localStorage.setItem('access_token', newAccessToken)

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        processQueue(null, newAccessToken)
        return apiClient(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  },
)
