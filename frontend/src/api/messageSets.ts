/**
 * Message Sets API client
 */
import { apiClient } from './client';

export interface MessageSet {
  id: number;
  creator_id: number;
  name: string;
  description?: string;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface Message {
  id: string;
  message_set_id: number;
  content_type: 'text' | 'image' | 'gif';
  storage_type: 'inline' | 'url';
  content: string;
  display_order: number;
  status: 'active' | 'inactive' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface MessageSetFilters {
  public?: boolean;
  tags?: string;
  media_type?: 'text' | 'image' | 'gif' | 'all';
  offset?: number;
  limit?: number;
}

export interface CreateMessageSet {
  name: string;
  description?: string;
  is_public: boolean;
  tags: string[];
}

export interface UpdateMessageSet {
  name?: string;
  description?: string;
  is_public?: boolean;
  tags?: string[];
}

export interface CreateMessage {
  content_type: 'text' | 'image' | 'gif';
  storage_type: 'inline' | 'url';
  content: string;
  display_order: number;
}

export interface UpdateMessage {
  content?: string;
  display_order?: number;
  status?: 'active' | 'inactive' | 'deleted';
}

// Message Sets
export const getMessageSets = async (filters?: MessageSetFilters): Promise<MessageSet[]> => {
  const params = new URLSearchParams();
  if (filters?.public !== undefined) params.append('public', String(filters.public));
  if (filters?.tags) params.append('tags', filters.tags);
  if (filters?.media_type) params.append('media_type', filters.media_type);
  if (filters?.offset !== undefined) params.append('offset', String(filters.offset));
  if (filters?.limit !== undefined) params.append('limit', String(filters.limit));

  const response = await apiClient.get(`/message-sets?${params.toString()}`);
  return response.data;
};

export const getMessageSet = async (id: number): Promise<MessageSet> => {
  const response = await apiClient.get(`/message-sets/${id}`);
  return response.data;
};

export const createMessageSet = async (data: CreateMessageSet): Promise<MessageSet> => {
  const response = await apiClient.post('/message-sets', data);
  return response.data;
};

export const updateMessageSet = async (id: number, data: UpdateMessageSet): Promise<MessageSet> => {
  const response = await apiClient.put(`/message-sets/${id}`, data);
  return response.data;
};

export const deleteMessageSet = async (id: number): Promise<void> => {
  await apiClient.delete(`/message-sets/${id}`);
};

export const copyMessageSet = async (id: number): Promise<MessageSet> => {
  const response = await apiClient.post(`/message-sets/${id}/copy`);
  return response.data;
};

export const getMyMessageSets = async (): Promise<MessageSet[]> => {
  const response = await apiClient.get('/message-sets/users/me');
  return response.data;
};

// Messages
export const getMessages = async (setId: number, includeInactive = false): Promise<Message[]> => {
  const params = includeInactive ? '?include_inactive=true' : '';
  const response = await apiClient.get(`/message-sets/${setId}/messages${params}`);
  return response.data;
};

export const createMessage = async (setId: number, data: CreateMessage): Promise<Message> => {
  const response = await apiClient.post(`/message-sets/${setId}/messages`, data);
  return response.data;
};

export const updateMessage = async (messageId: string, data: UpdateMessage): Promise<Message> => {
  const response = await apiClient.put(`/message-sets/messages/${messageId}`, data);
  return response.data;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  await apiClient.delete(`/message-sets/messages/${messageId}`);
};
