package smolyanVote.smolyanVote.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.ReportsEntity;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportsRepository extends JpaRepository<ReportsEntity, Long> {

    // ===== ОСНОВНИ МЕТОДИ ЗА ENTITY REPORTING =====

    /**
     * Проверява дали потребител вече е докладвал конкретен entity
     */
    boolean existsByEntityTypeAndEntityIdAndReporterUsername(
            ReportableEntityType entityType,
            Long entityId,
            String reporterUsername
    );

    /**
     * Намиране на всички доклади за конкретен entity
     */
    List<ReportsEntity> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            ReportableEntityType entityType,
            Long entityId
    );

    /**
     * Броене на доклади за конкретен entity
     */
    long countByEntityTypeAndEntityId(ReportableEntityType entityType, Long entityId);

    /**
     * Намиране на конкретен доклад за entity от потребител
     */
    Optional<ReportsEntity> findByEntityTypeAndEntityIdAndReporterUsername(
            ReportableEntityType entityType,
            Long entityId,
            String reporterUsername
    );

    /**
     * Изтриване на всички доклади за конкретен entity
     */
    @Modifying
    @Query("DELETE FROM ReportsEntity r WHERE r.entityType = :entityType AND r.entityId = :entityId")
    void deleteAllByEntityTypeAndEntityId(
            @Param("entityType") ReportableEntityType entityType,
            @Param("entityId") Long entityId
    );

    // ===== МЕТОДИ ЗА АДМИНИСТРАТОРИ =====

    /**
     * Намиране на доклади по статус
     */
    Page<ReportsEntity> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    /**
     * Броене на доклади от потребител за период
     */
    long countByReporterUsernameAndCreatedAtAfter(String reporterUsername, LocalDateTime after);

    /**
     * Намиране на доклади от определен потребител
     */
    Page<ReportsEntity> findByReporterUsernameOrderByCreatedAtDesc(String reporterUsername, Pageable pageable);

    // ===== СТАТИСТИКИ =====

    /**
     * Статистики по причини
     */
    @Query("SELECT r.reason, COUNT(r) FROM ReportsEntity r WHERE r.status = :status GROUP BY r.reason")
    List<Object[]> getReportsCountByReason(@Param("status") String status);

    /**
     * Броене на доклади от определена дата
     */
    @Query("SELECT COUNT(r) FROM ReportsEntity r WHERE r.createdAt >= :since")
    long countReportsSince(@Param("since") LocalDateTime since);

    /**
     * Entities с най-много доклади
     */
    @Query("SELECT r.entityType, r.entityId, COUNT(r) as reportCount FROM ReportsEntity r " +
            "WHERE r.status = 'PENDING' " +
            "GROUP BY r.entityType, r.entityId " +
            "ORDER BY reportCount DESC")
    List<Object[]> getMostReportedEntities(Pageable pageable);

    /**
     * Статистики по типове entities
     */
    @Query("SELECT r.entityType, COUNT(r) FROM ReportsEntity r " +
            "WHERE r.status = :status " +
            "GROUP BY r.entityType")
    List<Object[]> getReportsCountByEntityType(@Param("status") String status);


    @Query(value = """
    SELECT 
        r.entity_type,
        r.entity_id,
        COUNT(*) as report_count,
        MIN(r.created_at) as first_report,
        MAX(r.created_at) as last_report,
        (SELECT reason FROM reports r2 
         WHERE r2.entity_type = r.entity_type AND r2.entity_id = r.entity_id 
         GROUP BY reason 
         ORDER BY COUNT(*) DESC, reason 
         LIMIT 1) as most_common_reason,
        (SELECT description FROM reports r3 
         WHERE r3.entity_type = r.entity_type AND r3.entity_id = r.entity_id 
         AND r3.description IS NOT NULL AND r3.description != ''
         ORDER BY r3.created_at DESC 
         LIMIT 1) as most_recent_description,
        CASE 
            WHEN COUNT(CASE WHEN r.status = 'PENDING' THEN 1 END) > 0 THEN 'PENDING'
            WHEN COUNT(CASE WHEN r.status = 'REVIEWED' THEN 1 END) = COUNT(*) THEN 'REVIEWED'
            ELSE 'MIXED'
        END as overall_status
    FROM reports r
    GROUP BY r.entity_type, r.entity_id
    ORDER BY COUNT(*) DESC, MAX(r.created_at) DESC
    LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
    List<Object[]> findGroupedReports(@Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT r.reporterUsername FROM ReportsEntity r WHERE r.entityType = :entityType AND r.entityId = :entityId ORDER BY r.createdAt")
    List<String> findReportersByEntity(@Param("entityType") ReportableEntityType entityType, @Param("entityId") Long entityId);

    @Query("SELECT r.id FROM ReportsEntity r WHERE r.entityType = :entityType AND r.entityId = :entityId ORDER BY r.createdAt")
    List<Long> findReportIdsByEntity(@Param("entityType") ReportableEntityType entityType, @Param("entityId") Long entityId);

    @Query(value = "SELECT COUNT(DISTINCT CONCAT(r.entity_type, '-', r.entity_id)) FROM reports r", nativeQuery = true)
    Long countGroupedReports();
}