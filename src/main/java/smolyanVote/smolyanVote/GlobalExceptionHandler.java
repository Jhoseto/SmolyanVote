package smolyanVote.smolyanVote;

import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Обработва всички грешки (поглъща всички Exception)
    @ExceptionHandler(value = {Exception.class})
    public String handleException(Exception ex, RedirectAttributes redirectAttributes) {
        // Добавяне на съобщението за грешка
        redirectAttributes.addFlashAttribute("errorMessage", "Глобална грешка: " + ex.getMessage());
        return "redirect:/login"; // Може да е всяка друга страница в зависимост от контекста
    }

    // Обработва грешки, възникнали при валидация (например от @Valid)
    @ExceptionHandler(value = {BindException.class})
    public String handleValidationException(BindException ex, RedirectAttributes redirectAttributes) {
        // Проверка за грешки в данните
        if (ex.getBindingResult().hasErrors()) {
            StringBuilder errorMessages = new StringBuilder();

            // Преглед на всяка грешка и добавяне на съобщение
            for (FieldError error : ex.getBindingResult().getFieldErrors()) {
                errorMessages.append("Поле: ").append(error.getField())
                        .append(" - ").append(error.getDefaultMessage()).append("\n");
            }

            // Добавяне на съобщението в атрибутите за редирект
            redirectAttributes.addFlashAttribute("errorMessage", errorMessages.toString());

            // В случая, ако има проблем с аутентификация, ще добавим пренасочване към login.
            redirectAttributes.addFlashAttribute("authError", "Невалидни данни при аутентикация.");
        }

        // Пренасочване към страницата за събития или друга страница в зависимост от контекста
        return "redirect:/createEvent";
    }
}
