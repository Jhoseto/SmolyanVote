import { apiClient } from "@/lib/api/client";
import type {
  CommentEntityType,
  CommentMutationResponse,
  CommentReaction,
  CommentsPageResponse,
  CommentSort,
} from "./types";

const REPLIES_PAGE_SIZE = 10;

/** Thin wrappers over `CommentsController` (`/api/comments/**`, JWT-authenticated writes). */
export const commentsApi = {
  list: (entityType: CommentEntityType, entityId: number, page: number, sort: CommentSort, size = 10) =>
    apiClient.get<CommentsPageResponse>(
      `/api/comments/${entityType}/${entityId}?page=${page}&size=${size}&sort=${sort}`,
    ),

  replies: (commentId: number, page = 0, size = REPLIES_PAGE_SIZE) =>
    apiClient.get<CommentsPageResponse>(`/api/comments/${commentId}/replies?page=${page}&size=${size}`),

  add: (entityType: CommentEntityType, entityId: number, text: string) =>
    apiClient.post<CommentMutationResponse>(`/api/comments/${entityType}/${entityId}`, { body: { text } }),

  reply: (parentCommentId: number, text: string) =>
    apiClient.post<CommentMutationResponse>(`/api/comments/${parentCommentId}/reply`, { body: { text } }),

  update: (commentId: number, text: string) =>
    apiClient.put<CommentMutationResponse>(`/api/comments/${commentId}`, { body: { text } }),

  remove: (commentId: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/api/comments/${commentId}`),

  toggleVote: (commentId: number, reaction: Exclude<CommentReaction, "NONE">) =>
    apiClient.post<{
      likesCount: number;
      dislikesCount: number;
      userReaction: CommentReaction;
      message: string;
    }>(`/api/comments/${commentId}/vote/${reaction}`),
};
