import React from 'react'

interface WaitingRoomModalProps {
  isOpen: boolean
  rank: number
  totalWaiting: number
  estimatedWaitSeconds: number
  movieTitle?: string
  showtimeStr?: string
  onLeaveQueue: () => void
}

export const WaitingRoomModal: React.FC<WaitingRoomModalProps> = ({
  isOpen,
  rank,
  totalWaiting,
  estimatedWaitSeconds,
  movieTitle,
  showtimeStr,
  onLeaveQueue,
}) => {
  if (!isOpen) return null

  const formatEstTime = (secs: number) => {
    if (secs < 60) return `~${secs} giây`
    const mins = Math.ceil(secs / 60)
    return `~${mins} phút`
  }

  // Progress percentage calculation (clamped between 5% and 95%)
  const progressPercent = Math.max(5, Math.min(95, Math.round(((totalWaiting - rank + 1) / totalWaiting) * 100)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0f0f18] border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl p-6 text-center space-y-6">
        
        {/* Animated Glow Accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon & Title */}
        <div className="relative space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl animate-bounce">
            🎟️
          </div>
          <h3 className="font-display font-black text-xl text-[#f0ede8]">
            Phòng Chờ Đặt Vé (Virtual Queue)
          </h3>
          {movieTitle && (
            <p className="text-xs font-medium text-amber-400 truncate max-w-xs mx-auto">
              🎬 {movieTitle} {showtimeStr ? `• ${showtimeStr}` : ''}
            </p>
          )}
        </div>

        {/* Big Rank Badge */}
        <div className="relative py-4 px-6 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[11px] font-mono-data uppercase tracking-wider text-[#a09e9a]">
            Vị trí của bạn trong hàng đợi
          </span>
          <div className="font-display font-black text-4xl sm:text-5xl text-[#e8b84b] tracking-tight">
            #{rank}
          </div>
          <div className="text-[11px] text-[#a09e9a] font-mono-data pt-1">
            Tổng người đang chờ: <span className="font-bold text-white">{totalWaiting}</span>
          </div>
        </div>

        {/* Estimated Time & Progress Bar */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between items-center text-xs font-mono-data">
            <span className="text-[#a09e9a]">Thời gian chờ dự kiến:</span>
            <span className="font-bold text-amber-300">{formatEstTime(estimatedWaitSeconds)}</span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(232,184,75,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-400 font-medium animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Hệ thống đang đếm lùi tự động... Vui lòng không đóng trình duyệt.</span>
        </div>

        {/* Leave Queue CTA */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onLeaveQueue}
            className="w-full py-2.5 rounded-xl border border-white/10 text-xs font-bold text-[#a09e9a] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            ✕ Hủy & Rời khỏi hàng đợi
          </button>
        </div>

      </div>
    </div>
  )
}
