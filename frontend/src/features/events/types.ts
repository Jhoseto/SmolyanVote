export type EventKind = "event" | "referendum" | "poll";
export type EventStatusFilter = "active" | "inactive";
export type EventSortOption = "date-desc" | "date-asc" | "popularity" | "name";
export type EventPopularityFilter = "most-voted" | "most-viewed" | "most-commented";
export type EventDatePeriod = "last-7-days" | "last-month" | "last-year";
export type EventQuickFilter = "my-events" | "new-events" | "following" | "voted" | "not-voted";
export type EventViewMode = "grid" | "list";

/** Backend `EventType` enum values (verbatim — sent/received as-is). */
export type BackendEventType = "SIMPLEEVENT" | "REFERENDUM" | "MULTI_POLL";
export type BackendEventStatus = "ACTIVE" | "INACTIVE" | "PENDING";

/** List item — mirrors `EventSimpleViewDTO` (GET /api/v1/events). */
export interface EventListItem {
  id: number;
  eventType: BackendEventType;
  eventStatus: BackendEventStatus;
  title: string;
  description: string;
  location: string;
  viewCounter: number;
  createdAt: string;
  creatorName: string;
  creatorImage: string | null;
  creatorOnlineStatus: number;
  images: string[];
  totalVotes: number;
}

/** Full catalog — filter/sort/page happen client-side. */
export interface EventsCatalogResponse {
  events: EventListItem[];
  followingUsernames: string[];
  /** Keys as `EVENT_TYPE:id`, e.g. `SIMPLEEVENT:12`. */
  votedKeys: string[];
}

export interface EventCreator {
  id: number;
  username: string;
  imageUrl: string | null;
}

/** Stable {id, url} pair for a single image — used by admin inline-edit to mark a specific existing image for deletion. */
export interface ImageRef {
  id: number;
  url: string;
}

/** GET /api/v1/events/simple/{id} */
export interface SimpleEventDetail {
  id: number;
  eventType: BackendEventType;
  title: string;
  description: string;
  location: string;
  viewCounter: number;
  createdAt: string;
  creator: EventCreator;
  images: string[];
  imageRefs: ImageRef[];
  currentUserVote: "1" | "2" | "3" | null;
  yesVotes: number;
  noVotes: number;
  neutralVotes: number;
  totalVotes: number;
  positiveLabel: string;
  negativeLabel: string;
  neutralLabel: string;
  yesPercent: number;
  noPercent: number;
  neutralPercent: number;
}

/** GET /api/v1/events/referendum/{id} */
export interface ReferendumDetail {
  id: number;
  eventType: BackendEventType;
  title: string;
  description: string;
  location: string;
  viewCounter: number;
  createdAt: string;
  creator: EventCreator;
  imageUrls: string[];
  imageRefs: ImageRef[];
  options: string[];
  votes: number[];
  votePercentages: number[];
  totalVotes: number;
  currentUserVote: number | null;
}

/** GET /api/v1/events/multipoll/{id} */
export interface MultiPollDetail {
  id: number;
  eventType: BackendEventType;
  title: string;
  description: string;
  createdAt: string;
  location: string;
  creator: EventCreator;
  imageUrls: string[];
  imageRefs: ImageRef[];
  currentUserVotes: string[] | null;
  optionsText: string[];
  votesForOptions: number[];
  votePercentages: number[];
  totalVotes: number;
  totalUsersVotes: number;
  currentUserVote: number | null;
  viewCounter: number;
}

/** POST /api/v1/events/{simple,referendum,multipoll} — write-ack with the new id. */
export interface EventCreatedResponse {
  id: number;
}

/** DELETE /api/v1/events/{id} — generic success/error ack. */
export interface ApiMessageResponse {
  success: boolean;
  message: string;
}

