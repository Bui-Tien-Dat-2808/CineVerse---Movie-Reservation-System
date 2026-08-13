/**
 * Authentic CODE128-B Barcode Pattern Generator
 * Produces official Code128 bar widths for any text (e.g. CVN-BYU7I5)
 */

const PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"                              // 100-106
]

const START_B_INDEX = 104
const STOP_INDEX = 106

export interface BarcodeRect {
  x: number
  width: number
}

/**
 * Encodes input text into Code128-B black bar specifications for SVG rendering.
 * Returns array of SVG bar rectangles { x, width } and total width.
 */
export function generateCode128SvgBars(text: str, barHeight: number = 60, moduleWidth: number = 2) {
  const codeIndices: number[] = [START_B_INDEX]
  let checkSum = START_B_INDEX

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    const codeIndex = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0
    codeIndices.push(codeIndex)
    checkSum += codeIndex * (i + 1)
  }

  const checkSumIndex = checkSum % 103
  codeIndices.push(checkSumIndex)
  codeIndices.push(STOP_INDEX)

  const bars: BarcodeRect[] = []
  let currentX = 10 // Quiet zone offset

  codeIndices.forEach((patternIndex) => {
    const patternStr = PATTERNS[patternIndex] || PATTERNS[0]
    let isBar = true

    for (let charIdx = 0; charIdx < patternStr.length; charIdx++) {
      const width = parseInt(patternStr[charIdx], 10) * moduleWidth
      if (isBar) {
        bars.push({ x: currentX, width })
      }
      currentX += width
      isBar = !isBar
    }
  })

  const totalWidth = currentX + 10 // Quiet zone right padding

  return { bars, totalWidth, barHeight }
}
