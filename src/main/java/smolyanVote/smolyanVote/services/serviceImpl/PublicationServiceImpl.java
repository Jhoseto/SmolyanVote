package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;
import smolyanVote.smolyanVote.models.enums.EventStatus;
import smolyanVote.smolyanVote.repositories.PublicationRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.PublicationService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationRequestDTO;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@Transactional
public class PublicationServiceImpl implements PublicationService {

    private final PublicationRepository publicationRepository;
    private final UserService userService;
    private final UserRepository userRepository;

    @Autowired
    public PublicationServiceImpl(PublicationRepository publicationRepository,
                                  UserService userService, UserRepository userRepository) {
        this.publicationRepository = publicationRepository;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    // ====== ОСНОВНИ CRUD ОПЕРАЦИИ ======

    @Override
    @Transactional(readOnly = true)
    public PublicationEntity findById(Long id) {
        return publicationRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public PublicationEntity create(PublicationRequestDTO request, UserEntity author) {
        PublicationEntity publication = new PublicationEntity();

        // Задаваме датите първо
        publication.setCreated(java.time.Instant.now());
        publication.setModified(java.time.Instant.now());

        publication.setTitle(request.getTitle());
        publication.setContent(request.getContent());
        publication.setCategory(request.getCategory());
        publication.setAuthor(author);

        // Set status based on request
        if ("PUBLISHED".equals(request.getStatus())) {
            publication.setStatus(EventStatus.ACTIVE);
            publication.publish(); // Sets publishedAt
        } else {
            publication.setStatus(EventStatus.DRAFT);
        }

        // Set image URL if provided
        if (request.getImageUrl() != null && !request.getImageUrl().trim().isEmpty()) {
            publication.setImageUrl(request.getImageUrl());
        }

        // Set emotion if provided
        if (request.getEmotion() != null && !request.getEmotion().trim().isEmpty()) {
            publication.setEmotion(request.getEmotion());
            publication.setEmotionText(request.getEmotionText());
        }

        publication.generateExcerpt();
        publication.calculateReadingTime();

        PublicationEntity savedPublication = publicationRepository.save(publication);

        // АКТУАЛИЗИРАМЕ БРОЯЧА НА АВТОРА
        if ("PUBLISHED".equals(request.getStatus())) {
            author.setPublicationsCount(author.getPublicationsCount() + 1);
            userRepository.save(author);
        }

        return savedPublication;
    }

    @Override
    @Transactional
    public PublicationEntity update(PublicationEntity publication, PublicationRequestDTO request) {
        publication.setTitle(request.getTitle());
        publication.setContent(request.getContent());
        publication.setCategory(request.getCategory());

        if (request.getImageUrl() != null && !request.getImageUrl().trim().isEmpty()) {
            publication.setImageUrl(request.getImageUrl());
        }

        // Update emotion
        publication.setEmotion(request.getEmotion());
        publication.setEmotionText(request.getEmotionText());

        publication.generateExcerpt();
        publication.calculateReadingTime();

        return publicationRepository.save(publication);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        PublicationEntity publication = findById(id);
        if (publication != null && publication.getStatus() == EventStatus.ACTIVE) {
            // НАМАЛЯВАМЕ БРОЯЧА НА АВТОРА
            UserEntity author = publication.getAuthor();
            author.setPublicationsCount(author.getPublicationsCount() + 1);
            userRepository.save(author);
        }

        publicationRepository.deleteById(id);
    }

    // ====== ФИЛТРИРАНЕ ======

    @Override
    @Transactional(readOnly = true)
    public Page<PublicationEntity> findWithFilters(String search, String category,
                                                   String status, String time,
                                                   String author, Pageable pageable,
                                                   Authentication auth) {
        try {
            // Конвертираме параметрите
            EventStatus eventStatus = convertStatusFilter(status);
            CategoryEnum categoryEnum = convertCategoryFilter(category);
            Instant timeFilter = calculateTimeFilter(time);
            Long authorId = calculateAuthorFilter(author, auth);

            // Използваме repository метода с филтри
            return publicationRepository.findWithFilters(
                    search, categoryEnum, eventStatus, timeFilter, authorId, pageable
            );

        } catch (Exception e) {
            // Fallback към всички активни публикации
            return publicationRepository.findByStatusWithAuthorOrderByCreatedDesc(EventStatus.ACTIVE, pageable);
        }
    }

    private EventStatus convertStatusFilter(String status) {
        if (status == null || status.isEmpty()) return null;

        switch (status.toLowerCase()) {
            case "published":
                return EventStatus.ACTIVE;
            case "review":
                return EventStatus.PENDING;
            case "draft":
                return EventStatus.DRAFT;
            default:
                return null;
        }
    }

    private CategoryEnum convertCategoryFilter(String category) {
        if (category == null || category.isEmpty()) return null;

        try {
            return CategoryEnum.valueOf(category.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private Instant calculateTimeFilter(String time) {
        if (time == null || time.isEmpty()) return null;

        Instant now = Instant.now();

        switch (time.toLowerCase()) {
            case "today":
                return LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
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

    private Long calculateAuthorFilter(String author, Authentication auth) {
        if (author == null || author.isEmpty()) return null;

        if ("me".equals(author) && auth != null) {
            UserEntity currentUser = userService.getCurrentUser();
            return currentUser != null ? currentUser.getId() : null;
        }

        return null;
    }

    // ====== СТАТИСТИКИ ======

    @Override
    @Transactional(readOnly = true)
    public long getTotalCount() {
        return publicationRepository.countByStatus(EventStatus.ACTIVE);
    }

    @Override
    @Transactional(readOnly = true)
    public long getCountByCategory(CategoryEnum category) {
        return publicationRepository.countByCategoryAndStatus(category, EventStatus.ACTIVE);
    }

    @Override
    @Transactional(readOnly = true)
    public long getTodayCount() {
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        return publicationRepository.countByCreatedAfterAndStatus(startOfDay, EventStatus.ACTIVE);
    }

    @Override
    @Transactional(readOnly = true)
    public long getWeekCount() {
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        return publicationRepository.countByCreatedAfterAndStatus(weekAgo, EventStatus.ACTIVE);
    }

    @Override
    @Transactional(readOnly = true)
    public long getMonthCount() {
        Instant monthAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        return publicationRepository.countByCreatedAfterAndStatus(monthAgo, EventStatus.ACTIVE);
    }

    // ====== ВЗАИМОДЕЙСТВИЯ (САМО USERNAME) ======

    @Override
    @Transactional
    public boolean toggleLike(Long publicationId, UserEntity user) {
        PublicationEntity publication = findById(publicationId);
        if (publication == null) return false;

        boolean isLiked = publication.isLikedBy(user.getUsername());

        if (isLiked) {
            publication.removeLike(user.getUsername());
        } else {
            publication.addLike(user.getUsername());
        }

        publicationRepository.save(publication);
        return !isLiked;
    }

    @Override
    @Transactional
    public boolean toggleBookmark(Long publicationId, UserEntity user) {
        PublicationEntity publication = findById(publicationId);
        if (publication == null) return false;

        boolean isBookmarked = publication.isBookmarkedBy(user.getUsername());

        if (isBookmarked) {
            publication.removeBookmark(user.getUsername());
        } else {
            publication.addBookmark(user.getUsername());
        }

        publicationRepository.save(publication);
        return !isBookmarked;
    }

    @Override
    @Transactional(readOnly = true)
    public int getLikesCount(Long publicationId) {
        PublicationEntity publication = findById(publicationId);
        return publication != null ? publication.getLikesCount() : 0;
    }

    @Override
    @Transactional
    public void incrementViewCount(Long publicationId) {
        PublicationEntity publication = findById(publicationId);
        if (publication != null) {
            publication.incrementViews();
            publicationRepository.save(publication);
        }
    }

    @Override
    @Transactional
    public void incrementShareCount(Long publicationId) {
        PublicationEntity publication = findById(publicationId);
        if (publication != null) {
            publication.incrementShares();
            publicationRepository.save(publication);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public int getSharesCount(Long publicationId) {
        PublicationEntity publication = findById(publicationId);
        return publication != null ? publication.getSharesCount() : 0;
    }

    @Override
    @Transactional
    public void reportPublication(Long publicationId, UserEntity user, String reason) {
        PublicationEntity publication = findById(publicationId);
        if (publication == null) return;

        // Опростено добавяне на доклад
        String currentReports = publication.getReportedByUsers();
        String newReport = "{\"userId\":" + user.getId() + ",\"username\":\"" + user.getUsername() + "\",\"reason\":\"" + reason + "\",\"timestamp\":\"" + LocalDateTime.now() + "\"}";

        if (currentReports == null || currentReports.isEmpty()) {
            publication.setReportedByUsers("[" + newReport + "]");
        } else {
            publication.setReportedByUsers(currentReports.substring(0, currentReports.length() - 1) + "," + newReport + "]");
        }

        publicationRepository.save(publication);
    }

    // ====== АКТИВНИ АВТОРИ ======

    @Override
    @Transactional(readOnly = true)
    public List<UserEntity> getActiveAuthors(int limit) {
        return publicationRepository.findActiveAuthors(limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTrendingTopics() {
        List<Object[]> results = publicationRepository.findTrendingCategories();

        return results.stream()
                .map(row -> {
                    Map<String, Object> topic = new HashMap<>();
                    topic.put("name", getCategoryDisplayName((CategoryEnum) row[0]));
                    topic.put("count", row[1]);
                    return topic;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    private String getCategoryDisplayName(CategoryEnum category) {
        if (category == null) return "Други";

        switch (category) {
            case NEWS: return "Новини";
            case MUNICIPAL: return "Общински решения";
            case INFRASTRUCTURE: return "Инфраструктура";
            case INITIATIVES: return "Граждански инициативи";
            case CULTURE: return "Културни събития";
            case OTHER: return "Други";
            default: return category.name();
        }
    }

    // ====== ПРАВА НА ДОСТЪП ======

    @Override
    @Transactional(readOnly = true)
    public boolean canViewPublication(PublicationEntity publication, Authentication auth) {
        // Публичните публикации могат да се виждат от всички
        if (publication.getStatus() == EventStatus.ACTIVE) {
            return true;
        }

        // За непубличните трябва да е логнат
        if (auth == null) {
            return false;
        }

        UserEntity user = userService.getCurrentUser();
        if (user == null) return false;

        // Авторите могат да виждат своите чернови
        return publication.getAuthor().getId().equals(user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canEditPublication(PublicationEntity publication, Authentication auth) {
        if (auth == null || publication == null) return false;

        UserEntity user = userService.getCurrentUser();
        if (user == null) return false;

        // Авторите могат да редактират своите публикации
        return publication.getAuthor().getId().equals(user.getId());
    }
}