import { apiClient } from './client'

export interface VoucherItem {
  id: number
  code: string
  discount_type: 'percent' | 'fixed_amount' | string
  discount_value: number
  min_spend: number
  max_discount?: number | null
  expiry_date?: string | null
  is_first_booking_only?: boolean
  max_uses_per_user?: number
  min_loyalty_tier?: string | null
  is_active: boolean
  title?: string
  description?: string
}

export interface ApplyVoucherResponse {
  valid: boolean
  code: string
  discount_amount: number
  final_amount: number
  message: string
}

/**
 * Fetch all active public vouchers
 */
export async function fetchActiveVouchers(): Promise<VoucherItem[]> {
  const { data } = await apiClient.get<VoucherItem[]>('/api/v1/vouchers/')
  return data
}

/**
 * Apply voucher code against total amount
 */
export async function applyVoucherAPI(code: string, totalAmount: number): Promise<ApplyVoucherResponse> {
  const { data } = await apiClient.post<ApplyVoucherResponse>('/api/v1/vouchers/apply', {
    code,
    total_amount: totalAmount,
  })
  return data
}
