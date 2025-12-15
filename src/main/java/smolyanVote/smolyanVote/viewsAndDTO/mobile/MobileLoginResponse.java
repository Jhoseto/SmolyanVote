package smolyanVote.smolyanVote.viewsAndDTO.mobile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO;

/**
 * Response DTO за mobile login
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MobileLoginResponse {

    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long expiresIn; // в секунди
    private SVUserMinimalDTO user;
}

