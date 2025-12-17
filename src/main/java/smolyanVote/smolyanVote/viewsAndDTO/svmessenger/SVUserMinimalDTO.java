package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.Instant;

/**
 * DTO за минимална user информация
 * Използва се в conversation list и search results
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVUserMinimalDTO {
    
    private Long id;
    private String username;
    private String fullName;
    private String imageUrl;
    private Boolean isOnline;
    private Instant lastSeen;
    private String bio;
    
    // ========== INNER MAPPER CLASS ==========
    
    /**
     * Mapper за конвертиране UserEntity -> SVUserMinimalDTO
     */
    public static class Mapper {
        
        /**
         * Map entity to DTO
         */
        public static SVUserMinimalDTO toDTO(UserEntity user) {
            if (user == null) {
                return null;
            }
            
            SVUserMinimalDTO dto = new SVUserMinimalDTO();
            dto.setId(user.getId());
            dto.setUsername(user.getUsername());
            
            // Compose full name от realName или username
            String fullName = "";
            if (user.getRealName() != null && !user.getRealName().trim().isEmpty()) {
                fullName = user.getRealName();
            } else if (user.getUsername() != null) {
                fullName = user.getUsername();
            }
            dto.setFullName(fullName);
            
            dto.setImageUrl(user.getImageUrl());
            
            // Online status: 1 = online, 0 = offline
            dto.setIsOnline(user.getOnlineStatus() == 1);
            
            // Last seen (използваме lastOnline от UserEntity)
            dto.setLastSeen(user.getLastOnline());
            
            // Bio
            dto.setBio(user.getBio());
            
            return dto;
        }
        
        /**
         * Map entity to DTO with custom online status
         */
        public static SVUserMinimalDTO toDTO(UserEntity user, boolean isOnline) {
            SVUserMinimalDTO dto = toDTO(user);
            if (dto != null) {
                dto.setIsOnline(isOnline);
            }
            return dto;
        }
    }
}
