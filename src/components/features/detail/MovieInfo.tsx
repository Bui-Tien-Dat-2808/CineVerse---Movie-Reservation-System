import type { Movie } from '../../../types'
import { GenreBadge } from '../../ui/Badge'

interface MovieInfoProps {
  movie: Movie
}

export default function MovieInfo({ movie }: MovieInfoProps) {
  return (
    <div className="flex flex-col md:flex-row gap-12">
      {/* Poster */}
      <div className="flex-shrink-0 w-full md:w-[340px]">
        <div className="rounded-md overflow-hidden bg-[#111118]" style={{ aspectRatio: '2/3' }}>
          <img
            src={movie.img}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Info panel */}
      <div className="flex-1 min-w-0">
        {/* Genre badges */}
        <div className="flex gap-2 flex-wrap mb-4">
          {movie.genre.map((g) => (
            <GenreBadge key={g} label={g} />
          ))}
        </div>

        {/* Title */}
        <h1
          className="font-display font-black leading-tight tracking-tight mb-3"
          style={{ fontSize: 'clamp(32px, 4vw, 54px)' }}
        >
          {movie.title}
        </h1>

        {/* Meta row */}
        <div className="flex gap-5 mb-6 text-sm text-[#a09e9a] flex-wrap items-center">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e8b84b]/15 border border-[#e8b84b]/30 text-[#e8b84b] font-bold text-xs">
            ★ {movie.avg_rating ? movie.avg_rating.toFixed(1) : (movie.score || '5.0')} / 5
            {movie.total_reviews !== undefined && (
              <span className="text-[#a09e9a] font-normal">({movie.total_reviews} đánh giá)</span>
            )}
          </span>
          {movie.year > 0 && <span>{movie.year}</span>}
          {movie.duration && movie.duration !== 'N/A' && <span>{movie.duration}</span>}
          <span>
            Đạo diễn: <strong className="text-[#f0ede8]">{movie.director || 'Đang cập nhật'}</strong>
          </span>
        </div>

        {/* Synopsis */}
        <p className="text-[15px] leading-[1.75] text-[#a09e9a] max-w-[520px] border-l-2 border-[#e8b84b] pl-4">
          {movie.synopsis || 'Nội dung phim đang được cập nhật. Vui lòng theo dõi thêm thông tin chi tiết.'}
        </p>
      </div>
    </div>
  )
}
