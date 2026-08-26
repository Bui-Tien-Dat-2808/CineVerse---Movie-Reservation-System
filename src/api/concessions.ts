import { apiClient } from './client'

export interface Concession {
  id: number
  name: string
  description: string | null
  price: number
  category: string
  size?: string | null
  image_url: string | null
  is_active: boolean
}

export interface ConcessionCreate {
  name: string
  description?: string
  price: number
  category: string
  size?: string | null
  image_url?: string
  is_active?: boolean
}

export interface GroupedConcession {
  key: string
  baseName: string
  category: string
  description?: string | null
  image_url?: string | null
  is_active: boolean
  variants: Concession[]
  minPrice: number
  maxPrice: number
  hasMultipleSizes: boolean
  primaryConcession: Concession
}

export function getBaseConcessionName(name: string): string {
  let clean = name.trim()
  // Remove trailing size markers in parentheses e.g. "(Size M)", "(M)", "(Size L)", "(L)", "(Size S)", "(S)", "(Vừa)", "(Lớn)"
  clean = clean.replace(/\s*\((size\s*)?[smlxvừa lớn]+\)\s*$/i, '')
  clean = clean.replace(/\s+size\s+[smlxvừa lớn]+\s*$/i, '')
  return clean.trim()
}

export function groupConcessions(items: Concession[]): GroupedConcession[] {
  const map = new Map<string, Concession[]>()

  for (const item of items) {
    const baseName = getBaseConcessionName(item.name)
    const key = `${item.category}::${baseName.toLowerCase()}`
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)!.push(item)
  }

  const result: GroupedConcession[] = []
  for (const [key, variants] of map.entries()) {
    // Sort variants by price ascending
    variants.sort((a, b) => Number(a.price) - Number(b.price))
    const first = variants[0]
    const prices = variants.map((v) => Number(v.price))
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const baseName = getBaseConcessionName(first.name)
    const hasMultipleSizes = variants.length > 1 || Boolean(first.size)

    // Best image_url from variants
    const bestImageUrl = variants.find((v) => Boolean(v.image_url))?.image_url || first.image_url
    const bestDescription = variants.find((v) => Boolean(v.description))?.description || first.description

    result.push({
      key,
      baseName,
      category: first.category,
      description: bestDescription,
      image_url: bestImageUrl,
      is_active: variants.some((v) => v.is_active),
      variants,
      minPrice,
      maxPrice,
      hasMultipleSizes,
      primaryConcession: first,
    })
  }

  return result
}

export async function fetchActiveConcessions(): Promise<Concession[]> {
  const res = await apiClient.get<Concession[]>('/api/v1/concessions/')
  return res.data
}

export async function fetchAllConcessions(): Promise<Concession[]> {
  const res = await apiClient.get<Concession[]>('/api/v1/concessions/all')
  return res.data
}

export async function createConcession(data: ConcessionCreate): Promise<Concession> {
  const res = await apiClient.post<Concession>('/api/v1/concessions/', data)
  return res.data
}

export async function updateConcession(id: number, data: Partial<ConcessionCreate>): Promise<Concession> {
  const res = await apiClient.put<Concession>(`/api/v1/concessions/${id}`, data)
  return res.data
}
