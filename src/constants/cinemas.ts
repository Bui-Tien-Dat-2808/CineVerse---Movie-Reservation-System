export interface CinemaLocation {
  id: string
  name: string
  city: 'Hà Nội' | 'TP. Hồ Chí Minh' | 'Đà Nẵng'
  address: string
  phone: string
  features: Array<'IMAX' | '4DX' | 'VIP' | '3D' | 'Kids'>
  totalHalls: number
}

export const CINEVERSE_CINEMAS: CinemaLocation[] = [
  {
    id: 'nguyen-trai',
    name: 'CineVerse Nguyễn Trãi',
    city: 'Hà Nội',
    address: '12 Nguyễn Trãi, Q. Thanh Xuân, Hà Nội',
    phone: '1900 1234',
    features: ['IMAX', '4DX', 'VIP', '3D'],
    totalHalls: 8,
  },
  {
    id: 'cau-giay',
    name: 'CineVerse Cầu Giấy',
    city: 'Hà Nội',
    address: '241 Xuân Thủy, Q. Cầu Giấy, Hà Nội',
    phone: '1900 1235',
    features: ['IMAX', '3D', 'VIP', 'Kids'],
    totalHalls: 6,
  },
  {
    id: 'tay-ho',
    name: 'CineVerse Tây Hồ',
    city: 'Hà Nội',
    address: '683 Lạc Long Quân, Q. Tây Hồ, Hà Nội',
    phone: '1900 1236',
    features: ['VIP', '3D', 'Kids'],
    totalHalls: 5,
  },
  {
    id: 'ben-thanh',
    name: 'CineVerse Bến Thành',
    city: 'TP. Hồ Chí Minh',
    address: '135 Nguyễn Huệ, Q. 1, TP. Hồ Chí Minh',
    phone: '1900 2345',
    features: ['IMAX', '4DX', 'VIP', '3D'],
    totalHalls: 10,
  },
  {
    id: 'thao-dien',
    name: 'CineVerse Thảo Điền',
    city: 'TP. Hồ Chí Minh',
    address: '159 Xa Lộ Hà Nội, Q. 2, TP. Hồ Chí Minh',
    phone: '1900 2346',
    features: ['IMAX', '3D', 'Kids'],
    totalHalls: 7,
  },
  {
    id: 'da-nang',
    name: 'CineVerse Đà Nẵng',
    city: 'Đà Nẵng',
    address: '90 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng',
    phone: '1900 3456',
    features: ['IMAX', '3D', 'VIP'],
    totalHalls: 6,
  },
]
