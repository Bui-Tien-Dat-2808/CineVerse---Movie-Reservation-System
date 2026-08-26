import { useState, useEffect, useRef } from 'react'
import { apiClient } from '../../../api/client'

interface ImageCaptchaProps {
  onChallengeReady: (captchaId: string) => void
  refreshKey: number
}

export default function ImageCaptcha({ onChallengeReady, refreshKey }: ImageCaptchaProps) {
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
    <div className="flex items-center gap-1.5 shrink-0">
      <div
        onClick={fetchCaptcha}
        title="Bấm vào ảnh để đổi mã mới"
        className="rounded-xl overflow-hidden border border-[#e8b84b]/40 bg-[#161622] flex items-center justify-center w-[115px] sm:w-[130px] h-[40px] cursor-pointer hover:border-[#e8b84b] transition-colors shrink-0"
      >
        {loading ? (
          <div className="w-full h-full animate-pulse bg-[#222232] flex items-center justify-center text-[10px] text-[#e8b84b]/60">
            Đang tải...
          </div>
        ) : error || !imageSrc ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              fetchCaptcha()
            }}
            className="text-[10px] text-[#e8b84b] hover:underline bg-transparent border-0 cursor-pointer p-1"
          >
            ⚠️ Thử lại
          </button>
        ) : (
          <img src={imageSrc} alt="Mã CAPTCHA" className="block w-full h-full object-cover select-none" />
        )}
      </div>
      <button
        type="button"
        onClick={fetchCaptcha}
        className="w-[36px] h-[40px] rounded-xl bg-[#222232] hover:bg-[#2c2c40] text-[#e8b84b] hover:text-[#f0c868] border border-[#e8b84b]/20 transition-colors flex items-center justify-center cursor-pointer shrink-0 text-xs"
        title="Tải mã xác thực mới"
        aria-label="Tải mã mới"
      >
        🔄
      </button>
    </div>
  )
}
