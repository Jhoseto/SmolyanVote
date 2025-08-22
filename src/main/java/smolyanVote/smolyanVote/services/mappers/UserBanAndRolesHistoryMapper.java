package smolyanVote.smolyanVote.services.mappers;

import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.models.UserRoleAndBansHistoryEntity;
import smolyanVote.smolyanVote.viewsAndDTO.UserBanAndRolesHistoryDto;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class UserBanAndRolesHistoryMapper {

    /**
     * Конвертира UserRoleAndBansHistoryEntity към UserBanAndRolesHistoryDto
     */
    public UserBanAndRolesHistoryDto mapToDto(UserRoleAndBansHistoryEntity entity) {
        UserBanAndRolesHistoryDto dto = new UserBanAndRolesHistoryDto();

        // Общи полета за всички операции
        dto.setId(entity.getId());
        dto.setTargetUsername(entity.getTargetUsername());
        dto.setAdminUsername(entity.getAdminUsername());
        dto.setActionType(entity.getActionType());
        dto.setActionTimestamp(entity.getActionTimestamp());
        dto.setReason(entity.getReason());

        // Role change специфични полета
        if ("ROLE_CHANGE".equals(entity.getActionType())) {
            dto.setOldRole(entity.getOldRole());
            dto.setNewRole(entity.getNewRole());
        }

        // Ban/Unban специфични полета
        if ("BAN".equals(entity.getActionType()) || "UNBAN".equals(entity.getActionType())) {
            dto.setBanType(entity.getBanType());
            dto.setBanDurationDays(entity.getBanDurationDays());
            dto.setOldStatus(entity.getOldStatus());
            dto.setNewStatus(entity.getNewStatus());
        }

        return dto;
    }

    /**
     * Конвертира списък от entities към DTOs
     */
    public List<UserBanAndRolesHistoryDto> mapToDtoList(List<UserRoleAndBansHistoryEntity> entities) {
        return entities.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
}