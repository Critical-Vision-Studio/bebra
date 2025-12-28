
export interface User {
  id: number
  username: string
}


// FRIENDS AND ENEMIES
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'

export interface FriendshipRequest {
  id: number
  sender_id: number
  receiver_id: number
  status: FriendshipStatus
  created_at: string
  updated_at: string
}

export type RelationshipStatus = 'friend' | 'blocked'

export interface Relationship {
  id: number
  user_1_id: number
  user_2_id: number
  status: RelationshipStatus
  created_at: string
  updated_at: string
}

// BOTHER

export type BotherDirection = 'one_way' | 'two_way'

export interface InteractionTemplate {
  id: number
  description: string
  options: string[]
  created_at: string
  updated_at: string
}

export interface Interaction {
  id: number
  main_user_id: number
  other_user_id: number
  direction: BotherDirection
  options: InteractionTemplate
  created_at: string
  updated_at: string
}


