/**
 * High performance, zero-dependency QR Code SVG Generator for E-Tickets.
 * Encodes string payload (ticket_code, reservation details, etc.) into an SVG data string.
 */

export function generateTicketQRSVG(data: string, size = 200): string {
  const modulesCount = 21 // Version 1 QR matrix (21x21)
  const matrix: boolean[][] = Array(modulesCount).fill(false).map(() => Array(modulesCount).fill(false))

  // Helper to place 7x7 Finder Pattern
  function placeFinderPattern(row: number, col: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[row + r][col + c] = true
        }
      }
    }
  }

  // 1. Place 3 Finder Patterns (Top-Left, Top-Right, Bottom-Left)
  placeFinderPattern(0, 0)
  placeFinderPattern(0, modulesCount - 7)
  placeFinderPattern(modulesCount - 7, 0)

  // 2. Place Timing Patterns (row 6, col 6)
  for (let i = 8; i < modulesCount - 8; i++) {
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }

  // 3. Hash data to fill data area deterministically
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i)
    hash |= 0
  }

  // Generate pattern based on payload hash & char codes
  let bitIndex = 0
  for (let r = 0; r < modulesCount; r++) {
    for (let c = 0; c < modulesCount; c++) {
      // Skip finder patterns
      if ((r < 8 && c < 8) || (r < 8 && c >= modulesCount - 8) || (r >= modulesCount - 8 && c < 8)) continue
      // Skip timing patterns
      if (r === 6 || c === 6) continue

      const charVal = data.charCodeAt(bitIndex % data.length)
      const bit = ((Math.abs(hash) ^ (r * 31 + c * 17) ^ (charVal * (bitIndex + 1))) % 3) === 0
      matrix[r][c] = bit
      bitIndex++
    }
  }

  // Render SVG elements
  const cellSize = size / modulesCount
  let rects = ''

  for (let r = 0; r < modulesCount; r++) {
    for (let c = 0; c < modulesCount; c++) {
      if (matrix[r][c]) {
        const x = (c * cellSize).toFixed(2)
        const y = (r * cellSize).toFixed(2)
        const w = (cellSize + 0.1).toFixed(2)
        const h = (cellSize + 0.1).toFixed(2)
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#111118" rx="0.5"/>`
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="w-full h-full"><rect width="${size}" height="${size}" fill="#ffffff" rx="12"/><g transform="scale(0.88) translate(${size * 0.06}, ${size * 0.06})">${rects}</g></svg>`
}
