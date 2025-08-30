package smolyanVote.smolyanVote.services.interfaces;

import java.util.List;

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


    /**
     * Взема списък с последователите на потребител
     * @param userId ID на потребителя
     * @param page номер на страницата (започва от 0)
     * @param size брой потребители на страница
     * @return списък с последователи
     */
    List<Object[]> getFollowers(Long userId, int page, int size);

    /**
     * Взема списък с потребителите които следва
     * @param userId ID на потребителя
     * @param page номер на страницата (започва от 0)
     * @param size брой потребители на страница
     * @return списък с следвани потребители
     */
    List<Object[]> getFollowing(Long userId, int page, int size);

    /**
     * Търсене в последователите на потребител
     * @param userId ID на потребителя
     * @param searchTerm текст за търсене
     * @param page номер на страницата
     * @param size брой потребители на страница
     * @return списък с намерени последователи
     */
    List<Object[]> searchFollowers(Long userId, String searchTerm, int page, int size);

    /**
     * Търсене в следваните от потребител
     * @param userId ID на потребителя
     * @param searchTerm текст за търсене
     * @param page номер на страницата
     * @param size брой потребители на страница
     * @return списък с намерени следвани
     */
    List<Object[]> searchFollowing(Long userId, String searchTerm, int page, int size);
}