package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.svmessenger.SVMessageEntity;

import java.time.Instant;
import java.time.ZoneId;

/**
 * DTO за едно съобщение
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVMessageDTO {
    
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderUsername;
    private String senderImageUrl;
    private String text;
    private Instant sentAt;
    private Boolean isRead;
    private Instant readAt;
    private String messageType;
    private Boolean isEdited;
    private Instant editedAt;
    
    // ========== INNER MAPPER CLASS ==========
    
    /**
     * Mapper за конвертиране SVMessageEntity -> SVMessageDTO
     */
    public static class Mapper {
        
        /**
         * Map entity to DTO
         */
        public static SVMessageDTO toDTO(SVMessageEntity message) {
            if (message == null) {
                return null;
            }
            
            SVMessageDTO dto = new SVMessageDTO();
            dto.setId(message.getId());
            dto.setConversationId(message.getConversation().getId());
            dto.setSenderId(message.getSender().getId());
            dto.setSenderUsername(message.getSender().getUsername());
            dto.setSenderImageUrl(message.getSender().getImageUrl());
            dto.setText(message.getMessageText());
            dto.setSentAt(message.getSentAt().atZone(ZoneId.systemDefault()).toInstant());
            dto.setIsRead(message.getIsRead());
            dto.setReadAt(message.getReadAt() != null ? 
                message.getReadAt().atZone(ZoneId.systemDefault()).toInstant() : null);
            dto.setMessageType(message.getMessageType().name());
            dto.setIsEdited(message.getIsEdited());
            dto.setEditedAt(message.getEditedAt() != null ? 
                message.getEditedAt().atZone(ZoneId.systemDefault()).toInstant() : null);
            
            return dto;
        }
    }
}
