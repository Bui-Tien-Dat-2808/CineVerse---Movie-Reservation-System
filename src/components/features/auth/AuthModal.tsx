import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useBooking } from '../../../context/BookingContext'
import { useTheme } from '../../../context/ThemeContext'
import CaptchaBox from './CaptchaBox'
import PolicyModal from './PolicyModal'

export default function AuthModal() {
  const navigate = useNavigate()
  const { isAuthModalOpen, closeAuthModal, authMode, setAuthMode, login, register } = useAuth()
  const { reset } = useBooking()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  // Login Form States
  const [account, setAccount] = useState('') // Email or Phone number
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginCaptchaInput, setLoginCaptchaInput] = useState('')
  const [loginCaptchaCode, setLoginCaptchaCode] = useState('')
  const [loginCaptchaRefreshKey, setLoginCaptchaRefreshKey] = useState(0)

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
  const [regCaptchaInput, setRegCaptchaInput] = useState('')
  const [regCaptchaCode, setRegCaptchaCode] = useState('')
  const [regCaptchaRefreshKey, setRegCaptchaRefreshKey] = useState(0)
  const [agreeTerms, setAgreeTerms] = useState(false)

  // Policy Modal States
  const [policyOpen, setPolicyOpen] = useState(false)
  const [policyTab, setPolicyTab] = useState<'terms' | 'privacy'>('terms')

  // Status & Error States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLoginCaptchaChange = useCallback((code: string) => {
    setLoginCaptchaCode(code)
  }, [])

  const handleRegCaptchaChange = useCallback((code: string) => {
    setRegCaptchaCode(code)
  }, [])

  if (!isAuthModalOpen) return null

  function openPolicy(tab: 'terms' | 'privacy') {
    setPolicyTab(tab)
    setPolicyOpen(true)
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validate CAPTCHA
    if (loginCaptchaInput.toUpperCase() !== loginCaptchaCode.toUpperCase()) {
      setError('Mã xác thực (CAPTCHA) không chính xác. Vui lòng nhập lại.')
      setLoginCaptchaRefreshKey((prev) => prev + 1)
      setLoginCaptchaInput('')
      return
    }

    setLoading(true)
    try {
      await login(account, loginPassword)
      // Chuyển ngay về trang chủ sau khi đăng nhập thành công
      reset()
      navigate('/')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      closeAuthModal()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setLoginCaptchaRefreshKey((prev) => prev + 1)
      setLoginCaptchaInput('')
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

    if (regCaptchaInput.toUpperCase() !== regCaptchaCode.toUpperCase()) {
      setError('Mã xác thực (CAPTCHA) không chính xác. Vui lòng nhập lại.')
      setRegCaptchaRefreshKey((prev) => prev + 1)
      setRegCaptchaInput('')
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
      })
      // Chuyển ngay về trang chủ sau khi đăng ký thành công
      reset()
      navigate('/')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      closeAuthModal()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Đăng ký thất bại. Vui lòng thử lại.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setRegCaptchaRefreshKey((prev) => prev + 1)
      setRegCaptchaInput('')
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
        <div
          className={`border rounded-2xl p-6 sm:p-8 max-w-lg w-full relative shadow-2xl my-8 transition-colors ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#111118] border-white/10 text-[#f0ede8]'
          }`}
        >
          {/* Prominent Close button */}
          <button
            type="button"
            onClick={closeAuthModal}
            title="Đóng cửa sổ"
            className={`absolute top-4 right-4 border rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md group z-10 ${
              isLight
                ? 'bg-slate-100 hover:bg-red-500 text-slate-600 hover:text-white border-slate-200'
                : 'bg-[#1a1a26] hover:bg-[#c0392b] text-[#a09e9a] hover:text-white border-white/15'
            }`}
          >
            <span>Đóng</span>
            <span className="text-sm font-black group-hover:scale-110 transition-transform">✕</span>
          </button>

          {/* CineVerse Logo Header */}
          <div className="flex justify-center items-center gap-2 mb-6">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#e8b84b" />
              <path
                d="M7 20 L14 8 L21 20"
                stroke="#09090e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <line x1="9.5" y1="16" x2="18.5" y2="16" stroke="#09090e" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className={`font-display font-bold text-xl tracking-tight ${isLight ? 'text-slate-900' : 'text-[#f0ede8]'}`}>
              CineVerse
            </span>
          </div>

          {/* Toggle Tab Bar */}
          <div
            className={`grid grid-cols-2 p-1 rounded-xl border mb-6 ${
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

          {/* Error Banner */}
          {error && (
            <div className="bg-[rgba(192,57,43,0.15)] border border-[rgba(192,57,43,0.3)] rounded-lg p-3 mb-5 text-xs text-[#e07060] flex items-center gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                    onClick={() => alert('Vui lòng liên hệ bộ phận hỗ trợ hoặc Admin để khôi phục mật khẩu.')}
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

              {/* Visual CAPTCHA input */}
              <div>
                <label className={`block text-xs mb-1 ${labelStyle}`}>
                  Mã xác thực (CAPTCHA)
                </label>
                <div className="flex gap-3 items-center">
                  <CaptchaBox onCodeChange={handleLoginCaptchaChange} refreshKey={loginCaptchaRefreshKey} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={loginCaptchaInput}
                    onChange={(e) => setLoginCaptchaInput(e.target.value.toUpperCase())}
                    placeholder="NHẬP MÃ"
                    className={`w-full px-3 py-2 border rounded-xl text-sm outline-none font-mono-data tracking-widest text-center uppercase ${inputStyle}`}
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
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* First Name & Last Name (Họ và Tên) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs mb-1 ${labelStyle}`}>Họ</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nguyễn"
                    className={`w-full px-3 py-2 border rounded-xl text-sm outline-none transition-colors ${inputStyle}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${labelStyle}`}>Tên</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Văn An"
                    className={`w-full px-3 py-2 border rounded-xl text-sm outline-none transition-colors ${inputStyle}`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={`block text-xs mb-1 ${labelStyle}`}>Email</label>
                <div className="relative">
                  <span className={`absolute left-3 top-2 text-sm ${iconStyle}`}>✉</span>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="example@domain.com"
                    className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm outline-none font-mono-data transition-colors ${inputStyle}`}
                  />
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className={`block text-xs mb-1 ${labelStyle}`}>Số điện thoại</label>
                <div className="relative">
                  <span className={`absolute left-3 top-2 text-sm ${iconStyle}`}>📱</span>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0987654321"
                    className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm outline-none font-mono-data transition-colors ${inputStyle}`}
                  />
                </div>
              </div>

              {/* DOB, Gender & Region */}
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

              {/* Password */}
              <div>
                <label className={`block text-xs mb-1 ${labelStyle}`}>Mật khẩu</label>
                <div className="relative">
                  <span className={`absolute left-3 top-2 text-sm ${iconStyle}`}>🔒</span>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Ít nhất 8 ký tự (chữ hoa & số)"
                    className={`w-full pl-9 pr-10 py-2 border rounded-xl text-sm outline-none transition-colors ${inputStyle}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className={`absolute right-3 top-2 bg-transparent border-0 cursor-pointer text-xs ${iconStyle}`}
                  >
                    {showRegPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`block text-xs mb-1 ${labelStyle}`}>Xác nhận mật khẩu</label>
                <div className="relative">
                  <span className={`absolute left-3 top-2 text-sm ${iconStyle}`}>🔒</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className={`w-full pl-9 pr-10 py-2 border rounded-xl text-sm outline-none transition-colors ${inputStyle}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-2 bg-transparent border-0 cursor-pointer text-xs ${iconStyle}`}
                  >
                    {showConfirmPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {/* CAPTCHA input */}
              <div>
                <label className={`block text-xs mb-1 ${labelStyle}`}>
                  Mã xác thực (CAPTCHA)
                </label>
                <div className="flex gap-3 items-center">
                  <CaptchaBox onCodeChange={handleRegCaptchaChange} refreshKey={regCaptchaRefreshKey} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={regCaptchaInput}
                    onChange={(e) => setRegCaptchaInput(e.target.value.toUpperCase())}
                    placeholder="NHẬP MÃ"
                    className={`w-full px-3 py-2 border rounded-xl text-sm outline-none font-mono-data tracking-widest text-center uppercase ${inputStyle}`}
                  />
                </div>
              </div>

              {/* Terms Checkbox with clickable Policy links */}
              <div className="flex items-start gap-2 pt-1">
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
                className="w-full bg-[#e8b84b] hover:bg-[#d4a338] text-[#09090e] border-0 rounded-xl py-3 font-bold text-sm cursor-pointer hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)] transition-all disabled:opacity-50 mt-2"
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
