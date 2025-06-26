package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.security.core.Authentication;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationResponseDTO;

public interface PublicationDetailService {

    /**
     * Get publication formatted for modal display
     */
    PublicationResponseDTO getPublicationForModal(Long publicationId, Authentication auth);

    /**
     * Build PublicationResponseDTO with user interactions
     */
    PublicationResponseDTO buildPublicationResponseDTO(PublicationEntity publication, Authentication auth);

    /**
     * Calculate and set author online status
     */
    void setAuthorOnlineStatus(PublicationResponseDTO dto);
}