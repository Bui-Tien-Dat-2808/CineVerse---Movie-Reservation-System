import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchActiveConcessions,
  groupConcessions,
  type Concession,
  type GroupedConcession,
} from '../../../api/concessions'
import { useBooking } from '../../../context/BookingContext'
import { useTheme } from '../../../context/ThemeContext'
import ConcessionCustomizerModal from './ConcessionCustomizerModal'
import { fmt } from '../../../lib/utils'

const CATEGORY_TABS = [
  { id: 'all', label: 'Tất cả', emoji: '✨' },
  { id: 'combo', label: 'Combo', emoji: '🍿🥤' },
  { id: 'popcorn', label: 'Bắp Rang', emoji: '🍿' },
  { id: 'drink', label: 'Nước', emoji: '🥤' },
  { id: 'food', label: 'Đồ Ăn', emoji: '🌭' },
  { id: 'snack', label: 'Snack', emoji: '🥔' },
]

function formatPrice(price: number): string {
  return fmt(price)
}

function getCategoryLabel(category: string): { label: string; emoji: string } {
  switch (category) {
    case 'popcorn':
      return { label: 'Bắp Rang', emoji: '🍿' }
    case 'drink':
      return { label: 'Nước', emoji: '🥤' }
    case 'combo':
      return { label: 'Combo', emoji: '🍿🥤' }
    case 'snack':
      return { label: 'Snack', emoji: '🥔' }
    case 'food':
      return { label: 'Đồ Ăn', emoji: '🌭' }
    default:
      return { label: 'Khác', emoji: '🍴' }
  }
}

interface GroupedConcessionCardProps {
  group: GroupedConcession
  totalQuantity: number
  onQuickAdd: (item: Concession) => void
  onOpenCustomize: (group: GroupedConcession) => void
  isDark: boolean
}

function GroupedConcessionCard({
  group,
  totalQuantity,
  onQuickAdd,
  onOpenCustomize,
  isDark,
}: GroupedConcessionCardProps) {
  const cat = getCategoryLabel(group.category)
  const isSelected = totalQuantity > 0
  const isCombo = group.category === 'combo' || group.baseName.toLowerCase().includes('combo')
  const requiresCustomize = isCombo || group.hasMultipleSizes

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
        isSelected
          ? isDark
            ? 'border-[#e8b84b]/60 shadow-[0_0_20px_rgba(232,184,75,0.15)]'
            : 'border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
          : isDark
          ? 'border-white/10 hover:border-white/25'
          : 'border-slate-200 hover:border-slate-300 shadow-sm'
      } ${isDark ? 'bg-[#111118]' : 'bg-white'}`}
    >
      {/* Selected badge */}
      {isSelected && (
        <div className="absolute top-2.5 right-2.5 z-10 bg-[#e8b84b] text-[#09090e] text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md">
          ×{totalQuantity}
        </div>
      )}

      {/* Image */}
      <div className="relative h-32 overflow-hidden bg-slate-800 shrink-0">
        {group.image_url ? (
          <img
            src={group.image_url}
            alt={group.baseName}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {cat.emoji}
          </div>
        )}
        {/* Category badge */}
        <div className="absolute bottom-2 left-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${
              isDark
                ? 'bg-black/60 text-[#e8b84b] border border-[#e8b84b]/30'
                : 'bg-white/80 text-amber-800 border border-amber-200'
            }`}
          >
            {cat.emoji} {cat.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4
              className={`font-display font-bold text-[13px] leading-tight ${
                isDark ? 'text-[#f0ede8]' : 'text-slate-900'
              }`}
            >
              {group.baseName}
            </h4>
            {group.hasMultipleSizes && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-[#e8b84b] border border-[#e8b84b]/30">
                {group.variants.map((v) => v.size).filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          {group.description && (
            <p
              className={`text-[11px] mt-1 leading-relaxed line-clamp-2 ${
                isDark ? 'text-[#a09e9a]' : 'text-slate-500'
              }`}
            >
              {group.description}
            </p>
          )}
        </div>

        {/* Price + Controls */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-mono-data font-bold text-[13px] sm:text-[14px] text-[#e8b84b]">
            {group.minPrice === group.maxPrice
              ? formatPrice(group.minPrice)
              : `${formatPrice(group.minPrice)} - ${formatPrice(group.maxPrice)}`}
          </span>

          <div className="flex items-center gap-1.5">
            {requiresCustomize ? (
              <button
                type="button"
                onClick={() => onOpenCustomize(group)}
                className="h-8 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center bg-[#e8b84b] hover:bg-[#d8a83b] text-[#09090e] shadow-sm whitespace-nowrap shrink-0"
              >
                Tùy chọn
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onQuickAdd(group.primaryConcession)}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center border whitespace-nowrap ${
                  isDark
                    ? 'bg-[#e8b84b]/15 hover:bg-[#e8b84b]/30 text-[#e8b84b] border-[#e8b84b]/30'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                + Thêm
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConcessionPicker() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const {
    state,
    addConcession,
    updateConcessionQuantity,
    removeConcession,
    clearConcessions,
    selectedConcessionsList,
    concessionsTotal,
  } = useBooking()

  const [activeTab, setActiveTab] = useState('all')
  const [customizingGroup, setCustomizingGroup] = useState<GroupedConcession | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  const { data: concessions = [], isLoading } = useQuery<Concession[]>({
    queryKey: ['concessions'],
    queryFn: fetchActiveConcessions,
    staleTime: 5 * 60 * 1000,
  })

  // Group concessions by base name so sizes (M, L) of same popcorn/drink merge into 1 card
  const groupedConcessions = useMemo(() => {
    return groupConcessions(concessions)
  }, [concessions])

  const filteredGroups = useMemo(() => {
    if (activeTab === 'all') return groupedConcessions
    return groupedConcessions.filter((g) => g.category === activeTab)
  }, [groupedConcessions, activeTab])

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: groupedConcessions.length }
    for (const g of groupedConcessions) {
      counts[g.category] = (counts[g.category] || 0) + 1
    }
    return counts
  }, [groupedConcessions])

  // Total quantity for a grouped concession
  const getGroupTotalQty = (group: GroupedConcession): number => {
    const ids = new Set(group.variants.map((v) => v.id))
    return selectedConcessionsList
      .filter((item) => ids.has(item.concession.id))
      .reduce((sum, item) => sum + item.quantity, 0)
  }

  function handleQuickAdd(concession: Concession) {
    addConcession(concession, 1)
  }

  function handleCustomizedConfirm(customItem: {
    concession: Concession
    quantity: number
    customOptions: string
    unitPrice: number
  }) {
    addConcession(
      customItem.concession,
      customItem.quantity,
      customItem.customOptions,
      customItem.unitPrice
    )
  }

  return (
    <div
      className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${
        isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`p-4 sm:p-5 flex items-center justify-between border-b cursor-pointer transition-colors ${
          isDark
            ? 'border-white/10 hover:bg-white/[0.02]'
            : 'border-slate-200 hover:bg-slate-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e8b84b]/15 border border-[#e8b84b]/30 flex items-center justify-center text-xl shrink-0">
            🍿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`font-display font-bold text-base sm:text-lg ${
                  isDark ? 'text-[#f0ede8]' : 'text-slate-900'
                }`}
              >
                Bắp Rang & Nước Uống
              </h3>
              {selectedConcessionsList.length > 0 && (
                <span className="bg-[#e8b84b] text-[#09090e] text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {selectedConcessionsList.reduce((s, i) => s + i.quantity, 0)} món
                </span>
              )}
            </div>
            <p className={`text-xs ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
              Tùy biến vị bắp, loại nước, đồ ăn kèm theo sở thích
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {concessionsTotal > 0 && (
            <span className="font-mono-data font-bold text-sm sm:text-base text-[#e8b84b]">
              +{formatPrice(concessionsTotal)}
            </span>
          )}
          <button
            type="button"
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-transform ${
              isExpanded ? 'rotate-180' : ''
            } ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}
          >
            ▼
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const count = categoryCounts[tab.id] || 0
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm'
                      : isDark
                      ? 'bg-white/5 text-[#a09e9a] border-white/10 hover:text-white hover:border-white/20'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-black/20 text-[#09090e]'
                        : isDark
                        ? 'bg-white/10 text-[#a09e9a]'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Loading / Error / Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className={`h-48 rounded-2xl animate-pulse ${
                    isDark ? 'bg-white/5' : 'bg-slate-100'
                  }`}
                />
              ))}
            </div>
          ) : (
            <>
              {filteredGroups.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`text-xs ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                    Không có sản phẩm nào trong danh mục này.
                  </p>
                </div>
              ) : (
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredGroups.map((group) => (
                    <GroupedConcessionCard
                      key={group.key}
                      group={group}
                      totalQuantity={getGroupTotalQty(group)}
                      onQuickAdd={handleQuickAdd}
                      onOpenCustomize={setCustomizingGroup}
                      isDark={isDark}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Selected Concessions Tray */}
          {selectedConcessionsList.length > 0 && (
            <div
              className={`mt-4 p-4 rounded-2xl border space-y-3 ${
                isDark
                  ? 'bg-amber-500/[0.04] border-amber-500/20'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#e8b84b] flex items-center gap-1.5">
                  <span>🛍️</span>
                  <span>Bắp Nước Đã Chọn:</span>
                </span>
                <button
                  type="button"
                  onClick={clearConcessions}
                  className={`text-[11px] font-semibold transition-colors cursor-pointer ${
                    isDark ? 'text-[#a09e9a] hover:text-rose-400' : 'text-slate-500 hover:text-rose-600'
                  }`}
                >
                  Xóa tất cả
                </button>
              </div>

              <div className="space-y-2">
                {selectedConcessionsList.map((item) => (
                  <div
                    key={item.itemKey}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs gap-3 ${
                      isDark ? 'bg-[#09090e] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate">{item.concession.name}</div>
                      {item.customOptions && (
                        <div className="text-[11px] text-[#e8b84b] font-medium truncate mt-0.5">
                          {item.customOptions}
                        </div>
                      )}
                      <div className="text-[11px] text-[#a09e9a] font-mono-data mt-0.5">
                        {formatPrice(item.unitPrice)} / phần
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono-data font-bold text-[#e8b84b] min-w-[70px] text-right">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>

                      <div
                        className={`flex items-center gap-1 rounded-xl border p-0.5 ${
                          isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => updateConcessionQuantity(item.itemKey, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-[#e8b84b] font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                        >
                          −
                        </button>
                        <span className="font-mono-data font-bold text-xs min-w-[18px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateConcessionQuantity(item.itemKey, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-[#e8b84b] font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeConcession(item.itemKey)}
                        className="text-[#a09e9a] hover:text-rose-400 p-1 text-xs cursor-pointer"
                        title="Xóa"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customizer Modal */}
      {customizingGroup && (
        <ConcessionCustomizerModal
          concession={customizingGroup.primaryConcession}
          variants={customizingGroup.variants}
          allConcessions={concessions}
          isOpen={Boolean(customizingGroup)}
          onClose={() => setCustomizingGroup(null)}
          onConfirm={handleCustomizedConfirm}
        />
      )}
    </div>
  )
}
