/**
 * Friendships API client
 */
import { apiClient } from './client';
import { MessageSet, Message } from './messageSets';

export interface FriendshipMessageSet {
  id: number;
  friendship_id: number;
  message_set_id: number;
  position: number;
  created_at: string;
  message_set?: MessageSet;
}

export interface MessageSetAssignment {
  message_set_id: number;
  position: number;
}

export interface ConversationMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  friendship_id: number;
  message_id: string;
  message_set_id: number;
  sent_at: string;
  message?: Message;
  message_set?: MessageSet;
}

export interface SendMessage {
  message_id: string;
}

// Friendship Message Sets
export const getFriendshipMessageSets = async (friendshipId: number): Promise<FriendshipMessageSet[]> => {
  const response = await apiClient.get(`/friendships/${friendshipId}/message-sets`);
  return response.data;
};

export const assignFriendshipMessageSets = async (
  friendshipId: number,
  assignments: MessageSetAssignment[]
): Promise<FriendshipMessageSet[]> => {
  const response = await apiClient.put(`/friendships/${friendshipId}/message-sets`, assignments);
  return response.data;
};

// Conversation History
export const getConversationHistory = async (
  friendshipId: number,
  offset = 0,
  limit = 100
): Promise<ConversationMessage[]> => {
  const response = await apiClient.get(
    `/friendships/${friendshipId}/messages?offset=${offset}&limit=${limit}`
  );
  return response.data;
};

export const sendMessage = async (
  friendshipId: number,
  data: SendMessage
): Promise<ConversationMessage> => {
  const response = await apiClient.post(`/friendships/${friendshipId}/messages`, data);
  return response.data;
};

export const markAsRead = async (friendshipId: number): Promise<void> => {
  await apiClient.put(`/friendships/${friendshipId}/read`);
};

export const getUnreadStatus = async (friendshipId: number): Promise<{ has_unread: boolean; last_read_at?: string }> => {
  const response = await apiClient.get(`/friendships/${friendshipId}/unread`);
  return response.data;
};
