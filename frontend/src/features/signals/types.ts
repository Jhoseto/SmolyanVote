/** Mirrors backend `SignalsCategory` enum names. */
export type SignalCategory =
  | "ROAD_DAMAGE"
  | "SIDEWALK_DAMAGE"
  | "LIGHTING"
  | "TRAFFIC_SIGNS"
  | "WATER_SEWER"
  | "WASTE_MANAGEMENT"
  | "ILLEGAL_DUMPING"
  | "TREE_ISSUES"
  | "AIR_POLLUTION"
  | "NOISE_POLLUTION"
  | "HEALTHCARE"
  | "EDUCATION"
  | "TRANSPORT"
  | "PARKING"
  | "SECURITY"
  | "VANDALISM"
  | "ACCESSIBILITY"
  | "OTHER";

export type SignalSortOption = "newest" | "oldest" | "popular" | "viewed" | "distance";

export type SignalTimeFilter = "" | "today" | "week" | "month";

export type PriorityTier = "low" | "medium" | "high";

/** `GET/POST/PUT /api/v1/signals` — mirrors backend `SignalResponseDTO`. */
export interface Signal {
  id: number;
  title: string;
  description: string;
  category: SignalCategory;
  categoryLabel: string;
  expirationDays: number | null;
  activeUntil: string | null;
  isActive: boolean;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  authorId: number | null;
  authorUsername: string | null;
  authorImageUrl: string | null;
  createdAt: string;
  modifiedAt: string;
  priorityBoostCount: number;
  viewsCount: number;
  commentsCount: number;
  hasBoosted: boolean;
  isOwner: boolean;
  isResolved: boolean;
  resolvedByUsername: string | null;
  adminNotes: string | null;
  isSubscribed: boolean;
  hasReportedResolved: boolean;
  resolvedReportCount: number;
  /** Client-computed from per-category tertiles — not from API. */
  priorityTier?: PriorityTier | null;
  /** Client-computed when "near me" filter is active. */
  distanceKm?: number | null;
}

export interface SignalsListParams {
  search?: string;
  category?: SignalCategory;
  showExpired?: boolean;
  sort?: SignalSortOption;
}

export interface CreateSignalPayload {
  title: string;
  description: string;
  category: SignalCategory;
  expirationDays: 1 | 3 | 7;
  latitude: number;
  longitude: number;
  image?: File;
}

export interface UpdateSignalPayload {
  title: string;
  description: string;
  category: SignalCategory;
  expirationDays: 1 | 3 | 7;
  image?: File;
  removeImage?: boolean;
}

export interface ModerateSignalPayload {
  adminNotes?: string;
  markResolved: boolean;
}

export interface SignalReactionResponse {
  hasBoosted: boolean;
  priorityBoostCount: number;
}

export interface ApiMessageResponse {
  success: boolean;
  message: string;
}
