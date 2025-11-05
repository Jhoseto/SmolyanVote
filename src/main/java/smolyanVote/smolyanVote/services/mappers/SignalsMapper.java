package smolyanVote.smolyanVote.services.mappers;

import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.viewsAndDTO.SignalsDto;

public class SignalsMapper {

    public static SignalsDto toDto(SignalsEntity s) {
        SignalsDto dto = new SignalsDto();
        dto.setId(s.getId());
        dto.setTitle(s.getTitle());
        dto.setDescription(s.getDescription());
        dto.setCategory(s.getCategory());
        dto.setExpirationDays(s.getExpirationDays());
        dto.setActiveUntil(s.getActiveUntil());
        dto.setIsActive(s.isActive());

        // НОВИ РЕДОВЕ - ПОПЪЛВАМЕ БЪЛГАРСКИ ИМЕНА
        dto.setCategoryBG(s.getCategory().getDisplayName());

        dto.setLatitude(s.getLatitude());
        dto.setLongitude(s.getLongitude());
        dto.setImageUrl(s.getImageUrl());

        if (s.getAuthor() != null) {
            dto.setAuthorId(s.getAuthor().getId());
            dto.setAuthorUsername(s.getAuthor().getUsername());
            dto.setAuthorImageUrl(s.getAuthor().getImageUrl());
        }

        dto.setViewsCount(s.getViewsCount());
        dto.setLikesCount(s.getLikesCount());
        dto.setReportsCount(s.getReportsCount());
        dto.setCommentsCount(s.getCommentsCount());
        dto.setCreated(s.getCreated());
        dto.setModified(s.getModified());

        return dto;
    }
}