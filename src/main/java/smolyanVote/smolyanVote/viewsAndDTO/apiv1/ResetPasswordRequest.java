package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import jakarta.validation.constraints.NotBlank;

/** JSON заявка за {@code POST /api/v1/auth/reset-password}. */
public record ResetPasswordRequest(
        @NotBlank(message = "Липсва токен за възстановяване")
        String token,

        @NotBlank(message = "Паролата е задължителна")
        String password,

        @NotBlank(message = "Моля, потвърдете паролата")
        String confirmPassword
) {
}
