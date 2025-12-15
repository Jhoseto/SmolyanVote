package smolyanVote.smolyanVote.viewsAndDTO.mobile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO за Mobile OAuth login
 */
@Data
public class MobileOAuthRequest {
    
    @NotBlank(message = "Provider е задължителен")
    @NotNull(message = "Provider не може да бъде null")
    private String provider; // "google" или "facebook"
    
    // За Google
    private String idToken; // Google ID token
    
    // За Facebook
    private String accessToken; // Facebook access token
    
    // Опционални данни за Facebook (ако accessToken не е достатъчен)
    private String userId;
    private String email;
    private String name;
}

