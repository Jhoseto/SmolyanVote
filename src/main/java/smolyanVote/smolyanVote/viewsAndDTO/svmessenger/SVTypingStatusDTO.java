package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO за typing status
 * Използва се за WebSocket съобщения
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVTypingStatusDTO {
    
    private Long conversationId;
    private Long userId;
    private String username;
    private Boolean isTyping;
    private Instant timestamp;
    
    // Simplified constructor
    public SVTypingStatusDTO(Long conversationId, Long userId, Boolean isTyping) {
        this.conversationId = conversationId;
        this.userId = userId;
        this.isTyping = isTyping;
        this.timestamp = Instant.now();
    }
}
