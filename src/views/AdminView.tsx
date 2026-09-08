import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Film,
  Clock,
  Building2,
  Ticket,
  Popcorn,
  Sparkles,
  RotateCcw,
  MessageSquare,
  BarChart3,
  Users,
  Search,
  RefreshCw,
  Plus,
  Eye,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  PlayCircle,
  Archive,
  Filter,
  SlidersHorizontal,
  ShieldCheck,
  QrCode,
  Layers,
  ArrowUpDown,
  Clapperboard,
  Armchair,
  AlertTriangle,
  CheckSquare,
  Square,
  ShieldAlert,
  Check,
  CalendarClock,
  Pencil,
  Crown,
  Heart,
  Baby,
  Ban,
  Info,
  Grid3X3,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  CupSoda,
  Cookie,
  Utensils,
  EyeOff,
  MoreVertical,
  Copy,
  Award,
  History,
  Minus,
  Coins,
  TrendingUp,
  Medal,
  Ribbon,
  Trophy,
  Lock,
  Upload,
  Image as ImageIcon,
  XCircle,
  Key,
  Smartphone,
  ClipboardList,
  Lightbulb,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { apiClient } from '../api/client'
import { fmt, cn, normalizeInternationalName } from '../lib/utils'
import { adjustUserPoints, fetchLoyaltyUsers, fetchUserLoyaltyDetail, type LoyaltyTransaction, type LoyaltyStatus } from '../api/loyalty'
import ReviewManageTab from '../components/admin/ReviewManageTab'
import MovieDetailModal from '../components/admin/MovieDetailModal'
import RefundsAdminTab from '../components/admin/RefundsAdminTab'
import AnalyticsAdminTab from '../components/admin/AnalyticsAdminTab'
import { groupConcessions, type GroupedConcession } from '../api/concessions'
import { CleanDatePicker, toLocalYYYYMMDD, formatVNFullDate } from '../components/common/CleanDatePicker'

interface MovieItem {
  id: number
  title: string
  description?: string
  poster_url?: string
  duration_minutes?: number
  release_date?: string
  status: 'now_showing' | 'coming_soon' | 'ended' | string
  rating?: string
  director?: string
  trailer_url?: string
  cast?: Array<{ name: string; character?: string; profile_url?: string }>
  genres?: Array<{ id?: number; name: string }>
  tmdb_id?: number
}

function buildTrailerEmbedUrl(url: string): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('autoplay', '1')
    parsed.searchParams.set('rel', '0')
    return parsed.toString()
  } catch {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}autoplay=1&rel=0`
  }
}

function renderAgeRatingBadge(rating?: string, isDark: boolean = true) {
  if (!rating) {
    return (
      <span className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono-data font-semibold border',
        isDark ? 'bg-white/5 text-[#a09e9a] border-white/10' : 'bg-slate-100 text-slate-500 border-slate-200'
      )}>
        Chưa phân loại
      </span>
    )
  }
  const r = rating.toUpperCase().trim()
  if (r.includes('18') || r === 'T18' || r === 'C18' || r === 'R' || r === 'NC-17') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-tight bg-rose-500/15 text-rose-500 border border-rose-500/30">
        T18
      </span>
    )
  }
  if (r.includes('16') || r === 'T16' || r === 'C16') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-tight bg-orange-500/15 text-orange-500 border border-orange-500/30">
        T16
      </span>
    )
  }
  if (r.includes('13') || r === 'T13' || r === 'C13' || r === 'PG-13') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-tight bg-amber-500/15 text-amber-500 border border-amber-500/30">
        T13
      </span>
    )
  }
  if (r === 'K' || r.includes('PG')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-tight bg-sky-500/15 text-sky-500 border border-sky-500/30">
        K
      </span>
    )
  }
  if (r === 'P' || r === 'G') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-tight bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
        P
      </span>
    )
  }
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border',
      isDark ? 'bg-white/5 text-[#f0ede8] border-white/15' : 'bg-slate-100 text-slate-700 border-slate-200'
    )}>
      {rating}
    </span>
  )
}

interface SeatItemAdmin {
  id: number
  row_label: string
  col_number: number
  seat_type: 'standard' | 'vip' | 'couple' | string
  width?: number
  is_active?: boolean
}

interface RoomItem {
  id: number
  name: string
  room_type: string
  room_number?: number
  total_rows: number
  total_cols: number
  total_seats: number
  seats?: SeatItemAdmin[]
}

interface ProposedShowtimeItem {
  movie_id: number
  movie_title: string
  room_id: number
  room_name: string
  room_type?: string
  matched_genre?: string
  start_time: string
  end_time: string
  base_price: number
  vip_price: number
}

interface RefundItem {
  id: number
  reservation_id: number
  payment_transaction_id: number
  amount: number
  vnp_request_id: string
  status: 'pending' | 'processing' | 'success' | 'failed' | 'manual_required'
  vnpay_response_code?: string
  vnpay_response_message?: string
  admin_note?: string
  resolved_by_admin_id?: number
  resolved_at?: string
  created_at: string
  ticket_code?: string
  user_email?: string
  user_full_name?: string
  movie_title?: string
  payment_method?: string
  cancellation_reason?: string
}

interface ShowtimeItem {
  id: number
  movie_id: number
  room_id: number
  start_time: string
  end_time: string
  base_price: string | number
  vip_price?: string | number
  status: string
  available_seats?: number
  total_seats?: number
  movie?: { title?: string; poster_url?: string }
  room?: { name?: string; room_type?: string }
}

interface PaginationControlProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

function PaginationControl({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationControlProps) {
  const totalPages = Math.ceil(totalItems / pageSize)
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const paginationRange = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const delta = 1
    const rangeStart = Math.max(2, currentPage - delta)
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta)

    const pages: (number | '...')[] = [1]

    if (rangeStart > 2) {
      pages.push('...')
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i)
    }

    if (rangeEnd < totalPages - 1) {
      pages.push('...')
    }

    pages.push(totalPages)

    return pages
  }, [currentPage, totalPages])

  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 p-4 border-t text-xs transition-colors ${
      isDark ? 'bg-[#161622] border-white/10 text-[#a09e9a]' : 'bg-slate-50 border-slate-200 text-slate-600'
    }`}>
      <div>
        Hiển thị <span className={`font-bold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>{startItem}</span> -{' '}
        <span className={`font-bold ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>{endItem}</span> trên tổng số{' '}
        <span className={`font-bold ${isDark ? 'text-[#e8b84b]' : 'text-amber-600'}`}>{totalItems}</span> bản ghi
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`px-3 py-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-medium ${
            isDark
              ? 'border-white/10 bg-[#111118] text-[#f0ede8] hover:bg-white/10'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          ‹ Trang trước
        </button>

        {paginationRange.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`dots-${idx}`}
                className={`px-1 font-mono-data select-none font-bold text-sm ${isDark ? 'text-[#a09e9a]' : 'text-slate-400'}`}
              >
                ...
              </span>
            )
          }

          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded border font-bold text-xs transition-all cursor-pointer ${
                currentPage === p
                  ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm scale-105 font-black'
                  : isDark
                  ? 'border-white/10 bg-[#111118] text-[#a09e9a] hover:text-[#f0ede8] hover:border-white/20'
                  : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {p}
            </button>
          )
        })}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={`px-3 py-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-medium ${
            isDark
              ? 'border-white/10 bg-[#111118] text-[#f0ede8] hover:bg-white/10'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          Trang sau ›
        </button>
      </div>
    </div>
  )
}

interface VoucherAdminItem {
  id: number
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_spend: number
  max_discount?: number
  expiry_date?: string
  valid_weekdays?: number[]
  max_uses_total?: number
  max_uses_per_user?: number
  min_loyalty_tier?: string
  applicable_scope?: 'all' | 'rooms' | 'concessions' | 'loyalty' | string
  target_room_type?: string
  target_category?: string
  is_active: boolean
  is_first_booking_only?: boolean
}

interface ProposedShowtimeItem {
  movie_id: number
  movie_title: string
  room_id: number
  room_name: string
  start_time: string
  end_time: string
  base_price: number
  vip_price: number
}

// ─────────────────────────────────────────

// ─────────────────────────────────────────
// ImageUploadField — reusable file picker with preview
// ─────────────────────────────────────────
function ImageUploadField({
  value,
  onChange,
  isDark,
  compact = false,
}: {
  value: string
  onChange: (url: string) => void
  isDark: boolean
  compact?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Preview area / drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !value && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden ${
          dragOver
            ? 'border-[#e8b84b] bg-[#e8b84b]/10'
            : isDark ? 'border-white/15 bg-[#0d0d14]' : 'border-slate-200 bg-slate-50'
        } ${compact ? 'h-64' : 'h-72'} ${!value ? 'cursor-pointer' : ''}`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-contain"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/55 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="bg-[#e8b84b] text-[#09090e] text-sm font-bold px-4 py-2 rounded-xl cursor-pointer hover:brightness-110 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Đổi ảnh</span>
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="bg-red-500/80 text-white text-xs font-semibold px-4 py-1.5 rounded-xl cursor-pointer hover:bg-red-500 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xoá ảnh</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2.5">
            <ImageIcon className="w-10 h-10 text-amber-500/50" />
            <p className={`text-xs text-center ${isDark ? 'text-[#6e6c68]' : 'text-slate-400'}`}>
              Kéo thả ảnh vào đây hoặc
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
              className={`text-sm font-bold px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-2 ${
                isDark
                  ? 'bg-[#e8b84b]/15 text-[#e8b84b] hover:bg-[#e8b84b]/25 border border-[#e8b84b]/30'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Chọn tệp ảnh</span>
            </button>
            <p className={`text-[10px] ${isDark ? 'text-[#6e6c68]/60' : 'text-slate-300'}`}>
              JPG, PNG, WEBP — tối đa 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// ─────────────────────────────────────────
// LoyaltyAdminTab — Enterprise Loyalty & Rewards Management

// ─────────────────────────────────────────
// LoyaltyAdminTab — Automated Enterprise Loyalty & Rewards Management
// ─────────────────────────────────────────
function LoyaltyAdminTab({ isDark }: { isDark: boolean }) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTierTab, setSelectedTierTab] = useState<'all' | 'diamond' | 'gold' | 'silver' | 'bronze'>('all')
  const [sortBy, setSortBy] = useState<'points_desc' | 'points_asc' | 'name_asc' | 'created_desc'>('points_desc')
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Auto Rules Configuration Modal State (Centered)
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false)
  const [rulesConfig, setRulesConfig] = useState<{
    spendPerPoint: number
    silverMin: number
    goldMin: number
    diamondMin: number
    autoRevokeOnRefund: boolean
    signupBonusPoints: number
  }>(() => {
    const saved = localStorage.getItem('cineverse_loyalty_rules')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return {
      spendPerPoint: 1000,
      silverMin: 1000,
      goldMin: 5000,
      diamondMin: 10000,
      autoRevokeOnRefund: true,
      signupBonusPoints: 0,
    }
  })

  // Manual Adjust Exception Modal State (Centered)
  const [adjustTargetUser, setAdjustTargetUser] = useState<any | null>(null)
  const [adjustMode, setAdjustMode] = useState<'add' | 'deduct'>('add')
  const [adjustAmount, setAdjustAmount] = useState<string>('100')
  const [adjustReason, setAdjustReason] = useState<string>('Đền bù sự cố trải nghiệm dịch vụ')
  const [adjustCustomReason, setAdjustCustomReason] = useState<string>('')
  const [adjustSubmitting, setAdjustSubmitting] = useState(false)

  // Transaction History Modal State (Centered)
  const [historyTargetUser, setHistoryTargetUser] = useState<any | null>(null)
  const [historyDetail, setHistoryDetail] = useState<LoyaltyStatus | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Popover menu for exceptions
  const [activeMenuUserId, setActiveMenuUserId] = useState<number | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 8

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type })
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr))
    }, 4000)
  }

  // Close modals on Escape key and close popover on outside click
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (adjustTargetUser) setAdjustTargetUser(null)
        if (historyTargetUser) setHistoryTargetUser(null)
        if (isRulesModalOpen) setIsRulesModalOpen(false)
        setActiveMenuUserId(null)
      }
    }
    function handleWindowClick() {
      setActiveMenuUserId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleWindowClick)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleWindowClick)
    }
  }, [adjustTargetUser, historyTargetUser, isRulesModalOpen])

  async function loadUsers() {
    setLoading(true)
    try {
      const data = await fetchLoyaltyUsers()
      setUsers(data || [])
    } catch {
      showToast('Không thể tải danh sách thành viên tích điểm', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Tier configuration constants (Huân chương & Huy chương các hạng)
  const TIER_CONFIG = {
    bronze: {
      key: 'bronze',
      label: 'Hạng Đồng',
      icon: Ribbon,
      badgeColor: 'text-amber-700 dark:text-amber-500 bg-amber-500/10 border-amber-500/25',
      accentColor: '#CD7F32',
      min: 0,
      nextMin: rulesConfig.silverMin,
      nextLabel: 'Hạng Bạc',
    },
    silver: {
      key: 'silver',
      label: 'Hạng Bạc',
      icon: Award,
      badgeColor: 'text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-500/25',
      accentColor: '#94a3b8',
      min: rulesConfig.silverMin,
      nextMin: rulesConfig.goldMin,
      nextLabel: 'Hạng Vàng',
    },
    gold: {
      key: 'gold',
      label: 'Hạng Vàng',
      icon: Medal,
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-[#e8b84b]/15 border-[#e8b84b]/30',
      accentColor: '#e8b84b',
      min: rulesConfig.goldMin,
      nextMin: rulesConfig.diamondMin,
      nextLabel: 'Hạng Kim Cương',
    },
    diamond: {
      key: 'diamond',
      label: 'Hạng Kim Cương',
      icon: Trophy,
      badgeColor: 'text-sky-600 dark:text-sky-400 bg-sky-500/15 border-sky-500/30',
      accentColor: '#38bdf8',
      min: rulesConfig.diamondMin,
      nextMin: rulesConfig.diamondMin,
      nextLabel: null,
    },
  }

  function getTierData(pts: number) {
    if (pts >= rulesConfig.diamondMin) return TIER_CONFIG.diamond
    if (pts >= rulesConfig.goldMin) return TIER_CONFIG.gold
    if (pts >= rulesConfig.silverMin) return TIER_CONFIG.silver
    return TIER_CONFIG.bronze
  }

  function calculateProgress(pts: number) {
    const tier = getTierData(pts)
    if (tier.key === 'diamond') {
      return {
        tier,
        progressPct: 100,
        remaining: 0,
        nextLabel: null,
      }
    }
    const range = tier.nextMin - tier.min
    const progressPct = Math.min(100, Math.max(0, ((pts - tier.min) / range) * 100))
    const remaining = Math.max(0, tier.nextMin - pts)
    return {
      tier,
      progressPct,
      remaining,
      nextLabel: tier.nextLabel,
    }
  }

  // Pre-calculate statistics
  const stats = useMemo(() => {
    const validUsers = users.filter((u) => u.role !== 'admin' && u.role !== 'ADMIN' && !u.email?.toLowerCase().includes('admin'))
    const totalMembers = validUsers.length
    const totalPoints = validUsers.reduce((sum, u) => sum + Number(u.loyalty_points || 0), 0)

    const counts = {
      diamond: validUsers.filter((u) => Number(u.loyalty_points || 0) >= rulesConfig.diamondMin).length,
      gold: validUsers.filter((u) => {
        const p = Number(u.loyalty_points || 0)
        return p >= rulesConfig.goldMin && p < rulesConfig.diamondMin
      }).length,
      silver: validUsers.filter((u) => {
        const p = Number(u.loyalty_points || 0)
        return p >= rulesConfig.silverMin && p < rulesConfig.goldMin
      }).length,
      bronze: validUsers.filter((u) => Number(u.loyalty_points || 0) < rulesConfig.silverMin).length,
    }

    return { totalMembers, totalPoints, counts }
  }, [users, rulesConfig])

  // Filtered & Sorted Users
  const processedUsers = useMemo(() => {
    let result = users.filter((u) => u.role !== 'admin' && u.role !== 'ADMIN' && !u.email?.toLowerCase().includes('admin'))

    // Filter by tier tab
    if (selectedTierTab !== 'all') {
      result = result.filter((u) => {
        const tier = getTierData(Number(u.loyalty_points || 0))
        return tier.key === selectedTierTab
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (u) =>
          (u.full_name && u.full_name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone_number && u.phone_number.includes(q)) ||
          String(u.id).includes(q)
      )
    }

    // Sort
    result.sort((a, b) => {
      const ptsA = Number(a.loyalty_points || 0)
      const ptsB = Number(b.loyalty_points || 0)
      if (sortBy === 'points_desc') return ptsB - ptsA
      if (sortBy === 'points_asc') return ptsA - ptsB
      if (sortBy === 'name_asc') return (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '')
      if (sortBy === 'created_desc') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      return 0
    })

    return result
  }, [users, selectedTierTab, searchQuery, sortBy, rulesConfig])

  // Paginated records
  const totalPages = Math.ceil(processedUsers.length / PAGE_SIZE) || 1
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return processedUsers.slice(start, start + PAGE_SIZE)
  }, [processedUsers, currentPage])

  // Open transaction history modal
  async function handleOpenHistory(user: any) {
    setHistoryTargetUser(user)
    setHistoryDetail(null)
    setHistoryLoading(true)
    try {
      const detail = await fetchUserLoyaltyDetail(user.id)
      setHistoryDetail(detail)
    } catch {
      showToast('Không thể tải lịch sử giao dịch điểm của thành viên', 'error')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Open exception adjust modal
  function handleOpenAdjust(user: any) {
    setAdjustTargetUser(user)
    setAdjustMode('add')
    setAdjustAmount('100')
    setAdjustReason('Đền bù sự cố trải nghiệm dịch vụ')
    setAdjustCustomReason('')
    setActiveMenuUserId(null)
  }

  // Submit point adjustment (Exception only)
  async function handleSaveAdjustment(e: React.FormEvent) {
    e.preventDefault()
    if (!adjustTargetUser) return

    const parsedPts = parseInt(adjustAmount, 10)
    if (isNaN(parsedPts) || parsedPts <= 0) {
      showToast('Vui lòng nhập số điểm hợp lệ (> 0)', 'error')
      return
    }

    const finalPoints = adjustMode === 'add' ? parsedPts : -parsedPts
    const currentPts = Number(adjustTargetUser.loyalty_points || 0)

    if (adjustMode === 'deduct' && parsedPts > currentPts) {
      showToast(`Không thể trừ quá số điểm hiện có (${currentPts.toLocaleString('vi-VN')} điểm)`, 'error')
      return
    }

    const reasonText = adjustReason === 'Khác' ? adjustCustomReason.trim() : adjustReason
    if (!reasonText) {
      showToast('Vui lòng cung cấp lý do điều chỉnh điểm', 'error')
      return
    }

    setAdjustSubmitting(true)
    try {
      await adjustUserPoints({
        user_id: adjustTargetUser.id,
        points: finalPoints,
        reason: `[Điều chỉnh ngoại lệ] ${reasonText}`,
      })
      showToast(
        `Đã ${adjustMode === 'add' ? 'cộng' : 'khấu trừ'} thành công ${parsedPts.toLocaleString('vi-VN')} điểm cho "${adjustTargetUser.full_name || adjustTargetUser.email}"`
      )
      setAdjustTargetUser(null)
      await loadUsers()
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Lỗi khi điều chỉnh điểm thưởng thành viên', 'error')
    } finally {
      setAdjustSubmitting(false)
    }
  }

  // Save rules config
  function handleSaveRules(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem('cineverse_loyalty_rules', JSON.stringify(rulesConfig))
    showToast('Đã lưu cấu hình quy tắc tích điểm tự động thành công')
    setIsRulesModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-[120] px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 border',
            notification.type === 'success'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
              : 'bg-rose-600 text-white border-rose-400'
          )}
        >
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div
        className={cn(
          'p-5 sm:p-6 rounded-2xl border transition-all shadow-sm',
          isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span
              className={cn(
                'p-3 rounded-2xl flex items-center justify-center text-amber-500',
                isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
              )}
            >
              <Award className="w-6 h-6 stroke-[2]" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={cn('font-display font-black text-xl sm:text-2xl', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                  Quản Lý Tích Điểm & Thành Viên
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Vận hành tự động</span>
                </span>
              </div>
              <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                Điểm thưởng tự động cộng khi mua vé và tự động nâng hạng thành viên theo cơ chế toàn hệ thống.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsRulesModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#e8b84b] hover:bg-[#dfad3e] text-[#09090e] transition-all cursor-pointer select-none shadow-sm"
              title="Xem và cấu hình quy tắc tích điểm tự động"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Cấu Hình Quy Tắc Tự Động</span>
            </button>

            <button
              type="button"
              onClick={loadUsers}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none shadow-xs',
                isDark
                  ? 'bg-white/5 border-white/10 text-[#f0ede8] hover:bg-white/10'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              )}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Làm Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── BỘ LỌC DUY NHẤT: 5 THẺ PHÂN HẠNG TƯƠNG TÁC (LOẠI BỎ HÀNG DUPLICATE) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Tất Cả Thành Viên */}
        <div
          onClick={() => {
            setSelectedTierTab('all')
            setCurrentPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            selectedTierTab === 'all'
              ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/10'
              : isDark
              ? 'bg-[#111118] border-white/10 hover:border-amber-500/40'
              : 'bg-white border-slate-200 hover:border-amber-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-bold uppercase tracking-wider', selectedTierTab === 'all' ? 'text-amber-500 font-black' : isDark ? 'text-slate-300' : 'text-slate-700')}>
              Tất Cả Thành Viên
            </span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', selectedTierTab === 'all' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white/5 border-white/10 text-amber-500')}>
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-amber-500">{stats.totalMembers}</div>
            <span className="text-[10px] font-semibold opacity-70">Toàn rạp</span>
          </div>
          <p className={cn('text-[11px] mt-1 truncate', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
            {stats.totalPoints.toLocaleString('vi-VN')} điểm lưu hành
          </p>
        </div>

        {/* Card 2: Hạng Kim Cương */}
        <div
          onClick={() => {
            setSelectedTierTab('diamond')
            setCurrentPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            selectedTierTab === 'diamond'
              ? 'ring-2 ring-sky-500 border-sky-500 bg-sky-500/10'
              : isDark
              ? 'bg-[#111118] border-white/10 hover:border-sky-500/40'
              : 'bg-white border-slate-200 hover:border-sky-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-500">Kim Cương</span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', selectedTierTab === 'diamond' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-sky-500/15 border-sky-500/30 text-sky-400')}>
              <Trophy className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-sky-400">{stats.counts.diamond}</div>
            <span className="text-[10px] font-semibold opacity-70">Từ 10.000+ đ</span>
          </div>
          <p className={cn('text-[11px] mt-1 truncate', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>Khách hàng VIP cao nhất</p>
        </div>

        {/* Card 3: Hạng Vàng */}
        <div
          onClick={() => {
            setSelectedTierTab('gold')
            setCurrentPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            selectedTierTab === 'gold'
              ? 'ring-2 ring-[#e8b84b] border-[#e8b84b] bg-[#e8b84b]/10'
              : isDark
              ? 'bg-[#111118] border-white/10 hover:border-[#e8b84b]/40'
              : 'bg-white border-slate-200 hover:border-amber-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Hạng Vàng</span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', selectedTierTab === 'gold' ? 'bg-[#e8b84b] text-slate-950 border-[#e8b84b]' : 'bg-[#e8b84b]/15 border-[#e8b84b]/30 text-amber-400')}>
              <Medal className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-[#e8b84b]">{stats.counts.gold}</div>
            <span className="text-[10px] font-semibold opacity-70">5.000 – 9.999 đ</span>
          </div>
          <p className={cn('text-[11px] mt-1 truncate', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>Hội viên thân thiết Gold</p>
        </div>

        {/* Card 4: Hạng Bạc */}
        <div
          onClick={() => {
            setSelectedTierTab('silver')
            setCurrentPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            selectedTierTab === 'silver'
              ? 'ring-2 ring-slate-400 border-slate-400 bg-slate-500/10'
              : isDark
              ? 'bg-[#111118] border-white/10 hover:border-white/25'
              : 'bg-white border-slate-200 hover:border-slate-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-slate-300' : 'text-slate-700')}>Hạng Bạc</span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', selectedTierTab === 'silver' ? 'bg-slate-400 text-slate-950 border-slate-300' : 'bg-slate-500/15 border-slate-500/30 text-slate-400')}>
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className={cn('font-display font-black text-2xl sm:text-3xl', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
              {stats.counts.silver}
            </div>
            <span className="text-[10px] font-semibold opacity-70">1.000 – 4.999 đ</span>
          </div>
          <p className={cn('text-[11px] mt-1 truncate', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>Hội viên tích cực</p>
        </div>

        {/* Card 5: Hạng Đồng */}
        <div
          onClick={() => {
            setSelectedTierTab('bronze')
            setCurrentPage(1)
          }}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md select-none',
            selectedTierTab === 'bronze'
              ? 'ring-2 ring-amber-700 border-amber-700 bg-amber-700/10'
              : isDark
              ? 'bg-[#111118] border-white/10 hover:border-amber-700/40'
              : 'bg-white border-slate-200 hover:border-amber-700/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-500">Hạng Đồng</span>
            <span className={cn('p-1.5 rounded-xl border transition-transform group-hover:scale-110', selectedTierTab === 'bronze' ? 'bg-amber-700 text-white border-amber-600' : 'bg-amber-700/15 border-amber-700/30 text-amber-600 dark:text-amber-400')}>
              <Ribbon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="font-display font-black text-2xl sm:text-3xl text-amber-700 dark:text-amber-500">{stats.counts.bronze}</div>
            <span className="text-[10px] font-semibold opacity-70">Dưới 1.000 đ</span>
          </div>
          <p className={cn('text-[11px] mt-1 truncate', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>Hội viên mới</p>
        </div>
      </div>

      {/* ── BANNER QUY TẮC TỰ ĐỘNG HÓA 100% ── */}
      <div
        className={cn(
          'p-4 rounded-2xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs',
          isDark ? 'bg-amber-500/5 border-amber-500/20 text-[#f0ede8]' : 'bg-amber-50/80 border-amber-200 text-amber-950'
        )}
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </span>
          <div>
            <span className="font-bold block text-amber-500">Cơ Chế Tích Điểm Tự Động Toàn Hệ Thống:</span>
            <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-600'}>
              Mỗi đơn đặt vé thành công tự động tích lũy <strong className="text-amber-500 font-mono-data">1 điểm / {rulesConfig.spendPerPoint.toLocaleString('vi-VN')}₫</strong> và tự động thăng hạng theo mốc điểm. Khi hủy vé, hệ thống tự động thu hồi điểm.
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Sort Only (Tabs removed to eliminate duplicate filter) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a09e9a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Tìm theo tên khách hàng, email, số điện thoại..."
            className={cn(
              'w-full pl-9 pr-8 py-2.5 rounded-xl border text-xs outline-none transition-all',
              isDark
                ? 'bg-[#111118] border-white/10 text-[#f0ede8] placeholder:text-[#6e6c68] focus:border-[#e8b84b]'
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 shadow-2xs'
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a09e9a] hover:text-[#f0ede8] p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Active Filter & Sort Dropdown */}
        <div className="flex items-center gap-2.5">
          {selectedTierTab !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedTierTab('all')}
              className="text-xs font-semibold text-amber-500 hover:underline cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Bỏ lọc hạng</span>
            </button>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={cn(
              'px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none cursor-pointer',
              isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
            )}
          >
            <option value="points_desc">Điểm: Cao nhất</option>
            <option value="points_asc">Điểm: Thấp nhất</option>
            <option value="name_asc">Tên: A → Z</option>
            <option value="created_desc">Mới tham gia</option>
          </select>
        </div>
      </div>

      {/* Member Cards List */}
      {loading ? (
        <div
          className={cn(
            'p-12 text-center rounded-2xl border space-y-3',
            isDark ? 'bg-[#111118] border-white/10 text-[#a09e9a]' : 'bg-white border-slate-200 text-slate-500'
          )}
        >
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
          <p className="text-xs font-semibold">Đang đồng bộ dữ liệu tích điểm tự động từ cơ sở dữ liệu...</p>
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div
          className={cn(
            'p-14 text-center rounded-2xl border space-y-3',
            isDark ? 'bg-[#111118] border-white/10 text-[#a09e9a]' : 'bg-white border-slate-200 text-slate-500'
          )}
        >
          <Award className="w-10 h-10 mx-auto opacity-30 text-amber-500 mb-1" />
          <p className="text-sm font-bold">Không tìm thấy thành viên nào phù hợp</p>
          <p className="text-xs opacity-75">Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn phân hạng khác.</p>
          {(searchQuery || selectedTierTab !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedTierTab('all')
                setCurrentPage(1)
              }}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer"
            >
              Đặt Lại Bộ Lọc
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedUsers.map((user) => {
            const pts = Number(user.loyalty_points || 0)
            const progress = calculateProgress(pts)
            const TierIcon = progress.tier.icon
            const firstLetter = (user.full_name || user.email || 'U').charAt(0).toUpperCase()

            return (
              <div
                key={user.id}
                className={cn(
                  'p-4 sm:p-5 rounded-2xl border transition-all shadow-xs hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4',
                  isDark ? 'bg-[#111118] border-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300'
                )}
              >
                {/* Left: User Avatar & Identification */}
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-base shrink-0 shadow-inner"
                    style={{
                      backgroundColor: `${progress.tier.accentColor}18`,
                      border: `1.5px solid ${progress.tier.accentColor}40`,
                      color: progress.tier.accentColor,
                    }}
                  >
                    {firstLetter}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('font-bold text-sm truncate', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                        {user.full_name || 'Khách xem phim'}
                      </span>

                      <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1', progress.tier.badgeColor)}>
                        <TierIcon className="w-3 h-3" />
                        <span>{progress.tier.label}</span>
                      </span>

                      <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                        <span>Tự động</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      <span className={cn('truncate', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>{user.email}</span>
                      {user.phone_number && (
                        <>
                          <span className="opacity-30">•</span>
                          <span className={cn('font-mono-data text-[11px]', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                            {user.phone_number}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Points & Progress Bar */}
                <div className="flex-1 max-w-xl min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold opacity-80">Điểm tích lũy:</span>
                      <span className="font-mono-data font-black text-base sm:text-lg text-[#e8b84b]">
                        {pts.toLocaleString('vi-VN')}
                      </span>
                      <span className="text-[11px] font-bold text-amber-500">điểm</span>
                    </div>

                    <div className="text-[11px] font-semibold text-right">
                      {progress.nextLabel ? (
                        <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-500'}>
                          Còn thiếu <strong className="text-amber-500 font-mono-data">{progress.remaining.toLocaleString('vi-VN')}</strong> điểm →{' '}
                          <span className="font-bold">{progress.nextLabel}</span>
                        </span>
                      ) : (
                        <span className="text-sky-400 font-bold inline-flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          <span>Hạng Kim Cương cao nhất</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-100 border border-slate-200')}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress.progressPct}%`,
                        backgroundColor: progress.tier.accentColor,
                      }}
                    />
                  </div>
                </div>

                {/* Right: Automated Actions (View History is Primary) */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center relative">
                  <button
                    type="button"
                    onClick={() => handleOpenHistory(user)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#e8b84b] hover:bg-[#dfad3e] text-[#09090e] transition-all cursor-pointer shadow-xs"
                    title="Xem lịch sử tự động tích điểm từ các đơn vé"
                  >
                    <History className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Lịch Sử Tích Điểm</span>
                  </button>

                  {/* Secondary More Options Button for Exceptions */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenuUserId(activeMenuUserId === user.id ? null : user.id)
                      }}
                      className={cn(
                        'p-2 rounded-xl border transition-all cursor-pointer',
                        isDark ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-[#f0ede8]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      )}
                      title="Tùy chọn can thiệp ngoại lệ"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuUserId === user.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'absolute right-0 mt-1.5 w-52 rounded-xl border shadow-xl p-1 z-30 animate-in fade-in zoom-in-95 duration-150',
                          isDark ? 'bg-[#161622] border-white/15 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-800'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(user)}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer',
                            isDark ? 'hover:bg-white/10 text-amber-400' : 'hover:bg-amber-50 text-amber-700'
                          )}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Bù điểm sự cố (Ngoại lệ)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          <span className={cn('text-xs font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
            Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} – {Math.min(currentPage * PAGE_SIZE, processedUsers.length)} trong tổng số{' '}
            <strong className={isDark ? 'text-[#f0ede8]' : 'text-slate-800'}>{processedUsers.length}</strong> thành viên
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                isDark ? 'bg-white/5 border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-700'
              )}
            >
              Trước
            </button>

            <span className="text-xs font-semibold px-2">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                isDark ? 'bg-white/5 border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-700'
              )}
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* ── CENTERED MODAL: CẤU HÌNH QUY TẮC TÍCH ĐIỂM TỰ ĐỘNG (CHÍNH GIỮA MÀN HÌNH) ── */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div onClick={() => setIsRulesModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" />

          <div
            className={cn(
              'relative z-10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border overflow-hidden animate-in zoom-in-95 fade-in duration-200',
              isDark ? 'bg-[#111118] border-white/15 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className={cn('p-2.5 rounded-2xl text-amber-500', isDark ? 'bg-amber-500/10' : 'bg-amber-50')}>
                  <SlidersHorizontal className="w-5 h-5 stroke-[2.5]" />
                </span>
                <div>
                  <h3 className={cn('font-display font-black text-lg', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    Cấu Hình Quy Tắc Tích Điểm Tự Động
                  </h3>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                    Hệ thống tự động áp dụng các quy tắc này khi khách hàng đặt vé hoặc hủy vé
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className={cn('p-2 rounded-xl text-[#a09e9a] hover:text-[#f0ede8] transition-colors cursor-pointer', isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form id="rules-config-form" onSubmit={handleSaveRules} className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Section 1: Tỷ lệ tích điểm tự động theo đơn hàng */}
              <div className="space-y-3">
                <h4 className={cn('text-xs font-bold uppercase tracking-wider pb-1 border-b border-white/5 flex items-center gap-2', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  <span>1. Tỷ Lệ Tích Điểm Tự Động Khi Đặt Vé</span>
                </h4>

                <div>
                  <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                    Mức Chi Tiêu Quy Đổi 1 Điểm (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="100"
                      step="100"
                      required
                      value={rulesConfig.spendPerPoint}
                      onChange={(e) => setRulesConfig({ ...rulesConfig, spendPerPoint: Number(e.target.value) })}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl border text-sm font-mono-data font-bold outline-none transition-all',
                        isDark ? 'bg-[#09090e] border-white/15 text-[#f0ede8] focus:border-[#e8b84b]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                      )}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold opacity-60">VNĐ / 1 Điểm</span>
                  </div>
                  <p className={cn('text-[11px] mt-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                    Ví dụ: Đơn vé 100.000 VNĐ → Tự động tích lũy <strong className="text-amber-500 font-mono-data">{Math.floor(100000 / (rulesConfig.spendPerPoint || 1000))} điểm</strong> ngay khi thanh toán thành công.
                  </p>
                </div>
              </div>

              {/* Section 2: Mốc điểm thăng hạng tự động */}
              <div className="space-y-3">
                <h4 className={cn('text-xs font-bold uppercase tracking-wider pb-1 border-b border-white/5 flex items-center gap-2', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  <span>2. Mốc Điểm Thăng Hạng Tự Động</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={cn('text-xs font-bold block mb-1 text-slate-400 flex items-center gap-1')}>
                      <Award className="w-3.5 h-3.5" />
                      <span>Hạng Bạc (Tối thiểu)</span>
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      required
                      value={rulesConfig.silverMin}
                      onChange={(e) => setRulesConfig({ ...rulesConfig, silverMin: Number(e.target.value) })}
                      className={cn(
                        'w-full px-3 py-2 rounded-xl border text-xs font-mono-data font-bold outline-none',
                        isDark ? 'bg-[#09090e] border-white/15 text-[#f0ede8]' : 'bg-slate-50 border-slate-300 text-slate-900'
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn('text-xs font-bold block mb-1 text-amber-500 flex items-center gap-1')}>
                      <Medal className="w-3.5 h-3.5" />
                      <span>Hạng Vàng (Tối thiểu)</span>
                    </label>
                    <input
                      type="number"
                      min="500"
                      step="100"
                      required
                      value={rulesConfig.goldMin}
                      onChange={(e) => setRulesConfig({ ...rulesConfig, goldMin: Number(e.target.value) })}
                      className={cn(
                        'w-full px-3 py-2 rounded-xl border text-xs font-mono-data font-bold outline-none',
                        isDark ? 'bg-[#09090e] border-white/15 text-[#f0ede8]' : 'bg-slate-50 border-slate-300 text-slate-900'
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn('text-xs font-bold block mb-1 text-sky-400 flex items-center gap-1')}>
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Kim Cương (Tối thiểu)</span>
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      required
                      value={rulesConfig.diamondMin}
                      onChange={(e) => setRulesConfig({ ...rulesConfig, diamondMin: Number(e.target.value) })}
                      className={cn(
                        'w-full px-3 py-2 rounded-xl border text-xs font-mono-data font-bold outline-none',
                        isDark ? 'bg-[#09090e] border-white/15 text-[#f0ede8]' : 'bg-slate-50 border-slate-300 text-slate-900'
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Quy tắc tự động hoàn điểm & thưởng đăng ký */}
              <div className="space-y-3">
                <h4 className={cn('text-xs font-bold uppercase tracking-wider pb-1 border-b border-white/5 flex items-center gap-2', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  <span>3. Tự Động Xử Lý Khi Hủy Vé & Chống Gian Lận</span>
                </h4>

                <div className={cn('p-3.5 rounded-xl border flex items-center justify-between', isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200')}>
                  <div>
                    <span className={cn('text-xs font-bold block', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                      Tự Động Thu Hồi Điểm Khi Vé Bị Hủy / Hoàn Tiền
                    </span>
                    <span className={cn('text-[11px]', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                      Tự động khấu trừ lại số điểm đã cộng của đơn vé khi khách yêu cầu hủy vé hoặc hoàn tiền
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={rulesConfig.autoRevokeOnRefund}
                    onChange={(e) => setRulesConfig({ ...rulesConfig, autoRevokeOnRefund: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 accent-[#e8b84b] cursor-pointer"
                  />
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all',
                  isDark ? 'bg-white/10 hover:bg-white/15 text-[#a09e9a]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                )}
              >
                Đóng
              </button>

              <button
                form="rules-config-form"
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#e8b84b] hover:bg-[#dfad3e] text-[#09090e] transition-all cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Lưu Cấu Hình Quy Tắc</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CENTERED MODAL: TRANSACTION HISTORY (LỊCH SỬ TÍCH ĐIỂM TỰ ĐỘNG) ── */}
      {historyTargetUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div onClick={() => setHistoryTargetUser(null)} className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" />

          <div
            className={cn(
              'relative z-10 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col border overflow-hidden animate-in zoom-in-95 fade-in duration-200',
              isDark ? 'bg-[#111118] border-white/15 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            {/* History Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className={cn('p-2.5 rounded-2xl text-amber-500', isDark ? 'bg-amber-500/10' : 'bg-amber-50')}>
                  <History className="w-5 h-5" />
                </span>
                <div>
                  <h3 className={cn('font-display font-black text-lg', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    Lịch Sử Tích Điểm Thành Viên
                  </h3>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                    Thành viên: <strong className="text-amber-500">{historyTargetUser.full_name || historyTargetUser.email}</strong> • Hiện có{' '}
                    <strong className="font-mono-data">{Number(historyTargetUser.loyalty_points || 0).toLocaleString('vi-VN')}</strong> điểm
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHistoryTargetUser(null)}
                className={cn('p-2 rounded-xl text-[#a09e9a] hover:text-[#f0ede8] transition-colors cursor-pointer', isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* History Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {historyLoading ? (
                <div className="py-12 text-center text-xs space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                  <p className="font-semibold">Đang tải lịch sử giao dịch điểm tự động...</p>
                </div>
              ) : !historyDetail?.transactions || historyDetail.transactions.length === 0 ? (
                <div className={cn('py-12 text-center rounded-2xl border text-xs space-y-2', isDark ? 'bg-white/[0.02] border-white/5 text-[#a09e9a]' : 'bg-slate-50 border-slate-200 text-slate-500')}>
                  <History className="w-8 h-8 mx-auto opacity-30 text-amber-500 mb-1" />
                  <p className="font-bold">Chưa có lịch sử biến động điểm nào</p>
                  <p className="text-[11px] opacity-75">Mỗi lần khách hàng đặt vé hoặc hủy vé thành công, hệ thống sẽ tự động ghi nhận vào đây.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historyDetail.transactions.map((tx) => {
                    const isPositive = tx.points > 0
                    const createdDate = tx.created_at ? new Date(tx.created_at).toLocaleString('vi-VN') : 'Mới đây'

                    return (
                      <div
                        key={tx.id}
                        className={cn(
                          'p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors',
                          isDark ? 'bg-white/[0.02] border-white/5 hover:border-white/10' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-md text-[11px] font-bold border',
                                isPositive
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                              )}
                            >
                              <span className="font-mono-data">{isPositive ? `+${tx.points.toLocaleString('vi-VN')}` : `${tx.points.toLocaleString('vi-VN')}`}</span> <span>điểm</span>
                            </span>

                            {tx.reservation_id && (
                              <span className={cn('text-[10px] font-mono-data px-1.5 py-0.5 rounded border', isDark ? 'bg-white/5 border-white/10 text-amber-400' : 'bg-white border-slate-200 text-amber-700')}>
                                Đơn vé #{tx.reservation_id}
                              </span>
                            )}
                          </div>

                          <p className={cn('text-xs font-semibold', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                            {tx.reason === 'booking' ? 'Tự động tích điểm khi đặt vé xem phim' : (tx.reason || (isPositive ? 'Tích lũy điểm thưởng' : 'Khấu trừ điểm'))}
                          </p>
                        </div>

                        <div className={cn('text-[11px] font-mono-data text-right shrink-0', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                          {createdDate}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* History Footer */}
            <div className="p-4 border-t border-white/10 shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryTargetUser(null)}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all',
                  isDark ? 'bg-white/10 hover:bg-white/15 text-[#f0ede8]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                )}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CENTERED MODAL: ĐIỀU CHỈNH NGOẠI LỆ (KHI CẦN CAN THIỆP SỰ CỐ) ── */}
      {adjustTargetUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div onClick={() => setAdjustTargetUser(null)} className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" />

          <div
            className={cn(
              'relative z-10 w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border overflow-hidden animate-in zoom-in-95 fade-in duration-200',
              isDark ? 'bg-[#111118] border-white/15 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className={cn('p-2.5 rounded-2xl text-amber-500', isDark ? 'bg-amber-500/10' : 'bg-amber-50')}>
                  <Coins className="w-5 h-5" />
                </span>
                <div>
                  <h3 className={cn('font-display font-black text-lg', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    Can Thiệp Bù Điểm (Ngoại Lệ)
                  </h3>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                    Khách hàng: <strong className="text-amber-500">{adjustTargetUser.full_name || adjustTargetUser.email}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAdjustTargetUser(null)}
                className={cn('p-2 rounded-xl text-[#a09e9a] hover:text-[#f0ede8] transition-colors cursor-pointer', isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form id="adjust-points-form" onSubmit={handleSaveAdjustment} className="p-5 sm:p-6 overflow-y-auto space-y-5">
              <div className={cn('p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5', isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900')}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong>Lưu ý:</strong> Hệ thống đã tự động cộng/trừ điểm theo đơn vé. Chức năng này chỉ sử dụng trong các trường hợp ngoại lệ (đền bù sự cố phòng chiếu, chăm sóc đặc biệt).
                </div>
              </div>

              {/* Action Mode Toggle */}
              <div>
                <label className={cn('text-xs font-bold block mb-2 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                  Loại Thao Tác
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustMode('add')}
                    className={cn(
                      'p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all',
                      adjustMode === 'add'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm'
                        : isDark
                        ? 'bg-white/5 border-white/10 text-[#a09e9a]'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    )}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Bù Thêm Điểm (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustMode('deduct')}
                    className={cn(
                      'p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all',
                      adjustMode === 'deduct'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-400 shadow-sm'
                        : isDark
                        ? 'bg-white/5 border-white/10 text-[#a09e9a]'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    )}
                  >
                    <Minus className="w-4 h-4 stroke-[2.5]" />
                    <span>Thu Hồi Điểm (-)</span>
                  </button>
                </div>
              </div>

              {/* Points Amount Input */}
              <div>
                <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                  Số Điểm Cần {adjustMode === 'add' ? 'Bù Thêm' : 'Thu Hồi'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Ví dụ: 100"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm font-mono-data font-bold outline-none transition-all',
                    isDark
                      ? 'bg-[#09090e] border-white/15 text-[#f0ede8] focus:border-[#e8b84b]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  )}
                />
              </div>

              {/* Reason */}
              <div>
                <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                  Lý Do Cụ Thể <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ví dụ: Đền bù khách hàng do lỗi máy chiếu..."
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all',
                    isDark
                      ? 'bg-[#09090e] border-white/15 text-[#f0ede8] focus:border-[#e8b84b]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                  )}
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAdjustTargetUser(null)}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all',
                  isDark ? 'bg-white/10 hover:bg-white/15 text-[#a09e9a]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                )}
              >
                Hủy Bỏ
              </button>

              <button
                form="adjust-points-form"
                type="submit"
                disabled={adjustSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#e8b84b] hover:bg-[#dfad3e] text-[#09090e] transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {adjustSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Xác Nhận</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface SeatGridItem {
  id?: number
  row_label: string
  col_number: number
  seat_type: 'standard' | 'vip' | 'couple' | 'kids'
  is_active: boolean
}

interface UnifiedRoomLayoutModalProps {
  initialRoomType?: string | null
  initialRoomIds?: number[]
  rooms: RoomItem[]
  isDark: boolean
  onClose: () => void
  onSuccess: () => void
  notify: (type: 'success' | 'error' | 'warning', message: string) => void
}

function UnifiedRoomLayoutModal({
  initialRoomType,
  initialRoomIds,
  rooms,
  isDark,
  onClose,
  onSuccess,
  notify,
}: UnifiedRoomLayoutModalProps) {
  const allRooms = useMemo(() => (Array.isArray(rooms) ? rooms : []), [rooms])

  // Resolve starting room so the canvas is NEVER empty on open
  const defaultRoom = useMemo(() => {
    if (initialRoomIds && initialRoomIds.length > 0) {
      return allRooms.find((r) => r.id === initialRoomIds[0]) || allRooms[0]
    }
    if (initialRoomType && initialRoomType !== 'all') {
      const typeRoom = allRooms.find((r) => (r.room_type || 'standard') === initialRoomType)
      if (typeRoom) return typeRoom
    }
    return allRooms[0]
  }, [allRooms, initialRoomIds, initialRoomType])

  const [activeRoomId, setActiveRoomId] = useState<number>(() => defaultRoom?.id || (allRooms[0]?.id ?? 0))
  const [filterType, setFilterType] = useState<string>(() => {
    if (defaultRoom?.room_type) return defaultRoom.room_type
    if (initialRoomType && initialRoomType !== 'all') return initialRoomType
    return 'standard'
  })

  const displayedRooms = useMemo(
    () => allRooms.filter((r) => (r.room_type || 'standard') === filterType),
    [allRooms, filterType]
  )
  const activeRoomObj = allRooms.find((r) => r.id === activeRoomId) || defaultRoom

  // Multi-room synchronization mode
  const [syncBatch, setSyncBatch] = useState<boolean>(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
    if (initialRoomIds && initialRoomIds.length > 0) {
      return new Set(initialRoomIds)
    }
    return defaultRoom?.id ? new Set([defaultRoom.id]) : new Set()
  })

  const [rows, setRows] = useState<number>(10)
  const [cols, setCols] = useState<number>(15)
  const [seats, setSeats] = useState<SeatGridItem[]>([])
  const [selectedTool, setSelectedTool] = useState<'standard' | 'vip' | 'couple' | 'kids' | 'inactive'>('standard')
  const [saving, setSaving] = useState(false)

  const roomsScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkRoomsScroll = () => {
    try {
      if (roomsScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = roomsScrollRef.current
        setCanScrollLeft(scrollLeft > 2)
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2)
      }
    } catch {}
  }

  useEffect(() => {
    checkRoomsScroll()
    const timer = setTimeout(checkRoomsScroll, 100)
    return () => clearTimeout(timer)
  }, [filterType, allRooms, displayedRooms])

  useEffect(() => {
    window.addEventListener('resize', checkRoomsScroll)
    return () => window.removeEventListener('resize', checkRoomsScroll)
  }, [])

  useEffect(() => {
    try {
      if (activeRoomId && roomsScrollRef.current) {
        const activeBtn = roomsScrollRef.current.querySelector(`[data-room-id="${activeRoomId}"]`) as HTMLElement
        if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
          activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
      }
    } catch {}
  }, [activeRoomId])

  const handleScrollRooms = (direction: 'left' | 'right') => {
    if (!roomsScrollRef.current) return
    const scrollAmount = 240
    roomsScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  // Initialize or generate seat matrix based on rows, cols and room type
  const generateSeatMatrix = (rCount: number, cCount: number, baseType: string = 'standard') => {
    const newSeats: SeatGridItem[] = []
    for (let rIdx = 0; rIdx < rCount; rIdx++) {
      const rLabel = String.fromCharCode(65 + (rIdx % 26)) + (rIdx >= 26 ? Math.floor(rIdx / 26) : '')
      for (let c = 1; c <= cCount; c++) {
        let sType: 'standard' | 'vip' | 'couple' | 'kids' = 'standard'
        if (baseType === 'vip') {
          if (rIdx >= 1 && rIdx <= 2 && c >= 3 && c <= 4) {
            sType = 'couple'
          } else if (rIdx >= 1 && rIdx <= 2) {
            sType = 'vip'
          } else {
            sType = 'vip'
          }
        } else if (baseType === 'imax') {
          if (rIdx >= Math.floor(rCount * 0.3) && rIdx <= Math.floor(rCount * 0.6)) {
            sType = 'vip'
          }
        } else if (baseType === 'kids') {
          sType = rIdx < rCount - 2 ? 'kids' : 'standard'
        } else if (baseType === '3d' || baseType === '4d') {
          if (rIdx >= Math.floor(rCount * 0.35) && rIdx <= Math.floor(rCount * 0.65)) {
            sType = 'vip'
          }
        }

        newSeats.push({
          row_label: rLabel,
          col_number: c,
          seat_type: sType,
          is_active: true,
        })
      }
    }
    return newSeats
  }

  // Load layout from a specific room ID
  const loadRoomLayout = (roomId: number) => {
    const targetRoom = allRooms.find((r) => r.id === roomId)
    if (!targetRoom) return

    setRows(targetRoom.total_rows || 10)
    setCols(targetRoom.total_cols || 15)

    if (targetRoom.seats && targetRoom.seats.length > 0) {
      setSeats(
        targetRoom.seats.map((s) => ({
          id: s.id,
          row_label: s.row_label,
          col_number: s.col_number,
          seat_type: (s.seat_type as any) || 'standard',
          is_active: s.is_active !== false,
        }))
      )
    } else {
      apiClient
        .get<RoomItem>(`/api/v1/rooms/${roomId}`)
        .then((res) => {
          if (res.data && res.data.seats && res.data.seats.length > 0) {
            setRows(res.data.total_rows || 10)
            setCols(res.data.total_cols || 15)
            setSeats(
              res.data.seats.map((s) => ({
                id: s.id,
                row_label: s.row_label,
                col_number: s.col_number,
                seat_type: (s.seat_type as any) || 'standard',
                is_active: s.is_active !== false,
              }))
            )
          } else {
            setSeats(generateSeatMatrix(targetRoom.total_rows || 10, targetRoom.total_cols || 15, targetRoom.room_type || 'standard'))
          }
        })
        .catch(() => {
          setSeats(generateSeatMatrix(targetRoom.total_rows || 10, targetRoom.total_cols || 15, targetRoom.room_type || 'standard'))
        })
    }
  }

  // Load layout on initial mount or when activeRoomId changes
  useEffect(() => {
    if (activeRoomId) {
      loadRoomLayout(activeRoomId)
    } else if (allRooms.length > 0) {
      setActiveRoomId(allRooms[0].id)
      loadRoomLayout(allRooms[0].id)
    }
  }, [activeRoomId])

  // Select active room
  const handleSelectActiveRoom = (r: RoomItem) => {
    setActiveRoomId(r.id)
    if (!syncBatch) {
      setSelectedIds(new Set([r.id]))
    }
  }

  // Toggle sync batch mode
  const handleToggleSyncBatch = (enable: boolean) => {
    setSyncBatch(enable)
    if (enable) {
      const targetIds = allRooms.filter((r) => (r.room_type || 'standard') === filterType).map((r) => r.id)
      setSelectedIds(new Set(targetIds))
    } else {
      setSelectedIds(new Set([activeRoomId]))
    }
  }

  // When rows or cols are modified, resize seat matrix preserving custom assignments
  const handleDimensionChange = (newRows: number, newCols: number) => {
    const clampedRows = Math.max(4, Math.min(20, newRows))
    const clampedCols = Math.max(4, Math.min(25, newCols))
    setRows(clampedRows)
    setCols(clampedCols)

    const map = new Map<string, SeatGridItem>()
    seats.forEach((s) => map.set(`${s.row_label}-${s.col_number}`, s))

    const newSeats: SeatGridItem[] = []
    for (let rIdx = 0; rIdx < clampedRows; rIdx++) {
      const rLabel = String.fromCharCode(65 + (rIdx % 26)) + (rIdx >= 26 ? Math.floor(rIdx / 26) : '')
      for (let c = 1; c <= clampedCols; c++) {
        const key = `${rLabel}-${c}`
        if (map.has(key)) {
          newSeats.push(map.get(key)!)
        } else {
          newSeats.push({
            row_label: rLabel,
            col_number: c,
            seat_type: 'standard',
            is_active: true,
          })
        }
      }
    }
    setSeats(newSeats)
  }

  // Toggle single seat on click
  const handleSeatClick = (rowLabel: string, colNum: number) => {
    setSeats((prev) =>
      prev.map((s) => {
        if (s.row_label === rowLabel && s.col_number === colNum) {
          if (selectedTool === 'inactive') {
            return { ...s, is_active: !s.is_active }
          }
          return {
            ...s,
            seat_type: selectedTool as any,
            is_active: true,
          }
        }
        return s
      })
    )
  }

  // Quick Row Click: Apply current tool to entire row
  const handleRowLabelClick = (rowLabel: string) => {
    setSeats((prev) =>
      prev.map((s) => {
        if (s.row_label === rowLabel) {
          if (selectedTool === 'inactive') {
            return { ...s, is_active: false }
          }
          return {
            ...s,
            seat_type: selectedTool as any,
            is_active: true,
          }
        }
        return s
      })
    )
    notify('success', `Đã áp dụng công cụ "${selectedTool.toUpperCase()}" cho toàn bộ hàng ${rowLabel}`)
  }

  // Smart Layout Generator Presets
  const applySmartVipRows = () => {
    const midStart = Math.floor(rows * 0.3)
    const midEnd = Math.floor(rows * 0.7)
    setSeats((prev) =>
      prev.map((s, idx) => {
        const rIdx = Math.floor(idx / cols)
        if (rIdx >= midStart && rIdx <= midEnd && s.is_active) {
          return { ...s, seat_type: 'vip' }
        }
        return s
      })
    )
    notify('success', 'Đã gán các hàng trung tâm (Sweet Spot) thành Ghế VIP!')
  }

  const applyCoupleBackRow = () => {
    const lastRowIdx = rows - 1
    setSeats((prev) =>
      prev.map((s, idx) => {
        const rIdx = Math.floor(idx / cols)
        if (rIdx === lastRowIdx && s.is_active) {
          return { ...s, seat_type: 'couple' }
        }
        return s
      })
    )
    notify('success', 'Đã gán hàng ghế cuối cùng thành Ghế Đôi (Sweetbox Couple)!')
  }

  const resetAllToStandard = () => {
    setSeats((prev) =>
      prev.map((s) => ({
        ...s,
        seat_type: 'standard',
        is_active: true,
      }))
    )
    notify('success', 'Đã đặt lại toàn bộ sơ đồ thành Ghế Thường khả dụng!')
  }

  // Stats calculation
  const stats = useMemo(() => {
    let standard = 0
    let vip = 0
    let couple = 0
    let kids = 0
    let inactive = 0

    seats.forEach((s) => {
      if (!s.is_active) {
        inactive++
        return
      }
      if (s.seat_type === 'couple') couple++
      else if (s.seat_type === 'kids') kids++
      else if (s.seat_type === 'vip') vip++
      else standard++
    })

    const activeTotal = standard + vip + couple + kids
    const totalSelected = selectedIds.size
    const grandTotal = activeTotal * totalSelected
    return { standard, vip, couple, kids, inactive, activeTotal, totalSelected, grandTotal }
  }, [seats, selectedIds])

  // Group seats by row for layout
  const rowsMap = useMemo(() => {
    const map = new Map<string, SeatGridItem[]>()
    seats.forEach((s) => {
      if (!map.has(s.row_label)) map.set(s.row_label, [])
      map.get(s.row_label)!.push(s)
    })
    map.forEach((list) => list.sort((a, b) => a.col_number - b.col_number))
    const entries = Array.from(map.entries())
    entries.sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }))
    return entries
  }, [seats])

  // Save handler
  const handleSave = async () => {
    if (selectedIds.size === 0) {
      notify('warning', 'Vui lòng chọn ít nhất 1 phòng chiếu để lưu sơ đồ.')
      return
    }

    setSaving(true)
    try {
      const customSeatsPayload = seats.map((s) => ({
        row_label: s.row_label,
        col_number: s.col_number,
        seat_type: s.seat_type,
        is_active: s.is_active,
      }))

      const { data } = await apiClient.put<{ message: string; updated_count: number }>(
        '/api/v1/rooms/batch-layout',
        {
          room_ids: Array.from(selectedIds),
          total_rows: rows,
          total_cols: cols,
          custom_seats: customSeatsPayload,
        }
      )

      notify('success', data.message || `Đã lưu thành công sơ đồ ghế cho ${data.updated_count} phòng!`)
      onSuccess()
      onClose()
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Không thể lưu cấu trúc sơ đồ ghế.'
      notify('error', typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSaving(false)
    }
  }



  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-6 pb-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={cn(
        'w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-colors',
        isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
      )}>
        {/* Modal Header Bar */}
        <div className={cn(
          'px-5 py-4 border-b flex items-center justify-between gap-4 shrink-0 transition-colors',
          isDark ? 'border-white/10 bg-[#0d0d14]' : 'border-slate-200 bg-slate-50'
        )}>
          <div className="flex items-center gap-3">
            <span className={cn(
              'p-2.5 rounded-xl shrink-0',
              isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'
            )}>
              <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className={cn('font-display text-lg sm:text-xl font-bold', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                  Cấu Hình & Thiết Kế Sơ Đồ Ghế
                </h3>
                {activeRoomObj && (
                  <span className={cn(
                    'text-xs font-mono-data px-2.5 py-0.5 rounded-full font-bold border inline-flex items-center gap-1',
                    isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-900 border-amber-300'
                  )}>
                    <span>{activeRoomObj.name} ({activeRoomObj.room_type?.toUpperCase()})</span>
                  </span>
                )}
              </div>
              <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                Điều chỉnh số hàng/cột, gán phân loại ghế (VIP, Đôi, Trẻ em, Thường) và đồng bộ sơ đồ phòng rạp.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              'p-2 rounded-xl border transition-all cursor-pointer',
              isDark
                ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-white hover:bg-white/10'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            )}
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auditorium Selection Bar */}
        <div className={cn(
          'px-5 py-3 border-b space-y-2.5 shrink-0 transition-colors',
          isDark ? 'bg-[#09090e] border-white/10' : 'bg-slate-50/80 border-slate-200'
        )}>
          {/* Room Type Selector Tabs */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
              <span className={cn('text-[11px] font-semibold uppercase tracking-wider mr-1', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                Loại phòng:
              </span>
              {[
                { key: 'standard', label: 'Standard' },
                { key: 'vip', label: 'VIP Lounge' },
                { key: 'imax', label: 'IMAX 3D Laser' },
                { key: '3d', label: '3D Surround' },
                { key: '4d', label: '4DX Motion' },
                { key: 'kids', label: 'Kids Studio' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setFilterType(t.key)
                    const firstOfCategory = allRooms.find((r) => (r.room_type || 'standard') === t.key)
                    if (firstOfCategory) {
                      setActiveRoomId(firstOfCategory.id)
                      if (!syncBatch) {
                        setSelectedIds(new Set([firstOfCategory.id]))
                      }
                    }
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border',
                    filterType === t.key
                      ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] font-bold shadow-xs'
                      : isDark
                      ? 'bg-white/5 text-[#a09e9a] border-white/10 hover:border-white/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sync Batch Toggle */}
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none font-semibold">
              <input
                type="checkbox"
                checked={syncBatch}
                onChange={(e) => handleToggleSyncBatch(e.target.checked)}
                className="w-4 h-4 accent-[#e8b84b] rounded cursor-pointer"
              />
              <span className={isDark ? 'text-[#e8b84b]' : 'text-amber-900'}>
                Đồng bộ sơ đồ này cho tất cả phòng {filterType.toUpperCase()} ({displayedRooms.length} phòng)
              </span>
            </label>
          </div>

          {/* Room Pills Switcher with Slider Bar and Navigation Buttons */}
          <div className="pt-0.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                  Phòng đang chọn ({displayedRooms.length} phòng):
                </span>
                {displayedRooms.length > 4 && (
                  <span className={cn('text-[10px] hidden sm:inline-block', isDark ? 'text-white/40' : 'text-slate-400')}>
                    (Kéo thanh trượt hoặc lăn chuột để chọn phòng)
                  </span>
                )}
              </div>

              {/* Slider Left/Right Quick Navigation Buttons */}
              {displayedRooms.length > 3 && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleScrollRooms('left')}
                    disabled={!canScrollLeft}
                    title="Trượt sang trái"
                    className={cn(
                      'w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed',
                      isDark
                        ? 'bg-white/5 border-white/10 hover:bg-white/15 text-[#f0ede8]'
                        : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700 shadow-xs'
                    )}
                  >
                    <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrollRooms('right')}
                    disabled={!canScrollRight}
                    title="Trượt sang phải"
                    className={cn(
                      'w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed',
                      isDark
                        ? 'bg-white/5 border-white/10 hover:bg-white/15 text-[#f0ede8]'
                        : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700 shadow-xs'
                    )}
                  >
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Slider Track with visible scrollbar */}
            <div
              ref={roomsScrollRef}
              onScroll={checkRoomsScroll}
              onWheel={(e) => {
                if (e.deltaY !== 0 && roomsScrollRef.current) {
                  roomsScrollRef.current.scrollBy({ left: e.deltaY, behavior: 'auto' })
                }
              }}
              className="room-slider-track flex items-center gap-2 overflow-x-auto pb-2.5 pt-0.5 text-xs select-none scroll-smooth"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: isDark ? 'rgba(232, 184, 75, 0.5) rgba(255, 255, 255, 0.08)' : 'rgba(232, 184, 75, 0.7) rgba(0, 0, 0, 0.08)',
              }}
            >
              {displayedRooms.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Không có phòng nào thuộc danh mục này.</span>
              ) : (
                displayedRooms.map((r) => {
                  const isActive = r.id === activeRoomId
                  const isSelected = selectedIds.has(r.id)
                  return (
                    <button
                      key={r.id}
                      data-room-id={r.id}
                      type="button"
                      onClick={() => handleSelectActiveRoom(r)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 select-none whitespace-nowrap',
                        isActive
                          ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] font-bold shadow-xs ring-1 ring-[#e8b84b]'
                          : isSelected
                          ? isDark
                            ? 'bg-amber-500/15 border-amber-500/40 text-[#e8b84b] font-bold'
                            : 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:border-white/20 hover:text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      )}
                    >
                      <span>{r.name}</span>
                      <span className="text-[10px] opacity-75 font-normal">
                        ({r.total_rows}×{r.total_cols})
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* SECTION 1: GRID ROWS & COLS CONTROLS + SMART PRESETS */}
          <div className={cn(
            'p-3.5 rounded-xl border grid grid-cols-1 md:grid-cols-12 gap-3 items-center transition-colors',
            isDark ? 'bg-[#09090e] border-white/5' : 'bg-slate-50 border-slate-200 shadow-xs'
          )}>
            <div className="md:col-span-5 flex flex-wrap gap-4 items-center">
              <div>
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                  Số Hàng Ghế (4–20)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDimensionChange(rows - 1, cols)}
                    disabled={rows <= 4}
                    className={cn(
                      'w-8 h-8 rounded-lg border font-bold text-sm cursor-pointer disabled:opacity-40 transition-colors',
                      isDark ? 'bg-white/10 border-white/10 hover:bg-white/20 text-white' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
                    )}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={rows}
                    onChange={(e) => handleDimensionChange(Number(e.target.value), cols)}
                    className={cn(
                      'w-14 h-8 text-center rounded-lg border text-xs font-mono-data font-bold outline-none',
                      isDark ? 'bg-[#111118] border-white/15 text-[#f0ede8] focus:border-[#e8b84b]' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleDimensionChange(rows + 1, cols)}
                    disabled={rows >= 20}
                    className={cn(
                      'w-8 h-8 rounded-lg border font-bold text-sm cursor-pointer disabled:opacity-40 transition-colors',
                      isDark ? 'bg-white/10 border-white/10 hover:bg-white/20 text-white' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
                    )}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className={cn('block text-xs font-semibold mb-1', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                  Số Ghế/Hàng (4–25)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDimensionChange(rows, cols - 1)}
                    disabled={cols <= 4}
                    className={cn(
                      'w-8 h-8 rounded-lg border font-bold text-sm cursor-pointer disabled:opacity-40 transition-colors',
                      isDark ? 'bg-white/10 border-white/10 hover:bg-white/20 text-white' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
                    )}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={4}
                    max={25}
                    value={cols}
                    onChange={(e) => handleDimensionChange(rows, Number(e.target.value))}
                    className={cn(
                      'w-14 h-8 text-center rounded-lg border text-xs font-mono-data font-bold outline-none',
                      isDark ? 'bg-[#111118] border-white/15 text-[#f0ede8] focus:border-[#e8b84b]' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleDimensionChange(rows, cols + 1)}
                    disabled={cols >= 25}
                    className={cn(
                      'w-8 h-8 rounded-lg border font-bold text-sm cursor-pointer disabled:opacity-40 transition-colors',
                      isDark ? 'bg-white/10 border-white/10 hover:bg-white/20 text-white' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
                    )}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Presets Bar */}
            <div className="md:col-span-7 flex flex-wrap items-center justify-start md:justify-end gap-2 pt-1 md:pt-0">
              <span className={cn('text-[11px] font-medium mr-1', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>Mẫu bố trí:</span>
              <button
                type="button"
                onClick={applySmartVipRows}
                className={cn(
                  'px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5',
                  isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs'
                )}
              >
                <Crown className="w-3 h-3 text-amber-500" />
                <span>Hàng VIP giữa</span>
              </button>
              <button
                type="button"
                onClick={applyCoupleBackRow}
                className={cn(
                  'px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5',
                  isDark ? 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20' : 'bg-pink-50 border-pink-300 text-pink-900 hover:bg-pink-100 shadow-xs'
                )}
              >
                <Heart className="w-3 h-3 text-pink-500" />
                <span>Hàng Đôi cuối</span>
              </button>
              <button
                type="button"
                onClick={resetAllToStandard}
                className={cn(
                  'px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5',
                  isDark ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:bg-white/10 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 shadow-xs'
                )}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Tất cả Thường</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: PAINTBRUSH PALETTE */}
          <div className={cn(
            'p-3.5 rounded-xl border transition-colors',
            isDark ? 'bg-[#09090e] border-[#e8b84b]/20' : 'bg-amber-50/70 border-amber-200 shadow-xs'
          )}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-xs font-bold uppercase tracking-wider mr-1', isDark ? 'text-[#e8b84b]' : 'text-amber-900')}>
                  Chọn loại ghế:
                </span>
                {[
                  {
                    type: 'standard',
                    label: 'Ghế thường (1.0x)',
                    icon: <Armchair className="w-3.5 h-3.5" />,
                    activeClass: isDark ? 'bg-[#181824] border-white text-white' : 'bg-slate-800 text-white border-slate-900',
                  },
                  {
                    type: 'vip',
                    label: 'Ghế VIP (1.2x)',
                    icon: <Crown className="w-3.5 h-3.5 text-amber-500" />,
                    activeClass: isDark ? 'bg-amber-500/20 border-[#e8b84b] text-[#e8b84b]' : 'bg-amber-100 border-amber-500 text-amber-900 font-bold',
                  },
                  {
                    type: 'couple',
                    label: 'Ghế đôi (2.0x)',
                    icon: <Heart className="w-3.5 h-3.5 text-pink-500" />,
                    activeClass: isDark ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-pink-100 border-pink-500 text-pink-900 font-bold',
                  },
                  {
                    type: 'kids',
                    label: 'Ghế trẻ em (0.8x)',
                    icon: <Baby className="w-3.5 h-3.5 text-teal-400" />,
                    activeClass: isDark ? 'bg-teal-500/20 border-teal-500 text-teal-300' : 'bg-teal-100 border-teal-500 text-teal-900 font-bold',
                  },
                  {
                    type: 'inactive',
                    label: 'Lối đi / Ẩn (0x)',
                    icon: <Ban className="w-3.5 h-3.5 text-slate-400" />,
                    activeClass: isDark ? 'bg-slate-700/50 border-slate-500 text-slate-300' : 'bg-slate-200 border-slate-400 text-slate-700',
                  },
                ].map((tool) => (
                  <button
                    key={tool.type}
                    type="button"
                    onClick={() => setSelectedTool(tool.type as any)}
                    className={cn(
                      'px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5',
                      selectedTool === tool.type
                        ? `${tool.activeClass} shadow-xs ring-2 ${isDark ? 'ring-[#e8b84b]/40' : 'ring-amber-400'}`
                        : isDark
                        ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:border-white/20'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                    )}
                  >
                    {tool.icon}
                    <span>{tool.label}</span>
                  </button>
                ))}
              </div>

              <div className={cn('text-[11px] flex items-center gap-1 font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                <Info className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Mẹo: Click chữ cái đầu hàng <strong>(A, B, C...)</strong> để gán cho cả hàng!</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: INTERACTIVE SCREEN & SEAT MATRIX */}
          <div className={cn(
            'p-6 sm:p-8 rounded-xl border flex flex-col items-center overflow-x-auto transition-colors',
            isDark ? 'bg-[#09090e] border-white/5' : 'bg-slate-100/70 border-slate-200'
          )}>
            {/* Cinema Screen Curved Banner */}
            <div className="w-full max-w-lg mb-7 text-center flex flex-col items-center select-none">
              <div className="w-full h-2.5 bg-gradient-to-r from-transparent via-[#e8b84b] to-transparent rounded-full shadow-[0_0_20px_rgba(232,184,75,0.6)]"></div>
              <span className={cn('text-[10px] uppercase tracking-[0.2em] font-bold mt-2', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                MÀN HÌNH CHIẾU · SCREEN
              </span>
            </div>

            {/* Seat Matrix Grid */}
            <div className="space-y-2 min-w-fit select-none">
              {rowsMap.map(([rowLabel, rowSeats]) => (
                <div key={rowLabel} className="flex items-center gap-2.5">
                  {/* Left Row Label (Clickable to paint row) */}
                  <button
                    type="button"
                    onClick={() => handleRowLabelClick(rowLabel)}
                    title={`Click để áp dụng loại ghế "${selectedTool.toUpperCase()}" cho toàn bộ hàng ${rowLabel}`}
                    className={cn(
                      'w-6 h-6 rounded flex items-center justify-center font-bold text-xs cursor-pointer transition-all hover:scale-110',
                      isDark
                        ? 'text-amber-400 hover:bg-amber-400/20 hover:text-white'
                        : 'text-amber-800 hover:bg-amber-100 hover:text-amber-950 font-black'
                    )}
                  >
                    {rowLabel}
                  </button>

                  {/* Row Seats */}
                  <div className="flex items-center gap-1.5">
                    {rowSeats.map((s) => {
                      const type = s.seat_type
                      const isInactive = !s.is_active
                      const isCouple = type === 'couple'
                      const isVip = type === 'vip'
                      const isKids = type === 'kids'

                      return (
                        <div
                          key={`${rowLabel}-${s.col_number}`}
                          onClick={() => handleSeatClick(rowLabel, s.col_number)}
                          className={cn(
                            'h-8 rounded-lg border flex items-center justify-center text-[10px] font-bold shadow-xs transition-transform cursor-pointer hover:scale-110 hover:ring-2',
                            isDark ? 'hover:ring-white' : 'hover:ring-slate-900',
                            isInactive
                              ? isDark
                                ? 'w-8 bg-slate-800/30 border-dashed border-slate-600/50 text-slate-500 opacity-40'
                                : 'w-8 bg-slate-200/50 border-dashed border-slate-400 text-slate-400 opacity-50'
                              : isCouple
                              ? isDark
                                ? 'w-[70px] bg-pink-500/15 border-pink-500/40 text-pink-400'
                                : 'w-[70px] bg-pink-100 border-pink-400 text-pink-950 font-black shadow-xs'
                              : isKids
                              ? isDark
                                ? 'w-8 bg-teal-500/15 border-teal-500/40 text-teal-300'
                                : 'w-8 bg-teal-100 border-teal-400 text-teal-950 font-black shadow-xs'
                              : isVip
                              ? isDark
                                ? 'w-8 bg-amber-500/15 border-amber-500/40 text-amber-400'
                                : 'w-8 bg-amber-100 border-amber-400 text-amber-950 font-black shadow-xs'
                              : isDark
                              ? 'w-8 bg-[#181824] border-white/15 text-[#f0ede8]'
                              : 'w-8 bg-white border-slate-300 text-slate-800 font-bold'
                          )}
                          title={`Ghế ${rowLabel}${s.col_number} (${
                            isInactive ? 'Không sử dụng' : isCouple ? 'Ghế đôi' : isKids ? 'Ghế trẻ em' : isVip ? 'Ghế VIP' : 'Ghế thường'
                          }) - Click để đổi loại ghế`}
                        >
                          {isInactive ? (
                            <Ban className="w-3 h-3 opacity-40" />
                          ) : isCouple ? (
                            <span className="flex items-center gap-0.5">
                              <Heart className="w-2.5 h-2.5 text-pink-500 shrink-0" />
                              <span>{s.col_number}</span>
                            </span>
                          ) : isKids ? (
                            <span className="flex items-center gap-0.5">
                              <Baby className="w-2.5 h-2.5 text-teal-400 shrink-0" />
                              <span>{s.col_number}</span>
                            </span>
                          ) : isVip ? (
                            <span className="flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                              <span>{s.col_number}</span>
                            </span>
                          ) : (
                            s.col_number
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Right Row Label (Clickable to paint row) */}
                  <button
                    type="button"
                    onClick={() => handleRowLabelClick(rowLabel)}
                    title={`Click để áp dụng loại ghế "${selectedTool.toUpperCase()}" cho toàn bộ hàng ${rowLabel}`}
                    className={cn(
                      'w-6 h-6 rounded flex items-center justify-center font-bold text-xs cursor-pointer transition-all hover:scale-110',
                      isDark
                        ? 'text-amber-400 hover:bg-amber-400/20 hover:text-white'
                        : 'text-amber-800 hover:bg-amber-100 hover:text-amber-950 font-black'
                    )}
                  >
                    {rowLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className={cn(
          'p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-4 shrink-0 transition-colors',
          isDark ? 'border-white/10 bg-[#0d0d14]' : 'border-slate-200 bg-slate-50'
        )}>
          {/* Capacity Breakdown */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> Thường: <strong>{stats.standard}</strong>
            </span>
            <span className="font-semibold flex items-center gap-1.5 text-amber-500">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> VIP: <strong>{stats.vip}</strong>
            </span>
            <span className="font-semibold flex items-center gap-1.5 text-pink-500">
              <span className="w-2 h-2 rounded-full bg-pink-400"></span> Đôi: <strong>{stats.couple}</strong>
            </span>
            <span className="font-semibold flex items-center gap-1.5 text-teal-500">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span> Trẻ em: <strong>{stats.kids}</strong>
            </span>
            {stats.inactive > 0 && (
              <span className="font-semibold flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span> Ẩn: <strong>{stats.inactive}</strong>
              </span>
            )}
            <span className={isDark ? 'text-white/20' : 'text-slate-300'}>|</span>
            <span className={cn('font-semibold', isDark ? 'text-[#e8b84b]' : 'text-amber-900')}>
              Sức chứa: {stats.activeTotal} ghế ({selectedIds.size} phòng)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={cn(
                'px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors',
                isDark ? 'bg-white/10 hover:bg-white/15 text-[#f0ede8]' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              )}
            >
              Hủy
            </button>

            <button
              type="button"
              disabled={saving || selectedIds.size === 0}
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#e8b84b] hover:bg-[#d9a738] text-[#09090e] font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{selectedIds.size <= 1 ? 'Lưu Sơ Đồ Ghế' : `Lưu & Áp Dụng Cho (${selectedIds.size} Phòng)`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function ConcessionAdminTab({ isDark }: { isDark: boolean }) {
  const [concessions, setConcessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [notification, setNotification] = useState<{
    text: string
    type: 'success' | 'error'
    undoAction?: () => Promise<void> | void
  } | null>(null)

  // Card Menu Popover State
  const [activeMenuKey, setActiveMenuKey] = useState<string | null>(null)

  // Slide-over Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'duplicate'>('create')
  const [originalGroup, setOriginalGroup] = useState<GroupedConcession | null>(null)
  const [drawerForm, setDrawerForm] = useState<{
    baseName: string
    category: string
    description: string
    image_url: string
    singlePrice: string
    singleIsActive: boolean
    variants: Array<{
      id?: number
      size: string
      price: string
      is_active: boolean
    }>
  }>({
    baseName: '',
    category: 'popcorn',
    description: '',
    image_url: '',
    singlePrice: '',
    singleIsActive: true,
    variants: [],
  })

  const SIZE_CATEGORIES = ['popcorn', 'drink']
  const ALL_SIZES = ['S', 'M', 'L', 'XL']

  const CATEGORY_TABS = [
    { value: 'all', label: 'Tất Cả', icon: Layers },
    { value: 'combo', label: 'Combo F&B', icon: Sparkles },
    { value: 'popcorn', label: 'Bắp Rang', icon: Popcorn },
    { value: 'drink', label: 'Nước Uống', icon: CupSoda },
    { value: 'food', label: 'Đồ Ăn Nóng', icon: Utensils },
    { value: 'snack', label: 'Snack & Khác', icon: Cookie },
    { value: 'hidden', label: 'Tạm Ẩn', icon: EyeOff },
  ]

  const CATEGORY_OPTIONS = [
    { value: 'combo', label: 'Combo F&B' },
    { value: 'popcorn', label: 'Bắp Rang' },
    { value: 'drink', label: 'Nước Uống' },
    { value: 'food', label: 'Đồ Ăn Nóng' },
    { value: 'snack', label: 'Snack & Đồ Ăn Vặt' },
  ]

  const showToast = (
    text: string,
    type: 'success' | 'error' = 'success',
    undoAction?: () => Promise<void> | void
  ) => {
    setNotification({ text, type, undoAction })
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr))
    }, 4500)
  }

  async function fetchConcessions() {
    setLoading(true)
    try {
      const { data } = await apiClient.get('/api/v1/concessions/all')
      setConcessions(data || [])
    } catch {
      showToast('Không thể tải danh sách sản phẩm F&B', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConcessions()
  }, [])

  // Close modal when pressing ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen])

  // Close card popover when clicking anywhere outside
  useEffect(() => {
    function handleWindowClick() {
      setActiveMenuKey(null)
    }
    if (activeMenuKey) {
      window.addEventListener('click', handleWindowClick)
      return () => window.removeEventListener('click', handleWindowClick)
    }
  }, [activeMenuKey])

  // Filtered Concessions by category tab
  const filteredConcessions = useMemo(() => {
    let result = concessions

    if (selectedCategoryFilter === 'hidden') {
      result = result.filter((item) => !item.is_active)
    } else if (selectedCategoryFilter !== 'all') {
      result = result.filter((item) => item.category === selectedCategoryFilter)
    }

    return [
      ...result.filter((item) => item.is_active),
      ...result.filter((item) => !item.is_active),
    ]
  }, [concessions, selectedCategoryFilter])

  const groupedList = useMemo(() => {
    return groupConcessions(filteredConcessions)
  }, [filteredConcessions])

  // Quick 1-Click Status Switch with Optimistic Feedback & Undo
  async function handleToggleGroupActive(group: GroupedConcession, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    const nextActive = !group.is_active
    const prevConcessions = [...concessions]

    // Optimistic UI update
    setConcessions((prev) =>
      prev.map((item) => {
        if (group.variants.some((v) => v.id === item.id)) {
          return { ...item, is_active: nextActive }
        }
        return item
      })
    )

    showToast(
      `Đã ${nextActive ? 'mở bán' : 'tạm ngưng bán'} "${group.baseName}"`,
      'success',
      async () => {
        // Undo action
        setConcessions(prevConcessions)
        for (const v of group.variants) {
          try {
            await apiClient.put(`/api/v1/concessions/${v.id}`, { is_active: !nextActive })
          } catch {
            // silent
          }
        }
        await fetchConcessions()
      }
    )

    try {
      for (const v of group.variants) {
        await apiClient.put(`/api/v1/concessions/${v.id}`, { is_active: nextActive })
      }
    } catch {
      setConcessions(prevConcessions)
      showToast('Không thể cập nhật trạng thái mặt hàng', 'error')
    }
  }

  // Open Drawer in Create Mode
  function handleOpenCreate() {
    setDrawerMode('create')
    setOriginalGroup(null)
    setDrawerForm({
      baseName: '',
      category: 'popcorn',
      description: '',
      image_url: '',
      singlePrice: '75000',
      singleIsActive: true,
      variants: [
        { size: 'M', price: '45000', is_active: true },
        { size: 'L', price: '55000', is_active: true },
      ],
    })
    setIsDrawerOpen(true)
  }

  // Open Drawer in Edit Mode
  function handleOpenEdit(group: GroupedConcession) {
    setDrawerMode('edit')
    setOriginalGroup(group)
    const isSizeCat = SIZE_CATEGORIES.includes(group.category)

    if (isSizeCat) {
      setDrawerForm({
        baseName: group.baseName,
        category: group.category,
        description: group.description || '',
        image_url: group.image_url || '',
        singlePrice: '',
        singleIsActive: true,
        variants: group.variants.map((v) => ({
          id: v.id,
          size: v.size || 'M',
          price: String(v.price),
          is_active: v.is_active,
        })),
      })
    } else {
      setDrawerForm({
        baseName: group.baseName,
        category: group.category,
        description: group.description || '',
        image_url: group.image_url || '',
        singlePrice: String(group.primaryConcession.price),
        singleIsActive: group.primaryConcession.is_active,
        variants: [],
      })
    }
    setIsDrawerOpen(true)
  }

  // Open Drawer in Duplicate Mode
  function handleOpenDuplicate(group: GroupedConcession) {
    setDrawerMode('duplicate')
    setOriginalGroup(null)
    const isSizeCat = SIZE_CATEGORIES.includes(group.category)

    if (isSizeCat) {
      setDrawerForm({
        baseName: `${group.baseName} (Bản sao)`,
        category: group.category,
        description: group.description || '',
        image_url: group.image_url || '',
        singlePrice: '',
        singleIsActive: true,
        variants: group.variants.map((v) => ({
          size: v.size || 'M',
          price: String(v.price),
          is_active: true,
        })),
      })
    } else {
      setDrawerForm({
        baseName: `${group.baseName} (Bản sao)`,
        category: group.category,
        description: group.description || '',
        image_url: group.image_url || '',
        singlePrice: String(group.primaryConcession.price),
        singleIsActive: true,
        variants: [],
      })
    }
    setIsDrawerOpen(true)
  }

  // Add Size row to matrix in Drawer
  function handleAddSizeToMatrix(size: string) {
    setDrawerForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { size, price: '', is_active: true }],
    }))
  }

  // Remove Size row from matrix
  function handleRemoveSizeFromMatrix(index: number) {
    if (drawerForm.variants.length <= 1) return
    setDrawerForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }))
  }

  // Update Size row in matrix
  function handleUpdateSizeInMatrix(index: number, patch: Partial<{ price: string; is_active: boolean }>) {
    setDrawerForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }))
  }

  // Submit Drawer Changes
  async function handleSaveDrawer(e: React.FormEvent) {
    e.preventDefault()
    const name = drawerForm.baseName.trim()
    if (!name) {
      showToast('Vui lòng nhập tên món ăn / đồ uống', 'error')
      return
    }

    const isSizeCat = SIZE_CATEGORIES.includes(drawerForm.category)

    if (isSizeCat) {
      if (drawerForm.variants.length === 0) {
        showToast('Vui lòng cấu hình ít nhất 1 kích cỡ và giá bán', 'error')
        return
      }
      for (const v of drawerForm.variants) {
        if (!v.price || isNaN(Number(v.price)) || Number(v.price) <= 0) {
          showToast(`Vui lòng nhập giá hợp lệ cho Size ${v.size}`, 'error')
          return
        }
      }
    } else {
      if (!drawerForm.singlePrice || isNaN(Number(drawerForm.singlePrice)) || Number(drawerForm.singlePrice) <= 0) {
        showToast('Vui lòng nhập giá bán hợp lệ', 'error')
        return
      }
    }

    setSaving(true)
    try {
      if (drawerMode === 'create' || drawerMode === 'duplicate') {
        if (isSizeCat) {
          for (const v of drawerForm.variants) {
            await apiClient.post('/api/v1/concessions/', {
              name: `${name} (${v.size})`,
              category: drawerForm.category,
              size: v.size,
              price: parseFloat(v.price),
              description: drawerForm.description.trim() || undefined,
              image_url: drawerForm.image_url.trim() || undefined,
              is_active: v.is_active,
            })
          }
        } else {
          await apiClient.post('/api/v1/concessions/', {
            name,
            category: drawerForm.category,
            price: parseFloat(drawerForm.singlePrice),
            description: drawerForm.description.trim() || undefined,
            image_url: drawerForm.image_url.trim() || undefined,
            is_active: drawerForm.singleIsActive,
          })
        }
        showToast(`Đã thêm mới "${name}" thành công`)
      } else if (drawerMode === 'edit') {
        if (isSizeCat) {
          // Update existing or add new variants
          for (const v of drawerForm.variants) {
            if (v.id) {
              await apiClient.put(`/api/v1/concessions/${v.id}`, {
                name: `${name} (${v.size})`,
                category: drawerForm.category,
                size: v.size,
                price: parseFloat(v.price),
                description: drawerForm.description.trim() || undefined,
                image_url: drawerForm.image_url.trim() || undefined,
                is_active: v.is_active,
              })
            } else {
              await apiClient.post('/api/v1/concessions/', {
                name: `${name} (${v.size})`,
                category: drawerForm.category,
                size: v.size,
                price: parseFloat(v.price),
                description: drawerForm.description.trim() || undefined,
                image_url: drawerForm.image_url.trim() || undefined,
                is_active: v.is_active,
              })
            }
          }

          // Soft-deactivate any removed variants
          if (originalGroup) {
            const currentIds = new Set(drawerForm.variants.map((v) => v.id).filter(Boolean))
            for (const oldV of originalGroup.variants) {
              if (!currentIds.has(oldV.id)) {
                await apiClient.put(`/api/v1/concessions/${oldV.id}`, { is_active: false })
              }
            }
          }
        } else if (originalGroup) {
          await apiClient.put(`/api/v1/concessions/${originalGroup.primaryConcession.id}`, {
            name,
            category: drawerForm.category,
            price: parseFloat(drawerForm.singlePrice),
            description: drawerForm.description.trim() || undefined,
            image_url: drawerForm.image_url.trim() || undefined,
            is_active: drawerForm.singleIsActive,
          })
        }
        showToast(`Đã lưu thay đổi cho "${name}"`)
      }

      setIsDrawerOpen(false)
      await fetchConcessions()
    } catch {
      showToast('Có lỗi xảy ra khi lưu dữ liệu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const cardCls = isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
  const inputCls = isDark
    ? 'bg-[#0d0d14] border-white/10 text-[#f0ede8] placeholder:text-[#6e6c68] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-200'

  return (
    <div className="space-y-6">
      {/* Toast Notification with Undo */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4">
          <div
            className={cn(
              'px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-semibold backdrop-blur-xl',
              notification.type === 'success'
                ? isDark
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : isDark
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            )}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.text}</span>

            {notification.undoAction && (
              <button
                type="button"
                onClick={() => {
                  notification.undoAction?.()
                  setNotification(null)
                }}
                className="ml-2 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold cursor-pointer transition-all uppercase text-[10px] tracking-wider"
              >
                Hoàn tác
              </button>
            )}

            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className={cn('p-5 sm:p-6 rounded-2xl border transition-all shadow-xs', cardCls)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className={cn('p-2 rounded-xl text-amber-500', isDark ? 'bg-amber-500/10' : 'bg-amber-50')}>
                <Popcorn className="w-5 h-5 stroke-[2]" />
              </span>
              <h2 className={cn('font-display font-black text-xl tracking-tight', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                Quản Lý Bắp Nước & Combo F&B
              </h2>
            </div>
            <p className={cn('text-xs pl-10 leading-relaxed', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
              Kiểm soát danh mục đồ ăn, nước uống, thiết lập các combo ưu đãi và kích cỡ bán kèm vé khi khán giả đặt chỗ.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:self-auto self-start">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#e8b84b] hover:bg-[#dfad3e] text-[#09090e] shadow-md transition-all cursor-pointer select-none"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm Món Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon
          const count =
            tab.value === 'all'
              ? concessions.length
              : tab.value === 'hidden'
              ? concessions.filter((c) => !c.is_active).length
              : concessions.filter((c) => c.category === tab.value).length
          const isActive = selectedCategoryFilter === tab.value

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedCategoryFilter(tab.value)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border select-none',
                isActive
                  ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm'
                  : isDark
                  ? 'bg-[#111118] text-[#a09e9a] border-white/10 hover:text-[#f0ede8] hover:border-white/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-[#09090e]' : 'text-amber-500')} />
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-mono-data font-bold',
                  isActive
                    ? 'bg-black/20 text-[#09090e]'
                    : isDark
                    ? 'bg-white/10 text-[#a09e9a]'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Concessions Grid */}
      {loading ? (
        <div className={cn('p-12 text-center rounded-2xl border flex flex-col items-center justify-center gap-3', cardCls)}>
          <RefreshCw className="w-7 h-7 animate-spin text-amber-500" />
          <p className={cn('text-xs font-semibold', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
            Đang tải danh mục bắp nước & combo...
          </p>
        </div>
      ) : groupedList.length === 0 ? (
        <div className={cn('p-12 text-center rounded-2xl border flex flex-col items-center justify-center gap-3', cardCls)}>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Popcorn className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h4 className={cn('font-bold text-sm', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
              Không có sản phẩm F&B nào
            </h4>
            <p className={cn('text-xs mt-1 max-w-sm', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
              Chưa có sản phẩm nào trong danh mục này. Bấm nút "Thêm Món Mới" để bắt đầu tạo thực đơn.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#e8b84b] text-[#09090e] hover:bg-[#dfad3e] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tạo Món Mới Ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groupedList.map((group) => {
            const isSizeCategory = SIZE_CATEGORIES.includes(group.category)
            const isGroupActive = group.variants.some((v) => v.is_active)
            const isPopoverOpen = activeMenuKey === group.key

            return (
              <div
                key={group.key}
                className={cn(
                  'rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 group relative',
                  cardCls,
                  !isGroupActive ? 'opacity-65 grayscale-[30%]' : 'hover:border-amber-500/30 hover:shadow-lg'
                )}
              >
                {/* Image & Header Overlay */}
                <div className={cn('h-48 relative overflow-hidden flex items-center justify-center select-none', isDark ? 'bg-[#0a0a0f]' : 'bg-slate-100')}>
                  {group.image_url ? (
                    <img
                      src={group.image_url}
                      alt={group.baseName}
                      className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#a09e9a] opacity-30 gap-2">
                      <Popcorn className="w-12 h-12 stroke-[1.2]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Chưa có ảnh</span>
                    </div>
                  )}

                  {/* Top-left Category Pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-xs flex items-center gap-1',
                        isDark
                          ? 'bg-[#09090e]/80 text-amber-400 border-white/10'
                          : 'bg-white/90 text-amber-700 border-amber-200'
                      )}
                    >
                      {group.category === 'combo' && <Sparkles className="w-2.5 h-2.5" />}
                      {group.category === 'popcorn' && <Popcorn className="w-2.5 h-2.5" />}
                      {group.category === 'drink' && <CupSoda className="w-2.5 h-2.5" />}
                      {group.category === 'food' && <Utensils className="w-2.5 h-2.5" />}
                      {group.category === 'snack' && <Cookie className="w-2.5 h-2.5" />}
                      <span>
                        {CATEGORY_OPTIONS.find((c) => c.value === group.category)?.label || group.category}
                      </span>
                    </span>
                  </div>

                  {/* Top-right Interactive Status Toggle Switch */}
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={(e) => handleToggleGroupActive(group, e)}
                      title={isGroupActive ? 'Nhấp để tạm ngưng bán' : 'Nhấp để mở bán'}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-xs flex items-center gap-1.5 cursor-pointer transition-all select-none',
                        isGroupActive
                          ? isDark
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                            : 'bg-emerald-50/90 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : isDark
                          ? 'bg-[#181824]/90 text-slate-400 border-white/10 hover:bg-[#202030]'
                          : 'bg-slate-100/95 text-slate-600 border-slate-300 hover:bg-slate-200'
                      )}
                    >
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full transition-transform',
                          isGroupActive ? 'bg-emerald-400' : 'bg-slate-400'
                        )}
                      />
                      <span>{isGroupActive ? 'Đang bán' : 'Tạm ngưng'}</span>
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col flex-1 gap-2.5">
                  {/* Title & Description */}
                  <div>
                    <h3
                      className={cn(
                        'font-bold text-sm leading-snug group-hover:text-amber-500 transition-colors',
                        isDark ? 'text-[#f0ede8]' : 'text-slate-900'
                      )}
                    >
                      {group.baseName}
                    </h3>
                    <p className={cn('text-xs mt-1 line-clamp-2 min-h-[32px] leading-relaxed', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                      {group.description || 'Chưa có mô tả chi tiết cho mặt hàng này.'}
                    </p>
                  </div>

                  {/* Size Pills Bar if Item has sizes */}
                  {isSizeCategory && group.variants.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className={cn('text-[10px] font-bold uppercase tracking-wider', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                        Kích cỡ:
                      </span>
                      {group.variants.map((v) => (
                        <span
                          key={v.id}
                          title={`Size ${v.size}: ${Number(v.price).toLocaleString('vi-VN')}₫ ${!v.is_active ? '(Tạm hết)' : ''}`}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-mono-data font-bold border transition-all',
                            !v.is_active
                              ? 'opacity-40 line-through border-transparent bg-black/20 text-slate-500'
                              : v.size === 'L' || v.size === 'XL'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : isDark
                              ? 'bg-white/5 text-[#f0ede8] border-white/10'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          )}
                        >
                          {v.size || 'M'}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Footer: Price on Left, Edit & Popover on Right */}
                  <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className={cn('text-[10px] font-medium block', isDark ? 'text-[#a09e9a]' : 'text-slate-400')}>
                        {isSizeCategory && group.variants.length > 1 ? 'Khoảng giá' : 'Giá niêm yết'}
                      </span>
                      <div className="font-mono-data font-black text-sm sm:text-base text-amber-500">
                        {isSizeCategory && group.variants.length > 1 ? (
                          <>
                            {Number(group.minPrice).toLocaleString('vi-VN')}₫
                            {group.minPrice !== group.maxPrice && ` – ${Number(group.maxPrice).toLocaleString('vi-VN')}₫`}
                          </>
                        ) : (
                          `${Number(group.primaryConcession.price).toLocaleString('vi-VN')}₫`
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative">
                      {/* Primary Action Button: Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(group)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all shadow-xs select-none',
                          isDark
                            ? 'bg-white/5 hover:bg-[#e8b84b] text-[#f0ede8] hover:text-[#09090e] border-white/10 hover:border-[#e8b84b]'
                            : 'bg-white hover:bg-amber-400 text-slate-700 hover:text-slate-950 border-slate-200 hover:border-amber-400'
                        )}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Chỉnh sửa</span>
                      </button>

                      {/* Secondary Action: More Options Dropdown Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenuKey((curr) => (curr === group.key ? null : group.key))
                        }}
                        className={cn(
                          'p-1.5 rounded-xl border cursor-pointer transition-all select-none',
                          isPopoverOpen
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : isDark
                            ? 'bg-white/5 hover:bg-white/10 text-[#a09e9a] hover:text-[#f0ede8] border-white/10'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                        )}
                        aria-label="Tùy chọn mở rộng"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Popover Dropdown Menu */}
                      {isPopoverOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'absolute right-0 bottom-full mb-2 w-44 rounded-2xl border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95',
                            isDark ? 'bg-[#161622] border-white/15 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-800'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuKey(null)
                              handleOpenDuplicate(group)
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors text-left',
                              isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                            )}
                          >
                            <Copy className="w-3.5 h-3.5 text-amber-400" />
                            <span>Nhân bản món</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuKey(null)
                              handleToggleGroupActive(group)
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors text-left',
                              isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                            )}
                          >
                            {isGroupActive ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                                <span>Tạm ngưng bán</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Mở bán lại</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── CENTERED MODAL (ENTERPRISE F&B MANAGEMENT) ── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container (Centered) */}
          <div
            className={cn(
              'relative z-10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border overflow-hidden animate-in zoom-in-95 fade-in duration-200',
              isDark ? 'bg-[#111118] border-white/15 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            {/* Drawer Header (Sticky) */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className={cn('p-2.5 rounded-2xl text-amber-500', isDark ? 'bg-amber-500/10' : 'bg-amber-50')}>
                  {drawerMode === 'create' ? (
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  ) : drawerMode === 'duplicate' ? (
                    <Copy className="w-5 h-5" />
                  ) : (
                    <Pencil className="w-5 h-5" />
                  )}
                </span>
                <div>
                  <h3 className={cn('font-display font-black text-lg', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    {drawerMode === 'create'
                      ? 'Thêm Món F&B Mới'
                      : drawerMode === 'duplicate'
                      ? 'Nhân Bản Mặt Hàng F&B'
                      : `Chỉnh Sửa: ${drawerForm.baseName || 'Mặt Hàng'}`}
                  </h3>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                    Quản lý thông tin chi tiết, hình ảnh, phân loại và bảng giá kích cỡ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className={cn(
                  'p-2 rounded-xl text-[#a09e9a] hover:text-[#f0ede8] transition-colors cursor-pointer',
                  isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                )}
                aria-label="Đóng ngăn kéo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <form id="concession-drawer-form" onSubmit={handleSaveDrawer} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Section 1: Basic Info & Image */}
              <div className="space-y-4">
                <h4 className={cn('text-xs font-bold uppercase tracking-wider pb-1 border-b border-white/5 flex items-center gap-2', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  <span>1. Thông Tin Nhận Diện & Hình Ảnh</span>
                </h4>

                <div>
                  <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                    Ảnh Đại Diện Món
                  </label>
                  <ImageUploadField
                    value={drawerForm.image_url}
                    onChange={(url) => setDrawerForm((f) => ({ ...f, image_url: url }))}
                    isDark={isDark}
                    compact
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Tên Mặt Hàng / Combo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={drawerForm.baseName}
                      onChange={(e) => setDrawerForm((f) => ({ ...f, baseName: e.target.value }))}
                      placeholder="Vd: Cốc nước ngọt CocaCola, Combo 1 Bắp + 2 Nước..."
                      className={cn('w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all', inputCls)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Phân Loại Danh Mục <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={drawerForm.category}
                      onChange={(e) => {
                        const newCat = e.target.value
                        setDrawerForm((f) => {
                          const willBeSizeCat = SIZE_CATEGORIES.includes(newCat)
                          return {
                            ...f,
                            category: newCat,
                            variants: willBeSizeCat && f.variants.length === 0
                              ? [
                                  { size: 'M', price: f.singlePrice || '45000', is_active: true },
                                  { size: 'L', price: '55000', is_active: true },
                                ]
                              : f.variants,
                          }
                        })
                      }}
                      className={cn('w-full px-3 py-2.5 rounded-xl border text-xs outline-none transition-all cursor-pointer', inputCls)}
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value} className={isDark ? 'bg-[#111118]' : 'bg-white'}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Mô Tả / Thành Phần Chi Tiết
                    </label>
                    <textarea
                      rows={2}
                      value={drawerForm.description}
                      onChange={(e) => setDrawerForm((f) => ({ ...f, description: e.target.value }))}
                      className={cn('w-full px-3.5 py-2 rounded-xl border text-xs outline-none transition-all resize-none', inputCls)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing & Variants Matrix */}
              <div className="space-y-4 pt-2">
                <h4 className={cn('text-xs font-bold uppercase tracking-wider pb-1 border-b border-white/5 flex items-center justify-between', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  <span>2. Quản Lý Kích Cỡ & Bảng Giá Niêm Yết</span>
                  {SIZE_CATEGORIES.includes(drawerForm.category) && (
                    <span className="text-[10px] font-normal text-[#a09e9a]">
                      Đang có {drawerForm.variants.length} kích cỡ
                    </span>
                  )}
                </h4>

                {SIZE_CATEGORIES.includes(drawerForm.category) ? (
                  /* Matrix Table for Popcorn & Drinks */
                  <div className="space-y-3">
                    <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'border-white/10' : 'border-slate-200')}>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={cn('border-b text-[10px] uppercase tracking-wider font-bold', isDark ? 'bg-white/[0.03] border-white/10 text-[#a09e9a]' : 'bg-slate-50 border-slate-200 text-slate-600')}>
                            <th className="py-2.5 px-3">Kích cỡ</th>
                            <th className="py-2.5 px-3">Giá bán (VNĐ)</th>
                            <th className="py-2.5 px-3 text-center">Trạng thái</th>
                            <th className="py-2.5 px-3 text-right">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {drawerForm.variants.map((v, idx) => (
                            <tr key={idx} className={cn('transition-colors', !v.is_active && 'opacity-60')}>
                              {/* Size Badge */}
                              <td className="py-2.5 px-3">
                                <span className={cn('px-2.5 py-1 rounded-lg text-xs font-mono-data font-bold border', isDark ? 'bg-white/5 border-white/10 text-[#f0ede8]' : 'bg-slate-100 border-slate-200 text-slate-800')}>
                                  Size {v.size}
                                </span>
                              </td>

                              {/* Price Input */}
                              <td className="py-2.5 px-3">
                                <div className="relative max-w-[140px]">
                                  <input
                                    type="number"
                                    required
                                    min="0"
                                    step="1000"
                                    value={v.price}
                                    onChange={(e) => handleUpdateSizeInMatrix(idx, { price: e.target.value })}
                                    className={cn('w-full px-2.5 py-1.5 pr-6 rounded-lg border text-xs font-mono-data font-bold outline-none', inputCls)}
                                    placeholder="50000"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#a09e9a]">₫</span>
                                </div>
                              </td>

                              {/* Toggle active switch for single size */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSizeInMatrix(idx, { is_active: !v.is_active })}
                                  className={cn(
                                    'px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all',
                                    v.is_active
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                      : 'bg-white/5 text-slate-400 border-white/10'
                                  )}
                                >
                                  {v.is_active ? 'Đang bán' : 'Tạm hết'}
                                </button>
                              </td>

                              {/* Delete row */}
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  disabled={drawerForm.variants.length <= 1}
                                  onClick={() => handleRemoveSizeFromMatrix(idx)}
                                  className={cn(
                                    'p-1.5 rounded-lg text-[#a09e9a] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed transition-all'
                                  )}
                                  title="Xóa kích cỡ này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Missing Size Buttons */}
                    {ALL_SIZES.filter((s) => !drawerForm.variants.some((v) => v.size === s)).length > 0 && (
                      <div className="pt-1 flex items-center gap-2 flex-wrap">
                        <span className={cn('text-[11px] font-semibold', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                          Bổ sung kích cỡ:
                        </span>
                        {ALL_SIZES.filter((s) => !drawerForm.variants.some((v) => v.size === s)).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleAddSizeToMatrix(s)}
                            className={cn(
                              'px-2.5 py-1 rounded-xl text-xs font-bold border border-dashed flex items-center gap-1 cursor-pointer transition-all',
                              isDark
                                ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                : 'border-amber-400 text-amber-800 hover:bg-amber-50'
                            )}
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>Size {s}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Single Price & Status for Combo / Food / Snack */
                  <div className="space-y-4">
                    <div>
                      <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                        Giá Bán Niêm Yết (VNĐ) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="0"
                          step="1000"
                          value={drawerForm.singlePrice}
                          onChange={(e) => setDrawerForm((f) => ({ ...f, singlePrice: e.target.value }))}
                          placeholder="85000"
                          className={cn('w-full px-3.5 py-2.5 pr-8 rounded-xl border text-xs font-mono-data font-bold outline-none transition-all', inputCls)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#a09e9a]">₫</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                      <div>
                        <span className={cn('text-xs font-bold block', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                          Trạng Thái Kinh Doanh
                        </span>
                        <span className={cn('text-[11px]', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                          {drawerForm.singleIsActive ? 'Hiển thị ngay cho khách hàng đặt mua' : 'Tạm ẩn không bán'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDrawerForm((f) => ({ ...f, singleIsActive: !f.singleIsActive }))}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5',
                          drawerForm.singleIsActive
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : isDark
                            ? 'bg-white/5 border-white/10 text-slate-400'
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        )}
                      >
                        <span className={cn('w-2 h-2 rounded-full', drawerForm.singleIsActive ? 'bg-emerald-400' : 'bg-slate-400')} />
                        <span>{drawerForm.singleIsActive ? 'Đang bán' : 'Tạm ẩn'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* Drawer Sticky Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all',
                  isDark ? 'bg-white/10 hover:bg-white/15 text-[#a09e9a]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                )}
              >
                Hủy Bỏ
              </button>

              <button
                form="concession-drawer-form"
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#e8b84b] hover:bg-[#dfad3e] text-[#09090e] transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {drawerMode === 'create'
                        ? 'Tạo Món Mới'
                        : drawerMode === 'duplicate'
                        ? 'Lưu Bản Sao Mới'
                        : 'Lưu Thay Đổi'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ─────────────────────────────────────────
// VoucherAdminTab — Enterprise Promotion & Voucher Management
// ─────────────────────────────────────────
function VoucherAdminTab({ isDark }: { isDark: boolean }) {
  const [vouchers, setVouchers] = useState<VoucherAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScopeTab, setSelectedScopeTab] = useState<'all' | 'rooms' | 'concessions' | 'loyalty' | 'expired'>('all')
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [formData, setFormData] = useState<{
    id?: number
    code: string
    discount_type: 'percent' | 'fixed'
    discount_value: string
    min_spend: string
    max_discount: string
    applicable_scope: 'all' | 'rooms' | 'concessions' | 'loyalty'
    target_room_type: string
    target_category: string
    min_loyalty_tier: string
    expiry_date: string
    is_first_booking_only: boolean
    max_uses_per_user: string
    is_active: boolean
  }>({
    code: '',
    discount_type: 'percent',
    discount_value: '10',
    min_spend: '0',
    max_discount: '50000',
    applicable_scope: 'all',
    target_room_type: 'VIP',
    target_category: 'combo',
    min_loyalty_tier: '',
    expiry_date: '2026-12-31',
    is_first_booking_only: false,
    max_uses_per_user: '1',
    is_active: true,
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 8

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ text, type })
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr))
    }, 3500)
  }

  async function fetchVouchers() {
    setLoading(true)
    try {
      const { data } = await apiClient.get('/api/v1/vouchers/admin/all')
      setVouchers(data || [])
    } catch {
      showToast('Không thể tải danh sách mã khuyến mãi', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [])

  // Close modal when pressing ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen])

  // Scope Tabs definition
  const SCOPE_TABS = [
    { value: 'all', label: 'Tất Cả Voucher', icon: Layers, count: vouchers.length },
    {
      value: 'rooms',
      label: 'Phòng Chiếu (VIP / IMAX)',
      icon: Building2,
      count: vouchers.filter((v) => v.applicable_scope === 'rooms' || Boolean(v.target_room_type) || v.code.includes('VIP')).length,
    },
    {
      value: 'concessions',
      label: 'Bắp Nước & F&B',
      icon: Popcorn,
      count: vouchers.filter((v) => v.applicable_scope === 'concessions' || Boolean(v.target_category)).length,
    },
    {
      value: 'loyalty',
      label: 'Hạng Thành Viên',
      icon: Crown,
      count: vouchers.filter((v) => Boolean(v.min_loyalty_tier) || v.applicable_scope === 'loyalty').length,
    },
    {
      value: 'expired',
      label: 'Hết Hạn / Tạm Khóa',
      icon: Clock,
      count: vouchers.filter((v) => !v.is_active || (v.expiry_date && new Date(v.expiry_date) < new Date())).length,
    },
  ]

  // Filtered Vouchers
  const filteredVouchers = useMemo(() => {
    let result = vouchers

    if (selectedScopeTab === 'rooms') {
      result = result.filter((v) => v.applicable_scope === 'rooms' || Boolean(v.target_room_type) || v.code.includes('VIP'))
    } else if (selectedScopeTab === 'concessions') {
      result = result.filter((v) => v.applicable_scope === 'concessions' || Boolean(v.target_category))
    } else if (selectedScopeTab === 'loyalty') {
      result = result.filter((v) => Boolean(v.min_loyalty_tier) || v.applicable_scope === 'loyalty')
    } else if (selectedScopeTab === 'expired') {
      const now = new Date()
      result = result.filter((v) => !v.is_active || (v.expiry_date && new Date(v.expiry_date) < now))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase()
      result = result.filter((v) => v.code.includes(q))
    }

    return result
  }, [vouchers, selectedScopeTab, searchQuery])

  // Open Drawer in Create Mode
  function handleOpenCreate() {
    setDrawerMode('create')
    let defaultScope: 'all' | 'rooms' | 'concessions' | 'loyalty' = 'all'
    if (selectedScopeTab === 'rooms') defaultScope = 'rooms'
    else if (selectedScopeTab === 'concessions') defaultScope = 'concessions'
    else if (selectedScopeTab === 'loyalty') defaultScope = 'loyalty'

    setFormData({
      code: '',
      discount_type: 'percent',
      discount_value: '10',
      min_spend: '0',
      max_discount: '50000',
      applicable_scope: defaultScope,
      target_room_type: 'VIP',
      target_category: 'combo',
      min_loyalty_tier: defaultScope === 'loyalty' ? 'gold' : '',
      expiry_date: '2026-12-31',
      is_first_booking_only: false,
      max_uses_per_user: '1',
      is_active: true,
    })
    setIsDrawerOpen(true)
  }

  // Open Drawer in Edit Mode
  function handleOpenEdit(voucher: VoucherAdminItem) {
    setDrawerMode('edit')
    setFormData({
      id: voucher.id,
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: String(voucher.discount_value),
      min_spend: String(voucher.min_spend || 0),
      max_discount: voucher.max_discount ? String(voucher.max_discount) : '',
      applicable_scope: (voucher.applicable_scope as any) || (voucher.min_loyalty_tier ? 'loyalty' : voucher.target_room_type ? 'rooms' : voucher.target_category ? 'concessions' : 'all'),
      target_room_type: voucher.target_room_type || 'VIP',
      target_category: voucher.target_category || 'combo',
      min_loyalty_tier: voucher.min_loyalty_tier || '',
      expiry_date: voucher.expiry_date || '',
      is_first_booking_only: voucher.is_first_booking_only ?? false,
      max_uses_per_user: String(voucher.max_uses_per_user || 1),
      is_active: voucher.is_active,
    })
    setIsDrawerOpen(true)
  }

  // Quick Toggle Voucher Active Status
  async function handleToggleActive(voucher: VoucherAdminItem) {
    try {
      await apiClient.put(`/api/v1/vouchers/${voucher.id}`, {
        is_active: !voucher.is_active,
      })
      showToast(`Đã ${!voucher.is_active ? 'kích hoạt' : 'tạm khóa'} mã voucher "${voucher.code}"`)
      await fetchVouchers()
    } catch {
      showToast('Lỗi khi cập nhật trạng thái voucher', 'error')
    }
  }

  // Delete Voucher
  async function handleDeleteVoucher(voucher: VoucherAdminItem) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn voucher "${voucher.code}"?`)) return
    try {
      await apiClient.delete(`/api/v1/vouchers/${voucher.id}`)
      showToast(`Đã xóa voucher "${voucher.code}" thành công`)
      await fetchVouchers()
    } catch {
      showToast('Không thể xóa voucher này', 'error')
    }
  }

  // Copy code to clipboard
  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Submit Drawer Form
  async function handleSaveDrawer(e: React.FormEvent) {
    e.preventDefault()
    const code = formData.code.trim().toUpperCase()
    if (!code) {
      showToast('Vui lòng nhập mã voucher', 'error')
      return
    }

    const discountVal = parseFloat(formData.discount_value)
    if (isNaN(discountVal) || discountVal <= 0) {
      showToast('Giá trị giảm giá không hợp lệ', 'error')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        code,
        discount_type: formData.discount_type,
        discount_value: discountVal,
        min_spend: parseFloat(formData.min_spend || '0'),
        max_discount: formData.discount_type === 'percent' && formData.max_discount ? parseFloat(formData.max_discount) : null,
        applicable_scope: formData.applicable_scope,
        target_room_type: formData.applicable_scope === 'rooms' ? formData.target_room_type : null,
        target_category: formData.applicable_scope === 'concessions' ? formData.target_category : null,
        min_loyalty_tier: formData.applicable_scope === 'loyalty' || formData.min_loyalty_tier ? (formData.min_loyalty_tier || null) : null,
        expiry_date: formData.expiry_date || null,
        is_first_booking_only: formData.is_first_booking_only,
        max_uses_per_user: parseInt(formData.max_uses_per_user || '1'),
        is_active: formData.is_active,
      }

      if (drawerMode === 'create') {
        await apiClient.post('/api/v1/vouchers/', payload)
        showToast(`Đã tạo thành công voucher "${code}"`)
      } else if (formData.id) {
        await apiClient.put(`/api/v1/vouchers/${formData.id}`, payload)
        showToast(`Đã cập nhật thông tin voucher "${code}"`)
      }

      setIsDrawerOpen(false)
      await fetchVouchers()
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Lỗi khi lưu voucher'
      showToast(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), 'error')
    } finally {
      setSaving(false)
    }
  }

  const cardCls = isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
  const inputCls = isDark
    ? 'bg-[#0d0d14] border-white/10 text-[#f0ede8] placeholder:text-[#6e6c68] focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-200'

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4">
          <div
            className={cn(
              'px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-semibold backdrop-blur-xl',
              notification.type === 'success'
                ? isDark
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : notification.type === 'warning'
                ? isDark
                  ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
                : isDark
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            )}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : notification.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.text}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className={cn('p-5 sm:p-6 rounded-2xl border transition-all shadow-xs', cardCls)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className={cn('p-2 rounded-xl text-amber-500', isDark ? 'bg-amber-500/10' : 'bg-amber-50')}>
                <Ticket className="w-5 h-5 stroke-[2]" />
              </span>
              <h2 className={cn('font-display font-black text-xl tracking-tight', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                Quản Lý Mã Khuyến Mãi & Voucher
              </h2>
            </div>
            <p className={cn('text-xs pl-10 leading-relaxed', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
              Thiết lập các chương trình ưu đãi, phân loại voucher riêng cho từng phòng chiếu, bắp nước, hạng thành viên và kiểm soát thời hạn áp dụng.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:self-auto self-start">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#e8b84b] hover:bg-[#dfad3e] text-[#09090e] shadow-md transition-all cursor-pointer select-none"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tạo Voucher Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scope Toolbar & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Scope Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SCOPE_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = selectedScopeTab === tab.value

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setSelectedScopeTab(tab.value as any)
                  setCurrentPage(1)
                }}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border select-none',
                  isActive
                    ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-sm'
                    : isDark
                    ? 'bg-[#111118] text-[#a09e9a] border-white/10 hover:text-[#f0ede8] hover:border-white/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-[#09090e]' : 'text-amber-500')} />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-mono-data font-bold',
                    isActive
                      ? 'bg-black/20 text-[#09090e]'
                      : isDark
                      ? 'bg-white/10 text-[#a09e9a]'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[220px] md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a09e9a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Tìm theo mã voucher..."
            className={cn('w-full pl-9 pr-8 py-2 rounded-xl border text-xs outline-none transition-all uppercase font-mono-data', inputCls)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a09e9a] hover:text-[#f0ede8] p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Vouchers Table Card (Full-width Spacious Enterprise Table) */}
      <div className={cn('border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4', cardCls)}>
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-amber-500" />
            <p className={cn('text-xs font-semibold', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
              Đang tải danh sách mã voucher...
            </p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Ticket className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <h4 className={cn('font-bold text-sm', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                Không tìm thấy mã voucher nào
              </h4>
              <p className={cn('text-xs mt-1 max-w-sm', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                {searchQuery
                  ? `Không có mã nào khớp với từ khóa "${searchQuery}".`
                  : 'Chưa có voucher nào trong phần này. Hãy bấm "Tạo Voucher Mới" để thiết lập mã ưu đãi.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#e8b84b] text-[#09090e] hover:bg-[#dfad3e] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tạo Voucher Ngay</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={cn('border-b text-[10px] uppercase font-bold tracking-wider', isDark ? 'border-white/10 text-[#a09e9a]' : 'border-slate-200 text-slate-600')}>
                  <th className="py-3 px-3">Mã Voucher</th>
                  <th className="py-3 px-3">Mức Giảm & Điều Kiện</th>
                  <th className="py-3 px-3">Phạm Vi Áp Dụng</th>
                  <th className="py-3 px-3">Thời Hạn Sử Dụng</th>
                  <th className="py-3 px-3 text-center">Trạng Thái</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-200'}>
                {filteredVouchers
                  .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                  .map((v) => {
                    const isExpired = v.expiry_date && new Date(v.expiry_date) < new Date()

                    return (
                      <tr key={v.id} className={cn('transition-colors group', !v.is_active ? 'opacity-60' : 'hover:bg-white/[0.02]')}>
                        {/* Code Column */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-data font-black text-sm text-[#e8b84b] tracking-wider">
                              {v.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(v.code)}
                              title="Sao chép mã"
                              className={cn(
                                'p-1 rounded-md text-[#a09e9a] hover:text-[#f0ede8] transition-colors cursor-pointer',
                                isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                              )}
                            >
                              {copiedCode === v.code ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {v.is_first_booking_only && (
                            <span className="inline-block mt-1 text-[10px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/25 px-2 py-0.5 rounded-md">
                              Đơn đầu tiên
                            </span>
                          )}
                        </td>

                        {/* Discount & Spend */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-sm text-emerald-400">
                            {v.discount_type === 'percent' ? (
                              <>
                                Giảm <span className="font-mono-data">{v.discount_value}%</span>
                                {v.max_discount && (
                                  <span className="text-[11px] font-normal text-[#a09e9a] block">
                                    Tối đa <span className="font-mono-data">{Number(v.max_discount).toLocaleString('vi-VN')}₫</span>
                                  </span>
                                )}
                              </>
                            ) : (
                              <>Giảm <span className="font-mono-data">{Number(v.discount_value).toLocaleString('vi-VN')}₫</span></>
                            )}
                          </div>
                          {v.min_spend > 0 && (
                            <span className="text-[11px] text-[#a09e9a] block mt-0.5">
                              Đơn tối thiểu {Number(v.min_spend).toLocaleString('vi-VN')}₫
                            </span>
                          )}
                        </td>

                        {/* Scope Column */}
                        <td className="py-3.5 px-3">
                          {v.applicable_scope === 'rooms' || v.target_room_type || v.code.includes('VIP') ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>Phòng {v.target_room_type || 'VIP / Đặc biệt'}</span>
                            </span>
                          ) : v.applicable_scope === 'concessions' || v.target_category ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-500/10 border border-orange-500/30 text-orange-400">
                              <Popcorn className="w-3.5 h-3.5" />
                              <span>Bắp Nước F&B</span>
                            </span>
                          ) : v.min_loyalty_tier || v.applicable_scope === 'loyalty' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400 capitalize">
                              <Crown className="w-3.5 h-3.5" />
                              <span>
                                {v.min_loyalty_tier === 'diamond'
                                  ? 'Hạng Kim Cương'
                                  : v.min_loyalty_tier === 'gold'
                                  ? 'Hạng Vàng+'
                                  : v.min_loyalty_tier === 'silver'
                                  ? 'Hạng Bạc+'
                                  : 'Hạng Đồng+'}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-[#a09e9a]">
                              <Layers className="w-3.5 h-3.5" />
                              <span>Toàn hệ thống</span>
                            </span>
                          )}
                        </td>

                        {/* Expiry Column */}
                        <td className="py-3.5 px-3">
                          <div className="text-xs font-semibold">
                            {v.expiry_date ? formatVNFullDate(v.expiry_date) : 'Vô thời hạn'}
                          </div>
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-wider block mt-0.5',
                              isExpired ? 'text-rose-400' : 'text-emerald-400'
                            )}
                          >
                            {isExpired ? 'Đã hết hạn' : 'Còn hiệu lực'}
                          </span>
                        </td>

                        {/* Active Toggle Switch Column */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(v)}
                            title={v.is_active ? 'Nhấp để tạm khóa mã này' : 'Nhấp để kích hoạt lại'}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all inline-flex items-center gap-1.5',
                              v.is_active
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', v.is_active ? 'bg-emerald-400' : 'bg-slate-400')} />
                            <span>{v.is_active ? 'Đang bật' : 'Đã khóa'}</span>
                          </button>
                        </td>

                        {/* Action Buttons Column */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(v)}
                              title="Chỉnh sửa voucher"
                              className={cn(
                                'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all',
                                isDark
                                  ? 'bg-white/5 hover:bg-white/10 text-[#f0ede8] border-white/10'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              )}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteVoucher(v)}
                              title="Xóa voucher"
                              className="p-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}

        {filteredVouchers.length > PAGE_SIZE && (
          <PaginationControl
            currentPage={currentPage}
            totalItems={filteredVouchers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* ── CENTERED MODAL: CREATE / EDIT VOUCHER ── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" />

          <div
            className={cn(
              'relative z-10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border overflow-hidden animate-in zoom-in-95 fade-in duration-200',
              isDark ? 'bg-[#111118] border-white/15 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
            )}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className={cn('p-2.5 rounded-2xl text-amber-500', isDark ? 'bg-amber-500/10' : 'bg-amber-50')}>
                  {drawerMode === 'create' ? <Plus className="w-5 h-5 stroke-[2.5]" /> : <Pencil className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className={cn('font-display font-black text-lg', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    {drawerMode === 'create' ? 'Tạo Mã Khuyến Mãi Mới' : `Chỉnh Sửa Voucher: ${formData.code}`}
                  </h3>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                    Thiết lập quy tắc giảm giá, phân loại phạm vi áp dụng và thời hạn hiệu lực
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className={cn('p-2 rounded-xl text-[#a09e9a] hover:text-[#f0ede8] transition-colors cursor-pointer', isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form id="voucher-drawer-form" onSubmit={handleSaveDrawer} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Section 1: Code & Discount */}
              <div className="space-y-4">
                <h4 className={cn('text-xs font-bold uppercase tracking-wider pb-1 border-b border-white/5 flex items-center gap-2', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  <span>1. Mã Khuyến Mãi & Mức Giảm Giá</span>
                </h4>

                <div>
                  <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                    Mã Giảm Giá (Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="Vd: SUMMER2026, VIP50K, POPCORNFREE..."
                    className={cn('w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono-data font-bold uppercase outline-none transition-all', inputCls)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Loại Giảm Giá <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData((f) => ({ ...f, discount_type: e.target.value as any }))}
                      className={cn('w-full px-3 py-2.5 rounded-xl border text-xs outline-none transition-all cursor-pointer', inputCls)}
                    >
                      <option value="percent">Theo Phần Trăm (%)</option>
                      <option value="fixed">Số Tiền Cố Định (VNĐ)</option>
                    </select>
                  </div>

                  <div>
                    <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Giá Trị Giảm {formData.discount_type === 'percent' ? '(%)' : '(VNĐ)'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      step={formData.discount_type === 'percent' ? 1 : 1000}
                      value={formData.discount_value}
                      onChange={(e) => setFormData((f) => ({ ...f, discount_value: e.target.value }))}
                      placeholder={formData.discount_type === 'percent' ? '15' : '50000'}
                      className={cn('w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono-data font-bold outline-none transition-all', inputCls)}
                    />
                  </div>
                </div>

                {formData.discount_type === 'percent' && (
                  <div>
                    <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Giảm Tối Đa (VNĐ) <span className="text-[11px] font-normal text-[#a09e9a]">(Tùy chọn)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={formData.max_discount}
                      onChange={(e) => setFormData((f) => ({ ...f, max_discount: e.target.value }))}
                      placeholder="Vd: 50000 (Để trống nếu không giới hạn trần)"
                      className={cn('w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono-data outline-none transition-all', inputCls)}
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Dedicated Scope Selection (User Requirement) */}
              <div className="space-y-4 pt-2">
                <h4 className={cn('text-xs font-bold uppercase tracking-wider pb-1 border-b border-white/5 flex items-center justify-between', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  <span>2. Phạm Vi Áp Dụng Riêng Biệt</span>
                  <span className="text-[10px] font-normal text-[#a09e9a]">Phòng chiếu / F&B / Hạng thẻ</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, applicable_scope: 'all' }))}
                    className={cn(
                      'p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5',
                      formData.applicable_scope === 'all'
                        ? 'bg-amber-500/15 border-amber-500 text-[#e8b84b]'
                        : isDark
                        ? 'bg-white/[0.02] border-white/10 text-[#a09e9a] hover:border-white/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    <Layers className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                    <div>
                      <div className="font-bold text-xs">Toàn Hệ Thống</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Áp dụng cho mọi loại đơn hàng</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, applicable_scope: 'rooms' }))}
                    className={cn(
                      'p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5',
                      formData.applicable_scope === 'rooms'
                        ? 'bg-amber-500/15 border-amber-500 text-[#e8b84b]'
                        : isDark
                        ? 'bg-white/[0.02] border-white/10 text-[#a09e9a] hover:border-white/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    <Building2 className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                    <div>
                      <div className="font-bold text-xs">Phòng Chiếu</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Chỉ áp dụng cho vé phòng VIP, IMAX...</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, applicable_scope: 'concessions' }))}
                    className={cn(
                      'p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5',
                      formData.applicable_scope === 'concessions'
                        ? 'bg-amber-500/15 border-amber-500 text-[#e8b84b]'
                        : isDark
                        ? 'bg-white/[0.02] border-white/10 text-[#a09e9a] hover:border-white/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    <Popcorn className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                    <div>
                      <div className="font-bold text-xs">Bắp Nước & F&B</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Chỉ áp dụng cho các món đồ ăn, uống</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, applicable_scope: 'loyalty' }))}
                    className={cn(
                      'p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5',
                      formData.applicable_scope === 'loyalty'
                        ? 'bg-amber-500/15 border-amber-500 text-[#e8b84b]'
                        : isDark
                        ? 'bg-white/[0.02] border-white/10 text-[#a09e9a] hover:border-white/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    <Crown className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                    <div>
                      <div className="font-bold text-xs">Hạng Thành Viên</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Dành riêng cho hạng thẻ thành viên</div>
                    </div>
                  </button>
                </div>

                {/* Sub-options for Room Types */}
                {formData.applicable_scope === 'rooms' && (
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                    <label className={cn('text-xs font-bold block uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Chọn Loại Phòng Chiếu Áp Dụng:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'VIP', label: 'Phòng VIP (Sofa cao cấp)' },
                        { value: 'IMAX', label: 'Phòng IMAX (Màn hình lớn)' },
                        { value: '3D', label: 'Phòng Chiếu 3D' },
                        { value: 'STANDARD', label: 'Phòng Tiêu Chuẩn (2D)' },
                      ].map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setFormData((f) => ({ ...f, target_room_type: r.value }))}
                          className={cn(
                            'p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer',
                            formData.target_room_type === r.value
                              ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b]'
                              : isDark
                              ? 'bg-white/5 text-[#f0ede8] border-white/10 hover:border-white/20'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                          )}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-options for Concessions Category */}
                {formData.applicable_scope === 'concessions' && (
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                    <label className={cn('text-xs font-bold block uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Chọn Danh Mục Bắp Nước Áp Dụng:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'all', label: 'Toàn bộ đồ ăn & uống' },
                        { value: 'combo', label: 'Chỉ các Combo F&B' },
                        { value: 'popcorn', label: 'Chỉ các loại Bắp Rang' },
                        { value: 'drink', label: 'Chỉ Nước Giải Khát' },
                      ].map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setFormData((f) => ({ ...f, target_category: c.value }))}
                          className={cn(
                            'p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer',
                            formData.target_category === c.value
                              ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b]'
                              : isDark
                              ? 'bg-white/5 text-[#f0ede8] border-white/10 hover:border-white/20'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                          )}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-options for Loyalty Tiers */}
                {(formData.applicable_scope === 'loyalty' || formData.min_loyalty_tier) && (
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                    <label className={cn('text-xs font-bold block uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Hạng Thành Viên Tối Thiểu (Loyalty Tier):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: '', label: 'Tất cả thành viên' },
                        { value: 'bronze', label: 'Hạng Đồng trở lên (Bronze+)' },
                        { value: 'silver', label: 'Hạng Bạc trở lên (Silver+)' },
                        { value: 'gold', label: 'Hạng Vàng trở lên (Gold+)' },
                        { value: 'diamond', label: 'Hạng Kim Cương (Diamond)' },
                      ].map((tier) => (
                        <button
                          key={tier.value}
                          type="button"
                          onClick={() => setFormData((f) => ({ ...f, min_loyalty_tier: tier.value }))}
                          className={cn(
                            'p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer',
                            formData.min_loyalty_tier === tier.value
                              ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b]'
                              : isDark
                              ? 'bg-white/5 text-[#f0ede8] border-white/10 hover:border-white/20'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                          )}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Conditions & Limits */}
              <div className="space-y-4 pt-2">
                <h4 className={cn('text-xs font-bold uppercase tracking-wider pb-1 border-b border-white/5 flex items-center gap-2', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  <span>3. Điều Kiện Áp Dụng & Giới Hạn</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Đơn Hàng Tối Thiểu (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={formData.min_spend}
                      onChange={(e) => setFormData((f) => ({ ...f, min_spend: e.target.value }))}
                      placeholder="0"
                      className={cn('w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono-data outline-none transition-all', inputCls)}
                    />
                  </div>

                  <div>
                    <label className={cn('text-xs font-bold block mb-1.5 uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Số Lần Dùng / Người
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.max_uses_per_user}
                      onChange={(e) => setFormData((f) => ({ ...f, max_uses_per_user: e.target.value }))}
                      placeholder="1"
                      className={cn('w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono-data outline-none transition-all', inputCls)}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <span className={cn('text-xs font-bold block', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                      Đơn Hàng Đầu Tiên
                    </span>
                    <span className={cn('text-[11px]', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                      Chỉ cho phép tài khoản chưa từng đặt vé áp dụng
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_first_booking_only}
                    onChange={(e) => setFormData((f) => ({ ...f, is_first_booking_only: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/20 accent-[#e8b84b] cursor-pointer"
                  />
                </div>
              </div>

              {/* Section 4: Expiry Calendar (Using CleanDatePicker as requested) */}
              <div className="space-y-4 pt-2">
                <h4 className={cn('text-xs font-bold uppercase tracking-wider pb-1 border-b border-white/5 flex items-center gap-2', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  <span>4. Thời Hạn Hiệu Lực & Kích Hoạt</span>
                </h4>

                <div>
                  <CleanDatePicker
                    label="Ngày Hết Hạn (Expiry Date)"
                    value={formData.expiry_date}
                    minDate={toLocalYYYYMMDD(new Date())}
                    onChange={(dateStr) => setFormData((f) => ({ ...f, expiry_date: dateStr }))}
                    isDark={isDark}
                    placeholder="Chọn ngày kết thúc hiệu lực..."
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div>
                    <span className={cn('text-xs font-bold block', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                      Trạng Thái Áp Dụng
                    </span>
                    <span className={cn('text-[11px]', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                      {formData.is_active ? 'Khách hàng có thể nhập mã ngay bây giờ' : 'Tạm khóa mã, chưa cho phép sử dụng'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, is_active: !f.is_active }))}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5',
                      formData.is_active
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : isDark
                        ? 'bg-white/5 border-white/10 text-slate-400'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full', formData.is_active ? 'bg-emerald-400' : 'bg-slate-400')} />
                    <span>{formData.is_active ? 'Đang bật' : 'Đang khóa'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Drawer Sticky Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all',
                  isDark ? 'bg-white/10 hover:bg-white/15 text-[#a09e9a]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                )}
              >
                Hủy Bỏ
              </button>

              <button
                form="voucher-drawer-form"
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#e8b84b] hover:bg-[#dfad3e] text-[#09090e] transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{drawerMode === 'create' ? 'Tạo Voucher' : 'Lưu Thay Đổi'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isAuthenticated, isAuthLoading } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const tabParam = searchParams.get('tab') as
    | 'movies'
    | 'showtimes'
    | 'rooms'
    | 'vouchers'
    | 'concessions'
    | 'loyalty'
    | 'analytics'
    | 'users'
    | 'scanner'
    | null

  const [activeTabState, setActiveTabState] = useState<
    'movies' | 'showtimes' | 'rooms' | 'vouchers' | 'concessions' | 'loyalty' | 'analytics' | 'users' | 'scanner' | 'refunds' | 'reviews'
  >(() => {
    if (tabParam) return tabParam as any
    const stored = localStorage.getItem('admin_active_tab')
    return (stored as any) || 'movies'
  })

  const activeTab = tabParam || activeTabState

  const setActiveTab = (tab: 'movies' | 'showtimes' | 'rooms' | 'vouchers' | 'concessions' | 'loyalty' | 'analytics' | 'users' | 'scanner' | 'refunds' | 'reviews') => {
    setActiveTabState(tab)
    localStorage.setItem('admin_active_tab', tab)
    setSearchParams({ tab })
  }

  // Ensure URL query param stays updated with tab
  useEffect(() => {
    if (activeTab && !searchParams.get('tab')) {
      setSearchParams({ tab: activeTab }, { replace: true })
    }
  }, [activeTab, searchParams, setSearchParams])

  // Sub-tab filter for Movies management (Đang chiếu vs Sắp ra mắt)
  const [movieSubTab, setMovieSubTab] = useState<'now_showing' | 'coming_soon' | 'ended' | 'all'>('now_showing')

  // Pagination states
  const [moviePage, setMoviePage] = useState(1)
  const [showtimePage, setShowtimePage] = useState(1)
  const [roomPage, setRoomPage] = useState(1)
  const [voucherPage, setVoucherPage] = useState(1)
  const PAGE_SIZE = 8

  // Check Admin Access Guard - Redirect non-admin users to profile
  useEffect(() => {
    if (isAuthLoading) return

    if (!isAuthenticated) {
      if (localStorage.getItem('access_token')) return
      navigate('/')
      return
    }

    if (user && user.role !== 'admin') {
      navigate('/profile?tab=loyalty')
      return
    }

    if (user && user.role === 'admin') {
      loadAllData()
    }
  }, [isAuthenticated, isAuthLoading, user, navigate])

  // ─────────────────────────────────────────
  // Data States
  // ─────────────────────────────────────────
  const [movies, setMovies] = useState<MovieItem[]>([])
  const [detailMovieModal, setDetailMovieModal] = useState<MovieItem | null>(null)
  const [movieSearchQuery, setMovieSearchQuery] = useState('')
  const [movieGenreFilter, setMovieGenreFilter] = useState('all')
  const [showtimes, setShowtimes] = useState<ShowtimeItem[]>([])

  useEffect(() => {
    setMoviePage(1)
  }, [movieSubTab, movieSearchQuery, movieGenreFilter])

  // Computed metrics and filters for Movies tab
  const allMovieGenres = useMemo(() => {
    const set = new Set<string>()
    movies.forEach((m) => {
      m.genres?.forEach((g) => {
        if (g?.name) set.add(g.name.replace(/^Phim\s+/i, '').trim())
      })
    })
    return Array.from(set).sort()
  }, [movies])

  const movieMetrics = useMemo(() => {
    const total = movies.length
    const nowShowing = movies.filter((m) => m.status === 'now_showing').length
    const comingSoon = movies.filter((m) => m.status === 'coming_soon').length
    const ended = movies.filter((m) => m.status === 'ended').length
    return { total, nowShowing, comingSoon, ended }
  }, [movies])

  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      if (movieSubTab === 'now_showing' && m.status !== 'now_showing') return false
      if (movieSubTab === 'coming_soon' && m.status !== 'coming_soon') return false
      if (movieSubTab === 'ended' && m.status !== 'ended') return false

      if (movieSearchQuery.trim()) {
        const q = movieSearchQuery.toLowerCase().trim()
        const titleMatch = m.title.toLowerCase().includes(q)
        const directorMatch = m.director?.toLowerCase().includes(q)
        const idMatch = String(m.id).includes(q)
        if (!titleMatch && !directorMatch && !idMatch) return false
      }

      if (movieGenreFilter !== 'all') {
        const genreMatch = m.genres?.some(
          (g) => g?.name && g.name.replace(/^Phim\s+/i, '').trim().toLowerCase() === movieGenreFilter.toLowerCase()
        )
        if (!genreMatch) return false
      }

      return true
    })
  }, [movies, movieSubTab, movieSearchQuery, movieGenreFilter])

  useEffect(() => {
    if (detailMovieModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [detailMovieModal])
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [vouchers, setVouchers] = useState<VoucherAdminItem[]>([])
  const [loading, setLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)
  const [autoModalError, setAutoModalError] = useState<string | null>(null)
  const notifyTimeoutRef = useRef<any>(null)

  const notify = (type: 'success' | 'error' | 'warning', text: string) => {
    if (notifyTimeoutRef.current) {
      clearTimeout(notifyTimeoutRef.current)
    }
    setActionMsg({ type, text })
    notifyTimeoutRef.current = setTimeout(() => {
      setActionMsg(null)
    }, type === 'error' ? 8000 : 5000)
  }

  // Create Voucher Form State
  const [vCode, setVCode] = useState('')
  const [vType, setVType] = useState<'percent' | 'fixed'>('percent')
  const [vValue, setVValue] = useState<number>(10)
  const [vMinSpend, setVMinSpend] = useState<number>(0)
  const [vMaxDiscount, setVMaxDiscount] = useState<number>(50000)
  const [vExpiry, setVExpiry] = useState<string>('2026-12-31')
  const [vFirstOnly, setVFirstOnly] = useState<boolean>(false)
  const [vMaxPerUser, setVMaxPerUser] = useState<number>(1)
  const [vMinLoyaltyTier, setVMinLoyaltyTier] = useState<string>('')
  const [vLoading, setVLoading] = useState(false)



  // Create Showtime Form State
  const [stMovieId, setStMovieId] = useState<number>(0)
  const [stRoomId, setStRoomId] = useState<number>(0)
  const [stStartTime, setStStartTime] = useState<string>('')
  const [stBasePrice, setStBasePrice] = useState<number>(90000)
  const [stVipPrice, setStVipPrice] = useState<number>(120000)
  const [stLoading, setStLoading] = useState(false)

  // Showtime Filters State
  const [stFilterMovieId, setStFilterMovieId] = useState<number | 'all'>('all')
  const [stFilterRoomId, setStFilterRoomId] = useState<number | 'all'>('all')
  const [stTimeFilter, setStTimeFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [stSearchQuery, setStSearchQuery] = useState('')

  // Dedicated Showtime Cancellation State
  const [cancelMode, setCancelMode] = useState<'single' | 'movie' | 'all'>('single')
  const [cancelSingleStId, setCancelSingleStId] = useState<number>(0)
  const [cancelMovieIds, setCancelMovieIds] = useState<number[]>([])
  const [selectedStIds, setSelectedStIds] = useState<number[]>([])

  // Ticket Scanner / Verification State
  const [scannerTicketCode, setScannerTicketCode] = useState('')
  const [scannerResult, setScannerResult] = useState<{
    valid: boolean
    status_code: 'VALID' | 'CANCELLED' | 'CHECKED_IN' | 'NOT_FOUND'
    message: string
    reservation?: any
  } | null>(null)
  const [scannerLoading, setScannerLoading] = useState(false)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [recentCheckIns, setRecentCheckIns] = useState<Array<{
    ticket_code: string
    movie_title: string
    room_name: string
    checked_in_at: string
  }>>([])

  async function handleVerifyTicketCode(codeToVerify?: string) {
    const code = (codeToVerify || scannerTicketCode).trim()
    if (!code) return

    setScannerLoading(true)
    try {
      const res = await apiClient.post('/api/v1/reservations/verify-ticket', {
        ticket_code: code,
      })
      setScannerResult(res.data)
    } catch (err: any) {
      setScannerResult({
        valid: false,
        status_code: 'NOT_FOUND',
        message: err.response?.data?.detail || `Không tìm thấy thông tin vé '${code}'.`,
      })
    } finally {
      setScannerLoading(false)
    }
  }

  async function handlePerformCheckIn() {
    const code = (scannerResult?.reservation?.ticket_code || scannerTicketCode).trim()
    if (!code) return

    setCheckInLoading(true)
    try {
      const res = await apiClient.post('/api/v1/reservations/check-in', {
        ticket_code: code,
      })

      const resData = res.data
      setScannerResult({
        valid: false,
        status_code: 'CHECKED_IN',
        message: resData.message || 'Check-in thành công! Khán giả đã vào rạp.',
        reservation: resData.reservation,
      })

      if (resData.reservation) {
        const item = resData.reservation
        setRecentCheckIns((prev) => [
          {
            ticket_code: item.ticket_code,
            movie_title: item.showtime?.movie_title || 'N/A',
            room_name: item.showtime?.room_name || 'N/A',
            checked_in_at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
          ...prev.slice(0, 9),
        ])
      }

      notify('success', `Đã check-in cho vé ${code} thành công!`)
    } catch (err: any) {
      notify('error', err.response?.data?.detail || 'Không thể thực hiện check-in cho vé này.')
    } finally {
      setCheckInLoading(false)
    }
  }

  // Create Room Form & Unified Layout Modal State
  const [rName, setRName] = useState('')
  const [rType, setRType] = useState('standard')
  const [rRows, setRRows] = useState(8)
  const [rCols, setRCols] = useState(10)
  const [rLoading, setRLoading] = useState(false)
  const [layoutModalConfig, setLayoutModalConfig] = useState<{
    isOpen: boolean
    roomType?: string | null
    roomIds?: number[]
  }>({ isOpen: false, roomType: null, roomIds: [] })
  const [roomCategoryFilter, setRoomCategoryFilter] = useState<string>('all')
  const [roomSearchQuery, setRoomSearchQuery] = useState<string>('')

  const safeRooms = useMemo(() => (Array.isArray(rooms) ? rooms : []), [rooms])

  const nextRoomNum = useMemo(() => {
    const targetRooms = safeRooms.filter((r) => (r?.room_type || 'standard') === rType)
    const maxNum = targetRooms.reduce((max, r) => Math.max(max, Number(r?.room_number) || 1), 0)
    return maxNum + 1
  }, [safeRooms, rType])

  const { upcomingShowtimesCount, pastShowtimesCount, showtimeMetrics } = useMemo(() => {
    const nowMs = Date.now()
    let upcoming = 0
    let past = 0
    const activeMovieIds = new Set<number>()
    const activeRoomIds = new Set<number>()

    showtimes.forEach((st) => {
      const isPast = new Date(st.end_time || st.start_time).getTime() < nowMs || st.status === 'completed'
      if (isPast) {
        past++
      } else {
        upcoming++
        if (st.movie_id) activeMovieIds.add(st.movie_id)
        if (st.room_id) activeRoomIds.add(st.room_id)
      }
    })
    return {
      upcomingShowtimesCount: upcoming,
      pastShowtimesCount: past,
      showtimeMetrics: {
        total: showtimes.length,
        upcoming,
        past,
        activeMoviesCount: activeMovieIds.size,
        activeRoomsCount: activeRoomIds.size,
      },
    }
  }, [showtimes])

  // Showtimes matching active time filter tab (upcoming / past / all)
  const showtimesForActiveTab = useMemo(() => {
    const nowMs = Date.now()
    return showtimes.filter((st) => {
      const isPast = new Date(st.end_time || st.start_time).getTime() < nowMs || st.status === 'completed'
      if (stTimeFilter === 'upcoming') return !isPast
      if (stTimeFilter === 'past') return isPast
      return true
    })
  }, [showtimes, stTimeFilter])

  // Filter options for Movie dropdown based on active tab showtimes
  const moviesForShowtimeFilter = useMemo(() => {
    if (stTimeFilter === 'all' && stFilterRoomId === 'all') {
      return movies
    }
    const activeMovieIds = new Set<number>()
    showtimesForActiveTab.forEach((st) => {
      if (st.movie_id && (stFilterRoomId === 'all' || st.room_id === stFilterRoomId)) {
        activeMovieIds.add(st.movie_id)
      }
    })
    return movies.filter((m) => activeMovieIds.has(m.id))
  }, [movies, showtimesForActiveTab, stFilterRoomId, stTimeFilter])

  // Filter options for Room dropdown based on active tab showtimes
  const roomsForShowtimeFilter = useMemo(() => {
    if (stTimeFilter === 'all' && stFilterMovieId === 'all') {
      return safeRooms
    }
    const activeRoomIds = new Set<number>()
    showtimesForActiveTab.forEach((st) => {
      if (st.room_id && (stFilterMovieId === 'all' || st.movie_id === stFilterMovieId)) {
        activeRoomIds.add(st.room_id)
      }
    })
    return safeRooms.filter((r) => activeRoomIds.has(r.id))
  }, [safeRooms, showtimesForActiveTab, stFilterMovieId, stTimeFilter])

  // Reset selected movie/room if no longer present in filtered dropdown options
  useEffect(() => {
    if (stFilterMovieId !== 'all' && !moviesForShowtimeFilter.some((m) => m.id === stFilterMovieId)) {
      setStFilterMovieId('all')
    }
  }, [moviesForShowtimeFilter, stFilterMovieId])

  useEffect(() => {
    if (stFilterRoomId !== 'all' && !roomsForShowtimeFilter.some((r) => r.id === stFilterRoomId)) {
      setStFilterRoomId('all')
    }
  }, [roomsForShowtimeFilter, stFilterRoomId])

  const filteredShowtimes = useMemo(() => {
    const nowMs = Date.now()
    const query = stSearchQuery.trim().toLowerCase()
    return showtimes.filter((st) => {
      if (stFilterMovieId !== 'all' && st.movie_id !== stFilterMovieId) return false
      if (stFilterRoomId !== 'all' && st.room_id !== stFilterRoomId) return false

      const isPast = new Date(st.end_time || st.start_time).getTime() < nowMs || st.status === 'completed'
      if (stTimeFilter === 'upcoming' && isPast) return false
      if (stTimeFilter === 'past' && !isPast) return false

      if (query) {
        const mTitle = (st.movie?.title || '').toLowerCase()
        const rName = (st.room?.name || '').toLowerCase()
        const idStr = String(st.id)
        if (!mTitle.includes(query) && !rName.includes(query) && !idStr.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [showtimes, stFilterMovieId, stFilterRoomId, stTimeFilter, stSearchQuery])

  // Auto-Schedule Modal State
  const [autoModalOpen, setAutoModalOpen] = useState(false)
  const [autoStartDate, setAutoStartDate] = useState(() => toLocalYYYYMMDD(new Date()))
  const [autoEndDate, setAutoEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return toLocalYYYYMMDD(d)
  })
  const [autoStartTimeStr, setAutoStartTimeStr] = useState('08:00')
  const [autoEndTimeStr, setAutoEndTimeStr] = useState('23:30')
  const [autoBufferMins, setAutoBufferMins] = useState(15)
  const [autoBasePrice, setAutoBasePrice] = useState(90000)
  const [autoVipPrice, setAutoVipPrice] = useState(120000)
  const [autoReplaceExisting, setAutoReplaceExisting] = useState(true)
  const [autoSmartGenre, setAutoSmartGenre] = useState(true)
  const [autoPricingByRoom, setAutoPricingByRoom] = useState(true)
  const [autoMovieSelectionMode, setAutoMovieSelectionMode] = useState<'all' | 'custom'>('all')
  const [autoSelectedMovieIds, setAutoSelectedMovieIds] = useState<number[]>([])
  const [autoRoomSelectionMode, setAutoRoomSelectionMode] = useState<'all' | 'custom'>('all')
  const [autoSelectedRoomIds, setAutoSelectedRoomIds] = useState<number[]>([])
  const [autoPreviewList, setAutoPreviewList] = useState<ProposedShowtimeItem[] | null>(null)
  const [autoGenerating, setAutoGenerating] = useState(false)
  const [autoConfirming, setAutoConfirming] = useState(false)

  // Auto-Schedule Inline Preview Edit State
  const [editingPreviewIdx, setEditingPreviewIdx] = useState<number | null>(null)
  const [editPreviewRoomId, setEditPreviewRoomId] = useState<number>(0)
  const [editPreviewStartStr, setEditPreviewStartStr] = useState<string>('')
  const [editPreviewBasePrice, setEditPreviewBasePrice] = useState<number>(90000)
  const [editPreviewVipPrice, setEditPreviewVipPrice] = useState<number>(120000)

  const handleStartEditPreview = (idx: number, item: ProposedShowtimeItem) => {
    setEditingPreviewIdx(idx)
    setEditPreviewRoomId(item.room_id)
    const d = new Date(item.start_time)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    setEditPreviewStartStr(localIso)
    setEditPreviewBasePrice(Number(item.base_price))
    setEditPreviewVipPrice(Number(item.vip_price))
  }

  const handleSaveEditPreview = (idx: number) => {
    if (!autoPreviewList) return
    const targetRoom = rooms.find((r) => r.id === editPreviewRoomId)
    const startDt = new Date(editPreviewStartStr)
    const item = autoPreviewList[idx]
    const targetMovie = movies.find((m) => m.id === item.movie_id)
    const durationMins = targetMovie?.duration_minutes || 120
    const endDt = new Date(startDt.getTime() + durationMins * 60 * 1000)

    const updated = [...autoPreviewList]
    updated[idx] = {
      ...item,
      room_id: editPreviewRoomId,
      room_name: targetRoom?.name || item.room_name,
      room_type: targetRoom?.room_type || item.room_type,
      start_time: startDt.toISOString(),
      end_time: endDt.toISOString(),
      base_price: editPreviewBasePrice,
      vip_price: editPreviewVipPrice,
    }
    setAutoPreviewList(updated)
    setEditingPreviewIdx(null)
  }

  const [liveAnalytics, setLiveAnalytics] = useState<{
    total_revenue: number
    total_reservations: number
    active_movies_count: number
    total_users_count: number
    total_rooms_count: number
    total_showtimes_count: number
    monthly_revenue?: Array<{ month: string; revenue: number; tickets: number }>
    movie_revenue_breakdown?: Array<{ movie_id: number; movie_title: string; revenue: number; tickets: number; percentage: number }>
    room_occupancy?: Array<{ room_id: number; room_name: string; occupancy_rate: number; total_seats: number; booked_seats: number }>
    recent_transactions?: Array<{ id: number; ticket_code: string; customer_name: string; movie_title: string; total_price: number; payment_method: string; created_at: string }>
  } | null>(null)

  const [capacityReport, setCapacityReport] = useState<Array<{
    showtime_id: number
    movie_title: string
    room_name: string
    total_seats: number
    reserved_seats: number
    available_seats: number
    occupancy_rate: number
    revenue: number
  }>>([])

  async function loadAllData() {
    setLoading(true)
    try {
      const [movRes, rmRes, stRes, anaRes, capRes, vchRes] = await Promise.all([
        apiClient.get<{ items: MovieItem[] }>('/api/v1/movies/?page_size=5000').catch((err) => {
          console.error('Failed to load movies:', err)
          setActionMsg({ type: 'error', text: 'Không thể tải danh sách phim từ máy chủ.' })
          return null
        }),
        apiClient.get<RoomItem[]>('/api/v1/rooms/').catch((err) => {
          console.error('Failed to load rooms:', err)
          setActionMsg({ type: 'error', text: 'Không thể tải danh sách phòng chiếu từ máy chủ.' })
          return null
        }),
        apiClient.get<{ items: ShowtimeItem[] }>('/api/v1/showtimes/?page_size=5000').catch((err) => {
          console.error('Failed to load showtimes:', err)
          setActionMsg({ type: 'error', text: 'Không thể tải danh sách suất chiếu từ máy chủ.' })
          return null
        }),
        apiClient.get<any>('/api/v1/analytics/dashboard').catch(() => null),
        apiClient.get<any[]>('/api/v1/reservations/admin/report/capacity').catch(() => null),
        apiClient.get<VoucherAdminItem[]>('/api/v1/vouchers/admin/all').catch(() => null),
      ])

      if (movRes?.data?.items) setMovies(movRes.data.items)
      if (rmRes?.data) {
        if (Array.isArray(rmRes.data)) {
          setRooms(rmRes.data)
        } else if (Array.isArray((rmRes.data as any).items)) {
          setRooms((rmRes.data as any).items)
        }
      }
      if (stRes?.data?.items) setShowtimes(stRes.data.items)
      if (anaRes?.data) setLiveAnalytics(anaRes.data)
      if (capRes?.data) setCapacityReport(capRes.data)
      if (vchRes?.data) setVouchers(vchRes.data)
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateVoucher(e: React.FormEvent) {
    e.preventDefault()
    if (!vCode.trim()) return

    setVLoading(true)
    try {
      await apiClient.post('/api/v1/vouchers/', {
        code: vCode.trim().toUpperCase(),
        discount_type: vType,
        discount_value: Number(vValue),
        min_spend: Number(vMinSpend),
        max_discount: vType === 'percent' ? Number(vMaxDiscount) : null,
        expiry_date: vExpiry || null,
        is_first_booking_only: vFirstOnly,
        max_uses_per_user: Number(vMaxPerUser) || 1,
        min_loyalty_tier: vMinLoyaltyTier || null,
        is_active: true,
      })

      notify('success', `Tạo voucher khuyến mãi "${vCode.toUpperCase()}" thành công!`)
      setVCode('')
      setVMinLoyaltyTier('')
      await loadAllData()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Tạo mã voucher thất bại.'
      notify('error', typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setVLoading(false)
    }
  }



  async function handleViewMovieDetail(movie: MovieItem) {
    setDetailMovieModal(movie)
    try {
      const { data } = await apiClient.get<MovieItem>(`/api/v1/movies/${movie.id}`)
      setDetailMovieModal(data)
    } catch (err) {
      console.error('Không thể tải chi tiết phim:', err)
      setActionMsg({ type: 'error', text: 'Không thể tải đầy đủ chi tiết phim (trailer/đạo diễn có thể chưa cập nhật).' })
    }
  }

  async function handleToggleVoucherActive(voucher: VoucherAdminItem) {
    try {
      await apiClient.put(`/api/v1/vouchers/${voucher.id}`, {
        is_active: !voucher.is_active,
      })
      notify('success', `Đã ${!voucher.is_active ? 'bật' : 'tắt'} mã voucher "${voucher.code}" thành công!`)
      await loadAllData()
    } catch (err: any) {
      notify('error', 'Cập nhật trạng thái voucher thất bại.')
    }
  }

  // Toggle Movie Status
  async function handleToggleMovieStatus(movie: MovieItem) {
    const nextStatus =
      movie.status === 'now_showing'
        ? 'coming_soon'
        : movie.status === 'coming_soon'
        ? 'ended'
        : 'now_showing'

    const nextLabel =
      nextStatus === 'now_showing'
        ? 'Đang chiếu'
        : nextStatus === 'coming_soon'
        ? 'Sắp ra mắt'
        : 'Ngừng chiếu'

    try {
      await apiClient.put(`/api/v1/movies/${movie.id}`, { status: nextStatus })
      notify('success', `Đã đổi trạng thái phim "${movie.title}" sang "${nextLabel}" thành công!`)
      await loadAllData()
    } catch (err: any) {
      notify('error', err.response?.data?.detail ?? 'Không thể cập nhật trạng thái phim.')
    }
  }

  // Handle Delete Movie
  async function handleDeleteMovie(movieId: number, title: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa phim "${title}"?`)) return
    try {
      await apiClient.delete(`/api/v1/movies/${movieId}`)
      notify('success', `Đã xóa phim "${title}" thành công!`)
      await loadAllData()
    } catch (err: any) {
      notify('error', err.response?.data?.detail ?? 'Xóa phim thất bại.')
    }
  }

  // Handle Delete Room
  async function handleDeleteRoom(roomId: number, roomName: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa phòng "${roomName}"?\nLưu ý: Bạn cần hủy các suất chiếu của phòng này trước khi xóa.`)) return
    try {
      const res = await apiClient.delete(`/api/v1/rooms/${roomId}`)
      const msg = res.data?.message ?? `Đã xóa phòng "${roomName}" thành công!`
      notify('success', msg)
      await loadAllData()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Xóa phòng thất bại.'
      notify('error', typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
  }

  // Handle Create Showtime
  async function handleCreateShowtime(e: React.FormEvent) {
    e.preventDefault()
    if (!stMovieId || !stRoomId || !stStartTime) {
      notify('error', 'Vui lòng điền đầy đủ Phim, Phòng chiếu và Thời gian khởi chiếu.')
      return
    }

    setStLoading(true)
    try {
      const isoStartTime = new Date(stStartTime).toISOString()

      await apiClient.post('/api/v1/showtimes/', {
        movie_id: Number(stMovieId),
        room_id: Number(stRoomId),
        start_time: isoStartTime,
        base_price: Number(stBasePrice),
        vip_price: Number(stVipPrice),
      })

      notify('success', 'Tạo suất chiếu mới thành công!')
      setStStartTime('')
      await loadAllData()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Tạo suất chiếu thất bại (Có thể bị trùng lịch chiếu).'
      notify('error', typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setStLoading(false)
    }
  }

  // Handle Create Room
  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault()

    setRLoading(true)
    try {
      const payloadName = rName.trim() ? rName.trim() : undefined
      const res = await apiClient.post('/api/v1/rooms/', {
        name: payloadName,
        room_type: rType,
        total_rows: Number(rRows),
        total_cols: Number(rCols),
      })

      const createdName = res.data?.name || payloadName || 'Phòng chiếu mới'
      notify('success', `Tạo phòng chiếu "${createdName}" thành công với ${rRows * rCols} ghế!`)
      setRName('')
      await loadAllData()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Tạo phòng chiếu thất bại.'
      notify('error', typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setRLoading(false)
    }
  }

  // Handle TMDB Auto-Sync (Now Showing & Coming Soon)
  const [autoSyncLoading, setAutoSyncLoading] = useState(false)
  const [syncLimit, setSyncLimit] = useState(12)

  async function handleAutoSyncTmdb() {
    setAutoSyncLoading(true)
    try {
      const { data } = await apiClient.post<any>(
        `/api/v1/movies/tmdb/auto-sync?limit=${syncLimit}`,
        {},
        { timeout: 120000 }
      )
      let msgText = data.message ?? 'Đã lấy phim thành công từ TMDB!'
      if (data.failed_items && data.failed_items.length > 0) {
        const reasons = data.failed_items
          .slice(0, 5)
          .map((f: any) => `• ${f.title ?? f.tmdb_id}: ${f.reason}`)
          .join('\n')
        msgText += `\n${data.failed_items.length} phim bị bỏ qua:\n${reasons}` +
          (data.failed_items.length > 5 ? `\n... và ${data.failed_items.length - 5} phim khác` : '')
      }
      notify('success', msgText)
      await loadAllData()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Lấy phim từ TMDB thất bại.'
      notify('error', typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setAutoSyncLoading(false)
    }
  }

  // Handle TMDB Trailer / Credits / Rating Backfill
  const [backfillLoading, setBackfillLoading] = useState(false)

  async function handleBackfillTrailers() {
    setBackfillLoading(true)
    try {
      const res = await apiClient.post<any>('/api/v1/movies/admin/backfill-trailers')
      const { updated, total_checked, errors, message } = res.data
      if (errors && errors.length > 0) {
        notify('error', `${message} (Có ${errors.length} lỗi)`)
      } else {
        notify('success', message || `Đã cập nhật ${updated}/${total_checked} phim thành công!`)
      }
      await loadAllData()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Thực hiện backfill trailer thất bại.'
      notify('error', typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setBackfillLoading(false)
    }
  }

  async function handleGenerateAutoPreview() {
    if (autoStartDate > autoEndDate) {
      notify('error', 'Ngày bắt đầu (Start Date) không thể lớn hơn Ngày kết thúc (End Date). Vui lòng chọn lại khoảng ngày hợp lệ.')
      return
    }

    if (autoMovieSelectionMode === 'custom' && autoSelectedMovieIds.length === 0) {
      notify('error', 'Vui lòng tích chọn ít nhất 1 bộ phim để xếp lịch chiếu tự động.')
      return
    }

    if (autoRoomSelectionMode === 'custom' && autoSelectedRoomIds.length === 0) {
      notify('error', 'Vui lòng tích chọn ít nhất 1 phòng chiếu để xếp lịch chiếu tự động.')
      return
    }

    setAutoGenerating(true)
    setAutoModalError(null)
    try {
      const res = await apiClient.post(
        '/api/v1/showtimes/admin/auto-schedule/preview',
        {
          start_date: autoStartDate,
          end_date: autoEndDate,
          movie_ids: autoMovieSelectionMode === 'custom' ? autoSelectedMovieIds : null,
          room_ids: autoRoomSelectionMode === 'custom' ? autoSelectedRoomIds : null,
          start_time_str: autoStartTimeStr,
          end_time_str: autoEndTimeStr,
          buffer_minutes: autoBufferMins,
          base_price: autoBasePrice,
          vip_price: autoVipPrice,
          replace_existing: autoReplaceExisting,
          smart_genre_matching: autoSmartGenre,
          auto_pricing_by_room_type: autoPricingByRoom,
        },
        {
          timeout: 60000,
        }
      )
      setAutoPreviewList(res.data)
      setAutoModalError(null)
    } catch (err: any) {
      let errMsg = 'Không thể tạo bản xem trước'
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errMsg = 'Yêu cầu tạo bản xem trước bị quá thời gian (timeout). Vui lòng thử lại.'
      } else if (typeof err.response?.data?.detail === 'string') {
        errMsg = err.response.data.detail
      }
      setAutoModalError(errMsg)
      notify('error', errMsg)
    } finally {
      setAutoGenerating(false)
    }
  }

  async function handleConfirmAutoSchedule() {
    if (!autoPreviewList || autoPreviewList.length === 0) return
    setAutoConfirming(true)
    setAutoModalError(null)
    try {
      const res = await apiClient.post(
        '/api/v1/showtimes/admin/auto-schedule/confirm',
        {
          showtimes: autoPreviewList,
          replace_existing: autoReplaceExisting,
        },
        {
          timeout: 180000, // 3 minutes timeout for bulk database operations
        }
      )

      // Extract unique movie titles from autoPreviewList
      const movieTitlesSet = new Set<string>()
      autoPreviewList.forEach((item) => {
        if (item.movie_title) movieTitlesSet.add(item.movie_title)
      })

      const uniqueMovieTitles = Array.from(movieTitlesSet)
      let movieStr = 'tất cả các phim'
      if (uniqueMovieTitles.length === 1) {
        movieStr = uniqueMovieTitles[0]
      } else if (uniqueMovieTitles.length > 1) {
        movieStr = `${uniqueMovieTitles.length} bộ phim (${uniqueMovieTitles.join(', ')})`
      }

      const count = res.data.count ?? 0
      const skipped = res.data.skipped || []

      if (skipped.length > 0) {
        const skippedSummary = skipped
          .map((s: any) => `${s.room_name || `Phòng ${s.room_id}`}: ${s.reason}`)
          .slice(0, 3)
          .join('; ')
        const extraMsg = skipped.length > 3 ? ` (và ${skipped.length - 3} suất khác)` : ''

        notify(
          'warning',
          `Đã tạo ${count} suất chiếu. Bỏ qua ${skipped.length} suất do phòng không có ghế active nào: ${skippedSummary}${extraMsg}`
        )
      } else {
        notify('success', `Đã xếp thành công ${count} suất chiếu cho phim ${movieStr}`)
      }
      setAutoModalError(null)
      setAutoModalOpen(false)
      setAutoPreviewList(null)
      loadAllData()
    } catch (err: any) {
      let errMsg = 'Không thể lưu suất chiếu tự động'
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errMsg = 'Yêu cầu lưu suất chiếu bị quá thời gian (timeout). Vui lòng kiểm tra lại.'
      } else if (typeof err.response?.data?.detail === 'string') {
        errMsg = err.response.data.detail
      } else if (Array.isArray(err.response?.data?.detail)) {
        errMsg = err.response.data.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
      }
      setAutoModalError(errMsg)
      notify('error', errMsg)
    } finally {
      setAutoConfirming(false)
    }
  }

  async function handleCancelSingleShowtime(showtimeId: number) {
    if (!window.confirm('Bạn có chắc chắn muốn HỦY suất chiếu này không?')) return
    try {
      await apiClient.delete(`/api/v1/showtimes/${showtimeId}`)
      notify('success', 'Đã hủy suất chiếu thành công!')
      await loadAllData()
    } catch (err: any) {
      notify('error', typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Không thể hủy suất chiếu này.')
    }
  }

  const handleToggleSelectSt = (id: number) => {
    setSelectedStIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleBulkCancelSelectedShowtimes = async (overrideIds?: number[]) => {
    const ids = overrideIds || selectedStIds
    if (ids.length === 0) return

    if (!window.confirm(`Bạn có chắc chắn muốn HỦY ${ids.length} suất chiếu đã chọn không?`)) {
      return
    }

    try {
      const { data } = await apiClient.post<{ message: string; count: number }>(
        '/api/v1/showtimes/admin/bulk-cancel',
        {
          showtime_ids: ids,
          only_upcoming: true,
        }
      )
      notify('success', data.message || `Đã hủy thành công ${data.count} suất chiếu!`)
      setSelectedStIds([])
      setCancelSingleStId(0)
      await loadAllData()
    } catch (err: any) {
      notify('error', typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Không thể hủy các suất chiếu đã chọn.')
    }
  }

  async function handleCancelByMovies(movieIds: number[], idsToCancel?: number[]) {
    if (!movieIds || movieIds.length === 0) {
      notify('error', 'Vui lòng chọn ít nhất một bộ phim để hủy suất chiếu.')
      return
    }

    if (idsToCancel && idsToCancel.length > 0) {
      return handleBulkCancelSelectedShowtimes(idsToCancel)
    }

    const selectedMovieObjs = movies.filter((m) => movieIds.includes(m.id))
    const movieTitles = selectedMovieObjs.map((m) => m.title).join(', ')

    const upcomingMovieSts = showtimes.filter(
      (st) =>
        movieIds.includes(st.movie_id) &&
        new Date(st.end_time || st.start_time).getTime() >= Date.now() &&
        st.status !== 'completed' &&
        st.status !== 'cancelled'
    )

    if (upcomingMovieSts.length === 0) {
      notify('error', 'Các phim đã chọn hiện không có suất chiếu sắp chiếu (chưa diễn ra) nào.')
      return
    }

    const movieSummary =
      selectedMovieObjs.length === 1
        ? `phim "${selectedMovieObjs[0].title}"`
        : `${selectedMovieObjs.length} bộ phim (${movieTitles})`

    if (
      !window.confirm(
        `Bạn có chắc muốn HỦY TOÀN BỘ ${upcomingMovieSts.length} suất sắp chiếu của ${movieSummary} không?\n\n(Lưu ý: Các suất đã chiếu và đang chiếu sẽ KHÔNG bị hủy).`
      )
    ) {
      return
    }

    try {
      const { data } = await apiClient.post<{ message: string; count: number }>(
        '/api/v1/showtimes/admin/bulk-cancel',
        {
          movie_ids: movieIds,
          only_upcoming: true,
        }
      )
      notify('success', data.message || `Đã hủy thành công ${data.count} suất chiếu sắp chiếu!`)
      setSelectedStIds([])
      setCancelMovieIds([])
      await loadAllData()
    } catch (err: any) {
      notify('error', err.response?.data?.detail || 'Không thể hủy suất chiếu.')
    }
  }

  async function handleCancelAllSystemShowtimes() {
    const upcomingSts = showtimes.filter(
      (st) => new Date(st.end_time || st.start_time).getTime() >= Date.now() && st.status !== 'completed' && st.status !== 'cancelled'
    )

    if (upcomingSts.length === 0) {
      notify('error', 'Hệ thống hiện không có suất chiếu sắp chiếu (chưa diễn ra) nào.')
      return
    }

    if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn HỦY TẤT CẢ ${upcomingSts.length} suất chiếu SẮP CHIẾU trên toàn hệ thống không?\n\n(Lưu ý: Các suất đã chiếu và đang chiếu sẽ KHÔNG bị ảnh hưởng).`)) {
      return
    }
    try {
      const { data } = await apiClient.post<{ message: string; count: number }>(
        '/api/v1/showtimes/admin/bulk-cancel',
        {
          only_upcoming: true,
        }
      )
      notify('success', data.message || `Đã hủy thành công ${data.count} suất chiếu sắp chiếu!`)
      setSelectedStIds([])
      await loadAllData()
    } catch (err: any) {
      notify('error', err.response?.data?.detail || 'Không thể hủy tất cả suất chiếu.')
    }
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#09090e] flex items-center justify-center text-[#f0ede8]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#e8b84b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#a09e9a]">Đang xác thực thông tin Admin...</p>
        </div>
      </div>
    )
  }

  // Access Denied Screen for non-admins
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 text-center">
        <div className="bg-[#111118] border border-white/10 rounded-2xl p-12 max-w-md mx-auto shadow-2xl space-y-4">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="font-display font-bold text-2xl text-[#f0ede8]">Truy Cập Bị Từ Chối</h2>
          <p className="text-xs text-[#a09e9a] leading-relaxed">
            Trang Quản trị (Admin Panel) chỉ dành riêng cho tài khoản có quyền Quản trị viên (Role: Admin).
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#e8b84b] text-[#09090e] py-2.5 rounded-lg font-bold text-xs cursor-pointer"
            >
              Trở về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Compulsory Password Change State for Admin
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [changePwdLoading, setChangePwdLoading] = useState(false)
  const [changePwdErr, setChangePwdErr] = useState('')

  async function handleChangePwdSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPwd !== confirmPwd) {
      setChangePwdErr('Mật khẩu mới và xác nhận mật khẩu không khớp.')
      return
    }
    if (newPwd.length < 8) {
      setChangePwdErr('Mật khẩu mới phải có tối thiểu 8 ký tự.')
      return
    }
    setChangePwdLoading(true)
    setChangePwdErr('')
    try {
      await apiClient.post('/api/v1/auth/change-password', {
        old_password: oldPwd,
        new_password: newPwd,
      })
      notify('success', 'Đổi mật khẩu thành công!')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      setChangePwdErr(err.response?.data?.detail || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.')
    } finally {
      setChangePwdLoading(false)
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-6 pb-20">
      {/* Compulsory Password Change Modal Overlay */}
      {user?.must_change_password && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="max-w-md w-full bg-[#111118] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#f0ede8]">Yêu Cầu Đổi Mật Khẩu Khẩn Cấp</h3>
              <p className="text-xs text-[#a09e9a] mt-1">
                Tài khoản Admin của bạn đang ở trạng thái bắt buộc đổi mật khẩu. Vui lòng đổi mật khẩu mới để bảo mật hệ thống.
              </p>
            </div>

            {changePwdErr && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{changePwdErr}</span>
              </div>
            )}

            <form onSubmit={handleChangePwdSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#a09e9a] mb-1 font-medium">Mật khẩu hiện tại:</label>
                <input
                  type="password"
                  required
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161622] border border-white/10 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[#a09e9a] mb-1 font-medium">Mật khẩu mới (tối thiểu 8 ký tự):</label>
                <input
                  type="password"
                  required
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161622] border border-white/10 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[#a09e9a] mb-1 font-medium">Xác nhận mật khẩu mới:</label>
                <input
                  type="password"
                  required
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161622] border border-white/10 text-[#f0ede8] outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={changePwdLoading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all disabled:opacity-50 cursor-pointer text-sm shadow-lg mt-2 flex items-center justify-center gap-2"
              >
                {changePwdLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Đổi Mật Khẩu & Tiếp Tục</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Status Toast - Always floats on top of all modals (z-[99999]) */}
      {actionMsg && (
        <aside
          role="alert"
          aria-live="assertive"
          className="fixed top-6 right-4 sm:right-8 z-[99999] max-w-lg w-[calc(100%-2rem)] transition-all duration-300 pointer-events-auto shadow-2xl drop-shadow-2xl animate-in fade-in slide-in-from-top-4"
        >
          <div
            className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start justify-between gap-3 text-xs ${
              actionMsg.type === 'success'
                ? 'bg-[#0f281e]/95 border-emerald-500/60 text-emerald-200 shadow-emerald-950/60'
                : actionMsg.type === 'warning'
                ? 'bg-[#2a1d08]/95 border-amber-500/60 text-amber-200 shadow-amber-950/60'
                : 'bg-[#2b1114]/95 border-rose-500/60 text-rose-200 shadow-rose-950/60'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className="shrink-0 mt-0.5">
                {actionMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : actionMsg.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
              </span>
              <div className="space-y-1 min-w-0">
                <div className="font-bold text-xs uppercase tracking-wider">
                  {actionMsg.type === 'success' ? 'Thành công' : actionMsg.type === 'warning' ? 'Cảnh báo' : 'Thông báo lỗi'}
                </div>
                <div className="whitespace-pre-line leading-relaxed break-words font-medium">
                  {actionMsg.text}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActionMsg(null)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0 font-bold"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}



      {/* TAB 1: MOVIE MANAGEMENT */}
      {activeTab === 'movies' && (
        <div className="space-y-6">
          {/* Top Header & TMDB Synchronizer Card */}
          <div className={cn(
            'border rounded-2xl p-5 sm:p-6 transition-all shadow-xs',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'p-2 rounded-xl text-amber-500',
                    isDark ? 'bg-amber-500/10' : 'bg-amber-50'
                  )}>
                    <Film className="w-5 h-5 stroke-[2]" />
                  </span>
                  <h3 className={cn('font-display font-black text-xl tracking-tight', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    Quản Lý Danh Mục Phim Chiếu Rạp
                  </h3>
                </div>
                <p className={cn('text-xs pl-9 leading-relaxed', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  Kiểm soát danh mục phim, phân loại độ tuổi kiểm duyệt, trạng thái phát hành và đồng bộ dữ liệu chuẩn quốc tế từ TMDB.
                </p>
              </div>

              {/* TMDB Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:self-auto">
                <div className={cn(
                  'flex items-center gap-2 border rounded-xl px-3 py-1.5 text-xs',
                  isDark ? 'bg-[#161622] border-white/10 text-[#a09e9a]' : 'bg-slate-50 border-slate-200 text-slate-600'
                )}>
                  <span className="text-[11px] font-medium shrink-0">Lấy:</span>
                  <select
                    value={syncLimit}
                    onChange={(e) => setSyncLimit(Number(e.target.value))}
                    className={cn(
                      'bg-transparent font-bold outline-none cursor-pointer text-xs',
                      isDark ? 'text-[#f0ede8]' : 'text-slate-900'
                    )}
                    title="Chọn số lượng phim cần quét mỗi loại từ TMDB"
                  >
                    <option value={6} className={isDark ? 'bg-[#161622] text-[#f0ede8]' : 'bg-white text-slate-900'}>6 phim / mục</option>
                    <option value={12} className={isDark ? 'bg-[#161622] text-[#f0ede8]' : 'bg-white text-slate-900'}>12 phim / mục</option>
                    <option value={20} className={isDark ? 'bg-[#161622] text-[#f0ede8]' : 'bg-white text-slate-900'}>20 phim / mục</option>
                    <option value={30} className={isDark ? 'bg-[#161622] text-[#f0ede8]' : 'bg-white text-slate-900'}>30 phim / mục</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={autoSyncLoading}
                  onClick={handleAutoSyncTmdb}
                  className="bg-[#e8b84b] hover:bg-[#d9a738] text-[#09090e] border-0 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5 stroke-[2.2]', autoSyncLoading && 'animate-spin')} />
                  <span>{autoSyncLoading ? 'Đang quét TMDB...' : 'Đồng Bộ TMDB'}</span>
                </button>

                <button
                  type="button"
                  disabled={backfillLoading}
                  onClick={handleBackfillTrailers}
                  className={cn(
                    'border rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95',
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/15 text-[#f0ede8]'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  )}
                  title="Cập nhật bổ sung trailer HD, thông tin đạo diễn, dàn diễn viên và độ tuổi cho các phim còn thiếu"
                >
                  <Layers className={cn('w-3.5 h-3.5 stroke-[2.2]', backfillLoading && 'animate-spin text-amber-500')} />
                  <span>{backfillLoading ? 'Đang cập nhật...' : 'Bổ Sung Dữ Liệu TMDB'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Mini KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Card 1: Tổng Phim */}
            <button
              type="button"
              onClick={() => { setMovieSubTab('all'); setMoviePage(1); }}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group',
                movieSubTab === 'all'
                  ? isDark
                    ? 'bg-white/10 border-[#e8b84b] ring-1 ring-[#e8b84b]/50'
                    : 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400/50 shadow-xs'
                  : isDark
                  ? 'bg-[#111118] border-white/10 hover:border-white/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  Tổng Phim
                </span>
                <span className={cn('p-1.5 rounded-lg', isDark ? 'bg-white/5 text-[#f0ede8]' : 'bg-slate-100 text-slate-700')}>
                  <Film className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={cn('font-display font-black text-2xl mt-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                {movieMetrics.total}
              </div>
              <div className={cn('text-[11px] mt-1', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                Toàn bộ danh mục
              </div>
            </button>

            {/* Card 2: Đang Chiếu */}
            <button
              type="button"
              onClick={() => { setMovieSubTab('now_showing'); setMoviePage(1); }}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group',
                movieSubTab === 'now_showing'
                  ? isDark
                    ? 'bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/50 shadow-xs'
                  : isDark
                  ? 'bg-[#111118] border-white/10 hover:border-white/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                  Đang Chiếu
                </span>
                <span className={cn('p-1.5 rounded-lg', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}>
                  <PlayCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={cn('font-display font-black text-2xl mt-2 flex items-center gap-2', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                {movieMetrics.nowShowing}
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className={cn('text-[11px] mt-1', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                Có suất chiếu tại rạp
              </div>
            </button>

            {/* Card 3: Sắp Ra Mắt */}
            <button
              type="button"
              onClick={() => { setMovieSubTab('coming_soon'); setMoviePage(1); }}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group',
                movieSubTab === 'coming_soon'
                  ? isDark
                    ? 'bg-amber-950/20 border-amber-500 ring-1 ring-amber-500/50'
                    : 'bg-amber-50/80 border-amber-500 ring-1 ring-amber-500/50 shadow-xs'
                  : isDark
                  ? 'bg-[#111118] border-white/10 hover:border-white/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-amber-400' : 'text-amber-700')}>
                  Sắp Ra Mắt
                </span>
                <span className={cn('p-1.5 rounded-lg', isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')}>
                  <Calendar className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={cn('font-display font-black text-2xl mt-2', isDark ? 'text-amber-400' : 'text-amber-600')}>
                {movieMetrics.comingSoon}
              </div>
              <div className={cn('text-[11px] mt-1', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                Dự kiến phát hành
              </div>
            </button>

            {/* Card 4: Ngừng Chiếu */}
            <button
              type="button"
              onClick={() => { setMovieSubTab('ended'); setMoviePage(1); }}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group',
                movieSubTab === 'ended'
                  ? isDark
                    ? 'bg-white/10 border-slate-400 ring-1 ring-slate-400/50'
                    : 'bg-slate-100 border-slate-400 ring-1 ring-slate-400/50 shadow-xs'
                  : isDark
                  ? 'bg-[#111118] border-white/10 hover:border-white/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  Ngừng Chiếu
                </span>
                <span className={cn('p-1.5 rounded-lg', isDark ? 'bg-white/5 text-[#a09e9a]' : 'bg-slate-100 text-slate-500')}>
                  <Archive className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={cn('font-display font-black text-2xl mt-2', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                {movieMetrics.ended}
              </div>
              <div className={cn('text-[11px] mt-1', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                Lưu trữ lịch sử
              </div>
            </button>
          </div>

          {/* Search, Filter & Segment Toolbar */}
          <div className={cn(
            'border rounded-2xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}>
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-[#6e6c68]' : 'text-slate-400')} />
              <input
                type="text"
                value={movieSearchQuery}
                onChange={(e) => setMovieSearchQuery(e.target.value)}
                placeholder="Tìm phim theo tên, đạo diễn, ID..."
                className={cn(
                  'w-full pl-9 pr-8 py-2 rounded-xl text-xs outline-none border transition-colors',
                  isDark
                    ? 'bg-[#161622] border-white/10 text-[#f0ede8] placeholder-[#6e6c68] focus:border-amber-500/50'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                )}
              />
              {movieSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMovieSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="Xoá tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Genre Filter Dropdown */}
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-2 border rounded-xl px-3 py-2 text-xs',
                isDark ? 'bg-[#161622] border-white/10 text-[#a09e9a]' : 'bg-slate-50 border-slate-200 text-slate-600'
              )}>
                <Filter className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <select
                  value={movieGenreFilter}
                  onChange={(e) => setMovieGenreFilter(e.target.value)}
                  className={cn(
                    'bg-transparent font-medium outline-none cursor-pointer text-xs max-w-[140px] truncate',
                    isDark ? 'text-[#f0ede8]' : 'text-slate-900'
                  )}
                >
                  <option value="all" className={isDark ? 'bg-[#161622] text-[#f0ede8]' : 'bg-white text-slate-900'}>
                    Tất cả thể loại
                  </option>
                  {allMovieGenres.map((genre) => (
                    <option key={genre} value={genre} className={isDark ? 'bg-[#161622] text-[#f0ede8]' : 'bg-white text-slate-900'}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button (If filtered) */}
              {(movieSearchQuery || movieGenreFilter !== 'all' || movieSubTab !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setMovieSearchQuery('')
                    setMovieGenreFilter('all')
                    setMovieSubTab('all')
                    setMoviePage(1)
                  }}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                    isDark
                      ? 'border-white/10 text-[#a09e9a] hover:text-[#f0ede8] hover:bg-white/5'
                      : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại bộ lọc</span>
                </button>
              )}
            </div>
          </div>

          {/* Movies Enterprise Data Table */}
          <div className={cn(
            'border rounded-2xl overflow-hidden shadow-sm transition-all',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}>
            {(() => {
              const paginated = filteredMovies.slice((moviePage - 1) * PAGE_SIZE, moviePage * PAGE_SIZE)

              if (filteredMovies.length === 0) {
                return (
                  <div className="py-16 px-4 text-center space-y-3">
                    <div className={cn(
                      'w-14 h-14 mx-auto rounded-2xl flex items-center justify-center',
                      isDark ? 'bg-white/5 text-[#6e6c68]' : 'bg-slate-100 text-slate-400'
                    )}>
                      <Film className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className={cn('font-bold text-sm', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                        Không tìm thấy bộ phim nào phù hợp
                      </h4>
                      <p className={cn('text-xs max-w-sm mx-auto', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                        Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc trạng thái và thể loại.
                      </p>
                    </div>
                    {(movieSearchQuery || movieGenreFilter !== 'all' || movieSubTab !== 'now_showing') && (
                      <button
                        type="button"
                        onClick={() => {
                          setMovieSearchQuery('')
                          setMovieGenreFilter('all')
                          setMovieSubTab('now_showing')
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#e8b84b] text-[#09090e] hover:brightness-110 transition-all cursor-pointer"
                      >
                        Đặt lại bộ lọc
                      </button>
                    )}
                  </div>
                )
              }

              return (
                <>
                  <div className="overflow-x-auto">
                    <table className={cn('w-full text-left text-xs', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      <thead className={cn(
                        'uppercase border-b text-[11px] font-mono-data tracking-wider select-none',
                        isDark ? 'bg-[#161622] text-[#f0ede8] border-white/10' : 'bg-slate-50 text-slate-700 border-slate-200'
                      )}>
                        <tr>
                          <th className="py-3.5 px-4 font-bold">Phim & Đạo Diễn</th>
                          <th className="py-3.5 px-4 font-bold">Độ Tuổi & Thể Loại</th>
                          <th className="py-3.5 px-4 font-bold">Trạng Thái</th>
                          <th className="py-3.5 px-4 font-bold">Thời Lượng / Ra Mắt</th>
                          <th className="py-3.5 px-4 font-bold text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-100'}>
                        {paginated.map((m) => (
                          <tr
                            key={m.id}
                            className={cn(
                              'transition-colors group',
                              isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50/80'
                            )}
                          >
                            {/* Phim & Đạo diễn */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={m.poster_url || 'https://images.unsplash.com/photo-1534996858221-380b92700493?w=100'}
                                  alt={m.title}
                                  loading="lazy"
                                  className={cn(
                                    'w-11 h-16 object-cover rounded-lg border shrink-0 transition-transform group-hover:scale-105 shadow-xs',
                                    isDark ? 'border-white/10 bg-[#161622]' : 'border-slate-200 bg-slate-100'
                                  )}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534996858221-380b92700493?w=100'
                                  }}
                                />
                                <div className="min-w-0 space-y-1">
                                  <p className={cn(
                                    'font-display font-bold text-sm truncate max-w-[280px] sm:max-w-xs transition-colors',
                                    isDark ? 'text-[#f0ede8] group-hover:text-amber-400' : 'text-slate-900 group-hover:text-amber-600'
                                  )}>
                                    {m.title}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={cn(
                                      'text-[10px] font-mono-data px-1.5 py-0.5 rounded border',
                                      isDark ? 'bg-white/5 border-white/10 text-[#a09e9a]' : 'bg-slate-100 border-slate-200 text-slate-500'
                                    )}>
                                      ID: #{m.id}
                                    </span>
                                    {m.tmdb_id && (
                                      <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                        TMDB: {m.tmdb_id}
                                      </span>
                                    )}
                                  </div>
                                  {m.director && (
                                    <div className={cn('text-[11px] flex items-center gap-1.5 truncate max-w-[240px]', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                                      <Clapperboard className="w-3 h-3 text-amber-500 shrink-0" />
                                      <span className="truncate">ĐD: <strong className={isDark ? 'text-[#f0ede8]' : 'text-slate-700'}>{normalizeInternationalName(m.director)}</strong></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Độ tuổi & Thể loại */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1.5">
                                <div>
                                  {renderAgeRatingBadge(m.rating, isDark)}
                                </div>
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {m.genres && m.genres.length > 0 ? (
                                    <>
                                      {m.genres.slice(0, 2).map((g, idx) => (
                                        <span
                                          key={idx}
                                          className={cn(
                                            'text-[10px] px-1.5 py-0.5 rounded border',
                                            isDark ? 'bg-white/5 border-white/10 text-[#a09e9a]' : 'bg-slate-100 border-slate-200 text-slate-600'
                                          )}
                                        >
                                          {g.name?.replace(/^Phim\s+/i, '').trim()}
                                        </span>
                                      ))}
                                      {m.genres.length > 2 && (
                                        <span className={cn(
                                          'text-[10px] px-1 py-0.5 rounded',
                                          isDark ? 'text-[#6e6c68]' : 'text-slate-400'
                                        )}>
                                          +{m.genres.length - 2}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className={cn('text-[10px]', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                                      Chưa rõ
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Trạng thái (Pill with dot) */}
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleMovieStatus(m)}
                                title="Bấm để đổi thủ công trạng thái phát hành của phim"
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all active:scale-95',
                                  m.status === 'now_showing'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                    : m.status === 'coming_soon'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                    : isDark
                                    ? 'bg-white/5 text-[#a09e9a] border-white/10 hover:bg-white/10 hover:text-[#f0ede8]'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                )}
                              >
                                <span
                                  className={cn(
                                    'w-1.5 h-1.5 rounded-full shrink-0',
                                    m.status === 'now_showing'
                                      ? 'bg-emerald-400 animate-pulse'
                                      : m.status === 'coming_soon'
                                      ? 'bg-amber-400'
                                      : 'bg-slate-400'
                                  )}
                                />
                                <span>
                                  {m.status === 'now_showing'
                                    ? 'Đang chiếu'
                                    : m.status === 'coming_soon'
                                    ? 'Sắp ra mắt'
                                    : 'Ngừng chiếu'}
                                </span>
                              </button>
                            </td>

                            {/* Thời lượng / Ngày ra mắt */}
                            <td className="py-3.5 px-4 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className={cn('font-semibold', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                                    {m.duration_minutes ? `${m.duration_minutes} phút` : 'N/A'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <Calendar className={cn('w-3 h-3 shrink-0', isDark ? 'text-[#6e6c68]' : 'text-slate-400')} />
                                  <span className={isDark ? 'text-[#a09e9a]' : 'text-slate-500'}>
                                    {m.release_date || 'Chưa cập nhật'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Thao tác */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleViewMovieDetail(m)}
                                  className={cn(
                                    'px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95',
                                    isDark
                                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-[#e8b84b] border-amber-500/30'
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                  )}
                                  title="Xem chi tiết, dàn diễn viên và trailer phim"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Chi tiết</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMovie(m.id, m.title)}
                                  className={cn(
                                    'px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95',
                                    isDark
                                      ? 'bg-white/5 hover:bg-rose-950/40 text-[#a09e9a] hover:text-rose-400 border-white/10 hover:border-rose-500/30'
                                      : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200 hover:border-rose-200'
                                  )}
                                  title="Xóa bộ phim khỏi cơ sở dữ liệu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Control */}
                  <PaginationControl
                    currentPage={moviePage}
                    totalItems={filteredMovies.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setMoviePage}
                  />
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* TAB 2: SHOWTIMES MANAGEMENT */}
      {activeTab === 'showtimes' && (
        <div className="space-y-6">
          {/* Top Header Card */}
          <div className={cn(
            'border rounded-2xl p-5 sm:p-6 transition-all shadow-xs',
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          )}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    'p-2 rounded-xl text-amber-500',
                    isDark ? 'bg-amber-500/10' : 'bg-amber-50'
                  )}>
                    <CalendarClock className="w-5 h-5 stroke-[2]" />
                  </span>
                  <h3 className={cn('font-display font-black text-xl tracking-tight', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    Quản Lý Lịch Chiếu & Suất Chiếu
                  </h3>
                </div>
                <p className={cn('text-xs pl-9 leading-relaxed', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  Điều phối khung giờ chiếu, phân bổ phòng chiếu và quản lý hủy suất chiếu an toàn theo tiêu chuẩn rạp.
                </p>
              </div>

              {/* Header Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:self-auto">
                <button
                  type="button"
                  onClick={() => loadAllData()}
                  className={cn(
                    'border rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 active:scale-95',
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/15 text-[#f0ede8]'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  )}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm Mới</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Mini KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Card 1: Tổng Suất Chiếu */}
            <button
              type="button"
              onClick={() => { setStTimeFilter('all'); setShowtimePage(1); }}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group',
                stTimeFilter === 'all'
                  ? isDark
                    ? 'bg-white/10 border-[#e8b84b] ring-1 ring-[#e8b84b]/50'
                    : 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400/50 shadow-xs'
                  : isDark
                  ? 'bg-[#111118] border-white/10 hover:border-white/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  Tổng Suất Chiếu
                </span>
                <span className={cn('p-1.5 rounded-lg', isDark ? 'bg-white/5 text-[#f0ede8]' : 'bg-slate-100 text-slate-700')}>
                  <CalendarClock className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={cn('font-display font-black text-2xl mt-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                {showtimeMetrics.total}
              </div>
              <div className={cn('text-[11px] mt-1', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                Toàn bộ lịch rạp
              </div>
            </button>

            {/* Card 2: Sắp Chiếu */}
            <button
              type="button"
              onClick={() => { setStTimeFilter('upcoming'); setShowtimePage(1); }}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group',
                stTimeFilter === 'upcoming'
                  ? isDark
                    ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400/50 shadow-xs'
                  : isDark
                  ? 'bg-[#111118] border-white/10 hover:border-white/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                  Sắp Chiếu
                </span>
                <span className={cn('p-1.5 rounded-lg', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700')}>
                  <Clock className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={cn('font-display font-black text-2xl mt-2', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                {showtimeMetrics.upcoming}
              </div>
              <div className={cn('text-[11px] mt-1', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                Sẵn sàng đón khách
              </div>
            </button>

            {/* Card 3: Đã Chiếu */}
            <button
              type="button"
              onClick={() => { setStTimeFilter('past'); setShowtimePage(1); }}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group',
                stTimeFilter === 'past'
                  ? isDark
                    ? 'bg-white/10 border-slate-400 ring-1 ring-slate-400/50'
                    : 'bg-slate-100 border-slate-400 ring-1 ring-slate-400/50 shadow-xs'
                  : isDark
                  ? 'bg-[#111118] border-white/10 hover:border-white/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  Đã Chiếu
                </span>
                <span className={cn('p-1.5 rounded-lg', isDark ? 'bg-white/5 text-[#a09e9a]' : 'bg-slate-100 text-slate-600')}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={cn('font-display font-black text-2xl mt-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                {showtimeMetrics.past}
              </div>
              <div className={cn('text-[11px] mt-1', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                Suất đã kết thúc
              </div>
            </button>

            {/* Card 4: Hoạt Động Rạp */}
            <div
              className={cn(
                'p-4 rounded-2xl border text-left relative overflow-hidden',
                isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200 shadow-xs'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                  Rạp Hoạt Động
                </span>
                <span className={cn('p-1.5 rounded-lg', isDark ? 'bg-white/5 text-amber-400' : 'bg-amber-50 text-amber-600')}>
                  <Building2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={cn('font-display font-black text-2xl mt-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                {showtimeMetrics.activeRoomsCount}/{safeRooms.length} <span className="text-xs font-normal text-muted-foreground">phòng</span>
              </div>
              <div className={cn('text-[11px] mt-1 truncate', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>
                {showtimeMetrics.activeMoviesCount} phim đang chiếu
              </div>
            </div>
          </div>

          {/* Main 2 Columns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column Left: AI Auto Schedule Card & Dedicated Cancellation Card */}
            <div className="lg:col-span-5 space-y-6">
              {/* Auto Schedule Card */}
              <div className={cn(
                'p-5 sm:p-6 rounded-2xl border space-y-4 shadow-xs transition-colors',
                isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
              )}>
                <div className="flex items-start gap-3">
                  <span className={cn(
                    'p-2 rounded-xl shrink-0 mt-0.5',
                    isDark ? 'bg-amber-500/10 text-[#e8b84b]' : 'bg-amber-50 text-amber-600'
                  )}>
                    <Sparkles className="w-5 h-5 stroke-[2]" />
                  </span>
                  <div className="space-y-1 min-w-0">
                    <h3 className={cn('font-display font-bold text-lg', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                      Xếp Lịch Chiếu Tự Động
                    </h3>
                    <p className={cn('text-xs leading-relaxed', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      Thuật toán phân bổ lịch chiếu thông minh theo danh sách phòng, thời lượng từng bộ phim và khung giờ mở cửa rạp.
                    </p>
                  </div>
                </div>

                <div className={cn(
                  'p-3 rounded-xl border flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]',
                  isDark ? 'bg-[#09090e] border-white/5 text-[#a09e9a]' : 'bg-slate-50 border-slate-200 text-slate-600'
                )}>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Chống trùng lịch
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Thời gian dọn phòng
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Giá vé Thường / VIP
                  </span>
                </div>

                {/* Launch Modal Action Button */}
                <button
                  type="button"
                  onClick={() => setAutoModalOpen(true)}
                  className="w-full bg-[#e8b84b] hover:bg-[#d9a738] text-[#09090e] border-0 rounded-xl py-3.5 font-bold text-xs cursor-pointer transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 uppercase tracking-wider active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 stroke-[2.2]" />
                  <span>Cấu Hình & Lập Lịch Tự Động</span>
                </button>
              </div>

              {/* Dedicated Showtime Cancellation Section */}
              <div className={cn(
                'p-5 sm:p-6 rounded-2xl border space-y-4 shadow-xs transition-colors',
                isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
              )}>
                <div className={cn('border-b pb-3.5', isDark ? 'border-white/10' : 'border-slate-200')}>
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      'p-2 rounded-xl shrink-0',
                      isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'
                    )}>
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    </span>
                    <div>
                      <h3 className={cn('font-display font-bold text-base', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                        Quản Lý Hủy Suất Chiếu
                      </h3>
                      <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                        Hủy suất chọn lọc, theo phim hoặc hủy an toàn toàn bộ suất sắp chiếu.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-tab selector for Cancel methods */}
                <div className={cn(
                  'flex rounded-xl p-1 border text-xs gap-1',
                  isDark ? 'bg-[#09090e] border-white/10' : 'bg-slate-100 border-slate-200'
                )}>
                  <button
                    type="button"
                    onClick={() => setCancelMode('single')}
                    className={cn(
                      'flex-1 py-2 px-2 rounded-lg font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5',
                      cancelMode === 'single'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-xs'
                        : isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Suất Cụ Thể</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelMode('movie')}
                    className={cn(
                      'flex-1 py-2 px-2 rounded-lg font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5',
                      cancelMode === 'movie'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-xs'
                        : isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Theo Phim</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelMode('all')}
                    className={cn(
                      'flex-1 py-2 px-2 rounded-lg font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5',
                      cancelMode === 'all'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-xs'
                        : isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Toàn Bộ Suất</span>
                  </button>
                </div>

                {/* Method 1: Cancel Single/Multiple Specific Showtimes */}
                {cancelMode === 'single' && (
                  <div className="space-y-3 pt-1">
                    {(() => {
                      const upcomingSts = showtimes.filter(
                        (st) => new Date(st.end_time || st.start_time).getTime() >= Date.now() && st.status !== 'completed' && st.status !== 'cancelled'
                      )
                      const selectedCount = selectedStIds.length

                      return (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className={cn('font-medium', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                              Chọn suất chiếu muốn hủy:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedStIds(upcomingSts.map((st) => st.id))}
                                className="text-[11px] text-amber-500 hover:underline font-semibold cursor-pointer"
                              >
                                Chọn tất cả ({upcomingSts.length})
                              </button>
                              {selectedCount > 0 && (
                                <>
                                  <span className={isDark ? 'text-white/20' : 'text-slate-300'}>|</span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedStIds([])}
                                    className={cn('text-[11px] hover:underline cursor-pointer', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}
                                  >
                                    Bỏ chọn
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Checklist Container */}
                          <div className={cn(
                            'max-h-60 overflow-y-auto space-y-1.5 p-2 rounded-xl border',
                            isDark ? 'bg-[#09090e] border-white/10' : 'bg-slate-50 border-slate-200'
                          )}>
                            {upcomingSts.length === 0 ? (
                              <div className={cn('text-xs p-6 text-center italic space-y-1', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                                <Calendar className="w-6 h-6 mx-auto opacity-40 mb-1" />
                                <p>Hiện không có suất chiếu sắp chiếu nào.</p>
                              </div>
                            ) : (
                              upcomingSts.map((st) => {
                                const isChecked = selectedStIds.includes(st.id)
                                const mTitle = st.movie?.title || `Phim #${st.movie_id}`
                                const rName = st.room?.name || `Phòng #${st.room_id}`
                                const timeFmt = new Date(st.start_time).toLocaleString('vi-VN', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                return (
                                  <label
                                    key={st.id}
                                    className={cn(
                                      'flex items-center gap-2.5 p-2.5 rounded-xl text-xs cursor-pointer border transition-all select-none',
                                      isChecked
                                        ? isDark
                                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                          : 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                                        : isDark
                                        ? 'bg-white/5 border-transparent text-[#a09e9a] hover:text-[#f0ede8] hover:bg-white/10'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-2xs'
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleSelectSt(st.id)}
                                      className="accent-rose-500 w-4 h-4 rounded cursor-pointer shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className={cn('font-bold truncate', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>{mTitle}</p>
                                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono-data">
                                        <span className={cn('px-1.5 py-0.2 rounded text-[10px] font-semibold', isDark ? 'bg-white/10 text-amber-400' : 'bg-amber-100 text-amber-800')}>
                                          {rName}
                                        </span>
                                        <span className={cn(isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>{timeFmt}</span>
                                        <span className={cn('text-[10px]', isDark ? 'text-[#6e6c68]' : 'text-slate-400')}>#{st.id}</span>
                                      </div>
                                    </div>
                                  </label>
                                )
                              })
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={selectedCount === 0}
                            onClick={() => handleBulkCancelSelectedShowtimes()}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hủy {selectedCount > 0 ? `${selectedCount} Suất Chiếu Đã Chọn` : 'Suất Chiếu Đã Chọn'}</span>
                          </button>
                        </>
                      )
                    })()}
                  </div>
                )}

                {/* Method 2: Cancel Showtimes By Movie */}
                {cancelMode === 'movie' && (() => {
                  const moviesWithUpcomingShowtimes = movies
                    .map((m) => {
                      const upcomingCount = showtimes.filter(
                        (st) =>
                          st.movie_id === m.id &&
                          new Date(st.end_time || st.start_time).getTime() >= Date.now() &&
                          st.status !== 'completed' &&
                          st.status !== 'cancelled'
                      ).length
                      return { ...m, upcomingCount }
                    })
                    .filter((m) => m.upcomingCount > 0)

                  const upcomingMovieSts = showtimes.filter(
                    (st) =>
                      cancelMovieIds.includes(st.movie_id) &&
                      new Date(st.end_time || st.start_time).getTime() >= Date.now() &&
                      st.status !== 'completed' &&
                      st.status !== 'cancelled'
                  )

                  const selectedMovieStIds = selectedStIds.filter((id) =>
                    upcomingMovieSts.some((st) => st.id === id)
                  )

                  return (
                    <div className="space-y-3 pt-1">
                      {moviesWithUpcomingShowtimes.length === 0 ? (
                        <div className={cn(
                          'p-6 rounded-xl border border-dashed text-center text-xs space-y-1',
                          isDark ? 'border-white/10 text-[#a09e9a]' : 'border-slate-300 text-slate-500'
                        )}>
                          <Film className="w-6 h-6 mx-auto opacity-40 mb-1" />
                          <div className="font-semibold">Không có phim nào đang có suất chiếu sắp diễn ra</div>
                          <div className="text-[11px] opacity-75">Tất cả các suất chiếu hiện tại đã hoàn thành hoặc chưa được xếp lịch.</div>
                        </div>
                      ) : (
                        <>
                          {/* Header & Quick Action Buttons */}
                          <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
                            <label className={cn('font-bold flex items-center gap-1.5', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                              <Film className="w-3.5 h-3.5 text-amber-500" />
                              <span>
                                Chọn phim cần hủy suất{' '}
                                <span className="text-amber-500 font-semibold">
                                  ({cancelMovieIds.length}/{moviesWithUpcomingShowtimes.length} phim)
                                </span>:
                              </span>
                            </label>
                            <div className="flex items-center gap-2 text-[11px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const allIds = moviesWithUpcomingShowtimes.map((m) => m.id)
                                  setCancelMovieIds(allIds)
                                  setSelectedStIds([])
                                }}
                                className="text-amber-500 hover:underline font-semibold cursor-pointer"
                              >
                                Chọn tất cả ({moviesWithUpcomingShowtimes.length})
                              </button>
                              {cancelMovieIds.length > 0 && (
                                <>
                                  <span className={isDark ? 'text-white/20' : 'text-slate-300'}>|</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCancelMovieIds([])
                                      setSelectedStIds([])
                                    }}
                                    className={cn('hover:underline cursor-pointer', isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-500 hover:text-slate-800')}
                                  >
                                    Bỏ chọn
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Selectable Movie Grid / Chips */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {moviesWithUpcomingShowtimes.map((m) => {
                              const isSelected = cancelMovieIds.includes(m.id)
                              return (
                                <label
                                  key={m.id}
                                  className={cn(
                                    'flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all cursor-pointer select-none text-xs',
                                    isSelected
                                      ? isDark
                                        ? 'bg-rose-500/15 border-rose-500/40 text-[#f0ede8] shadow-xs'
                                        : 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                                      : isDark
                                      ? 'bg-[#09090e] border-white/10 text-[#a09e9a] hover:border-white/20'
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-2xs'
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setCancelMovieIds([...cancelMovieIds, m.id])
                                        } else {
                                          setCancelMovieIds(cancelMovieIds.filter((id) => id !== m.id))
                                        }
                                        setSelectedStIds([])
                                      }}
                                      className="accent-rose-500 w-4 h-4 rounded cursor-pointer shrink-0"
                                    />
                                    <span className="truncate font-medium">{m.title}</span>
                                  </div>
                                  <span className={cn(
                                    'px-2 py-0.5 rounded-md text-[10px] font-mono-data font-bold shrink-0',
                                    isSelected
                                      ? 'bg-rose-500/20 text-rose-400'
                                      : isDark
                                      ? 'bg-white/5 text-[#a09e9a]'
                                      : 'bg-slate-100 text-slate-600'
                                  )}>
                                    {m.upcomingCount} suất
                                  </span>
                                </label>
                              )
                            })}
                          </div>

                          {/* Detail Showtimes for Selected Movies */}
                          {cancelMovieIds.length > 0 && (
                            <div className={cn('space-y-3 pt-3 border-t', isDark ? 'border-white/10' : 'border-slate-200')}>
                              <div className="flex items-center justify-between text-xs">
                                <span className={cn('font-semibold', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
                                  Danh sách suất sắp chiếu ({upcomingMovieSts.length}):
                                </span>
                                <div className="flex items-center gap-2 text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedStIds(upcomingMovieSts.map((st) => st.id))}
                                    className="text-amber-500 hover:underline font-semibold cursor-pointer"
                                  >
                                    Chọn tất cả {upcomingMovieSts.length} suất
                                  </button>
                                  {selectedMovieStIds.length > 0 && (
                                    <>
                                      <span className={isDark ? 'text-white/20' : 'text-slate-300'}>|</span>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedStIds([])}
                                        className={cn('hover:underline cursor-pointer', isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-500 hover:text-slate-800')}
                                      >
                                        Bỏ chọn suất
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className={cn(
                                'max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl border',
                                isDark ? 'bg-[#09090e] border-white/10' : 'bg-slate-50 border-slate-200'
                              )}>
                                {upcomingMovieSts.map((st) => {
                                  const isChecked = selectedStIds.includes(st.id)
                                  const movieObj = movies.find((m) => m.id === st.movie_id)
                                  const rName = st.room?.name || `Phòng #${st.room_id}`
                                  const timeFmt = new Date(st.start_time).toLocaleString('vi-VN', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                  return (
                                    <label
                                      key={st.id}
                                      className={cn(
                                        'flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors',
                                        isChecked
                                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                          : isDark
                                          ? 'bg-white/5 border-transparent text-[#a09e9a] hover:text-[#f0ede8] hover:bg-white/10'
                                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                      )}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleSelectSt(st.id)}
                                        className="accent-rose-500 w-4 h-4 rounded cursor-pointer shrink-0"
                                      />
                                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                        <span className={cn('truncate font-bold', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                                          {movieObj?.title || `Phim #${st.movie_id}`}
                                        </span>
                                        <span className={cn('font-mono-data text-[11px] shrink-0', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                                          #{st.id} • {rName} • {timeFmt}
                                        </span>
                                      </div>
                                    </label>
                                  )
                                })}
                              </div>

                              <button
                                type="button"
                                disabled={upcomingMovieSts.length === 0}
                                onClick={() => {
                                  if (selectedMovieStIds.length > 0) {
                                    handleCancelByMovies(cancelMovieIds, selectedMovieStIds)
                                  } else {
                                    handleCancelByMovies(cancelMovieIds)
                                  }
                                }}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all disabled:opacity-40 shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.99]"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>
                                  {selectedMovieStIds.length > 0
                                    ? `Hủy ${selectedMovieStIds.length} Suất Chiếu Đã Chọn`
                                    : `Hủy Toàn Bộ ${upcomingMovieSts.length} Suất Sắp Chiếu Của ${cancelMovieIds.length} Phim Đã Chọn`}
                                </span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })()}

                {/* Method 3: Cancel All System Showtimes */}
                {cancelMode === 'all' && (
                  <div className="space-y-3 pt-1">
                    {(() => {
                      const upcomingStsCount = showtimes.filter(
                        (st) => new Date(st.end_time || st.start_time).getTime() >= Date.now() && st.status !== 'completed' && st.status !== 'cancelled'
                      ).length

                      return (
                        <>
                          <div className={cn(
                            'p-4 rounded-xl border text-xs space-y-2',
                            isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-900'
                          )}>
                            <div className="flex items-center gap-2 font-bold text-rose-500">
                              <ShieldAlert className="w-4 h-4 shrink-0" />
                              <span>Hủy An Toàn Suất Sắp Chiếu Hệ Thống:</span>
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-90">
                              Thao tác này chỉ xóa các <strong>{upcomingStsCount}</strong> suất chiếu sắp diễn ra. Các suất đã chiếu hoặc đang chiếu sẽ <strong>được giữ nguyên an toàn</strong> trong cơ sở dữ liệu.
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={upcomingStsCount === 0}
                            onClick={handleCancelAllSystemShowtimes}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.99]"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Hủy Tất Cả {upcomingStsCount} Suất Sắp Chiếu Hệ Thống</span>
                          </button>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Column Right: Showtimes List Catalog */}
            <div className={cn(
              'lg:col-span-7 border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 transition-colors',
              isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
            )}>
              <div className={cn('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4', isDark ? 'border-white/10' : 'border-slate-200')}>
                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    'p-1.5 rounded-lg',
                    isDark ? 'bg-white/5 text-amber-400' : 'bg-slate-100 text-slate-700'
                  )}>
                    <Clapperboard className="w-4 h-4" />
                  </span>
                  <h3 className={cn('font-display font-bold text-base sm:text-lg', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    Danh Sách Suất Chiếu{' '}
                    <span className="text-sm font-mono-data font-normal text-amber-500">
                      ({filteredShowtimes.length}{filteredShowtimes.length !== showtimes.length && ` / ${showtimes.length}`})
                    </span>
                  </h3>
                </div>

                {(stFilterMovieId !== 'all' || stFilterRoomId !== 'all' || stSearchQuery || stTimeFilter !== 'upcoming') && (
                  <button
                    type="button"
                    onClick={() => {
                      setStFilterMovieId('all')
                      setStFilterRoomId('all')
                      setStSearchQuery('')
                      setStTimeFilter('upcoming')
                      setShowtimePage(1)
                    }}
                    className={cn(
                      'text-xs cursor-pointer flex items-center gap-1.5 border px-2.5 py-1 rounded-lg transition-colors font-medium',
                      isDark ? 'text-[#a09e9a] hover:text-[#f0ede8] border-white/10 bg-white/5' : 'text-slate-600 hover:text-slate-900 border-slate-300 bg-slate-100'
                    )}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Đặt lại bộ lọc</span>
                  </button>
                )}
              </div>

              {/* Search & Filter Controls */}
              <div className={cn(
                'p-3 rounded-xl border text-xs space-y-3',
                isDark ? 'bg-[#09090e] border-white/5' : 'bg-slate-50 border-slate-200'
              )}>
                {/* Quick Search */}
                <div className="relative">
                  <Search className={cn('w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2', isDark ? 'text-white/40' : 'text-slate-400')} />
                  <input
                    type="text"
                    value={stSearchQuery}
                    onChange={(e) => { setStSearchQuery(e.target.value); setShowtimePage(1); }}
                    placeholder="Tìm theo tên phim, phòng chiếu, mã suất..."
                    className={cn(
                      'w-full pl-9 pr-8 py-2 border rounded-xl outline-none text-xs transition-colors',
                      isDark
                        ? 'bg-[#161622] border-white/10 text-[#f0ede8] placeholder:text-[#6e6c68] focus:border-[#e8b84b]'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 shadow-2xs'
                    )}
                  />
                  {stSearchQuery && (
                    <button
                      type="button"
                      onClick={() => { setStSearchQuery(''); setShowtimePage(1); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdowns Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <label className={cn('block mb-1 font-semibold text-[11px] flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      <Film className="w-3 h-3 text-amber-500" />
                      <span>Lọc Theo Phim</span>
                    </label>
                    <select
                      value={stFilterMovieId}
                      onChange={(e) => {
                        setStFilterMovieId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                        setShowtimePage(1)
                      }}
                      className={cn(
                        'w-full px-3 py-2 border rounded-xl outline-none cursor-pointer text-xs transition-colors',
                        isDark ? 'bg-[#161622] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                      )}
                    >
                      <option value="all">Tất cả phim ({moviesForShowtimeFilter.length})</option>
                      {moviesForShowtimeFilter.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <label className={cn('block mb-1 font-semibold text-[11px] flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                      <Building2 className="w-3 h-3 text-amber-500" />
                      <span>Lọc Theo Phòng Chiếu</span>
                    </label>
                    <select
                      value={stFilterRoomId}
                      onChange={(e) => {
                        setStFilterRoomId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                        setShowtimePage(1)
                      }}
                      className={cn(
                        'w-full px-3 py-2 border rounded-xl outline-none cursor-pointer text-xs transition-colors',
                        isDark ? 'bg-[#161622] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                      )}
                    >
                      <option value="all">Tất cả phòng ({roomsForShowtimeFilter.length})</option>
                      {roomsForShowtimeFilter.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.room_type?.toUpperCase() || 'STANDARD'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Showtime Items List */}
              <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                {filteredShowtimes.length === 0 ? (
                  <div className={cn(
                    'py-14 text-center text-xs border rounded-2xl p-6 space-y-2',
                    isDark ? 'bg-[#09090e] border-white/5 text-[#a09e9a]' : 'bg-slate-50 border-slate-200 text-slate-500'
                  )}>
                    <Film className="w-8 h-8 mx-auto opacity-30 mb-2" />
                    <p className="font-semibold">Không tìm thấy suất chiếu nào phù hợp</p>
                    <p className="text-[11px] opacity-75">Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc thời gian, phòng chiếu.</p>
                    {(stFilterMovieId !== 'all' || stFilterRoomId !== 'all' || stSearchQuery || stTimeFilter !== 'upcoming') && (
                      <button
                        type="button"
                        onClick={() => {
                          setStFilterMovieId('all')
                          setStFilterRoomId('all')
                          setStSearchQuery('')
                          setStTimeFilter('upcoming')
                          setShowtimePage(1)
                        }}
                        className="mt-2 text-[11px] text-amber-500 hover:underline font-semibold cursor-pointer"
                      >
                        Đặt lại tất cả bộ lọc
                      </button>
                    )}
                  </div>
                ) : (
                  filteredShowtimes
                    .slice((showtimePage - 1) * PAGE_SIZE, showtimePage * PAGE_SIZE)
                    .map((st) => {
                      const startDate = new Date(st.start_time)
                      const timeStr = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      const dateStr = startDate.toLocaleDateString('vi-VN', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                      })

                      const isPast = new Date(st.end_time || st.start_time).getTime() < Date.now() || st.status === 'completed'
                      const roomTypeStr = (st.room?.room_type || 'standard').toUpperCase()
                      const totalSeats = st.total_seats || 0
                      const availSeats = st.available_seats !== undefined ? st.available_seats : totalSeats

                      return (
                        <div
                          key={st.id}
                          className={cn(
                            'border rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all',
                            isPast
                              ? isDark
                                ? 'bg-[#09090e]/60 border-white/5 opacity-75'
                                : 'bg-slate-100/70 border-slate-200 opacity-75'
                              : isDark
                              ? 'bg-[#161622] border-white/10 hover:border-white/20 hover:shadow-md'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                          )}
                        >
                          {/* Left Column: Time & Date Badge */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              'px-3 py-2 rounded-xl text-center shrink-0 border min-w-[76px]',
                              isPast
                                ? isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                                : isDark ? 'bg-[#e8b84b]/10 border-[#e8b84b]/25 text-[#e8b84b]' : 'bg-amber-50 border-amber-300 text-amber-900'
                            )}>
                              <div className="font-display font-black text-lg leading-tight">{timeStr}</div>
                              <div className="text-[10px] font-semibold mt-0.5 opacity-90">{dateStr}</div>
                            </div>

                            {/* Middle Info */}
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={cn(
                                  'text-[10px] font-mono-data px-2 py-0.5 rounded-md font-bold uppercase border',
                                  roomTypeStr.includes('IMAX')
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                    : roomTypeStr.includes('VIP')
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    : isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                                )}>
                                  {st.room?.name ?? `Phòng #${st.room_id}`}
                                </span>

                                {isPast ? (
                                  <span className={cn(
                                    'text-[10px] font-semibold px-2 py-0.5 rounded-md border',
                                    isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                                  )}>
                                    Đã chiếu
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Sắp chiếu
                                  </span>
                                )}

                                <span className={cn('text-[10px] font-mono-data', isDark ? 'text-white/30' : 'text-slate-400')}>
                                  #{st.id}
                                </span>
                              </div>

                              <h4 className={cn('font-display font-bold text-sm sm:text-base truncate', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                                {st.movie?.title ?? `Phim #${st.movie_id}`}
                              </h4>

                              <div className={cn('flex items-center gap-2 text-xs', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                                <span>Giá:</span>
                                <strong className="text-amber-500 font-bold">{fmt(Number(st.base_price))}</strong>
                                <span className="opacity-50">/</span>
                                <span className="text-amber-500/80 font-semibold">{fmt(Number(st.vip_price ?? st.base_price))}</span>
                                <span className="text-[10px] opacity-75">(VIP)</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Seats & Single Cancel Action */}
                          <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                            <div className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono-data border',
                              isDark ? 'bg-white/5 border-white/5 text-[#a09e9a]' : 'bg-slate-100 border-slate-200 text-slate-700'
                            )}>
                              <Armchair className="w-3.5 h-3.5 text-amber-500" />
                              <span>
                                <strong>{availSeats}</strong>/{totalSeats} <span className="text-[10px] opacity-80">ghế trống</span>
                              </span>
                            </div>

                            {!isPast && (
                              <button
                                type="button"
                                onClick={() => handleCancelSingleShowtime(st.id)}
                                className={cn(
                                  'p-1.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center gap-1',
                                  isDark
                                    ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                    : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                )}
                                title="Hủy suất chiếu này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-semibold hidden sm:inline">Hủy suất</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                )}
              </div>

              <PaginationControl
                currentPage={showtimePage}
                totalItems={filteredShowtimes.length}
                pageSize={PAGE_SIZE}
                onPageChange={setShowtimePage}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROOMS MANAGEMENT */}
            {/* TAB 3: ROOMS MANAGEMENT */}
      {activeTab === 'rooms' && (() => {
        const totalAuditoriumSeats = safeRooms.reduce((sum, r) => sum + (r.total_seats || r.total_rows * r.total_cols || 0), 0)
        const standardCount = safeRooms.filter((r) => (r.room_type || 'standard') === 'standard').length
        const imaxCount = safeRooms.filter((r) => r.room_type === 'imax').length
        const vipCount = safeRooms.filter((r) => r.room_type === 'vip').length
        const threeDCount = safeRooms.filter((r) => r.room_type === '3d').length
        const fourDCount = safeRooms.filter((r) => r.room_type === '4d').length
        const kidsCount = safeRooms.filter((r) => r.room_type === 'kids').length

        // Filtered rooms (pure category filter, search by room name removed)
        const filteredRooms = safeRooms.filter((r) => {
          if (!r) return false
          return roomCategoryFilter === 'all' || (r.room_type || 'standard') === roomCategoryFilter
        })

        const suggestedName = `${
          rType === 'standard' ? 'Standard' : rType === 'vip' ? 'VIP' : rType === 'imax' ? 'IMAX' : rType === '4d' ? '4DX' : rType === 'kids' ? 'Kids' : '3D'
        } ${nextRoomNum}`

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Main Content Grid: Left Form (4 cols) & Right Auditoriums (8 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Create Room Form */}
              <div className="lg:col-span-4">
                {/* Form Create Room Card */}
                <div className={cn(
                  'border rounded-2xl p-5 sm:p-6 shadow-xl transition-colors',
                  isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
                )}>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className={cn(
                      'p-2 rounded-xl shrink-0',
                      isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                    )}>
                      <Plus className="w-4 h-4 stroke-[2.2]" />
                    </span>
                    <h3 className={cn('font-display font-bold text-lg', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                      Tạo Phòng Chiếu Mới
                    </h3>
                  </div>
                  <p className={cn('text-xs mb-5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                    Thiết lập loại phòng và số lượng hàng/cột ghế ban đầu cho phòng rạp mới.
                  </p>

                  <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
                    <div>
                      <label className={cn('block font-semibold mb-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
                        Loại Phòng Chiếu
                      </label>
                      <select
                        value={rType}
                        onChange={(e) => {
                          const newType = e.target.value
                          setRType(newType)
                          const targetRooms = safeRooms.filter((r) => (r.room_type || 'standard') === newType)
                          const maxNum = targetRooms.reduce((max, r) => Math.max(max, Number(r.room_number) || 1), 0)
                          const nextNum = maxNum + 1
                          const label =
                            newType === 'standard'
                              ? 'Standard'
                              : newType === 'imax'
                              ? 'IMAX'
                              : newType === 'vip'
                              ? 'VIP'
                              : newType === '4d'
                              ? '4DX'
                              : newType === 'kids'
                              ? 'Kids'
                              : '3D'
                          setRName(`${label} ${nextNum}`)
                          if (targetRooms.length > 0) {
                            setRRows(targetRooms[0].total_rows || 8)
                            setRCols(targetRooms[0].total_cols || 10)
                          }
                        }}
                        className={cn(
                          'w-full px-3 py-2.5 border rounded-xl outline-none cursor-pointer font-semibold transition-colors',
                          isDark
                            ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-amber-500/50'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs'
                        )}
                      >
                        <option value="standard">Standard (Tiêu chuẩn 2D)</option>
                        <option value="imax">IMAX 3D Laser Cinema</option>
                        <option value="vip">VIP Gold Lounge</option>
                        <option value="3d">3D Surround</option>
                        <option value="4d">4DX Motion Cinema</option>
                        <option value="kids">Kids & Family Studio</option>
                      </select>
                    </div>

                    <div>
                      <label className={cn('block font-semibold mb-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
                        Tên Phòng Chiếu (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={rName}
                        onChange={(e) => setRName(e.target.value)}
                        placeholder={`Ví dụ: ${suggestedName}`}
                        className={cn(
                          'w-full px-3 py-2.5 border rounded-xl outline-none transition-colors font-semibold',
                          isDark
                            ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-amber-500/50'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs'
                        )}
                      />
                      <div className={cn(
                        'mt-1.5 p-2 rounded-lg border text-[11px] flex items-center gap-1.5',
                        isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-900 font-medium'
                      )}>
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>Gợi ý tên kế tiếp: <strong>{suggestedName}</strong></span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className={cn('font-semibold', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
                          Kích Thước Hàng & Cột
                        </label>
                        <span className={cn(
                          'font-mono-data font-bold text-[11px] px-2 py-0.5 rounded-md border',
                          isDark ? 'bg-white/5 border-white/10 text-[#e8b84b]' : 'bg-amber-50 border-amber-200 text-amber-900'
                        )}>
                          Sức chứa: {rRows * rCols} ghế
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className={cn('text-[11px] block mb-1', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>Số hàng (Rows)</span>
                          <input
                            type="number"
                            required
                            min={4}
                            max={20}
                            value={rRows}
                            onChange={(e) => setRRows(Number(e.target.value))}
                            className={cn(
                              'w-full px-3 py-2 border rounded-xl outline-none font-mono-data font-semibold transition-colors',
                              isDark
                                ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-amber-500/50'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs'
                            )}
                          />
                        </div>
                        <div>
                          <span className={cn('text-[11px] block mb-1', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>Số cột (Cols)</span>
                          <input
                            type="number"
                            required
                            min={4}
                            max={25}
                            value={rCols}
                            onChange={(e) => setRCols(Number(e.target.value))}
                            className={cn(
                              'w-full px-3 py-2 border rounded-xl outline-none font-mono-data font-semibold transition-colors',
                              isDark
                                ? 'bg-[#09090e] border-white/10 text-[#f0ede8] focus:border-amber-500/50'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs'
                            )}
                          />
                        </div>
                      </div>

                      {/* Quick Size Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className={cn('text-[11px]', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>Cỡ mẫu:</span>
                        {[
                          { label: 'Chuẩn 10×16', r: 10, c: 16 },
                          { label: 'Vừa 8×12', r: 8, c: 12 },
                          { label: 'Lớn 12×18', r: 12, c: 18 },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setRRows(preset.r)
                              setRCols(preset.c)
                            }}
                            className={cn(
                              'px-2 py-0.5 rounded-md border text-[11px] font-mono-data cursor-pointer transition-all',
                              rRows === preset.r && rCols === preset.c
                                ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] font-bold shadow-xs'
                                : isDark
                                ? 'bg-white/5 text-[#a09e9a] border-white/10 hover:text-white'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={rLoading}
                      className="w-full bg-[#e8b84b] hover:bg-[#d9a738] text-[#09090e] border-0 rounded-xl py-3 font-bold text-xs cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 mt-3"
                    >
                      {rLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang khởi tạo phòng chiếu...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Tạo Phòng Chiếu Mới</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

              </div>

              {/* Right Column: Auditoriums Management Grid & Actions */}
              <div className="lg:col-span-8 space-y-4">
                {/* Header Management Card & Batch Config Button */}
                <div className={cn(
                  'p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-colors shadow-xs',
                  isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
                )}>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        'p-2 rounded-xl shrink-0',
                        isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                      )}>
                        <Building2 className="w-4 h-4 stroke-[2.2]" />
                      </span>
                      <div>
                        <h3 className={cn('font-display font-bold text-base sm:text-lg', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                          Quản Lý Phòng & Sơ Đồ Ghế
                        </h3>
                        <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                          Hiện có <strong>{safeRooms.length} phòng chiếu</strong> ({totalAuditoriumSeats.toLocaleString('vi-VN')} ghế) đang hoạt động trong toàn hệ thống rạp.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setLayoutModalConfig({
                        isOpen: true,
                        roomType: roomCategoryFilter !== 'all' ? roomCategoryFilter : 'standard',
                        roomIds: [],
                      })
                    }
                    className="px-4 py-2.5 bg-[#e8b84b] hover:bg-[#d9a738] text-[#09090e] font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-2 active:scale-[0.98]"
                  >
                    <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
                    <span>Cấu Hình Sơ Đồ Toàn Rạp</span>
                  </button>
                </div>

                {/* Filter Tabs Toolbar */}
                <div className={cn(
                  'p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors',
                  isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200 shadow-xs'
                )}>
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs flex-1">
                    {[
                      { key: 'all', label: 'Tất Cả', count: safeRooms.length },
                      { key: 'standard', label: 'Standard', count: standardCount },
                      { key: 'imax', label: 'IMAX', count: imaxCount },
                      { key: 'vip', label: 'VIP', count: vipCount },
                      { key: '3d', label: '3D', count: threeDCount },
                      { key: '4d', label: '4DX', count: fourDCount },
                      { key: 'kids', label: 'Kids', count: kidsCount },
                    ].map((tab) => {
                      const isActive = roomCategoryFilter === tab.key
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setRoomCategoryFilter(tab.key)}
                          className={cn(
                            'px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 text-xs',
                            isActive
                              ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-xs'
                              : isDark
                              ? 'bg-white/5 text-[#a09e9a] border-white/10 hover:border-white/20'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                          )}
                        >
                          <span>{tab.label}</span>
                          <span className={cn('text-[10px] font-mono-data opacity-80', isActive ? 'text-[#09090e]' : '')}>
                            ({tab.count})
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Rooms Grid Cards (Responsive 2 columns) */}
                {filteredRooms.length === 0 ? (
                  <div className={cn(
                    'p-12 text-center rounded-2xl border space-y-3',
                    isDark ? 'bg-[#111118] border-white/10 text-[#a09e9a]' : 'bg-white border-slate-200 text-slate-500'
                  )}>
                    <Building2 className="w-10 h-10 mx-auto text-slate-500/40" />
                    <p className="font-semibold text-sm">Chưa có phòng chiếu nào thuộc danh mục này.</p>
                    <p className="text-xs max-w-sm mx-auto">Bạn có thể tạo phòng mới ở cột bên trái hoặc bấm nút bên dưới để xem toàn bộ phòng.</p>
                    <button
                      type="button"
                      onClick={() => setRoomCategoryFilter('all')}
                      className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-[#e8b84b] font-bold text-xs rounded-xl border border-amber-500/30 cursor-pointer transition-colors"
                    >
                      Xem Tất Cả Phòng
                    </button>
                  </div>
                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {filteredRooms.map((r) => {
                      const typeKey = r?.room_type || 'standard'
                      const typeUpper = typeKey.toUpperCase()
                      const rawName = r?.name || `Phòng #${r?.room_number || r?.id || 1}`
                      const cleanName = rawName.replace(new RegExp(`\\(${r?.room_type || ''}\\)`, 'gi'), '').trim() || rawName

                      const typeBadgeStyle =
                        typeKey === 'imax'
                          ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                          : typeKey === 'vip'
                          ? 'text-purple-500 bg-purple-500/10 border-purple-500/30'
                          : typeKey === '4d'
                          ? 'text-blue-500 bg-blue-500/10 border-blue-500/30'
                          : typeKey === '3d'
                          ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
                          : typeKey === 'kids'
                          ? 'text-pink-500 bg-pink-500/10 border-pink-500/30'
                          : 'text-slate-400 bg-slate-500/10 border-slate-500/20'

                      return (
                        <div
                          key={r.id}
                          className={cn(
                            'border rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between gap-3 group',
                            isDark
                              ? 'bg-[#111118] border-white/10 hover:border-white/20'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                          )}
                        >
                          {/* Top: Name & Badges & Delete */}
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <h5 className={cn('font-display font-bold text-base truncate', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                                {cleanName}
                              </h5>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={cn('text-[10px] font-mono-data uppercase px-2 py-0.5 rounded-lg border font-bold', typeBadgeStyle)}>
                                  {typeUpper}
                                </span>
                                <span className={cn(
                                  'text-[10px] font-mono-data px-2 py-0.5 rounded-lg border font-medium',
                                  isDark ? 'text-white/60 bg-white/5 border-white/10' : 'text-slate-600 bg-slate-100 border-slate-200'
                                )}>
                                  #{r.room_number ?? 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRoom(r.id, r.name)}
                                  title={`Xóa phòng ${r.name}`}
                                  className={cn(
                                    'p-1.5 rounded-lg border text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all ml-1',
                                    isDark ? 'border-white/5 hover:border-rose-500/30' : 'border-slate-200 hover:border-rose-300'
                                  )}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Middle: Metrics */}
                            <div className={cn('space-y-1.5 text-xs pt-2.5 border-t', isDark ? 'border-white/5 text-[#a09e9a]' : 'border-slate-100 text-slate-600')}>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Grid3X3 className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Bố trí ghế:</span>
                                </span>
                                <strong className={cn('font-semibold', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                                  {r.total_rows} hàng × {r.total_cols} cột
                                </strong>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Armchair className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Sức chứa:</span>
                                </span>
                                <span className={cn(
                                  'font-semibold text-xs px-2 py-0.5 rounded-md border',
                                  isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-900 border-amber-200'
                                )}>
                                  {r.total_seats || r.total_rows * r.total_cols} ghế khả dụng
                                </span>
                              </div>

                              <div className="flex items-center justify-between pt-0.5">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Trạng thái:</span>
                                </span>
                                <span className="text-emerald-500 font-semibold text-[11px]">
                                  Sẵn sàng chiếu
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}


      {activeTab === 'vouchers' && (
        <VoucherAdminTab isDark={isDark} />
      )}

      {/* TAB: CONCESSIONS MANAGEMENT */}
      {activeTab === 'concessions' && (
        <ConcessionAdminTab isDark={isDark} />
      )}
      {activeTab === 'loyalty' && (
        <LoyaltyAdminTab isDark={isDark} />
      )}

      {/* TAB 4: STAFF TICKET SCANNER & CHECK-IN */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Scanner Input Panel */}
          <div className={`lg:col-span-5 p-6 rounded-2xl border space-y-6 shadow-xl transition-colors ${
            isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className="space-y-1.5 border-b pb-4 border-white/10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-400 font-semibold">
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code Ticket Scanner</span>
              </div>
              <h3 className={`font-display font-bold text-2xl ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>Soát Vé & Check-in</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                Nhập hoặc quét Mã vé QR từ thiết bị di động của khán giả để kiểm tra tính hợp lệ và xác nhận cho vào rạp.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleVerifyTicketCode()
              }}
              className="space-y-4"
            >
              <div>
                <label className={`block text-xs mb-1.5 font-medium ${isDark ? 'text-[#a09e9a]' : 'text-slate-700'}`}>
                  Mã Vé Chiếu (Ticket Code / QR Payload):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={scannerTicketCode}
                    onChange={(e) => setScannerTicketCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: CVN-8942A1..."
                    className={`flex-1 px-3.5 py-3 border rounded-xl text-sm outline-none font-mono-data font-bold uppercase transition-colors ${
                      isDark
                        ? 'bg-[#09090e] border-white/15 text-[#f0ede8] focus:border-[#e8b84b]'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 shadow-sm'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={scannerLoading || !scannerTicketCode.trim()}
                    className="bg-[#e8b84b] hover:bg-[#f0c868] text-[#09090e] font-bold px-5 py-3 rounded-xl text-xs cursor-pointer transition-all disabled:opacity-50 shadow-md shrink-0 flex items-center justify-center gap-1.5"
                  >
                    {scannerLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang quét...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Kiểm Tra Vé</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Recent Sample Ticket Chips */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${isDark ? 'text-[#a09e9a]' : 'text-slate-600'}`}>
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Thử mã vé mẫu từ danh sách vé hệ thống:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {showtimes.slice(0, 4).map((st, idx) => {
                  const sampleCode = `CVN-${st.id}A${idx + 1}`
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setScannerTicketCode(sampleCode)
                        handleVerifyTicketCode(sampleCode)
                      }}
                      className={`text-[11px] font-mono-data px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-[#e8b84b] hover:bg-white/10'
                          : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 font-semibold'
                      }`}
                    >
                      {sampleCode}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Verification Result Display Panel */}
          <div className="lg:col-span-7 space-y-6">
            {scannerResult ? (
              <div className={`p-6 rounded-2xl border space-y-6 shadow-xl transition-all ${
                scannerResult.status_code === 'VALID'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : scannerResult.status_code === 'CHECKED_IN'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
              }`}>
                {/* Result Header Badge */}
                <div className="flex justify-between items-center border-b border-current/20 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0">
                      {scannerResult.status_code === 'VALID' ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      ) : scannerResult.status_code === 'CHECKED_IN' ? (
                        <AlertTriangle className="w-8 h-8 text-amber-400" />
                      ) : (
                        <ShieldAlert className="w-8 h-8 text-rose-400" />
                      )}
                    </span>
                    <div>
                      <h4 className="font-display font-extrabold text-lg leading-tight uppercase">
                        {scannerResult.status_code === 'VALID'
                          ? 'VÉ HỢP LỆ - SẴN SÀNG VÀO RẠP'
                          : scannerResult.status_code === 'CHECKED_IN'
                          ? 'VÉ NÀY ĐÃ ĐƯỢC CHECK-IN LÚC TRƯỚC'
                          : 'VÉ KHÔNG HỢP LỆ HOẶC ĐÃ HỦY'}
                      </h4>
                      <p className="text-xs font-semibold opacity-90 mt-0.5">{scannerResult.message}</p>
                    </div>
                  </div>

                  <span className="font-mono-data font-bold text-xs uppercase px-3 py-1 rounded-full border border-current">
                    {scannerResult.status_code}
                  </span>
                </div>

                {/* Ticket Details Box */}
                {scannerResult.reservation && (
                  <div className={`p-4 rounded-xl border space-y-3 text-xs ${
                    isDark ? 'bg-[#09090e] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}>
                    <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/10">
                      <div>
                        <span className="text-[#a09e9a] block text-[10px] uppercase">Phim Chiếu</span>
                        <strong className="text-base font-display text-[#e8b84b]">
                          {scannerResult.reservation.showtime?.movie_title || 'Minions & Quái Vật'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#a09e9a] block text-[10px] uppercase">Phòng Chiếu</span>
                        <strong className="text-base font-display text-emerald-400">
                          {scannerResult.reservation.showtime?.room_name || 'Phòng Standard 1'}
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[#a09e9a] block text-[10px] uppercase">Giờ Chiếu</span>
                        <strong>
                          {scannerResult.reservation.showtime?.start_time
                            ? new Date(scannerResult.reservation.showtime.start_time).toLocaleString('vi-VN')
                            : 'N/A'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#a09e9a] block text-[10px] uppercase">Danh Sách Ghế</span>
                        <strong className="text-amber-400 font-bold">
                          {scannerResult.reservation.reservation_seats
                            ?.map((s: any) => s.seat_label ?? `R${s.row_label}C${s.col_number}`)
                            .join(', ') || 'N/A'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Check-in Action Button */}
                {scannerResult.status_code === 'VALID' && (
                  <button
                    type="button"
                    disabled={checkInLoading}
                    onClick={handlePerformCheckIn}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold py-4 rounded-xl text-sm cursor-pointer transition-all shadow-xl uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {checkInLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    <span>{checkInLoading ? 'Đang check-in...' : 'ĐÁNH DẤU ĐÃ VÀO RẠP (CHECK-IN VÉ)'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className={`p-12 rounded-2xl border text-center space-y-3 transition-colors ${
                isDark ? 'bg-[#111118] border-white/10 text-[#a09e9a]' : 'bg-white border-slate-200 text-slate-500 shadow-md'
              }`}>
                <Smartphone className="w-14 h-14 mx-auto text-amber-400/50" />
                <h4 className={`font-display font-bold text-lg ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>Sẵn Sàng Quét Mã QR</h4>
                <p className="text-xs max-w-sm mx-auto">
                  Nhập mã vé hoặc chọn mã vé mẫu ở cột bên trái để kiểm tra thông tin vé điện tử của khán giả.
                </p>
              </div>
            )}

            {/* Recent Check-ins History */}
            {recentCheckIns.length > 0 && (
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#111118] border-white/10' : 'bg-white border-slate-200 shadow-md'
              }`}>
                <h4 className={`font-display font-bold text-sm flex items-center gap-2 ${isDark ? 'text-[#f0ede8]' : 'text-slate-900'}`}>
                  <ClipboardList className="w-4 h-4 text-amber-400" />
                  <span>Nhật Ký Check-in Gần Đây ({recentCheckIns.length})</span>
                </h4>
                <div className="space-y-2 text-xs">
                  {recentCheckIns.map((item, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl border flex justify-between items-center ${
                      isDark ? 'bg-[#09090e] border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <span className="font-bold text-amber-400">{item.ticket_code}</span>
                        <span className="mx-2 opacity-50">·</span>
                        <span className={isDark ? 'text-[#f0ede8]' : 'text-slate-900'}>{item.movie_title}</span>
                      </div>
                      <span className="text-[11px] text-[#a09e9a] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#a09e9a]" />
                        <span>{item.checked_in_at}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ANALYTICS & REPORTS */}
      {activeTab === 'analytics' && (
        <AnalyticsAdminTab isDark={isDark} notify={notify} moviesCount={movies.length} />
      )}

      
      {/* TAB 9: REFUNDS MANAGEMENT */}
      {activeTab === 'refunds' && (
        <RefundsAdminTab isDark={isDark} notify={notify} />
      )}

      
      {/* TAB: REVIEWS & RATINGS MODERATION */}
      {activeTab === 'reviews' && (
        <ReviewManageTab movies={movies} notify={notify} />
      )}

    

      {/* AUTO-SCHEDULE MODAL */}
      {autoModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
          <div className={cn(
            'rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col border transition-colors',
            isDark ? 'bg-[#111118] border-white/10 text-[#f0ede8]' : 'bg-white border-slate-200 text-slate-900'
          )}>
            {/* Modal Header */}
            <div className={cn('flex justify-between items-center border-b pb-4 shrink-0', isDark ? 'border-white/10' : 'border-slate-200')}>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'p-2.5 rounded-xl shrink-0',
                  isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'
                )}>
                  <Sparkles className="w-5 h-5 stroke-[2.2]" />
                </span>
                <div>
                  <h3 className={cn('font-display font-bold text-lg sm:text-xl flex items-center gap-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    Cấu Hình & Lập Lịch Tự Động
                  </h3>
                  <p className={cn('text-xs mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                    Tự động tìm khung giờ trống, tối ưu thể loại phim theo phòng và bảo đảm không xung đột lịch.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={autoConfirming}
                onClick={() => {
                  setAutoModalOpen(false)
                  setAutoPreviewList(null)
                  setAutoModalError(null)
                }}
                className={cn(
                  'p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed',
                  isDark
                    ? 'bg-white/5 border-white/10 text-[#a09e9a] hover:text-white hover:bg-white/10'
                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                )}
                aria-label="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* In-Modal Error Notification */}
            {autoModalError && (
              <div className={cn(
                'mt-3 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shrink-0 shadow-sm animate-in fade-in',
                isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              )}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-semibold whitespace-pre-line leading-relaxed">{autoModalError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoModalError(null)}
                  className="p-1 rounded-md text-rose-400 hover:text-rose-600 cursor-pointer shrink-0 transition-colors"
                  aria-label="Đóng thông báo lỗi"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Scrollable Modal Body */}
            <div className={cn('flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4 font-sans my-4', isDark ? '[color-scheme:dark]' : '[color-scheme:light]')}>
              {/* Date Preset Shortcuts */}
              <div className={cn('flex flex-wrap items-center gap-2 text-xs', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>
                <span className="font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Khoảng ngày nhanh:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const start = new Date()
                    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
                    setAutoStartDate(toLocalYYYYMMDD(start))
                    setAutoEndDate(toLocalYYYYMMDD(end))
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border cursor-pointer font-semibold text-xs transition-all',
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-[#e8b84b] border-white/10'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
                  )}
                >
                  + 7 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const start = new Date()
                    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 14)
                    setAutoStartDate(toLocalYYYYMMDD(start))
                    setAutoEndDate(toLocalYYYYMMDD(end))
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border cursor-pointer font-semibold text-xs transition-all',
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-[#e8b84b] border-white/10'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
                  )}
                >
                  + 14 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const start = new Date()
                    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
                    setAutoStartDate(toLocalYYYYMMDD(start))
                    setAutoEndDate(toLocalYYYYMMDD(end))
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border cursor-pointer font-semibold text-xs transition-all',
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-[#e8b84b] border-white/10'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
                  )}
                >
                  Đến Cuối Tháng
                </button>
              </div>

              {/* Clean Old Showtimes Checkbox Option */}
              <div className={cn(
                'p-3.5 rounded-xl border flex items-center justify-between transition-colors',
                isDark ? 'bg-[#09090e] border-[#e8b84b]/20 text-[#f0ede8]' : 'bg-amber-50/70 border-amber-200 text-slate-900 shadow-xs'
              )}>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={autoReplaceExisting}
                    onChange={(e) => setAutoReplaceExisting(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#e8b84b] cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className={cn('font-semibold', isDark ? 'text-[#e8b84b]' : 'text-amber-950')}>
                      Dọn dẹp suất chiếu cũ (chưa có vé) trong khoảng ngày trước khi xếp mới (Khuyên dùng)
                    </span>
                  </div>
                </label>
              </div>

              {/* Start > End Date Validation Warning */}
              {autoStartDate > autoEndDate && (
                <div className={cn(
                  'p-3 rounded-xl border text-xs font-medium flex items-center gap-2',
                  isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                )}>
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Lỗi: Ngày bắt đầu ({formatVNFullDate(autoStartDate)}) không thể lớn hơn Ngày kết thúc ({formatVNFullDate(autoEndDate)}). Vui lòng chọn lại khoảng ngày hợp lệ.</span>
                </div>
              )}

              {/* Input Controls Form */}
              <div className={cn(
                'grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border text-xs transition-colors',
                isDark ? 'bg-[#09090e] border-white/5 text-[#f0ede8]' : 'bg-slate-50 border-slate-200 text-slate-900 shadow-xs'
              )}>
                <div>
                  <CleanDatePicker
                    label="Từ Ngày (Start Date)"
                    value={autoStartDate}
                    minDate={toLocalYYYYMMDD(new Date())}
                    onChange={(d) => setAutoStartDate(d)}
                  />
                </div>

                <div>
                  <CleanDatePicker
                    label="Đến Ngày (End Date)"
                    value={autoEndDate}
                    minDate={autoStartDate}
                    onChange={(d) => setAutoEndDate(d)}
                  />
                </div>

                <div>
                  <label className={cn('block mb-1 font-semibold flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Thời Gian Dọn Phòng (Phút)</span>
                  </label>
                  <input
                    type="number"
                    value={autoBufferMins}
                    onChange={(e) => setAutoBufferMins(Number(e.target.value))}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg outline-none font-mono-data transition-colors',
                      isDark
                        ? 'bg-[#111118] border-white/10 text-[#f0ede8] focus:border-amber-500/50'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs font-semibold'
                    )}
                  />
                </div>

                <div>
                  <label className={cn('block mb-1 font-semibold flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Giờ Rạp Mở Cửa (Giờ : Phút)</span>
                  </label>
                  <input
                    type="time"
                    value={autoStartTimeStr}
                    onChange={(e) => setAutoStartTimeStr(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg outline-none font-mono-data cursor-pointer transition-colors',
                      isDark
                        ? 'bg-[#111118] border-white/10 text-[#f0ede8] [color-scheme:dark] focus:border-amber-500/50'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 [color-scheme:light] shadow-xs font-semibold'
                    )}
                  />
                </div>

                <div>
                  <label className={cn('block mb-1 font-semibold flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Giờ Rạp Đóng Cửa (Giờ : Phút)</span>
                  </label>
                  <input
                    type="time"
                    value={autoEndTimeStr}
                    onChange={(e) => setAutoEndTimeStr(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg outline-none font-mono-data cursor-pointer transition-colors',
                      isDark
                        ? 'bg-[#111118] border-white/10 text-[#f0ede8] [color-scheme:dark] focus:border-amber-500/50'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 [color-scheme:light] shadow-xs font-semibold'
                    )}
                  />
                </div>

                <div>
                  <label className={cn('block mb-1 font-semibold flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-700')}>
                    <Ticket className="w-3.5 h-3.5 text-amber-500" />
                    <span>Giá Vé Thường / VIP (VNĐ)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={autoBasePrice}
                      onChange={(e) => setAutoBasePrice(Number(e.target.value))}
                      className={cn(
                        'w-1/2 px-2.5 py-2 border rounded-lg outline-none font-mono-data transition-colors',
                        isDark
                          ? 'bg-[#111118] border-white/10 text-[#f0ede8] focus:border-amber-500/50'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs font-semibold'
                      )}
                    />
                    <input
                      type="number"
                      value={autoVipPrice}
                      onChange={(e) => setAutoVipPrice(Number(e.target.value))}
                      className={cn(
                        'w-1/2 px-2.5 py-2 border rounded-lg outline-none font-mono-data transition-colors',
                        isDark
                          ? 'bg-[#111118] border-white/10 text-[#f0ede8] focus:border-amber-500/50'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs font-semibold'
                      )}
                    />
                  </div>
                </div>

                <div className={cn('md:col-span-3 pt-3 border-t flex flex-col sm:flex-row flex-wrap gap-4', isDark ? 'border-white/10' : 'border-slate-200')}>
                  <label className={cn('flex items-center gap-2 cursor-pointer text-xs select-none', isDark ? 'text-[#f0ede8]' : 'text-slate-800 font-semibold')}>
                    <input
                      type="checkbox"
                      checked={autoSmartGenre}
                      onChange={(e) => setAutoSmartGenre(e.target.checked)}
                      className="accent-[#e8b84b] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Tối ưu thể loại phim theo phòng (Hành động/Khoa học vào IMAX, Hoạt hình vào Kids...)</span>
                    </div>
                  </label>

                  <label className={cn('flex items-center gap-2 cursor-pointer text-xs select-none', isDark ? 'text-[#f0ede8]' : 'text-slate-800 font-semibold')}>
                    <input
                      type="checkbox"
                      checked={autoPricingByRoom}
                      onChange={(e) => setAutoPricingByRoom(e.target.checked)}
                      className="accent-[#e8b84b] w-4 h-4 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Áp dụng hệ số giá theo phòng (Standard 1.0x, IMAX 1.7x, VIP 1.8x, 3D 1.3x...)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Movie Selection Section */}
              <div className={cn(
                'p-4 rounded-xl border space-y-3 text-xs transition-colors',
                isDark ? 'bg-[#09090e] border-white/5' : 'bg-slate-50 border-slate-200 shadow-xs'
              )}>
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <label className={cn('font-bold flex items-center gap-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    <Film className="w-4 h-4 text-amber-500" />
                    <span>Chọn Phim Áp Dụng Xếp Lịch</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <label className={cn('flex items-center gap-1.5 cursor-pointer select-none', isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900 font-medium')}>
                      <input
                        type="radio"
                        name="movieSelectMode"
                        checked={autoMovieSelectionMode === 'all'}
                        onChange={() => setAutoMovieSelectionMode('all')}
                        className="accent-[#e8b84b] cursor-pointer"
                      />
                      <span>Tất cả phim đang/sắp chiếu ({movies.length})</span>
                    </label>
                    <label className={cn('flex items-center gap-1.5 cursor-pointer select-none', isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900 font-medium')}>
                      <input
                        type="radio"
                        name="movieSelectMode"
                        checked={autoMovieSelectionMode === 'custom'}
                        onChange={() => setAutoMovieSelectionMode('custom')}
                        className="accent-[#e8b84b] cursor-pointer"
                      />
                      <span>Tự chọn phim cụ thể {autoMovieSelectionMode === 'custom' && `(${autoSelectedMovieIds.length})`}</span>
                    </label>
                  </div>
                </div>

                {autoMovieSelectionMode === 'custom' && (() => {
                  const nowShowing = movies.filter((m) => m.status === 'now_showing')
                  const comingSoon = movies.filter((m) => m.status === 'coming_soon')
                  const ended = movies.filter((m) => m.status !== 'now_showing' && m.status !== 'coming_soon')

                  const renderMovieGrid = (movieList: typeof movies) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {movieList.map((m) => {
                        const isChecked = autoSelectedMovieIds.includes(m.id)
                        return (
                          <label
                            key={m.id}
                            className={cn(
                              'flex items-center gap-2 p-2.5 rounded-lg border transition-colors cursor-pointer select-none',
                              isChecked
                                ? isDark
                                  ? 'bg-[#e8b84b]/12 border-[#e8b84b] text-[#f0ede8]'
                                  : 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs font-semibold'
                                : isDark
                                  ? 'bg-[#111118] border-white/10 text-[#a09e9a] hover:border-white/20'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAutoSelectedMovieIds([...autoSelectedMovieIds, m.id])
                                } else {
                                  setAutoSelectedMovieIds(autoSelectedMovieIds.filter((id) => id !== m.id))
                                }
                              }}
                              className="accent-[#e8b84b] cursor-pointer shrink-0"
                            />
                            <span className="truncate font-medium text-xs">{m.title}</span>
                          </label>
                        )
                      })}
                    </div>
                  )

                  return (
                    <div className={cn('pt-3 border-t space-y-4 max-h-[280px] overflow-y-auto pr-1', isDark ? 'border-white/10' : 'border-slate-200')}>
                      {/* Section 1: Phim Đang Chiếu */}
                      {nowShowing.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-emerald-500 flex items-center gap-1.5">
                              <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>PHIM ĐANG CHIẾU ({nowShowing.length})</span>
                            </span>
                            <div className="flex items-center gap-2 text-[11px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const nsIds = nowShowing.map((m) => m.id)
                                  const newSet = new Set([...autoSelectedMovieIds, ...nsIds])
                                  setAutoSelectedMovieIds(Array.from(newSet))
                                }}
                                className="text-emerald-500 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Chọn tất cả</span>
                              </button>
                              <span className={isDark ? 'text-white/20' : 'text-slate-300'}>|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const nsIds = new Set(nowShowing.map((m) => m.id))
                                  setAutoSelectedMovieIds(autoSelectedMovieIds.filter((id) => !nsIds.has(id)))
                                }}
                                className={cn('hover:underline cursor-pointer flex items-center gap-1', isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-500 hover:text-slate-800')}
                              >
                                <X className="w-3 h-3" />
                                <span>Bỏ chọn</span>
                              </button>
                            </div>
                          </div>
                          {renderMovieGrid(nowShowing)}
                        </div>
                      )}

                      {/* Section 2: Phim Sắp Ra Mắt */}
                      {comingSoon.length > 0 && (
                        <div className={cn('space-y-2', nowShowing.length > 0 && ('pt-3 border-t ' + (isDark ? 'border-white/10' : 'border-slate-200')))}>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-amber-500 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span>PHIM SẮP RA MẮT ({comingSoon.length})</span>
                            </span>
                            <div className="flex items-center gap-2 text-[11px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const csIds = comingSoon.map((m) => m.id)
                                  const newSet = new Set([...autoSelectedMovieIds, ...csIds])
                                  setAutoSelectedMovieIds(Array.from(newSet))
                                }}
                                className="text-amber-500 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Chọn tất cả</span>
                              </button>
                              <span className={isDark ? 'text-white/20' : 'text-slate-300'}>|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const csIds = new Set(comingSoon.map((m) => m.id))
                                  setAutoSelectedMovieIds(autoSelectedMovieIds.filter((id) => !csIds.has(id)))
                                }}
                                className={cn('hover:underline cursor-pointer flex items-center gap-1', isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-500 hover:text-slate-800')}
                              >
                                <X className="w-3 h-3" />
                                <span>Bỏ chọn</span>
                              </button>
                            </div>
                          </div>
                          {renderMovieGrid(comingSoon)}
                        </div>
                      )}

                      {/* Section 3: Phim Đã Kết Thúc */}
                      {ended.length > 0 && (
                        <div className={cn('space-y-2 pt-3 border-t', isDark ? 'border-white/10' : 'border-slate-200')}>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400 flex items-center gap-1.5">
                              <Archive className="w-3.5 h-3.5 shrink-0" />
                              <span>PHIM ĐÃ KẾT THÚC ({ended.length})</span>
                            </span>
                          </div>
                          {renderMovieGrid(ended)}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Room Selection Section */}
              <div className={cn(
                'p-4 rounded-xl border space-y-3 text-xs transition-colors',
                isDark ? 'bg-[#09090e] border-white/5' : 'bg-slate-50 border-slate-200 shadow-xs'
              )}>
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <label className={cn('font-bold flex items-center gap-2', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span>Chọn Phòng Chiếu Áp Dụng</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <label className={cn('flex items-center gap-1.5 cursor-pointer select-none', isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900 font-medium')}>
                      <input
                        type="radio"
                        name="roomSelectMode"
                        checked={autoRoomSelectionMode === 'all'}
                        onChange={() => setAutoRoomSelectionMode('all')}
                        className="accent-[#e8b84b] cursor-pointer"
                      />
                      <span>Tất cả phòng chiếu ({rooms.length})</span>
                    </label>
                    <label className={cn('flex items-center gap-1.5 cursor-pointer select-none', isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-600 hover:text-slate-900 font-medium')}>
                      <input
                        type="radio"
                        name="roomSelectMode"
                        checked={autoRoomSelectionMode === 'custom'}
                        onChange={() => setAutoRoomSelectionMode('custom')}
                        className="accent-[#e8b84b] cursor-pointer"
                      />
                      <span>Tự chọn phòng cụ thể {autoRoomSelectionMode === 'custom' && `(${autoSelectedRoomIds.length}/${rooms.length})`}</span>
                    </label>
                  </div>
                </div>

                {autoRoomSelectionMode === 'custom' && (
                  <div className={cn('pt-3 border-t space-y-3', isDark ? 'border-white/10' : 'border-slate-200')}>
                    {/* Quick Category Action Bar */}
                    <div className={cn(
                      'flex flex-wrap justify-between items-center gap-2 p-2.5 rounded-xl border',
                      isDark ? 'bg-[#111118] border-white/5' : 'bg-white border-slate-200 shadow-xs'
                    )}>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className={cn('font-medium mr-1', isDark ? 'text-[#a09e9a]' : 'text-slate-600')}>Lọc loại phòng:</span>
                        {['standard', 'vip', 'imax', '3d', '4d', 'kids'].map((typeKey) => {
                          const typeRooms = rooms.filter((r) => (r.room_type || 'standard') === typeKey)
                          if (typeRooms.length === 0) return null
                          const typeIds = typeRooms.map((r) => r.id)
                          const selectedCount = typeIds.filter((id) => autoSelectedRoomIds.includes(id)).length
                          const isAllSelected = selectedCount === typeIds.length

                          const label =
                            typeKey === 'standard'
                              ? 'Standard'
                              : typeKey === 'vip'
                              ? 'VIP'
                              : typeKey === 'imax'
                              ? 'IMAX'
                              : typeKey === '3d'
                              ? '3D'
                              : typeKey === '4d'
                              ? '4DX'
                              : 'Kids'

                          return (
                            <button
                              key={typeKey}
                              type="button"
                              onClick={() => {
                                if (isAllSelected) {
                                  setAutoSelectedRoomIds(autoSelectedRoomIds.filter((id) => !typeIds.includes(id)))
                                } else {
                                  const newSet = new Set([...autoSelectedRoomIds, ...typeIds])
                                  setAutoSelectedRoomIds(Array.from(newSet))
                                }
                              }}
                              className={cn(
                                'px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-bold text-[11px] flex items-center gap-1',
                                isAllSelected
                                  ? 'bg-[#e8b84b] text-[#09090e] border-[#e8b84b] shadow-xs'
                                  : selectedCount > 0
                                  ? isDark
                                    ? 'bg-[#e8b84b]/20 text-[#e8b84b] border-[#e8b84b]/40'
                                    : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                  : isDark
                                    ? 'bg-white/5 text-[#a09e9a] border-white/10 hover:text-[#f0ede8]'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                              )}
                            >
                              {isAllSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                              <span>{label}</span>
                              <span className="opacity-75">({selectedCount}/{typeRooms.length})</span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Select All / Deselect All Shortcuts */}
                      <div className="flex items-center gap-2 text-[11px] ml-auto">
                        <button
                          type="button"
                          onClick={() => setAutoSelectedRoomIds(rooms.map((r) => r.id))}
                          className="text-[#e8b84b] hover:underline font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Chọn tất cả</span>
                        </button>
                        <span className={isDark ? 'text-white/20' : 'text-slate-300'}>|</span>
                        <button
                          type="button"
                          onClick={() => setAutoSelectedRoomIds([])}
                          className={cn('hover:underline cursor-pointer flex items-center gap-1', isDark ? 'text-[#a09e9a] hover:text-[#f0ede8]' : 'text-slate-500 hover:text-slate-800')}
                        >
                          <X className="w-3 h-3" />
                          <span>Bỏ chọn</span>
                        </button>
                      </div>
                    </div>

                    {/* Room Grid Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {rooms.map((r) => {
                        const isChecked = autoSelectedRoomIds.includes(r.id)
                        const roomTypeUpper = (r.room_type || 'standard').toUpperCase()
                        const cleanName = r.name.replace(new RegExp(`\\(${r.room_type}\\)`, 'gi'), '').trim()

                        const typeBadgeStyle =
                          r.room_type === 'imax'
                            ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                            : r.room_type === 'vip'
                            ? 'text-purple-500 bg-purple-500/10 border-purple-500/30'
                            : r.room_type === '4d'
                            ? 'text-blue-500 bg-blue-500/10 border-blue-500/30'
                            : r.room_type === '3d'
                            ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
                            : r.room_type === 'kids'
                            ? 'text-pink-500 bg-pink-500/10 border-pink-500/30'
                            : 'text-slate-500 bg-slate-500/10 border-slate-500/30'

                        return (
                          <label
                            key={r.id}
                            className={cn(
                              'p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2.5',
                              isChecked
                                ? isDark
                                  ? 'bg-[#e8b84b]/15 border-[#e8b84b] text-[#f0ede8] shadow-md shadow-[#e8b84b]/5'
                                  : 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs font-semibold'
                                : isDark
                                  ? 'bg-[#111118] border-white/10 text-[#a09e9a] hover:border-white/20'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-xs'
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAutoSelectedRoomIds([...autoSelectedRoomIds, r.id])
                                  } else {
                                    setAutoSelectedRoomIds(autoSelectedRoomIds.filter((id) => id !== r.id))
                                  }
                                }}
                                className="accent-[#e8b84b] w-4 h-4 cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className={cn('font-bold text-xs truncate', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>{cleanName}</div>
                                <div className={cn('text-[10px] flex items-center gap-1.5 mt-0.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                                  <span className={cn('px-1.5 py-0.2 rounded border text-[9px] font-mono-data font-bold', typeBadgeStyle)}>
                                    {roomTypeUpper}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Armchair className="w-3 h-3 text-[#a09e9a]" />
                                    <span>{r.total_seats || r.total_rows * r.total_cols} ghế</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Results Table */}
              {autoPreviewList !== null && (
                <div className={cn(
                  'border rounded-xl p-4 space-y-3 transition-colors',
                  isDark ? 'bg-[#09090e] border-white/10' : 'bg-slate-50 border-slate-200 shadow-xs'
                )}>
                  <div className="flex justify-between items-center">
                    <h4 className="font-display font-bold text-sm text-emerald-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Kết Quả Dự Kiến ({autoPreviewList.length} suất chiếu)</span>
                    </h4>
                    {autoPreviewList.length > 0 && (
                      <button
                        type="button"
                        disabled={autoConfirming}
                        onClick={handleConfirmAutoSchedule}
                        className="bg-[#2ecc71] hover:bg-[#27ae60] text-[#09090e] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shadow-sm flex items-center gap-2 transition-colors active:scale-[0.98]"
                      >
                        {autoConfirming ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang lưu {autoPreviewList.length} suất chiếu...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Xác Nhận Lưu ({autoPreviewList.length} Suất)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {autoPreviewList.length === 0 ? (
                    <div className="py-2">
                      {(() => {
                        const selectedRoomObjs = rooms.filter((r) => autoSelectedRoomIds.includes(r.id))
                        const hasKidsRoom = selectedRoomObjs.some((r) => (r.room_type || '').toLowerCase() === 'kids')
                        const selectedMovieObjs = movies.filter((m) => autoSelectedMovieIds.includes(m.id))
                        const incompatibleMovies = selectedMovieObjs.filter((m) => {
                          const genres = m.genres?.map((g) => g.name) || []
                          return (
                            genres.includes('Kinh Dị') ||
                            genres.includes('Gây Cấn') ||
                            (m.rating && ['T18', 'R', 'NC-17'].includes(m.rating))
                          )
                        })

                        if (hasKidsRoom && incompatibleMovies.length > 0) {
                          const horrorTitles = incompatibleMovies.map((m) => m.title).join(', ')

                          return (
                            <div className={cn(
                              'p-4 rounded-xl border font-medium space-y-1.5 shadow-sm',
                              isDark ? 'text-rose-300 bg-rose-500/10 border-rose-500/30' : 'text-rose-900 bg-rose-50 border-rose-200'
                            )}>
                              <div className="font-bold text-rose-500 text-sm flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                <span>Cảnh báo an toàn (Kids Safety Guard):</span>
                              </div>
                              <p className="text-xs leading-relaxed">
                                Hệ thống tự động từ chối xếp phim Kinh Dị / Người Lớn (<strong>{horrorTitles}</strong>) vào <strong>Phòng chiếu Trẻ Em (Kids)</strong> để bảo vệ khán giả nhỏ tuổi. Vui lòng chọn loại phòng Standard / VIP / IMAX / 3D cho phim này!
                              </p>
                            </div>
                          )
                        }

                        return (
                          <p className={cn('text-xs italic py-2', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                            Không tìm thấy khoảng thời gian trống phù hợp nào trong khoảng ngày đã chọn.
                          </p>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className={cn(
                      'max-h-[300px] overflow-x-auto overflow-y-auto pr-1 border rounded-xl',
                      isDark ? 'border-white/10' : 'border-slate-200 bg-white'
                    )}>
                      <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                        <thead>
                          <tr className={cn(
                            'border-b sticky top-0 font-semibold',
                            isDark ? 'border-white/10 text-[#a09e9a] bg-[#111118]' : 'border-slate-200 text-slate-600 bg-slate-100'
                          )}>
                            <th className="py-2.5 px-3 font-bold w-12 text-center">STT</th>
                            <th className="py-2.5 px-3 min-w-[200px]">Phim</th>
                            <th className="py-2.5 px-3 w-[130px]">Phòng Chiếu</th>
                            <th className="py-2.5 px-3 w-[150px]">Ngày Chiếu</th>
                            <th className="py-2.5 px-3 w-[160px]">Khung Giờ</th>
                            <th className="py-2.5 px-3 w-[170px]">Giá Vé (Thường/VIP)</th>
                            <th className="py-2.5 px-3 w-[110px] text-right">Hành Động</th>
                          </tr>
                        </thead>
                        <tbody className={cn('divide-y', isDark ? 'divide-white/5 text-[#f0ede8]' : 'divide-slate-200 text-slate-900')}>
                          {autoPreviewList.map((item, idx) => {
                            const isEditing = editingPreviewIdx === idx
                            const startDateObj = new Date(item.start_time)
                            const endDateObj = new Date(item.end_time)
                            const dateStr = startDateObj.toLocaleDateString('vi-VN', {
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                            const startTimeStr = startDateObj.toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                            const endTimeStr = endDateObj.toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })

                            if (isEditing) {
                              return (
                                <tr key={idx} className={isDark ? 'bg-amber-500/10' : 'bg-amber-50'}>
                                  <td className="py-3 px-3 font-mono-data text-center text-[#e8b84b] font-bold">{idx + 1}</td>
                                  <td className="py-3 px-3 font-medium">
                                    <div className={cn('font-semibold', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>{item.movie_title}</div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <select
                                      value={editPreviewRoomId}
                                      onChange={(e) => setEditPreviewRoomId(Number(e.target.value))}
                                      className={cn(
                                        'w-full p-1.5 rounded-lg border text-xs font-semibold',
                                        isDark ? 'bg-[#111118] border-white/20 text-[#f0ede8]' : 'bg-white border-slate-300 text-slate-900'
                                      )}
                                    >
                                      {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                          {r.name} ({r.room_type})
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td colSpan={2} className="py-3 px-3">
                                    <input
                                      type="datetime-local"
                                      value={editPreviewStartStr}
                                      onChange={(e) => setEditPreviewStartStr(e.target.value)}
                                      className={cn(
                                        'w-full p-1.5 rounded-lg border text-xs font-mono-data font-semibold',
                                        isDark ? 'bg-[#111118] border-white/20 text-[#f0ede8]' : 'bg-white border-slate-300 text-slate-900'
                                      )}
                                    />
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="flex gap-1.5 items-center">
                                      <input
                                        type="number"
                                        step="1000"
                                        value={editPreviewBasePrice}
                                        onChange={(e) => setEditPreviewBasePrice(Number(e.target.value))}
                                        className={cn(
                                          'w-20 p-1.5 rounded-lg border text-xs font-mono-data',
                                          isDark ? 'bg-[#111118] border-white/20 text-[#f0ede8]' : 'bg-white border-slate-300 text-slate-900'
                                        )}
                                      />
                                      <span>/</span>
                                      <input
                                        type="number"
                                        step="1000"
                                        value={editPreviewVipPrice}
                                        onChange={(e) => setEditPreviewVipPrice(Number(e.target.value))}
                                        className={cn(
                                          'w-20 p-1.5 rounded-lg border text-xs font-mono-data',
                                          isDark ? 'bg-[#111118] border-white/20 text-[#f0ede8]' : 'bg-white border-slate-300 text-slate-900'
                                        )}
                                      />
                                    </div>
                                  </td>
                                  <td className="py-2.5 text-right pr-3">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditPreview(idx)}
                                        className="text-emerald-500 font-bold hover:underline text-xs cursor-pointer flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3 stroke-[2.5]" />
                                        <span>Lưu</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingPreviewIdx(null)}
                                        className="text-slate-400 hover:underline text-xs cursor-pointer flex items-center gap-1"
                                      >
                                        <X className="w-3 h-3" />
                                        <span>Hủy</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            }

                            return (
                              <tr key={idx} className={cn('transition-colors', isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50')}>
                                <td className={cn('py-3 px-3 font-mono-data text-center', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>{idx + 1}</td>
                                <td className="py-3 px-3 font-medium">
                                  <div className={cn('font-semibold', isDark ? 'text-[#f0ede8]' : 'text-slate-900')}>{item.movie_title}</div>
                                  {item.matched_genre && (
                                    <span className="text-[10px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded inline-flex items-center gap-1 mt-1 font-semibold">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      <span>Thể loại: {item.matched_genre}</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-[#e8b84b]">
                                  <div className="font-bold">{item.room_name}</div>
                                  <span className={cn(
                                    'text-[10px] font-mono-data uppercase px-1.5 py-0.5 rounded border inline-block mt-0.5',
                                    isDark ? 'text-[#a09e9a] bg-white/5 border-white/5' : 'text-slate-600 bg-slate-100 border-slate-200'
                                  )}>
                                    {item.room_type || 'standard'}
                                  </span>
                                </td>
                                <td className={cn('py-3 px-3 font-mono-data text-xs', isDark ? 'text-[#f0ede8]' : 'text-slate-800')}>
                                  {dateStr}
                                </td>
                                <td className="py-3 px-3 font-mono-data text-xs text-[#e8b84b]">
                                  <span className={cn(
                                    'px-2.5 py-1 rounded-md border inline-block font-bold',
                                    isDark ? 'bg-white/5 border-white/10' : 'bg-amber-50 border-amber-200 text-amber-800'
                                  )}>
                                    {startTimeStr} → {endTimeStr}
                                  </span>
                                </td>
                                <td className={cn('py-3 px-3 font-mono-data text-xs', isDark ? 'text-[#f0ede8]' : 'text-slate-900 font-semibold')}>
                                  {fmt(item.base_price)} / {fmt(item.vip_price)}
                                </td>
                                <td className="py-2.5 text-right pr-3">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditPreview(idx, item)}
                                      className="text-[#e8b84b] hover:underline text-xs cursor-pointer font-semibold flex items-center gap-1"
                                    >
                                      <Pencil className="w-3 h-3" />
                                      <span>Sửa</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAutoPreviewList(autoPreviewList.filter((_, i) => i !== idx))
                                      }}
                                      className="text-rose-400 hover:text-rose-500 hover:underline text-xs cursor-pointer flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Bỏ qua</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Fixed Footer Action Bar */}
            <div className={cn('flex flex-wrap justify-between items-center border-t pt-4 gap-3 shrink-0', isDark ? 'border-white/10' : 'border-slate-200')}>
              <span className={cn('text-xs flex items-center gap-1.5', isDark ? 'text-[#a09e9a]' : 'text-slate-500')}>
                * Hệ thống tự động xếp lịch dựa trên thời lượng phim, thời gian dọn phòng và khung giờ hoạt động của rạp.
              </span>
              <button
                type="button"
                disabled={autoGenerating || autoStartDate > autoEndDate}
                onClick={handleGenerateAutoPreview}
                className="bg-[#e8b84b] hover:bg-[#d9a738] text-[#09090e] px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-[0.98] shadow-sm"
              >
                {autoGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang tính toán...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 stroke-[2.2]" />
                    <span>Tạo Bản Xem Trước (Preview)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movie Detail Modal Component */}
      <MovieDetailModal
        movie={detailMovieModal}
        onClose={() => setDetailMovieModal(null)}
      />

      {/* Unified Room Seat Layout & Dimension Config Modal */}
      {layoutModalConfig.isOpen && (
        <UnifiedRoomLayoutModal
          initialRoomType={layoutModalConfig.roomType}
          initialRoomIds={layoutModalConfig.roomIds}
          rooms={safeRooms}
          isDark={isDark}
          onClose={() => setLayoutModalConfig({ isOpen: false, roomType: null, roomIds: [] })}
          onSuccess={loadAllData}
          notify={notify}
        />
      )}
    </div>
  )
}