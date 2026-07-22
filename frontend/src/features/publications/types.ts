/** Backend `CategoryEnum` values (verbatim — sent/received as-is). */
export type PublicationCategory = "NEWS" | "INFRASTRUCTURE" | "MUNICIPAL" | "INITIATIVES" | "CULTURE" | "OTHER";
export type PublicationStatus = "PUBLISHED" | "EDITED" | "PENDING";

export type PublicationSortOption = "date-desc" | "date-asc" | "likes" | "dislikes" | "views" | "comments";
export type PublicationTimeFilter = "today" | "week" | "month" | "year";

/** Mirrors `PublicationResponseDTO` — used for both feed cards and (later) the detail modal. */
export interface Publication {
  id: number;
  title: string;
  content: string;
  excerpt: string | null;
  category: PublicationCategory;
  status: PublicationStatus;
  imageUrl: string | null;
  emotion: string | null;
  emotionText: string | null;
  readingTime: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  viewsCount: number;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  sharesCount: number;
  authorId: number | null;
  authorUsername: string | null;
  authorImageUrl: string | null;
  authorOnlineStatus: number | null;
  authorLastOnline: string | null;
  isLiked: boolean;
  isDisliked: boolean;
  isBookmarked: boolean;
  isOwner: boolean;
  linkUrl: string | null;
  linkMetadata: string | null;
}

export interface PublicationsPageResponse {
  content: Publication[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Query params accepted by GET /api/v1/publications — mirrors `PublicationsController`'s `/api` endpoint. */
export interface PublicationsListParams {
  search?: string;
  category?: PublicationCategory;
  time?: PublicationTimeFilter;
  sort?: PublicationSortOption;
  author?: "me";
  userIds?: string;
  page: number;
  size: number;
}

/** POST /api/v1/publications — payload accepted by `PublicationsController#create` (mirrors `PublicationRequestDTO`). */
export interface CreatePublicationPayload {
  title: string;
  content: string;
  category: PublicationCategory;
  /** Backend defaults to PUBLISHED; send explicitly so posts never land as PENDING. */
  status?: "PUBLISHED" | "PENDING";
  imageUrl?: string;
  emotion?: string;
  emotionText?: string;
  linkUrl?: string;
  linkMetadata?: string;
}

/** POST /api/v1/publications/upload-image */
export interface ImageUploadResponse {
  success: boolean;
  url: string;
  message: string;
}

/** GET /api/v1/publications/link-preview — `metadata` is a JSON string, parse with `parseLinkMetadata`. */
export interface LinkPreviewResponse {
  success: boolean;
  url: string;
  metadata: string;
}

/** POST /api/v1/publications/{id}/like|dislike — full reaction state after the toggle. */
export interface PublicationReactionResponse {
  isLiked: boolean;
  isDisliked: boolean;
  likesCount: number;
  dislikesCount: number;
}

/** POST /api/v1/publications/{id}/bookmark */
export interface PublicationBookmarkResponse {
  isBookmarked: boolean;
}

/** POST /api/v1/publications/{id}/share */
export interface PublicationShareResponse {
  sharesCount: number;
}

/** DELETE /api/v1/publications/{id} — generic success/error ack (mirrors `features/events/types.ts`). */
export interface ApiMessageResponse {
  success: boolean;
  message: string;
}

/** GET /api/v1/publications/sidebar/stats */
export interface PublicationsSidebarStats {
  totalPublications: number;
  todayPublications: number;
  weekPublications: number;
  onlineUsers: number;
}

/** One row of GET /api/v1/publications/sidebar/top-authors. */
export interface TopAuthor {
  id: number;
  username: string;
  imageUrl: string | null;
  publicationsCount: number;
  isFollowing: boolean;
}

/** GET /api/v1/publications/sidebar/top-authors */
export interface TopAuthorsResponse {
  authors: TopAuthor[];
}

/** GET /api/v1/publications/sidebar/trending — hashtags from the last 7 days. */
export interface TrendingTopic {
  topic: string;
  count: number;
}

/** GET /api/v1/publications/sidebar/last-activity — all fields null when no publication exists yet. */
export interface PublicationsLastActivity {
  lastPostTime: string | null;
  lastPostId: number | null;
  lastPostTitle: string | null;
  lastPostAuthor: string | null;
  lastPostAuthorImage: string | null;
  lastPostLikes: number;
  lastPostComments: number;
}

/** GET /api/v1/publications/sidebar/most-commented|top-viewed|from-admin (`id === null` when absent). */
export interface PublicationStatSummary {
  id: number | null;
  title: string | null;
  commentsCount: number;
  viewsCount: number;
  likesCount: number;
  authorId: number | null;
  authorName: string | null;
  authorImage: string | null;
  imageUrl: string | null;
}

/** Mirrors `SVUserMinimalDTO` — GET /api/v1/publications/{id}/liked-users|disliked-users, GET /api/svmessenger/users/search. */
export interface UserSearchResult {
  id: number;
  username: string;
  email: string | null;
  fullName: string | null;
  imageUrl: string | null;
  isOnline: boolean | null;
  lastSeen: string | null;
  bio: string | null;
}

/** Parsed shape of `Publication.linkMetadata` / `LinkPreviewResponse.metadata` (see `PublicationLinkMetadataServiceImpl`). */
export interface LinkMetadata {
  type: "youtube" | "image" | "website";
  url: string;
  title?: string;
  description?: string;
  domain?: string;
  /** Website `og:image`. */
  image?: string;
  /** Set when `type === "image"` (the link itself is a direct image URL). */
  imageUrl?: string;
  favicon?: string;
  thumbnail?: string;
  embedUrl?: string;
  videoId?: string;
  authorName?: string;
}
