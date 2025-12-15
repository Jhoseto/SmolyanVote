package smolyanVote.smolyanVote.viewsAndDTO.mobile;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO за token refresh
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MobileRefreshTokenRequest {

    @NotBlank(message = "Refresh token е задължителен")
    private String refreshToken;
}

