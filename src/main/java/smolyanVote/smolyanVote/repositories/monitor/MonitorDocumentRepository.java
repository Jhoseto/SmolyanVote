package smolyanVote.smolyanVote.repositories.monitor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.enums.MonitorDocumentType;
import smolyanVote.smolyanVote.models.monitor.MonitorDocumentEntity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MonitorDocumentRepository extends JpaRepository<MonitorDocumentEntity, Long> {

    Optional<MonitorDocumentEntity> findBySourceAndSourceId(
            smolyanVote.smolyanVote.models.enums.MonitorSource source,
            String sourceId);

    long countByDocumentType(MonitorDocumentType documentType);

    @Query("SELECT MAX(d.fetchedAt) FROM MonitorDocumentEntity d")
    Instant findLatestFetchedAt();

    @Query("SELECT d FROM MonitorDocumentEntity d WHERE d.deadlineDate IS NOT NULL AND d.deadlineDate >= :from ORDER BY d.deadlineDate ASC")
    List<MonitorDocumentEntity> findUpcomingDeadlines(@Param("from") LocalDate from, Pageable pageable);

    @Query("SELECT d FROM MonitorDocumentEntity d WHERE d.documentType IN :types ORDER BY d.publishedAt DESC, d.created DESC")
    Page<MonitorDocumentEntity> findByTypes(@Param("types") List<MonitorDocumentType> types, Pageable pageable);

    @Query("SELECT d FROM MonitorDocumentEntity d WHERE " +
            "(:search IS NULL OR :search = '' OR LOWER(d.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY d.publishedAt DESC, d.created DESC")
    Page<MonitorDocumentEntity> search(@Param("search") String search, Pageable pageable);

    long countByCreatedAfter(Instant since);

    @Query("SELECT d FROM MonitorDocumentEntity d WHERE d.rawContent IS NOT NULL AND (d.shortSummary IS NULL OR d.shortSummary = '') ORDER BY d.created DESC")
    List<MonitorDocumentEntity> findPendingAiProcessing(Pageable pageable);

    @Query("SELECT d FROM MonitorDocumentEntity d WHERE " +
            "(d.rawContent IS NULL OR LENGTH(d.rawContent) < 80) " +
            "AND LOWER(d.sourceUrl) LIKE '%.pdf%' ORDER BY d.created DESC")
    List<MonitorDocumentEntity> findOcrCandidates(Pageable pageable);

    MonitorDocumentEntity findFirstByDocumentTypeOrderByPublishedAtDesc(MonitorDocumentType documentType);
}
