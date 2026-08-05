import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import { fmt, copyToClipboard } from '../lib/utils'

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
  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    apiClient
      .get<VoucherItem[]>('/api/v1/vouchers/')
      .then(({ data }) => setVouchers(data))
      .catch((err) => console.error('Failed to load vouchers:', err))
      .finally(() => setLoading(false))
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
      <div className="relative bg-gradient-to-r from-[#161622] via-[#111118] to-[#1e160a] border border-[#e8b84b]/20 rounded-2xl p-8 mb-12 shadow-2xl">
        <div className="max-w-2xl">
          <span className="text-xs font-mono-data font-bold text-[#e8b84b] uppercase tracking-widest bg-[#e8b84b]/15 border border-[#e8b84b]/30 rounded-full px-3 py-1 inline-block mb-3">
            🎁 Khuyến Mãi Đặc Quyền
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#f0ede8] mb-3 tracking-tight">
            Ưu Đãi & Mã Giảm Giá
          </h1>
          <p className="text-sm text-[#a09e9a] leading-relaxed">
            Săn ngay hàng loạt mã giảm giá hấp dẫn dành riêng cho hội viên CineVerse. Sao chép mã và nhập tại bước thanh toán để tận hưởng giá vé ưu đãi tốt nhất!
          </p>
        </div>
      </div>

      {/* Active Vouchers Grid */}
      {loading ? (
        <div className="text-center py-20 text-xs text-[#a09e9a] font-mono-data animate-pulse">
          Đang tải danh sách chương trình khuyến mãi...
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-[#111118] border border-white/10 rounded-2xl p-16 text-center text-[#a09e9a]">
          <span className="text-5xl block mb-4">🎟️</span>
          <h3 className="font-display font-bold text-xl text-[#f0ede8] mb-2">Chưa có khuyến mãi mới</h3>
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
                className="bg-[#111118] border border-white/10 hover:border-[#e8b84b]/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:-translate-y-1"
              >
                {/* Background decorative tint */}
                <div
                  className={`absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l ${item.bg_gradient} pointer-events-none`}
                />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl font-black font-mono-data text-[#e8b84b] bg-[#e8b84b]/10 border border-[#e8b84b]/30 rounded-lg px-3 py-1">
                      {discountLabel}
                    </span>
                    <span className="text-[11px] font-mono-data text-[#6e6c68]">
                      Hạn dùng: {item.expiry_date}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-xl text-[#f0ede8] mb-2 group-hover:text-[#e8b84b] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#a09e9a] leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                {/* Voucher code bottom bar */}
                <div className="relative z-10 pt-4 border-t border-white/10 flex justify-between items-center gap-4">
                  <div>
                    <span className="text-[10px] text-[#6e6c68] uppercase font-mono-data block">
                      Mã Voucher:
                    </span>
                    <span className="font-mono-data text-sm font-bold text-[#e8b84b] tracking-wider">
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
      <div className="bg-[#111118] border border-white/10 rounded-2xl p-8 shadow-xl">
        <h3 className="font-display font-bold text-xl text-[#f0ede8] mb-4 flex items-center gap-2">
          <span>💡</span> Hướng Dẫn Sử Dụng Mã Giảm Giá
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-[#a09e9a] leading-relaxed">
          <div className="bg-[#09090e] p-4 rounded-xl border border-white/5">
            <span className="font-mono-data font-bold text-[#e8b84b] text-base block mb-2">Bước 1</span>
            Chọn suất chiếu và ghế ngồi yêu thích của bạn tại trang chủ CineVerse.
          </div>
          <div className="bg-[#09090e] p-4 rounded-xl border border-white/5">
            <span className="font-mono-data font-bold text-[#e8b84b] text-base block mb-2">Bước 2</span>
            Nhấn <strong className="text-[#f0ede8]">"Sao chép mã"</strong> khuyến mãi phù hợp trên trang này.
          </div>
          <div className="bg-[#09090e] p-4 rounded-xl border border-white/5">
            <span className="font-mono-data font-bold text-[#e8b84b] text-base block mb-2">Bước 3</span>
            Dán mã vào ô <strong className="text-[#f0ede8]">"Mã giảm giá"</strong> tại trang Thanh toán để nhận ưu đãi tức thì!
          </div>
        </div>
      </div>
    </div>
  )
}
