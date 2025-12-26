import { apiClient } from './client'
import type { User } from '../types'

export interface RegisterPayload {
  username: string
  password: string
}

export interface LoginResult {
  access_token: string
  token_type: string
}

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const { data } = await apiClient.post<User>('/auth/register', payload)
  return data
}

export async function loginUser(username: string, password: string): Promise<LoginResult> {
  // Match Bruno tests: send multipart form fields
  const body = new FormData()
  body.append('username', username)
  body.append('password', password)
  
  const { data } = await apiClient.post<LoginResult>('/auth/token', body)
  return data
}

export async function logoutUser(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me')
  return data
}


