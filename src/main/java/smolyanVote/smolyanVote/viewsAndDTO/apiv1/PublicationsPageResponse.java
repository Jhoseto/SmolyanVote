package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import org.springframework.data.domain.Page;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationResponseDTO;

import java.util.List;

/**
 * Paginated publications feed for the Next.js publications hub
 * (GET /api/v1/publications).
 */
public record PublicationsPageResponse(
        List<PublicationResponseDTO> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {

    public static PublicationsPageResponse from(Page<PublicationResponseDTO> page) {
        return new PublicationsPageResponse(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext(),
                page.hasPrevious()
        );
    }
}
