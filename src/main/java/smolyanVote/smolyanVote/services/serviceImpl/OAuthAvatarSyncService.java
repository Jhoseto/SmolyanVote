package smolyanVote.smolyanVote.services.serviceImpl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;
import smolyanVote.smolyanVote.services.support.OAuthAvatarSync;

/**
 * Copies Google/Facebook profile photos into {@link UserEntity#getImageUrl()}.
 */
@Service
@Slf4j
public class OAuthAvatarSyncService {

    private final ImageCloudinaryService imageCloudinaryService;

    public OAuthAvatarSyncService(ImageCloudinaryService imageCloudinaryService) {
        this.imageCloudinaryService = imageCloudinaryService;
    }

    public void applyProviderAvatar(UserEntity user, String providerImageUrl) {
        if (!OAuthAvatarSync.shouldSyncFromProvider(user.getImageUrl(), providerImageUrl)) {
            return;
        }

        String resolved = providerImageUrl.trim();
        try {
            user.setImageUrl(imageCloudinaryService.saveUserImageFromUrl(resolved, user.getUsername()));
            log.info("OAuth avatar stored for user {}", user.getUsername());
        } catch (Exception ex) {
            log.warn("OAuth avatar Cloudinary upload failed for {} — using provider URL: {}",
                    user.getUsername(), ex.getMessage());
            user.setImageUrl(resolved);
        }
    }
}
