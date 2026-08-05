import { useState } from 'react'
import type { Movie } from '../../../types'
import { RatingBadge } from '../../ui/Badge'

interface MovieCardProps {
  movie: Movie
  onSelect: (m: Movie) => void
}

export default function MovieCard({ movie, onSelect }: MovieCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => onSelect(movie)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer rounded overflow-hidden bg-[#111118] border transition-all duration-200"
      style={{
        borderColor: hovered ? 'rgba(232,184,75,0.3)' : 'rgba(240,237,232,0.06)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      {/* Poster */}
      <div className="relative bg-[#0d0d15]" style={{ aspectRatio: '2/3' }}>
        <img
          src={movie.img}
          alt={movie.title}
          className="w-full h-full object-cover transition-opacity duration-200"
          style={{ opacity: hovered ? 0.75 : 1 }}
          loading="lazy"
        />

        {/* Hover overlay — CTA only, không có badge */}
        {hovered && (
          <div
            className="absolute inset-0 flex items-end p-3.5"
            style={{
              background:
                'linear-gradient(0deg, rgba(9,9,14,0.97) 0%, rgba(9,9,14,0.4) 50%, transparent 100%)',
            }}
          >
            <button className="w-full bg-[#e8b84b] text-[#09090e] border-0 rounded-sm py-2.5 text-xs font-bold cursor-pointer tracking-wide">
              Đặt vé ngay
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3.5 py-3">
        <h3 className="font-display text-[15px] font-bold leading-snug mb-1.5 line-clamp-2">
          {movie.title}
        </h3>

        <div className="flex gap-1.5 flex-wrap mb-2">
          {movie.genre.map((g) => (
            <span
              key={g}
              className="text-[10px] text-[#6e6c68] bg-white/[0.04] px-1.5 py-0.5 rounded-sm"
            >
              {g}
            </span>
          ))}
        </div>

        <div className="flex justify-between items-center text-xs text-[#6e6c68]">
          <span>{movie.duration}</span>
          {movie.rating && movie.rating !== 'N/A' && <RatingBadge rating={movie.rating} />}
        </div>
      </div>
    </div>
  )
}
