package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SignalsCategory;
import smolyanVote.smolyanVote.models.enums.SignalsUrgencyLevel;
import smolyanVote.smolyanVote.repositories.SignalsRepository;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;
import smolyanVote.smolyanVote.services.interfaces.SignalsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
public class SignalsServiceImpl implements SignalsService {

    private final SignalsRepository signalsRepository;
    private final ImageCloudinaryService imageCloudinaryService;
    private final UserService userService;

    @Autowired
    public SignalsServiceImpl(SignalsRepository signalsRepository,
                              ImageCloudinaryService imageCloudinaryService,
                              UserService userService) {
        this.signalsRepository = signalsRepository;
        this.imageCloudinaryService = imageCloudinaryService;
        this.userService = userService;
    }

    // ====== ОСНОВНИ CRUD ОПЕРАЦИИ ======

    @Override
    @Transactional(readOnly = true)
    public SignalsEntity findById(Long id) {
        return signalsRepository.findById(id).orElse(null);
    }


    @Override
    @Transactional
    public SignalsEntity create(String title, String description, SignalsCategory category,
                                SignalsUrgencyLevel urgency, BigDecimal latitude, BigDecimal longitude,
                                MultipartFile image, UserEntity author) {

        SignalsEntity signal = new SignalsEntity( title, description, category, urgency,
                latitude, longitude, author);

        signalsRepository.save(signal);
        Long signalId = signal.getId();


        // Upload на снимка ако има такава
        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = imageCloudinaryService.saveSingleSignalImage(image, signalId);
                signal.setImageUrl(imageUrl);
            } catch (Exception e) {
                System.err.println("Error uploading image for signal: " + e.getMessage());
            }
        }
        return signal;
    }

    @Override
    @Transactional
    public SignalsEntity update(SignalsEntity signal, String title, String description,
                                SignalsCategory category, SignalsUrgencyLevel urgency, MultipartFile image) {

        signal.setTitle(title);
        signal.setDescription(description);
        signal.setCategory(category);
        signal.setUrgency(urgency);
        signal.setModified(Instant.now());

        signalsRepository.save(signal);
        Long signalId = signal.getId();

        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = imageCloudinaryService.saveSingleSignalImage(image, signalId);
                signal.setImageUrl(imageUrl);
            } catch (Exception e) {
                System.err.println("Error uploading new image for signal: " + e.getMessage());
            }
        }

        return signal;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        signalsRepository.deleteById(id);
    }

    // ====== ФИЛТРИРАНЕ И ТЪРСЕНЕ ======

    @Override
    @Transactional(readOnly = true)
    public Page<SignalsEntity> findWithFilters(String search, String category, String urgency,
                                               String timeFilter, String sort, Pageable pageable) {

        SignalsCategory categoryEnum = parseCategory(category);
        SignalsUrgencyLevel urgencyEnum = parseUrgency(urgency);
        Instant timeFilterDate = parseTimeFilter(timeFilter);

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanSort = (sort != null && !sort.trim().isEmpty()) ? sort : "newest";

        return signalsRepository.findWithFilters(cleanSearch, categoryEnum, urgencyEnum,
                timeFilterDate, cleanSort, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SignalsEntity> findByLocationBounds(Double minLat, Double maxLat,
                                                    Double minLon, Double maxLon) {
        return signalsRepository.findByLocationBounds(minLat, maxLat, minLon, maxLon);
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
    public long getCountByUrgency(SignalsUrgencyLevel urgency) {
        return signalsRepository.countByUrgency(urgency);
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
        SignalsEntity signal = findById(signalId);
        if (signal == null || signal.getLikedByUsers() == null) return false;
        return signal.getLikedByUsers().contains("\"" + username + "\"");
    }

    @Override
    @Transactional
    public void incrementViews(Long signalId) {
        SignalsEntity signal = findById(signalId);
        if (signal != null) {
            signal.setViewsCount((signal.getViewsCount() == null ? 0 : signal.getViewsCount()) + 1);
            signal.setModified(Instant.now());
            signalsRepository.save(signal);
        }
    }

    // ====== ПРАВА НА ДОСТЪП ======

    @Override
    public boolean canViewSignal(SignalsEntity signal, Authentication auth) {
        // Всички могат да виждат сигналите
        return true;
    }

    @Override
    public boolean canEditSignal(SignalsEntity signal, Authentication auth) {
        if (auth == null || signal == null) return false;

        UserEntity currentUser = userService.getCurrentUser();
        if (currentUser == null) return false;

        // Само автора или админи могат да редактират
        return signal.getAuthor().getId().equals(currentUser.getId()) ||
                currentUser.getRole().name().equals("ADMIN");
    }

    @Override
    public boolean canDeleteSignal(SignalsEntity signal, Authentication auth) {
        if (auth == null || signal == null) return false;

        UserEntity currentUser = userService.getCurrentUser();
        if (currentUser == null) return false;

        // Само автора или админи могат да изтриват
        return signal.getAuthor().getId().equals(currentUser.getId()) ||
                currentUser.getRole().name().equals("ADMIN");
    }

    // ====== ПОТРЕБИТЕЛСКИ СИГНАЛИ ======

    @Override
    @Transactional(readOnly = true)
    public Page<SignalsEntity> getSignalsByAuthor(Long authorId, Pageable pageable) {
        return signalsRepository.findByAuthorIdOrderByCreatedDesc(authorId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
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

    private SignalsUrgencyLevel parseUrgency(String urgency) {
        if (urgency == null || urgency.trim().isEmpty() || "all".equals(urgency)) {
            return null;
        }
        try {
            return SignalsUrgencyLevel.valueOf(urgency.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private Instant parseTimeFilter(String timeFilter) {
        if (timeFilter == null || timeFilter.trim().isEmpty()) {
            return null;
        }

        Instant now = Instant.now();
        return switch (timeFilter) {
            case "today" -> now.truncatedTo(ChronoUnit.DAYS);
            case "week" -> now.minus(7, ChronoUnit.DAYS);
            case "month" -> now.minus(30, ChronoUnit.DAYS);
            case "year" -> now.minus(365, ChronoUnit.DAYS);
            default -> null;
        };
    }

    private void addLike(SignalsEntity signal, String username) {
        String likedByUsers = signal.getLikedByUsers();
        if (likedByUsers == null || likedByUsers.isEmpty()) {
            signal.setLikedByUsers("[\"" + username + "\"]");
        } else {
            signal.setLikedByUsers(likedByUsers.substring(0, likedByUsers.length() - 1) + ",\"" + username + "\"]");
        }
        signal.setLikesCount((signal.getLikesCount() == null ? 0 : signal.getLikesCount()) + 1);
    }

    private void removeLike(SignalsEntity signal, String username) {
        String likedByUsers = signal.getLikedByUsers();
        if (likedByUsers == null) return;

        String userStr = "\"" + username + "\"";
        if (likedByUsers.equals("[" + userStr + "]")) {
            signal.setLikedByUsers(null);
        } else if (likedByUsers.startsWith("[" + userStr + ",")) {
            signal.setLikedByUsers(likedByUsers.replace("[" + userStr + ",", "["));
        } else if (likedByUsers.endsWith("," + userStr + "]")) {
            signal.setLikedByUsers(likedByUsers.replace("," + userStr + "]", "]"));
        } else {
            signal.setLikedByUsers(likedByUsers.replace("," + userStr + ",", ","));
        }
        signal.setLikesCount(Math.max(0, (signal.getLikesCount() == null ? 0 : signal.getLikesCount()) - 1));
    }
}