package smolyanVote.smolyanVote.services.support;

/**
 * Google and Facebook return thumbnail-sized profile photos by default
 * (Google {@code =s96-c}, Facebook {@code type=large} ≈ 200²). Uploading those
 * into Cloudinary and then asking for a 512² crop only upscales blur.
 */
public final class OAuthAvatarUrls {

    /** Ask providers for more pixels than we typically display (retina-safe). */
    private static final int TARGET_PX = 512;

    private OAuthAvatarUrls() {
    }

    /** Rewrite a provider avatar URL so the downloaded bytes are high-resolution. */
    public static String upgrade(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return imageUrl;
        }
        String url = imageUrl.trim();
        String lower = url.toLowerCase();

        if (lower.contains("googleusercontent.com")) {
            return upgradeGoogle(url);
        }
        if (lower.contains("graph.facebook.com") && lower.contains("/picture")) {
            return upgradeFacebookGraph(url);
        }
        return url;
    }

    /**
     * Prefer a sized Graph redirect over the ephemeral CDN URL from
     * {@code picture.data.url}, which is often a small thumbnail.
     */
    public static String facebookGraphAvatar(String facebookUserId) {
        if (facebookUserId == null || facebookUserId.isBlank()) {
            return null;
        }
        return "https://graph.facebook.com/v18.0/" + facebookUserId.trim()
                + "/picture?width=" + TARGET_PX + "&height=" + TARGET_PX;
    }

    private static String upgradeGoogle(String url) {
        // Drop legacy sz= query params some clients append.
        String upgraded = url.replaceAll("([?&])sz=\\d+", "$1");
        upgraded = upgraded.replaceAll("\\?&", "?");
        upgraded = upgraded.replaceAll("\\?$", "");

        // ...=s96-c, =s96-c-rw, =s128  →  =s512-c
        if (upgraded.matches("(?i).*[=/]s\\d{2,4}(-[A-Za-z0-9]+)*.*")) {
            upgraded = upgraded.replaceAll("=s\\d{2,4}(-[A-Za-z0-9]+)*", "=s" + TARGET_PX + "-c");
            upgraded = upgraded.replaceAll("/s\\d{2,4}(-[A-Za-z0-9]+)*/", "/s" + TARGET_PX + "-c/");
            return upgraded;
        }
        // No size token — append one (Google accepts =sN-c on most photo URLs).
        if (upgraded.contains("=")) {
            return upgraded;
        }
        return upgraded + "=s" + TARGET_PX + "-c";
    }

    private static String upgradeFacebookGraph(String url) {
        int q = url.indexOf('?');
        String base = q >= 0 ? url.substring(0, q) : url;
        return base + "?width=" + TARGET_PX + "&height=" + TARGET_PX;
    }
}
