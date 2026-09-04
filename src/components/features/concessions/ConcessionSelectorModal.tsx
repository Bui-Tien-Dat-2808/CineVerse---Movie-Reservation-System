import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Sparkles,
  Popcorn,
  CupSoda,
  UtensilsCrossed,
  Cookie,
  X,
  Plus,
  Minus,
  SlidersHorizontal,
  ShoppingBag,
  Check,
  Layers,
} from 'lucide-react'
import {
  fetchActiveConcessions,
  groupConcessions,
  type Concession,
  type GroupedConcession,
} from '../../../api/concessions'
import { useBooking } from '../../../context/BookingContext'
import ConcessionCustomizerModal from './ConcessionCustomizerModal'
import { cn, fmt } from '../../../lib/utils'

const CATEGORY_TABS = [
  { id: 'all', label: 'Tất cả', Icon: Sparkles },
  { id: 'combo', label: 'Combo Tiết Kiệm', Icon: Layers },
  { id: 'popcorn', label: 'Bắp Rang', Icon: Popcorn },
  { id: 'drink', label: 'Nước Uống', Icon: CupSoda },
  { id: 'food', label: 'Đồ Ăn Nóng', Icon: UtensilsCrossed },
  { id: 'snack', label: 'Snack Giòn', Icon: Cookie },
]

interface ConcessionSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  isDark: boolean
}

export default function ConcessionSelectorModal({
  isOpen,
  onClose,
  isDark,
}: ConcessionSelectorModalProps) {
  const {
    state,
    setConcession,
    updateConcessionQuantity,
    removeConcession,
    concessionTotal,
  } = useBooking()

  const [activeCategory, setActiveCategory] = useState('all')
  const [customizingGroup, setCustomizingGroup] = useState<GroupedConcession | null>(null)

  const { data: concessions = [], isLoading } = useQuery({
    queryKey: ['activeConcessions'],
    queryFn: fetchActiveConcessions,
    enabled: isOpen,
    staleTime: 60 * 1000,
  })

  // Group concessions by base name
  const grouped = useMemo(() => groupConcessions(concessions), [concessions])

  // Filter by category
  const filteredGroups = useMemo(() => {
    if (activeCategory === 'all') return grouped
    return grouped.filter((g) => g.category === activeCategory)
  }, [grouped, activeCategory])

  // Map each group to its total quantity in cart
  const groupQuantities = useMemo(() => {
    const map = new Map<string, number>()
    for (const [, item] of state.selectedConcessions) {
      const gName = item.concession.name.split(' (')[0].trim()
      map.set(gName, (map.get(gName) ?? 0) + item.quantity)
    }
    return map
  }, [state.selectedConcessions])

  // Total quantity of all concessions
  const totalItemCount = useMemo(() => {
    let count = 0
    for (const [, item] of state.selectedConcessions) {
      count += item.quantity
    }
    return count
  }, [state.selectedConcessions])

  if (!isOpen) return null

  // Quick add handler for direct addition without customization
  const handleQuickAdd = (group: GroupedConcession) => {
    const item = group.variants[0]
    const itemKey = `item_${item.id}`
    const existing = state.selectedConcessions.get(itemKey)
    if (existing) {
      updateConcessionQuantity(itemKey, existing.quantity + 1)
    } else {
      setConcession(item, 1, undefined, item.price, itemKey)
    }
  }

  // Quick decrease handler
  const handleQuickDecrease = (group: GroupedConcession) => {
    const item = group.variants[0]
    const itemKey = `item_${item.id}`
    const existing = state.selectedConcessions.get(itemKey)
    if (existing) {
      if (existing.quantity <= 1) {
        removeConcession(itemKey)
      } else {
        updateConcessionQuantity(itemKey, existing.quantity - 1)
      }
    } else {
      // If there are custom items under this group, decrement the first found one
      const foundEntry = Array.from(state.selectedConcessions.entries()).find(
        ([, val]) => val.concession.name.split(' (')[0].trim() === group.baseName
      )
      if (foundEntry) {
        if (foundEntry[1].quantity <= 1) {
          removeConcession(foundEntry[0])
        } else {
          updateConcessionQuantity(foundEntry[0], foundEntry[1].quantity - 1)
        }
      }
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          'relative w-full max-w-4xl rounded-3xl border shadow-2xl flex flex-col h-[85vh] max-h-[850px] overflow-hidden transition-all my-auto',
          isDark
            ? 'bg-[#11111a] border-white/15 text-[#f0ede8]'
            : 'bg-white border-slate-200 text-slate-900'
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
              <Popcorn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg sm:text-xl">
                Bắp Rang & Combo Nước Uống
              </h3>
              <p className={cn('text-xs font-mono-data', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                Thưởng thức trọn vẹn từng khoảnh khắc phim bom tấn cùng đồ ăn kèm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all cursor-pointer',
              isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div
          className={cn(
            'px-6 py-3 border-b flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none',
            isDark ? 'border-white/10 bg-[#14141e]' : 'border-slate-100 bg-slate-100/60'
          )}
        >
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? grouped.length
                : grouped.filter((g) => g.category === tab.id).length
            const active = activeCategory === tab.id
            const TabIcon = tab.Icon

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0',
                  active
                    ? isDark
                      ? 'bg-[#e8b84b] text-[#09090e] shadow-md scale-[1.02] font-black'
                      : 'bg-amber-500 text-slate-950 shadow-md scale-[1.02] font-black'
                    : isDark
                    ? 'bg-white/5 text-[#a09e9a] hover:bg-white/10 hover:text-[#f0ede8]'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                )}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-mono-data',
                    active ? 'bg-black/20 text-[#09090e]' : 'bg-black/10 text-inherit opacity-70'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Concessions Grid Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin">
          {isLoading ? (
            <div className="py-20 text-center text-xs font-mono-data animate-pulse space-y-3 opacity-70 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <div>Đang tải thực đơn bắp nước...</div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-20 text-center text-xs space-y-2 opacity-70 flex flex-col items-center justify-center">
              <Popcorn className="w-10 h-10 text-zinc-500" />
              <div className="font-bold">Không có món nào trong danh mục này</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((group) => {
                const qty = groupQuantities.get(group.baseName) ?? 0
                const isSelected = qty > 0
                const isCombo = group.category === 'combo'
                const canCustomize = isCombo || group.hasMultipleSizes || group.requiresFlavors

                return (
                  <div
                    key={group.baseName}
                    className={cn(
                      'relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col shadow-sm group',
                      isSelected
                        ? isDark
                          ? 'border-[#e8b84b] bg-[#161626] ring-2 ring-[#e8b84b]/30 shadow-lg'
                          : 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/40 shadow-md'
                        : isDark
                        ? 'border-white/10 bg-[#141420] hover:border-white/20 hover:bg-[#181826]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    )}
                  >
                    {/* Badge Quantity */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 z-10 bg-[#e8b84b] text-[#09090e] font-black text-xs px-2.5 py-0.5 rounded-full shadow-lg">
                        ×{qty}
                      </div>
                    )}

                    {/* Image Thumbnail */}
                    <div className="relative h-36 overflow-hidden bg-slate-900 shrink-0">
                      {group.image_url ? (
                        <img
                          src={group.image_url}
                          alt={group.baseName}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          {isCombo ? <Layers className="w-12 h-12 text-amber-500/40" /> : <Popcorn className="w-12 h-12 text-amber-500/40" />}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h4
                            className={cn(
                              'font-display font-black text-sm leading-tight',
                              isDark ? 'text-[#f0ede8]' : 'text-slate-900'
                            )}
                          >
                            {group.baseName}
                          </h4>
                          {group.hasMultipleSizes && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-[#e8b84b] border border-[#e8b84b]/30 shrink-0">
                              {group.variants.map((v) => v.size).filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>

                        {group.description && (
                          <p
                            className={cn(
                              'text-xs mt-1.5 leading-relaxed line-clamp-2',
                              isDark ? 'text-[#a09e9a]' : 'text-slate-500'
                            )}
                          >
                            {group.description}
                          </p>
                        )}
                      </div>

                      {/* Price & Action Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2 flex-wrap">
                        <span className="font-mono-data font-black text-sm sm:text-base text-[#e8b84b]">
                          {group.minPrice === group.maxPrice
                            ? fmt(group.minPrice)
                            : `${fmt(group.minPrice)} - ${fmt(group.maxPrice)}`}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Option/Customize Button */}
                          {canCustomize && (
                            <button
                              type="button"
                              onClick={() => setCustomizingGroup(group)}
                              className={cn(
                                'px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5',
                                isDark
                                  ? 'bg-white/10 hover:bg-white/20 text-[#f0ede8] border border-white/10'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                              )}
                              title="Tùy chỉnh vị bắp, nước ngọt, size"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span>Tùy chọn</span>
                            </button>
                          )}

                          {/* Quick Add or Quantity Controls */}
                          {isSelected ? (
                            <div className="flex items-center gap-1 bg-black/20 rounded-xl p-0.5 border border-white/10">
                              <button
                                type="button"
                                onClick={() => handleQuickDecrease(group)}
                                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-red-500/30 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-5 text-center font-mono-data text-xs font-black">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickAdd(group)}
                                className="w-6 h-6 rounded-lg bg-[#e8b84b] hover:bg-[#f5c759] text-[#09090e] flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(group)}
                              className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#e8b84b] hover:bg-[#f5c759] text-[#09090e] cursor-pointer shadow-xs transition-all flex items-center gap-1 shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Thêm</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div
          className={cn(
            'px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0',
            isDark ? 'border-white/10 bg-[#161622]' : 'border-slate-200 bg-slate-50 shadow-lg'
          )}
        >
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#e8b84b]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Đã chọn:</span>
                  <span className="font-mono-data font-black text-xs bg-[#e8b84b]/20 text-[#e8b84b] px-2 py-0.5 rounded-md">
                    {totalItemCount} món
                  </span>
                </div>
                <div className="font-mono-data font-black text-base sm:text-lg text-[#e8b84b]">
                  +{fmt(concessionTotal)}
                </div>
              </div>
            </div>
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
              Tiếp tục xem
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-8 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Xác Nhận & Hoàn Tất</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customizer Submodal */}
      {customizingGroup && (
        <ConcessionCustomizerModal
          concession={customizingGroup.variants[0]}
          variants={customizingGroup.variants}
          allConcessions={concessions}
          isOpen={Boolean(customizingGroup)}
          onClose={() => setCustomizingGroup(null)}
          onConfirm={({ concession, quantity, customOptions, unitPrice }) => {
            const itemKey = customOptions
              ? `custom_${concession.id}_${Date.now()}`
              : `item_${concession.id}`
            setConcession(concession, quantity, customOptions, unitPrice, itemKey)
            setCustomizingGroup(null)
          }}
        />
      )}
    </div>,
    document.body
  )
}
