import { apiClient } from './client'
import type { UserSettings, User } from '../types'

export async function getSettings(): Promise<UserSettings> {
  const { data } = await apiClient.get<UserSettings>('/users/me/settings')
  return data
}

export async function updateSettings(payload: Partial<{ tinder_enabled: boolean; tinder_interval_minutes: number }>): Promise<UserSettings> {
  const { data } = await apiClient.put<UserSettings>('/users/me/settings', payload)
  return data
}

export async function getUnwantedUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users/me/unwanted-users')
  return data
}

export async function removeUnwantedUser(userId: number): Promise<void> {
  await apiClient.delete(`/users/me/unwanted-users/${userId}`)
}
