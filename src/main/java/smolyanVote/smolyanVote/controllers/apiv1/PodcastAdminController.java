package smolyanVote.smolyanVote.controllers.apiv1;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.PodcastEpisodeEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.services.interfaces.NotificationService;
import smolyanVote.smolyanVote.services.interfaces.PodcastService;
import smolyanVote.smolyanVote.services.interfaces.SubscriptionService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.PodcastEpisodeDTO;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.ApiMessageResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.CreatePodcastEpisodeRequest;

import java.net.URI;

/**
 * Admin-only podcast episode management for the Next.js frontend
 * ({@code /api/v1/podcast/**}). Public reads live in the legacy
 * {@link smolyanVote.smolyanVote.controllers.PodcastController} under
 * {@code /api/podcast/**} (permitAll, outside the JWT filter). Restricted to
 * {@code /api/v1} so JWT auth + the security matcher below both apply.
 */
@RestController
@RequestMapping("/api/v1/podcast")
public class PodcastAdminController {

    private static final Logger log = LoggerFactory.getLogger(PodcastAdminController.class);
    private static final long MAX_AUDIO_BYTES = 100L * 1024 * 1024;
    private static final long MAX_IMAGE_BYTES = 8L * 1024 * 1024;

    private final PodcastService podcastService;
    private final UserService userService;
    private final SubscriptionService subscriptionService;
    private final NotificationService notificationService;

    public PodcastAdminController(PodcastService podcastService,
                                  UserService userService,
                                  SubscriptionService subscriptionService,
                                  NotificationService notificationService) {
        this.podcastService = podcastService;
        this.userService = userService;
        this.subscriptionService = subscriptionService;
        this.notificationService = notificationService;
    }

    @PostMapping(value = "/episodes", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createEpisodeJson(
            @RequestBody CreatePodcastEpisodeRequest body,
            Authentication auth) {

        ResponseEntity<?> authError = requireAdmin(auth);
        if (authError != null) {
            return authError;
        }

        String validationError = validate(
                body.title(),
                null,
                body.audioUrl(),
                null);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(ApiMessageResponse.error(validationError));
        }

        boolean published = body.isPublished() != null ? body.isPublished() : true;
        return persistNewEpisode(
                body.title().trim(),
                body.description() != null ? body.description().trim() : null,
                null,
                body.audioUrl().trim(),
                null,
                body.durationSeconds(),
                published);
    }

    @PostMapping(value = "/episodes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createEpisodeMultipart(
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) MultipartFile audioFile,
            @RequestParam(required = false) String audioUrl,
            @RequestParam(required = false) MultipartFile imageFile,
            @RequestParam(required = false) Integer durationSeconds,
            @RequestParam(defaultValue = "true") boolean isPublished,
            Authentication auth) {

        ResponseEntity<?> authError = requireAdmin(auth);
        if (authError != null) {
            return authError;
        }

        String validationError = validate(title, audioFile, audioUrl, imageFile);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(ApiMessageResponse.error(validationError));
        }

        return persistNewEpisode(
                title.trim(),
                description != null ? description.trim() : null,
                audioFile,
                audioUrl != null ? audioUrl.trim() : null,
                imageFile,
                durationSeconds,
                isPublished);
    }

    private ResponseEntity<?> persistNewEpisode(
            String title,
            String description,
            MultipartFile audioFile,
            String audioUrl,
            MultipartFile imageFile,
            Integer durationSeconds,
            boolean isPublished) {
        try {
            PodcastEpisodeEntity created = podcastService.createEpisode(
                    title,
                    description,
                    audioFile,
                    audioUrl,
                    imageFile,
                    durationSeconds,
                    isPublished);

            if (isPublished) {
                try {
                    subscriptionService.sendPodcastNotificationToSubscribers(created);
                    notificationService.notifyPodcastSubscribers(created);
                } catch (Exception notifyEx) {
                    log.warn("Podcast subscriber notifications failed for episode {}: {}",
                            created.getId(), notifyEx.getMessage());
                }
            }

            return ResponseEntity.ok(new PodcastEpisodeDTO(created));
        } catch (RuntimeException e) {
            log.warn("Podcast episode create failed", e);
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(ApiMessageResponse.error("Качването на епизода се провали. Опитайте отново."));
        } catch (Exception e) {
            log.error("Unexpected podcast episode create failure", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiMessageResponse.error("Вътрешна грешка при запис на епизода."));
        }
    }

    private ResponseEntity<?> requireAdmin(Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return unauthenticated();
        }
        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiMessageResponse.error("Само администратор може да качва епизоди."));
        }
        return null;
    }

    @GetMapping("/episodes/all")
    public ResponseEntity<?> listAllEpisodes(Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return unauthenticated();
        }
        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiMessageResponse.error("Само администратор."));
        }
        return ResponseEntity.ok(
                podcastService.listAllEpisodesAdmin().stream().map(PodcastEpisodeDTO::new).toList());
    }

    @PatchMapping(value = "/episodes/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateEpisode(
            @PathVariable Long id,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String audioUrl,
            @RequestParam(required = false) Integer durationSeconds,
            @RequestParam(required = false) Boolean isPublished,
            @RequestParam(required = false) MultipartFile imageFile,
            Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return unauthenticated();
        }
        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiMessageResponse.error("Само администратор."));
        }
        if (audioUrl != null && !audioUrl.isBlank() && !isValidHttpUrl(audioUrl.trim())) {
            return ResponseEntity.badRequest()
                    .body(ApiMessageResponse.error("Линкът към аудиото трябва да започва с http:// или https://"));
        }
        try {
            PodcastEpisodeEntity updated = podcastService.updateEpisode(
                    id, title, description, audioUrl, durationSeconds, isPublished, imageFile);
            return ResponseEntity.ok(new PodcastEpisodeDTO(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiMessageResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/episodes/{id}")
    public ResponseEntity<?> deleteEpisode(@PathVariable Long id, Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return unauthenticated();
        }
        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiMessageResponse.error("Само администратор."));
        }
        try {
            podcastService.deleteEpisode(id);
            return ResponseEntity.ok(ApiMessageResponse.ok("Епизодът е изтрит."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiMessageResponse.error(e.getMessage()));
        }
    }

    private String validate(String title, MultipartFile audioFile, String audioUrl, MultipartFile imageFile) {
        if (title == null || title.trim().length() < 3) {
            return "Заглавието трябва да е поне 3 символа.";
        }
        if (title.length() > 200) {
            return "Заглавието не може да е повече от 200 символа.";
        }

        boolean hasFile = audioFile != null && !audioFile.isEmpty();
        boolean hasUrl = audioUrl != null && !audioUrl.isBlank();
        if (!hasFile && !hasUrl) {
            return "Въведете директен линк към MP3 файла (напр. от Internet Archive).";
        }
        if (hasFile) {
            if (audioFile.getSize() > MAX_AUDIO_BYTES) {
                return "Аудио файлът е по-голям от 100MB.";
            }
            String audioType = audioFile.getContentType();
            if (audioType == null || !audioType.toLowerCase().startsWith("audio/")) {
                return "Невалиден формат на аудио файла.";
            }
        }
        if (hasUrl && !isValidHttpUrl(audioUrl.trim())) {
            return "Линкът към аудиото трябва да започва с http:// или https://";
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            if (imageFile.getSize() > MAX_IMAGE_BYTES) {
                return "Корицата е по-голяма от 8MB.";
            }
            String imageType = imageFile.getContentType();
            if (imageType == null || !imageType.toLowerCase().startsWith("image/")) {
                return "Невалиден формат на корицата.";
            }
        }
        return null;
    }

    private static boolean isValidHttpUrl(String url) {
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            return scheme != null
                    && ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
                    && uri.getHost() != null
                    && !uri.getHost().isBlank();
        } catch (Exception e) {
            return false;
        }
    }

    private UserEntity currentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return userService.getCurrentUser();
    }

    private ResponseEntity<?> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiMessageResponse.error("Необходима е автентикация."));
    }
}
