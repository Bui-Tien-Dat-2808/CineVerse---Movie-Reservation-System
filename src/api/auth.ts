import { apiClient } from './client'
import type { AuthUser } from '../types'

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  phone_number?: string
  date_of_birth?: string
  gender?: string
  region?: string
  captcha_id?: string
  captcha_answer?: string
}

export interface UpdateProfileRequest {
  full_name?: string
  email?: string
  phone_number?: string
  date_of_birth?: string
  gender?: string
  region?: string
}

/** POST /api/v1/auth/login — accepts email or phone_number */
export async function loginAPI(account: string, password: string, captcha_id?: string, captcha_answer?: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/v1/auth/login', {
    account,
    password,
    captcha_id,
    captcha_answer,
  })
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
  return data
}

/** POST /api/v1/auth/register */
export async function registerAPI(req: RegisterRequest): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>('/api/v1/auth/register', req)
  return data
}

/** GET /api/v1/users/me */
export async function fetchMeAPI(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/api/v1/users/me')
  return data
}

/** PUT /api/v1/users/me */
export async function updateProfileAPI(req: UpdateProfileRequest): Promise<AuthUser> {
  const { data } = await apiClient.put<AuthUser>('/api/v1/users/me', req)
  return data
}

/** Logout - revokes refresh_token on server and clears localStorage */
export async function logoutAPI() {
  const refreshToken = localStorage.getItem('refresh_token')
  if (refreshToken) {
    try {
      await apiClient.post('/api/v1/auth/logout', { refresh_token: refreshToken })
    } catch {
      // Best-effort logout server call
    }
  }
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

/** POST /api/v1/auth/forgot-password */
export async function forgotPasswordAPI(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/api/v1/auth/forgot-password', { email })
  return data
}

/** POST /api/v1/auth/reset-password */
export async function resetPasswordAPI(token: string, new_password: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/api/v1/auth/reset-password', { token, new_password })
  return data
}

/** POST /api/v1/auth/change-password */
export async function changePasswordAPI(old_password: string, new_password: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/api/v1/auth/change-password', { old_password, new_password })
  return data
}
