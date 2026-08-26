import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AuthUser } from '../types'
import { fetchMeAPI, loginAPI, registerAPI, logoutAPI, type RegisterRequest } from '../api/auth'

export type AuthModeType = 'login' | 'register' | 'forgot' | 'reset'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  isAuthModalOpen: boolean
  authNotice: string | null
  resetToken: string | null
  setResetToken: (token: string | null) => void
  setAuthNotice: (msg: string | null) => void
  openAuthModal: (mode?: AuthModeType, notice?: string, token?: string) => void
  closeAuthModal: () => void
  authMode: AuthModeType
  setAuthMode: (mode: AuthModeType) => void
  login: (account: string, pass: string, captchaId?: string, captchaAnswer?: string) => Promise<void>
  register: (req: RegisterRequest) => Promise<void>
  logout: () => void
  updateUserProfile: (updatedUser: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const cached = localStorage.getItem('cached_user')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(() => {
    const token = localStorage.getItem('access_token')
    const cached = localStorage.getItem('cached_user')
    return Boolean(token && !cached)
  })
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthModeType>('login')
  const [authNotice, setAuthNotice] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)

  // Check URL params for reset_token on mount (FEAT-06)
  useEffect(() => {
    try {
      let token: string | null = null

      // 1. Standard search query
      const params = new URLSearchParams(window.location.search)
      token = params.get('reset_token')

      // 2. Hash query fallback
      if (!token && window.location.hash.includes('reset_token')) {
        const hashQuery = window.location.hash.split('?')[1]
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery)
          token = hashParams.get('reset_token')
        }
      }

      // 3. Fallback regex search on full href
      if (!token) {
        const match = window.location.href.match(/[?&]reset_token=([^&#]+)/)
        if (match && match[1]) {
          token = decodeURIComponent(match[1])
        }
      }

      if (token) {
        setResetToken(token)
        setAuthMode('reset')
        setIsAuthModalOpen(true)
      }
    } catch {
      // Ignore URL parsing failure
    }
  }, [])

  // Check existing login on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchMeAPI()
        .then((u) => {
          setUser(u)
          localStorage.setItem('cached_user', JSON.stringify(u))
        })
        .catch((err: any) => {
          const statusCode = err?.response?.status
          // UX-05: Chỉ xóa credentials khi server xác nhận token không hợp lệ (401/403)
          if (statusCode === 401 || statusCode === 403) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('cached_user')
            setUser(null)
          } else {
            // Lỗi mạng hoặc 500: giữ thông tin từ cached_user để không bị forced logout nhầm
            const cached = localStorage.getItem('cached_user')
            if (cached) {
              try {
                setUser(JSON.parse(cached))
              } catch {
                setUser(null)
              }
            }
          }
        })
        .finally(() => setIsAuthLoading(false))
    } else {
      setIsAuthLoading(false)
    }
  }, [])

  function updateUserProfile(updatedUser: AuthUser) {
    setUser(updatedUser)
    localStorage.setItem('cached_user', JSON.stringify(updatedUser))
  }

  async function login(account: string, pass: string, captchaId?: string, captchaAnswer?: string) {
    await loginAPI(account, pass, captchaId, captchaAnswer)
    const u = await fetchMeAPI()
    setUser(u)
    localStorage.setItem('cached_user', JSON.stringify(u))
    setIsAuthModalOpen(false)
    setAuthNotice(null)
  }

  async function register(req: RegisterRequest) {
    await registerAPI(req)
    // Auto login after register
    await login(req.email, req.password, req.captcha_id, req.captcha_answer)
  }

  async function logout() {
    try {
      await logoutAPI()
    } catch {
      // Vẫn clear local state dù API call có lỗi (network down, token đã hết hạn)
    }
    setUser(null)
    // BUG-13: Xóa tất cả token khỏi localStorage để tránh stale token sau logout
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('cached_user')
  }

  function openAuthModal(mode: AuthModeType = 'login', notice?: string, token?: string) {
    setAuthMode(mode)
    setAuthNotice(notice || null)
    if (token) setResetToken(token)
    setIsAuthModalOpen(true)
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false)
    setAuthNotice(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthLoading,
        isAuthModalOpen,
        authNotice,
        resetToken,
        setResetToken,
        setAuthNotice,
        openAuthModal,
        closeAuthModal,
        authMode,
        setAuthMode,
        login,
        register,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
