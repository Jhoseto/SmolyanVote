package smolyanVote.smolyanVote.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.models.enums.SignalsCategory;
import smolyanVote.smolyanVote.models.enums.SignalsUrgencyLevel;

import java.time.Instant;
import java.util.List;

@Repository
public interface SignalsRepository extends JpaRepository<SignalsEntity, Long> {

    // ===== ОСНОВНИ ЗАЯВКИ С АВТОР =====

    @Query("SELECT s FROM SignalsEntity s JOIN FETCH s.author ORDER BY s.created DESC")
    Page<SignalsEntity> findAllWithAuthorOrderByCreatedDesc(Pageable pageable);

    // ===== ФИЛТРИРАНЕ =====

    @Query("SELECT s FROM SignalsEntity s JOIN FETCH s.author WHERE " +
            "(:search IS NULL OR :search = '' OR " +
            " LOWER(s.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "(:category IS NULL OR s.category = :category) AND " +
            "(:urgency IS NULL OR s.urgency = :urgency) AND " +
            "(:timeFilter IS NULL OR s.created >= :timeFilter) " +
            "ORDER BY " +
            "CASE WHEN :sort = 'newest' THEN s.created END DESC, " +
            "CASE WHEN :sort = 'oldest' THEN s.created END ASC, " +
            "CASE WHEN :sort = 'popular' THEN s.likesCount END DESC, " +
            "CASE WHEN :sort = 'viewed' THEN s.viewsCount END DESC, " +
            "CASE WHEN :sort = 'urgency' THEN s.urgency END DESC, " +
            "CASE WHEN :sort = 'category' THEN s.category END ASC")
    Page<SignalsEntity> findWithFilters(
            @Param("search") String search,
            @Param("category") SignalsCategory category,
            @Param("urgency") SignalsUrgencyLevel urgency,
            @Param("timeFilter") Instant timeFilter,
            @Param("sort") String sort,
            Pageable pageable);

    // ===== СТАТИСТИКИ =====

    long countByCategory(SignalsCategory category);
    long countByUrgency(SignalsUrgencyLevel urgency);
    long countByCreatedAfter(Instant date);

    @Query("SELECT COUNT(s) FROM SignalsEntity s WHERE s.created >= :startOfDay AND s.created < :endOfDay")
    long countByCreatedBetween(@Param("startOfDay") Instant startOfDay, @Param("endOfDay") Instant endOfDay);

    // ===== ГЕОЛОКАЦИОННИ ЗАЯВКИ =====

    @Query("SELECT s FROM SignalsEntity s JOIN FETCH s.author WHERE " +
            "s.latitude BETWEEN :minLat AND :maxLat AND " +
            "s.longitude BETWEEN :minLon AND :maxLon " +
            "ORDER BY s.created DESC")
    List<SignalsEntity> findByLocationBounds(
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLon") Double minLon,
            @Param("maxLon") Double maxLon);

    // ===== ПО АВТОР =====

    Page<SignalsEntity> findByAuthorIdOrderByCreatedDesc(Long authorId, Pageable pageable);
    long countByAuthorId(Long authorId);

    // ===== ПОПУЛЯРНИ СИГНАЛИ =====

    @Query("SELECT s FROM SignalsEntity s JOIN FETCH s.author WHERE s.likesCount > :minLikes ORDER BY s.likesCount DESC")
    List<SignalsEntity> findPopularSignals(@Param("minLikes") Integer minLikes, Pageable pageable);
}