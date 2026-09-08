import { useState, useEffect, useRef } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { apiClient } from '../../../api/client'
import { useTheme } from '../../../context/ThemeContext'
import { cn } from '../../../lib/utils'

interface ImageCaptchaProps {
  onChallengeReady: (captchaId: string) => void
  refreshKey: number
}

export default function ImageCaptcha({ onChallengeReady, refreshKey }: ImageCaptchaProps) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [imageSrc, setImageSrc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const onChallengeReadyRef = useRef(onChallengeReady)

  useEffect(() => {
    onChallengeReadyRef.current = onChallengeReady
  }, [onChallengeReady])

  const fetchCaptcha = async () => {
    setLoading(true)
    setError(false)
    try {
      const { data } = await apiClient.get<{ captcha_id: string; image: string }>('/api/v1/auth/captcha')
      if (data && data.image && data.captcha_id) {
        setImageSrc(data.image)
        onChallengeReadyRef.current(data.captcha_id)
      } else {
        setError(true)
      }
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCaptcha()
  }, [refreshKey])

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Khung chứa ảnh CAPTCHA thích ứng Light / Dark Mode */}
      <div
        onClick={fetchCaptcha}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fetchCaptcha()
          }
        }}
        title="Bấm vào ảnh để đổi mã mới"
        className={cn(
          'rounded-xl overflow-hidden border flex items-center justify-center w-[125px] sm:w-[135px] h-[42px] cursor-pointer transition-all duration-200 shrink-0 shadow-sm',
          isLight
            ? 'bg-slate-100 border-slate-300 hover:border-amber-500 hover:bg-slate-50'
            : 'bg-[#161622] border-white/15 hover:border-[#e8b84b]',
        )}
      >
        {loading ? (
          <div
            className={cn(
              'w-full h-full animate-pulse flex items-center justify-center gap-1.5 text-xs font-semibold',
              isLight ? 'bg-slate-200 text-slate-500' : 'bg-[#222232] text-[#e8b84b]/70',
            )}
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Đang tải...</span>
          </div>
        ) : error || !imageSrc ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              fetchCaptcha()
            }}
            className={cn(
              'text-xs font-bold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-1.5 transition-colors',
              isLight ? 'text-amber-600 hover:text-amber-700' : 'text-[#e8b84b] hover:text-[#f0c868]',
            )}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        ) : (
          <img
            src={imageSrc}
            alt="Mã CAPTCHA xác thực"
            className="block w-full h-full object-cover select-none"
          />
        )}
      </div>

      {/* Nút Đổi Mã CAPTCHA với icon SVG và xoay khi bấm */}
      <button
        type="button"
        onClick={fetchCaptcha}
        disabled={loading}
        className={cn(
          'w-[42px] h-[42px] rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer shrink-0 shadow-sm disabled:opacity-50',
          isLight
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-amber-600 border-slate-300 active:scale-95'
            : 'bg-[#1f1f2e] hover:bg-[#2a2a3e] text-[#e8b84b] hover:text-[#f0c868] border-white/10 active:scale-95',
        )}
        title="Tải mã xác thực mới"
        aria-label="Tải mã xác thực mới"
      >
        <RefreshCw className={cn('w-4 h-4 transition-transform', loading && 'animate-spin')} />
      </button>
    </div>
  )
}
