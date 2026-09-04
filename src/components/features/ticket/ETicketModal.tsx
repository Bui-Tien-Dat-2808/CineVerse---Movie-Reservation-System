import { useState } from 'react'
import {
  Ticket,
  Building2,
  Clock,
  Armchair,
  User,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Copy,
  Check,
  Popcorn,
  Sparkles,
  QrCode,
  ShieldCheck,
} from 'lucide-react'
import type { ReservationItem, ReservationSeatItem } from '../../../api/showtimes'
import { BarcodeWidget } from '../../common/BarcodeWidget'
import { cn } from '../../../lib/utils'

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
  const [copied, setCopied] = useState(false)

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
    .map((s: ReservationSeatItem) => s.seat_label ?? `Hàng ${s.row_label} - Ghế ${s.col_number}`)
    .join(', ')

  const totalPriceNum =
    typeof reservation.total_price === 'string'
      ? parseFloat(reservation.total_price)
      : reservation.total_price

  const fmt = (num: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  const isUsed = reservation.is_used
  const isCancelled = reservation.status === 'cancelled'
  const isCash =
    reservation.payment_method === 'cash' ||
    (typeof reservation.notes === 'string' && reservation.notes.toLowerCase().includes('tiền mặt'))

  function handleCopyCode() {
    navigator.clipboard.writeText(ticketCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in print:bg-white print:p-0">
      <div className="relative w-full max-w-md max-h-[92vh] bg-[#111118] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-0 print:w-full print:max-w-none">
        {/* Top Header Controls */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-[#161622] shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-sm text-[#f0ede8] block leading-tight">
                Vé Xem Phim Điện Tử
              </span>
              <span className="text-[10px] font-mono-data text-[#a09e9a]">CineVerse Digital Pass</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold text-[#f0ede8] border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
              title="In vé xem phim"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In vé</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#f0ede8] hover:text-white flex items-center justify-center text-sm font-bold border border-white/15 transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cinema Ticket Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 print:p-4">
          {/* Ticket Header & Status */}
          <div className="flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black tracking-wider text-amber-400 text-sm">
                  CINEVERSE CINEMA
                </span>
                <span className="text-[9px] font-mono-data uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  PREMIUM
                </span>
              </div>
              <span className="text-[#a09e9a] font-mono-data text-[11px]">Hệ thống rạp chiếu chuẩn quốc tế</span>
            </div>

            <span
              className={cn(
                'px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider font-mono-data border inline-flex items-center gap-1.5',
                isCancelled
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : isUsed
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              )}
            >
              {isCancelled ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>Đã Hủy</span>
                </>
              ) : isUsed ? (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  <span>Đã Check-in</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Vé Hợp Lệ</span>
                </>
              )}
            </span>
          </div>

          {/* Movie Details Card */}
          <div className="flex gap-4 items-center bg-[#09090e] p-4 rounded-2xl border border-white/5 shadow-inner">
            <img
              src={posterUrl}
              alt={movieTitle}
              className="w-20 h-28 object-cover rounded-xl border border-white/10 shadow-md shrink-0"
            />
            <div className="space-y-1.5 min-w-0 flex-1">
              <h3 className="font-display font-bold text-base text-[#f0ede8] truncate leading-tight">
                {movieTitle}
              </h3>
              <div className="text-xs text-[#a09e9a] space-y-1 font-mono-data">
                <p className="flex items-center gap-1.5 text-amber-400 font-semibold truncate">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span className="truncate">{roomName}</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{startTimeStr}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Armchair className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span className="text-[#f0ede8] font-bold truncate">{seatsList || 'Chưa chọn'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Perforation Divider Notches */}
          <div className="relative flex items-center justify-center my-2">
            <div className="absolute -left-9 w-6 h-6 rounded-full bg-[#000000] border-r border-white/15" />
            <div className="w-full border-b border-dashed border-white/20" />
            <div className="absolute -right-9 w-6 h-6 rounded-full bg-[#000000] border-l border-white/15" />
          </div>

          {/* Ticket Barcode Section (Matching Code128 Barcode Widget) */}
          <div className="bg-white p-5 rounded-2xl text-center text-slate-900 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-data font-black text-slate-400 tracking-widest uppercase">
                MÃ VÉ VÀO RẠP (TICKET CODE)
              </span>

              <button
                type="button"
                onClick={handleCopyCode}
                className="text-[11px] font-mono-data font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            <div className="font-mono-data font-black text-2xl sm:text-3xl tracking-widest text-slate-950 block">
              {ticketCode}
            </div>

            {/* Authentic Code128 Barcode visualization matching Email */}
            <div className="py-1">
              <BarcodeWidget value={ticketCode} height={52} className="my-1" />
            </div>

            <div className="text-[11px] text-slate-500 font-medium pt-1 flex items-center justify-center gap-1.5 border-t border-slate-100">
              <QrCode className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Xuất trình mã vạch này cho nhân viên tại rạp để soát vé vào phòng.</span>
            </div>
          </div>

          {/* Concessions Section if any */}
          {Array.isArray((reservation as any)?.reservation_concessions) &&
            (reservation as any).reservation_concessions.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#09090e] border border-white/5 space-y-2 text-xs">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Popcorn className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bắp Nước & Combo Kèm Theo:</span>
                </div>
                <div className="space-y-1.5">
                  {(reservation as any).reservation_concessions.map((rc: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-[#f0ede8]">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold">{rc.concession_name || `Combo #${rc.concession_id}`}</span>
                        {rc.custom_options && (
                          <p className="text-[10px] text-[#a09e9a] truncate flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                            <span>{rc.custom_options}</span>
                          </p>
                        )}
                      </div>
                      <span className="font-mono-data font-bold text-amber-400 shrink-0 ml-2">
                        ×{rc.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Customer & Price Footer */}
          <div className="flex justify-between items-center pt-2 border-t border-dashed border-white/15 text-xs font-mono-data">
            <div>
              <span className="text-[#a09e9a] block text-[10px] flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                <span>Khách hàng</span>
              </span>
              <span className="font-semibold text-[#f0ede8]">{userName || 'Khách Hàng CineVerse'}</span>
            </div>

            <div className="text-center">
              <span className="text-[#a09e9a] block text-[10px] flex items-center justify-center gap-1">
                {isCash ? <Banknote className="w-2.5 h-2.5" /> : <CreditCard className="w-2.5 h-2.5" />}
                <span>Thanh toán</span>
              </span>
              <span className="font-semibold text-amber-400">
                {isCash ? 'Tiền mặt tại rạp' : 'VNPay / ATM'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[#a09e9a] block text-[10px]">Tổng thanh toán</span>
              <span className="font-bold text-base text-emerald-400">{fmt(totalPriceNum)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
