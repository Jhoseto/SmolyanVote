package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVConversationEntity;

import java.time.Instant;

/**
 * DTO за един разговор
 * Използва се в conversation list
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVConversationDTO {
    
    private Long id;
    private SVUserMinimalDTO otherUser;
    private String lastMessage;
    private Instant lastMessageTime;
    private Integer unreadCount;
    private Boolean isTyping;
    private Instant createdAt;
    
    // ========== INNER MAPPER CLASS ==========
    
    /**
     * Mapper за конвертиране SVConversationEntity -> SVConversationDTO
     */
    public static class Mapper {
        
        /**
         * Map entity to DTO
         * 
         * @param conversation Conversation entity
         * @param currentUser Текущият user (за да определим "other user")
         * @param isTyping Дали другият user пише в момента
         */
        public static SVConversationDTO toDTO(SVConversationEntity conversation, 
                                               UserEntity currentUser, 
                                               boolean isTyping) {
            if (conversation == null || currentUser == null) {
                return null;
            }
            
            SVConversationDTO dto = new SVConversationDTO();
            dto.setId(conversation.getId());
            
            // Определи "other user"
            UserEntity otherUser = conversation.getOtherUser(currentUser);
            dto.setOtherUser(SVUserMinimalDTO.Mapper.toDTO(otherUser));
            
            // Last message info
            dto.setLastMessage(conversation.getLastMessagePreview());
            dto.setLastMessageTime(conversation.getUpdatedAt());
            
            // Unread count за current user
            dto.setUnreadCount(conversation.getUnreadCountFor(currentUser));
            
            // Typing status
            dto.setIsTyping(isTyping);
            
            // Created timestamp
            dto.setCreatedAt(conversation.getCreatedAt());
            
            return dto;
        }
        
        /**
         * Map entity to DTO без typing status (default false)
         */
        public static SVConversationDTO toDTO(SVConversationEntity conversation, 
                                               UserEntity currentUser) {
            return toDTO(conversation, currentUser, false);
        }
    }
}
