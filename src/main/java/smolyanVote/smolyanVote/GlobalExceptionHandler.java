package smolyanVote.smolyanVote;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;
import smolyanVote.smolyanVote.componentsAndSecurity.BrowserRequestUtils;
import smolyanVote.smolyanVote.config.FrontendProperties;
import smolyanVote.smolyanVote.exceptions.ModerationViolationException;
import smolyanVote.smolyanVote.exceptions.UserBannedException;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * API-first exception handling. Browser document requests go to Next.js;
 * JSON clients get structured bodies. Preserves {@link ResponseStatusException}
 * status codes used by ApiV1 controllers.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final FrontendProperties frontendProperties;

    public GlobalExceptionHandler(FrontendProperties frontendProperties) {
        this.frontendProperties = frontendProperties;
    }

    @ExceptionHandler(ResponseStatusException.class)
    public Object handleResponseStatus(ResponseStatusException ex, HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        if (redirectBrowser(request, response, "/")) {
            return null;
        }
        String message = ex.getReason() != null ? ex.getReason() : ex.getStatusCode().toString();
        return ResponseEntity.status(ex.getStatusCode()).body(errorBody(ex.getStatusCode().value(), message));
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public Object handleNotFound(NoHandlerFoundException ex, HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        if (redirectBrowser(request, response, "/")) {
            return null;
        }
        return json(HttpStatus.NOT_FOUND, "Not found");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public Object handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (redirectBrowser(request, response, "/")) {
            return null;
        }
        return json(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public Object handleAccessDenied(AccessDeniedException ex, HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        if (redirectBrowser(request, response, "/")) {
            return null;
        }
        return json(HttpStatus.FORBIDDEN, "Forbidden");
    }

    @ExceptionHandler(AuthenticationException.class)
    public Object handleAuthentication(AuthenticationException ex, HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        if (redirectBrowser(request, response, "/login")) {
            return null;
        }
        return json(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }

    @ExceptionHandler({ BindException.class, MethodArgumentNotValidException.class })
    public Object handleValidation(Exception ex, HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        if (redirectBrowser(request, response, "/")) {
            return null;
        }
        String details;
        if (ex instanceof BindException bind) {
            details = bind.getBindingResult().getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.joining("; "));
        } else {
            MethodArgumentNotValidException manv = (MethodArgumentNotValidException) ex;
            details = manv.getBindingResult().getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.joining("; "));
        }
        return json(HttpStatus.BAD_REQUEST, details.isBlank() ? "Validation failed" : details);
    }

    @ExceptionHandler(ModerationViolationException.class)
    public ResponseEntity<Map<String, Object>> handleModerationViolation(ModerationViolationException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("status", HttpStatus.UNPROCESSABLE_ENTITY.value());
        body.put("code", ex.isAutoBanned() ? "MODERATION_AUTO_BAN" : "MODERATION_VIOLATION");
        body.put("violationType", ex.getViolationType().name());
        body.put("strikeCount", ex.getStrikeCount());
        body.put("strikesUntilBan", ex.getStrikesUntilBan());
        body.put("autoBanned", ex.isAutoBanned());
        if (ex.getBanEndDate() != null) {
            body.put("banEndDate", ex.getBanEndDate().toString());
        }
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    @ExceptionHandler(UserBannedException.class)
    public ResponseEntity<Map<String, Object>> handleUserBanned(UserBannedException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", ex.getMessage());
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("code", "USER_BANNED");
        body.put("readOnly", true);
        body.put("permanent", ex.isPermanent());
        if (ex.getBanEndDate() != null) {
            body.put("banEndDate", ex.getBanEndDate().toString());
        }
        if (ex.getBanReason() != null) {
            body.put("banReason", ex.getBanReason());
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public Object handleBusinessRule(RuntimeException ex, HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        if (redirectBrowser(request, response, "/")) {
            return null;
        }
        HttpStatus status = ex instanceof IllegalStateException ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
        return json(status, ex.getMessage());
    }

    @ExceptionHandler({DataIntegrityViolationException.class, UnexpectedRollbackException.class})
    public Object handleDataIntegrity(Exception ex, HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        log.warn("Data integrity failure on {}: {}", request.getRequestURI(), ex.getMessage());
        if (redirectBrowser(request, response, "/")) {
            return null;
        }
        return json(HttpStatus.CONFLICT, "Операцията не можа да бъде завършена поради конфликт в данните.");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public Object handleMaxUpload(MaxUploadSizeExceededException ex, HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        log.warn("Upload too large on {}: {}", request.getRequestURI(), ex.getMessage());
        if (redirectBrowser(request, response, "/")) {
            return null;
        }
        return json(HttpStatus.PAYLOAD_TOO_LARGE, "Файлът е твърде голям (макс. 100MB).");
    }

    @ExceptionHandler(Exception.class)
    public Object handleGeneric(Exception ex, HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        log.error("Unhandled exception on {}", request.getRequestURI(), ex);
        if (redirectBrowser(request, response, "/")) {
            return null;
        }
        return json(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
    }

    private boolean redirectBrowser(HttpServletRequest request, HttpServletResponse response, String path)
            throws IOException {
        if (BrowserRequestUtils.isApiPath(request) || !BrowserRequestUtils.isBrowserDocumentRequest(request)) {
            return false;
        }
        response.setHeader("Cache-Control", "no-store");
        response.sendRedirect(frontendProperties.origin() + path);
        return true;
    }

    private static ResponseEntity<Map<String, Object>> json(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(errorBody(status.value(), message));
    }

    private static Map<String, Object> errorBody(int status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", message);
        body.put("status", status);
        return body;
    }
}
