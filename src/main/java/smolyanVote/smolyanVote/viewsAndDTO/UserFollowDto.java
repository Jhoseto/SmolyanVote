package smolyanVote.smolyanVote.viewsAndDTO;

/**
 * DTO за follow/unfollow операции API responses
 */
public class UserFollowDto {
    private boolean success;
    private String message;
    private String action; // "followed", "unfollowed"
    private boolean isFollowing;
    private boolean isAuthenticated;
    private long followersCount;
    private long followingCount;
    private Long userId;

    // Constructor
    public UserFollowDto() {}

    // Static factory methods за по-лесно създаване
    public static UserFollowDto success(String message, String action) {
        UserFollowDto dto = new UserFollowDto();
        dto.setSuccess(true);
        dto.setMessage(message);
        dto.setAction(action);
        return dto;
    }

    public static UserFollowDto error(String message) {
        UserFollowDto dto = new UserFollowDto();
        dto.setSuccess(false);
        dto.setMessage(message);
        return dto;
    }

    public static UserFollowDto status(boolean isFollowing, boolean isAuthenticated,
                                       long followersCount, long followingCount) {
        UserFollowDto dto = new UserFollowDto();
        dto.setSuccess(true);
        dto.setIsFollowing(isFollowing);
        dto.setIsAuthenticated(isAuthenticated);
        dto.setFollowersCount(followersCount);
        dto.setFollowingCount(followingCount);
        return dto;
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public boolean isFollowing() {
        return isFollowing;
    }

    public void setIsFollowing(boolean isFollowing) {
        this.isFollowing = isFollowing;
    }

    public boolean isAuthenticated() {
        return isAuthenticated;
    }

    public void setIsAuthenticated(boolean isAuthenticated) {
        this.isAuthenticated = isAuthenticated;
    }

    public long getFollowersCount() {
        return followersCount;
    }

    public void setFollowersCount(long followersCount) {
        this.followersCount = followersCount;
    }

    public long getFollowingCount() {
        return followingCount;
    }

    public void setFollowingCount(long followingCount) {
        this.followingCount = followingCount;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}