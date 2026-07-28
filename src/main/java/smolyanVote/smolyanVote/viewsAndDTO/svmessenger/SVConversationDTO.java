package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.svmessenger.SVConversationEntity;

import smolyanVote.smolyanVote.models.svmessenger.SVConversationParticipantEntity;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

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
    /** Заглушен ли е разговорът за текущия потребител. */
    private Boolean isMuted;
    private Instant createdAt;

    /** DIRECT или GROUP. Старите клиенти игнорират полето и виждат само DIRECT. */
    private String type;
    /** Само за групи. */
    private String title;
    private String imageUrl;
    private List<SVParticipantDTO> participants;
    private Integer participantCount;
    /** Ролята на текущия потребител в групата: OWNER / ADMIN / MEMBER. */
    private String myRole;
    
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
            dto.setType(conversation.getConversationType().name());
            
            // Определи "other user"
            UserEntity otherUser = conversation.getOtherUser(currentUser);
            dto.setOtherUser(SVUserMinimalDTO.Mapper.toDTO(otherUser));
            
            // Last message info
            dto.setLastMessage(conversation.getLastMessagePreview());
            dto.setLastMessageTime(conversation.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant());
            
            // Unread count за current user
            dto.setUnreadCount(conversation.getUnreadCountFor(currentUser));
            
            // Typing status
            dto.setIsTyping(isTyping);
            dto.setIsMuted(conversation.isMutedForUser(currentUser));
            
            // Created timestamp
            dto.setCreatedAt(conversation.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant());
            
            return dto;
        }
        
        /**
         * Map entity to DTO без typing status (default false)
         */
        public static SVConversationDTO toDTO(SVConversationEntity conversation, 
                                               UserEntity currentUser) {
            return toDTO(conversation, currentUser, false);
        }

        /**
         * Group conversations have no "other user"; identity comes from the title
         * and the participant roster instead.
         */
        public static SVConversationDTO toGroupDTO(SVConversationEntity conversation,
                                                   UserEntity currentUser,
                                                   List<SVConversationParticipantEntity> participants,
                                                   boolean isTyping) {
            if (conversation == null || currentUser == null) {
                return null;
            }

            SVConversationDTO dto = new SVConversationDTO();
            dto.setId(conversation.getId());
            dto.setType(conversation.getConversationType().name());
            dto.setTitle(conversation.getTitle());
            dto.setImageUrl(conversation.getImageUrl());
            dto.setLastMessage(conversation.getLastMessagePreview());
            dto.setLastMessageTime(conversation.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant());
            dto.setCreatedAt(conversation.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant());
            dto.setIsTyping(isTyping);

            List<SVConversationParticipantEntity> roster = participants == null ? List.of() : participants;
            dto.setParticipants(roster.stream().map(SVParticipantDTO::from).toList());
            dto.setParticipantCount(roster.size());

            roster.stream()
                    .filter(p -> p.getUser().getId().equals(currentUser.getId()))
                    .findFirst()
                    .ifPresent(me -> {
                        dto.setMyRole(me.getRole().name());
                        dto.setUnreadCount(me.getUnreadCount());
                        dto.setIsMuted(Boolean.TRUE.equals(me.getMuted()));
                    });

            if (dto.getUnreadCount() == null) dto.setUnreadCount(0);
            if (dto.getIsMuted() == null) dto.setIsMuted(false);

            return dto;
        }
    }
}
