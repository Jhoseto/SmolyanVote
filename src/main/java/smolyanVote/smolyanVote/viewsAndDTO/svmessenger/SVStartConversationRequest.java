package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO за стартиране на нов разговор
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVStartConversationRequest {
    
    @NotNull(message = "User ID е задължително")
    private Long otherUserId;
    
    // Optional: първо съобщение
    private String initialMessage;
}
