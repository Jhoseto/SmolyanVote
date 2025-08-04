package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.repositories.PublicationRepository;
import smolyanVote.smolyanVote.services.interfaces.PublicationDetailService;
import smolyanVote.smolyanVote.services.interfaces.PublicationService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationResponseDTO;

import java.time.Duration;
import java.time.Instant;

@Service
@Transactional(readOnly = true)
public class PublicationDetailServiceImpl implements PublicationDetailService {

    private final PublicationService publicationService;
    private final UserService userService;
    private final PublicationRepository publicationRepository;

    @Autowired
    public PublicationDetailServiceImpl(PublicationService publicationService,
                                        UserService userService,
                                        PublicationRepository publicationRepository) {
        this.publicationService = publicationService;
        this.userService = userService;
        this.publicationRepository = publicationRepository;
    }

    @Override
    @Transactional
    @LogActivity(action = ActivityActionEnum.VIEW_PUBLICATION, entityType = EventType.PUBLICATION,
            entityIdParam = "publicationId", includeTitle = true, includeText = true)

    public PublicationResponseDTO getPublicationForModal(Long publicationId, Authentication auth) {
        // Get publication
        PublicationEntity publication = publicationService.findById(publicationId);
        if (publication == null) {
            throw new RuntimeException("Публикацията не е намерена");
        }

        // Check if user is authenticated
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Необходима е автентикация");
        }

        // Increment view count using entity method
        publication.incrementViews();
        publicationRepository.save(publication);

        // Build and return DTO
        return buildPublicationResponseDTO(publication, auth);
    }

    @Override
    public PublicationResponseDTO buildPublicationResponseDTO(PublicationEntity publication, Authentication auth) {
        // Create DTO using entity constructor
        PublicationResponseDTO dto = new PublicationResponseDTO(publication);

        // Set author online status
        setAuthorOnlineStatus(dto);

        // Set user interaction flags if authenticated
        if (auth != null && auth.isAuthenticated()) {
            try {
                UserEntity currentUser = userService.getCurrentUser();
                String username = currentUser.getUsername();

                // Use entity methods for checking interactions
                dto.setIsLiked(publication.isLikedBy(username));
                dto.setIsDisliked(publication.isDislikedBy(username));
                dto.setIsBookmarked(publication.isBookmarkedBy(username));
                dto.setIsOwner(publication.canBeEditedBy(currentUser));
            } catch (Exception e) {
                // Keep default false values
            }
        }

        return dto;
    }

    @Override
    public void setAuthorOnlineStatus(PublicationResponseDTO dto) {
        if (dto.getAuthorLastOnline() == null) {
            dto.setAuthorOnlineStatus(0); // Offline
            return;
        }

        try {
            Duration timeSinceLastOnline = Duration.between(dto.getAuthorLastOnline(), Instant.now());
            long minutesSinceLastOnline = timeSinceLastOnline.toMinutes();

            if (minutesSinceLastOnline <= 5) {
                dto.setAuthorOnlineStatus(1); // Online
            } else if (minutesSinceLastOnline <= 30) {
                dto.setAuthorOnlineStatus(2); // Away
            } else {
                dto.setAuthorOnlineStatus(0); // Offline
            }
        } catch (Exception e) {
            dto.setAuthorOnlineStatus(0); // Default to offline
        }
    }
}