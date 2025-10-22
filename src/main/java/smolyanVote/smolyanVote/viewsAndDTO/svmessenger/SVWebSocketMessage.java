package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic DTO за WebSocket съобщения
 * Wrapper за различни типове съобщения
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVWebSocketMessage<T> {
    
    private String type;  // NEW_MESSAGE, TYPING_STATUS, READ_RECEIPT, ONLINE_STATUS
    private T data;
    private Long timestamp;
    
    public SVWebSocketMessage(String type, T data) {
        this.type = type;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }
}
