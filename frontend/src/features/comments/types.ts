/** Backend `entityType` path segments — camelCase (matches `CommentsServiceImpl` switch). */
export type CommentEntityType = "simpleEvent" | "referendum" | "multiPoll" | "publication" | "signal";

export type CommentSort = "newest" | "oldest" | "popular";
export type CommentReaction = "LIKE" | "DISLIKE" | "NONE";

/** Mirrors `CommentOutputDto` — booleans serialize without the `is`-prefix (Jackson default). */
export interface CommentDto {
  id: number;
  text: string;
  createdAt: string;
  updatedAt: string | null;
  author: string;
  authorImage: string | null;
  online: boolean;
  likesCount: number;
  dislikesCount: number;
  repliesCount: number;
  parentId: number | null;
  entityType: string;
  entityId: number;
  edited: boolean;
  canEdit: boolean;
  userReaction: CommentReaction;
}

export interface CommentsPageResponse {
  success: boolean;
  comments: CommentDto[];
  totalElements: number;
  hasNext: boolean;
}

export interface CommentMutationResponse {
  success: boolean;
  comment: CommentDto;
  message: string;
}

export interface ToggleVoteResponse {
  likesCount: number;
  dislikesCount: number;
  userReaction: CommentReaction;
  message: string;
}
