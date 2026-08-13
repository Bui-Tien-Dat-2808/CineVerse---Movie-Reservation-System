import { apiClient } from './client'

export interface LoyaltyTransaction {
  id: number
  points: number
  reason?: string
  reservation_id?: number
  created_at?: string
}

export interface LoyaltyStatus {
  points: number
  tier: string
  tier_label: string
  tier_color: string
  tier_icon: string
  points_to_next_tier: number
  transactions: LoyaltyTransaction[]
}

export async function fetchMyLoyalty(startDate?: string, endDate?: string): Promise<LoyaltyStatus> {
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)

  const url = `/api/v1/loyalty/me${params.toString() ? `?${params.toString()}` : ''}`
  const { data } = await apiClient.get<LoyaltyStatus>(url)
  return data
}

export async function fetchLoyaltyUsers(): Promise<any[]> {
  const { data } = await apiClient.get<any[]>('/api/v1/loyalty/users')
  return data
}

export async function fetchUserLoyaltyDetail(userId: number, startDate?: string, endDate?: string): Promise<LoyaltyStatus> {
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)

  const url = `/api/v1/loyalty/users/${userId}${params.toString() ? `?${params.toString()}` : ''}`
  const { data } = await apiClient.get<LoyaltyStatus>(url)
  return data
}

export async function adjustUserPoints(payload: { user_id: number; points: number; reason: string }) {
  const { data } = await apiClient.post('/api/v1/loyalty/adjust', payload)
  return data
}
