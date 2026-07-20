export type ProfileEventType = "SIMPLEEVENT" | "REFERENDUM" | "MULTI_POLL";
export type ProfileEventFilter = "all" | ProfileEventType;

/** Mirrors `EventSimpleViewDTO` — GET /api/v1/users/{username}/events. Lean, read-only summary (no vote/edit affordances here). */
export interface ProfileEventItem {
  id: number;
  eventType: ProfileEventType;
  title: string;
  description: string;
  location: string;
  viewCounter: number;
  createdAt: string;
  images: string[];
  totalVotes: number;
}

/** Subset of `PublicationResponseDTO` (GET /api/v1/publications?userIds=) actually rendered by the profile tab. */
export interface ProfilePublicationItem {
  id: number;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  createdAt: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
}

export interface ProfilePublicationsPage {
  content: ProfilePublicationItem[];
  hasNext: boolean;
}

/** Subset of `SignalResponseDTO` (GET /api/v1/users/{username}/signals) actually rendered by the profile tab. */
export interface ProfileSignalItem {
  id: number;
  title: string;
  categoryLabel: string;
  imageUrl: string | null;
  isActive: boolean;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export type ProfileRole = "ADMIN" | "USER";

/** Mirrors `PublicProfileDTO` — GET/PUT /api/v1/users/{username}|me. */
export interface PublicProfile {
  id: number;
  username: string;
  realName: string | null;
  imageUrl: string | null;
  bio: string | null;
  location: string | null;
  locationLabel: string | null;
  role: ProfileRole;
  created: string;
  lastOnline: string | null;
  online: boolean;
  eventsCount: number;
  publicationsCount: number;
  signalsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  reputationScore: number;
  reputationBadge: string;
}

/** Mirrors `FollowUserSummaryDTO` — one row of the followers/following tab. */
export interface ConnectionUser {
  id: number;
  username: string;
  imageUrl: string | null;
  role: ProfileRole;
  online: boolean;
  joined: string;
  followedAt: string;
  followersCount: number;
  isFollowing: boolean;
}

/** Mirrors `FollowListResponse`. */
export interface ConnectionsListResponse {
  items: ConnectionUser[];
  page: number;
  size: number;
  hasNext: boolean;
}

export type ConnectionsKind = "followers" | "following";

export interface UpdateProfilePayload {
  bio: string;
  location: string;
  avatar?: File;
}

export type ProfileTab = "overview" | "events" | "publications" | "signals" | "connections";
