package smolyanVote.smolyanVote.repositories.mobile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.mobile.MobileDeviceTokenEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface MobileDeviceTokenRepository extends JpaRepository<MobileDeviceTokenEntity, Long> {

    /**
     * Намери token по device token string
     */
    Optional<MobileDeviceTokenEntity> findByDeviceToken(String deviceToken);

    /**
     * Намери всички активни tokens за user
     */
    List<MobileDeviceTokenEntity> findByUserIdAndIsActiveTrue(Long userId);

    /**
     * Намери token по user и device token
     */
    Optional<MobileDeviceTokenEntity> findByUserIdAndDeviceToken(Long userId, String deviceToken);

    /**
     * Намери всички активни tokens за platform
     */
    List<MobileDeviceTokenEntity> findByPlatformAndIsActiveTrue(String platform);

    /**
     * Деактивирай всички tokens за user
     */
    @Modifying
    @Query("UPDATE MobileDeviceTokenEntity t SET t.isActive = false WHERE t.user.id = :userId")
    void deactivateAllTokensForUser(@Param("userId") Long userId);

    /**
     * Деактивирай конкретен token
     */
    @Modifying
    @Query("UPDATE MobileDeviceTokenEntity t SET t.isActive = false WHERE t.deviceToken = :deviceToken")
    void deactivateToken(@Param("deviceToken") String deviceToken);

    /**
     * Изтрий стари неактивни tokens (по-стари от X дни)
     */
    @Modifying
    @Query("DELETE FROM MobileDeviceTokenEntity t WHERE t.isActive = false AND t.lastUsedAt < :cutoffDate")
    void deleteOldInactiveTokens(@Param("cutoffDate") java.time.Instant cutoffDate);
}

