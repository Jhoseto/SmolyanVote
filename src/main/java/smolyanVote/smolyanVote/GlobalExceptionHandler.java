package smolyanVote.smolyanVote;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@ControllerAdvice
public class GlobalExceptionHandler {

    // === Обща грешка ===
    @ExceptionHandler(Exception.class)
    public String handleGenericException(Exception ex, RedirectAttributes redirectAttributes) {
        ex.printStackTrace();
        redirectAttributes.addFlashAttribute("errorMessage", "Обща грешка: " + ex.getMessage());
        return "redirect:/error/general";
    }

    // === NullPointerException ===
    @ExceptionHandler(NullPointerException.class)
    public String handleNullPointerException(NullPointerException ex, RedirectAttributes redirectAttributes) {
        ex.printStackTrace();
        redirectAttributes.addFlashAttribute("errorMessage", "Вътрешна грешка: Липсващ ресурс или стойност.");
        return "redirect:/error/general";
    }

    // === RuntimeException (напр. IndexOutOfBounds, IllegalArgument и др.) ===
    @ExceptionHandler(RuntimeException.class)
    public String handleRuntimeException(RuntimeException ex, RedirectAttributes redirectAttributes) {
        ex.printStackTrace();
        redirectAttributes.addFlashAttribute("errorMessage", "Вътрешна грешка (Runtime): " + ex.getMessage());
        return "redirect:/error/general";
    }

    // === Грешка при валидация на форма ===
    @ExceptionHandler(BindException.class)
    public String handleBindException(BindException ex, RedirectAttributes redirectAttributes) {
        StringBuilder errors = new StringBuilder("Формата съдържа грешки:<br>");
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.append("- ").append(fieldError.getField()).append(": ").append(fieldError.getDefaultMessage()).append("<br>");
        }
        redirectAttributes.addFlashAttribute("errorMessage", errors.toString());
        return "redirect:/createEvent"; // Замени с подходяща страница
    }

    // === Грешка 404 ===
    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String handleNotFound(NoHandlerFoundException ex, RedirectAttributes redirectAttributes) {
        redirectAttributes.addFlashAttribute("errorMessage", "Страницата не беше намерена.");
        return "redirect:/error/404";
    }

    // === Методът не е поддържан (напр. POST към GET) ===
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public String handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, RedirectAttributes redirectAttributes) {
        redirectAttributes.addFlashAttribute("errorMessage", "Методът не е разрешен за този адрес.");
        return "redirect:/error/general";
    }

    // === Забрана на достъп (Spring Security) ===
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public String handleAccessDenied(AccessDeniedException ex, RedirectAttributes redirectAttributes) {
        redirectAttributes.addFlashAttribute("errorMessage", "Нямате права за достъп до тази страница.");
        return "redirect:/error/403";
    }

    // === Грешка при логин (Spring Security) ===
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public String handleAuthentication(AuthenticationException ex, RedirectAttributes redirectAttributes) {
        redirectAttributes.addFlashAttribute("errorMessage", "Грешка при удостоверяване: " + ex.getMessage());
        return "redirect:/viewLogin";
    }
}
