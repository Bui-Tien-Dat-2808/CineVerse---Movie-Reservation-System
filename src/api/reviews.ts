import { apiClient } from './client'

export interface ReviewUser {
  id: number
  full_name?: string
  email: string
  avatar_url?: string
}

export interface ReviewItem {
  id: number
  movie_id: number
  user_id: number
  rating: number // 1-5 stars
  comment?: string
  is_verified_booking: boolean
  is_approved: boolean
  user?: ReviewUser
  created_at: string
  updated_at: string
}

export interface MovieReviewSummary {
  average_rating: number // e.g. 4.5
  total_reviews: number
  rating_distribution: Record<number, number>
  verified_reviews_count: number
}

export interface MovieReviewsResponse {
  items: ReviewItem[]
  total: number
  summary: MovieReviewSummary
}

export interface AdminReviewItem {
  id: number
  movie_id: number
  movie_title: string
  user_id: number
  user_name: string
  user_email: string
  rating: number
  comment?: string
  is_verified_booking: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
}

export async function fetchMovieReviewsAPI(
  movieId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<MovieReviewsResponse> {
  const { data } = await apiClient.get<MovieReviewsResponse>(
    `/api/v1/movies/${movieId}/reviews?page=${page}&page_size=${pageSize}`
  )
  return data
}

export async function fetchMyReviewAPI(movieId: number): Promise<ReviewItem | null> {
  const { data } = await apiClient.get<ReviewItem | null>(
    `/api/v1/movies/${movieId}/reviews/my-review`
  )
  return data
}

export async function submitReviewAPI(
  movieId: number,
  rating: number,
  comment?: string
): Promise<ReviewItem> {
  const { data } = await apiClient.post<ReviewItem>(
    `/api/v1/movies/${movieId}/reviews`,
    { rating, comment }
  )
  return data
}

export async function deleteMyReviewAPI(movieId: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(
    `/api/v1/movies/${movieId}/reviews/my-review`
  )
  return data
}

export async function fetchAdminReviewsAPI(params?: {
  movie_id?: number
  is_approved?: boolean
  page?: number
  page_size?: number
}): Promise<{ items: AdminReviewItem[]; total: number; page: number; page_size: number }> {
  const query = new URLSearchParams()
  if (params?.movie_id) query.append('movie_id', String(params.movie_id))
  if (params?.is_approved !== undefined) query.append('is_approved', String(params.is_approved))
  if (params?.page) query.append('page', String(params.page))
  if (params?.page_size) query.append('page_size', String(params.page_size))

  const { data } = await apiClient.get(`/api/v1/reviews/admin?${query.toString()}`)
  return data
}

export async function toggleApproveReviewAPI(
  reviewId: number,
  isApproved: boolean
): Promise<{ id: number; is_approved: boolean; message: string }> {
  const { data } = await apiClient.patch(`/api/v1/reviews/admin/${reviewId}/approve`, {
    is_approved: isApproved,
  })
  return data
}

export async function deleteAdminReviewAPI(reviewId: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/api/v1/reviews/admin/${reviewId}`)
  return data
}
