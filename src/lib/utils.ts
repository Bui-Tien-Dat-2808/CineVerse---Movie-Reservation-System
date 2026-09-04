import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '0₫'
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (isNaN(num)) return '0₫'
  return Math.round(num).toLocaleString('vi-VN') + '₫'
}

export function getDateList(count = 7): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

/**
 * Dictionary mapping CJK/Asian script names to standard international Romanized names
 */
export const INTERNATIONAL_NAME_MAP: Record<string, string> = {
  // Conan Movie
  '蓮井隆弘': 'Takahiro Hasui',
  '高山みなみ': 'Minami Takayama',
  '山崎和佳奈': 'Wakana Yamazaki',
  '小山力也': 'Rikiya Koyama',
  '林原めぐみ': 'Megumi Hayashibara',
  '沢城みゆき': 'Miyuki Sawashiro',
  '三木眞一郎': 'Shin-ichiro Miki',
  '神奈延年': 'Nobutoshi Canna',
  'Yokohama Ryusei': 'Ryusei Yokohama',

  // Chiikawa
  '及川啓': 'Kei Oikawa',
  '青木遥': 'Haruka Aoki',
  '田中誠人': 'Makoto Tanaka',
  '小澤亜李': 'Ari Ozawa',
  '井口裕香': 'Yuka Iguchi',
  '淺井孝行': 'Takayuki Asai',
  '内田雄馬': 'Yuma Uchida',
  '島袋美由利': 'Miyuri Shimabukuro',
  '春海百乃': 'Momo Harumi',

  // AGITO
  '田崎竜太': 'Ryuta Tasaki',
  'Kaname Jun': 'Jun Kaname',
  '古川優奈': 'Yuna Kogawa',
  '賀集利樹': 'Toshiki Kashu',
  '菊池隆則': 'Takanori Higuchi',
  '岩永洋昭': 'Hiroaki Iwanaga',
  '鈴之助': 'Suzunosuke Tanaka',
  '青島心': 'Kokoro Aoshima',
  '金田哲': 'Satoshi Kanada',

  // Thư Tình Gửi Ngoại
  '藍鴻春': 'Lan Hongchun',
  '王彦桐': 'Wang Yantong',
  'Wu Shaoqing': 'Wu Shaoqing',
  '郑润奇': 'Zheng Runqi',
  '王晓慧': 'Wang Xiaohui',
  '赵曙光': 'Zhao Shuguang',
  '李德如': 'Li Deru',
  'Li Shuhao': 'Li Shuhao',

  // Điểm Mù (Korean)
  '염지호': 'Yeom Ji-ho',
  '신민아': 'Shin Min-a',
  '김남희': 'Kim Nam-hee',
  '김영아': 'Kim Young-ah',
  '이승룡': 'Lee Seung-ryong',

  // Quỷ Móc Mắt (Thai)
  'เกรียงไกร มณวิจิตร': 'Kriangkrai Monwichit',
  'ยศวรรธน์ ทะวาปี': 'Yotsawat Tawapee',
  'รัตนวดี วงศ์ทอง': 'Rattanawadee Wongthong',
}

export function normalizeInternationalName(name?: string | null): string {
  if (!name) return ''
  const trimmed = name.trim()
  return INTERNATIONAL_NAME_MAP[trimmed] || trimmed
}

/**
 * Universal clipboard copy helper.
 * Works in both secure HTTPS contexts (navigator.clipboard)
 * and non-secure HTTP contexts (e.g. http://10.40.0.47:8443) using document.execCommand fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('navigator.clipboard failed, using fallback:', err)
    }
  }

  // Fallback for non-secure HTTP
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error('Fallback copy failed:', err)
    return false
  }
}

