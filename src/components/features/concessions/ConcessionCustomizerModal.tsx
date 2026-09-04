import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Popcorn,
  CupSoda,
  UtensilsCrossed,
  Cookie,
  X,
  Check,
  Plus,
  Minus,
  SlidersHorizontal,
  Scale,
} from 'lucide-react'
import type { Concession } from '../../../api/concessions'
import { useTheme } from '../../../context/ThemeContext'
import { fmt } from '../../../lib/utils'

interface ConcessionCustomizerModalProps {
  concession: Concession
  variants?: Concession[]
  allConcessions?: Concession[]
  isOpen: boolean
  onClose: () => void
  onConfirm: (item: {
    concession: Concession
    quantity: number
    customOptions: string
    unitPrice: number
  }) => void
}

const DEFAULT_POPCORNS = [
  {
    id: 'sweet',
    name: 'Bắp Rang Ngọt',
    extraPrice: 0,
    imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=500',
  },
  {
    id: 'caramel',
    name: 'Bắp Rang Ngọt Vị Caramel',
    extraPrice: 10000,
    imageUrl: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=500',
  },
  {
    id: 'cheese',
    name: 'Bắp rang vị phô mai',
    extraPrice: 10000,
    imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=500',
  },
]

const DEFAULT_DRINKS = [
  {
    id: 'coca',
    name: 'Cốc nước ngọt CocaCola',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500',
  },
  {
    id: 'pepsi',
    name: 'Cốc nước ngọt Pepsi',
    imageUrl: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=500',
  },
  {
    id: '7up',
    name: 'Cốc nước ngọt SevenUp',
    imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=500',
  },
  {
    id: 'mirinda',
    name: 'Cốc nước cam Mirinda',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500',
  },
  {
    id: 'water',
    name: 'Nước lọc đóng chai Aquafina',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500',
  },
]

const SIZE_TIERS: { size: 'S' | 'M' | 'L'; label: string; extraPrice: number }[] = [
  { size: 'S', label: 'Size S', extraPrice: 0 },
  { size: 'M', label: 'Size M', extraPrice: 5000 },
  { size: 'L', label: 'Size L', extraPrice: 10000 },
]

export default function ConcessionCustomizerModal({
  concession,
  variants = [],
  allConcessions = [],
  isOpen,
  onClose,
  onConfirm,
}: ConcessionCustomizerModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const lowerName = (concession.name + ' ' + (concession.description || '')).toLowerCase()
  const isCombo = concession.category === 'combo' || lowerName.includes('combo')

  // Available size variants from Admin (if standalone multi-size item)
  const availableVariants = useMemo(() => {
    if (variants && variants.length > 0) return variants
    return [concession]
  }, [variants, concession])

  const hasAdminSizes = availableVariants.length > 1 || (availableVariants.length === 1 && Boolean(availableVariants[0].size))
  const [selectedVariantId, setSelectedVariantId] = useState<number>(concession.id)

  useEffect(() => {
    setSelectedVariantId(concession.id)
  }, [concession])

  const currentVariant = useMemo(() => {
    return availableVariants.find((v) => v.id === selectedVariantId) || concession
  }, [availableVariants, selectedVariantId, concession])

  // Detect Popcorn count for Combo (e.g. Combo Gia Đình 4 Người có 2 bắp)
  const popcornCount = useMemo(() => {
    if (!isCombo) return 0
    if (
      lowerName.includes('2 bắp') ||
      lowerName.includes('2 bắp lớn') ||
      lowerName.includes('2 hộp bắp') ||
      lowerName.includes('gia đình') ||
      lowerName.includes('family') ||
      lowerName.includes('4 người')
    ) {
      return 2
    }
    if (lowerName.includes('bắp') || lowerName.includes('popcorn') || isCombo) {
      return 1
    }
    return 0
  }, [isCombo, lowerName])

  // Detect Drink count for Combo
  const drinkCount = useMemo(() => {
    if (!isCombo) return 0
    if (
      lowerName.includes('4 người') ||
      lowerName.includes('4 nước') ||
      lowerName.includes('4 ly') ||
      lowerName.includes('family') ||
      lowerName.includes('gia đình') ||
      lowerName.includes('4')
    ) {
      return 4
    }
    if (lowerName.includes('3 nước') || lowerName.includes('3 ly') || lowerName.includes('3 người') || lowerName.includes('3')) {
      return 3
    }
    if (
      lowerName.includes('2 nước') ||
      lowerName.includes('2 ly') ||
      lowerName.includes('couple') ||
      lowerName.includes('duo') ||
      lowerName.includes('2 người') ||
      lowerName.includes('2')
    ) {
      return 2
    }
    if (lowerName.includes('1 nước') || lowerName.includes('1 ly') || lowerName.includes('solo') || lowerName.includes('1')) {
      return 1
    }
    return 2
  }, [isCombo, lowerName])

  // Synchronize Popcorns with Admin DB Active Popcorns
  const systemPopcorns = useMemo(() => {
    const fromSys = allConcessions.filter((c) => c.category === 'popcorn' && c.is_active)
    if (fromSys.length > 0) {
      // Find min price of the base/standard popcorn (e.g. Bắp Rang Ngọt)
      const basePopcorns = fromSys.filter(p => !p.name.toLowerCase().includes('caramel') && !p.name.toLowerCase().includes('phô mai'))
      const baseMinPrice = basePopcorns.length > 0 ? Math.min(...basePopcorns.map(p => Number(p.price))) : 40000

      // Group unique flavors by base name
      const map = new Map<string, { id: string; name: string; extraPrice: number; imageUrl: string }>()
      for (const p of fromSys) {
        const base = p.name.replace(/\s*\((size\s*)?[smlxvừa lớn]+\)\s*$/i, '').trim()
        if (!map.has(base.toLowerCase())) {
          const itemPrices = fromSys.filter(x => x.name.toLowerCase().includes(base.toLowerCase())).map(x => Number(x.price))
          const itemMinPrice = itemPrices.length > 0 ? Math.min(...itemPrices) : Number(p.price)
          const diff = Math.max(0, itemMinPrice - baseMinPrice)

          map.set(base.toLowerCase(), {
            id: String(p.id),
            name: base,
            extraPrice: diff,
            imageUrl: p.image_url || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=500',
          })
        }
      }
      return Array.from(map.values())
    }
    return DEFAULT_POPCORNS
  }, [allConcessions])

  // Synchronize Drinks with Admin DB Active Drinks
  const systemDrinks = useMemo(() => {
    const fromSys = allConcessions.filter((c) => c.category === 'drink' && c.is_active)
    if (fromSys.length > 0) {
      return fromSys.map((c) => ({
        id: String(c.id),
        name: c.name,
        imageUrl: c.image_url || 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500',
      }))
    }
    return DEFAULT_DRINKS
  }, [allConcessions])

  // Synchronize Snacks with Admin DB Active Snacks
  const systemSnacks = useMemo(() => {
    const fromSys = allConcessions.filter((c) => c.category === 'snack' && c.is_active)
    if (fromSys.length > 0) return fromSys
    return [
      {
        id: 991,
        name: "Snack Lay's vị nguyên bản",
        price: 20000,
        image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500',
      } as Concession,
      {
        id: 992,
        name: "Snack Lay's vị phô mai",
        price: 20000,
        image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500',
      } as Concession,
    ]
  }, [allConcessions])

  // Synchronize Food with Admin DB Active Foods
  const systemFoods = useMemo(() => {
    const fromSys = allConcessions.filter((c) => c.category === 'food' && c.is_active)
    if (fromSys.length > 0) return fromSys
    return [
      {
        id: 993,
        name: 'Xúc Xích Đức Nướng',
        price: 35000,
        image_url: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=500',
      } as Concession,
      {
        id: 994,
        name: 'Bánh Hotdog Phô Mai',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=500',
      } as Concession,
      {
        id: 995,
        name: 'Khoai Tây Chiên Giòn',
        price: 35000,
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500',
      } as Concession,
    ]
  }, [allConcessions])

  // State for Popcorns in Combo: Array of { flavorId, size }
  const [comboPopcorns, setComboPopcorns] = useState<{ flavorId: string; size: 'S' | 'M' | 'L' }[]>([])

  useEffect(() => {
    if (isCombo && popcornCount > 0 && systemPopcorns.length > 0) {
      setComboPopcorns(
        Array.from({ length: popcornCount }, (_, idx) => ({
          flavorId: systemPopcorns[idx % systemPopcorns.length]?.id || systemPopcorns[0]?.id || 'sweet',
          size: 'M',
        }))
      )
    }
  }, [isCombo, popcornCount, systemPopcorns])

  // State for Drinks in Combo: Array of { drinkId, size }
  const [comboDrinks, setComboDrinks] = useState<{ drinkId: string; size: 'S' | 'M' | 'L' }[]>([])

  useEffect(() => {
    if (isCombo && drinkCount > 0 && systemDrinks.length > 0) {
      setComboDrinks(
        Array.from({ length: drinkCount }, (_, idx) => ({
          drinkId: systemDrinks[idx % systemDrinks.length]?.id || systemDrinks[0]?.id || 'coca',
          size: 'M',
        }))
      )
    }
  }, [isCombo, drinkCount, systemDrinks])

  // Snack and Food Toggles & Selections (For Combos only)
  const [includeSnack, setIncludeSnack] = useState(false)
  const [selectedSnackId, setSelectedSnackId] = useState<number>(systemSnacks[0]?.id || 0)

  const [includeFood, setIncludeFood] = useState(false)
  const [selectedFoodId, setSelectedFoodId] = useState<number>(systemFoods[0]?.id || 0)

  const [quantity, setQuantity] = useState(1)

  // Calculate Unit Price
  const unitPrice = useMemo(() => {
    if (isCombo) {
      let price = Number(concession.price) || 0

      // Popcorn flavor extras & size adjustments
      comboPopcorns.forEach((pop) => {
        const pObj = systemPopcorns.find((p) => p.id === pop.flavorId)
        if (pObj) price += pObj.extraPrice
        if (pop.size === 'L') price += 5000
      })

      // Drink size adjustments
      comboDrinks.forEach((drk) => {
        if (drk.size === 'L') price += 5000
      })

      // Add-on snack
      if (includeSnack) {
        const foundSnack = systemSnacks.find((s) => s.id === selectedSnackId)
        if (foundSnack) price += Number(foundSnack.price)
      }

      // Add-on food
      if (includeFood) {
        const foundFood = systemFoods.find((f) => f.id === selectedFoodId)
        if (foundFood) price += Number(foundFood.price)
      }

      return price
    } else {
      // Standalone concession: price of the selected size variant from Admin
      return Number(currentVariant.price) || 0
    }
  }, [
    isCombo,
    concession.price,
    comboPopcorns,
    systemPopcorns,
    comboDrinks,
    includeSnack,
    selectedSnackId,
    systemSnacks,
    includeFood,
    selectedFoodId,
    systemFoods,
    currentVariant.price,
  ])

  if (!isOpen) return null

  function handleSave() {
    const parts: string[] = []

    if (isCombo) {
      // 1. Popcorn options with size
      if (comboPopcorns.length === 1) {
        const pObj = systemPopcorns.find((p) => p.id === comboPopcorns[0].flavorId)
        parts.push(`Bắp: ${pObj?.name || 'Bắp Rang Ngọt'} (Size ${comboPopcorns[0].size})`)
      } else if (comboPopcorns.length > 1) {
        const popNames = comboPopcorns.map((pop, idx) => {
          const pObj = systemPopcorns.find((p) => p.id === pop.flavorId)
          return `Bắp ${idx + 1}: ${pObj?.name || 'Bắp Rang Ngọt'} (Size ${pop.size})`
        })
        parts.push(popNames.join(' • '))
      }

      // 2. Drinks options with size
      if (comboDrinks.length > 0) {
        const drinkNames = comboDrinks.map((d, idx) => {
          const dObj = systemDrinks.find((item) => item.id === d.drinkId)
          return `Nước ${idx + 1}: ${dObj?.name || 'Nước ngọt'} (Size ${d.size})`
        })
        parts.push(drinkNames.join(' • '))
      }

      // 3. Add-ons
      if (includeSnack) {
        const foundSnack = systemSnacks.find((s) => s.id === selectedSnackId)
        if (foundSnack) parts.push(`+ Snack ${foundSnack.name}`)
      }

      if (includeFood) {
        const foundFood = systemFoods.find((f) => f.id === selectedFoodId)
        if (foundFood) parts.push(`+ ${foundFood.name}`)
      }

      const customOptions = parts.join(' • ')
      onConfirm({
        concession,
        quantity,
        customOptions,
        unitPrice,
      })
    } else {
      // Standalone concession
      let customOptions = ''
      if (currentVariant.size) {
        customOptions = `Size ${currentVariant.size}`
      }
      onConfirm({
        concession: currentVariant,
        quantity,
        customOptions,
        unitPrice,
      })
    }

    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors my-auto ${
          isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between border-b shrink-0 transition-colors ${
            isDark ? 'border-white/10 bg-[#161622]/80' : 'border-slate-200 bg-slate-50/90'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-[#e8b84b]/15 border-[#e8b84b]/30 text-[#e8b84b]' : 'bg-amber-100 border-amber-300 text-amber-800'
            }`}>
              <Popcorn className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-display font-black text-base sm:text-lg leading-tight ${
                isDark ? 'text-[#f0ede8]' : 'text-slate-900'
              }`}>
                Tùy chọn: {concession.name}
              </h3>
              <p className={`text-xs ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                {isCombo
                  ? `Tùy chọn ${popcornCount > 0 ? `${popcornCount} bắp, ` : ''}${drinkCount} nước uống và món ăn kèm`
                  : hasAdminSizes
                  ? 'Chọn kích cỡ và số lượng'
                  : 'Chọn số lượng phần ăn'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/15 text-[#a09e9a]'
                : 'bg-slate-200/80 hover:bg-slate-300 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Options */}
        <div className="p-4 sm:p-5 space-y-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-amber-500/30">
          {/* ========================================================================= */}
          {/* CASE 1: COMBO CUSTOMIZATION (Bắp + Nước + Size + Addons)                   */}
          {/* ========================================================================= */}
          {isCombo && (
            <>
              {/* Popcorn Slots (Bắp 1, Bắp 2, ...) */}
              {popcornCount > 0 &&
                comboPopcorns.map((popItem, pIdx) => (
                  <div
                    key={pIdx}
                    className={`p-3.5 rounded-2xl border space-y-3 transition-colors ${
                      isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-[#e8b84b]' : 'text-amber-700'
                      }`}>
                        <Popcorn className="w-3.5 h-3.5" />
                        <span>
                          {popcornCount > 1
                            ? `Bắp Rang Thứ ${pIdx + 1}:`
                            : 'Chọn Vị Bắp Rang:'}
                        </span>
                      </label>
                      <span className={`text-[11px] font-bold ${
                        isDark ? 'text-[#e8b84b]' : 'text-amber-800'
                      }`}>
                        Size {popItem.size}
                      </span>
                    </div>

                    {/* Flavor Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {systemPopcorns.map((f) => {
                        const isSelected = popItem.flavorId === f.id
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              const updated = [...comboPopcorns]
                              updated[pIdx] = { ...updated[pIdx], flavorId: f.id }
                              setComboPopcorns(updated)
                            }}
                            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                              isSelected
                                ? isDark
                                  ? 'bg-[#e8b84b]/15 border-[#e8b84b] text-[#e8b84b] shadow-[0_0_12px_rgba(232,184,75,0.2)]'
                                  : 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-400 shadow-sm'
                                : isDark
                                ? 'bg-[#09090e] border-white/10 text-[#a09e9a] hover:border-white/20'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <img
                              src={f.imageUrl}
                              alt={f.name}
                              className="w-11 h-11 rounded-xl object-cover shrink-0 border border-black/10"
                            />
                            <div className="min-w-0 flex-1">
                              <div className={`text-xs font-bold line-clamp-1 ${
                                isSelected ? (isDark ? 'text-[#e8b84b]' : 'text-amber-950') : (isDark ? 'text-[#f0ede8]' : 'text-slate-800')
                              }`}>
                                {f.name}
                              </div>
                              <div className={`text-[11px] font-mono-data font-semibold ${
                                isDark ? 'text-amber-400' : 'text-amber-700'
                              }`}>
                                {f.extraPrice > 0 ? `+${fmt(f.extraPrice)}` : 'Mặc định'}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Popcorn Size Selector */}
                    <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                        Kích cỡ bắp {popcornCount > 1 ? `#${pIdx + 1}` : ''}:
                      </span>
                      <div className="flex gap-1.5">
                        {SIZE_TIERS.map((s) => {
                          const isSizeSelected = popItem.size === s.size
                          return (
                            <button
                              key={s.size}
                              type="button"
                              onClick={() => {
                                const updated = [...comboPopcorns]
                                updated[pIdx] = { ...updated[pIdx], size: s.size }
                                setComboPopcorns(updated)
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                isSizeSelected
                                  ? isDark
                                    ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm'
                                    : 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black'
                                  : isDark
                                  ? 'bg-white/5 text-[#a09e9a] border-white/10 hover:border-white/20'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {s.size}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}

              {/* Drink Slots (Nước 1..N) with Independent Size Selector */}
              {comboDrinks.map((drinkItem, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border space-y-3 transition-colors ${
                    isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? 'text-[#e8b84b]' : 'text-amber-700'
                    }`}>
                      <CupSoda className="w-3.5 h-3.5" />
                      <span>
                        {comboDrinks.length > 1
                          ? `Nước Uống Thứ ${idx + 1}:`
                          : 'Chọn Nước Uống:'}
                      </span>
                    </label>
                    <span className={`text-[11px] font-bold ${
                      isDark ? 'text-blue-400' : 'text-blue-800'
                    }`}>
                      Size {drinkItem.size}
                    </span>
                  </div>

                  {/* Drink Photo Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {systemDrinks.map((d) => {
                      const isSelected = drinkItem.drinkId === d.id
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            const updated = [...comboDrinks]
                            updated[idx] = { ...updated[idx], drinkId: d.id }
                            setComboDrinks(updated)
                          }}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            isSelected
                              ? isDark
                                ? 'bg-blue-500/15 border-blue-400 text-blue-300 font-bold shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                                : 'bg-blue-50 border-blue-500 text-blue-950 font-bold ring-2 ring-blue-400 shadow-sm'
                              : isDark
                              ? 'bg-[#09090e] border-white/10 text-[#a09e9a] hover:border-white/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <img
                            src={d.imageUrl}
                            alt={d.name}
                            className="w-10 h-10 rounded-lg object-cover border border-black/10"
                          />
                          <span className={`text-[10px] truncate w-full font-bold ${
                            isSelected ? (isDark ? 'text-blue-300' : 'text-blue-950') : (isDark ? 'text-[#f0ede8]' : 'text-slate-800')
                          }`}>
                            {d.name}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.2 rounded-full font-bold inline-flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Đã chọn
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Drink Size Selector */}
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                      Kích cỡ nước {comboDrinks.length > 1 ? `#${idx + 1}` : ''}:
                    </span>
                    <div className="flex gap-1.5">
                      {SIZE_TIERS.map((s) => {
                        const isSizeSelected = drinkItem.size === s.size
                        return (
                          <button
                            key={s.size}
                            type="button"
                            onClick={() => {
                              const updated = [...comboDrinks]
                              updated[idx] = { ...updated[idx], size: s.size }
                              setComboDrinks(updated)
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isSizeSelected
                                ? isDark
                                  ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm'
                                  : 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black'
                                : isDark
                                ? 'bg-white/5 text-[#a09e9a] border-white/10 hover:border-white/20'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {s.size}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add-ons (Snack & Food) */}
              <div className="space-y-3 pt-2 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-[#e8b84b]' : 'text-amber-700'
                  }`}>
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Thêm Món Ăn Kèm (Tùy Chọn):</span>
                  </label>
                  <span className={`text-[11px] ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                    Có thể chọn Snack, Đồ Ăn hoặc cả 2
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIncludeSnack(!includeSnack)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      includeSnack
                        ? isDark
                          ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                          : 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400 shadow-sm'
                        : isDark
                        ? 'bg-[#09090e] border-white/10 text-[#a09e9a] hover:border-white/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Cookie className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold">Thêm Snack</span>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs font-black ${
                        includeSnack ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-black/20 dark:border-white/20'
                      }`}
                    >
                      {includeSnack ? <Check className="w-3 h-3 stroke-[3]" /> : ''}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeFood(!includeFood)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      includeFood
                        ? isDark
                          ? 'bg-orange-500/15 border-orange-400 text-orange-300 font-bold shadow-sm'
                          : 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-2 ring-orange-400 shadow-sm'
                        : isDark
                        ? 'bg-[#09090e] border-white/10 text-[#a09e9a] hover:border-white/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-bold">Thêm Đồ Ăn</span>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs font-black ${
                        includeFood ? 'bg-orange-500 border-orange-500 text-white' : 'border-black/20 dark:border-white/20'
                      }`}
                    >
                      {includeFood ? <Check className="w-3 h-3 stroke-[3]" /> : ''}
                    </span>
                  </button>
                </div>

                {includeSnack && (
                  <div className={`p-3 rounded-2xl border space-y-2 animate-in fade-in duration-150 ${
                    isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/80 border-emerald-300'
                  }`}>
                    <span className={`text-[11px] font-bold block uppercase ${
                      isDark ? 'text-emerald-400' : 'text-emerald-800'
                    }`}>
                      Chọn Loại Snack Trong Hệ Thống:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {systemSnacks.map((snk) => {
                        const isSelected = selectedSnackId === snk.id
                        return (
                          <button
                            key={snk.id}
                            type="button"
                            onClick={() => setSelectedSnackId(snk.id)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                              isSelected
                                ? isDark
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold'
                                  : 'bg-white border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400'
                                : isDark
                                ? 'bg-[#111118] border-white/10 text-[#a09e9a]'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={snk.image_url || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500'}
                              alt={snk.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-black/10"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold truncate">{snk.name}</div>
                              <div className={`text-[10px] font-mono-data font-bold ${
                                isDark ? 'text-emerald-400' : 'text-emerald-700'
                              }`}>
                                +{fmt(Number(snk.price))}
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {includeFood && (
                  <div className={`p-3 rounded-2xl border space-y-2 animate-in fade-in duration-150 ${
                    isDark ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50/80 border-orange-300'
                  }`}>
                    <span className={`text-[11px] font-bold block uppercase ${
                      isDark ? 'text-orange-400' : 'text-orange-800'
                    }`}>
                      Chọn Loại Đồ Ăn Trong Hệ Thống:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {systemFoods.map((fd) => {
                        const isSelected = selectedFoodId === fd.id
                        return (
                          <button
                            key={fd.id}
                            type="button"
                            onClick={() => setSelectedFoodId(fd.id)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                              isSelected
                                ? isDark
                                  ? 'bg-orange-500/20 border-orange-400 text-orange-200 font-bold'
                                  : 'bg-white border-orange-500 text-orange-950 font-bold ring-2 ring-orange-400'
                                : isDark
                                ? 'bg-[#111118] border-white/10 text-[#a09e9a]'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={fd.image_url || 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=500'}
                              alt={fd.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-black/10"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold truncate">{fd.name}</div>
                              <div className={`text-[10px] font-mono-data font-bold ${
                                isDark ? 'text-orange-400' : 'text-orange-700'
                              }`}>
                                +{fmt(Number(fd.price))}
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 stroke-[3]" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* CASE 2: STANDALONE ITEM WITH ACTUAL ADMIN SIZES                            */}
          {/* ========================================================================= */}
          {!isCombo && (
            <div className="space-y-4">
              <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <img
                  src={
                    currentVariant.image_url ||
                    variants.find((v) => Boolean(v.image_url))?.image_url ||
                    concession.image_url ||
                    'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=500'
                  }
                  alt={concession.name}
                  className="w-16 h-16 rounded-xl object-cover border border-black/10 shrink-0"
                />
                <div>
                  <h4 className={`font-bold text-sm ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                    {concession.name}
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
                    {concession.description || 'Sản phẩm phục vụ tại quầy'}
                  </p>
                  <span className={`font-mono-data font-bold text-sm mt-1 block ${
                    isDark ? 'text-[#e8b84b]' : 'text-amber-600'
                  }`}>
                    {fmt(Number(currentVariant.price))}
                  </span>
                </div>
              </div>

              {availableVariants.length > 1 ? (
                <div className="space-y-2.5">
                  <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isDark ? 'text-[#e8b84b]' : 'text-amber-700'
                  }`}>
                    <Scale className="w-3.5 h-3.5" />
                    <span>Chọn Kích Cỡ Có Sẵn Tại Rạp:</span>
                  </label>
                  <div className={`grid gap-2.5 ${availableVariants.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {availableVariants.map((v) => {
                      const isSelected = selectedVariantId === v.id
                      const sizeLabel = v.size ? `Size ${v.size}` : 'Tiêu chuẩn'
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? isDark
                                ? 'bg-[#e8b84b]/15 border-[#e8b84b] text-[#e8b84b] font-bold shadow-[0_0_12px_rgba(232,184,75,0.2)]'
                                : 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-400 shadow-sm'
                              : isDark
                              ? 'bg-[#09090e] border-white/10 text-[#a09e9a] hover:border-white/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs font-bold">{sizeLabel}</span>
                          <span className={`text-[11px] font-mono-data font-semibold ${
                            isDark ? 'text-[#e8b84b]' : 'text-amber-700'
                          }`}>
                            {fmt(Number(v.price))}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : availableVariants[0]?.size ? (
                <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-500'}>Kích cỡ tiêu chuẩn:</span>
                  <span className={`font-bold ${isDark ? 'text-[#e8b84b]' : 'text-amber-700'}`}>Size {availableVariants[0].size}</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-3 border-t border-black/10 dark:border-white/10">
            <span className={`text-xs font-bold ${isDark ? 'text-[#f0ede8]' : 'text-slate-800'}`}>Số lượng:</span>
            <div
              className={`flex items-center gap-3 rounded-2xl border p-1 ${
                isDark ? 'bg-[#09090e] border-white/10' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-[#e8b84b]' : 'bg-white hover:bg-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className={`font-mono-data font-bold text-sm min-w-[24px] text-center ${
                isDark ? 'text-[#e8b84b]' : 'text-amber-800'
              }`}>
                {quantity}
              </span>
              <button
                type="button"
                disabled={quantity >= 10}
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-[#e8b84b]' : 'bg-white hover:bg-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Confirm */}
        <div
          className={`p-4 sm:p-5 border-t flex items-center justify-between gap-4 shrink-0 transition-colors ${
            isDark ? 'border-white/10 bg-[#09090e]/90' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div>
            <span className={`text-[11px] block ${isDark ? 'text-[#a09e9a]' : 'text-slate-500'}`}>
              Tổng tiền ({quantity} phần):
            </span>
            <span className={`font-mono-data font-black text-lg sm:text-xl ${
              isDark ? 'text-[#e8b84b]' : 'text-amber-600'
            }`}>
              {fmt(unitPrice * quantity)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 max-w-[260px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Thêm vào đơn đặt vé</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
