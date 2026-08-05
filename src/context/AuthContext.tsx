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
  login: (e: string, p: string) => Promise<void>
  register: (req: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('access_token'))
  })
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  // Check existing login on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      setIsAuthLoading(true)
      fetchMeAPI()
        .then((u) => setUser(u))
        .catch(() => {
          logoutAPI()
          setUser(null)
        })
        .finally(() => {
          setIsAuthLoading(false)
        })
    } else {
      setIsAuthLoading(false)
    }
  }, [])

  async function login(account: string, pass: string) {
    await loginAPI(account, pass)
    const u = await fetchMeAPI()
    setUser(u)
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
