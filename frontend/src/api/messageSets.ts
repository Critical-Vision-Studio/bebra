import { apiClient } from './client'
import type { MessageSet, Message } from '../types'

export interface MessageSetFilters {
  public?: boolean
  tags?: string
  media_type?: 'text' | 'image' | 'gif' | 'all'
  offset?: number
  limit?: number
}

// Message Sets
export async function getMessageSets(filters?: MessageSetFilters): Promise<MessageSet[]> {
  const { data } = await apiClient.get<MessageSet[]>('/message-sets', { params: filters })
  return data
}

export async function getMessageSet(id: number): Promise<MessageSet> {
  const { data } = await apiClient.get<MessageSet>(`/message-sets/${id}`)
  return data
}

export async function createMessageSet(payload: { name: string; description?: string; is_public: boolean; tags: string[] }): Promise<MessageSet> {
  const { data } = await apiClient.post<MessageSet>('/message-sets', payload)
  return data
}

export async function updateMessageSet(id: number, payload: Partial<{ name: string; description: string; is_public: boolean; tags: string[] }>): Promise<MessageSet> {
  const { data } = await apiClient.put<MessageSet>(`/message-sets/${id}`, payload)
  return data
}

export async function deleteMessageSet(id: number): Promise<void> {
  await apiClient.delete(`/message-sets/${id}`)
}

export async function copyMessageSet(id: number): Promise<MessageSet> {
  const { data } = await apiClient.post<MessageSet>(`/message-sets/${id}/copy`)
  return data
}

export async function getMyMessageSets(): Promise<MessageSet[]> {
  const { data } = await apiClient.get<MessageSet[]>('/message-sets/users/me')
  return data
}

// Messages within a set
export async function getMessages(setId: number, includeInactive = false): Promise<Message[]> {
  const { data } = await apiClient.get<Message[]>(`/message-sets/${setId}/messages`, {
    params: includeInactive ? { include_inactive: true } : undefined,
  })
  return data
}

export async function createMessage(setId: number, payload: { content_type: string; storage_type: string; content: string; display_order: number }): Promise<Message> {
  const { data } = await apiClient.post<Message>(`/message-sets/${setId}/messages`, payload)
  return data
}

export async function updateMessage(messageId: string, payload: Partial<{ content: string; display_order: number; status: string }>): Promise<Message> {
  const { data } = await apiClient.put<Message>(`/message-sets/messages/${messageId}`, payload)
  return data
}

export async function deleteMessage(messageId: string): Promise<void> {
  await apiClient.delete(`/message-sets/messages/${messageId}`)
}
