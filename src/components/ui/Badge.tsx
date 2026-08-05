import { cn } from '../../lib/utils'

// ──────────────────────────────────────────────────────────
// GenreBadge — small pill tag for movie genres
// ──────────────────────────────────────────────────────────
interface GenreBadgeProps {
  label: string
  className?: string
}

export function GenreBadge({ label, className }: GenreBadgeProps) {
  const cleanLabel = label.replace(/^Phim\s+/i, '')
  return (
    <span
      className={cn(
        'font-mono-data text-[10px] tracking-[2px] uppercase px-2.5 py-1',
        'border border-white/10 rounded-sm text-[#a09e9a]',
        className,
      )}
    >
      {cleanLabel}
    </span>
  )
}

// ──────────────────────────────────────────────────────────
// RatingBadge — age rating (18+, 13+, etc.)
// ──────────────────────────────────────────────────────────
interface RatingBadgeProps {
  rating: string
  className?: string
}

export function RatingBadge({ rating, className }: RatingBadgeProps) {
  return (
    <span
      className={cn(
        'font-mono-data text-[10px] tracking-[2px] uppercase px-2.5 py-1',
        'bg-[rgba(192,57,43,0.15)] border border-[rgba(192,57,43,0.3)] rounded-sm text-[#e07060]',
        className,
      )}
    >
      {rating}
    </span>
  )
}

// ──────────────────────────────────────────────────────────
// ScoreBadge — ★ score display
// ──────────────────────────────────────────────────────────
interface ScoreBadgeProps {
  score: string
  className?: string
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const n = parseFloat(score)
  const isTop = n >= 9
  return (
    <span
      className={cn(
        'font-mono-data text-xs font-medium px-2 py-0.5 rounded-sm',
        isTop
          ? 'bg-[rgba(232,184,75,0.13)] text-[#e8b84b] border border-[rgba(232,184,75,0.27)]'
          : 'bg-white/[0.06] text-[#a09e9a] border border-white/[0.06]',
        className,
      )}
    >
      ★ {score}
    </span>
  )
}

// ──────────────────────────────────────────────────────────
// ShowtimeTypeBadge — IMAX / 4DX / Standard label
// ──────────────────────────────────────────────────────────
interface ShowtimeTypeBadgeProps {
  type: string
  price: string
  className?: string
}

export function ShowtimeTypeBadge({ type, price, className }: ShowtimeTypeBadgeProps) {
  const color =
    type === 'IMAX'
      ? 'bg-[rgba(232,184,75,0.15)] text-[#e8b84b]'
      : type === '4DX'
        ? 'bg-[rgba(192,57,43,0.15)] text-[#e07060]'
        : 'bg-white/[0.05] text-[#6e6c68]'

  return (
    <span
      className={cn(
        'font-mono-data text-[10px] tracking-wide uppercase px-1.5 py-0.5 rounded-sm',
        color,
        className,
      )}
    >
      {type} · {price}
    </span>
  )
}
