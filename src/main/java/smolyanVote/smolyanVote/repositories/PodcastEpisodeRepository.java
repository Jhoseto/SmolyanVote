package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.PodcastEpisodeEntity;

import java.util.List;

@Repository
public interface PodcastEpisodeRepository extends JpaRepository<PodcastEpisodeEntity, Long> {

    /**
     * Намира всички публикувани епизоди, сортирани по дата (най-новите първо)
     */
    List<PodcastEpisodeEntity> findAllByIsPublishedTrueOrderByPublishDateDesc();

    /**
     * Намира всички епизоди, сортирани по дата (най-новите първо)
     */
    List<PodcastEpisodeEntity> findAllByOrderByPublishDateDesc();

    /**
     * Намира епизод по номер
     */
    PodcastEpisodeEntity findByEpisodeNumber(Integer episodeNumber);

    /**
     * Намира последните N епизода
     */
    List<PodcastEpisodeEntity> findTop5ByIsPublishedTrueOrderByPublishDateDesc();

    /**
     * Търси епизоди по заглавие или описание
     */
    @Query("SELECT e FROM PodcastEpisodeEntity e WHERE " +
            "(LOWER(e.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND e.isPublished = true " +
            "ORDER BY e.publishDate DESC")
    List<PodcastEpisodeEntity> searchEpisodes(String searchTerm);

    /**
     * Брои общия брой слушания на всички епизоди
     */
    @Query("SELECT SUM(e.listenCount) FROM PodcastEpisodeEntity e WHERE e.isPublished = true")
    Long getTotalListens();

    /**
     * Намира най-популярните епизоди
     */
    List<PodcastEpisodeEntity> findTop10ByIsPublishedTrueOrderByListenCountDesc();

    /**
     * Брои публикуваните епизоди
     */
    Long countByIsPublishedTrue();

    /**
     * Намира епизоди сортирани по продължителност
     */
    List<PodcastEpisodeEntity> findAllByIsPublishedTrueOrderByDurationSecondsDesc();
    List<PodcastEpisodeEntity> findAllByIsPublishedTrueOrderByDurationSecondsAsc();
}