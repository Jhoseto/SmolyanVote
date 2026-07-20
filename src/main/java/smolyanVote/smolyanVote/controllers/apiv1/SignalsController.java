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
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.ApiMessageResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.SignalReactionResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.SignalResponseDTO;

import java.math.BigDecimal;
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

    private final SignalsService signalsService;
    private final UserService userService;

    public SignalsController(SignalsService signalsService, UserService userService) {
        this.signalsService = signalsService;
        this.userService = userService;
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
                .map(signal -> SignalResponseDTO.from(signal, isLiked(signal, currentUser), currentUser != null ? currentUser.getId() : null))
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, Authentication auth) {
        SignalsEntity signal = signalsService.findById(id);
        if (signal == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error("Сигналът не е намерен."));
        }

        signalsService.incrementViews(id);
        signal = signalsService.findById(id);

        UserEntity currentUser = currentUser(auth);
        return ResponseEntity.ok(SignalResponseDTO.from(signal, isLiked(signal, currentUser),
                currentUser != null ? currentUser.getId() : null));
    }

    /** Liked signal ids за текущия потребител — `AuthorSearchFilter`-стил cache (за map/list "isLiked" маркиране без re-fetch). */
    @GetMapping("/liked")
    public ResponseEntity<List<Long>> liked(Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(signalsService.getLikedSignalIdsByUser(currentUser.getUsername()));
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

        SignalsCategory categoryEnum = SignalsCategory.valueOf(category.toUpperCase());
        BigDecimal lat = new BigDecimal(latitude);
        BigDecimal lon = new BigDecimal(longitude);

        SignalsEntity created = signalsService.create(title, description, categoryEnum, expirationDays, lat, lon, image, currentUser);
        return ResponseEntity.ok(SignalResponseDTO.from(created, false, currentUser.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String category,
            @RequestParam Integer expirationDays,
            @RequestParam(required = false) MultipartFile image,
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
        SignalsEntity updated = signalsService.update(signal, title, description, categoryEnum, expirationDays, image);
        return ResponseEntity.ok(SignalResponseDTO.from(updated, isLiked(updated, currentUser), currentUser.getId()));
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

    @PostMapping("/{id}/like")
    public ResponseEntity<?> like(@PathVariable Long id, Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return unauthenticated();
        }

        boolean isNowLiked = signalsService.toggleLike(id, currentUser);
        SignalsEntity signal = signalsService.findById(id);
        return ResponseEntity.ok(new SignalReactionResponse(isNowLiked, signal.getLikesCount() != null ? signal.getLikesCount() : 0));
    }

    private boolean isLiked(SignalsEntity signal, UserEntity currentUser) {
        return currentUser != null && signalsService.isLikedByUser(signal.getId(), currentUser.getUsername());
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
        } catch (NumberFormatException e) {
            return "Невалидни координати";
        }
        return null;
    }

    /**
     * Update не пипа координатите (легacy паритет — `PUT /signals/{id}` няма lat/lng
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
