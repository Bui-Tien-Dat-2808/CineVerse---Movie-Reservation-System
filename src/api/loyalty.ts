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

export async function fetchMyLoyalty(): Promise<LoyaltyStatus> {
  const { data } = await apiClient.get<LoyaltyStatus>('/api/v1/loyalty/me')
  return data
}

export async function fetchLoyaltyUsers(): Promise<any[]> {
  const { data } = await apiClient.get<any[]>('/api/v1/loyalty/users')
  return data
}

export async function adjustUserPoints(payload: { user_id: number; points: number; reason: string }) {
  const { data } = await apiClient.post('/api/v1/loyalty/adjust', payload)
  return data
}
