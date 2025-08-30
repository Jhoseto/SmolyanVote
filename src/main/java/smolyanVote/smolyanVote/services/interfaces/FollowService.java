package smolyanVote.smolyanVote.services.interfaces;

/**
 * Service за управление на user following relationships
 */
public interface FollowService {

    /**
     * Потребител започва да следва друг потребител
     * @param followerId ID на този който следва
     * @param followingId ID на този който ще бъде следван
     * @throws IllegalArgumentException ако вече се следват или са същия потребител
     */
    void followUser(Long followerId, Long followingId);

    /**
     * Потребител спира да следва друг потребител
     * @param followerId ID на този който следва
     * @param followingId ID на този който се следва
     * @throws IllegalArgumentException ако не се следват
     */
    void unfollowUser(Long followerId, Long followingId);

    /**
     * Проверява дали потребител A следва потребител B
     * @param followerId ID на възможния follower
     * @param followingId ID на възможния following
     * @return true ако A следва B
     */
    boolean isFollowing(Long followerId, Long followingId);

    /**
     * Брой followers на потребител (колко го следват)
     * @param userId ID на потребителя
     * @return брой followers
     */
    long getFollowersCount(Long userId);

    /**
     * Брой following на потребител (колко следва)
     * @param userId ID на потребителя
     * @return брой following
     */
    long getFollowingCount(Long userId);
}