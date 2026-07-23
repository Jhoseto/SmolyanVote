package smolyanVote.smolyanVote.services.support;

/**
 * Rules for when an OAuth provider profile photo should replace {@code users.image_url}.
 */
public final class OAuthAvatarSync {

    private OAuthAvatarSync() {
    }

    public static boolean isMissingAvatar(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return true;
        }
        String lower = imageUrl.toLowerCase();
        return lower.contains("default-avatar");
    }

    /** Avatar uploaded through SmolyanVote (Cloudinary) — do not overwrite on OAuth login. */
    public static boolean isUserUploadedAvatar(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return false;
        }
        return imageUrl.contains("cloudinary.com") || imageUrl.contains("/smolyanVote/users/");
    }

    public static boolean isProviderAvatar(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return false;
        }
        String lower = imageUrl.toLowerCase();
        return lower.contains("googleusercontent.com")
                || lower.contains("graph.facebook.com")
                || lower.contains("fbcdn.net")
                || lower.contains("platform-lookaside.fbsbx.com");
    }

    public static boolean shouldSyncFromProvider(String currentImageUrl, String providerImageUrl) {
        if (providerImageUrl == null || providerImageUrl.isBlank()) {
            return false;
        }
        if (isUserUploadedAvatar(currentImageUrl)) {
            return false;
        }
        if (isMissingAvatar(currentImageUrl)) {
            return true;
        }
        if (isProviderAvatar(currentImageUrl)) {
            return !currentImageUrl.trim().equals(providerImageUrl.trim());
        }
        return true;
    }
}
