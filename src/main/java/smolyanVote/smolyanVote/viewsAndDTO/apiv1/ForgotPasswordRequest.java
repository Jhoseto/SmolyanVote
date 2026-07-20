package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** JSON заявка за {@code POST /api/v1/auth/forgot-password}. */
public record ForgotPasswordRequest(
        @NotBlank(message = "Имейлът е задължителен")
        @Email(message = "Моля, въведете валиден имейл адрес")
        String email
) {
}
