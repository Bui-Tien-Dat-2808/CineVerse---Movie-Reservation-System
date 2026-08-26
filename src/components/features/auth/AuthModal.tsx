import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useBooking } from '../../../context/BookingContext'
import { useTheme } from '../../../context/ThemeContext'
import { forgotPasswordAPI, resetPasswordAPI } from '../../../api/auth'
import ImageCaptcha from './ImageCaptcha'
import PolicyModal from './PolicyModal'

export default function AuthModal() {
  const navigate = useNavigate()
  const { isAuthModalOpen, closeAuthModal, authMode, setAuthMode, login, register, authNotice, resetToken, setResetToken } = useAuth()
  const { reset } = useBooking()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  // Login Form States
  const [account, setAccount] = useState('') // Email or Phone number
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginCaptchaId, setLoginCaptchaId] = useState('')
  const [loginCaptchaAnswer, setLoginCaptchaAnswer] = useState('')
  const [loginCaptchaRefreshKey, setLoginCaptchaRefreshKey] = useState(0)

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')

  // Reset Password States
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')

  // Register Form States
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('Nam')
  const [region, setRegion] = useState('TP. Hồ Chí Minh')
  const [regPassword, setRegPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [regCaptchaId, setRegCaptchaId] = useState('')
  const [regCaptchaAnswer, setRegCaptchaAnswer] = useState('')
  const [regCaptchaRefreshKey, setRegCaptchaRefreshKey] = useState(0)
  const [agreeTerms, setAgreeTerms] = useState(false)

  // Policy Modal States
  const [policyOpen, setPolicyOpen] = useState(false)
  const [policyTab, setPolicyTab] = useState<'terms' | 'privacy'>('terms')

  // Status & Error States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset all input fields whenever modal opens or switches mode to ensure clean state
  useEffect(() => {
    if (isAuthModalOpen) {
      setAccount('')
      setLoginPassword('')
      setLoginCaptchaAnswer('')
      setError('')
      setForgotEmail('')
      setForgotSuccess('')
      setResetNewPassword('')
      setResetConfirmPassword('')
      setResetSuccess('')
      setLoginCaptchaRefreshKey((prev) => prev + 1)
      setRegCaptchaRefreshKey((prev) => prev + 1)
    }
  }, [isAuthModalOpen, authMode])

  // Support pressing Escape to close modal easily
  useEffect(() => {
    if (!isAuthModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAuthModalOpen, closeAuthModal])

  if (!isAuthModalOpen) return null

  function openPolicy(tab: 'terms' | 'privacy') {
    setPolicyTab(tab)
    setPolicyOpen(true)
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!loginCaptchaAnswer.trim()) {
      setError('Vui lòng nhập mã xác thực CAPTCHA.')
      return
    }

    setLoading(true)
    try {
      await login(account, loginPassword, loginCaptchaId, loginCaptchaAnswer)
      closeAuthModal()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setLoginCaptchaAnswer('')
      setLoginCaptchaRefreshKey((prev) => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!agreeTerms) {
      setError('Vui lòng đồng ý với Điều khoản dịch vụ & Chính sách bảo mật để tiếp tục.')
      return
    }

    if (regPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    if (!regCaptchaAnswer.trim()) {
      setError('Vui lòng nhập mã xác thực CAPTCHA.')
      return
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!fullName) {
      setError('Vui lòng nhập họ và tên.')
      return
    }

    setLoading(true)
    try {
      await register({
        email: regEmail,
        password: regPassword,
        full_name: fullName,
        phone_number: regPhone || undefined,
        date_of_birth: dob || undefined,
        gender: gender,
        region: region,
        captcha_id: regCaptchaId,
        captcha_answer: regCaptchaAnswer,
      })
      // Chuyển ngay về trang chủ sau khi đăng ký thành công
      reset()
      navigate('/')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      closeAuthModal()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Đăng ký thất bại. Vui lòng thử lại.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setRegCaptchaAnswer('')
      setRegCaptchaRefreshKey((prev) => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setForgotSuccess('')
    if (!forgotEmail.trim()) {
      setError('Vui lòng nhập địa chỉ email.')
      return
    }
    setLoading(true)
    try {
      const res = await forgotPasswordAPI(forgotEmail.trim())
      setForgotSuccess(res.message || 'Đã gửi liên kết khôi phục mật khẩu. Vui lòng kiểm tra email của bạn.')
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Gửi yêu cầu thất bại. Vui lòng thử lại.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResetSuccess('')
    if (!resetToken) {
      setError('Mã xác thực đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu lại.')
      return
    }
    if (resetNewPassword.length < 8) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự.')
      return
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setLoading(true)
    try {
      const res = await resetPasswordAPI(resetToken, resetNewPassword)
      setResetSuccess(res.message || 'Mật khẩu đã được đặt lại thành công!')
      setTimeout(() => {
        setAuthMode('login')
        setResetSuccess('')
      }, 2500)
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white'
    : 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-[#e8b84b]'

  const labelStyle = isLight ? 'text-slate-700 font-semibold' : 'text-[#a09e9a] font-medium'
  const iconStyle = isLight ? 'text-slate-400' : 'text-[#6e6c68]'

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) closeAuthModal()
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      >
        <div
          className={`border rounded-2xl p-5 sm:p-7 w-full relative shadow-2xl my-4 transition-all duration-200 ${
            authMode === 'register' ? 'max-w-xl' : 'max-w-md'
          } ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#111118] border-white/10 text-[#f0ede8]'
          }`}
        >
          {/* Prominent Close button */}
          <button
            type="button"
            onClick={closeAuthModal}
            title="Đóng cửa sổ (Esc)"
            className={`absolute top-4 right-4 border rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md group z-20 ${
              isLight
                ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200 hover:border-rose-300'
                : 'bg-[#1a1a26] hover:bg-rose-500/20 text-[#a09e9a] hover:text-rose-400 border-white/15 hover:border-rose-500/40'
            }`}
          >
            <span>Đóng</span>
            <span className="text-sm font-black group-hover:scale-110 transition-transform">✕</span>
          </button>

          {/* CineVerse Logo Header */}
          <div className="flex justify-center items-center gap-2.5 mb-4 select-none">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill={isLight ? "#d97706" : "#e8b84b"} />
              <path
                d="M7 20 L14 8 L21 20"
                stroke={isLight ? "#ffffff" : "#09090e"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <line x1="9.5" y1="16" x2="18.5" y2="16" stroke={isLight ? "#ffffff" : "#09090e"} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="font-display font-black text-2xl tracking-tight flex items-center">
              <span className={isLight ? 'text-slate-900' : 'text-[#f0ede8]'}>Cine</span>
              <span className={isLight ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-transparent bg-clip-text font-black' : 'bg-gradient-to-r from-[#f5d061] via-[#e8b84b] to-[#c9972a] text-transparent bg-clip-text font-black'}>
                Verse
              </span>
            </span>
          </div>

          {/* Prominent Auth Requirement Notice (e.g. when buying tickets) */}
          {authNotice && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-2.5 shadow-md animate-fade-in">
              <span className="text-base">🔒</span>
              <span className="leading-snug">{authNotice}</span>
            </div>
          )}

          {/* Toggle Tab Bar (Only show in login/register modes) */}
          {(authMode === 'login' || authMode === 'register') && (
            <div
              className={`grid grid-cols-2 p-1 rounded-xl border mb-4 ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#181824] border-white/10'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setAuthMode('login')
                }}
                className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-[#e8b84b] text-[#09090e] shadow-md font-extrabold'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-[#a09e9a] hover:text-[#f0ede8]'
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setAuthMode('register')
                }}
                className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-[#e8b84b] text-[#09090e] shadow-md font-extrabold'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-[#a09e9a] hover:text-[#f0ede8]'
                }`}
              >
                Đăng ký
              </button>
            </div>
          )}

          {/* Success Banner */}
          {forgotSuccess && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3.5 mb-5 text-xs text-emerald-400 flex items-start gap-2.5">
              <span className="text-base">✓</span>
              <span>{forgotSuccess}</span>
            </div>
          )}
          {resetSuccess && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3.5 mb-5 text-xs text-emerald-400 flex items-start gap-2.5">
              <span className="text-base">✓</span>
              <span>{resetSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-[rgba(192,57,43,0.15)] border border-[rgba(192,57,43,0.3)] rounded-lg p-3 mb-5 text-xs text-[#e07060] flex items-center gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              MODE 1: FORGOT PASSWORD FORM
              ───────────────────────────────────────────────────────────── */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4" autoComplete="off">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center text-2xl bg-[#e8b84b]/15 border border-[#e8b84b]/30 text-[#e8b84b]">
                  🔑
                </div>
                <h3 className="text-lg font-bold mb-1">Khôi phục mật khẩu</h3>
                <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#a09e9a]'}`}>
                  Nhập địa chỉ email tài khoản đã đăng ký của bạn để nhận liên kết đặt lại mật khẩu an toàn.
                </p>
              </div>

              <div>
                <label className={`block text-xs mb-1.5 ${labelStyle}`}>Địa chỉ Email tài khoản</label>
                <div className="relative">
                  <span className={`absolute left-3 top-2.5 text-sm ${iconStyle}`}>✉</span>
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    name="forgot_email_input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm outline-none font-mono-data transition-colors ${inputStyle}`}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#e8b84b] hover:bg-[#d4a338] text-[#09090e] border-0 rounded-xl py-3 font-bold text-sm cursor-pointer hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Đang gửi email...' : 'Gửi liên kết khôi phục'}</span>
                  <span>→</span>
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      setForgotSuccess('')
                      setAuthMode('login')
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-[#181824] hover:bg-[#222234] text-[#f0ede8] border-white/10'
                    }`}
                  >
                    <span>←</span>
                    <span>Đăng nhập</span>
                  </button>

                  <button
                    type="button"
                    onClick={closeAuthModal}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200'
                        : 'bg-[#181824] hover:bg-rose-500/15 text-[#a09e9a] hover:text-rose-400 border-white/10'
                    }`}
                  >
                    <span>✕</span>
                    <span>Hủy & Thoát</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              MODE 2: RESET PASSWORD FORM
              ───────────────────────────────────────────────────────────── */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4" autoComplete="off">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center text-2xl bg-[#e8b84b]/15 border border-[#e8b84b]/30 text-[#e8b84b]">
                  🔐
                </div>
                <h3 className="text-lg font-bold mb-1">Đặt lại mật khẩu mới</h3>
                <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#a09e9a]'}`}>
                  Tạo mật khẩu mới có tối thiểu 8 ký tự để bảo vệ tài khoản của bạn.
                </p>
              </div>

              <div>
                <label className={`block text-xs mb-1.5 ${labelStyle}`}>Mật khẩu mới</label>
                <div className="relative">
                  <span className={`absolute left-3 top-2.5 text-sm ${iconStyle}`}>🔒</span>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    name="reset_new_pwd"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm outline-none transition-colors ${inputStyle}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className={`absolute right-3 top-2.5 bg-transparent border-0 cursor-pointer text-xs ${iconStyle}`}
                  >
                    {showResetPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs mb-1.5 ${labelStyle}`}>Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <span className={`absolute left-3 top-2.5 text-sm ${iconStyle}`}>🔒</span>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    name="reset_confirm_pwd"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm outline-none transition-colors ${inputStyle}`}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#e8b84b] hover:bg-[#d4a338] text-[#09090e] border-0 rounded-xl py-3 font-bold text-sm cursor-pointer hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu →'}
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      setResetSuccess('')
                      setAuthMode('login')
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-[#181824] hover:bg-[#222234] text-[#f0ede8] border-white/10'
                    }`}
                  >
                    <span>←</span>
                    <span>Đăng nhập</span>
                  </button>

                  <button
                    type="button"
                    onClick={closeAuthModal}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200'
                        : 'bg-[#181824] hover:bg-rose-500/15 text-[#a09e9a] hover:text-rose-400 border-white/10'
                    }`}
                  >
                    <span>✕</span>
                    <span>Hủy & Thoát</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              MODE 3: LOGIN FORM
              ───────────────────────────────────────────────────────────── */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
              {/* Email / Phone input */}
              <div>
                <label className={`block text-xs mb-1 ${labelStyle}`}>
                  Email hoặc số điện thoại
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-2.5 text-sm ${iconStyle}`}>✉</span>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    name="login_account_id"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder="Email hoặc số điện thoại"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm outline-none font-mono-data transition-colors ${inputStyle}`}
                  />
                </div>
              </div>

              {/* Password input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={`block text-xs ${labelStyle}`}>Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      setForgotSuccess('')
                      setForgotEmail(account.includes('@') ? account : '')
                      setAuthMode('forgot')
                    }}
                    className="text-[11px] text-[#e8b84b] hover:underline bg-transparent border-0 cursor-pointer font-bold"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <span className={`absolute left-3 top-2.5 text-sm ${iconStyle}`}>🔒</span>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    name="login_secure_credential"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm outline-none transition-colors ${inputStyle}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className={`absolute right-3 top-2.5 bg-transparent border-0 cursor-pointer text-xs ${iconStyle}`}
                  >
                    {showLoginPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {/* Image CAPTCHA — Inline layout */}
              <div>
                <label className={`block text-xs mb-1.5 ${labelStyle}`}>
                  CAPTCHA xác thực (5 ký tự)
                </label>
                <div className="flex items-center gap-2 w-full">
                  <ImageCaptcha
                    onChallengeReady={(id) => setLoginCaptchaId(id)}
                    refreshKey={loginCaptchaRefreshKey}
                  />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoComplete="off"
                    name="login_captcha_input"
                    value={loginCaptchaAnswer}
                    onChange={(e) => setLoginCaptchaAnswer(e.target.value.toUpperCase())}
                    placeholder="Nhập mã..."
                    className={`flex-1 min-w-0 h-[40px] px-2.5 border rounded-xl text-xs font-mono font-bold tracking-widest text-center uppercase outline-none transition-colors ${inputStyle}`}
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e8b84b] hover:bg-[#d4a338] text-[#09090e] border-0 rounded-xl py-3 font-bold text-sm cursor-pointer hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập →'}
              </button>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className={`flex-grow border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}></div>
                <span className={`flex-shrink mx-4 text-[10px] tracking-widest uppercase font-mono-data ${isLight ? 'text-slate-400' : 'text-[#6e6c68]'}`}>
                  HOẶC
                </span>
                <div className={`flex-grow border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}></div>
              </div>

              {/* Social Login buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => alert('Tính năng đăng nhập Google đang được phát triển.')}
                  className={`flex items-center justify-center gap-2 border rounded-xl py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                      : 'bg-[#181824] hover:bg-[#202030] text-[#f0ede8] border-white/10'
                  }`}
                >
                  <span className="font-bold text-[#ea4335]">G</span> Google
                </button>
                <button
                  type="button"
                  onClick={() => alert('Tính năng đăng nhập Facebook đang được phát triển.')}
                  className={`flex items-center justify-center gap-2 border rounded-xl py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                      : 'bg-[#181824] hover:bg-[#202030] text-[#f0ede8] border-white/10'
                  }`}
                >
                  <span className="font-bold text-[#1877f2]">f</span> Facebook
                </button>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              MODE 4: REGISTER FORM
              ───────────────────────────────────────────────────────────── */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3" autoComplete="off">
              {/* Row 1: Họ & Tên */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs mb-1 ${labelStyle}`}>Họ</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    name="reg_first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Nguyễn"
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition-colors ${inputStyle}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${labelStyle}`}>Tên</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    name="reg_last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: Văn A"
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition-colors ${inputStyle}`}
                  />
                </div>
              </div>

              {/* Row 2: Email & Số điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs mb-1 ${labelStyle}`}>Email</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-2 text-xs ${iconStyle}`}>✉</span>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      name="reg_email_input"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="example@domain.com"
                      className={`w-full pl-8 pr-3 py-2 border rounded-xl text-xs outline-none font-mono-data transition-colors ${inputStyle}`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${labelStyle}`}>Số điện thoại</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-2 text-xs ${iconStyle}`}>📱</span>
                    <input
                      type="tel"
                      required
                      autoComplete="off"
                      name="reg_phone_input"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0987654321"
                      className={`w-full pl-8 pr-3 py-2 border rounded-xl text-xs outline-none font-mono-data transition-colors ${inputStyle}`}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Ngày sinh, Giới tính & Khu vực */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={`block text-[11px] mb-1 ${labelStyle}`}>Ngày sinh</label>
                  <input
                    type="date"
                    value={dob}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker()
                      } catch {}
                    }}
                    onChange={(e) => setDob(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl text-xs outline-none font-mono-data cursor-pointer [color-scheme:${isLight ? 'light' : 'dark'}] ${inputStyle}`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] mb-1 ${labelStyle}`}>Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl text-xs outline-none cursor-pointer ${inputStyle}`}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[11px] mb-1 ${labelStyle}`}>Khu vực</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={`w-full px-2 py-2 border rounded-xl text-xs outline-none cursor-pointer ${inputStyle}`}
                  >
                    <option value="TP. Hồ Chí Minh">TP.HCM</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Mật khẩu & Xác nhận mật khẩu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs mb-1 ${labelStyle}`}>Mật khẩu</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-2 text-xs ${iconStyle}`}>🔒</span>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      name="reg_pwd_field"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Ít nhất 8 ký tự"
                      className={`w-full pl-8 pr-9 py-2 border rounded-xl text-xs outline-none transition-colors ${inputStyle}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className={`absolute right-2.5 top-2 bg-transparent border-0 cursor-pointer text-xs ${iconStyle}`}
                    >
                      {showRegPassword ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${labelStyle}`}>Xác nhận mật khẩu</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-2 text-xs ${iconStyle}`}>🔒</span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      name="reg_confirm_pwd_field"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className={`w-full pl-8 pr-9 py-2 border rounded-xl text-xs outline-none transition-colors ${inputStyle}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-2.5 top-2 bg-transparent border-0 cursor-pointer text-xs ${iconStyle}`}
                    >
                      {showConfirmPassword ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Image CAPTCHA — Inline layout */}
              <div className="py-0.5">
                <label className={`block text-xs mb-1.5 ${labelStyle}`}>
                  Mã xác thực CAPTCHA (5 ký tự)
                </label>
                <div className="flex items-center gap-2 w-full">
                  <ImageCaptcha
                    onChallengeReady={(id) => setRegCaptchaId(id)}
                    refreshKey={regCaptchaRefreshKey}
                  />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoComplete="off"
                    name="reg_captcha_field"
                    value={regCaptchaAnswer}
                    onChange={(e) => setRegCaptchaAnswer(e.target.value.toUpperCase())}
                    placeholder="Nhập mã..."
                    className={`flex-1 min-w-0 h-[40px] px-2.5 border rounded-xl text-xs font-mono font-bold tracking-widest text-center uppercase outline-none transition-colors ${inputStyle}`}
                  />
                </div>
              </div>

              {/* Row 6: Terms Checkbox */}
              <div className="flex items-start gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 accent-[#e8b84b] cursor-pointer w-4 h-4"
                />
                <label htmlFor="agreeTerms" className={`text-xs leading-tight select-none ${isLight ? 'text-slate-600' : 'text-[#a09e9a]'}`}>
                  Tôi đồng ý với{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      openPolicy('terms')
                    }}
                    className="text-[#e8b84b] font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                  >
                    Điều khoản dịch vụ
                  </button>{' '}
                  và{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      openPolicy('privacy')
                    }}
                    className="text-[#e8b84b] font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                  >
                    Chính sách bảo mật
                  </button>{' '}
                  của CineVerse.
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e8b84b] hover:bg-[#d4a338] text-[#09090e] border-0 rounded-xl py-2.5 font-bold text-xs cursor-pointer hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] transition-all disabled:opacity-50 mt-1"
              >
                {loading ? 'Đang xử lý...' : 'Đăng ký ngay →'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Policy & Terms Modal Popup */}
      <PolicyModal
        isOpen={policyOpen}
        initialTab={policyTab}
        onClose={() => setPolicyOpen(false)}
      />
    </>
  )
}
