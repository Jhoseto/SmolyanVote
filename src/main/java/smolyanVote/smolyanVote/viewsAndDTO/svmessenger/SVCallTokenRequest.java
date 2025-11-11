package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO за генериране на LiveKit call token
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVCallTokenRequest {

    @NotNull(message = "Conversation ID е задължително")
    private Long conversationId;

    @NotNull(message = "Other user ID е задължително")
    private Long otherUserId;
}
