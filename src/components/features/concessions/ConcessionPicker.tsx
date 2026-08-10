import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchActiveConcessions, type Concession } from '../../../api/concessions'
import { useBooking } from '../../../context/BookingContext'
import { useTheme } from '../../../context/ThemeContext'

import { fmt } from '../../../lib/utils'

function formatPrice(price: number | string): string {
  const val = typeof price === 'string' ? parseFloat(price) : price
  return isNaN(val) ? '0₫' : fmt(val)
}

function getCategoryLabel(cat: string): { label: string; emoji: string; color: string } {
  switch (cat) {
    case 'combo':
      return { label: 'Combo', emoji: '🍿', color: 'amber' }
    case 'popcorn':
      return { label: 'Bắp Rang', emoji: '🍿', color: 'yellow' }
    case 'drink':
      return { label: 'Nước', emoji: '🥤', color: 'blue' }
    case 'food':
      return { label: 'Đồ Ăn', emoji: '🌭', color: 'orange' }
    case 'snack':
      return { label: 'Snack', emoji: '🧀', color: 'green' }
    default:
      return { label: cat, emoji: '🍴', color: 'gray' }
  }
}

interface ConcessionCardProps {
  item: Concession
  quantity: number
  onQuantityChange: (concession: Concession, qty: number) => void
  isDark: boolean
}

function ConcessionCard({ item, quantity, onQuantityChange, isDark }: ConcessionCardProps) {
  const cat = getCategoryLabel(item.category)
  const isSelected = quantity > 0

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
        <div className="absolute top-2.5 right-2.5 z-10 bg-[#e8b84b] text-[#09090e] text-[11px] font-bold px-2 py-0.5 rounded-full">
          ×{quantity}
        </div>
      )}

      {/* Image */}
      <div className="relative h-36 overflow-hidden bg-slate-800 shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
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
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${
            isDark
              ? 'bg-black/60 text-[#e8b84b] border border-[#e8b84b]/30'
              : 'bg-white/80 text-amber-800 border border-amber-200'
          }`}>
            {cat.emoji} {cat.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <h4 className={`font-display font-bold text-[14px] leading-tight ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
            {item.name}
          </h4>
          {item.description && (
            <p className={`text-[11px] mt-1 leading-relaxed line-clamp-2 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
              {item.description}
            </p>
          )}
        </div>

        {/* Price + Controls */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-mono-data font-bold text-[15px] text-[#e8b84b]">
            {formatPrice(item.price)}
          </span>

          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => onQuantityChange(item, 1)}
              className={`h-8 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center border whitespace-nowrap ${
                isDark
                  ? 'bg-[#e8b84b]/15 hover:bg-[#e8b84b]/30 text-[#e8b84b] border-[#e8b84b]/30'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              + Thêm
            </button>
          ) : (
            <div className={`h-8 flex items-center gap-1.5 rounded-xl border px-1.5 ${
              isDark ? 'bg-[#e8b84b]/10 border-[#e8b84b]/30' : 'bg-amber-50 border-amber-300'
            }`}>
              <button
                type="button"
                onClick={() => onQuantityChange(item, quantity - 1)}
                className="w-5 h-5 rounded-lg bg-white/10 hover:bg-white/20 text-[#e8b84b] font-bold text-xs flex items-center justify-center transition-all cursor-pointer leading-none"
              >
                −
              </button>
              <span className="font-mono-data font-bold text-xs text-[#e8b84b] min-w-[18px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(item, Math.min(quantity + 1, 5))}
                className="w-5 h-5 rounded-lg bg-white/10 hover:bg-white/20 text-[#e8b84b] font-bold text-xs flex items-center justify-center transition-all cursor-pointer leading-none"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConcessionPicker() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { state, concessionTotal, setConcession, clearConcessions } = useBooking()
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categoryTabs = [
    { value: 'all', label: 'Tất cả', emoji: '✨' },
    { value: 'combo', label: 'Combo', emoji: '🍿' },
    { value: 'popcorn', label: 'Bắp Rang', emoji: '🌽' },
    { value: 'drink', label: 'Nước', emoji: '🥤' },
    { value: 'food', label: 'Đồ Ăn', emoji: '🌭' },
    { value: 'snack', label: 'Snack', emoji: '🧀' },
  ]

  const { data: concessions = [], isLoading } = useQuery({
    queryKey: ['concessions'],
    queryFn: fetchActiveConcessions,
    staleTime: 1000 * 60 * 5,
  })

  const filteredConcessions = concessions.filter((item) => {
    if (selectedCategory === 'all') return true
    return item.category === selectedCategory
  })

  const selectedCount = state.selectedConcessions.size
  const hasSelected = selectedCount > 0

  function handleQuantityChange(concession: Concession, qty: number) {
    setConcession(concession, qty)
  }

  return (
    <div className={`rounded-2xl border transition-colors mb-6 ${
      isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-5 cursor-pointer transition-all ${
          isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
        } rounded-2xl`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
            isDark ? 'bg-[#e8b84b]/15' : 'bg-amber-50'
          }`}>
            🍿
          </div>
          <div className="text-left">
            <h3 className={`font-display font-bold text-[15px] ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
              Thêm Bắp Rang, Nước & Snack
            </h3>
            <p className={`text-[12px] ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
              {hasSelected
                ? `Đã chọn ${selectedCount} loại · Tổng cộng: ${fmt(concessionTotal)}`
                : 'Tùy chọn — chọn ngay để nhận combo tại quầy'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasSelected && (
            <span className="bg-[#e8b84b] text-[#09090e] text-[11px] font-bold px-2 py-0.5 rounded-full">
              {selectedCount}
            </span>
          )}
          <span className={`text-lg transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isDark ? 'text-[#a09e9a]' : 'text-slate-400'}`}>
            ▾
          </span>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className={`px-5 pb-5 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          {isLoading ? (
            <div className="text-center py-10">
              <div className="text-2xl animate-spin inline-block">⏳</div>
              <p className={`text-sm mt-2 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Đang tải danh sách...</p>
            </div>
          ) : concessions.length === 0 ? (
            <div className="text-center py-10">
              <p className={`text-sm ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>Hiện chưa có combo nào.</p>
            </div>
          ) : (
            <>
              {/* Category Filter Bar */}
              <div className="pt-4 flex flex-wrap items-center gap-2 pb-1">
                {categoryTabs.map((tab) => {
                  const count = tab.value === 'all'
                    ? concessions.length
                    : concessions.filter(c => c.category === tab.value).length
                  const isActive = selectedCategory === tab.value
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSelectedCategory(tab.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                        isActive
                          ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm'
                          : isDark
                            ? 'bg-[#0d0d14] text-[#a09e9a] border-white/10 hover:text-[#f0ede8] hover:border-white/20'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <span>{tab.emoji} {tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isActive
                          ? 'bg-black/20 text-[#09090e]'
                          : isDark
                            ? 'bg-white/10 text-[#a09e9a]'
                            : 'bg-slate-200 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {filteredConcessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`text-xs ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                    Không có sản phẩm nào trong danh mục này.
                  </p>
                </div>
              ) : (
                <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredConcessions.map((item) => (
                    <ConcessionCard
                      key={item.id}
                      item={item}
                      quantity={state.selectedConcessions.get(item.id)?.quantity ?? 0}
                      onQuantityChange={handleQuantityChange}
                      isDark={isDark}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
