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
    <div className="flex items-center gap-3">
      <div
        onClick={fetchCaptcha}
        title="Bấm vào ảnh để đổi mã mới"
        className="rounded-lg overflow-hidden border border-[#e8b84b]/40 bg-[#161622] flex items-center justify-center min-w-[220px] h-[75px] cursor-pointer hover:border-[#e8b84b] transition-colors"
      >
        {loading ? (
          <div className="w-[220px] h-[75px] animate-pulse bg-[#222232] flex items-center justify-center text-xs text-[#e8b84b]/60">
            Đang tải mã...
          </div>
        ) : error || !imageSrc ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              fetchCaptcha()
            }}
            className="text-xs text-[#e8b84b] hover:underline bg-transparent border-0 cursor-pointer p-2"
          >
            ⚠️ Lỗi tải mã. Bấm để thử lại
          </button>
        ) : (
          <img src={imageSrc} alt="Mã xác thực CAPTCHA" className="block w-[220px] h-[75px] object-cover" />
        )}
      </div>
      <button
        type="button"
        onClick={fetchCaptcha}
        className="p-2.5 rounded-lg bg-[#222232] hover:bg-[#2c2c40] text-[#e8b84b] hover:text-[#f0c868] border border-[#e8b84b]/20 transition-colors flex items-center justify-center cursor-pointer"
        title="Tải mã xác thực mới"
        aria-label="Tải mã mới"
      >
        🔄
      </button>
    </div>
  )
}
