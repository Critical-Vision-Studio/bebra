import { apiClient, toQueryString } from './client'
import type { Interaction, FriendshipRequest, User } from '../types'

// Get users by filter or all users
export async function getUsers(filter?: string): Promise<User[]> {
  const params = filter ? { q: filter } : {}
  const { data } = await apiClient.get<User[]>(`/users`, { params })
  return data
}

// TODO: post users (register) or keep auth.register and auth.login?

// Get all friends of the current user
export async function getFriends(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>(`/users/me/friends`)
  return data
}

// Get all blocked users of the current user
export async function getBlockedUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>(`/users/me/blocked-users`)
  return data
}


// Get all friend requests of the current user
export async function getFriendRequests(): Promise<FriendshipRequest[]> {
  const { data } = await apiClient.get<FriendshipRequest[]>(`/users/me/friend-requests`)
  return data
}

// Send friend request
export async function sendFriendRequest(userId: number): Promise<FriendshipRequest> {
  const { data } = await apiClient.post<FriendshipRequest>(`/users/me/friend-requests`, { receiver_id: userId })
  return data
}

// Accept friend request
export async function acceptFriendRequest(requestId: number): Promise<FriendshipRequest> {
  const { data } = await apiClient.post<FriendshipRequest>(`/users/me/friend-requests/${requestId}/accept`)
  return data
}

// Reject friend request
export async function rejectFriendRequest(requestId: number): Promise<FriendshipRequest> {
  const { data } = await apiClient.post<FriendshipRequest>(`/users/me/friend-requests/${requestId}/reject`)
  return data
}

// Send a notification to a user
export async function sendNotification(userId: number, message: string): Promise<void> {
  await apiClient.post(`/users/${userId}/notify`, { message })
}


// BOTHER

// Get all interactions of the current user with a specific friend
export async function getInteractions(friendId: number): Promise<Interaction[]> {
  const { data } = await apiClient.get<Interaction[]>(`/users/me/friends/${friendId}/interactions`)
  return data
}

export async function createInteraction(instance: Interaction): Promise<Interaction> {
  const payload = {
    other_user_id: instance.other_user_id,
    direction: instance.direction,
    template_id: instance.options.id
  }
  const { data } = await apiClient.post<Interaction>(`/users/me/interactions`, payload)
  return data
}

export async function updateInteraction(instance: Interaction): Promise<Interaction> {
  const payload = {
    other_user_id: instance.other_user_id,
    direction: instance.direction,
    template_id: instance.options.id
  }
  const { data } = await apiClient.put<Interaction>(`/users/me/interactions/${instance.id}`, payload)
  return data
}

export async function deleteInteraction(id: number): Promise<void> {
  await apiClient.delete(`/users/me/interactions/${id}`)
}


// template code for later

export interface ListToSerialize {
  mylist?: string[]
}

export interface MyListResponse {
  mylist?: string[]
}

export async function getMyList(filter: ListToSerialize): Promise<MyListResponse[]> {
  const { data } = await apiClient.get<MyListResponse[]>(
    '/users/me/mylist',
    {
      params: filter,
      paramsSerializer: (params) => toQueryString(params as Record<string, unknown>),
    }
  )
  return data
}
