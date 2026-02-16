import { apiClient } from './client'
import type { TinderMatch } from '../types'

export async function getTinderMatch(): Promise<TinderMatch> {
  const { data } = await apiClient.get<TinderMatch>('/tinder-bother/match')
  return data
}
