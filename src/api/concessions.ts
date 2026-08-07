import { apiClient } from './client'

export interface Concession {
  id: number
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  is_active: boolean
}

export interface ConcessionCreate {
  name: string
  description?: string
  price: number
  category: string
  image_url?: string
  is_active?: boolean
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
