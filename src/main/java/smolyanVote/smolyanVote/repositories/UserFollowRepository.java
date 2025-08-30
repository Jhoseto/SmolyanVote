package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserFollowEntity;

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

    // 🚀 BONUS: Batch check за множество users (ако ти трябва)
    @Query(value = "SELECT following_id FROM user_follows WHERE follower_id = :followerId AND following_id IN :userIds", nativeQuery = true)
    java.util.List<Long> findFollowingUserIds(@Param("followerId") Long followerId, @Param("userIds") java.util.List<Long> userIds);

    // 🚀 BONUS: Топ followed users (ако ти трябва)
    @Query(value = "SELECT following_id, COUNT(*) as followers_count FROM user_follows GROUP BY following_id ORDER BY followers_count DESC LIMIT :limit", nativeQuery = true)
    java.util.List<Object[]> findTopFollowedUsers(@Param("limit") int limit);
}