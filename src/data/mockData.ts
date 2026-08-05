import type { Movie, ShowTime } from '../types'

export const MOVIES: Movie[] = [
  {
    id: 1,
    title: 'Shadows of the Abyss',
    genre: ['Thriller', 'Mystery'],
    duration: '2h 18m',
    rating: '18+',
    score: '9.1',
    year: 2025,
    director: 'Nora Aldric',
    synopsis:
      'A forensic investigator is drawn into a labyrinthine conspiracy beneath a city that never sleeps, where every shadow hides a secret older than memory.',
    img: 'https://images.unsplash.com/photo-1634733049839-0292be607569?w=480&h=680&fit=crop&auto=format',

  },
  {
    id: 2,
    title: 'Event Horizon: Redux',
    genre: ['Sci-Fi', 'Horror'],
    duration: '2h 05m',
    rating: '16+',
    score: '8.7',
    year: 2025,
    director: 'Yuen Kai',
    synopsis:
      'A rescue crew ventures to the edge of the solar system to recover a lost ship — only to discover it has been somewhere no living mind should ever go.',
    img: 'https://images.unsplash.com/photo-1534996858221-380b92700493?w=480&h=680&fit=crop&auto=format',

  },
  {
    id: 3,
    title: 'The Midnight Veil',
    genre: ['Drama', 'Romance'],
    duration: '1h 54m',
    rating: '13+',
    score: '8.4',
    year: 2025,
    director: 'Isabelle Moreau',
    synopsis:
      'Two strangers meet by accident at a Parisian funeral and discover they share a grief neither can name — and a love neither can escape.',
    img: 'https://images.unsplash.com/photo-1759354192456-71975b190c51?w=480&h=680&fit=crop&auto=format',
  },
  {
    id: 4,
    title: 'Pale Horizon',
    genre: ['Adventure', 'Drama'],
    duration: '2h 32m',
    rating: '13+',
    score: '9.3',
    year: 2025,
    director: 'Elias Voss',
    synopsis:
      "An expedition to the world's last unmapped territory forces five strangers to confront the wildest thing on earth: each other.",
    img: 'https://images.unsplash.com/photo-1491466424936-e304919aada7?w=480&h=680&fit=crop&auto=format',

  },
  {
    id: 5,
    title: 'Crimson Protocol',
    genre: ['Action', 'Thriller'],
    duration: '2h 10m',
    rating: '18+',
    score: '8.0',
    year: 2025,
    director: 'Miso Park',
    synopsis:
      'A disavowed intelligence officer must stop a rogue AI from triggering a global blackout — armed only with a burner phone and forty-eight hours.',
    img: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=480&h=680&fit=crop&auto=format',
  },
  {
    id: 6,
    title: 'La Noche Eterna',
    genre: ['Horror', 'Fantasy'],
    duration: '1h 48m',
    rating: '18+',
    score: '8.5',
    year: 2025,
    director: 'Carolina Ruiz',
    synopsis:
      "In a remote mountain village, three sisters discover their grandmother's diary reveals a bargain with something ancient — and the price comes due at midnight.",
    img: 'https://images.unsplash.com/photo-1610659128929-fa69328744e2?w=480&h=680&fit=crop&auto=format',
  },
]

export const SHOWTIMES: ShowTime[] = [
  { time: '10:30', hall: 'Hall 1', type: 'Standard', price: 85000 },
  { time: '13:15', hall: 'Hall 3', type: 'IMAX', price: 150000 },
  { time: '16:00', hall: 'Hall 2', type: 'Standard', price: 85000 },
  { time: '19:30', hall: 'Hall 5', type: '4DX', price: 180000 },
  { time: '22:15', hall: 'Hall 3', type: 'IMAX', price: 150000 },
]

export const GENRES = [
  'All',
  'Hành Động',
  'Phiêu Lưu',
  'Hoạt Hình',
  'Hài',
  'Chính Kịch',
  'Gia Đình',
  'Giả Tượng',
  'Kinh Dị',
  'Bí Ẩn',
  'Lãng Mạn',
  'Khoa Học Viễn Tưởng',
  'Gây Cấn',
  'Hình Sự',
]

export const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
export const COLS = 10

export const TAKEN_SEATS = new Set([
  'A3', 'A4', 'B5', 'B6', 'B7', 'C1', 'C9', 'D4', 'D5',
  'E2', 'E3', 'E8', 'F6', 'F7', 'G3', 'G4', 'H1', 'H2', 'H9', 'H10',
])

export const HERO_MOVIE = MOVIES[0]
