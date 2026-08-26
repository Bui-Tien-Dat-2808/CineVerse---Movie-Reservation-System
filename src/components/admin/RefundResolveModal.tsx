import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { fmt } from '../../lib/utils'

export interface RefundItem {
  id: number
  reservation_id: number
  ticket_code?: string
  user_full_name?: string
  user_email?: string
  amount: number
  refund_reason?: string
  bank_name?: string
  bank_account_number?: string
  bank_account_holder?: string
  created_at: string
}

interface RefundResolveModalProps {
  refund: RefundItem | null
  isOpen: boolean
  onClose: () => void
  onResolve: (refundId: number, adminNote: string) => Promise<void>
}

export default function RefundResolveModal({
  refund,
  isOpen,
  onClose,
  onResolve,
}: RefundResolveModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [adminNote, setAdminNote] = useState('Đã chuyển khoản ngân hàng ngoài hệ thống')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !refund) return null

  async function handleConfirm() {
    if (!refund) return
    setLoading(true)
    try {
      await onResolve(refund.id, adminNote)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div
        className={`max-w-md w-full rounded-2xl border p-6 space-y-4 shadow-2xl ${
          isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3 border-white/10">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <span>💳</span>
            <span>Xác Nhận Hoàn Tiền Thủ Công</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#a09e9a] hover:text-white text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <p>
            <strong>Mã Vé:</strong>{' '}
            <span className="text-[#e8b84b] font-mono-data font-bold">
              {refund.ticket_code || `R#${refund.reservation_id}`}
            </span>
          </p>
          <p>
            <strong>Khách hàng:</strong> {refund.user_full_name} ({refund.user_email})
          </p>
          <p>
            <strong>Số tiền cần hoàn:</strong>{' '}
            <span className="text-emerald-400 font-mono-data font-bold text-sm">
              {fmt(refund.amount)}
            </span>
          </p>
          {refund.bank_name && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1 font-mono-data">
              <p>
                <strong>Ngân hàng:</strong> {refund.bank_name}
              </p>
              <p>
                <strong>Số tài khoản:</strong> {refund.bank_account_number}
              </p>
              <p>
                <strong>Chủ tài khoản:</strong> {refund.bank_account_holder}
              </p>
            </div>
          )}
          <div>
            <label className="block text-[#a09e9a] mb-1 font-semibold">Ghi chú xác nhận hoàn tiền:</label>
            <input
              type="text"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                isDark ? 'bg-[#09090e] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-[#f0ede8] cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 disabled:opacity-50 cursor-pointer shadow-md"
          >
            {loading ? 'Đang cập nhật...' : '✓ Xác nhận đã hoàn tiền'}
          </button>
        </div>
      </div>
    </div>
  )
}
