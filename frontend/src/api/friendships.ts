import { apiClient } from './client'
import type { FriendshipMessageSet, ConversationMessage, MessageSet } from '../types'

// Friendship used sets (derived from conversation history)
export async function getFriendshipUsedSets(friendshipId: number): Promise<MessageSet[]> {
  const { data } = await apiClient.get<MessageSet[]>(`/friendships/${friendshipId}/used-sets`)
  return data
}

// Friendship message sets (legacy assigned sets)
export async function getFriendshipMessageSets(friendshipId: number): Promise<FriendshipMessageSet[]> {
  const { data } = await apiClient.get<FriendshipMessageSet[]>(`/friendships/${friendshipId}/message-sets`)
  return data
}

export async function addFriendshipMessageSet(
  friendshipId: number,
  messageSetId: number
): Promise<FriendshipMessageSet> {
  const { data } = await apiClient.post<FriendshipMessageSet>(`/friendships/${friendshipId}/message-sets`, {
    message_set_id: messageSetId,
  })
  return data
}

export async function removeFriendshipMessageSet(
  friendshipId: number,
  fmsId: number
): Promise<void> {
  await apiClient.delete(`/friendships/${friendshipId}/message-sets/${fmsId}`)
}

export async function assignFriendshipMessageSets(
  friendshipId: number,
  assignments: { message_set_id: number; position: number }[]
): Promise<FriendshipMessageSet[]> {
  const { data } = await apiClient.put<FriendshipMessageSet[]>(`/friendships/${friendshipId}/message-sets`, assignments)
  return data
}

// Conversation history
export async function getConversationHistory(friendshipId: number, offset = 0, limit = 100): Promise<ConversationMessage[]> {
  const { data } = await apiClient.get<ConversationMessage[]>(`/friendships/${friendshipId}/messages`, {
    params: { offset, limit },
  })
  return data
}

export async function sendMessage(friendshipId: number, messageId: string): Promise<ConversationMessage> {
  const { data } = await apiClient.post<ConversationMessage>(`/friendships/${friendshipId}/messages`, { message_id: messageId })
  return data
}

export async function markAsRead(friendshipId: number): Promise<void> {
  await apiClient.put(`/friendships/${friendshipId}/read`)
}

export async function getUnreadStatus(friendshipId: number): Promise<{ has_unread: boolean; last_read_at?: string }> {
  const { data } = await apiClient.get(`/friendships/${friendshipId}/unread`)
  return data
}

export async function getAllUnread(): Promise<number[]> {
  const { data } = await apiClient.get<number[]>('/friendships/unread/all')
  return data
}
