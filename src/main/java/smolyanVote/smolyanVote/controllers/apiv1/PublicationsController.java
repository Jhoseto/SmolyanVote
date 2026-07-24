package smolyanVote.smolyanVote.controllers.apiv1;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.apache.tika.Tika;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.PublicationRepository;
import smolyanVote.smolyanVote.repositories.PublicationRepository;
import smolyanVote.smolyanVote.services.interfaces.PublicationDetailService;
import smolyanVote.smolyanVote.services.interfaces.PublicationLinkMetadataService;
import smolyanVote.smolyanVote.services.interfaces.PublicationLinkValidationService;
import smolyanVote.smolyanVote.services.interfaces.PublicationService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.serviceImpl.ImageCloudinaryServiceImpl;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationRequestDTO;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationResponseDTO;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.ApiMessageResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.ImageUploadResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.LinkPreviewResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.PublicationBookmarkResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.PublicationReactionResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.PublicationShareResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.PublicationsPageResponse;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Read endpoints for the publications feed + detail, plus create/upload/link-preview
 * for the composer (Next.js frontend, MODERN_FRONTEND_PLAN.md Фаза 4). Routing + request
 * param normalization only — filtering lives in {@link PublicationService#findWithFilters},
 * per-item shaping (view increment, like/bookmark/owner flags) lives in
 * {@link PublicationDetailService}, unchanged from the legacy Thymeleaf controller.
 */
@RestController
@RequestMapping("/api/v1/publications")
public class PublicationsController {

    private static final List<String> ALLOWED_IMAGE_MIME_TYPES =
            List.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS =
            List.of(".jpg", ".jpeg", ".png", ".gif", ".webp");
    private static final long MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
    private static final int MAX_PUBLICATIONS_PER_HOUR = 5;

    private final PublicationService publicationService;
    private final PublicationDetailService publicationDetailService;
    private final UserService userService;
    private final ImageCloudinaryServiceImpl imageCloudinaryService;
    private final PublicationLinkValidationService linkValidationService;
    private final PublicationLinkMetadataService linkMetadataService;
    private final PublicationRepository publicationRepository;
    private final Tika tika = new Tika();

    public PublicationsController(PublicationService publicationService,
                                        PublicationDetailService publicationDetailService,
                                        UserService userService,
                                        ImageCloudinaryServiceImpl imageCloudinaryService,
                                        PublicationLinkValidationService linkValidationService,
                                        PublicationLinkMetadataService linkMetadataService,
                                        PublicationRepository publicationRepository) {
        this.publicationService = publicationService;
        this.publicationDetailService = publicationDetailService;
        this.userService = userService;
        this.imageCloudinaryService = imageCloudinaryService;
        this.linkValidationService = linkValidationService;
        this.linkMetadataService = linkMetadataService;
        this.publicationRepository = publicationRepository;
    }

    @GetMapping
    public ResponseEntity<PublicationsPageResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "published") String status,
            @RequestParam(required = false) String time,
            @RequestParam(defaultValue = "date-desc") String sort,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String userIds,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication auth) {

        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);

        List<Long> authorIds = parseUserIds(userIds);
        Pageable pageable = PageRequest.of(page, size, resolveSort(sort));

        Page<PublicationEntity> entities = publicationService.findWithFilters(
                cleanParam(search), cleanParam(category), cleanParam(status),
                cleanParam(time), cleanParam(author), authorIds, pageable, auth);

        Page<PublicationResponseDTO> dtoPage =
                entities.map(pub -> publicationDetailService.buildPublicationResponseDTO(pub, auth));

        return ResponseEntity.ok(PublicationsPageResponse.from(dtoPage));
    }

    /**
     * Bookmarked publications for the current user (paginated).
     * Registered before {@code /{id}} so "bookmarked" is not parsed as an id.
     */
    @GetMapping("/bookmarked")
    public ResponseEntity<?> bookmarked(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication auth) {
        UserEntity user = currentUser(auth);
        if (user == null) {
            return unauthenticated();
        }

        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 50);

        List<Long> allIds = publicationService.getBookmarkedPublicationIdsByUsername(user.getUsername());
        int total = allIds.size();
        int from = Math.min(page * size, total);
        int to = Math.min(from + size, total);
        List<Long> pageIds = allIds.subList(from, to);

        List<PublicationResponseDTO> content = pageIds.stream()
                .map(publicationService::findById)
                .filter(Objects::nonNull)
                .map(pub -> publicationDetailService.buildPublicationResponseDTO(pub, auth))
                .collect(Collectors.toList());

        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return ResponseEntity.ok(new PublicationsPageResponse(
                content, page, size, total, totalPages, page + 1 < totalPages, page > 0));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, Authentication auth) {
        try {
            return ResponseEntity.ok(publicationDetailService.getPublicationDetail(id, auth));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error(e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiMessageResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody PublicationRequestDTO request, Authentication auth) {
        UserEntity user = currentUser(auth);
        if (user == null) {
            return unauthenticated();
        }
        if (request.getCategory() == null) {
            return ResponseEntity.badRequest().body(ApiMessageResponse.error("Изберете категория."));
        }

        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        if (publicationRepository.countRecentPostsByAuthor(user, oneHourAgo) >= MAX_PUBLICATIONS_PER_HOUR) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiMessageResponse.error(
                            "Достигнахте лимита от " + MAX_PUBLICATIONS_PER_HOUR + " публикации на час. Опитайте по-късно."));
        }

        PublicationEntity created = publicationService.create(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(publicationDetailService.buildPublicationResponseDTO(created, auth));
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(@RequestParam("image") MultipartFile image, Authentication auth) {
        UserEntity user = currentUser(auth);
        if (user == null) {
            return unauthenticated();
        }

        try {
            validateImage(image);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiMessageResponse.error(e.getMessage()));
        }

        String url = imageCloudinaryService.savePublicationImage(image, user.getUsername());
        return ResponseEntity.ok(ImageUploadResponse.ok(url));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody PublicationRequestDTO request,
                                     Authentication auth) {
        PublicationEntity publication = publicationService.findById(id);
        if (publication == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Публикацията не е намерена."));
        }
        if (!publicationService.canEditPublication(publication, auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiMessageResponse.error("Нямате права да редактирате тази публикация."));
        }
        if (request.getCategory() == null) {
            return ResponseEntity.badRequest().body(ApiMessageResponse.error("Изберете категория."));
        }

        PublicationEntity updated = publicationService.update(publication, request);
        return ResponseEntity.ok(publicationDetailService.buildPublicationResponseDTO(updated, auth));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        PublicationEntity publication = publicationService.findById(id);
        if (publication == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Публикацията не е намерена."));
        }
        if (!publicationService.canEditPublication(publication, auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiMessageResponse.error("Нямате права да изтриете тази публикация."));
        }

        publicationService.delete(id);
        return ResponseEntity.ok(ApiMessageResponse.ok("Публикацията е изтрита успешно."));
    }

    /** Публично (permitAll GET, като legacy) — за "Reaction users" модала на detail modal-а. */
    @GetMapping("/{id}/liked-users")
    public ResponseEntity<List<SVUserMinimalDTO>> likedUsers(@PathVariable Long id) {
        return ResponseEntity.ok(publicationService.getLikedUsers(id));
    }

    @GetMapping("/{id}/disliked-users")
    public ResponseEntity<List<SVUserMinimalDTO>> dislikedUsers(@PathVariable Long id) {
        return ResponseEntity.ok(publicationService.getDislikedUsers(id));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> like(@PathVariable Long id, Authentication auth) {
        UserEntity user = currentUser(auth);
        if (user == null) {
            return unauthenticated();
        }
        publicationService.toggleLike(id, user);
        return ResponseEntity.ok(reactionState(id, user));
    }

    @PostMapping("/{id}/dislike")
    public ResponseEntity<?> dislike(@PathVariable Long id, Authentication auth) {
        UserEntity user = currentUser(auth);
        if (user == null) {
            return unauthenticated();
        }
        publicationService.toggleDislike(id, user);
        return ResponseEntity.ok(reactionState(id, user));
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<?> bookmark(@PathVariable Long id, Authentication auth) {
        UserEntity user = currentUser(auth);
        if (user == null) {
            return unauthenticated();
        }
        boolean isBookmarked = publicationService.toggleBookmark(id, user);
        return ResponseEntity.ok(new PublicationBookmarkResponse(isBookmarked));
    }

    /** No auth required — mirrors legacy `sharePublication` (recording a share is not a sensitive action). */
    @PostMapping("/{id}/share")
    public ResponseEntity<?> share(@PathVariable Long id) {
        publicationService.incrementShareCount(id);
        return ResponseEntity.ok(new PublicationShareResponse(publicationService.getSharesCount(id)));
    }

    private PublicationReactionResponse reactionState(Long id, UserEntity user) {
        PublicationEntity publication = publicationService.findById(id);
        boolean isLiked = publication != null && publication.isLikedBy(user.getUsername());
        boolean isDisliked = publication != null && publication.isDislikedBy(user.getUsername());
        return new PublicationReactionResponse(isLiked, isDisliked,
                publicationService.getLikesCount(id), publicationService.getDislikesCount(id));
    }

    @GetMapping("/link-preview")
    public ResponseEntity<?> linkPreview(@RequestParam String url, Authentication auth) {
        if (currentUser(auth) == null) {
            return unauthenticated();
        }

        String validationError = linkValidationService.getValidationError(url);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(ApiMessageResponse.error(validationError));
        }

        String metadata = linkMetadataService.extractMetadata(url);
        return ResponseEntity.ok(new LinkPreviewResponse(true, url, metadata));
    }

    private UserEntity currentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return userService.getCurrentUser();
    }

    private ResponseEntity<?> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiMessageResponse.error("Необходим е вход в профила."));
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Не е избран файл.");
        }
        if (image.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Файлът не трябва да надвишава 10MB.");
        }

        String originalFilename = Objects.requireNonNullElse(image.getOriginalFilename(), "").toLowerCase();
        String browserType = image.getContentType();
        if (browserType == null || !ALLOWED_IMAGE_MIME_TYPES.contains(browserType)) {
            throw new IllegalArgumentException("Разрешени са само JPEG, PNG, GIF и WEBP файлове!");
        }
        if (ALLOWED_IMAGE_EXTENSIONS.stream().noneMatch(originalFilename::endsWith)) {
            throw new IllegalArgumentException("Файлът трябва да е .jpg, .jpeg, .png, .gif или .webp!");
        }
        try {
            String detectedType = tika.detect(image.getInputStream());
            if (!ALLOWED_IMAGE_MIME_TYPES.contains(detectedType)) {
                throw new IllegalArgumentException("Файлът не е валидно изображение (по съдържание)!");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Проблем при валидиране на файл: " + e.getMessage());
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiMessageResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .filter(m -> m != null && !m.isBlank())
                .findFirst()
                .orElse("Невалидна заявка.");
        return ResponseEntity.badRequest().body(ApiMessageResponse.error(message));
    }

    private List<Long> parseUserIds(String userIds) {
        if (userIds == null || userIds.trim().isEmpty()) {
            return null;
        }
        try {
            List<Long> ids = Arrays.stream(userIds.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
            return ids.isEmpty() ? null : ids;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Sort resolveSort(String sort) {
        if (sort == null) {
            return Sort.by(Sort.Direction.DESC, "created");
        }
        return switch (sort) {
            case "date-asc" -> Sort.by(Sort.Direction.ASC, "created");
            case "likes" -> Sort.by(Sort.Direction.DESC, "likesCount");
            case "dislikes" -> Sort.by(Sort.Direction.ASC, "dislikesCount");
            case "views" -> Sort.by(Sort.Direction.DESC, "viewsCount");
            case "comments" -> Sort.by(Sort.Direction.DESC, "commentsCount");
            default -> Sort.by(Sort.Direction.DESC, "created");
        };
    }

    private String cleanParam(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
