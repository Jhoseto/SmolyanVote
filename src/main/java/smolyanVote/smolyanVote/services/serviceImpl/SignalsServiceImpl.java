package smolyanVote.smolyanVote.services.serviceImpl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.models.enums.SignalsCategory;
import smolyanVote.smolyanVote.models.SignalResolvedReportEntity;
import smolyanVote.smolyanVote.models.SignalSubscriptionEntity;
import smolyanVote.smolyanVote.repositories.CommentVoteRepository;
import smolyanVote.smolyanVote.repositories.CommentsRepository;
import smolyanVote.smolyanVote.repositories.SignalResolvedReportRepository;
import smolyanVote.smolyanVote.repositories.SignalSubscriptionRepository;
import smolyanVote.smolyanVote.repositories.SignalsRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;
import smolyanVote.smolyanVote.services.interfaces.NotificationService;
import smolyanVote.smolyanVote.services.interfaces.SignalsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.mappers.SignalsMapper;
import smolyanVote.smolyanVote.viewsAndDTO.SignalsDto;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.SignalEnrichment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SignalsServiceImpl implements SignalsService {

    private final SignalsRepository signalsRepository;
    private final ImageCloudinaryService imageCloudinaryService;
    private final UserService userService;
    private final CommentsRepository commentsRepository;
    private final CommentVoteRepository commentVoteRepository;
    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;
    private final SignalSubscriptionRepository subscriptionRepository;
    private final SignalResolvedReportRepository resolvedReportRepository;
    private final NotificationService notificationService;

    private static final int RESOLVED_REPORT_ESCALATION_THRESHOLD = 2;

    @Autowired
    public SignalsServiceImpl(SignalsRepository signalsRepository,
                              ImageCloudinaryService imageCloudinaryService,
                              UserService userService,
                              CommentsRepository commentsRepository,
                              CommentVoteRepository commentVoteRepository,
                              ActivityLogService activityLogService,
                              UserRepository userRepository,
                              SignalSubscriptionRepository subscriptionRepository,
                              SignalResolvedReportRepository resolvedReportRepository,
                              NotificationService notificationService) {
        this.signalsRepository = signalsRepository;
        this.imageCloudinaryService = imageCloudinaryService;
        this.userService = userService;
        this.commentsRepository = commentsRepository;
        this.commentVoteRepository = commentVoteRepository;
        this.activityLogService = activityLogService;
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.resolvedReportRepository = resolvedReportRepository;
        this.notificationService = notificationService;
    }

    // ====== ОСНОВНИ CRUD ОПЕРАЦИИ ======

    @Override
    @Transactional(readOnly = true)
    public SignalsEntity findById(Long id) {
        SignalsEntity signal = signalsRepository.findById(id).orElse(null);

        // Принудително зареждане на lazy-loaded релации
        if (signal != null && signal.getAuthor() != null) {
            // Това ще зареди author-а в рамките на транзакцията
            signal.getAuthor().getUsername();
            signal.getAuthor().getImageUrl();
        }

        return signal;
    }


    @Override
    @Transactional(readOnly = true)
    public List<SignalsDto> findAllByAuthorId(Long authorId) {
        return signalsRepository.findAllByAuthorId(authorId)
                .stream()
                .map(SignalsMapper::toDto)
                .toList();
    }




    @Override
    @Transactional
    @LogActivity(action = ActivityActionEnum.CREATE_SIGNAL, entityType = ActivityTypeEnum.SIGNAL,
            details = "Title: {title}, Category: {category}", includeTitle = true, includeText = true)
    public SignalsEntity create(String title, String description, SignalsCategory category,
                                BigDecimal latitude, BigDecimal longitude,
                                MultipartFile image, UserEntity author) {

        SignalsEntity signal = new SignalsEntity(title, description, category,
                latitude, longitude, author);

        signalsRepository.save(signal);
        Long signalId = signal.getId();

        // Upload на снимка ако има такава
        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = imageCloudinaryService.saveSingleSignalImage(image, signalId);
                signal.setImageUrl(imageUrl);
                signalsRepository.save(signal);
            } catch (Exception e) {
                System.err.println("Error uploading image for signal: " + e.getMessage());
                // Signal is saved; client may warn user to add image via edit.
            }
        }
        UserEntity user = userService.getCurrentUser();
        user.setSignalsCount(user.getSignalsCount() + 1);
        userRepository.save(user);

        notificationService.broadcastGlobalActivity(
                "Нов граждански сигнал",
                author.getUsername() + " подаде: " + title,
                "/signals/" + signalId,
                "bi-megaphone-fill");
        return signal;
    }

    @Override
    @Transactional
    //@LogActivity - manual Log try/catch logic

    public SignalsEntity update(SignalsEntity signal, String title, String description,
                                SignalsCategory category, MultipartFile image,
                                boolean removeImage) {

        // Запазваме старите данни ПРЕДИ промяната
        String oldTitle = signal.getTitle();
        SignalsCategory oldCategory = signal.getCategory();

        // Задаваме новите данни
        signal.setTitle(title);
        signal.setDescription(description);
        signal.setCategory(category);
        signal.setModified(Instant.now());

        if (removeImage) {
            deleteSignalImageIfPresent(signal);
            signal.setImageUrl(null);
        }

        signalsRepository.save(signal);
        Long signalId = signal.getId();

        if (image != null && !image.isEmpty()) {
            try {
                deleteSignalImageIfPresent(signal);
                String imageUrl = imageCloudinaryService.saveSingleSignalImage(image, signalId);
                signal.setImageUrl(imageUrl);
                signalsRepository.save(signal);
            } catch (Exception e) {
                System.err.println("Error uploading new image for signal: " + e.getMessage());
                throw new IllegalStateException("Снимката не можа да се качи. Опитайте отново.");
            }
        }

        // Activity logging for admin log panel СЛЕД успешната промяна
        try {
            String details = String.format("Old: \"%s\" (%s) → New: \"%s\" (%s)",
                    oldTitle.length() > 50 ? oldTitle.substring(0, 50) + "..." : oldTitle,
                    oldCategory.name(),
                    title.length() > 50 ? title.substring(0, 50) + "..." : title,
                    category.name());

            activityLogService.logActivity(ActivityActionEnum.EDIT_SIGNAL, userService.getCurrentUser(),
                    "SIGNAL", signal.getId(), details, null, null);
        } catch (Exception e) {
            System.err.println("Failed to log signal edit: " + e.getMessage());
        }

        return signal;
    }

    @Override
    @Transactional
    public SignalsEntity moderate(SignalsEntity signal, String adminNotes, boolean markResolved, Boolean markActive, UserEntity admin) {
        if (adminNotes != null) {
            signal.setAdminNotes(adminNotes.trim().isEmpty() ? null : adminNotes.trim());
        }
        if (markActive != null) {
            signal.setActive(markActive);
        }
        boolean wasResolved = signal.getResolvedBy() != null;
        signal.setResolvedBy(markResolved ? admin : null);
        signal.setModified(Instant.now());
        signalsRepository.save(signal);

        if (markResolved && !wasResolved) {
            notificationService.broadcastGlobalActivity(
                    "Сигналът е решен",
                    "„" + signal.getTitle() + "“ бе отбелязан като решен",
                    "/signals/" + signal.getId(),
                    "bi-check-circle-fill");
            notificationService.notifySignalSubscribers(signal, admin, "SIGNAL_RESOLVED",
                    "Сигналът „" + signal.getTitle() + "“ бе отбелязан като решен.");
        }
        return signal;
    }

    @Override
    @Transactional
    public SignalsEntity setResolved(SignalsEntity signal, boolean markResolved, UserEntity user) {
        boolean wasResolved = signal.getResolvedBy() != null;
        signal.setResolvedBy(markResolved ? user : null);
        signal.setModified(Instant.now());
        signalsRepository.save(signal);

        if (markResolved && !wasResolved) {
            notificationService.broadcastGlobalActivity(
                    "Сигналът е решен",
                    "„" + signal.getTitle() + "“ бе отбелязан като решен",
                    "/signals/" + signal.getId(),
                    "bi-check-circle-fill");
            notificationService.notifySignalSubscribers(signal, user, "SIGNAL_RESOLVED",
                    "Сигналът „" + signal.getTitle() + "“ бе отбелязан като решен.");
        }
        return signal;
    }

    @Override
    @Transactional(readOnly = true)
    public long countRecentSignalsByAuthor(Long authorId, Instant since) {
        return signalsRepository.countByAuthorIdAndCreatedAfter(authorId, since);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        try {
            // ПЪРВО ИЗТРИВАМЕ COMMENT VOTES
            try {
                List<CommentsEntity> comments = commentsRepository.findBySignalId(id);

                for (CommentsEntity comment : comments) {
                    // Изтриваме всички votes за този коментар
                    commentVoteRepository.deleteAllByCommentId(comment.getId());
                }
            } catch (Exception e) {
                System.out.println("ERROR deleting comment votes: " + e.getMessage());
                e.printStackTrace();
                // Продължаваме, за да не блокираме изтриването
            }

            // ВТОРО ИЗТРИВАМЕ КОМЕНТАРИТЕ
            try {
                commentsRepository.deleteAllBySignal_Id(id);
            } catch (Exception e) {
                System.out.println("ERROR deleting comments: " + e.getMessage());
                e.printStackTrace();
            }

            // Запазваме данните ПРЕДИ изтриване
            SignalsEntity signal = findById(id);
            String deletedTitle = signal != null ? signal.getTitle() : "Unknown";
            String authorName = signal != null && signal.getAuthor() != null ?
                    signal.getAuthor().getUsername() : "Unknown";
            UserEntity author = signal != null ? signal.getAuthor() : null;

            signalsRepository.deleteById(id);

            // Activity logging for admin log panel СЛЕД успешното изтриване
            try {
                String details = String.format("Deleted signal: \"%s\" (Author: %s)",
                        deletedTitle.length() > 100 ? deletedTitle.substring(0, 100) + "..." : deletedTitle,
                        authorName);

                activityLogService.logActivity(ActivityActionEnum.DELETE_SIGNAL, userService.getCurrentUser(),
                        "SIGNAL", id, details, null, null);
            } catch (Exception e) {
                System.err.println("Failed to log signal deletion: " + e.getMessage());
            }
            if (author != null) {
                author.setSignalsCount(Math.max(0, author.getSignalsCount() - 1));
                userRepository.save(author);
            }

        } catch (Exception e) {
            System.err.println("FATAL ERROR in delete signal service:");
            System.err.println("Exception type: " + e.getClass().getName());
            System.err.println("Exception message: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw за да стигне до контролера
        }
    }

    // ====== ФИЛТРИРАНЕ И ТЪРСЕНЕ ======

    @Override
    @Transactional(readOnly = true)
    public Page<SignalsEntity> findWithFilters(String search, String category, boolean showInactive,
                                               String timeFilter, String sort, Pageable pageable) {

        SignalsCategory categoryEnum = parseCategory(category);
        Instant timeFilterDate = parseTimeFilter(timeFilter);

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanSort = (sort != null && !sort.trim().isEmpty()) ? sort : "newest";
        
        // Граници на област Смолян (актуализирани според точния полигон)
        java.math.BigDecimal minLat = new java.math.BigDecimal("41.336");
        java.math.BigDecimal maxLat = new java.math.BigDecimal("41.926");
        java.math.BigDecimal minLng = new java.math.BigDecimal("24.318");
        java.math.BigDecimal maxLng = new java.math.BigDecimal("25.168");
        
        try {
            Page<SignalsEntity> results = signalsRepository.findWithFilters(cleanSearch, categoryEnum, showInactive,
                    timeFilterDate, cleanSort, minLat, maxLat, minLng, maxLng, pageable);

            // Принудително зареждане на author за всички сигнали
            results.getContent().forEach(signal -> {
                if (signal.getAuthor() != null) {
                    signal.getAuthor().getUsername();
                }
            });

            return results;
        } catch (Exception e) {
            System.err.println("Warning: findWithFilters failed, using location-bounds fallback: " + e.getMessage());
            e.printStackTrace();

            List<SignalsEntity> allSignals = signalsRepository.findByLocationBounds(
                            41.336, 41.926, 24.318, 25.168)
                    .stream()
                    .filter(s -> showInactive || s.isActive())
                    .toList();
            // Конвертираме в Page
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), allSignals.size());
            List<SignalsEntity> pageContent = allSignals.subList(start, end);
            Page<SignalsEntity> results = new org.springframework.data.domain.PageImpl<>(
                    pageContent, pageable, allSignals.size());
            
            // Принудително зареждане на author
            results.getContent().forEach(signal -> {
                if (signal.getAuthor() != null) {
                    signal.getAuthor().getUsername();
                }
            });
            
            return results;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SignalsEntity> findByLocationBounds(Double minLat, Double maxLat,
                                                    Double minLon, Double maxLon) {
        List<SignalsEntity> results = signalsRepository.findByLocationBounds(minLat, maxLat, minLon, maxLon);

        // Eager-touch lazy associations while the read transaction is open (open-in-view=false in prod).
        results.forEach(signal -> {
            if (signal.getAuthor() != null) {
                signal.getAuthor().getUsername();
            }
            if (signal.getResolvedBy() != null) {
                signal.getResolvedBy().getUsername();
            }
        });

        return results;
    }

    private static final double SMOLYAN_MIN_LAT = 41.336;
    private static final double SMOLYAN_MAX_LAT = 41.926;
    private static final double SMOLYAN_MIN_LNG = 24.318;
    private static final double SMOLYAN_MAX_LNG = 25.168;

    @Override
    @Transactional(readOnly = true)
    public List<SignalsEntity> findAllInRegion() {
        return findByLocationBounds(SMOLYAN_MIN_LAT, SMOLYAN_MAX_LAT, SMOLYAN_MIN_LNG, SMOLYAN_MAX_LNG);
    }

    // ====== СТАТИСТИКИ ======

    @Override
    @Transactional(readOnly = true)
    public long getTotalCount() {
        return signalsRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long getCountByCategory(SignalsCategory category) {
        return signalsRepository.countByCategory(category);
    }

    @Override
    @Transactional(readOnly = true)
    public long getTodayCount() {
        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant endOfDay = startOfDay.plus(1, ChronoUnit.DAYS);
        return signalsRepository.countByCreatedBetween(startOfDay, endOfDay);
    }

    @Override
    @Transactional(readOnly = true)
    public long getWeekCount() {
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        return signalsRepository.countByCreatedAfter(weekAgo);
    }

    // ====== ВЗАИМОДЕЙСТВИЯ ======

    @Override
    @Transactional
    public boolean toggleLike(Long signalId, UserEntity user) {
        SignalsEntity signal = findById(signalId);
        if (signal == null) return false;

        boolean isLiked = isLikedByUser(signalId, user.getUsername());

        if (isLiked) {
            // Remove like
            removeLike(signal, user.getUsername());
        } else {
            // Add like
            addLike(signal, user.getUsername());
        }

        signalsRepository.save(signal);
        return !isLiked;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isLikedByUser(Long signalId, String username) {
        try {
            SignalsEntity signal = findById(signalId);
            if (signal == null || signal.getLikedByUsers() == null || signal.getLikedByUsers().trim().isEmpty()) {
                return false;
            }

            // Parse JSON array and check if username exists
            ObjectMapper mapper = new ObjectMapper();
            List<String> likedUsers = mapper.readValue(signal.getLikedByUsers(),
                    mapper.getTypeFactory().constructCollectionType(List.class, String.class));

            return likedUsers.contains(username);

        } catch (Exception e) {
            System.err.println("Error checking if user liked signal: " + e.getMessage());
            return false;
        }
    }


    @Override
    @Transactional(readOnly = true)
    public List<Long> getLikedSignalIdsByUser(String username) {
        try {
            List<SignalsEntity> allSignals = signalsRepository.findAll();
            List<Long> likedSignalIds = new ArrayList<>();

            ObjectMapper mapper = new ObjectMapper();

            for (SignalsEntity signal : allSignals) {
                if (signal.getLikedByUsers() != null && !signal.getLikedByUsers().trim().isEmpty()) {
                    try {
                        List<String> likedUsers = mapper.readValue(signal.getLikedByUsers(),
                                mapper.getTypeFactory().constructCollectionType(List.class, String.class));

                        if (likedUsers.contains(username)) {
                            likedSignalIds.add(signal.getId());
                        }
                    } catch (Exception e) {
                        // Skip this signal if JSON parsing fails
                    }
                }
            }

            return likedSignalIds;

        } catch (Exception e) {
            System.err.println("Error getting liked signal IDs: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    @Transactional
    public void incrementViews(Long signalId) {
        SignalsEntity signal = findById(signalId);
        if (signal != null) {
            signal.setViewsCount((signal.getViewsCount() == null ? 0 : signal.getViewsCount()) + 1);
            signal.setModified(Instant.now());
            signalsRepository.save(signal);

            // ✅ ЛОГИРАНЕ НА VIEW_SIGNAL
            try {
                UserEntity currentUser = userService.getCurrentUser();
                if (currentUser != null) {
                    String details = String.format("Viewed signal: \"%s\"", 
                            signal.getTitle() != null && signal.getTitle().length() > 100 
                                    ? signal.getTitle().substring(0, 100) + "..." 
                                    : signal.getTitle());
                    activityLogService.logActivity(ActivityActionEnum.VIEW_SIGNAL, currentUser,
                            ActivityTypeEnum.SIGNAL.name(), signalId, details, null, null);
                }
            } catch (Exception e) {
                System.err.println("Failed to log VIEW_SIGNAL activity: " + e.getMessage());
            }
        }
    }

    // ====== ПРАВА НА ДОСТЪП ======

    @Override
    @Transactional(readOnly = true)
    public boolean canViewSignal(SignalsEntity signal, Authentication auth) {
        // Всички могат да виждат сигналите
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canEditSignal(SignalsEntity signal, Authentication auth) {
        if (auth == null || signal == null) return false;

        UserEntity currentUser = userService.getCurrentUser();
        if (currentUser == null) return false;

        // Принудително зареждане на author
        if (signal.getAuthor() != null) {
            signal.getAuthor().getId();
        }

        // Само автора или админи могат да редактират
        return signal.getAuthor().getId().equals(currentUser.getId()) ||
                currentUser.getRole().name().equals("ADMIN");
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canDeleteSignal(SignalsEntity signal, Authentication auth) {
        if (auth == null || signal == null) return false;

        UserEntity currentUser = userService.getCurrentUser();
        if (currentUser == null) return false;

        // Принудително зареждане на author
        if (signal.getAuthor() != null) {
            signal.getAuthor().getId();
        }

        // Само автора или админи могат да изтриват
        return signal.getAuthor().getId().equals(currentUser.getId()) ||
                currentUser.getRole().name().equals("ADMIN");
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canModerateSignal(Authentication auth) {
        if (auth == null) return false;
        UserEntity currentUser = userService.getCurrentUser();
        return currentUser != null && "ADMIN".equals(currentUser.getRole().name());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canSetResolvedStatus(SignalsEntity signal, Authentication auth) {
        if (auth == null || signal == null) return false;

        UserEntity currentUser = userService.getCurrentUser();
        if (currentUser == null) return false;

        if ("ADMIN".equals(currentUser.getRole().name())) return true;

        if (signal.getAuthor() != null) {
            signal.getAuthor().getId();
            return signal.getAuthor().getId().equals(currentUser.getId());
        }
        return false;
    }

    // ====== ПОТРЕБИТЕЛСКИ СИГНАЛИ ======

    @Override
    @Transactional(readOnly = true)
    public Page<SignalsEntity> getSignalsByAuthor(Long authorId, Pageable pageable) {
        Page<SignalsEntity> results = signalsRepository.findByAuthorIdOrderByCreatedDesc(authorId, pageable);

        // Принудително зареждане на author за всички сигнали
        results.getContent().forEach(signal -> {
            if (signal.getAuthor() != null) {
                signal.getAuthor().getUsername();
            }
        });

        return results;
    }

    @Transactional(readOnly = true)
    @Override
    public long getSignalsCountByAuthor(Long authorId) {
        return signalsRepository.countByAuthorId(authorId);
    }

    // ====== SUBSCRIPTIONS & RESOLVED REPORTS ======

    @Override
    @Transactional(readOnly = true)
    public SignalEnrichment buildEnrichment(SignalsEntity signal, UserEntity currentUser) {
        Map<Long, SignalEnrichment> batch = buildEnrichmentBatch(List.of(signal), currentUser);
        return batch.getOrDefault(signal.getId(), SignalEnrichment.guest());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, SignalEnrichment> buildEnrichmentBatch(List<SignalsEntity> signals, UserEntity currentUser) {
        Map<Long, SignalEnrichment> result = new HashMap<>();
        if (signals == null || signals.isEmpty()) {
            return result;
        }

        if (currentUser == null) {
            for (SignalsEntity signal : signals) {
                result.put(signal.getId(), enrichmentForGuest(signal));
            }
            return result;
        }

        Long userId = currentUser.getId();
        Set<Long> subscribedIds = subscriptionRepository.findByUserId(userId).stream()
                .map(s -> s.getSignal().getId())
                .collect(Collectors.toSet());
        Set<Long> reportedIds = resolvedReportRepository.findByUserId(userId).stream()
                .map(r -> r.getSignal().getId())
                .collect(Collectors.toSet());
        boolean isAdmin = currentUser.getRole() != null && "ADMIN".equals(currentUser.getRole().name());
        String username = currentUser.getUsername();

        for (SignalsEntity signal : signals) {
            int count = signal.getResolvedReportCount() != null ? signal.getResolvedReportCount() : 0;
            result.put(signal.getId(), new SignalEnrichment(
                    isLikedByUser(signal.getId(), username),
                    subscribedIds.contains(signal.getId()),
                    reportedIds.contains(signal.getId()),
                    count,
                    userId,
                    isAdmin));
        }
        return result;
    }

    @Override
    @Transactional
    public boolean subscribe(Long signalId, UserEntity user) {
        SignalsEntity signal = findById(signalId);
        if (signal == null || user == null) {
            throw new IllegalArgumentException("Invalid signal or user");
        }
        if (subscriptionRepository.existsByUserIdAndSignalId(user.getId(), signalId)) {
            return true;
        }
        subscriptionRepository.save(new SignalSubscriptionEntity(user, signal));
        return true;
    }

    @Override
    @Transactional
    public boolean unsubscribe(Long signalId, UserEntity user) {
        if (user == null) {
            throw new IllegalArgumentException("User required");
        }
        subscriptionRepository.deleteByUserIdAndSignalId(user.getId(), signalId);
        return false;
    }

    @Override
    @Transactional
    public SignalsEntity reportResolved(Long signalId, UserEntity user) {
        SignalsEntity signal = findById(signalId);
        if (signal == null) {
            throw new IllegalArgumentException("Signal not found");
        }
        if (user == null) {
            throw new IllegalArgumentException("User required");
        }
        if (signal.getResolvedBy() != null) {
            throw new IllegalStateException("Сигналът вече е отбелязан като решен.");
        }
        if (resolvedReportRepository.existsByUserIdAndSignalId(user.getId(), signalId)) {
            throw new IllegalStateException("Вече сте докладвали този сигнал като решен.");
        }

        resolvedReportRepository.save(new SignalResolvedReportEntity(user, signal));
        int count = (signal.getResolvedReportCount() != null ? signal.getResolvedReportCount() : 0) + 1;
        signal.setResolvedReportCount(count);
        signal.setModified(Instant.now());

        boolean shouldEscalate = count >= RESOLVED_REPORT_ESCALATION_THRESHOLD
                && !Boolean.TRUE.equals(signal.getResolvedReportsEscalated());
        if (shouldEscalate) {
            signal.setResolvedReportsEscalated(true);
            notificationService.notifyAdminsSignalResolvedReports(signal, count);
        }

        signalsRepository.save(signal);
        return signal;
    }

    private SignalEnrichment enrichmentForGuest(SignalsEntity signal) {
        int count = signal.getResolvedReportCount() != null ? signal.getResolvedReportCount() : 0;
        return new SignalEnrichment(false, false, false, count, null, false);
    }

    // ====== ПОМОЩНИ МЕТОДИ ======

    private SignalsCategory parseCategory(String category) {
        if (category == null || category.trim().isEmpty() || "all".equals(category)) {
            return null;
        }
        try {
            return SignalsCategory.valueOf(category.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private Instant parseTimeFilter(String timeFilter) {
        if (timeFilter == null || timeFilter.trim().isEmpty() || "all".equals(timeFilter)) {
            return null;
        }

        Instant now = Instant.now();

        switch (timeFilter.toLowerCase()) {
            case "today":
                return now.truncatedTo(ChronoUnit.DAYS);
            case "yesterday":
                return now.minus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);
            case "week":
                return now.minus(7, ChronoUnit.DAYS);
            case "month":
                return now.minus(30, ChronoUnit.DAYS);
            case "year":
                return now.minus(365, ChronoUnit.DAYS);
            default:
                return null;
        }
    }

    // Помощни методи за likes
    private void addLike(SignalsEntity signal, String username) {
        try {
            List<String> likedUsers = new ArrayList<>();

            if (signal.getLikedByUsers() != null && !signal.getLikedByUsers().trim().isEmpty()) {
                ObjectMapper mapper = new ObjectMapper();
                likedUsers = mapper.readValue(signal.getLikedByUsers(),
                        mapper.getTypeFactory().constructCollectionType(List.class, String.class));
            }

            if (!likedUsers.contains(username)) {
                likedUsers.add(username);
                ObjectMapper mapper = new ObjectMapper();
                signal.setLikedByUsers(mapper.writeValueAsString(likedUsers));
                signal.setLikesCount((signal.getLikesCount() == null ? 0 : signal.getLikesCount()) + 1);
            }

        } catch (Exception e) {
            System.err.println("Error adding like: " + e.getMessage());
        }
    }

    private void removeLike(SignalsEntity signal, String username) {
        try {
            if (signal.getLikedByUsers() == null || signal.getLikedByUsers().trim().isEmpty()) {
                return;
            }

            ObjectMapper mapper = new ObjectMapper();
            List<String> likedUsers = mapper.readValue(signal.getLikedByUsers(),
                    mapper.getTypeFactory().constructCollectionType(List.class, String.class));

            if (likedUsers.remove(username)) {
                signal.setLikedByUsers(mapper.writeValueAsString(likedUsers));
                signal.setLikesCount(Math.max(0, (signal.getLikesCount() == null ? 0 : signal.getLikesCount()) - 1));
            }

        } catch (Exception e) {
            System.err.println("Error removing like: " + e.getMessage());
        }
    }

    private void deleteSignalImageIfPresent(SignalsEntity signal) {
        String imageUrl = signal.getImageUrl();
        if (imageUrl != null && !imageUrl.isBlank()) {
            imageCloudinaryService.deleteImage(imageUrl);
        }
    }
}