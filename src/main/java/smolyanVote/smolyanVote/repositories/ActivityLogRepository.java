package smolyanVote.smolyanVote.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.ActivityLogEntity;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLogEntity, Long> {

    // ===== BASIC QUERIES =====

    /**
     * Намира последните N активности, сортирани по време (най-новите първо)
     */
    List<ActivityLogEntity> findTop100ByOrderByTimestampDesc();

    /**
     * Намира активности след определено ID (за real-time updates)
     */
    @Query("SELECT a FROM ActivityLogEntity a WHERE a.id > :lastId ORDER BY a.timestamp DESC")
    List<ActivityLogEntity> findActivitiesSinceId(@Param("lastId") Long lastId);

    /**
     * Намира активности по потребител
     */
    Page<ActivityLogEntity> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);

    /**
     * Намира активности по username (case insensitive)
     */
    Page<ActivityLogEntity> findByUsernameContainingIgnoreCaseOrderByTimestampDesc(String username, Pageable pageable);

    // ===== TIME-BASED QUERIES =====

    /**
     * Намира активности след определена дата
     */
    List<ActivityLogEntity> findByTimestampAfterOrderByTimestampDesc(LocalDateTime since);

    /**
     * Намира активности в интервал от време
     */
    List<ActivityLogEntity> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);

    /**
     * Брои активности след определена дата
     */
    @Query("SELECT COUNT(a) FROM ActivityLogEntity a WHERE a.timestamp >= :since")
    long countActivitiesSince(@Param("since") LocalDateTime since);

    /**
     * Намира последни активности за онлайн потребители
     */
    @Query("SELECT a FROM ActivityLogEntity a WHERE a.timestamp >= :since")
    List<ActivityLogEntity> findRecentActivities(@Param("since") LocalDateTime since);

    // ===== FILTERING QUERIES =====

    /**
     * Намира активности по действие
     */
    Page<ActivityLogEntity> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    /**
     * Намира активности по тип entity
     */
    Page<ActivityLogEntity> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);

    /**
     * Намира активности за конкретен entity
     */
    List<ActivityLogEntity> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId);

    // ===== IP-BASED QUERIES =====

    /**
     * Намира активности по IP адрес
     */
    List<ActivityLogEntity> findByIpAddressOrderByTimestampDesc(String ipAddress);

    /**
     * Намира различните IP адреси за потребител
     */
    @Query("SELECT DISTINCT a.ipAddress FROM ActivityLogEntity a WHERE a.userId = :userId AND a.ipAddress IS NOT NULL")
    List<String> findDistinctIpAddressesByUserId(@Param("userId") Long userId);

    /**
     * Брои активности от IP адрес за период
     */
    @Query("SELECT COUNT(a) FROM ActivityLogEntity a WHERE a.ipAddress = :ipAddress AND a.timestamp >= :since")
    long countActivitiesFromIpSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    // ===== STATISTICS QUERIES =====

    /**
     * Намира най-активните потребители за период
     */
    @Query("SELECT a.username, COUNT(a) FROM ActivityLogEntity a " +
            "WHERE a.timestamp >= :since AND a.username IS NOT NULL " +
            "GROUP BY a.username ORDER BY COUNT(a) DESC")
    List<Object[]> findMostActiveUsers(@Param("since") LocalDateTime since, Pageable pageable);

    /**
     * Намира най-честите действия за период
     */
    @Query("SELECT a.action, COUNT(a) FROM ActivityLogEntity a " +
            "WHERE a.timestamp >= :since " +
            "GROUP BY a.action ORDER BY COUNT(a) DESC")
    List<Object[]> findMostFrequentActions(@Param("since") LocalDateTime since);

    // ===== CLEANUP QUERIES =====

    /**
     * Изтрива стари активности преди определена дата
     */
    void deleteByTimestampBefore(LocalDateTime before);

    /**
     * Брои записи преди определена дата
     */
    long countByTimestampBefore(LocalDateTime before);
}