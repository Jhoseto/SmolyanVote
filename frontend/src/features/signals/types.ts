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

export type SignalSortOption = "newest" | "oldest" | "popular" | "viewed";

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
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  isLiked: boolean;
  isOwner: boolean;
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
}

export interface SignalReactionResponse {
  isLiked: boolean;
  likesCount: number;
}

export interface ApiMessageResponse {
  success: boolean;
  message: string;
}
