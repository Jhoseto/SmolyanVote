package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserFollowEntity;

import java.util.List;
import java.util.Optional;

public interface UserFollowRepository extends JpaRepository<UserFollowEntity, Long> {

    // 🚀 NATIVE SQL за максимална скорост
    @Query(value = "SELECT COUNT(*) FROM user_follows WHERE follower_id = :followerId AND following_id = :followingId", nativeQuery = true)
    long existsByFollowerIdAndFollowingIdRaw(@Param("followerId") Long followerId, @Param("followingId") Long followingId);


    // 🚀 JPQL с explicit select за по-бърз fetch
    @Query("SELECT uf FROM UserFollowEntity uf WHERE uf.follower.id = :followerId AND uf.following.id = :followingId")
    Optional<UserFollowEntity> findByFollowerIdAndFollowingId(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    // 🚀 NATIVE COUNT - най-бърз начин
    @Query(value = "SELECT COUNT(*) FROM user_follows WHERE following_id = :userId", nativeQuery = true)
    long countByFollowingId(@Param("userId") Long userId);

    // 🚀 NATIVE COUNT - най-бърз начин
    @Query(value = "SELECT COUNT(*) FROM user_follows WHERE follower_id = :userId", nativeQuery = true)
    long countByFollowerId(@Param("userId") Long userId);

    // 🚀 BULK DELETE за максимална ефективност
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM user_follows WHERE follower_id = :followerId AND following_id = :followingId", nativeQuery = true)
    void deleteByFollowerIdAndFollowingId(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    //  Batch check за множество users
    @Query(value = "SELECT following_id FROM user_follows WHERE follower_id = :followerId AND following_id IN :userIds", nativeQuery = true)
    java.util.List<Long> findFollowingUserIds(@Param("followerId") Long followerId, @Param("userIds") java.util.List<Long> userIds);

    // Топ followed users
    @Query(value = "SELECT following_id, COUNT(*) as followers_count FROM user_follows GROUP BY following_id ORDER BY followers_count DESC LIMIT :limit", nativeQuery = true)
    java.util.List<Object[]> findTopFollowedUsers(@Param("limit") int limit);



    /**
     * Списък последователи с pagination
     */
    @Query(value = """
        SELECT u.id, u.username, u.image_url, u.role, u.online_status, 
               u.created, uf.followed_at,
               (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count
        FROM user_follows uf 
        INNER JOIN users u ON uf.follower_id = u.id 
        WHERE uf.following_id = ?1 
        ORDER BY uf.followed_at DESC 
        LIMIT ?3 OFFSET ?2
        """, nativeQuery = true)
    List<Object[]> findFollowersWithPagination(Long userId, int offset, int limit);

    /**
     * Списък следвани с pagination
     */
    @Query(value = """
        SELECT u.id, u.username, u.image_url, u.role, u.online_status, 
               u.created, uf.followed_at,
               (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count
        FROM user_follows uf 
        INNER JOIN users u ON uf.following_id = u.id 
        WHERE uf.follower_id = ?1 
        ORDER BY uf.followed_at DESC 
        LIMIT ?3 OFFSET ?2
        """, nativeQuery = true)
    List<Object[]> findFollowingWithPagination(Long userId, int offset, int limit);

    /**
     * Търсене в последователи
     */
    @Query(value = """
        SELECT u.id, u.username, u.image_url, u.role, u.online_status, 
               u.created, uf.followed_at,
               (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count
        FROM user_follows uf 
        INNER JOIN users u ON uf.follower_id = u.id 
        WHERE uf.following_id = ?1 
        AND u.username LIKE CONCAT('%', ?2, '%')
        ORDER BY uf.followed_at DESC 
        LIMIT ?4 OFFSET ?3
        """, nativeQuery = true)
    List<Object[]> searchFollowers(Long userId, String searchTerm, int offset, int limit);

    /**
     * Търсене в следвани
     */
    @Query(value = """
        SELECT u.id, u.username, u.image_url, u.role, u.online_status, 
               u.created, uf.followed_at,
               (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count
        FROM user_follows uf 
        INNER JOIN users u ON uf.following_id = u.id 
        WHERE uf.follower_id = ?1 
        AND u.username LIKE CONCAT('%', ?2, '%')
        ORDER BY uf.followed_at DESC 
        LIMIT ?4 OFFSET ?3
        """, nativeQuery = true)
    List<Object[]> searchFollowing(Long userId, String searchTerm, int offset, int limit);
}