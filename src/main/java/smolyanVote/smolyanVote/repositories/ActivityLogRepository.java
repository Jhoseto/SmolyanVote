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
     * Намира активности за последния час
     */
    @Query("SELECT a FROM ActivityLogEntity a WHERE a.timestamp >= :since ORDER BY a.timestamp DESC")
    List<ActivityLogEntity> findRecentActivities(@Param("since") LocalDateTime since);

    // ===== ACTION-BASED QUERIES =====

    /**
     * Намира активности по тип действие
     */
    Page<ActivityLogEntity> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    /**
     * Намира активности по тип действие и потребител
     */
    Page<ActivityLogEntity> findByActionAndUserIdOrderByTimestampDesc(String action, Long userId, Pageable pageable);

    // ===== ENTITY-BASED QUERIES =====

    /**
     * Намира всички активности за конкретен entity
     */
    List<ActivityLogEntity> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId);

    /**
     * Намира активности по тип entity
     */
    Page<ActivityLogEntity> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);

    // ===== STATISTICS QUERIES =====

    /**
     * Брой активности за последния час
     */
    @Query("SELECT COUNT(a) FROM ActivityLogEntity a WHERE a.timestamp >= :since")
    long countActivitiesSince(@Param("since") LocalDateTime since);

    /**
     * Брой активности по потребител за последните 24 часа
     */
    @Query("SELECT COUNT(a) FROM ActivityLogEntity a WHERE a.userId = :userId AND a.timestamp >= :since")
    long countUserActivitiesSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /**
     * Най-активни потребители за последните 24 часа
     */
    @Query("SELECT a.username, COUNT(a) as activityCount FROM ActivityLogEntity a " +
            "WHERE a.timestamp >= :since GROUP BY a.username, a.userId " +
            "ORDER BY COUNT(a) DESC")
    List<Object[]> findMostActiveUsers(@Param("since") LocalDateTime since, Pageable pageable);

    /**
     * Най-чести действия за последните 24 часа
     */
    @Query("SELECT a.action, COUNT(a) as actionCount FROM ActivityLogEntity a " +
            "WHERE a.timestamp >= :since GROUP BY a.action " +
            "ORDER BY COUNT(a) DESC")
    List<Object[]> findMostFrequentActions(@Param("since") LocalDateTime since);

    // ===== IP-BASED QUERIES =====

    /**
     * Намира активности по IP адрес
     */
    List<ActivityLogEntity> findByIpAddressOrderByTimestampDesc(String ipAddress);

    /**
     * Намира различни IP адреси за потребител
     */
    @Query("SELECT DISTINCT a.ipAddress FROM ActivityLogEntity a WHERE a.userId = :userId AND a.ipAddress IS NOT NULL")
    List<String> findDistinctIpAddressesByUserId(@Param("userId") Long userId);

    // ===== CLEANUP QUERIES =====

    /**
     * Изтрива стари активности (за maintenance)
     */
    @Query("DELETE FROM ActivityLogEntity a WHERE a.timestamp < :before")
    void deleteActivitiesBefore(@Param("before") LocalDateTime before);

    /**
     * Брой записи преди определена дата (за cleanup planning)
     */
    @Query("SELECT COUNT(a) FROM ActivityLogEntity a WHERE a.timestamp < :before")
    long countActivitiesBefore(@Param("before") LocalDateTime before);
}