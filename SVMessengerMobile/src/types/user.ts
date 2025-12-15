/**
 * User Types
 */

export interface UserMinimal {
  id: number;
  username: string;
  fullName: string;
  imageUrl?: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface UserSearchResult {
  id: number;
  username: string;
  fullName: string;
  imageUrl?: string;
  isOnline: boolean;
}

export interface UserSearchRequest {
  query: string;
  page?: number;
  size?: number;
}

