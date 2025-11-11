package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO за LiveKit call token
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVCallTokenResponse {

    private String token;
    private String roomName;
    private String serverUrl;
    private Long conversationId;
}
