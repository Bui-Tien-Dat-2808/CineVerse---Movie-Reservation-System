/**
 * SECURITY NOTICE:
 * This CAPTCHA component is a lightweight client-side verification intended for basic UI bot prevention.
 * Since CAPTCHA generation and validation occur on the client, backend API endpoints (/api/v1/auth/login and /api/v1/auth/register)
 * are protected with Redis rate limiting (max 5 requests/min per IP/account) to prevent automated brute-force attacks.
 * For production enterprise grade security, integrate a server-verified provider like Google reCAPTCHA v3 or Cloudflare Turnstile.
 */
import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../../../context/ThemeContext'

interface CaptchaBoxProps {
  onCodeChange: (code: string) => void
  refreshKey?: number | string
}

export default function CaptchaBox({ onCodeChange, refreshKey }: CaptchaBoxProps) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [code, setCode] = useState('')

  const generateCaptcha = useCallback(() => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCode(result)
    onCodeChange(result)
  }, [onCodeChange])

  useEffect(() => {
    generateCaptcha()
  }, [generateCaptcha, refreshKey])

  return (
    <div className="flex items-center gap-2">
      {/* Visual distorted Captcha box — Display only */}
      <div
        className={`relative border rounded px-3 py-2 select-none overflow-hidden flex items-center justify-center min-w-[100px] h-[38px] ${
          isLight ? 'bg-amber-500/10 border-amber-500/40' : 'bg-[#1a1a2e] border-[#e8b84b]/40'
        }`}
        style={{
          backgroundImage: isLight
            ? 'radial-gradient(circle at 50% 50%, rgba(217,119,6,0.15) 0%, transparent 80%), repeating-linear-gradient(45deg, rgba(15,23,42,0.03) 0px, rgba(15,23,42,0.03) 2px, transparent 2px, transparent 4px)'
            : 'radial-gradient(circle at 50% 50%, rgba(232,184,75,0.15) 0%, transparent 80%), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 4px)',
        }}
      >
        {/* Decorative noise lines */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <svg width="100%" height="100%">
            <line x1="0" y1="10" x2="100" y2="30" stroke={isLight ? '#d97706' : '#e8b84b'} strokeWidth="1" />
            <line x1="10" y1="35" x2="90" y2="5" stroke={isLight ? '#0f172a' : '#f0ede8'} strokeWidth="1" />
          </svg>
        </div>

        {/* Captcha Text */}
        <span
          className={`font-mono-data text-base font-black tracking-[3px] italic transform -skew-x-6 ${
            isLight
              ? 'text-amber-800 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]'
              : 'text-[#e8b84b] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
          }`}
        >
          {code}
        </span>
      </div>

      {/* Refresh button — Only way to refresh CAPTCHA */}
      <button
        type="button"
        onClick={generateCaptcha}
        title="Đổi mã xác thực khác"
        className={`p-2 border rounded cursor-pointer transition-colors text-xs flex items-center justify-center w-[38px] h-[38px] ${
          isLight
            ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            : 'bg-white/5 hover:bg-white/15 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]'
        }`}
      >
        🔄
      </button>
    </div>
  )
}
