package smolyanVote.smolyanVote.services.support;

/**
 * Rules for when an OAuth provider profile photo should replace {@code users.image_url}.
 *
 * <p>Important: Cloudinary bakes eager upload transforms into the stored asset, so the
 * delivered URL usually has <em>no</em> {@code w_512,c_fill} tokens. Legacy OAuth mirrors
 * under {@code smolyanVote/users/…} are therefore indistinguishable from manual uploads by
 * URL alone — except manual uploads now live under {@code smolyanVote/profile/…}.
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

    /**
     * Avatar the user uploaded through the profile UI ({@code smolyanVote/profile/…}).
     * Only these are protected from OAuth overwrite.
     */
    public static boolean isUserUploadedAvatar(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return false;
        }
        return imageUrl.contains("/profile/") || imageUrl.contains("/smolyanVote/profile/");
    }

    /**
     * Current high-res OAuth mirror folder. Anything older (provider URL, {@code users/},
     * {@code oauth_v2/}/{@code oauth_v3/}) is eligible for a one-time refresh.
     */
    public static boolean isHighResOAuthMirror(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return false;
        }
        return imageUrl.contains("/oauth_v4/") || imageUrl.contains("/smolyanVote/oauth_v4/");
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
        // Explicit profile upload — never clobber.
        if (isUserUploadedAvatar(currentImageUrl)) {
            return false;
        }
        if (isMissingAvatar(currentImageUrl)) {
            return true;
        }
        // Already on the current high-res pipeline.
        if (isHighResOAuthMirror(currentImageUrl)) {
            return false;
        }
        // Provider URL, legacy users/ Cloudinary OAuth blur, or older oauth mirrors — refresh.
        return true;
    }
}
