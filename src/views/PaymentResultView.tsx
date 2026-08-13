import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { fetchReservationDetailAPI, ReservationItem } from '../api/showtimes'
import { cn } from '../lib/utils'
import { getDeterministicBarcodeBars } from '../components/features/ticket/ETicketModal'

export default function PaymentResultView() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const statusParam = searchParams.get('status') || 'failed'
  const resIdParam = searchParams.get('reservation_id')
  const codeParam = searchParams.get('code')

  const isSuccess = statusParam === 'success'

  const [reservation, setReservation] = useState<ReservationItem | null>(null)
  const [loading, setLoading] = useState<boolean>(isSuccess && !!resIdParam)

  useEffect(() => {
    if (isSuccess && resIdParam) {
      fetchReservationDetailAPI(Number(resIdParam))
        .then((data) => setReservation(data))
        .catch((err) => console.error('Failed to load reservation receipt:', err))
        .finally(() => setLoading(false))
    }
  }, [isSuccess, resIdParam])

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-12 pb-24">
      {isSuccess ? (
        /* SUCCESS STATE */
        <div
          className={cn(
            'border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transition-all',
            isDark
              ? 'bg-[#111118] border-emerald-500/30 text-[#f0ede8]'
              : 'bg-white border-emerald-300 text-slate-900 shadow-xl'
          )}
        >
          {/* Status Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center text-3xl mx-auto mb-2 animate-bounce">
              ✓
            </div>
            <span
              className={cn(
                'text-xs font-mono-data font-black uppercase tracking-widest px-3 py-1 rounded-full border inline-block',
                isDark
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-100 border-emerald-400 text-emerald-950'
              )}
            >
              Giao Dịch Thành Công
            </span>
            <h1 className={cn('font-display font-black text-2xl sm:text-3xl', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
              Xác Nhận Đặt Vé Thành Công!
            </h1>
            <p className={cn('text-xs sm:text-sm font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
              Cảm ơn bạn đã đặt vé tại CineVerse. Thông tin vé điện tử của bạn đã được ghi nhận.
            </p>
          </div>

          {/* Ticket Receipt Box */}
          {loading ? (
            <div className="py-8 text-center text-xs font-mono-data animate-pulse opacity-70">
              Đang tải hóa đơn đặt vé...
            </div>
          ) : reservation ? (
            <div
              className={cn(
                'border rounded-2xl p-5 sm:p-6 space-y-4 shadow-inner',
                isDark ? 'bg-[#09090e] border-white/10' : 'bg-slate-50 border-slate-200'
              )}
            >
              {/* Ticket Code Barcode Display */}
              <div className="text-center pb-4 border-b border-dashed border-white/20">
                <span className={cn('text-[10px] font-mono-data uppercase block tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  Mã Vé Vào Rạp (Ticket Code)
                </span>
                <span className="font-mono-data font-black text-2xl tracking-widest text-amber-500 block my-1">
                  {reservation.ticket_code || `CVN-${reservation.id}`}
                </span>

                {/* Dynamic Barcode visualization */}
                {(() => {
                  const currentCode = reservation.ticket_code || `CVN-${reservation.id}`
                  const barcodeBars = getDeterministicBarcodeBars(currentCode, 26)
                  return (
                    <div className="w-48 mx-auto h-8 flex items-center justify-between px-2 bg-white rounded mt-2 border border-slate-300 opacity-90">
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
              </div>

              {/* Details Breakdown */}
              <div className="space-y-2.5 text-xs font-medium">
                {reservation.showtime && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-600'}>Phim:</span>
                      <strong className={cn('font-bold text-sm', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                        {reservation.showtime.movie_title || 'CineVerse Movie'}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-600'}>Phòng chiếu:</span>
                      <strong className={isDark ? 'text-[#f0ede8]' : 'text-slate-900'}>
                        {reservation.showtime.room_name || 'Phòng chiếu CineVerse'}
                      </strong>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-600'}>Danh sách ghế:</span>
                  <strong className="text-amber-500 font-mono-data font-bold">
                    {reservation.reservation_seats.map((s) => s.seat_label || `Ghế #${s.id}`).join(', ')}
                  </strong>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/10 text-sm">
                  <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-600'}>Tổng thanh toán:</span>
                  <strong className="font-mono-data font-black text-lg text-emerald-400">
                    {Number(reservation.total_price).toLocaleString('vi-VN')} đ
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-amber-500">
              Đơn đặt vé #{resIdParam} đã được thanh toán thành công!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/rap-chieu')}
              className={cn(
                'w-full py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer border shadow-sm',
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-[#f0ede8] border-white/10'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300 font-bold'
              )}
            >
              <span>🏛️</span>
              <span className="ml-1">Khám phá rạp khác</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-500 shadow-md flex items-center justify-center gap-1.5"
            >
              <span>🏠</span>
              <span>Trở về trang chủ</span>
            </button>
          </div>
        </div>
      ) : (
        /* FAILURE STATE */
        <div
          className={cn(
            'border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transition-all text-center',
            isDark
              ? 'bg-[#1a1112] border-red-500/30 text-[#f0ede8]'
              : 'bg-red-50/90 border-red-300 text-slate-900 shadow-xl'
          )}
        >
          <div className="w-16 h-16 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full flex items-center justify-center text-3xl mx-auto mb-2">
            ⚠️
          </div>
          <span
            className={cn(
              'text-xs font-mono-data font-black uppercase tracking-widest px-3 py-1 rounded-full border inline-block',
              isDark
                ? 'bg-red-500/15 border-red-500/30 text-red-400'
                : 'bg-red-100 border-red-400 text-red-950'
            )}
          >
            Thanh Toán Thất Bại
          </span>
          <h1 className={cn('font-display font-black text-2xl sm:text-3xl', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
            Thanh Toán Chưa Hoàn Tất
          </h1>
          <p className={cn('text-xs sm:text-sm font-medium max-w-md mx-auto', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
            Rất tiếc, giao dịch qua VNPay chưa thể hoàn tất hoặc đã bị hủy. Ghế giữ chỗ tạm thời của bạn đã được giải phóng tự động.
          </p>

          {codeParam && (
            <span className="text-[11px] font-mono-data px-3 py-1 bg-black/20 rounded border border-white/10 inline-block">
              Mã lỗi VNPay: {codeParam}
            </span>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={cn(
                'w-full py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer border shadow-sm',
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-[#f0ede8] border-white/10'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300 font-bold'
              )}
            >
              <span>🏠</span>
              <span>Quay lại trang chủ</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/rap-chieu')}
              className="w-full py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-md flex items-center justify-center gap-1.5"
            >
              <span>🔄</span>
              <span>Thử đặt lại vé</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
