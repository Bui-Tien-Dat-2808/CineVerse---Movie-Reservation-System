import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import { fmt, copyToClipboard } from '../lib/utils'
import { useTheme } from '../context/ThemeContext'

interface VoucherItem {
  code: string
  title: string
  description: string
  discount_type: 'percent' | 'fixed' | string
  discount_value: number
  min_spend: number
  max_discount?: number
  expiry_date: string
  bg_gradient: string
}

export default function PromotionsView() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchVouchers = () => {
    setLoading(true)
    setError(null)
    apiClient
      .get<VoucherItem[]>('/api/v1/vouchers/')
      .then(({ data }) => setVouchers(data))
      .catch((err) => {
        console.error('Failed to load vouchers:', err)
        setError('Không thể tải danh sách ưu đãi khuyến mãi từ máy chủ. Vui lòng thử lại sau.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchVouchers()
  }, [])

  async function handleCopy(code: string) {
    const ok = await copyToClipboard(code)
    if (ok) {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 3000)
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 pb-20">
      {/* Toast alert */}
      {copiedCode && (
        <div className="fixed bottom-6 right-6 z-[120] bg-[#e8b84b] text-[#09090e] px-5 py-3 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>Đã sao chép mã "{copiedCode}"! Dùng ngay tại trang thanh toán.</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        className={`relative border rounded-2xl p-8 mb-12 shadow-2xl transition-colors ${
          isLight
            ? 'bg-gradient-to-r from-amber-500/10 via-amber-50/80 to-amber-100/50 border-amber-500/30 text-slate-900 shadow-amber-500/5'
            : 'bg-gradient-to-r from-[#161622] via-[#111118] to-[#1e160a] border-[#e8b84b]/20 text-[#f0ede8]'
        }`}
      >
        <div className="max-w-2xl">
          <span
            className={`text-xs font-mono-data font-bold uppercase tracking-widest border rounded-full px-3 py-1 inline-block mb-3 ${
              isLight
                ? 'text-amber-800 bg-amber-500/15 border-amber-500/30'
                : 'text-[#e8b84b] bg-[#e8b84b]/15 border-[#e8b84b]/30'
            }`}
          >
            🎁 Khuyến Mãi Đặc Quyền
          </span>
          <h1
            className={`font-display font-black text-3xl sm:text-4xl mb-3 tracking-tight ${
              isLight ? 'text-slate-900' : 'text-[#f0ede8]'
            }`}
          >
            Ưu Đãi & Mã Giảm Giá
          </h1>
          <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-[#a09e9a]'}`}>
            Săn ngay hàng loạt mã giảm giá hấp dẫn dành riêng cho hội viên CineVerse. Sao chép mã và nhập tại bước thanh toán để tận hưởng giá vé ưu đãi tốt nhất!
          </p>
        </div>
      </div>

      {/* Active Vouchers Grid */}
      {loading ? (
        <div className={`text-center py-20 text-xs font-mono-data animate-pulse ${isLight ? 'text-slate-500' : 'text-[#a09e9a]'}`}>
          Đang tải danh sách chương trình khuyến mãi...
        </div>
      ) : error ? (
        <div
          className={`border rounded-2xl p-12 text-center space-y-4 ${
            isLight ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <span className="text-4xl block">⚠️</span>
          <h3 className="font-display font-bold text-lg">{error}</h3>
          <button
            type="button"
            onClick={fetchVouchers}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
          >
            🔄 Thử lại
          </button>
        </div>
      ) : vouchers.length === 0 ? (
        <div
          className={`border rounded-2xl p-16 text-center ${
            isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#111118] border-white/10 text-[#a09e9a]'
          }`}
        >
          <span className="text-5xl block mb-4">🎟️</span>
          <h3 className={`font-display font-bold text-xl mb-2 ${isLight ? 'text-slate-900' : 'text-[#f0ede8]'}`}>
            Chưa có khuyến mãi mới
          </h3>
          <p className="text-xs">Vui lòng quay lại sau để cập nhật ưu đãi mới nhất.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {vouchers.map((item) => {
            const discountLabel =
              item.discount_type === 'percent'
                ? `Giảm ${item.discount_value}%`
                : `Giảm ${fmt(item.discount_value)}`

            return (
              <div
                key={item.code}
                className={`border rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-amber-500/40 shadow-slate-200/60'
                    : 'bg-[#111118] border-white/10 hover:border-[#e8b84b]/40'
                }`}
              >
                {/* Background decorative tint */}
                <div
                  className={`absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l ${item.bg_gradient} pointer-events-none opacity-40`}
                />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`text-2xl font-black font-mono-data border rounded-lg px-3 py-1 ${
                        isLight
                          ? 'text-amber-800 bg-amber-50 border-amber-300'
                          : 'text-[#e8b84b] bg-[#e8b84b]/10 border-[#e8b84b]/30'
                      }`}
                    >
                      {discountLabel}
                    </span>
                    <span className={`text-[11px] font-mono-data ${isLight ? 'text-slate-500 font-medium' : 'text-[#6e6c68]'}`}>
                      Hạn dùng: {item.expiry_date}
                    </span>
                  </div>

                  <h3
                    className={`font-display font-bold text-xl mb-2 transition-colors ${
                      isLight ? 'text-slate-900 group-hover:text-amber-700' : 'text-[#f0ede8] group-hover:text-[#e8b84b]'
                    }`}
                  >
                    {item.title}
                  </h3>

                  <p className={`text-xs leading-relaxed mb-4 ${isLight ? 'text-slate-600' : 'text-[#a09e9a]'}`}>
                    {item.description}
                  </p>
                </div>

                {/* Voucher code bottom bar */}
                <div
                  className={`relative z-10 pt-4 border-t flex justify-between items-center gap-4 ${
                    isLight ? 'border-slate-100' : 'border-white/10'
                  }`}
                >
                  <div>
                    <span className={`text-[10px] uppercase font-mono-data block ${isLight ? 'text-slate-400' : 'text-[#6e6c68]'}`}>
                      Mã Voucher:
                    </span>
                    <span className={`font-mono-data text-sm font-bold tracking-wider ${isLight ? 'text-amber-700' : 'text-[#e8b84b]'}`}>
                      {item.code}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.code)}
                    className="bg-[#e8b84b] hover:bg-[#d4a338] text-[#09090e] px-4 py-2 rounded-lg font-bold text-xs cursor-pointer transition-all shadow-md hover:shadow-[0_4px_16px_rgba(232,184,75,0.35)]"
                  >
                    {copiedCode === item.code ? '✓ Đã chép mã' : '📋 Sao chép mã'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Guide Section */}
      <div
        className={`border rounded-2xl p-8 shadow-xl ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-[#111118] border-white/10'
        }`}
      >
        <h3 className={`font-display font-bold text-xl mb-4 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-[#f0ede8]'}`}>
          <span>💡</span> Hướng Dẫn Sử Dụng Mã Giảm Giá
        </h3>

        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#a09e9a]'}`}>
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#09090e] border-white/5'}`}>
            <span className={`font-mono-data font-bold text-base block mb-2 ${isLight ? 'text-amber-700' : 'text-[#e8b84b]'}`}>
              Bước 1
            </span>
            Chọn suất chiếu và ghế ngồi yêu thích của bạn tại trang chủ CineVerse.
          </div>
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#09090e] border-white/5'}`}>
            <span className={`font-mono-data font-bold text-base block mb-2 ${isLight ? 'text-amber-700' : 'text-[#e8b84b]'}`}>
              Bước 2
            </span>
            Nhấn <strong className={isLight ? 'text-slate-900' : 'text-[#f0ede8]'}>"Sao chép mã"</strong> khuyến mãi phù hợp trên trang này.
          </div>
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#09090e] border-white/5'}`}>
            <span className={`font-mono-data font-bold text-base block mb-2 ${isLight ? 'text-amber-700' : 'text-[#e8b84b]'}`}>
              Bước 3
            </span>
            Dán mã vào ô <strong className={isLight ? 'text-slate-900' : 'text-[#f0ede8]'}>"Mã giảm giá"</strong> tại trang Thanh toán để nhận ưu đãi tức thì!
          </div>
        </div>
      </div>
    </div>
  )
}
