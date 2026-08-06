package smolyanVote.smolyanVote.controllers.apiv1;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.VoteIdempotencyService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.interfaces.VoteService;
import smolyanVote.smolyanVote.utils.ClientIpResolver;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.CastMultiPollVoteRequest;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.CastReferendumVoteRequest;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.CastSimpleEventVoteRequest;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.VoteAckResponse;

/**
 * Unified JSON vote endpoints for the 3 event types (Next.js frontend,
 * MODERN_FRONTEND_PLAN.md Фаза 3). Фаза 10: {@code Idempotency-Key} replay
 * via {@link VoteIdempotencyService}; DB UNIQUE remains race-safety.
 */
@RestController
@RequestMapping("/api/v1/votes")
public class VotesController {

    private static final String IDEMPOTENCY_HEADER = "Idempotency-Key";

    private final VoteService voteService;
    private final UserService userService;
    private final VoteIdempotencyService voteIdempotencyService;
    private final ClientIpResolver clientIpResolver;

    public VotesController(
            VoteService voteService,
            UserService userService,
            VoteIdempotencyService voteIdempotencyService,
            ClientIpResolver clientIpResolver) {
        this.voteService = voteService;
        this.userService = userService;
        this.voteIdempotencyService = voteIdempotencyService;
        this.clientIpResolver = clientIpResolver;
    }

    @PostMapping("/simple")
    public ResponseEntity<VoteAckResponse> castSimpleEventVote(
            @Valid @RequestBody CastSimpleEventVoteRequest request,
            HttpServletRequest httpRequest) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) return unauthenticated();

        String idempotencyKey = scopedKey(httpRequest, user.getId(), "simple", request.eventId());
        VoteAckResponse cached = voteIdempotencyService.getCached(idempotencyKey);
        if (cached != null) return ResponseEntity.ok(cached);

        voteService.recordSimpleEventVote(request.eventId(), request.vote(), user.getEmail(), clientIp(httpRequest));
        VoteAckResponse ack = VoteAckResponse.ok("Гласът ви беше записан успешно.");
        voteIdempotencyService.put(idempotencyKey, ack);
        return ResponseEntity.ok(ack);
    }

    @PostMapping("/referendum")
    public ResponseEntity<VoteAckResponse> castReferendumVote(
            @Valid @RequestBody CastReferendumVoteRequest request,
            HttpServletRequest httpRequest) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) return unauthenticated();

        String idempotencyKey = scopedKey(httpRequest, user.getId(), "referendum", request.referendumId());
        VoteAckResponse cached = voteIdempotencyService.getCached(idempotencyKey);
        if (cached != null) return ResponseEntity.ok(cached);

        String message = voteService.recordReferendumVote(
                request.referendumId(), String.valueOf(request.optionIndex()), user.getEmail(), clientIp(httpRequest));
        VoteAckResponse ack = VoteAckResponse.ok(message);
        voteIdempotencyService.put(idempotencyKey, ack);
        return ResponseEntity.ok(ack);
    }

    @PostMapping("/multipoll")
    public ResponseEntity<VoteAckResponse> castMultiPollVote(
            @Valid @RequestBody CastMultiPollVoteRequest request,
            HttpServletRequest httpRequest) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) return unauthenticated();

        String idempotencyKey = scopedKey(httpRequest, user.getId(), "multipoll", request.pollId());
        VoteAckResponse cached = voteIdempotencyService.getCached(idempotencyKey);
        if (cached != null) return ResponseEntity.ok(cached);

        voteService.recordMultiPollVote(
                request.pollId(), user.getEmail(), request.selectedOptions(), clientIp(httpRequest));
        VoteAckResponse ack = VoteAckResponse.ok("Гласът ви беше записан успешно.");
        voteIdempotencyService.put(idempotencyKey, ack);
        return ResponseEntity.ok(ack);
    }

    /**
     * Scope cache by user + vote target so a reused browser UUID cannot
     * short-circuit a different vote. Header may be blank — then no caching.
     */
    private String scopedKey(HttpServletRequest request, Long userId, String kind, Long targetId) {
        String raw = request.getHeader(IDEMPOTENCY_HEADER);
        if (raw == null || raw.isBlank()) return null;
        return userId + ":" + kind + ":" + targetId + ":" + raw.trim();
    }

    private ResponseEntity<VoteAckResponse> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new VoteAckResponse(false, "Необходим е вход в профила, за да гласувате."));
    }

    private String clientIp(HttpServletRequest request) {
        return clientIpResolver.resolve(request);
    }

    @ExceptionHandler({DataIntegrityViolationException.class, UnexpectedRollbackException.class})
    public ResponseEntity<VoteAckResponse> handlePersistenceFailure(Exception ex) {
        Throwable root = ex;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        String message = root.getMessage() != null && root.getMessage().contains("vote_ips")
                ? "Гласуването не можа да бъде записано поради проблем с базата данни. Рестартирайте сървъра и опитайте отново."
                : "Гласуването не успя. Моля, опитайте отново.";
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new VoteAckResponse(false, message));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<VoteAckResponse> handleAlreadyVoted(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new VoteAckResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<VoteAckResponse> handleInvalid(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(new VoteAckResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<VoteAckResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .filter(m -> m != null && !m.isBlank())
                .findFirst()
                .orElse("Невалидна заявка за гласуване.");
        return ResponseEntity.badRequest().body(new VoteAckResponse(false, message));
    }
}
