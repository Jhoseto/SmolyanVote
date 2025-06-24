package smolyanVote.smolyanVote.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;
import smolyanVote.smolyanVote.models.enums.EventStatus;

import java.time.Instant;
import java.util.List;

@Repository
public interface PublicationRepository extends JpaRepository<PublicationEntity, Long> {

    @Query("SELECT p FROM PublicationEntity p JOIN FETCH p.author WHERE p.status = :status ORDER BY p.created DESC")
    Page<PublicationEntity> findByStatusWithAuthorOrderByCreatedDesc(@Param("status") EventStatus status, Pageable pageable);


    @Query("SELECT p FROM PublicationEntity p JOIN FETCH p.author WHERE " +
            "(:search IS NULL OR :search = '' OR " +
            " LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(p.content) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "(:category IS NULL OR p.category = :category) AND " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:timeFilter IS NULL OR p.created >= :timeFilter) AND " +
            "(:authorId IS NULL OR p.author.id = :authorId)")
    Page<PublicationEntity> findWithFilters(@Param("search") String search,
                                            @Param("category") CategoryEnum category,
                                            @Param("status") EventStatus status,
                                            @Param("timeFilter") Instant timeFilter,
                                            @Param("authorId") Long authorId,
                                            Pageable pageable);

    long countByStatus(EventStatus status);
    long countByCategoryAndStatus(CategoryEnum category, EventStatus status);
    long countByCreatedAfterAndStatus(Instant date, EventStatus status);

    @Query("SELECT p.author FROM PublicationEntity p " +
            "WHERE p.status = 'ACTIVE' " +
            "GROUP BY p.author " +
            "ORDER BY COUNT(p) DESC")
    List<UserEntity> findActiveAuthors(Pageable pageable);

    default List<UserEntity> findActiveAuthors(int limit) {
        return findActiveAuthors(org.springframework.data.domain.PageRequest.of(0, limit));
    }

    @Query("SELECT p.category as name, COUNT(p) as count " +
            "FROM PublicationEntity p " +
            "WHERE p.status = 'ACTIVE' " +
            "GROUP BY p.category " +
            "ORDER BY COUNT(p) DESC")
    List<Object[]> findTrendingCategories();
}