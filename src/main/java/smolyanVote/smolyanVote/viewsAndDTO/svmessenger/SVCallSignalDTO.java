package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO за call signaling през WebSocket
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVCallSignalDTO {

    private SVCallEventType eventType;
    private Long conversationId;
    private Long callerId;
    private Long receiverId;
    private String roomName;
    private Instant timestamp;

    // Caller info за UI display
    private String callerName;
    private String callerAvatar;

    // Simplified constructor
    public SVCallSignalDTO(SVCallEventType eventType, Long conversationId, Long callerId, Long receiverId) {
        this.eventType = eventType;
        this.conversationId = conversationId;
        this.callerId = callerId;
        this.receiverId = receiverId;
        this.timestamp = Instant.now();
    }

    // Constructor with room name
    public SVCallSignalDTO(SVCallEventType eventType, Long conversationId, Long callerId, Long receiverId, String roomName) {
        this(eventType, conversationId, callerId, receiverId);
        this.roomName = roomName;
    }
}
