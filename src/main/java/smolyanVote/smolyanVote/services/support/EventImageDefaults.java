package smolyanVote.smolyanVote.services.support;

/**
 * Static placeholder covers served from the frontend public folder when an event
 * has no uploaded images. Some create flows persist these paths as DB rows — they
 * must be dropped once real Cloudinary images are added.
 */
public final class EventImageDefaults {

    public static final String SIMPLE_EVENT = "/images/eventImages/defaultEvent.jpg";
    public static final String MULTI_POLL = "/images/eventImages/defaultMultiPoll.jpg";
    public static final String REFERENDUM = "/images/eventImages/defaultReferendum.jpg";

    private EventImageDefaults() {
    }

    public static boolean isPlaceholder(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        return url.equals(SIMPLE_EVENT) || url.equals(MULTI_POLL) || url.equals(REFERENDUM);
    }
}
