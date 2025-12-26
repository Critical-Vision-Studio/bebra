import MockAdapter from 'axios-mock-adapter'
import { apiClient } from './client'
import type { User, FriendshipRequest, Interaction } from '../types'

export const mock = new MockAdapter(apiClient, { delayResponse: 300 })

// Mock data store
let currentUserId = 1
const mockUsers: User[] = [
  { id: 1, username: 'testuser' },
  { id: 2, username: 'alice' },
  { id: 3, username: 'bob' },
  { id: 4, username: 'charlie' },
  { id: 5, username: 'diana' },
  { id: 6, username: 'eve' },
]

let mockFriendRequests: FriendshipRequest[] = [
  { id: 1, sender_id: 2, receiver_id: 1, status: 'pending', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, sender_id: 3, receiver_id: 1, status: 'pending', created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' },
  { id: 3, sender_id: 1, receiver_id: 4, status: 'pending', created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-03T00:00:00Z' },
]

let mockFriends: number[] = [5, 6] // user IDs that are friends with current user

const mockInteractions: Interaction[] = [
  {
    id: 1,
    main_user_id: 1,
    other_user_id: 5,
    direction: 'two_way',
    options: {
      id: 1,
      description: 'Coffee meetup',
      options: ['Morning coffee', 'Afternoon tea', 'Evening drinks'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    main_user_id: 1,
    other_user_id: 6,
    direction: 'one_way',
    options: {
      id: 2,
      description: 'Gaming session',
      options: ['Valorant', 'CS2', 'League of Legends'],
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
]

// Auth endpoints
mock.onPost('/auth/register').reply((config) => {
  const data = JSON.parse(config.data)
  const newUser: User = {
    id: mockUsers.length + 1,
    username: data.username
  }
  mockUsers.push(newUser)
  currentUserId = newUser.id
  return [200, newUser]
})

mock.onPost('/auth/token').reply(() => {
  // FormData is sent, just return success
  return [200, {
    access_token: 'fake_token_' + Date.now(),
    token_type: 'bearer'
  }]
})

mock.onPost('/auth/logout').reply(200, {})

mock.onGet('/auth/me').reply(200, mockUsers.find(u => u.id === currentUserId) || mockUsers[0])

// User search
mock.onGet(/\/users\?/).reply((config) => {
  const params = new URLSearchParams(config.url?.split('?')[1])
  const query = params.get('q')?.toLowerCase()
  
  if (!query) {
    return [200, mockUsers.filter(u => u.id !== currentUserId)]
  }
  
  const results = mockUsers.filter(u => 
    u.id !== currentUserId && u.username.toLowerCase().includes(query)
  )
  return [200, results]
})

mock.onGet('/users').reply(200, mockUsers.filter(u => u.id !== currentUserId))

// Friends
mock.onGet('/users/me/friends').reply(() => {
  const friends = mockUsers.filter(u => mockFriends.includes(u.id))
  return [200, friends]
})

// Friend requests
mock.onGet('/users/me/friend-requests').reply(200, mockFriendRequests)

mock.onPost('/users/me/friend-requests').reply((config) => {
  const data = JSON.parse(config.data)
  const newRequest: FriendshipRequest = {
    id: mockFriendRequests.length + 1,
    sender_id: currentUserId,
    receiver_id: data.receiver_id,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  mockFriendRequests.push(newRequest)
  return [200, newRequest]
})

mock.onPost(/\/users\/me\/friend-requests\/\d+\/accept/).reply((config) => {
  const requestId = parseInt(config.url?.match(/\/friend-requests\/(\d+)\//)?.[1] || '0')
  const request = mockFriendRequests.find(r => r.id === requestId)
  
  if (request) {
    request.status = 'accepted'
    request.updated_at = new Date().toISOString()
    
    // Add to friends list
    if (request.receiver_id === currentUserId) {
      mockFriends.push(request.sender_id)
    } else {
      mockFriends.push(request.receiver_id)
    }
  }
  
  return [200, request]
})

mock.onPost(/\/users\/me\/friend-requests\/\d+\/reject/).reply((config) => {
  const requestId = parseInt(config.url?.match(/\/friend-requests\/(\d+)\//)?.[1] || '0')
  const request = mockFriendRequests.find(r => r.id === requestId)
  
  if (request) {
    request.status = 'rejected'
    request.updated_at = new Date().toISOString()
  }
  
  return [200, request]
})

// Blocked users
mock.onGet('/users/me/blocked-users').reply(200, [])

// Interactions
mock.onGet(/\/users\/me\/friends\/\d+\/interactions/).reply((config) => {
  const friendId = parseInt(config.url?.match(/\/friends\/(\d+)\//)?.[1] || '0')
  const filtered = mockInteractions.filter(
    i => i.main_user_id === friendId || i.other_user_id === friendId
  )
  return [200, filtered]
})

mock.onPost('/users/me/interactions').reply((config) => {
  const data = JSON.parse(config.data)
  const newInteraction: Interaction = {
    ...data,
    id: mockInteractions.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  mockInteractions.push(newInteraction)
  return [200, newInteraction]
})

mock.onPut(/\/users\/me\/interactions\/\d+/).reply((config) => {
  const id = parseInt(config.url?.match(/\/interactions\/(\d+)/)?.[1] || '0')
  const data = JSON.parse(config.data)
  const index = mockInteractions.findIndex(b => b.id === id)
  
  if (index !== -1) {
    mockInteractions[index] = {
      ...data,
      id,
      updated_at: new Date().toISOString()
    }
    return [200, mockInteractions[index]]
  }
  
  return [404, { error: 'Not found' }]
})

mock.onDelete(/\/users\/me\/interactions\/\d+/).reply((config) => {
  const id = parseInt(config.url?.match(/\/interactions\/(\d+)/)?.[1] || '0')
  const index = mockInteractions.findIndex(b => b.id === id)
  
  if (index !== -1) {
    mockInteractions.splice(index, 1)
    return [204]
  }
  
  return [404, { error: 'Not found' }]
})

// Notifications
mock.onPost(/\/users\/\d+\/notify/).reply(200, {})

console.log('🎭 Mock API client enabled')
