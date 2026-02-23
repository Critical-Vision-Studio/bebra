import { apiClient } from './client'
import type { ShaderScene, User } from '../types'

export async function getShaderScenes(): Promise<ShaderScene[]> {
  const { data } = await apiClient.get<ShaderScene[]>('/shader-scenes')
  return data
}

export async function updateAvatar(params: {
  avatar_url?: string | null
  shader_scene_id?: number | null
}): Promise<User> {
  const { data } = await apiClient.put<User>('/users/me/avatar', params)
  return data
}
