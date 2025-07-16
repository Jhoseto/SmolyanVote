package smolyanVote.smolyanVote.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.ReportsEntity;
import smolyanVote.smolyanVote.models.enums.ReportReasonEnum;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportsRepository extends JpaRepository<ReportsEntity, Long> {

    // ===== LEGACY PUBLICATION METHODS (запазени за обратна съвместимост) =====

    // Проверка дали потребител вече е докладвал публикация
    boolean existsByPublicationIdAndReporterId(Long publicationId, Long reporterId);

    // Намиране на всички доклади за определена публикация
    List<ReportsEntity> findByPublicationIdOrderByCreatedAtDesc(Long publicationId);

    // Броене на доклади за публикация
    long countByPublicationId(Long publicationId);

    // Намиране на конкретен доклад за публикация
    Optional<ReportsEntity> findByPublicationIdAndReporterId(Long publicationId, Long reporterId);

    boolean existsByPublicationId(Long publicationId);

    @Modifying
    @Query("DELETE FROM ReportsEntity r WHERE r.publication.id = :publicationId")
    void deleteAllByPublicationId(@Param("publicationId") Long publicationId);

    // ===== NEW POLYMORPHIC METHODS =====

    // Проверка дали потребител вече е докладвал конкретен entity
    boolean existsByEntityTypeAndEntityIdAndReporterId(ReportableEntityType entityType, Long entityId, Long reporterId);

    // Намиране на всички доклади за конкретен entity
    List<ReportsEntity> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(ReportableEntityType entityType, Long entityId);

    // Броене на доклади за конкретен entity
    long countByEntityTypeAndEntityId(ReportableEntityType entityType, Long entityId);

    // Намиране на конкретен доклад за entity
    Optional<ReportsEntity> findByEntityTypeAndEntityIdAndReporterId(ReportableEntityType entityType, Long entityId, Long reporterId);

    // Изтриване на всички доклади за конкретен entity
    @Modifying
    @Query("DELETE FROM ReportsEntity r WHERE r.entityType = :entityType AND r.entityId = :entityId")
    void deleteAllByEntityTypeAndEntityId(@Param("entityType") ReportableEntityType entityType, @Param("entityId") Long entityId);

    // ===== UNIVERSAL METHODS (работят с всички типове) =====

    /**
     * Проверява дали потребител е докладвал конкретен entity (универсално)
     * Работи и със старите записи (publication) и с новите (entity_type/entity_id)
     */
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM ReportsEntity r WHERE " +
            "((r.entityType = :entityType AND r.entityId = :entityId) OR " +
            "(:entityType = 'PUBLICATION' AND r.publication.id = :entityId)) AND " +
            "r.reporter.id = :reporterId")
    boolean hasUserReportedEntity(@Param("entityType") ReportableEntityType entityType,
                                  @Param("entityId") Long entityId,
                                  @Param("reporterId") Long reporterId);

    /**
     * Намиране на доклади за конкретен entity (универсално)
     */
    @Query("SELECT r FROM ReportsEntity r WHERE " +
            "(r.entityType = :entityType AND r.entityId = :entityId) OR " +
            "(:entityType = 'PUBLICATION' AND r.publication.id = :entityId) " +
            "ORDER BY r.createdAt DESC")
    List<ReportsEntity> findReportsForEntity(@Param("entityType") ReportableEntityType entityType,
                                             @Param("entityId") Long entityId);

    /**
     * Броене на доклади за конкретен entity (универсално)
     */
    @Query("SELECT COUNT(r) FROM ReportsEntity r WHERE " +
            "(r.entityType = :entityType AND r.entityId = :entityId) OR " +
            "(:entityType = 'PUBLICATION' AND r.publication.id = :entityId)")
    long countReportsForEntity(@Param("entityType") ReportableEntityType entityType,
                               @Param("entityId") Long entityId);

    // ===== EXISTING COMMON METHODS =====

    // Намиране на доклади по статус
    Page<ReportsEntity> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    // Намиране на доклади по причина
    List<ReportsEntity> findByReasonOrderByCreatedAtDesc(ReportReasonEnum reason);

    // Броене на доклади от потребител
    long countByReporterIdAndCreatedAtAfter(Long reporterId, LocalDateTime after);

    // Намиране на доклади от определен потребител
    Page<ReportsEntity> findByReporterIdOrderByCreatedAtDesc(Long reporterId, Pageable pageable);

    // Статистики за админи
    @Query("SELECT r.reason, COUNT(r) FROM ReportsEntity r WHERE r.status = :status GROUP BY r.reason")
    List<Object[]> getReportsCountByReason(@Param("status") String status);

    @Query("SELECT COUNT(r) FROM ReportsEntity r WHERE r.createdAt >= :since")
    long countReportsSince(@Param("since") LocalDateTime since);

    // Публикации с най-много доклади (работи само за legacy publications)
    @Query("SELECT r.publication.id, COUNT(r) as reportCount FROM ReportsEntity r " +
            "WHERE r.status = 'PENDING' AND r.publication IS NOT NULL " +
            "GROUP BY r.publication.id " +
            "ORDER BY reportCount DESC")
    List<Object[]> getMostReportedPublications(Pageable pageable);

    // Entities с най-много доклади (универсално)
    @Query("SELECT r.entityType, r.entityId, COUNT(r) as reportCount FROM ReportsEntity r " +
            "WHERE r.status = 'PENDING' AND r.entityType IS NOT NULL " +
            "GROUP BY r.entityType, r.entityId " +
            "ORDER BY reportCount DESC")
    List<Object[]> getMostReportedEntities(Pageable pageable);

    // Статистики по типове entities
    @Query("SELECT r.entityType, COUNT(r) FROM ReportsEntity r " +
            "WHERE r.status = :status AND r.entityType IS NOT NULL " +
            "GROUP BY r.entityType")
    List<Object[]> getReportsCountByEntityType(@Param("status") String status);
}