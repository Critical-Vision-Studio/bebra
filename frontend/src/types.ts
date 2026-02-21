// === Users ===

export interface User {
  id: number
  username: string
  rejected_you?: boolean
  avatar_url?: string | null
  shader_scene_id?: number | null
}

export interface FriendUser extends User {
  friendship_id: number
  shader_fragment?: string | null
}

// === Shader Scenes ===

export interface ShaderScene {
  id: number
  name: string
  fragment_shader: string
  created_at: string
}

// === Relationships ===

export type RelationshipStatus = 'friend' | 'blocked' | 'rejected'

export interface Relationship {
  id: number
  user_1_id: number
  user_2_id: number
  status: RelationshipStatus
  created_at: string
  updated_at: string
}

// === Friend Requests ===

export type FriendshipRequestStatus = 'pending' | 'accepted' | 'rejected'
export type FriendshipRequestType = 'normal' | 'tinder'

export interface FriendshipRequest {
  id: number
  sender_id: number
  receiver_id: number
  sender_username?: string
  receiver_username?: string
  status: FriendshipRequestStatus
  request_type: FriendshipRequestType
  attached_message_id: string | null
  created_at: string
  updated_at: string
}

// === Message Sets ===

export interface MessageSet {
  id: number
  creator_id: number
  name: string
  description: string | null
  is_public: boolean
  tags: string[]
  created_at: string
  updated_at: string
  message_count?: number
}

// === Messages ===

export type MessageContentType = 'text' | 'image' | 'gif'
export type MessageStorageType = 'inline' | 'url'
export type MessageStatus = 'active' | 'inactive' | 'deleted'

export interface Message {
  id: string // UUID
  message_set_id: number
  content_type: MessageContentType
  storage_type: MessageStorageType
  content: string
  display_order: number
  status: MessageStatus
  created_at: string
  updated_at: string
}

// === Friendship Message Sets ===

export interface FriendshipMessageSet {
  id: number
  friendship_id: number
  message_set_id: number
  position: number
  created_at: string
  message_set?: MessageSet
}

// === Conversation ===

export interface ConversationMessage {
  id: number
  sender_id: number
  receiver_id: number
  friendship_id: number
  message_id: string
  message_set_id: number
  sent_at: string
  message?: Message
  message_set?: MessageSet
}

// === Settings ===

export interface UserSettings {
  user_id: number
  tinder_enabled: boolean
  tinder_interval_minutes: number
  created_at: string
  updated_at: string
}

// === Tinder ===

export interface TinderMatch {
  user: User
  top_message_sets: MessageSet[]
  expires_at: string | null
}