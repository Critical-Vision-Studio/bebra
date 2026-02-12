/**
 * Settings API client
 */
import { apiClient } from './client';

export interface UserSettings {
  user_id: number;
  tinder_enabled: boolean;
  tinder_interval_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettings {
  tinder_enabled?: boolean;
  tinder_interval_minutes?: number;
}

export interface UnwantedUser {
  id: number;
  username: string;
}

// Settings
export const getSettings = async (): Promise<UserSettings> => {
  const response = await apiClient.get('/users/me/settings');
  return response.data;
};

export const updateSettings = async (data: UpdateSettings): Promise<UserSettings> => {
  const response = await apiClient.put('/users/me/settings', data);
  return response.data;
};

// Unwanted Users
export const getUnwantedUsers = async (): Promise<UnwantedUser[]> => {
  const response = await apiClient.get('/users/me/unwanted-users');
  return response.data;
};

export const removeUnwantedUser = async (userId: number): Promise<void> => {
  await apiClient.delete(`/users/me/unwanted-users/${userId}`);
};
