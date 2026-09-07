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
  // Conan Movie & Creators
  '蓮井隆弘': 'Takahiro Hasui',
  '高山みなみ': 'Minami Takayama',
  '山崎和佳奈': 'Wakana Yamazaki',
  '小山力也': 'Rikiya Koyama',
  '林原めぐみ': 'Megumi Hayashibara',
  '沢城みゆき': 'Miyuki Sawashiro',
  '三木眞一郎': 'Shin-ichiro Miki',
  '神奈延年': 'Nobutoshi Canna',
  '横浜流星': 'Ryusei Yokohama',
  'Yokohama Ryusei': 'Ryusei Yokohama',
  '青山剛昌': 'Gosho Aoyama',
  '池田秀一': 'Shuichi Ikeda',
  '古谷徹': 'Toru Furuya',
  '草尾毅': 'Takeshi Kusao',
  '山口勝平': 'Kappei Yamaguchi',
  '堀川りょう': 'Ryo Horikawa',
  '緒方賢一': 'Kenichi Ogata',
  '岩居由希子': 'Yukiko Iwai',
  '高木渉': 'Wataru Takagi',
  '大谷育江': 'Ikue Otani',
  '松井菜桜子': 'Naoko Matsui',

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
  'ナガノ': 'Nagano',

  // AGITO & Tokusatsu
  '田崎竜太': 'Ryuta Tasaki',
  '要潤': 'Jun Kaname',
  'Kaname Jun': 'Jun Kaname',
  '古川優奈': 'Yuna Kogawa',
  '賀集利樹': 'Toshiki Kashu',
  '菊池隆則': 'Takanori Higuchi',
  '岩永洋昭': 'Hiroaki Iwanaga',
  '鈴之助': 'Suzunosuke Tanaka',
  '青島心': 'Kokoro Aoshima',
  '金田哲': 'Satoshi Kanada',
  '石ノ森章太郎': 'Shotaro Ishinomori',

  // Anime Directors
  '新海誠': 'Makoto Shinkai',
  '宮崎駿': 'Hayao Miyazaki',
  '庵野秀明': 'Hideaki Anno',
  '細田守': 'Mamoru Hosoda',
  '湯浅政明': 'Masaaki Yuasa',
  '今敏': 'Satoshi Kon',
  '押井守': 'Mamoru Oshii',

  // Thư Tình Gửi Ngoại (Chinese)
  '藍鴻春': 'Lan Hongchun',
  '王彦桐': 'Wang Yantong',
  'Wu Shaoqing': 'Wu Shaoqing',
  '郑润奇': 'Zheng Runqi',
  '王晓慧': 'Wang Xiaohui',
  '赵曙光': 'Zhao Shuguang',
  '李德如': 'Li Deru',
  'Li Shuhao': 'Li Shuhao',
  '李思桐': 'Li Sitong',
  '梁朝伟': 'Tony Leung',
  '刘德华': 'Andy Lau',
  '周星驰': 'Stephen Chow',
  '张艺谋': 'Zhang Yimou',
  '贾樟柯': 'Jia Zhangke',

  // Điểm Mù & Korean Cinema
  '염지호': 'Yeom Ji-ho',
  '신민아': 'Shin Min-a',
  '김남희': 'Kim Nam-hee',
  '김영아': 'Kim Young-ah',
  '이승룡': 'Lee Seung-ryong',
  '봉준호': 'Bong Joon-ho',
  '박찬욱': 'Park Chan-wook',
  '송강호': 'Song Kang-ho',
  '이정재': 'Lee Jung-jae',
  '마동석': 'Ma Dong-seok',

  // Quỷ Móc Mắt & Thai Cinema
  'เกรียงไกร มณวิจิตร': 'Kriangkrai Monwichit',
  'ยศวรรธน์ ทะวาปี': 'Yotsawat Tawapee',
  'รัตนวดี วงศ์ทอง': 'Rattanawadee Wongthong',
}

/**
 * Character role translations for Asian language characters
 */
export const CHARACTER_NAME_MAP: Record<string, string> = {
  '江戸川コナン': 'Conan Edogawa',
  '毛利蘭': 'Ran Mouri',
  '毛利小五郎': 'Kogoro Mouri',
  '灰原哀': 'Ai Haibara',
  '阿笠博士': 'Hiroshi Agasa',
  '吉田歩美': 'Ayumi Yoshida',
  '円谷光彦': 'Mitsuhiko Tsuburaya',
  '小嶋元太': 'Genta Kojima',
  '服部平次': 'Heiji Hattori',
  '遠山和葉': 'Kazuha Toyama',
  '怪盗キッド': 'Kaito Kid',
  '赤井秀一': 'Shuichi Akai',
  '安室透': 'Toru Amuro',
  '降谷零': 'Rei Furuya',
  '萩原千速': 'Chihaya Hagiwara',
  '萩原研二': 'Kenji Hagiwara',
  '松田陣平': 'Jinpei Matsuda',
  '大前和明': 'Kazuaki Omae',
  'ちいかわ': 'Chiikawa',
  'ハチワレ': 'Hachiware',
  'うさぎ': 'Usagi',
}

export function containsAsianScript(text?: string | null): boolean {
  if (!text) return false
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/.test(text)
}

export function normalizeInternationalName(name?: string | null): string {
  if (!name) return ''
  let trimmed = name.trim()
  if (INTERNATIONAL_NAME_MAP[trimmed]) {
    return INTERNATIONAL_NAME_MAP[trimmed]
  }

  // Handle name with suffix like "(voice)" or role
  for (const [cjk, roman] of Object.entries(INTERNATIONAL_NAME_MAP)) {
    if (trimmed.includes(cjk)) {
      trimmed = trimmed.replace(new RegExp(cjk, 'g'), roman)
    }
  }

  // Handle character map
  for (const [cjk, roman] of Object.entries(CHARACTER_NAME_MAP)) {
    if (trimmed.includes(cjk)) {
      trimmed = trimmed.replace(new RegExp(cjk, 'g'), roman)
    }
  }

  return trimmed
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

