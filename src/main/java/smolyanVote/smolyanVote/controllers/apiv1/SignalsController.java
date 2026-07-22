package smolyanVote.smolyanVote.controllers.apiv1;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SignalsCategory;
import smolyanVote.smolyanVote.services.interfaces.SignalsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.utils.SignalBoostRateLimiter;
import smolyanVote.smolyanVote.utils.SmolyanRegionValidator;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.ApiMessageResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.SignalEnrichment;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.SignalReactionResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.SignalResponseDTO;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Read/write JSON API за Next.js картата на сигналите ({@code /api/v1/signals}).
 * Legacy session HTML/REST живее в {@code LegacySignalsController}.
 * JWT auth: {@code /api/v1/**} е в {@code JwtAuthenticationFilter#shouldNotFilter}.
 * Бизнес логиката е в {@link SignalsService} — тук е само routing + DTO mapping.
 */
@RestController
@RequestMapping("/api/v1/signals")
public class SignalsController {

    private static final double SMOLYAN_MIN_LAT = 41.336;
    private static final double SMOLYAN_MAX_LAT = 41.926;
    private static final double SMOLYAN_MIN_LNG = 24.318;
    private static final double SMOLYAN_MAX_LNG = 25.168;

    private static final int MAX_SIGNALS_PER_HOUR = 5;

    private final SignalsService signalsService;
    private final UserService userService;
    private final SignalBoostRateLimiter boostRateLimiter;

    public SignalsController(SignalsService signalsService, UserService userService,
                             SignalBoostRateLimiter boostRateLimiter) {
        this.signalsService = signalsService;
        this.userService = userService;
        this.boostRateLimiter = boostRateLimiter;
    }

    /** Full region dataset — frontend filters/sorts client-side (one fetch). */
    @GetMapping("/dataset")
    public ResponseEntity<List<SignalResponseDTO>> dataset(Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        List<SignalsEntity> signals = signalsService.findAllInRegion();
        var enrichmentMap = signalsService.buildEnrichmentBatch(signals, currentUser);
        List<SignalResponseDTO> result = signals.stream()
                .map(signal -> SignalResponseDTO.from(signal,
                        enrichmentMap.getOrDefault(signal.getId(), SignalEnrichment.guest())))
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<SignalResponseDTO>> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "false") boolean showExpired,
            @RequestParam(defaultValue = "") String sort,
            @RequestParam(defaultValue = "") String time,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            Authentication auth) {

        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 100);

        Pageable pageable = PageRequest.of(page, size);
        Page<SignalsEntity> signalsPage = signalsService.findWithFilters(search, category, showExpired, time, sort, pageable);

        UserEntity currentUser = currentUser(auth);
        List<SignalResponseDTO> result = signalsPage.getContent().stream()
                .map(signal -> toDto(signal, currentUser))
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, Authentication auth) {
        SignalsEntity signal = signalsService.findById(id);
        if (signal == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Сигналът не е намерен."));
        }

        UserEntity currentUser = currentUser(auth);
        return ResponseEntity.ok(toDto(signal, currentUser));
    }

    /** Record a view — called once per session from the frontend. */
    @PostMapping("/{id}/view")
    public ResponseEntity<?> recordView(@PathVariable Long id) {
        SignalsEntity signal = signalsService.findById(id);
        if (signal == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Сигналът не е намерен."));
        }
        signalsService.incrementViews(id);
        signal = signalsService.findById(id);
        int views = signal != null && signal.getViewsCount() != null ? signal.getViewsCount() : 0;
        return ResponseEntity.ok(java.util.Map.of("viewsCount", views));
    }

    /** Boosted signal ids for the current user. */
    @GetMapping("/boosted")
    public ResponseEntity<List<Long>> boosted(Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(signalsService.getLikedSignalIdsByUser(currentUser.getUsername()));
    }

    /** @deprecated use {@link #boosted} */
    @GetMapping("/liked")
    public ResponseEntity<List<Long>> liked(Authentication auth) {
        return boosted(auth);
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String category,
            @RequestParam Integer expirationDays,
            @RequestParam String latitude,
            @RequestParam String longitude,
            @RequestParam(required = false) MultipartFile image,
            Authentication auth) {

        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return unauthenticated();
        }

        String validationError = validateSignalInput(title, description, category, expirationDays, latitude, longitude);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(ApiMessageResponse.error(validationError));
        }

        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        if (signalsService.countRecentSignalsByAuthor(currentUser.getId(), oneHourAgo) >= MAX_SIGNALS_PER_HOUR) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiMessageResponse.error("Достигнахте лимита от " + MAX_SIGNALS_PER_HOUR + " сигнала на час. Опитайте по-късно."));
        }

        SignalsCategory categoryEnum = SignalsCategory.valueOf(category.toUpperCase());
        BigDecimal lat = new BigDecimal(latitude);
        BigDecimal lon = new BigDecimal(longitude);

        try {
            SignalsEntity created = signalsService.create(title, description, categoryEnum, expirationDays, lat, lon, image, currentUser);
            return ResponseEntity.ok(toDto(created, currentUser));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(ApiMessageResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String category,
            @RequestParam Integer expirationDays,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(defaultValue = "false") boolean removeImage,
            Authentication auth) {

        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return unauthenticated();
        }

        SignalsEntity signal = signalsService.findById(id);
        if (signal == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Сигналът не е намерен."));
        }
        if (!signalsService.canEditSignal(signal, auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiMessageResponse.error("Нямате права да редактирате този сигнал."));
        }

        String validationError = validateSignalUpdateInput(title, description, category, expirationDays);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(ApiMessageResponse.error(validationError));
        }

        SignalsCategory categoryEnum = SignalsCategory.valueOf(category.toUpperCase());
        try {
            SignalsEntity updated = signalsService.update(signal, title, description, categoryEnum, expirationDays, image, removeImage);
            return ResponseEntity.ok(toDto(updated, currentUser));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(ApiMessageResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/moderate")
    public ResponseEntity<?> moderate(
            @PathVariable Long id,
            @RequestParam(required = false) String adminNotes,
            @RequestParam(defaultValue = "false") boolean markResolved,
            Authentication auth) {

        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return unauthenticated();
        }
        if (!signalsService.canModerateSignal(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiMessageResponse.error("Само администратори могат да модерират сигнали."));
        }

        SignalsEntity signal = signalsService.findById(id);
        if (signal == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Сигналът не е намерен."));
        }

        SignalsEntity updated = signalsService.moderate(signal, adminNotes, markResolved, currentUser);
        return ResponseEntity.ok(toDto(updated, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return unauthenticated();
        }

        SignalsEntity signal = signalsService.findById(id);
        if (signal == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Сигналът не е намерен."));
        }
        if (!signalsService.canDeleteSignal(signal, auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiMessageResponse.error("Нямате права да изтриете този сигнал."));
        }

        signalsService.delete(id);
        return ResponseEntity.ok(ApiMessageResponse.ok("Сигналът е изтрит успешно."));
    }

    @PostMapping("/{id}/boost")
    public ResponseEntity<?> boost(@PathVariable Long id, Authentication auth) {
        return toggleBoost(id, auth);
    }

    /** @deprecated use {@link #boost} */
    @PostMapping("/{id}/like")
    public ResponseEntity<?> like(@PathVariable Long id, Authentication auth) {
        return toggleBoost(id, auth);
    }

    private ResponseEntity<?> toggleBoost(@PathVariable Long id, Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return unauthenticated();
        }

        SignalsEntity existing = signalsService.findById(id);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Сигналът не е намерен."));
        }

        if (!boostRateLimiter.tryConsume(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiMessageResponse.error("Достигнахте лимита от 10 вдигания на приоритет на минута. Опитайте по-късно."));
        }

        boolean hasBoosted = signalsService.toggleLike(id, currentUser);
        SignalsEntity signal = signalsService.findById(id);
        if (signal == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Сигналът не е намерен."));
        }
        return ResponseEntity.ok(new SignalReactionResponse(hasBoosted,
                signal.getLikesCount() != null ? signal.getLikesCount() : 0));
    }

    @PostMapping("/{id}/subscribe")
    public ResponseEntity<?> subscribe(@PathVariable Long id, Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) return unauthenticated();
        SignalsEntity existing = signalsService.findById(id);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Сигналът не е намерен."));
        }
        signalsService.subscribe(id, currentUser);
        SignalsEntity signal = signalsService.findById(id);
        return ResponseEntity.ok(toDto(signal, currentUser));
    }

    @DeleteMapping("/{id}/subscribe")
    public ResponseEntity<?> unsubscribe(@PathVariable Long id, Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) return unauthenticated();
        SignalsEntity existing = signalsService.findById(id);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Сигналът не е намерен."));
        }
        signalsService.unsubscribe(id, currentUser);
        SignalsEntity signal = signalsService.findById(id);
        return ResponseEntity.ok(toDto(signal, currentUser));
    }

    @PostMapping("/{id}/report-resolved")
    public ResponseEntity<?> reportResolved(@PathVariable Long id, Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) return unauthenticated();
        SignalsEntity existing = signalsService.findById(id);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Сигналът не е намерен."));
        }
        try {
            SignalsEntity updated = signalsService.reportResolved(id, currentUser);
            return ResponseEntity.ok(toDto(updated, currentUser));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiMessageResponse.error(e.getMessage()));
        }
    }

    private SignalResponseDTO toDto(SignalsEntity signal, UserEntity currentUser) {
        return SignalResponseDTO.from(signal, signalsService.buildEnrichment(signal, currentUser));
    }

    private UserEntity currentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return userService.getCurrentUser();
    }

    private ResponseEntity<?> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiMessageResponse.error("Необходима е автентикация."));
    }

    private String validateSignalInput(String title, String description, String category,
                                        Integer expirationDays, String latitude, String longitude) {
        if (title == null || title.trim().length() < 5) {
            return "Заглавието трябва да е поне 5 символа";
        }
        if (title.length() > 200) {
            return "Заглавието не може да е повече от 200 символа";
        }
        if (description == null || description.trim().length() < 10) {
            return "Описанието трябва да е поне 10 символа";
        }
        if (description.length() > 2000) {
            return "Описанието не може да е повече от 2000 символа";
        }
        try {
            SignalsCategory.valueOf(category.toUpperCase());
        } catch (Exception e) {
            return "Невалидна категория";
        }
        if (expirationDays == null || (expirationDays != 1 && expirationDays != 3 && expirationDays != 7)) {
            return "Периодът на активност трябва да е 1, 3 или 7 дни";
        }
        try {
            double lat = new BigDecimal(latitude).doubleValue();
            double lon = new BigDecimal(longitude).doubleValue();
            if (lat < SMOLYAN_MIN_LAT || lat > SMOLYAN_MAX_LAT || lon < SMOLYAN_MIN_LNG || lon > SMOLYAN_MAX_LNG) {
                return "Местоположението трябва да е в границите на област Смолян";
            }
            if (!SmolyanRegionValidator.isWithinSmolyanRegion(lat, lon)) {
                return "Местоположението трябва да е в границите на област Смолян (полигон)";
            }
        } catch (NumberFormatException e) {
            return "Невалидни координати";
        }
        return null;
    }

    /**
     * Update не пипа координатите (лegacy паритет — `PUT /signals/{id}` няма lat/lng
     * params). Отделен от {@link #validateSignalInput}, за да не наследи неговия
     * bbox-check с фиктивни координати ("0","0") — реален bug в legacy
     * `SignalsController#validateSignalUpdateInput`, който щеше винаги да отхвърля
     * ъпдейти (0,0 е извън Смолян). Не го пренасяме тук.
     */
    private String validateSignalUpdateInput(String title, String description, String category, Integer expirationDays) {
        if (title == null || title.trim().length() < 5) {
            return "Заглавието трябва да е поне 5 символа";
        }
        if (title.length() > 200) {
            return "Заглавието не може да е повече от 200 символа";
        }
        if (description == null || description.trim().length() < 10) {
            return "Описанието трябва да е поне 10 символа";
        }
        if (description.length() > 2000) {
            return "Описанието не може да е повече от 2000 символа";
        }
        try {
            SignalsCategory.valueOf(category.toUpperCase());
        } catch (Exception e) {
            return "Невалидна категория";
        }
        if (expirationDays == null || (expirationDays != 1 && expirationDays != 3 && expirationDays != 7)) {
            return "Периодът на активност трябва да е 1, 3 или 7 дни";
        }
        return null;
    }
}
