package smolyanVote.smolyanVote.viewsAndDTO.mobile;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO за mobile login
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MobileLoginRequest {

    @NotBlank(message = "Email е задължителен")
    @Email(message = "Невалиден email формат")
    private String email;

    @NotBlank(message = "Паролата е задължителна")
    private String password;
}

