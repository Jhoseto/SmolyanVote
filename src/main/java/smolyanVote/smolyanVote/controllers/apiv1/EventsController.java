package smolyanVote.smolyanVote.controllers.apiv1;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.services.support.ImageUploadValidator;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.ApiMessageResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.EventCreatedResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.EventsCatalogResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.MultiPollDetailResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.ReferendumDetailResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.SimpleEventDetailResponse;

import java.util.ArrayList;
import java.util.List;

/**
 * Public read endpoints for the events hub + the 3 detail pages
 * (Next.js frontend). Hub listing returns the full catalog — filter/sort/page
 * live in the frontend. Per-type detail logic stays in the respective services.
 */
@RestController
@RequestMapping("/api/v1/events")
public class EventsController {

    private static final int MIN_OPTIONS = 2;
    private static final int MAX_OPTIONS = 10;

    private final MainEventsService mainEventsService;
    private final SimpleEventService simpleEventService;
    private final ReferendumService referendumService;
    private final MultiPollService multiPollService;
    private final UserService userService;
    private final DeleteEventsService deleteEventsService;
    private final ImageUploadValidator imageUploadValidator;

    public EventsController(MainEventsService mainEventsService,
                                  SimpleEventService simpleEventService,
                                  ReferendumService referendumService,
                                  MultiPollService multiPollService,
                                  UserService userService,
                                  DeleteEventsService deleteEventsService,
                                  ImageUploadValidator imageUploadValidator) {
        this.mainEventsService = mainEventsService;
        this.simpleEventService = simpleEventService;
        this.referendumService = referendumService;
        this.multiPollService = multiPollService;
        this.userService = userService;
        this.deleteEventsService = deleteEventsService;
        this.imageUploadValidator = imageUploadValidator;
    }

    @GetMapping
    public ResponseEntity<EventsCatalogResponse> list() {
        UserEntity currentUser = userService.getCurrentUser();
        Long currentUserId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(mainEventsService.getEventsCatalog(currentUserId));
    }

    @GetMapping("/simple/{id}")
    public ResponseEntity<SimpleEventDetailResponse> simpleEventDetail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(SimpleEventDetailResponse.from(simpleEventService.getSimpleEventDetails(id)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/referendum/{id}")
    public ResponseEntity<ReferendumDetailResponse> referendumDetail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ReferendumDetailResponse.from(referendumService.getReferendumDetail(id)));
        } catch (EntityNotFoundException | IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/multipoll/{id}")
    public ResponseEntity<MultiPollDetailResponse> multiPollDetail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(MultiPollDetailResponse.from(multiPollService.getMultiPollDetail(id)));
        } catch (EntityNotFoundException | IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ===== Create (JWT-authenticated, multipart — mirrors the Thymeleaf create controllers 1:1) =====

    @PostMapping(value = "/simple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createSimpleEvent(
            @Valid @ModelAttribute CreateEventView dto,
            @RequestParam String positiveLabel,
            @RequestParam String negativeLabel,
            @RequestParam String neutralLabel) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) return unauthenticated();

        requireNonBlank(positiveLabel, "ЗА етикетът е задължителен.");
        requireNonBlank(negativeLabel, "ПРОТИВ етикетът е задължителен.");
        requireNonBlank(neutralLabel, "Неутралният етикет е задължителен.");
        requireMaxLength(positiveLabel, 80, "ЗА етикетът трябва да е до 80 символа.");
        requireMaxLength(negativeLabel, 80, "ПРОТИВ етикетът трябва да е до 80 символа.");
        requireMaxLength(neutralLabel, 80, "Неутралният етикет трябва да е до 80 символа.");

        MultipartFile[] files = {dto.getImage1(), dto.getImage2(), dto.getImage3()};
        for (MultipartFile file : files) {
            validateImage(file);
        }

        Long id = simpleEventService.createEvent(dto, files, positiveLabel.trim(), negativeLabel.trim(), neutralLabel.trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(new EventCreatedResponse(id));
    }

    @PostMapping(value = "/referendum", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createReferendum(
            @RequestParam String topic,
            @RequestParam String description,
            @RequestParam Locations location,
            @RequestParam("options") List<String> options,
            @RequestParam(value = "image1", required = false) MultipartFile image1,
            @RequestParam(value = "image2", required = false) MultipartFile image2,
            @RequestParam(value = "image3", required = false) MultipartFile image3) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) return unauthenticated();

        requireNonBlank(topic, "Темата е задължителна.");
        requireMaxLength(topic, 150, "Темата трябва да е до 150 символа.");
        requireNonBlank(description, "Описанието е задължително.");
        requireMaxLength(description, 1000, "Описанието трябва да е до 1000 символа.");

        List<String> filteredOptions = normalizeOptions(options);

        List<MultipartFile> images = List.of(image1, image2, image3);
        for (MultipartFile file : images) {
            validateImage(file);
        }

        Long id = referendumService.createReferendum(topic.trim(), description.trim(), location, filteredOptions, images, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(new EventCreatedResponse(id));
    }

    @PostMapping(value = "/multipoll", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createMultiPoll(@Valid @ModelAttribute CreateMultiPollView dto) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) return unauthenticated();

        requireNonBlank(dto.getTitle(), "Заглавието е задължително.");
        requireMaxLength(dto.getTitle(), 150, "Заглавието трябва да е до 150 символа.");
        requireNonBlank(dto.getDescription(), "Описанието е задължително.");
        requireMaxLength(dto.getDescription(), 1000, "Описанието трябва да е до 1000 символа.");

        dto.setOptions(normalizeOptions(dto.getOptions()));

        MultipartFile[] files = {dto.getImage1(), dto.getImage2(), dto.getImage3()};
        for (MultipartFile file : files) {
            validateImage(file);
        }

        Long id = multiPollService.createMultiPoll(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new EventCreatedResponse(id));
    }

    // ===== Admin inline edit (JWT-authenticated, ADMIN only, multipart) =====

    @PutMapping(value = "/simple/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateSimpleEvent(
            @PathVariable Long id,
            @Valid @ModelAttribute CreateEventView dto,
            @RequestParam String positiveLabel,
            @RequestParam String negativeLabel,
            @RequestParam String neutralLabel,
            @RequestParam(value = "newImages", required = false) MultipartFile[] newImages,
            @RequestParam(value = "deleteImageIds", required = false) List<Long> deleteImageIds) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) return unauthenticated();
        if (user.getRole() != UserRole.ADMIN) return forbidden();

        requireNonBlank(positiveLabel, "ЗА етикетът е задължителен.");
        requireNonBlank(negativeLabel, "ПРОТИВ етикетът е задължителен.");
        requireNonBlank(neutralLabel, "Неутралният етикет е задължителен.");
        requireMaxLength(positiveLabel, 80, "ЗА етикетът трябва да е до 80 символа.");
        requireMaxLength(negativeLabel, 80, "ПРОТИВ етикетът трябва да е до 80 символа.");
        requireMaxLength(neutralLabel, 80, "Неутралният етикет трябва да е до 80 символа.");

        if (newImages != null) {
            for (MultipartFile file : newImages) {
                validateImage(file);
            }
        }

        try {
            Long updatedId = simpleEventService.updateEvent(
                    id, dto, newImages, positiveLabel.trim(), negativeLabel.trim(), neutralLabel.trim(), deleteImageIds);
            return ResponseEntity.ok(SimpleEventDetailResponse.from(simpleEventService.getSimpleEventDetails(updatedId)));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error(e.getMessage()));
        }
    }

    @PutMapping(value = "/referendum/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateReferendum(
            @PathVariable Long id,
            @RequestParam String topic,
            @RequestParam String description,
            @RequestParam Locations location,
            @RequestParam("options") List<String> options,
            @RequestParam(value = "newImages", required = false) List<MultipartFile> newImages,
            @RequestParam(value = "deleteImageIds", required = false) List<Long> deleteImageIds) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) return unauthenticated();
        if (user.getRole() != UserRole.ADMIN) return forbidden();

        requireNonBlank(topic, "Темата е задължителна.");
        requireMaxLength(topic, 150, "Темата трябва да е до 150 символа.");
        requireNonBlank(description, "Описанието е задължително.");
        requireMaxLength(description, 1000, "Описанието трябва да е до 1000 символа.");

        List<String> filteredOptions = normalizeOptions(options);

        List<MultipartFile> filesToValidate = newImages != null ? newImages : List.of();
        for (MultipartFile file : filesToValidate) {
            validateImage(file);
        }

        try {
            Long updatedId = referendumService.updateReferendum(
                    id, topic.trim(), description.trim(), location, filteredOptions, filesToValidate, deleteImageIds);
            return ResponseEntity.ok(ReferendumDetailResponse.from(referendumService.getReferendumDetail(updatedId)));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error(e.getMessage()));
        }
    }

    @PutMapping(value = "/multipoll/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateMultiPoll(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam Locations location,
            @RequestParam("options") List<String> options,
            @RequestParam(value = "newImages", required = false) List<MultipartFile> newImages,
            @RequestParam(value = "deleteImageIds", required = false) List<Long> deleteImageIds) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) return unauthenticated();
        if (user.getRole() != UserRole.ADMIN) return forbidden();

        requireNonBlank(title, "Заглавието е задължително.");
        requireMaxLength(title, 150, "Заглавието трябва да е до 150 символа.");
        requireNonBlank(description, "Описанието е задължително.");
        requireMaxLength(description, 1000, "Описанието трябва да е до 1000 символа.");

        List<String> filteredOptions = normalizeOptions(options);

        if (newImages != null) {
            for (MultipartFile file : newImages) {
                validateImage(file);
            }
        }

        CreateMultiPollView dto = new CreateMultiPollView();
        dto.setTitle(title.trim());
        dto.setDescription(description.trim());
        dto.setLocation(location);
        dto.setOptions(filteredOptions);

        try {
            Long updatedId = multiPollService.updateMultiPoll(id, dto, newImages, deleteImageIds);
            return ResponseEntity.ok(MultiPollDetailResponse.from(multiPollService.getMultiPollDetailSnapshot(updatedId)));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error(e.getMessage()));
        }
    }

    // ===== Delete (JWT-authenticated — creator or admin, mirrors DeleteEventsService 1:1) =====

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiMessageResponse> deleteEvent(@PathVariable Long id) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiMessageResponse.error("Необходима е автентикация за изтриване."));
        }

        if (!deleteEventsService.canUserDeleteEvent(id, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiMessageResponse.error("Нямате права за изтриване на това съдържание."));
        }

        try {
            deleteEventsService.deleteEvent(id);
            return ResponseEntity.ok(ApiMessageResponse.ok("Изтрито успешно."));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiMessageResponse.error(e.getMessage()));
        }
    }

    // ===== Create/delete validation helpers =====

    private ResponseEntity<?> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiMessageResponse.error("Необходим е вход в профила."));
    }

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiMessageResponse.error("Само администратор може да редактира съдържание."));
    }

    private void requireNonBlank(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(message);
        }
    }

    private void requireMaxLength(String value, int max, String message) {
        if (value != null && value.trim().length() > max) {
            throw new IllegalArgumentException(message);
        }
    }

    private List<String> normalizeOptions(List<String> rawOptions) {
        List<String> filtered = new ArrayList<>();
        if (rawOptions != null) {
            for (String option : rawOptions) {
                if (option != null && !option.trim().isEmpty()) {
                    if (option.trim().length() > 100) {
                        throw new IllegalArgumentException("Всяка опция трябва да е до 100 символа.");
                    }
                    filtered.add(option.trim());
                }
            }
        }
        if (filtered.size() < MIN_OPTIONS) {
            throw new IllegalArgumentException("Въведете поне " + MIN_OPTIONS + " валидни опции.");
        }
        if (filtered.size() > MAX_OPTIONS) {
            throw new IllegalArgumentException("Максимум " + MAX_OPTIONS + " опции са разрешени.");
        }
        return filtered;
    }

    private void validateImage(MultipartFile image) {
        imageUploadValidator.validateOptional(image, ImageUploadValidator.MAX_EVENT_IMAGE_BYTES);
    }

    // ===== Local exception handling — the global handler redirects HTML, wrong for a JSON API =====

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiMessageResponse> handleInvalid(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ApiMessageResponse.error(ex.getMessage()));
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

}
