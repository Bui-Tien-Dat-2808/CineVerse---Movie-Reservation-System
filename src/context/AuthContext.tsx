import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AuthUser } from '../types'
import { fetchMeAPI, loginAPI, registerAPI, logoutAPI, type RegisterRequest } from '../api/auth'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  isAuthModalOpen: boolean
  openAuthModal: (mode?: 'login' | 'register') => void
  closeAuthModal: () => void
  authMode: 'login' | 'register'
  setAuthMode: (mode: 'login' | 'register') => void
  login: (e: string, p: string, turnstileToken?: string) => Promise<void>
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  // Check existing login on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchMeAPI()
        .then((u) => {
          setUser(u)
          localStorage.setItem('cached_user', JSON.stringify(u))
        })
        .catch(() => {
          logoutAPI()
          setUser(null)
          localStorage.removeItem('cached_user')
        })
        .finally(() => {
          setIsAuthLoading(false)
        })
    } else {
      localStorage.removeItem('cached_user')
      setIsAuthLoading(false)
    }
  }, [])

  function updateUserProfile(updatedUser: AuthUser) {
    setUser(updatedUser)
    localStorage.setItem('cached_user', JSON.stringify(updatedUser))
  }

  async function login(account: string, pass: string, turnstileToken?: string) {
    await loginAPI(account, pass, turnstileToken)
    const u = await fetchMeAPI()
    setUser(u)
    localStorage.setItem('cached_user', JSON.stringify(u))
    setIsAuthModalOpen(false)
  }

  async function register(req: RegisterRequest) {
    await registerAPI(req)
    // Auto login after register
    await login(req.email, req.password)
  }

  async function logout() {
    await logoutAPI()
    setUser(null)
    localStorage.removeItem('cached_user')
  }

  function openAuthModal(mode: 'login' | 'register' = 'login') {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthLoading,
        isAuthModalOpen,
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
