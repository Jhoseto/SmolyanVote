package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.security.core.Authentication;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationRequestDTO;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationResponseDTO;

public interface PublicationDetailService {

    /**
     * Get publication formatted for modal display
     */
    PublicationResponseDTO getPublicationForModal(Long publicationId, Authentication auth);

    /**
     * Public detail fetch for the Next.js JSON API ({@code GET /api/v1/publications/{id}}).
     * Unlike {@link #getPublicationForModal}, this does NOT require the caller to be
     * authenticated — anonymous visitors can view published posts; visibility of
     * drafts/pending posts is still enforced via {@code PublicationService#canViewPublication}.
     * Increments the view counter, same as the legacy modal fetch.
     *
     * @throws jakarta.persistence.EntityNotFoundException if no publication exists with this id
     * @throws org.springframework.security.access.AccessDeniedException if the caller may not view it
     */
    PublicationResponseDTO getPublicationDetail(Long publicationId, Authentication auth);

    /**
     * Build PublicationResponseDTO with user interactions
     */
    PublicationResponseDTO buildPublicationResponseDTO(PublicationEntity publication, Authentication auth);

    /**
     * Update a publication and return the shaped response — single transaction, author eagerly loaded.
     */
    PublicationResponseDTO updatePublication(Long id, PublicationRequestDTO request, Authentication auth);

    /**
     * Calculate and set author online status
     */
    void setAuthorOnlineStatus(PublicationResponseDTO dto);
}