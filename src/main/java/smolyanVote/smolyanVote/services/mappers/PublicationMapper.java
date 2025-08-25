package smolyanVote.smolyanVote.services.mappers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.repositories.CommentsRepository;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationResponseDTO;

@Service
public class PublicationMapper {

    public static CommentsRepository commentsRepository;

    @Autowired
    public PublicationMapper(CommentsRepository commentsRepository) {
        PublicationMapper.commentsRepository = commentsRepository;
    }

    public static PublicationResponseDTO toDto(PublicationEntity publication) {
        if (publication == null) {
            return null;
        }

        PublicationResponseDTO dto = new PublicationResponseDTO();

        // Основни полета
        dto.setId(publication.getId());
        dto.setTitle(publication.getTitle());
        dto.setContent(publication.getContent());
        dto.setExcerpt(publication.getExcerpt());
        dto.setCategory(publication.getCategory());
        dto.setStatus(publication.getStatus());
        dto.setImageUrl(publication.getImageUrl());
        dto.setEmotion(publication.getEmotion());
        dto.setEmotionText(publication.getEmotionText());
        dto.setReadingTime(publication.getReadingTime());
        int commentsCount = Math.toIntExact(commentsRepository.countByPublicationId(publication.getId()));
        dto.setCommentsCount(commentsCount);

        // Дати
        dto.setCreatedAt(publication.getCreated());
        dto.setUpdatedAt(publication.getModified());
        dto.setPublishedAt(publication.getPublishedAt());

        // Статистики
        dto.setViewsCount(publication.getViewsCount());
        dto.setLikesCount(publication.getLikesCount());
        dto.setDislikesCount(publication.getDislikesCount());
        dto.setCommentsCount(publication.getCommentsCount());
        dto.setSharesCount(publication.getSharesCount());

        // Автор
        if (publication.getAuthor() != null) {
            dto.setAuthorId(publication.getAuthor().getId());
            dto.setAuthorUsername(publication.getAuthor().getUsername());
            dto.setAuthorImageUrl(publication.getAuthor().getImageUrl());
            dto.setAuthorOnlineStatus(publication.getAuthor().getOnlineStatus()); // ако имаш такова поле
            dto.setAuthorLastOnline(publication.getAuthor().getLastOnline());
        }

        // Линкове
        dto.setLinkUrl(publication.getLinkUrl());
        dto.setLinkMetadata(publication.getLinkMetadata());

        return dto;
    }
}
