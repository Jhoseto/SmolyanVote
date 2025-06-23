package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationRequestDTO;

import java.util.List;
import java.util.Map;

public interface PublicationService {

    // ====== ОСНОВНИ CRUD ОПЕРАЦИИ ======

    PublicationEntity findById(Long id);
    PublicationEntity create(PublicationRequestDTO request, UserEntity author);
    PublicationEntity update(PublicationEntity publication, PublicationRequestDTO request);
    void delete(Long id);

    // ====== ФИЛТРИРАНЕ ======

    Page<PublicationEntity> findWithFilters(String search, String category, String status,
                                            String time, String author, Pageable pageable,
                                            Authentication auth);

    // ====== СТАТИСТИКИ ======

    long getTotalCount();
    long getCountByCategory(CategoryEnum category);
    long getTodayCount();
    long getWeekCount();
    long getMonthCount();

    // ====== ВЗАИМОДЕЙСТВИЯ ======

    boolean toggleLike(Long publicationId, UserEntity user);
    int getLikesCount(Long publicationId);
    void incrementViewCount(Long publicationId);
    void incrementShareCount(Long publicationId);
    int getSharesCount(Long publicationId);
    void reportPublication(Long publicationId, UserEntity user, String reason);

    // ====== АКТИВНИ АВТОРИ И TRENDING ======

    List<UserEntity> getActiveAuthors(int limit);
    List<Map<String, Object>> getTrendingTopics();

    // ====== ПРАВА НА ДОСТЪП ======

    boolean canViewPublication(PublicationEntity publication, Authentication auth);
    boolean canEditPublication(PublicationEntity publication, Authentication auth);
}