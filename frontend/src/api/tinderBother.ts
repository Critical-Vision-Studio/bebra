/**
 * Tinder-Bother API client
 */
import { apiClient } from './client';
import { MessageSet } from './messageSets';

export interface TinderMatch {
  user: {
    id: number;
    username: string;
  };
  top_message_sets: MessageSet[];
  expires_at?: string;
}

export const getTinderMatch = async (): Promise<TinderMatch> => {
  const response = await apiClient.get('/tinder-bother/match');
  return response.data;
};
