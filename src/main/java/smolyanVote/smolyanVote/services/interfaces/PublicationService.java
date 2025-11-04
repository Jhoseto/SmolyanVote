package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationRequestDTO;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationResponseDTO;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface PublicationService {

    // ====== ОСНОВНИ CRUD ОПЕРАЦИИ ======

    PublicationEntity findById(Long id);

    @Transactional(readOnly = true)
    List<PublicationResponseDTO> findAllByAuthorId(Long authorId);

    PublicationEntity create(PublicationRequestDTO request, UserEntity author);
    PublicationEntity update(PublicationEntity publication, PublicationRequestDTO request);
    void delete(Long id);

    // ====== ФИЛТРИРАНЕ ======

    Page<PublicationEntity> findWithFilters(String search, String category, String status,
                                            String time, String author, List<Long> authorIds, Pageable pageable,
                                            Authentication auth);

    // ====== СТАТИСТИКИ ======

    long getTotalCount();
    long getCountByCategory(CategoryEnum category);
    long getTodayCount();
    long getWeekCount();
    long getMonthCount();

    // ====== ВЗАИМОДЕЙСТВИЯ ======

    boolean toggleLike(Long publicationId, UserEntity user);

    @Transactional(readOnly = true)
    int getDislikesCount(Long publicationId);

    @Transactional
    boolean toggleBookmark(Long publicationId, UserEntity user);

    @Transactional
    boolean toggleDislike(Long publicationId, UserEntity user);

    int getLikesCount(Long publicationId);
    void incrementShareCount(Long publicationId);
    int getSharesCount(Long publicationId);

    // ====== АКТИВНИ АВТОРИ И TRENDING ======

    List<UserEntity> getActiveAuthors(int limit);
    List<Map<String, Object>> getTrendingTopics();

    // ====== SIDEBAR METHODS =====

    List<Object[]> getTrendingHashtags();
    PublicationEntity getLastPublishedPost();
    PublicationEntity getMostCommentedPostToday(Instant startOfDay);
    PublicationEntity getMostViewedPostToday(Instant startOfDay);
    long getCountByAuthorAndCreatedAfter(UserEntity author, Instant created);
    List<Map<String, Object>> getTopAuthorsData(Instant startOfDay, int limit);

    // ====== ПРАВА НА ДОСТЪП ======

    boolean canViewPublication(PublicationEntity publication, Authentication auth);
    boolean canEditPublication(PublicationEntity publication, Authentication auth);



    @Transactional(readOnly = true)
    List<Long> getLikedPublicationIdsByUsername(String username);

    @Transactional(readOnly = true)
    List<Long> getDislikedPublicationIdsByUsername(String username);

    @Transactional(readOnly = true)
    List<Long> getBookmarkedPublicationIdsByUsername(String username);

    // ====== REACTION USERS ======

    @Transactional(readOnly = true)
    List<smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO> getLikedUsers(Long publicationId);

    @Transactional(readOnly = true)
    List<smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO> getDislikedUsers(Long publicationId);
}