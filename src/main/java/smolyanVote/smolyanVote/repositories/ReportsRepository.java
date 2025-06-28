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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportsRepository extends JpaRepository<ReportsEntity, Long> {

    // Проверка дали потребител вече е докладвал публикация
    boolean existsByPublicationIdAndReporterId(Long publicationId, Long reporterId);

    // Намиране на всички доклади за определена публикация
    List<ReportsEntity> findByPublicationIdOrderByCreatedAtDesc(Long publicationId);

    // Намиране на доклади по статус
    Page<ReportsEntity> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    // Намиране на доклади по причина
    List<ReportsEntity> findByReasonOrderByCreatedAtDesc(ReportReasonEnum reason);

    // Броене на доклади за публикация
    long countByPublicationId(Long publicationId);

    // Броене на доклади от потребител
    long countByReporterIdAndCreatedAtAfter(Long reporterId, LocalDateTime after);

    // Намиране на доклади от определен потребител
    Page<ReportsEntity> findByReporterIdOrderByCreatedAtDesc(Long reporterId, Pageable pageable);

    // Намиране на конкретен доклад
    Optional<ReportsEntity> findByPublicationIdAndReporterId(Long publicationId, Long reporterId);

    // Статистики за админи
    @Query("SELECT r.reason, COUNT(r) FROM ReportsEntity r WHERE r.status = :status GROUP BY r.reason")
    List<Object[]> getReportsCountByReason(@Param("status") String status);

    @Query("SELECT COUNT(r) FROM ReportsEntity r WHERE r.createdAt >= :since")
    long countReportsSince(@Param("since") LocalDateTime since);

    // Публикации с най-много доклади
    @Query("SELECT r.publication.id, COUNT(r) as reportCount FROM ReportsEntity r " +
            "WHERE r.status = 'PENDING' GROUP BY r.publication.id " +
            "ORDER BY reportCount DESC")
    List<Object[]> getMostReportedPublications(Pageable pageable);



    boolean existsByPublicationId(Long publicationId);

    @Modifying
    @Query("DELETE FROM ReportsEntity r WHERE r.publication.id = :publicationId")
    void deleteAllByPublicationId(@Param("publicationId") Long publicationId);
}