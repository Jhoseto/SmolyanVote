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
import smolyanVote.smolyanVote.repositories.CommentVoteRepository;
import smolyanVote.smolyanVote.repositories.CommentsRepository;
import smolyanVote.smolyanVote.repositories.SignalsRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;
import smolyanVote.smolyanVote.services.interfaces.SignalsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.mappers.SignalsMapper;
import smolyanVote.smolyanVote.viewsAndDTO.SignalsDto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class SignalsServiceImpl implements SignalsService {

    private final SignalsRepository signalsRepository;
    private final ImageCloudinaryService imageCloudinaryService;
    private final UserService userService;
    private final CommentsRepository commentsRepository;
    private final CommentVoteRepository commentVoteRepository;
    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;

    @Autowired
    public SignalsServiceImpl(SignalsRepository signalsRepository,
                              ImageCloudinaryService imageCloudinaryService,
                              UserService userService,
                              CommentsRepository commentsRepository,
                              CommentVoteRepository commentVoteRepository,
                              ActivityLogService activityLogService, UserRepository userRepository) {
        this.signalsRepository = signalsRepository;
        this.imageCloudinaryService = imageCloudinaryService;
        this.userService = userService;
        this.commentsRepository = commentsRepository;
        this.commentVoteRepository = commentVoteRepository;
        this.activityLogService = activityLogService;
        this.userRepository = userRepository;
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
            details = "Title: {title}, Category: {category}, ExpirationDays: {expirationDays}", includeTitle = true, includeText = true)

    public SignalsEntity create(String title, String description, SignalsCategory category,
                                Integer expirationDays, BigDecimal latitude, BigDecimal longitude,
                                MultipartFile image, UserEntity author) {

        SignalsEntity signal = new SignalsEntity(title, description, category, expirationDays,
                latitude, longitude, author);

        signalsRepository.save(signal);
        Long signalId = signal.getId();

        // Upload на снимка ако има такава
        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = imageCloudinaryService.saveSingleSignalImage(image, signalId);
                signal.setImageUrl(imageUrl);
                signalsRepository.save(signal); // Запазваме отново с imageUrl
            } catch (Exception e) {
                System.err.println("Error uploading image for signal: " + e.getMessage());
            }
        }
        UserEntity user = userService.getCurrentUser();
        user.setSignalsCount(user.getSignalsCount() + 1);
        userRepository.save(user);

        return signal;
    }

    @Override
    @Transactional
    //@LogActivity - manual Log try/catch logic

    public SignalsEntity update(SignalsEntity signal, String title, String description,
                                SignalsCategory category, Integer expirationDays, MultipartFile image) {

        // Запазваме старите данни ПРЕДИ промяната
        String oldTitle = signal.getTitle();
        SignalsCategory oldCategory = signal.getCategory();
        Integer oldExpirationDays = signal.getExpirationDays();

        // Задаваме новите данни
        signal.setTitle(title);
        signal.setDescription(description);
        signal.setCategory(category);
        signal.setExpirationDays(expirationDays);
        signal.setModified(Instant.now());

        signalsRepository.save(signal);
        Long signalId = signal.getId();

        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = imageCloudinaryService.saveSingleSignalImage(image, signalId);
                signal.setImageUrl(imageUrl);
                signalsRepository.save(signal);
            } catch (Exception e) {
                System.err.println("Error uploading new image for signal: " + e.getMessage());
            }
        }

        // Activity logging for admin log panel СЛЕД успешната промяна
        try {
            String details = String.format("Old: \"%s\" (%s, %d дни) → New: \"%s\" (%s, %d дни)",
                    oldTitle.length() > 50 ? oldTitle.substring(0, 50) + "..." : oldTitle,
                    oldCategory.name(), oldExpirationDays,
                    title.length() > 50 ? title.substring(0, 50) + "..." : title,
                    category.name(), expirationDays);

            activityLogService.logActivity(ActivityActionEnum.EDIT_SIGNAL, userService.getCurrentUser(),
                    "SIGNAL", signal.getId(), details, null, null);
        } catch (Exception e) {
            System.err.println("Failed to log signal edit: " + e.getMessage());
        }

        return signal;
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
            UserEntity user = userService.getCurrentUser();
            user.setSignalsCount(user.getSignalsCount() - 1);
            userRepository.save(user);

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
    public Page<SignalsEntity> findWithFilters(String search, String category, boolean showExpired,
                                               String timeFilter, String sort, Pageable pageable) {

        SignalsCategory categoryEnum = parseCategory(category);
        Instant timeFilterDate = parseTimeFilter(timeFilter);

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanSort = (sort != null && !sort.trim().isEmpty()) ? sort : "newest";

        Instant now = Instant.now();
        
        // Граници на област Смолян (актуализирани според точния полигон)
        java.math.BigDecimal minLat = new java.math.BigDecimal("41.336");
        java.math.BigDecimal maxLat = new java.math.BigDecimal("41.926");
        java.math.BigDecimal minLng = new java.math.BigDecimal("24.318");
        java.math.BigDecimal maxLng = new java.math.BigDecimal("25.168");
        
        try {
            Page<SignalsEntity> results = signalsRepository.findWithFilters(cleanSearch, categoryEnum, showExpired,
                    timeFilterDate, cleanSort, now, minLat, maxLat, minLng, maxLng, pageable);

            // Принудително зареждане на author за всички сигнали
            results.getContent().forEach(signal -> {
                if (signal.getAuthor() != null) {
                    signal.getAuthor().getUsername();
                }
            });

            return results;
        } catch (Exception e) {
            // Fallback: Ако query-то не работи (напр. колоната active_until не съществува още),
            // използваме по-просто query без филтър за activeUntil
            System.err.println("Warning: Error in findWithFilters, using fallback query: " + e.getMessage());
            e.printStackTrace();
            
            // Fallback query без activeUntil филтър, но с филтър за границите на област Смолян
            // Актуализирани граници: lat: 41.336 - 41.926, lng: 24.318 - 25.168
            List<SignalsEntity> allSignals = signalsRepository.findByLocationBounds(
                    41.336, 41.926, 24.318, 25.168);
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

        // Принудително зареждане на author за всички сигнали
        results.forEach(signal -> {
            if (signal.getAuthor() != null) {
                signal.getAuthor().getUsername();
            }
        });

        return results;
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
}