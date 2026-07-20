package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * JSON заявка за {@code POST /api/v1/auth/register} — контракт за новия
 * Next.js frontend. Полетата и validation правилата са 1:1 паритет с
 * {@link smolyanVote.smolyanVote.viewsAndDTO.UserRegistrationViewModel}
 * (паролата изисква поне 6 символа, една голяма буква и една цифра).
 */
public record RegisterRequest(
        @NotNull
        @Size(min = 5, max = 20, message = "Невалидно потребителско име! Въведете име с минимум 5 и максимум 20 символа.")
        String username,

        @NotNull
        @Email(message = "Невалиден формат за Емейл!")
        String email,

        @NotNull
        @Size(min = 6, message = "Паролата трябва да съдържа поне 6 символа на латиница, една голяма буква и поне две цифри")
        @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).+$", message = "Паролата трябва да съдържа поне 6 символа на латиница, една голяма буква и поне две цифри")
        String password,

        String confirmPassword,

        /** Honeypot — трябва да остане празно; ботовете обикновено го попълват. */
        String middleName,

        /** Client timestamp (ms) кога формата е рендерирана — anti-spam минимално време (5 сек, паритет с v1). */
        Long formRenderedAt
) {
}
