package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SignalsCategory;
import smolyanVote.smolyanVote.viewsAndDTO.SignalsDto;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.SignalEnrichment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface SignalsService {

    // ====== ОСНОВНИ CRUD ОПЕРАЦИИ ======

    SignalsEntity findById(Long id);


    @Transactional(readOnly = true)
    List<SignalsDto> findAllByAuthorId(Long authorId);

    SignalsEntity create(String title, String description, SignalsCategory category,
                         BigDecimal latitude, BigDecimal longitude,
                         MultipartFile image, UserEntity author);

    SignalsEntity update(SignalsEntity signal, String title, String description,
                         SignalsCategory category, MultipartFile image,
                         boolean removeImage);

    SignalsEntity moderate(SignalsEntity signal, String adminNotes, boolean markResolved, Boolean markActive, UserEntity admin);

    SignalsEntity setResolved(SignalsEntity signal, boolean markResolved, UserEntity user);

    void delete(Long id);

    // ====== ФИЛТРИРАНЕ И ТЪРСЕНЕ ======

    Page<SignalsEntity> findWithFilters(String search, String category, boolean showInactive,
                                        String timeFilter, String sort, Pageable pageable);

    List<SignalsEntity> findByLocationBounds(Double minLat, Double maxLat,
                                             Double minLon, Double maxLon);

    /** All signals in the Smolyan region bbox — for frontend dataset (client-side filter/sort). */
    List<SignalsEntity> findAllInRegion();

    // ====== СТАТИСТИКИ ======

    long getTotalCount();
    long getCountByCategory(SignalsCategory category);
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

    boolean canModerateSignal(Authentication auth);

    boolean canSetResolvedStatus(SignalsEntity signal, Authentication auth);

    long countRecentSignalsByAuthor(Long authorId, Instant since);

    // ====== ПОТРЕБИТЕЛСКИ СИГНАЛИ ======

    Page<SignalsEntity> getSignalsByAuthor(Long authorId, Pageable pageable);

    @Transactional(readOnly = true)
    long getSignalsCountByAuthor(Long authorId);

    // ====== SUBSCRIPTIONS & RESOLVED REPORTS ======

    SignalEnrichment buildEnrichment(SignalsEntity signal, UserEntity currentUser);

    java.util.Map<Long, SignalEnrichment> buildEnrichmentBatch(java.util.List<SignalsEntity> signals, UserEntity currentUser);

    boolean subscribe(Long signalId, UserEntity user);

    boolean unsubscribe(Long signalId, UserEntity user);

    SignalsEntity reportResolved(Long signalId, UserEntity user);
}