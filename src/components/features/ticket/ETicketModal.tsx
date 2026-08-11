import React from 'react'
import type { ReservationItem } from '../../../types'

interface ETicketModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: ReservationItem | null
  userName?: string
}

export function getDeterministicBarcodeBars(ticketCode: string, count: number = 34) {
  let seed = 0
  for (let idx = 0; idx < ticketCode.length; idx++) {
    seed = (seed << 5) - seed + ticketCode.charCodeAt(idx)
    seed |= 0
  }

  const bars: string[] = []
  for (let i = 0; i < count; i++) {
    if (i === 0 || i === count - 1) {
      bars.push('3.5px')
      continue
    }
    if (i === 1 || i === count - 2) {
      bars.push('1px')
      continue
    }
    if (i === 2 || i === count - 3) {
      bars.push('2.5px')
      continue
    }

    const charCode = ticketCode.charCodeAt(i % ticketCode.length)
    const pseudoRandom = Math.abs((charCode * (i + 1) * 37 + seed + i * 19) % 100)

    if (pseudoRandom < 20) {
      bars.push('1px')
    } else if (pseudoRandom < 50) {
      bars.push('2px')
    } else if (pseudoRandom < 78) {
      bars.push('3px')
    } else {
      bars.push('4px')
    }
  }
  return bars
}

export function ETicketModal({ isOpen, onClose, reservation, userName }: ETicketModalProps) {
  if (!isOpen || !reservation) return null

  const ticketCode = reservation.ticket_code || `CVN-${reservation.id}`

  const movieTitle = reservation.showtime?.movie_title || 'Bộ Phim Rạp CineVerse'
  const roomName = reservation.showtime?.room_name || 'Phòng Chiếu CineVerse'
  const posterUrl =
    reservation.showtime?.movie_poster_url ||
    'https://images.unsplash.com/photo-1534996858221-380b92700493?w=300'

  const startTimeStr = reservation.showtime?.start_time
    ? new Date(reservation.showtime.start_time).toLocaleString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A'

  const seatsList = reservation.reservation_seats
    .map((s) => s.seat_label ?? `Hàng ${s.row_label} - Ghế ${s.col_number}`)
    .join(', ')

  const totalPriceNum =
    typeof reservation.total_price === 'string'
      ? parseFloat(reservation.total_price)
      : reservation.total_price

  const fmt = (num: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  const isUsed = reservation.is_used
  const isCancelled = reservation.status === 'cancelled'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:bg-white print:p-0">
      <div className="relative w-full max-w-md max-h-[90vh] bg-[#111118] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-0 print:w-full">
        {/* Top Header Controls */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-[#161622] shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">🎟️</span>
            <span className="font-display font-bold text-sm text-[#f0ede8]">Vé Điện Tử CineVerse</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#f0ede8] hover:text-white flex items-center justify-center text-sm font-bold border border-white/15 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        {/* Cinema Ticket Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 print:p-4">
          {/* Ticket Header & Status */}
          <div className="flex justify-between items-center text-xs">
            <div>
              <span className="font-display font-extrabold tracking-wider text-amber-400 block text-sm">
                CINEVERSE CINEMA
              </span>
              <span className="text-[#a09e9a] font-mono-data text-[11px]">Rạp Chiếu Phim Đẳng Cấp</span>
            </div>

            <span
              className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider font-mono-data border ${
                isCancelled
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : isUsed
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {isCancelled ? '⚠️ Đã Hủy' : isUsed ? '✅ Đã Check-in' : '🟢 Vé Hợp Lệ'}
            </span>
          </div>

          {/* Movie Details Grid */}
          <div className="flex gap-4 items-center bg-[#09090e] p-4 rounded-2xl border border-white/5">
            <img
              src={posterUrl}
              alt={movieTitle}
              className="w-20 h-28 object-cover rounded-xl border border-white/10 shadow-md shrink-0"
            />
            <div className="space-y-1.5 min-w-0">
              <h3 className="font-display font-bold text-base text-[#f0ede8] truncate leading-tight">
                {movieTitle}
              </h3>
              <div className="text-xs text-[#a09e9a] space-y-1 font-mono-data">
                <p className="flex items-center gap-1.5 text-[#e8b84b] font-semibold">
                  <span>🏛️</span>
                  <span>{roomName}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span>🕒</span>
                  <span>{startTimeStr}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span>💺</span>
                  <span className="text-[#f0ede8] font-bold truncate">{seatsList || 'Chưa chọn'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Barcode Section (Matching Payment Result Barcode) */}
          <div className="bg-white p-5 rounded-2xl text-center text-slate-900 space-y-3 shadow-inner">
            <div className="text-[11px] font-mono-data font-bold text-slate-500 tracking-widest uppercase">
              MÃ VÉ VÀO RẠP (TICKET CODE)
            </div>
            <div className="font-mono-data font-black text-2xl tracking-widest text-amber-600 block">
              {ticketCode}
            </div>

            {/* Dynamic & Unique High-contrast Barcode visualization */}
            {(() => {
              const barcodeBars = getDeterministicBarcodeBars(ticketCode, 34)
              return (
                <div className="w-56 mx-auto h-14 flex items-center justify-between px-3 bg-white rounded-lg border border-slate-300 py-1.5">
                  {barcodeBars.map((w, i) => (
                    <div
                      key={i}
                      className="h-full bg-slate-950"
                      style={{ width: w }}
                    />
                  ))}
                </div>
              )
            })()}

            <div className="text-[11px] text-slate-500 font-medium pt-1">
              🎟️ Đưa mã vạch này cho nhân viên tại rạp để soát vé vào phòng chiếu.
            </div>
          </div>

          {/* Customer & Price Footer */}
          <div className="flex justify-between items-center pt-2 border-t border-dashed border-white/15 text-xs font-mono-data">
            <div>
              <span className="text-[#a09e9a] block text-[10px]">Khách hàng</span>
              <span className="font-semibold text-[#f0ede8]">{userName || 'Khách Hàng CineVerse'}</span>
            </div>

            <div className="text-right">
              <span className="text-[#a09e9a] block text-[10px]">Tổng tiền</span>
              <span className="font-bold text-base text-[#e8b84b]">{fmt(totalPriceNum)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
