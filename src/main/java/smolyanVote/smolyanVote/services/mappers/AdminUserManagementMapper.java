package smolyanVote.smolyanVote.services.mappers;

import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.viewsAndDTO.AdminUserViewDTO;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class AdminUserManagementMapper {

    /**
     * Maps a single UserEntity to AdminUserViewDTO
     */
    public AdminUserViewDTO mapUserToAdminView(UserEntity user) {
        AdminUserViewDTO dto = new AdminUserViewDTO();

        // From BaseEntity
        dto.setId(user.getId());
        dto.setCreated(user.getCreated());
        dto.setModified(user.getModified());

        // User identity
        dto.setUsername(user.getUsername());
        dto.setRealName(user.getRealName());
        dto.setEmail(user.getEmail());
        dto.setBio(user.getBio());
        dto.setLocation(user.getLocation());

        // User image
        dto.setImageUrl(user.getImageUrl());

        // System info (using proper enums!)
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setOnlineStatus(user.getOnlineStatus());
        dto.setLastOnline(user.getLastOnline());

        // Activity counters
        dto.setUserEventsCount(user.getUserEventsCount());
        dto.setTotalVotes(user.getTotalVotes());
        dto.setPublicationsCount(user.getPublicationsCount());

        // Ban information
        dto.setBanReason(user.getBanReason());
        dto.setBanDate(user.getBanDate());
        dto.setBanEndDate(user.getBanEndDate());
        dto.setBannedBy(user.getBannedByUsername());

        // Notifications
        dto.setNotification(user.getNotification());

        return dto;
    }

    /**
     * Maps a list of UserEntity to List<AdminUserViewDTO>
     */
    public List<AdminUserViewDTO> mapUsersToAdminView(List<UserEntity> users) {
        return users.stream()
                .map(this::mapUserToAdminView)
                .collect(Collectors.toList());
    }
}