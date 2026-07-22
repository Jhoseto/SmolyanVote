package smolyanVote.smolyanVote.viewsAndDTO;

/** Ephemeral site-wide toast pushed over `/ws/notifications` (not persisted). */
public record GlobalActivityToastDTO(
        String kind,
        String title,
        String message,
        String actionUrl,
        String icon
) {
    public static final String KIND = "GLOBAL_ACTIVITY";

    public static GlobalActivityToastDTO of(String title, String message, String actionUrl, String icon) {
        return new GlobalActivityToastDTO(KIND, title, message, actionUrl, icon);
    }
}
