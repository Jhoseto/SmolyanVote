/**
 * Mirrors `UserFollowDto` (`viewsAndDTO/UserFollowDto.java`) — note Jackson
 * serializes `isFollowing()`/`isAuthenticated()` getters as `following`/
 * `authenticated` (bean-style `isXxx()` → property `xxx`), not `isFollowing`.
 */
export interface FollowStatusResponse {
  success: boolean;
  following: boolean;
  authenticated: boolean;
  followersCount: number;
  followingCount: number;
  userId: number;
}

export interface FollowActionResponse {
  success: boolean;
  message: string;
  action: "followed" | "unfollowed";
}
