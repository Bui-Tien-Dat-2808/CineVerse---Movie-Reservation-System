import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Ticket,
  Tag,
  X,
  Check,
  Plus,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { fetchActiveVouchers, applyVoucherAPI, type VoucherItem } from '../../../api/vouchers'
import { useAuth } from '../../../context/AuthContext'
import { cn, fmt } from '../../../lib/utils'

export interface AppliedVoucherItem {
  code: string
  discount_amount: number
  message: string
  title?: string
}

interface VoucherSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  currentSubtotal: number
  appliedVouchers: AppliedVoucherItem[]
  onApplyVouchers: (vouchers: AppliedVoucherItem[]) => void
  onRemoveAllVouchers: () => void
  isDark: boolean
}

export default function VoucherSelectorModal({
  isOpen,
  onClose,
  currentSubtotal,
  appliedVouchers,
  onApplyVouchers,
  onRemoveAllVouchers,
  isDark,
}: VoucherSelectorModalProps) {
  const { user } = useAuth()
  const [manualCode, setManualCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(() => new Set(appliedVouchers.map((v) => v.code)))

  // Sync selected codes on open
  useEffect(() => {
    if (isOpen) {
      setSelectedCodes(new Set(appliedVouchers.map((v) => v.code)))
      setErrorMsg('')
    }
  }, [isOpen, appliedVouchers])

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['activeVouchers'],
    queryFn: fetchActiveVouchers,
    enabled: isOpen,
    staleTime: 60 * 1000,
  })

  if (!isOpen) return null

  // Format date helper
  const formatExpiry = (expiryStr?: string | null) => {
    if (!expiryStr) return 'Không thời hạn'
    try {
      const d = new Date(expiryStr)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return expiryStr
    }
  }

  // Calculate discount for a list of codes
  const calculateDiscountsForCodes = (codesSet: Set<string>): { list: AppliedVoucherItem[]; totalDisc: number } => {
    let runningAmount = currentSubtotal
    let totalDisc = 0
    const list: AppliedVoucherItem[] = []

    for (const code of codesSet) {
      const v = vouchers.find((item) => item.code.toUpperCase() === code.toUpperCase())
      if (v) {
        const isPercent = v.discount_type === 'percent'
        const val = Number(v.discount_value)
        let disc = isPercent ? (runningAmount * val) / 100 : val
        if (isPercent && v.max_discount && disc > Number(v.max_discount)) {
          disc = Number(v.max_discount)
        }
        disc = Math.min(disc, runningAmount)
        if (disc > 0) {
          totalDisc += disc
          runningAmount = Math.max(0, runningAmount - disc)
          list.push({
            code: v.code,
            discount_amount: disc,
            message: `Giảm ${fmt(disc)} (${v.code})`,
            title: v.title,
          })
        }
      }
    }

    return { list, totalDisc }
  }

  const { list: calculatedAppliedList, totalDisc: previewTotalDiscount } = calculateDiscountsForCodes(selectedCodes)

  const handleToggleCode = (code: string) => {
    setErrorMsg('')
    setSelectedCodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  // Handle manual code addition
  const handleAddManualCode = async () => {
    if (!manualCode.trim()) return
    setErrorMsg('')
    setIsApplying(true)

    const codeUpper = manualCode.trim().toUpperCase()

    try {
      const res = await applyVoucherAPI(codeUpper, currentSubtotal)
      if (res.valid) {
        setSelectedCodes((prev) => new Set(prev).add(res.code))
        setManualCode('')
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện.'
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setIsApplying(false)
    }
  }

  const handleConfirmSelection = () => {
    onApplyVouchers(calculatedAppliedList)
    onClose()
  }

  // Split vouchers into eligible and ineligible
  const eligibleVouchers: { voucher: VoucherItem; missingAmount: number }[] = []
  const ineligibleVouchers: { voucher: VoucherItem; missingAmount: number; reason: string }[] = []

  vouchers.forEach((v) => {
    const minSpend = Number(v.min_spend) || 0
    const missing = minSpend - currentSubtotal

    if (missing > 0) {
      ineligibleVouchers.push({
        voucher: v,
        missingAmount: missing,
        reason: `Cần mua thêm ${fmt(missing)} để sử dụng`,
      })
    } else {
      eligibleVouchers.push({
        voucher: v,
        missingAmount: 0,
      })
    }
  })

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          'relative w-full max-w-xl rounded-3xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all my-auto',
          isDark
            ? 'bg-[#12121c] border-white/15 text-[#f0ede8]'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'px-6 py-4 border-b flex items-center justify-between shrink-0',
            isDark ? 'border-white/10 bg-[#161622]' : 'border-slate-200 bg-slate-50'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#e8b84b]">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base sm:text-lg">
                CineVerse Voucher
              </h3>
              <p className={cn('text-xs font-mono-data', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                Bạn có thể tích chọn 1 hoặc nhiều mã giảm giá cùng lúc
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all cursor-pointer',
              isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Manual Code Section (Shopee Search / Apply Bar) */}
        <div className={cn('p-4 px-6 border-b shrink-0', isDark ? 'border-white/10 bg-[#14141e]' : 'border-slate-100 bg-amber-50/40')}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase())
                  setErrorMsg('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddManualCode()
                  }
                }}
                placeholder="Nhập mã voucher (vd: WELCOME10, CINEVIP)"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border text-xs font-mono-data uppercase font-bold outline-none transition-all',
                  isDark
                    ? 'bg-[#09090e] border-white/15 text-[#f0ede8] focus:border-[#e8b84b]'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs'
                )}
              />
              {manualCode && (
                <button
                  type="button"
                  onClick={() => setManualCode('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddManualCode}
              disabled={!manualCode.trim() || isApplying}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#e8b84b] hover:bg-[#f5c759] text-[#09090e] cursor-pointer disabled:opacity-50 transition-all shadow-md shrink-0 inline-flex items-center gap-1.5"
            >
              {isApplying ? (
                'Đang kiểm tra...'
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Mã</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <p className="text-[11px] text-red-500 font-bold mt-2 flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}
        </div>

        {/* Voucher List Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
          {isLoading ? (
            <div className="py-12 text-center text-xs font-mono-data animate-pulse space-y-3 opacity-70 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <div>Đang tải danh sách voucher ưu đãi...</div>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="py-12 text-center text-xs space-y-2 opacity-70 flex flex-col items-center justify-center">
              <Ticket className="w-10 h-10 text-zinc-500" />
              <div className="font-bold">Hiện chưa có voucher khả dụng nào</div>
              <p className="text-[11px] opacity-80">Bạn vẫn có thể nhập mã giảm giá trực tiếp ở thanh trên.</p>
            </div>
          ) : (
            <>
              {/* Eligible Vouchers Section */}
              {eligibleVouchers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-black uppercase tracking-wider', isDark ? 'text-[#e8b84b]' : 'text-amber-700')}>
                      Mã giảm giá khả dụng ({eligibleVouchers.length})
                    </span>
                    <span className="text-[11px] font-mono-data opacity-70">
                      Đơn hiện tại: {fmt(currentSubtotal)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {eligibleVouchers.map(({ voucher }) => {
                      const isSelected = selectedCodes.has(voucher.code)
                      const isPercent = voucher.discount_type === 'percent'
                      const val = Number(voucher.discount_value)

                      return (
                        <div
                          key={voucher.id}
                          onClick={() => handleToggleCode(voucher.code)}
                          className={cn(
                            'relative flex rounded-2xl border transition-all duration-150 cursor-pointer overflow-hidden group shadow-sm select-none',
                            isSelected
                              ? isDark
                                ? 'border-[#e8b84b] bg-[#e8b84b]/12 ring-2 ring-[#e8b84b]/30'
                                : 'border-amber-500 bg-amber-50 ring-2 ring-amber-400/40 shadow-md'
                              : isDark
                              ? 'border-white/10 bg-[#161624] hover:border-white/20 hover:bg-[#1a1a2c]'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          {/* Left Ticket Notch */}
                          <div
                            className={cn(
                              'w-24 sm:w-28 p-3 flex flex-col items-center justify-center text-center border-r border-dashed shrink-0 relative',
                              isDark
                                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-white/20 text-[#e8b84b]'
                                : 'bg-gradient-to-br from-amber-500/15 to-amber-600/5 border-amber-300 text-amber-800'
                            )}
                          >
                            <span className="font-mono-data text-base sm:text-lg font-black leading-tight">
                              {isPercent ? `${val}%` : `${val >= 1000 ? `${val / 1000}K` : `${val}đ`}`}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-0.5">
                              GIẢM
                            </span>

                            {/* Ticket Notch Holes */}
                            <div className={cn('absolute -top-2 -right-2 w-4 h-4 rounded-full border', isDark ? 'bg-[#12121c] border-white/10' : 'bg-white border-slate-200')} />
                            <div className={cn('absolute -bottom-2 -right-2 w-4 h-4 rounded-full border', isDark ? 'bg-[#12121c] border-white/10' : 'bg-white border-slate-200')} />
                          </div>

                          {/* Right Content */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono-data font-black text-xs sm:text-sm text-[#e8b84b]">
                                  {voucher.code}
                                </span>

                                {/* Checkbox Indicator */}
                                <div
                                  className={cn(
                                    'w-5 h-5 rounded-lg flex items-center justify-center font-bold text-xs border transition-all',
                                    isSelected
                                      ? 'bg-[#e8b84b] border-[#e8b84b] text-[#09090e] shadow-xs'
                                      : isDark
                                      ? 'border-white/20 bg-white/5 text-transparent'
                                      : 'border-slate-300 bg-white text-transparent'
                                  )}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>

                              <p className={cn('text-xs font-semibold mt-0.5 line-clamp-1', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                                {voucher.title || `Giảm ${isPercent ? `${val}%` : fmt(val)} cho đơn từ ${fmt(Number(voucher.min_spend) || 0)}`}
                              </p>

                              <div className={cn('text-[11px] font-mono-data mt-1 space-y-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                                <div>• Đơn tối thiểu: {fmt(Number(voucher.min_spend) || 0)}</div>
                                {voucher.max_discount && isPercent && (
                                  <div>• Giảm tối đa: {fmt(Number(voucher.max_discount))}</div>
                                )}
                                {voucher.min_loyalty_tier && (
                                  <div>• Hạng áp dụng: <span className="font-bold text-amber-500 uppercase">{voucher.min_loyalty_tier}</span></div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] font-mono-data opacity-75">
                              <span>HSD: {formatExpiry(voucher.expiry_date)}</span>
                              <span className={cn('font-bold', isSelected ? 'text-emerald-400' : 'text-[#e8b84b]')}>
                                {isSelected ? 'Đã tích chọn ✓' : '+ Chọn mã'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Ineligible Vouchers Section */}
              {ineligibleVouchers.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className={cn('text-xs font-black uppercase tracking-wider opacity-60', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                    Chưa đủ điều kiện sử dụng ({ineligibleVouchers.length})
                  </span>

                  <div className="space-y-2.5 opacity-60">
                    {ineligibleVouchers.map(({ voucher, reason }) => {
                      const isPercent = voucher.discount_type === 'percent'
                      const val = Number(voucher.discount_value)

                      return (
                        <div
                          key={voucher.id}
                          className={cn(
                            'relative flex rounded-2xl border overflow-hidden cursor-not-allowed',
                            isDark ? 'border-white/5 bg-[#14141e]' : 'border-slate-200 bg-slate-100'
                          )}
                        >
                          {/* Left Ticket Notch */}
                          <div className="w-24 sm:w-28 p-3 flex flex-col items-center justify-center text-center border-r border-dashed border-white/10 shrink-0 bg-black/20">
                            <span className="font-mono-data text-base font-black leading-tight">
                              {isPercent ? `${val}%` : `${val >= 1000 ? `${val / 1000}K` : `${val}đ`}`}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                              GIẢM
                            </span>
                          </div>

                          {/* Right Content */}
                          <div className="p-3.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-mono-data font-black text-xs">
                                {voucher.code}
                              </span>
                              <span className="text-[10px] text-amber-500 font-bold">
                                {reason}
                              </span>
                            </div>
                            <p className="text-xs mt-0.5 line-clamp-1">
                              {voucher.title || `Giảm ${isPercent ? `${val}%` : fmt(val)} cho đơn từ ${fmt(Number(voucher.min_spend) || 0)}`}
                            </p>
                            <div className="text-[10px] font-mono-data opacity-70 mt-1">
                              HSD: {formatExpiry(voucher.expiry_date)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky Footer Summary (Shopee Style) */}
        <div
          className={cn(
            'px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0',
            isDark ? 'border-white/10 bg-[#161622]' : 'border-slate-200 bg-slate-50'
          )}
        >
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <div>
              <div className="text-xs font-medium">
                Đã chọn: <span className="font-bold text-amber-500 font-mono-data">{selectedCodes.size} mã</span>
              </div>
              <div className="font-mono-data font-black text-emerald-500 text-sm sm:text-base">
                - {fmt(previewTotalDiscount)}
              </div>
            </div>

            {selectedCodes.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCodes(new Set())
                  onRemoveAllVouchers()
                }}
                className="text-xs font-bold text-red-500 hover:underline cursor-pointer bg-transparent border-0"
              >
                Gỡ tất cả
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-300 hover:bg-slate-200 text-slate-700'
              )}
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleConfirmSelection}
              className="flex-1 sm:flex-initial px-8 py-2.5 rounded-xl text-xs font-black bg-[#e8b84b] hover:bg-[#f5c759] text-[#09090e] cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Áp Dụng {selectedCodes.size > 0 ? `(${selectedCodes.size} mã)` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
