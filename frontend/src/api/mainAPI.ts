import { apiClient } from './client'
import type { User, FriendUser, FriendshipRequest } from '../types'

// Users
export async function getUsers(filter?: string): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users', { params: filter ? { q: filter } : {} })
  return data
}

export async function getFriends(): Promise<FriendUser[]> {
  const { data } = await apiClient.get<FriendUser[]>('/users/me/friends')
  return data
}

// Friend requests
export async function getFriendRequests(): Promise<FriendshipRequest[]> {
  const { data } = await apiClient.get<FriendshipRequest[]>('/users/me/friend-requests')
  return data
}

export async function sendFriendRequest(
  receiverId: number,
  requestType: 'normal' | 'tinder' = 'normal',
  attachedMessageId?: string
): Promise<FriendshipRequest> {
  const { data } = await apiClient.post<FriendshipRequest>('/users/me/friend-requests', {
    receiver_id: receiverId,
    request_type: requestType,
    attached_message_id: attachedMessageId ?? null,
  })
  return data
}

export async function acceptFriendRequest(requestId: number): Promise<FriendshipRequest> {
  const { data } = await apiClient.post<FriendshipRequest>(`/users/me/friend-requests/${requestId}/accept`)
  return data
}

export async function rejectFriendRequest(requestId: number): Promise<FriendshipRequest> {
  const { data } = await apiClient.post<FriendshipRequest>(`/users/me/friend-requests/${requestId}/reject`)
  return data
}
