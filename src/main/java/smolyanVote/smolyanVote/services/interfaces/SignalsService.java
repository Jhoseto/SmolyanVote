package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SignalsCategory;
import smolyanVote.smolyanVote.models.enums.SignalsUrgencyLevel;

import java.math.BigDecimal;
import java.util.List;

public interface SignalsService {

    // ====== ОСНОВНИ CRUD ОПЕРАЦИИ ======

    SignalsEntity findById(Long id);


    SignalsEntity create(String title, String description, SignalsCategory category,
                         SignalsUrgencyLevel urgency, BigDecimal latitude, BigDecimal longitude,
                         MultipartFile image, UserEntity author);

    SignalsEntity update(SignalsEntity signal, String title, String description,
                         SignalsCategory category, SignalsUrgencyLevel urgency, MultipartFile image);

    void delete(Long id);

    // ====== ФИЛТРИРАНЕ И ТЪРСЕНЕ ======

    Page<SignalsEntity> findWithFilters(String search, String category, String urgency,
                                        String timeFilter, String sort, Pageable pageable);

    List<SignalsEntity> findByLocationBounds(Double minLat, Double maxLat,
                                             Double minLon, Double maxLon);

    // ====== СТАТИСТИКИ ======

    long getTotalCount();
    long getCountByCategory(SignalsCategory category);
    long getCountByUrgency(SignalsUrgencyLevel urgency);
    long getTodayCount();
    long getWeekCount();

    // ====== ВЗАИМОДЕЙСТВИЯ ======

    boolean toggleLike(Long signalId, UserEntity user);
    boolean isLikedByUser(Long signalId, String username);

    @Transactional(readOnly = true)
    List<Long> getLikedSignalIdsByUser(String username);

    void incrementViews(Long signalId);

    // ====== ПРАВА НА ДОСТЪП ======

    boolean canViewSignal(SignalsEntity signal, Authentication auth);
    boolean canEditSignal(SignalsEntity signal, Authentication auth);
    boolean canDeleteSignal(SignalsEntity signal, Authentication auth);

    // ====== ПОТРЕБИТЕЛСКИ СИГНАЛИ ======

    Page<SignalsEntity> getSignalsByAuthor(Long authorId, Pageable pageable);
    long getSignalsCountByAuthor(Long authorId);
}