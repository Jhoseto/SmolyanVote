package smolyanVote.smolyanVote.controllers.apiv1;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import smolyanVote.smolyanVote.services.interfaces.ContactMessageService;
import smolyanVote.smolyanVote.viewsAndDTO.ContactFormView;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.ContactRequest;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.ContactResponse;

import java.util.List;

/**
 * Тънък JSON контролер за контактната форма, ползван от новия Next.js
 * frontend (JWT-only, без CSRF/session redirect flow). Routing + anti-spam
 * проверки само — бизнес логиката (запис на съобщението) остава в
 * {@link ContactMessageService}, същия service, който ползва и v1 Thymeleaf
 * {@code ContactController}.
 *
 * Локален {@code @ExceptionHandler} тук е нужен, защото глобалният
 * {@code GlobalExceptionHandler} връща HTML redirect-и — неподходящо за
 * JSON API контракт.
 */
@RestController
@RequestMapping("/api/v1/contact")
public class ContactController {

    private static final Logger logger = LoggerFactory.getLogger(ContactController.class);
    private static final long MIN_SUBMIT_DELAY_MS = 3000;

    private final ContactMessageService contactMessageService;

    public ContactController(ContactMessageService contactMessageService) {
        this.contactMessageService = contactMessageService;
    }

    @PostMapping
    public ResponseEntity<ContactResponse> submit(@Valid @RequestBody ContactRequest request) {
        if (request.middleName() != null && !request.middleName().isBlank()) {
            logger.warn("Honeypot triggered: possible bot submission from {}", request.email());
            return ResponseEntity.badRequest().body(ContactResponse.error("Невалидна заявка."));
        }

        long elapsed = System.currentTimeMillis() - request.formRenderedAt();
        if (elapsed < MIN_SUBMIT_DELAY_MS) {
            logger.warn("Contact form submitted too quickly: {} ms", elapsed);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ContactResponse.error("Формата беше изпратена твърде бързо. Моля, опитайте отново."));
        }

        ContactFormView view = new ContactFormView();
        view.setName(request.name());
        view.setEmail(request.email());
        view.setSubject(request.subject());
        view.setMessage(request.message());
        view.setMiddleName(request.middleName());
        view.setFormRenderedAt(request.formRenderedAt());

        try {
            contactMessageService.saveContactMessage(view);
            return ResponseEntity.ok(ContactResponse.ok("Съобщението ви беше изпратено успешно!"));
        } catch (Exception e) {
            logger.error("Error processing contact form: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ContactResponse.error("Грешка при изпращане на съобщението. Моля, опитайте отново."));
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ContactResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .toList();
        return ResponseEntity.badRequest()
                .body(ContactResponse.validationError("Моля, попълнете всички полета коректно.", fieldErrors));
    }
}
